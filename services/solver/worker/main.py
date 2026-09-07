"""Solver worker — polls DB for pending tasks and processes them."""

import asyncio
import contextlib
import json
import logging
import signal
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional, Sequence, Tuple

from sqlalchemy import Text, cast, func, literal, select, update
from sqlalchemy.dialects.postgresql import JSON, JSONB
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.db import Submission, Task
from app.services.hips_storage import HipsStorage
from app.services.image_tiles import hips_pending_base, redact_secrets, tile_bases, tile_prefix
from worker.pipeline import process

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("worker")

POLL_INTERVAL = 1  # seconds
MAX_CONCURRENT = 3  # max parallel tasks (a task holds its slot through solve AND tiling)
HEARTBEAT_INTERVAL = 60  # seconds between `updated_at` touches of a running task
# Tasks stuck in `processing`/`tiling` for longer are considered crashed. Safe only
# because `_heartbeat` keeps `updated_at` meaning "alive" rather than "last state change":
# an astrometry.net online solve routinely queues past 15 minutes without being a zombie.
ZOMBIE_TIMEOUT = timedelta(minutes=15)

# The statuses a task the worker still owns can be in.
LIVE_STATUSES = ("processing", "tiling")

_ZOMBIE_TILING_ERROR = "Worker crashed while building the sky layer."
_ZOMBIE_SOLVE_ERROR = "Worker crashed before the task could complete. Please retry."

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

_shutdown_event = asyncio.Event()
_semaphore = asyncio.Semaphore(MAX_CONCURRENT)
_active_tasks: set[asyncio.Task] = set()

# Lazy: only the cleanup paths below ever reach for the public bucket.
_hips_storage: Optional[HipsStorage] = None


class TaskGone(Exception):
    """The task row was deleted or cancelled while the worker was working on it.

    Raised by the writes that expect to find it, so the pipeline stops rather than
    keep uploading into prefixes a finished deletion has already swept. Carries the
    result it was about to store, which is where the tile prefix to clean up lives.
    """

    def __init__(self, message: str, result: Optional[dict] = None):
        super().__init__(message)
        self.result = result


def get_hips_storage() -> HipsStorage:
    """Public tile bucket, built on first use (its credentials are an optional Secret)."""
    global _hips_storage
    if _hips_storage is None:
        _hips_storage = HipsStorage()
    return _hips_storage


def handle_signal(sig, frame):
    logger.info("Received %s, shutting down gracefully...", signal.Signals(sig).name)
    _shutdown_event.set()


async def pick_task():
    """Pick one pending task from DB. Returns (task_id, submission_id, object_key, options) or None.

    Returns plain values (not ORM objects) to avoid detached session issues.
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

        # Mark as processing
        task.status = "processing"
        await db.commit()

    return task.id, task.submission_id, object_key, task.options


async def process_task(task_id, submission_id, object_key, options):
    """Process a single task (long-running). Semaphore acquired before calling.

    Status flow: processing → tiling (solve result already stored) → completed.
    A tiling failure still ends in `completed` with `result.hips_error` set.

    Every write back to the row is conditional on the row still being the worker's:
    the user may delete the submission or erase their account mid-flight, and an
    unconditional write would either resurrect state or, worse, let the tiler go on
    filling a public prefix that no surviving row names (`TaskGone`).
    """

    async def on_solved(solve_result: dict) -> None:
        await _mark_tiling(task_id, submission_id, solve_result)

    beat = asyncio.create_task(_heartbeat(task_id))
    try:
        task_result = await process(
            task_id=task_id,
            object_key=object_key,
            options=options,
            on_solved=on_solved,
        )

        await _finish_task(task_id, task_result)
        logger.info("Task %s completed", task_id)
        await _update_submission_status(submission_id, "completed")

    except TaskGone as e:
        # Nothing to report — the row that would carry the report is gone. What is left
        # is the objects: the tile prefix in particular, which the purge could not see
        # if the secret had not reached the database yet.
        logger.warning("Task %s vanished mid-flight (%s); dropping what it uploaded", task_id, e)
        await _discard_orphaned_tiles(e.result)

    except Exception as e:
        logger.error("Task %s failed: %s", task_id, e)
        async with async_session() as db:
            await db.execute(
                update(Task)
                .where(Task.id == task_id, Task.status.in_(LIVE_STATUSES))
                .values(
                    status="failed",
                    error_code="processing_error",
                    # the message reaches the user; a tiling failure can quote an
                    # object key, and that key carries the image secret
                    error_message=redact_secrets(str(e)),
                )
            )
            await db.commit()
        await _update_submission_status(submission_id, "failed")
    finally:
        beat.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await beat
        _semaphore.release()


async def _heartbeat(task_id) -> None:
    """Touch `updated_at` while the task runs, so it reads as liveness.

    Without this the column only records the last *state change*, and a 15-minute
    zombie cutoff is really a bet on how long a solve takes — astrometry.net queues
    past that often enough that healthy tasks would be failed out from under a live
    worker. Cancelled by `process_task`; a failed beat is logged, never fatal.
    """
    while True:
        await asyncio.sleep(HEARTBEAT_INTERVAL)
        try:
            async with async_session() as db:
                await db.execute(
                    update(Task)
                    .where(Task.id == task_id, Task.status.in_(LIVE_STATUSES))
                    .values(updated_at=datetime.now(timezone.utc))
                    .execution_options(synchronize_session=False)
                )
                await db.commit()
        except Exception as e:                       # noqa: BLE001 — a missed beat is not fatal
            logger.warning("Heartbeat of task %s failed: %s", task_id, e)


async def _finish_task(task_id, task_result: dict) -> None:
    """Store the final result. Raises `TaskGone` when the row is no longer the worker's."""
    async with async_session() as db:
        outcome = await db.execute(
            update(Task)
            .where(Task.id == task_id, Task.status.in_(LIVE_STATUSES))
            .values(
                status="completed",
                result=task_result,
                completed_at=datetime.now(timezone.utc),
            )
            .execution_options(synchronize_session=False)
        )
        await db.commit()
    if outcome.rowcount == 0:
        raise TaskGone("the row was deleted or cancelled while it was being processed",
                       task_result)


