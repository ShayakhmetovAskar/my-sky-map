"""Submissions router — CRUD + confirm upload."""

import logging
from pathlib import PurePosixPath

logger = logging.getLogger(__name__)
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..dependencies import get_current_user, get_db, get_hips_storage, get_storage
from ..models.db import Submission
from ..models.schemas import (
    CreateSubmissionRequest,
    PaginatedSubmissions,
    SubmissionCreatedResponse,
    SubmissionDetailed,
    SubmissionSummary,
)
from ..services.hips_storage import HipsStorage
from ..services.image_tiles import purge_submission_objects, redact_secrets, tile_bases
from ..services.storage import StorageService

router = APIRouter(prefix="/submissions", tags=["Submissions"])

# Statuses in which the worker still owns the submission's objects and keeps writing them.
IN_FLIGHT_TASK_STATUSES = ("pending", "processing", "tiling")


@router.post("", status_code=status.HTTP_201_CREATED, response_model=SubmissionCreatedResponse)
async def create_submission(
    body: CreateSubmissionRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
):
    submission_id = uuid4()
    ext = PurePosixPath(body.filename).suffix
    object_key = f"users/{user_id}/submissions/{submission_id}/input/original{ext}"

    submission = Submission(
        id=submission_id,
        user_id=user_id,
        filename=body.filename,
        content_type=body.content_type.value,
        file_size_bytes=body.file_size_bytes,
        object_key=object_key,
        status="pending",
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    upload_url = storage.generate_presigned_upload_url(object_key, body.content_type.value)

    return SubmissionCreatedResponse(
        submission_id=submission.id,
        object_key=object_key,
        upload_url=upload_url,
    )


@router.get("", response_model=PaginatedSubmissions)
async def list_submissions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
):
    total_query = select(func.count()).select_from(Submission).where(Submission.user_id == user_id)
    total = (await db.execute(total_query)).scalar()

    items_query = (
        select(Submission)
        .where(Submission.user_id == user_id)
        .order_by(Submission.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = (await db.execute(items_query)).scalars().all()

    # Generate thumbnail presigned URLs (skip FITS — not displayable in browser)
    summaries = []
    for item in items:
        summary = SubmissionSummary.model_validate(item)
        if item.content_type != 'application/fits':
            try:
                summary.thumbnail_url = storage.generate_presigned_download_url(item.object_key)
            except Exception as e:
                logger.warning("Failed to generate thumbnail URL for %s: %s", item.id, e)
        summaries.append(summary)

    return PaginatedSubmissions(items=summaries, total=total)


@router.get("/{submission_id}", response_model=SubmissionDetailed)
async def get_submission(
    submission_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Submission)
        .options(selectinload(Submission.tasks))
        .where(Submission.id == submission_id, Submission.user_id == user_id)
    )
    submission = (await db.execute(query)).scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return submission


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission(
    submission_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
    hips_storage: HipsStorage = Depends(get_hips_storage),
):
    query = (
        select(Submission)
        .options(selectinload(Submission.tasks))
        .where(Submission.id == submission_id, Submission.user_id == user_id)
    )
    submission = (await db.execute(query)).scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    # Nothing may be deleted while the worker still holds the submission. A solve that
    # is running re-uploads `annotated.png`/`wcs.fits`/`mesh.json` into the private
    # prefix right after the purge emptied it, and a task in `tiling` goes on writing a
    # whole `img/{secret}/` pyramid into the *public* bucket — its final UPDATE then
    # matches no row, so the secret is never persisted and nothing can ever find those
    # tiles again. Refuse instead, before a single object is touched.
    if any(task.status in IN_FLIGHT_TASK_STATUSES for task in submission.tasks):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Submission is still being processed",
        )

    # Read what the purge needs, then end the read transaction: the round trips below
    # are one list + one delete per prefix and must not hold a pooled connection `idle
    # in transaction` (that blocks autovacuum on `tasks`). Plain strings survive it.
    bases = [base for task in submission.tasks for base in tile_bases(task.result)]
    await db.commit()

    # Objects first, synchronously, and only then the row (design §3): the row holds
    # the only pointer to the image's tile secret, and those tiles are readable by
    # anyone who has the link — committing first would leak them permanently.
    try:
        removed = await purge_submission_objects(
            user_id,
            submission_id,
            bases,
            storage=storage,
            hips_storage=hips_storage,
        )
    except Exception as e:
        logger.error("Purge of submission %s failed: %s", submission_id, redact_secrets(str(e)))
        # `from None`: the storage error quotes the object key, i.e. the tile secret —
        # it stays in the redacted log line above and out of any chained traceback.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage is unavailable, submission was not deleted",
        ) from None

    logger.info("Purged %s objects of submission %s", removed, submission_id)
    # A statement, not `db.delete(submission)`: the row was read in a transaction that
    # is now closed. `tasks` (and through them `collection_items`) go by ON DELETE CASCADE.
    await db.execute(
        delete(Submission).where(Submission.id == submission_id, Submission.user_id == user_id)
    )
    await db.commit()


@router.post("/{submission_id}/confirm", response_model=SubmissionSummary)
async def confirm_submission_upload(
    submission_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Submission).where(Submission.id == submission_id, Submission.user_id == user_id)
    submission = (await db.execute(query)).scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    if submission.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Submission is not in pending status")

    submission.status = "uploaded"
    await db.commit()
    await db.refresh(submission)
    return submission
