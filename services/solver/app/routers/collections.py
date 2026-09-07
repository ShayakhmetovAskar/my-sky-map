"""Collections router — owner API for My Sky collections (APO-86), sharing (APO-88)
and secret rotation on revocation (APO-92).

See docs/my-sky-collections-sharing.md §3–5. Every endpoint is scoped to the
authenticated owner (`user_id` filter + 404), and any owner request extends
`expires_at` of the owner's guest collections.
"""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import String, any_, bindparam, cast, delete, func, insert, or_, select, update
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from ..dependencies import get_current_user, get_db, get_hips_storage, get_is_guest
from ..models.db import Collection, CollectionItem, Task
from ..models.schemas import (
    MAX_COLLECTIONS_PER_USER,
    CollectionResponse,
    CreateCollectionRequest,
    ShareResponse,
    UpdateCollectionRequest,
)
from ..services.hips_storage import HipsStorage
from ..services.image_tiles import rotate_image_secrets

logger = logging.getLogger(__name__)

# Guest-owned collections live `share + GUEST_SHARE_TTL`; the clock restarts on
# every authorized owner request to /me/collections (APO-88 sets it on share).
GUEST_SHARE_TTL = timedelta(days=30)

# 16 bytes -> 22 url-safe characters, the length `routers/public.py` validates against.
# 128 bits is the same class of unguessability as a presigned URL (design §5), so the
# partial unique index on `share_token` is a safety net, not a collision strategy.
SHARE_TOKEN_BYTES = 16


def _user_lock_key(user_id: str) -> int:
    """Stable signed 64-bit advisory-lock key for one user."""
    return int.from_bytes(hashlib.blake2b(user_id.encode(), digest_size=8).digest(),
                          "big", signed=True)


async def extend_guest_expiry(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Router-level dependency: push `expires_at` forward for the owner's guest collections."""
    result = await db.execute(
        update(Collection)
        .where(Collection.user_id == user_id, Collection.expires_at.isnot(None))
        .values(expires_at=datetime.now(timezone.utc) + GUEST_SHARE_TTL)
    )
    if result.rowcount:
        await db.commit()


router = APIRouter(
    prefix="/me/collections",
    tags=["Collections"],
    dependencies=[Depends(extend_guest_expiry)],
)


def _owned_collection_query(collection_id: UUID, user_id: str):
    return (
        select(Collection)
        .options(selectinload(Collection.items))
        .where(Collection.id == collection_id, Collection.user_id == user_id)
    )


async def _get_owned_collection(db: AsyncSession, collection_id: UUID, user_id: str) -> Collection:
    collection = (await db.execute(_owned_collection_query(collection_id, user_id))).scalar_one_or_none()
    if collection is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return collection


async def _check_task_ids(db: AsyncSession, task_ids: list[UUID], user_id: str) -> None:
    """One SELECT: every id must belong to the owner and be tiling or already have HiPS tiles.

    `tiling` is added to the `task_status` enum by APO-83; comparing through a text cast
    keeps the query valid both before and after that migration lands.
    """
    if not task_ids:
        return
    query = select(func.count(Task.id)).where(
        Task.id == any_(bindparam("ids", task_ids, type_=ARRAY(PG_UUID(as_uuid=True)))),
        Task.user_id == user_id,
        or_(
            cast(Task.status, String) == "tiling",
            cast(Task.result, JSONB).has_key("hips"),
        ),
    )
    found = (await db.execute(query)).scalar_one()
    if found != len(task_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more tasks not found")


@router.get("", response_model=list[CollectionResponse])
async def list_collections(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Collection)
        .options(selectinload(Collection.items))
        .where(Collection.user_id == user_id)
        .order_by(Collection.created_at.asc(), Collection.id.asc())
    )
    return (await db.execute(query)).scalars().all()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=CollectionResponse)
async def create_collection(
    body: CreateCollectionRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # The cap has to be arbitrated by the database, not by this process: two concurrent
    # POSTs would both read 49 and both insert. A transaction-scoped advisory lock on the
    # user serializes them — Postgres cannot do it with `FOR UPDATE`, since the row that
    # would have to be locked is the one not inserted yet. Released by the commit or the
    # rollback below, either way.
    await db.execute(select(func.pg_advisory_xact_lock(_user_lock_key(user_id))))

    count = (
        await db.execute(select(func.count(Collection.id)).where(Collection.user_id == user_id))
    ).scalar_one()
    if count >= MAX_COLLECTIONS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Collection limit reached ({MAX_COLLECTIONS_PER_USER})",
        )

    collection = Collection(user_id=user_id, title=body.title)
    db.add(collection)
    await db.commit()
    await db.refresh(collection, attribute_names=["items"])
    return collection


