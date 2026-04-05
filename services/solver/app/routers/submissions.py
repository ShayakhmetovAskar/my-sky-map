"""Submissions router — CRUD + confirm upload."""

import logging
from pathlib import PurePosixPath

logger = logging.getLogger(__name__)
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..dependencies import get_user_id, get_db, get_storage
from ..models.db import Submission
from ..models.schemas import (
    CreateSubmissionRequest,
    PaginatedSubmissions,
    SubmissionCreatedResponse,
    SubmissionDetailed,
    SubmissionSummary,
)
from ..services.storage import StorageService

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=SubmissionCreatedResponse)
async def create_submission(
    body: CreateSubmissionRequest,
    user_id: str = Depends(get_user_id),
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
    user_id: str = Depends(get_user_id),
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
    user_id: str = Depends(get_user_id),
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
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
):
    query = select(Submission).where(Submission.id == submission_id, Submission.user_id == user_id)
    submission = (await db.execute(query)).scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    storage.delete_object(submission.object_key)
    await db.delete(submission)
    await db.commit()


@router.post("/{submission_id}/confirm", response_model=SubmissionSummary)
async def confirm_submission_upload(
    submission_id: UUID,
    user_id: str = Depends(get_user_id),
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
