"""Tasks router — CRUD + cancel."""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_current_user, get_db, get_storage
from ..services.storage import StorageService

logger = logging.getLogger(__name__)
from ..models.db import Submission, Task
from ..models.schemas import (
    CreateTaskRequest,
    PaginatedTasks,
    TaskDetailed,
    TaskSummary,
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TaskSummary)
async def create_task(
    body: CreateTaskRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Submission).where(Submission.id == body.submission_id, Submission.user_id == user_id)
    submission = (await db.execute(query)).scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    if submission.status != "uploaded":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Submission is not in uploaded status")

    task = Task(
        submission_id=submission.id,
        user_id=user_id,
        status="pending",
        options=body.options.model_dump() if body.options else None,
    )
    db.add(task)
    submission.status = "processing"
    await db.commit()
    await db.refresh(task)

    # Worker will pick up the task via DB polling (see worker/main.py)
    return task


@router.get("", response_model=PaginatedTasks)
async def list_tasks(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    submission_id: Optional[UUID] = Query(None),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base = select(Task).where(Task.user_id == user_id)
    if submission_id:
        base = base.where(Task.submission_id == submission_id)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar()

    items_query = base.order_by(Task.created_at.desc()).offset(offset).limit(limit)
    items = (await db.execute(items_query)).scalars().all()

    return PaginatedTasks(items=items, total=total)


@router.get("/{task_id}", response_model=TaskDetailed)
async def get_task(
    task_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
):
    query = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = (await db.execute(query)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Build response with fresh presigned URLs (don't mutate ORM object)
    response = TaskDetailed.model_validate(task)

    if task.result:
        result = dict(task.result)
        key_to_url = {
            "original_image_key": "original_image_url",
            "annotated_image_key": "annotated_image_url",
            "mesh_json_key": "mesh_json_url",
            "wcs_key": "wcs_url",
        }
        for key_field, url_field in key_to_url.items():
            obj_key = result.get(key_field)
            if obj_key:
                try:
                    result[url_field] = storage.generate_presigned_download_url(obj_key)
                except Exception as e:
                    logger.warning("Failed to generate URL for %s: %s", obj_key, e)
        response.result = result

    return response


@router.post("/{task_id}/cancel", response_model=TaskSummary)
async def cancel_task(
    task_id: UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = (await db.execute(query)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.status not in ("pending", "processing"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task is already completed or failed")

    task.status = "cancelled"
    await db.commit()
    await db.refresh(task)

    return task
