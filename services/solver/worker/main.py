"""Solver worker — polls DB for pending tasks and processes them."""

import asyncio
import logging
import signal
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.db import Submission, Task
from worker.pipeline import process

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("worker")

POLL_INTERVAL = 1  # seconds

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

_shutdown = False


def handle_signal(sig, frame):
    global _shutdown
    logger.info("Received %s, shutting down gracefully...", signal.Signals(sig).name)
    _shutdown = True


async def poll_and_process():
    """Pick one pending task, process it, update status."""
    async with async_session() as db:
        # SELECT ... FOR UPDATE SKIP LOCKED — safe for multiple workers
        result = await db.execute(
            select(Task, Submission.object_key)
            .join(Submission, Task.submission_id == Submission.id)
            .where(Task.status == "pending")
            .order_by(Task.created_at)
            .with_for_update(of=Task, skip_locked=True)
            .limit(1)
        )
        row = result.first()

        if row is None:
            return False

        task, object_key = row
        logger.info("Picked up task %s (submission %s)", task.id, task.submission_id)

        # Mark as processing
        task.status = "processing"
        await db.commit()

    # Process outside the DB session (long-running)
    try:
        task_result = await process(
            task_id=task.id,
            object_key=object_key,
            options=task.options,
        )

        # Update as completed
        async with async_session() as db:
            await db.execute(
                update(Task)
                .where(Task.id == task.id)
                .values(
                    status="completed",
                    result=task_result,
                    completed_at=datetime.now(timezone.utc),
                )
            )
            await db.commit()
        logger.info("Task %s completed", task.id)

    except Exception as e:
        logger.error("Task %s failed: %s", task.id, e)
        async with async_session() as db:
            await db.execute(
                update(Task)
                .where(Task.id == task.id)
                .values(
                    status="failed",
                    error_code="processing_error",
                    error_message=str(e),
                )
            )
            await db.commit()

    return True


async def main():
    logger.info("Worker started, polling every %ss", POLL_INTERVAL)

    while not _shutdown:
        try:
            had_work = await poll_and_process()
            if not had_work:
                await asyncio.sleep(POLL_INTERVAL)
        except Exception as e:
            logger.error("Poll error: %s", e)
            await asyncio.sleep(POLL_INTERVAL * 5)

    logger.info("Worker stopped")
    await engine.dispose()


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)
    asyncio.run(main())
