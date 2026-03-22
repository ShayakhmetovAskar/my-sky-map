"""Solver worker — polls DB for pending tasks and processes them."""

import asyncio
import logging
import signal
from datetime import datetime, timezone

from sqlalchemy import func, select, update
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
MAX_CONCURRENT = 3  # max parallel tasks

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

_shutdown = False
_semaphore = asyncio.Semaphore(MAX_CONCURRENT)
_active_tasks: set[asyncio.Task] = set()


def handle_signal(sig, frame):
    global _shutdown
    logger.info("Received %s, shutting down gracefully...", signal.Signals(sig).name)
    _shutdown = True


async def pick_task():
    """Pick one pending task from DB. Returns (task, object_key) or None."""
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
            return None

        task, object_key = row
        logger.info("Picked up task %s (submission %s)", task.id, task.submission_id)

        # Mark as processing
        task.status = "processing"
        await db.commit()

    return task, object_key


async def process_task(task, object_key):
    """Process a single task (long-running, guarded by semaphore)."""
    async with _semaphore:
        try:
            task_result = await process(
                task_id=task.id,
                object_key=object_key,
                options=task.options,
            )

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
            await _update_submission_status(task.submission_id, "completed")

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
            await _update_submission_status(task.submission_id, "failed")


async def _update_submission_status(submission_id, status: str) -> None:
    """Update submission status based on task result."""
    async with async_session() as db:
        await db.execute(
            update(Submission)
            .where(Submission.id == submission_id)
            .values(status=status)
        )
        await db.commit()
    logger.info("Submission %s → %s", submission_id, status)


async def main():
    logger.info("Worker started, polling every %ss (max %s concurrent)", POLL_INTERVAL, MAX_CONCURRENT)

    while not _shutdown:
        try:
            picked = await pick_task()
            if picked is None:
                await asyncio.sleep(POLL_INTERVAL)
                continue

            task, object_key = picked
            bg = asyncio.create_task(process_task(task, object_key))
            _active_tasks.add(bg)
            bg.add_done_callback(_active_tasks.discard)

        except Exception as e:
            logger.error("Poll error: %s", e)
            await asyncio.sleep(POLL_INTERVAL * 5)

    # Graceful shutdown: wait for in-flight tasks
    if _active_tasks:
        logger.info("Waiting for %d active tasks to finish...", len(_active_tasks))
        await asyncio.gather(*_active_tasks, return_exceptions=True)

    logger.info("Worker stopped")
    await engine.dispose()


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)
    asyncio.run(main())