async def _mark_tiling(task_id, submission_id, solve_result: dict) -> None:
    """Solve is done: publish its result and move task + submission to `tiling`.

    The submissions list shows the submission status, so both rows are updated.
    `solve_result` carries `hips_pending`, the public prefix the tiler is about to
    write into — committing it here is what makes a mid-tiling delete able to find
    those tiles. Raises `TaskGone` if the row went away during the solve, so tiling
    never starts on a submission that is already deleted.
    """
    async with async_session() as db:
        outcome = await db.execute(
            update(Task)
            .where(Task.id == task_id, Task.status == "processing")
            .values(status="tiling", result=solve_result)
            .execution_options(synchronize_session=False)
        )
        await db.commit()
    if outcome.rowcount == 0:
        raise TaskGone("the row was deleted or cancelled during the solve")
    logger.info("Task %s → tiling", task_id)
    await _update_submission_status(submission_id, "tiling")


async def _discard_orphaned_tiles(result: Optional[dict]) -> None:
    """Best-effort removal of the objects of a task whose row is gone.

    The row was the only thing that could ever name these prefixes; with it deleted,
    no purge, no `/me/sky` and no operator can reach them. Failures are logged
    redacted — a storage error quotes the key, i.e. the capability secret itself.
    """
    for base in tile_bases(result):
        prefix = tile_prefix(base)
        if not prefix:
            continue
        try:
            removed = await asyncio.to_thread(get_hips_storage().delete_prefix, prefix)
            logger.info("Discarded %d orphaned tiles", removed)
        except Exception as e:                       # noqa: BLE001 — best effort by design
            logger.warning("Could not drop an orphaned tile prefix: %s", redact_secrets(str(e)))


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


def _with_hips_error() -> Any:
    """SQL for ``result || {"hips_error": ...}``, evaluated by Postgres.

    ``tasks.result`` is ``json``, which has no merge operator, so the value round-trips
    through ``jsonb``. Doing the merge in SQL is what lets recovery be one conditional
    statement rather than a read, a decision in Python, and a write that races it.
    """
    patch = cast(literal(json.dumps({"hips_error": _ZOMBIE_TILING_ERROR})), JSONB)
    current = func.coalesce(cast(Task.result, JSONB), cast(literal("{}"), JSONB))
    return cast(current.op("||", return_type=JSONB)(patch), JSON)


def _without_hips_pending() -> Any:
    """SQL for ``result - 'hips_pending'`` — the pointer is dropped once the tiles are."""
    stripped = cast(Task.result, JSONB).op("-", return_type=JSONB)(cast(literal("hips_pending"), Text))
    return cast(stripped, JSON)


