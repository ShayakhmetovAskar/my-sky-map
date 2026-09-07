"""Collections router — owner API for My Sky collections (APO-86) and sharing (APO-88).

See docs/my-sky-collections-sharing.md §3–5. Every endpoint is scoped to the
authenticated owner (`user_id` filter + 404), and any owner request extends
`expires_at` of the owner's guest collections.
"""

import logging
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import String, any_, bindparam, cast, delete, func, insert, or_, select, update
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..dependencies import get_current_user, get_db, get_is_guest
from ..models.db import Collection, CollectionItem, Task
from ..models.schemas import (
    MAX_COLLECTIONS_PER_USER,
    CollectionResponse,
    CreateCollectionRequest,
    ShareResponse,
    UpdateCollectionRequest,
)

logger = logging.getLogger(__name__)

# Guest-owned collections live `share + GUEST_SHARE_TTL`; the clock restarts on
# every authorized owner request to /me/collections (APO-88 sets it on share).
GUEST_SHARE_TTL = timedelta(days=30)

# 16 bytes -> 22 url-safe characters, the length `routers/public.py` validates against.
# 128 bits is the same class of unguessability as a presigned URL (design §5), so the
# partial unique index on `share_token` is a safety net, not a collision strategy.
SHARE_TOKEN_BYTES = 16


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
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    collection = await _get_owned_collection(db, collection_id, user_id)

    if body.title is not None:
        collection.title = body.title

    if body.items is not None:
        await _check_task_ids(db, body.items, user_id)
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

    # Re-read so `items` reflects the rows just written, in position order
    return (
        await db.execute(_owned_collection_query(collection_id, user_id).execution_options(populate_existing=True))
    ).scalar_one()


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    collection = await _get_owned_collection(db, collection_id, user_id)
    await db.delete(collection)  # collection_items go with it (ON DELETE CASCADE)
    await db.commit()


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


@router.delete("/{collection_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def unshare_collection(
    collection_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke the link. Idempotent — unsharing a private collection is a no-op 204.

    Dropping the token is what actually revokes access: `/public/sky/{token}` re-checks it
    on every request and the response is `no-store`, so the manifest dies immediately.

    `expires_at` is deliberately left in place. It is not a property of the link but the
    marker that this row belongs to a guest, and both `extend_guest_expiry` and the guest
    cleanup (APO-93) key off it.

    Tiles already downloaded by a viewer stay readable until the image secrets are rotated;
    that rotation (`rotate_image_secret` for images in no other shared collection) is APO-92
    and hooks in right here.
    """
    collection = await _get_owned_collection(db, collection_id, user_id)
    if collection.share_token is not None:
        collection.share_token = None
        collection.updated_at = datetime.now(timezone.utc)
        await db.commit()
