"""Unit tests for worker/main.py: the tiling status flow and zombie-task recovery.

`process_task` must move a task through `processing → tiling → completed` (both the
task and its submission), and a tiling failure (`result.hips_error`) must still end
in `completed`.  `_recover_zombie_tasks` runs at worker startup and rescues tasks
whose owning worker died mid-way: `processing` zombies fail, `tiling` zombies
complete without a sky layer.
"""

import asyncio
import contextlib
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models.db import Submission, Task
from worker import main as worker_main

PENDING_SECRET = "P" * 22
PENDING_BASE = f"http://localhost:9000/skymap-static-data/img/{PENDING_SECRET}"


async def _beat_once(sm, task_id, monkeypatch) -> None:
    """Run `_heartbeat` long enough for one touch, then stop it."""
    monkeypatch.setattr(worker_main, "HEARTBEAT_INTERVAL", 0.01)
    beat = asyncio.create_task(worker_main._heartbeat(task_id))
    for _ in range(100):
        await asyncio.sleep(0.01)
        async with sm() as db:
            stamp = (await db.execute(
                select(Task.updated_at).where(Task.id == task_id))).scalar_one()
        if stamp > datetime.now(timezone.utc) - timedelta(minutes=1):
            break
    beat.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await beat


@pytest.fixture
async def db_session():
    engine = create_async_engine(worker_main.settings.database_url, echo=False)
    sm = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Point worker_main's own session factory at this engine so the
    # function-under-test sees the same DB rows we set up.
    original_factory = worker_main.async_session
    worker_main.async_session = sm
    try:
        yield sm
    finally:
        worker_main.async_session = original_factory
        async with engine.begin() as conn:
            await conn.execute(text("TRUNCATE tasks, submissions CASCADE"))
        await engine.dispose()


async def _seed(sm, *, status: str = "processing", age: timedelta = timedelta(0), result=None) -> tuple:
    """Insert a submission + task in `status`, with `updated_at` pushed back by `age`.
    Returns (task_id, submission_id)."""
    task_id = uuid4()
    sub_id = uuid4()
    stamp = datetime.now(timezone.utc) - age

    async with sm() as db:
        db.add(Submission(
            id=sub_id,
            user_id="test-user",
            status=status,
            filename="zombie.jpg",
            content_type="image/jpeg",
            file_size_bytes=1,
            object_key="users/test-user/submissions/zombie/input/original.jpg",
        ))
        db.add(Task(
            id=task_id,
            submission_id=sub_id,
            user_id="test-user",
            status=status,
            result=result,
            updated_at=stamp,
        ))
        await db.commit()

    return task_id, sub_id


async def _load(sm, task_id, sub_id):
    async with sm() as db:
        task = (await db.execute(select(Task).where(Task.id == task_id))).scalar_one()
        sub = (await db.execute(select(Submission).where(Submission.id == sub_id))).scalar_one()
    return task, sub