@router.patch("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: UUID,
    body: UpdateCollectionRequest,
    background: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    hips_storage: HipsStorage = Depends(get_hips_storage),
):
    """Rename a collection and/or replace its item list.

    Dropping an image from a *shared* collection is a revocation as much as
    `DELETE /share` is: the manifest stops listing it, but the `img/{secret}/…` tile
    URLs a viewer already holds keep resolving until the secret rotates. So the images
    this PATCH removed — and that no other shared collection still publishes — are
    rotated in the background, exactly as unsharing does (design §7).
    """
    collection = await _get_owned_collection(db, collection_id, user_id)
    was_shared = collection.share_token is not None
    removed: list[UUID] = []

    if body.title is not None:
        collection.title = body.title

    if body.items is not None:
        await _check_task_ids(db, body.items, user_id)
        if was_shared:
            # Read before the rows go: after the replace there is nothing left to diff.
            kept = set(body.items)
            removed = [item.task_id for item in collection.items if item.task_id not in kept]
        # Replace the whole list with Core statements: the ORM would emit INSERTs before
        # DELETEs within one flush and trip over the (collection_id, task_id) PK on reorder.
        await db.execute(delete(CollectionItem).where(CollectionItem.collection_id == collection.id))
        if body.items:
            await db.execute(
                insert(CollectionItem),
                [
                    {"collection_id": collection.id, "task_id": task_id, "position": position}
                    for position, task_id in enumerate(body.items)
                ],
            )

    if body.title is not None or body.items is not None:
        collection.updated_at = datetime.now(timezone.utc)
        await db.commit()

    # After the commit, like `unshare_collection`: "some other collection still shares
    # this image" is then read off committed state instead of being reconstructed.
    await _schedule_rotation(db, collection_id, user_id, removed, background, hips_storage)

    # Re-read so `items` reflects the rows just written, in position order
    return (
        await db.execute(_owned_collection_query(collection_id, user_id).execution_options(populate_existing=True))
    ).scalar_one()


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: UUID,
    background: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    hips_storage: HipsStorage = Depends(get_hips_storage),
):
    """Delete a collection. Deleting a shared one revokes its link — and its tile URLs.

    From the owner's side this and `DELETE /share` are the same act, so they must have
    the same consequence: the manifest dies with the row, but a tile URL taken from it
    needs no auth and the public bucket has no expiry, so it would serve the whole
    pyramid forever unless the image is re-addressed under a fresh secret (design §5).
    Images another shared collection still publishes are left alone.
    """
    collection = await _get_owned_collection(db, collection_id, user_id)
    # Computed while the rows are still there; `_shared_by_another_collection` already
    # excludes this collection, so deleting it cannot change the answer.
    to_revoke = (
        await _images_to_revoke(db, collection_id, user_id)
        if collection.share_token is not None else []
    )

    await db.delete(collection)  # collection_items go with it (ON DELETE CASCADE)
    await db.commit()

    if to_revoke:
        background.add_task(rotate_image_secrets, to_revoke, hips_storage=hips_storage)


# --- Sharing (APO-88, design §4–5) ---

@router.post("/{collection_id}/share", response_model=ShareResponse)
async def share_collection(
    collection_id: UUID,
    user_id: str = Depends(get_current_user),
    is_guest: bool = Depends(get_is_guest),
    db: AsyncSession = Depends(get_db),
):
    """Publish a collection under a capability URL. Idempotent: an existing token is returned.

    Re-issuing on every call would silently break links the owner has already sent, so
    "reset the link" is DELETE + POST (design §4), not a second POST.
    """
    collection = await _get_owned_collection(db, collection_id, user_id)

    changed = False
    if collection.share_token is None:
        collection.share_token = secrets.token_urlsafe(SHARE_TOKEN_BYTES)
        changed = True

    if is_guest:
        # A guest session is owned by a refresh token in localStorage: clearing the
        # browser strands the collection, so a guest's share has to expire on its own.
        # Owner activity restarts the clock via `extend_guest_expiry`.
        collection.expires_at = datetime.now(timezone.utc) + GUEST_SHARE_TTL
        changed = True

    # Re-sharing an already shared collection is a read: don't bump `updated_at` for it.
    if changed:
        collection.updated_at = datetime.now(timezone.utc)
        await db.commit()

    return ShareResponse(token=collection.share_token)


