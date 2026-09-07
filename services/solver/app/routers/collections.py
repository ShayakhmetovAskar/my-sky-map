"""Collections router — owner API for My Sky collections (APO-86).

See docs/my-sky-collections-sharing.md §3–4. Every endpoint is scoped to the
authenticated owner (`user_id` filter + 404), and any owner request extends
`expires_at` of the owner's guest collections.
"""

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import String, any_, bindparam, cast, delete, func, insert, or_, select, update
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..dependencies import get_current_user, get_db
from ..models.db import Collection, CollectionItem, Task
from ..models.schemas import (
    MAX_COLLECTIONS_PER_USER,
    CollectionResponse,
    CreateCollectionRequest,
    UpdateCollectionRequest,
)

logger = logging.getLogger(__name__)

# Guest-owned collections live `share + GUEST_SHARE_TTL`; the clock restarts on
# every authorized owner request to /me/collections (APO-88 sets it on share).
GUEST_SHARE_TTL = timedelta(days=30)


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