class TestProcessTaskStatusFlow:
    async def test_passes_through_tiling(self, db_session):
        task_id, sub_id = await _seed(db_session, status="processing")
        seen = {}

        async def fake_process(task_id, object_key, options=None, on_solved=None):
            await on_solved({"center_ra": 1.0, "center_dec": 2.0})
            task, sub = await _load(db_session, task_id, sub_id)
            seen["task"] = (task.status, task.result)
            seen["sub"] = sub.status
            return {"center_ra": 1.0, "center_dec": 2.0, "hips": {"kmax": 5, "tiles": 3}, "corners": []}

        with patch.object(worker_main, "process", fake_process):
            await worker_main._semaphore.acquire()
            await worker_main.process_task(task_id, sub_id, "users/u/submissions/s/input/original.jpg", None)

        # while tiling: status is `tiling` on both rows and the solve result is already visible
        assert seen["task"] == ("tiling", {"center_ra": 1.0, "center_dec": 2.0})
        assert seen["sub"] == "tiling"

        task, sub = await _load(db_session, task_id, sub_id)
        assert task.status == "completed"
        assert task.result["hips"] == {"kmax": 5, "tiles": 3}
        assert task.completed_at is not None
        assert task.error_code is None
        assert sub.status == "completed"

    async def test_hips_error_still_completes(self, db_session):
        task_id, sub_id = await _seed(db_session, status="processing")

        async def fake_process(task_id, object_key, options=None, on_solved=None):
            await on_solved({"center_ra": 1.0})
            return {"center_ra": 1.0, "hips_error": "boom"}

        with patch.object(worker_main, "process", fake_process):
            await worker_main._semaphore.acquire()
            await worker_main.process_task(task_id, sub_id, "users/u/submissions/s/input/original.jpg", None)

        task, sub = await _load(db_session, task_id, sub_id)
        assert task.status == "completed"
        assert task.result == {"center_ra": 1.0, "hips_error": "boom"}
        assert task.error_code is None and task.error_message is None
        assert sub.status == "completed"

    async def test_solve_error_fails(self, db_session):
        task_id, sub_id = await _seed(db_session, status="processing")

        async def fake_process(task_id, object_key, options=None, on_solved=None):
            raise RuntimeError("solver exploded")

        with patch.object(worker_main, "process", fake_process):
            await worker_main._semaphore.acquire()
            await worker_main.process_task(task_id, sub_id, "users/u/submissions/s/input/original.jpg", None)

        task, sub = await _load(db_session, task_id, sub_id)
        assert task.status == "failed"
        assert task.error_code == "processing_error"
        assert "solver exploded" in task.error_message
        assert sub.status == "failed"


class TestRecoverZombieTasks:
    async def test_marks_old_processing_as_failed(self, db_session):
        task_id, sub_id = await _seed(db_session, status="processing", age=timedelta(hours=1))

        await worker_main._recover_zombie_tasks()

        task, sub = await _load(db_session, task_id, sub_id)
        assert task.status == "failed"
        assert task.error_code == "worker_crash"
        assert "retry" in task.error_message.lower()
        assert sub.status == "failed"

    async def test_old_tiling_completes_with_hips_error(self, db_session):
        """A crash during tiling must not lose the solve: the result is already stored."""
        solve = {"center_ra": 83.8, "center_dec": -5.4}
        task_id, sub_id = await _seed(db_session, status="tiling", age=timedelta(hours=1), result=solve)

        await worker_main._recover_zombie_tasks()

        task, sub = await _load(db_session, task_id, sub_id)
        assert task.status == "completed"
        assert task.result["center_ra"] == 83.8
        assert "hips_error" in task.result and "hips" not in task.result
        assert task.error_code is None
        assert task.completed_at is not None
        assert sub.status == "completed"

    @pytest.mark.parametrize("status", ["processing", "tiling"])
    async def test_leaves_fresh_tasks_alone(self, db_session, status):
        """A task that just changed state must not be touched —
        another live worker may still be working on it."""
        task_id, sub_id = await _seed(db_session, status=status, age=timedelta(seconds=5))

        await worker_main._recover_zombie_tasks()

        task, sub = await _load(db_session, task_id, sub_id)
        assert task.status == status
        assert sub.status == status

    async def test_no_zombies_is_noop(self, db_session):
        # Should not raise even when nothing to recover
        await worker_main._recover_zombie_tasks()

    async def test_a_mixed_batch_leaves_no_row_pair_inconsistent(self, db_session):
        """Task and submission are written in one transaction, so they cannot disagree."""
        tiling_task, tiling_sub = await _seed(
            db_session, status="tiling", age=timedelta(hours=1), result={"center_ra": 1.0})
        solving_task, solving_sub = await _seed(
            db_session, status="processing", age=timedelta(hours=1))

        await worker_main._recover_zombie_tasks()

        task, sub = await _load(db_session, tiling_task, tiling_sub)
        assert (task.status, sub.status) == ("completed", "completed")
        task, sub = await _load(db_session, solving_task, solving_sub)
        assert (task.status, sub.status) == ("failed", "failed")

    async def test_a_task_that_finished_first_is_not_reopened(self, db_session):
        """The claim is one conditional UPDATE, so a row a live worker already finished
        is simply not matched — no read-then-write can overwrite it."""
        task_id, sub_id = await _seed(db_session, status="tiling", age=timedelta(hours=1))
        async with db_session() as db:
            await db.execute(update(Task).where(Task.id == task_id).values(
                status="completed", result={"center_ra": 1.0, "hips": {"base": "b"}}))
            await db.execute(update(Submission).where(Submission.id == sub_id).values(
                status="completed"))
            await db.commit()

        await worker_main._recover_zombie_tasks()

        task, sub = await _load(db_session, task_id, sub_id)
        assert task.result == {"center_ra": 1.0, "hips": {"base": "b"}}
        assert "hips_error" not in task.result
        assert sub.status == "completed"