def _shared_by_another_collection(collection_id: UUID):
    """Correlated EXISTS: some *other* collection still publishes this `Task`.

    Any collection, not just this owner's — the condition that matters is whether a live
    link somewhere still hands this image out, and only the API enforces that items are
    the owner's own.

    A guest collection whose `expires_at` has passed counts as shared even though
    `/public/sky` 404s for it: `extend_guest_expiry` revives it on the owner's next
    request, so the owner still considers that link live.
    """
    other_item = aliased(CollectionItem)
    return (
        select(1)
        .select_from(other_item)
        .join(Collection, Collection.id == other_item.collection_id)
        .where(
            other_item.task_id == Task.id,
            Collection.id != collection_id,
            Collection.share_token.isnot(None),
        )
        .exists()
    )


async def _images_to_revoke(
    db: AsyncSession,
    collection_id: UUID,
    user_id: str,
    task_ids: Optional[Sequence[UUID]] = None,
) -> list[UUID]:
    """Tiled images that no *other* shared collection exposes.

    Without `task_ids`, every image this collection carries — the whole link is going
    away (`DELETE /share`, `DELETE /{id}`).  With `task_ids`, only those, looked up
    directly rather than through `collection_items`: `PATCH {items: [...]}` has already
    replaced the item rows by the time this runs, so the join would find nothing.

    Only tasks that actually carry `result.hips` are returned: rotation of an untiled
    image is a no-op, and this keeps a 200-image collection from queueing 200 sessions
    that each find nothing to do.
    """
    if task_ids is not None and not task_ids:
        return []
    query = select(Task.id).where(
        # Ownership is re-stated here as it is in `/public/sky`: a stray item must not
        # let one user rotate — i.e. break the live tile URLs of — another user's image.
        Task.user_id == user_id,
        cast(Task.result, JSONB).has_key("hips"),
        ~_shared_by_another_collection(collection_id),
    )
    if task_ids is None:
        query = query.join(CollectionItem, CollectionItem.task_id == Task.id).where(
            CollectionItem.collection_id == collection_id
        )
    else:
        query = query.where(Task.id.in_(list(task_ids)))
    return list((await db.execute(query)).scalars().all())


async def _schedule_rotation(
    db: AsyncSession,
    collection_id: UUID,
    user_id: str,
    task_ids: Sequence[UUID],
    background: BackgroundTasks,
    hips_storage: HipsStorage,
) -> None:
    """Queue a secret rotation for the images `task_ids` just stopped being shared."""
    if not task_ids:
        return
    to_revoke = await _images_to_revoke(db, collection_id, user_id, task_ids=task_ids)
    if to_revoke:
        background.add_task(rotate_image_secrets, to_revoke, hips_storage=hips_storage)


@router.delete("/{collection_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def unshare_collection(
    collection_id: UUID,
    background: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    hips_storage: HipsStorage = Depends(get_hips_storage),
):
    """Revoke the link. Idempotent — unsharing a private collection is a no-op 204.

    Dropping the token is what actually revokes access: `/public/sky/{token}` re-checks it
    on every request and the response is `no-store`, so the manifest dies immediately.

    `expires_at` is deliberately left in place. It is not a property of the link but the
    marker that this row belongs to a guest, and both `extend_guest_expiry` and the guest
    cleanup (APO-93) key off it.

    Tile URLs handed out under the revoked link outlive the manifest, so the secrets of
    the images this collection was the last to publish are rotated in `BackgroundTasks`
    (APO-92, design §5) — a prefix copy, not a re-cut, so the old URLs die within minutes
    while `/me/sky` and every other collection serve the new `base`. Images still carried
    by another shared collection are left alone: rotating those would break tile URLs a
    viewer of a link that is still live is using right now.

    Tiles a viewer already downloaded stay in their browser cache; accepted (design §5).
    """
    collection = await _get_owned_collection(db, collection_id, user_id)
    if collection.share_token is None:
        return  # never published, or already revoked — nothing to revoke, nothing to rotate

    collection.share_token = None
    collection.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # After the commit on purpose: this collection now has no token, so "some other
    # collection still shares it" is read off committed state rather than reconstructed.
    task_ids = await _images_to_revoke(db, collection_id, user_id)
    if task_ids:
        background.add_task(rotate_image_secrets, task_ids, hips_storage=hips_storage)