async def _recover_zombie_tasks(hips_storage: Optional[HipsStorage] = None) -> None:
    """Rescue tasks stuck in `processing` or `tiling` past the timeout.

    Catches the case where a worker crashed (OOM, SIGKILL, k8s evict) after
    `pick_task` flipped the row but before `process_task` could write a final
    status. Without this those tasks would spin forever in the UI.

    - `processing` zombies → `failed` (`worker_crash`): the solve never finished.
    - `tiling` zombies → `completed` + `result.hips_error`: the solve result was
      already stored when tiling started, only the sky layer is missing.

    Runs once at worker startup, which is exactly when another pod may still be
    draining its in-flight tasks, so nothing here may be a read-then-write: each
    outcome is a single conditional `UPDATE ... RETURNING`, and the submissions are
    updated from the rows it actually claimed, inside the same transaction. A live
    worker that finishes between the two would otherwise leave `tasks.completed`
    beside `submissions.failed` — and the submission list is what the UI renders.

    The 15-minute window means "no heartbeat for 15 minutes" (see `_heartbeat`), not
    "started 15 minutes ago", so a slow astrometry.net queue is not a zombie.
    """
    cutoff = datetime.now(timezone.utc) - ZOMBIE_TIMEOUT
    now = datetime.now(timezone.utc)

    async with async_session() as db:
        tiling: Sequence[Tuple] = (await db.execute(
            update(Task)
            .where(Task.status == "tiling", Task.updated_at < cutoff)
            .values(status="completed", completed_at=now, result=_with_hips_error())
            .returning(Task.id, Task.submission_id, Task.result)
            .execution_options(synchronize_session=False)
        )).all()

        processing: Sequence[Tuple] = (await db.execute(
            update(Task)
            .where(Task.status == "processing", Task.updated_at < cutoff)
            .values(status="failed", error_code="worker_crash", error_message=_ZOMBIE_SOLVE_ERROR)
            .returning(Task.id, Task.submission_id)
            .execution_options(synchronize_session=False)
        )).all()

        if not tiling and not processing:
            return

        for row in tiling:
            await db.execute(
                update(Submission).where(Submission.id == row[1]).values(status="completed")
            )
        for row in processing:
            await db.execute(
                update(Submission).where(Submission.id == row[1]).values(status="failed")
            )
        await db.commit()

    logger.warning("Recovered %d zombie tasks", len(tiling) + len(processing))
    await _discard_pending_tiles([(row[0], row[2]) for row in tiling], hips_storage)


async def _discard_pending_tiles(recovered: List[Tuple], hips_storage: Optional[HipsStorage]) -> None:
    """Drop the half-written pyramid of every recovered `tiling` task, then forget it.

    `result.hips_pending` is the only record of where those tiles went, so the prefix
    is deleted first and the pointer dropped only if that succeeded: a bucket that is
    down leaves the pointer in place for the next run instead of orphaning the objects.
    """
    cleaned = []
    for task_id, result in recovered:
        prefix = tile_prefix(hips_pending_base(result))
        if not prefix:
            continue
        try:
            storage = hips_storage or get_hips_storage()
            removed = await asyncio.to_thread(storage.delete_prefix, prefix)
            logger.info("Discarded %d tiles left behind by the crash of task %s", removed, task_id)
            cleaned.append(task_id)
        except Exception as e:                       # noqa: BLE001 — retried on the next start
            logger.warning("Could not drop the half-written sky layer of task %s: %s",
                           task_id, redact_secrets(str(e)))

    if not cleaned:
        return
    async with async_session() as db:
        await db.execute(
            update(Task)
            .where(Task.id.in_(cleaned))
            .values(result=_without_hips_pending())
            .execution_options(synchronize_session=False)
        )
        await db.commit()


async def main():
    logger.info("Worker started, polling every %ss (max %s concurrent)", POLL_INTERVAL, MAX_CONCURRENT)

    try:
        await _recover_zombie_tasks()
    except Exception as e:
        logger.error("Zombie task recovery failed: %s", e)

    while not _shutdown_event.is_set():
        try:
            # Backpressure: wait for available slot BEFORE picking task
            await _semaphore.acquire()

            picked = await pick_task()
            if picked is None:
                _semaphore.release()
                await asyncio.sleep(POLL_INTERVAL)
                continue

            task_id, submission_id, object_key, options = picked
            bg = asyncio.create_task(process_task(task_id, submission_id, object_key, options))
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