class TestRecoveredTilesAreCleanedUp:
    """A crash mid-tiling leaves tiles nobody can name — unless `hips_pending` is on record."""

    async def test_the_half_written_pyramid_is_dropped_and_forgotten(self, db_session):
        task_id, sub_id = await _seed(
            db_session, status="tiling", age=timedelta(hours=1),
            result={"center_ra": 83.8, "hips_pending": PENDING_BASE},
        )
        bucket = MagicMock()
        bucket.delete_prefix.return_value = 7

        await worker_main._recover_zombie_tasks(hips_storage=bucket)

        bucket.delete_prefix.assert_called_once_with(f"img/{PENDING_SECRET}")
        task, sub = await _load(db_session, task_id, sub_id)
        assert task.status == "completed" and sub.status == "completed"
        assert task.result["center_ra"] == 83.8              # the solve survives
        assert "hips_error" in task.result
        assert "hips_pending" not in task.result             # the pointer goes with the tiles

    async def test_a_failing_bucket_keeps_the_pointer_for_the_next_run(self, db_session):
        task_id, sub_id = await _seed(
            db_session, status="tiling", age=timedelta(hours=1),
            result={"center_ra": 1.0, "hips_pending": PENDING_BASE},
        )
        bucket = MagicMock()
        bucket.delete_prefix.side_effect = RuntimeError("bucket unreachable")

        await worker_main._recover_zombie_tasks(hips_storage=bucket)

        task, _ = await _load(db_session, task_id, sub_id)
        assert task.status == "completed"
        assert task.result["hips_pending"] == PENDING_BASE

    async def test_nothing_to_drop_touches_no_bucket(self, db_session):
        await _seed(db_session, status="tiling", age=timedelta(hours=1),
                    result={"center_ra": 1.0})
        bucket = MagicMock()

        await worker_main._recover_zombie_tasks(hips_storage=bucket)

        bucket.delete_prefix.assert_not_called()


class TestHeartbeat:
    """`updated_at` has to mean "alive", not "last state change" — see ZOMBIE_TIMEOUT."""

    async def test_a_beaten_task_is_not_a_zombie(self, db_session, monkeypatch):
        """An astrometry.net solve queued for an hour is healthy, not crashed."""
        task_id, sub_id = await _seed(db_session, status="processing", age=timedelta(hours=1))

        await _beat_once(db_session, task_id, monkeypatch)
        await worker_main._recover_zombie_tasks()

        task, sub = await _load(db_session, task_id, sub_id)
        assert task.status == "processing"
        assert sub.status == "processing"

    async def test_it_does_not_revive_a_finished_task(self, db_session, monkeypatch):
        """Only `processing`/`tiling` rows are touched, so a completed row stays put."""
        task_id, sub_id = await _seed(db_session, status="completed", age=timedelta(hours=1))
        before = (await _load(db_session, task_id, sub_id))[0].updated_at

        await _beat_once(db_session, task_id, monkeypatch)

        task, _ = await _load(db_session, task_id, sub_id)
        assert task.updated_at == before

    async def test_process_task_stops_beating_when_it_is_done(self, db_session, monkeypatch):
        monkeypatch.setattr(worker_main, "HEARTBEAT_INTERVAL", 0.01)
        task_id, sub_id = await _seed(db_session, status="processing")

        async def fake_process(task_id, object_key, options=None, on_solved=None):
            await asyncio.sleep(0.05)
            return {"center_ra": 1.0}

        with patch.object(worker_main, "process", fake_process):
            await worker_main._semaphore.acquire()
            await worker_main.process_task(task_id, sub_id, "users/u/s/input/original.jpg", None)

        # no pending heartbeat left behind after the task finished
        assert not [t for t in asyncio.all_tasks()
                    if t is not asyncio.current_task() and "_heartbeat" in str(t.get_coro())]


