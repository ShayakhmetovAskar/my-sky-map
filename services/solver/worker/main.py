"""Solver worker — polls DB for pending tasks and processes them."""

import asyncio
import logging
import signal
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.db import AstrometryApiKey, Submission, Task
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

_shutdown_event = asyncio.Event()
_semaphore = asyncio.Semaphore(MAX_CONCURRENT)
_active_tasks: set[asyncio.Task] = set()


def handle_signal(sig, frame):
    logger.info("Received %s, shutting down gracefully...", signal.Signals(sig).name)
    _shutdown_event.set()


async def pick_task():
    """Pick one pending task from DB, resolve the owner's api key, and
    return plain values (not ORM objects) to avoid detached session issues.

    Returns (task_id, user_id, submission_id, object_key, options, api_key) or None.
    `options` are the task's stored hints (focal_length, pixel_size, ...);
    `api_key` is fetched from astrometry_api_keys — it is never persisted
    on the task itself.
    """
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

        api_key_row = await db.get(AstrometryApiKey, task.user_id)
        api_key = api_key_row.api_key if api_key_row else None

        # Mark as processing
        task.status = "processing"
        await db.commit()

    return task.id, task.user_id, task.submission_id, object_key, task.options, api_key


async def process_task(task_id, user_id, submission_id, object_key, options, api_key):
    """Process a single task (long-running). Semaphore acquired before calling.

    `api_key` is passed in-memory only — the solver pipeline never writes
    it back to the DB, so it cannot leak into `task.options` or task results.
    """
    if not api_key:
        # Owner deleted their api key between task creation and pickup.
        async with async_session() as db:
            await db.execute(
                update(Task)
                .where(Task.id == task_id)
                .values(
                    status="failed",
                    error_code="missing_api_key",
                    error_message="User has no stored astrometry.net API key at pickup time.",
                )
            )
            await db.commit()
        logger.error("Task %s failed: user %s has no stored api_key", task_id, user_id)
        await _update_submission_status(submission_id, "failed")
        _semaphore.release()
        return

    pipeline_options = dict(options or {})
    pipeline_options["astrometry_api_key"] = api_key

    try:
        task_result = await process(
            task_id=task_id,
            object_key=object_key,
            options=pipeline_options,
        )

        async with async_session() as db:
            await db.execute(
                update(Task)
                .where(Task.id == task_id)
                .values(
                    status="completed",
                    result=task_result,
                    completed_at=datetime.now(timezone.utc),
                )
            )
            await db.commit()
        logger.info("Task %s completed", task_id)
        await _update_submission_status(submission_id, "completed")

    except Exception as e:
        logger.error("Task %s failed: %s", task_id, e)
        async with async_session() as db:
            await db.execute(
                update(Task)
                .where(Task.id == task_id)
                .values(
                    status="failed",
                    error_code="processing_error",
                    error_message=str(e),
                )
            )
            await db.commit()
        await _update_submission_status(submission_id, "failed")
    finally:
        _semaphore.release()


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

    while not _shutdown_event.is_set():
        try:
            # Backpressure: wait for available slot BEFORE picking task
            await _semaphore.acquire()

            picked = await pick_task()
            if picked is None:
                _semaphore.release()
                await asyncio.sleep(POLL_INTERVAL)
                continue

            task_id, user_id, submission_id, object_key, options, api_key = picked
            bg = asyncio.create_task(
                process_task(task_id, user_id, submission_id, object_key, options, api_key)
            )
            _active_tasks.add(bg)
            bg.add_done_callback(_active_tasks.discard)

        except Exception as e:
            _semaphore.release()
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
