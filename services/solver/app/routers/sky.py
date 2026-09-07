"""My Sky router — the user's solved images as a per-image HiPS layer manifest."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_current_user, get_db
from ..models.db import Submission, Task
from ..schemas.sky import LISTED_TASK_STATUSES, MySkyImage, MySkyResponse

router = APIRouter(prefix="/me", tags=["My Sky"])


@router.get("/sky", response_model=MySkyResponse)
async def get_my_sky(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All solved images of the current user, newest first.

    `ready` images carry tile metadata (`kmax`, `moc`, `base`, `thumb`), `tiling` ones
    only the calibration; images whose tiling failed are not listed.
    """
    query = (
        select(Task, Submission)
        .join(Submission, Submission.id == Task.submission_id)
        .where(Task.user_id == user_id, Task.status.in_(LISTED_TASK_STATUSES))
        .order_by(Task.created_at.desc())
    )
    rows = (await db.execute(query)).all()

    images = []
    for task, submission in rows:
        image = MySkyImage.from_task(task, date=submission.created_at.date(), filename=submission.filename)
        if image is not None:
            images.append(image)
    return MySkyResponse(images=images)