class TestRowVanishesMidFlight:
    """The user may delete the submission or erase the account while the task runs.

    Every write back to the row is conditional, so the worker notices and stops instead
    of resurrecting the row or filling a public prefix nothing will ever name.
    """

    async def test_a_deleted_row_stops_the_pipeline_before_tiling(self, db_session):
        task_id, sub_id = await _seed(db_session, status="processing")
        reached_tiling = []

        async def fake_process(task_id, object_key, options=None, on_solved=None):
            async with db_session() as db:
                await db.execute(text("DELETE FROM submissions WHERE id = :id"), {"id": sub_id})
                await db.commit()
            await on_solved({"center_ra": 1.0, "hips_pending": PENDING_BASE})
            reached_tiling.append(True)
            return {}

        with patch.object(worker_main, "process", fake_process):
            await worker_main._semaphore.acquire()
            await worker_main.process_task(task_id, sub_id, "users/u/s/input/original.jpg", None)

        assert reached_tiling == [], "tiling started on a submission that was already deleted"

    async def test_a_cancelled_task_is_not_completed_and_its_tiles_are_dropped(self, db_session):
        """Account deletion cancels the row; the pyramid the tiler finished is orphaned."""
        task_id, sub_id = await _seed(db_session, status="processing")
        base = f"http://localhost:9000/skymap-static-data/img/{'Q' * 22}"
        bucket = MagicMock()
        bucket.delete_prefix.return_value = 42

        async def fake_process(task_id, object_key, options=None, on_solved=None):
            await on_solved({"center_ra": 1.0, "hips_pending": PENDING_BASE})
            async with db_session() as db:
                await db.execute(update(Task).where(Task.id == task_id).values(status="cancelled"))
                await db.commit()
            return {"center_ra": 1.0, "hips": {"base": base}}

        with patch.object(worker_main, "process", fake_process), \
             patch.object(worker_main, "get_hips_storage", lambda: bucket):
            await worker_main._semaphore.acquire()
            await worker_main.process_task(task_id, sub_id, "users/u/s/input/original.jpg", None)

        task, _ = await _load(db_session, task_id, sub_id)
        assert task.status == "cancelled", "a cancelled task was resurrected as completed"
        bucket.delete_prefix.assert_called_once_with(f"img/{'Q' * 22}")

    async def test_a_cancelled_task_never_starts_tiling(self, db_session):
        task_id, sub_id = await _seed(db_session, status="processing")
        reached_tiling = []

        async def fake_process(task_id, object_key, options=None, on_solved=None):
            async with db_session() as db:
                await db.execute(update(Task).where(Task.id == task_id).values(status="cancelled"))
                await db.commit()
            await on_solved({"center_ra": 1.0, "hips_pending": PENDING_BASE})
            reached_tiling.append(True)
            return {}

        with patch.object(worker_main, "process", fake_process):
            await worker_main._semaphore.acquire()
            await worker_main.process_task(task_id, sub_id, "users/u/s/input/original.jpg", None)

        assert reached_tiling == []
        task, _ = await _load(db_session, task_id, sub_id)
        assert task.status == "cancelled"
