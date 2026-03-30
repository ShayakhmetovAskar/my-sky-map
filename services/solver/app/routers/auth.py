"""Auth router — merge anonymous data into authenticated account."""

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel, field_validator
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_current_user, get_db
from ..models.db import Submission, Task

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])


class MergeRequest(BaseModel):
    anonymous_id: str

    @field_validator("anonymous_id")
    @classmethod
    def validate_uuid(cls, v):
        import re
        if not re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", v, re.I):
            raise ValueError("anonymous_id must be a valid UUID")
        return v


@router.post("/merge")
async def merge_anonymous(
    body: MergeRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Transfer all submissions/tasks from anonymous identity to authenticated user.

    Note: S3 object_key paths (users/anon_xxx/...) are NOT renamed — they remain
    valid because we reference files by object_key, not by user_id. Physical S3
    cleanup/migration is a separate concern.
    """
    anon_id = f"anon_{body.anonymous_id}"

    # Check if anon identity has any data (also serves as idempotency check)
    result_sub = await db.execute(
        update(Submission)
        .where(Submission.user_id == anon_id)
        .values(user_id=user_id)
    )
    result_task = await db.execute(
        update(Task)
        .where(Task.user_id == anon_id)
        .values(user_id=user_id)
    )
    await db.commit()

    merged = result_sub.rowcount + result_task.rowcount
    logger.info("Merged %d records from %s → %s", merged, anon_id, user_id)

    return {"merged": merged}
