"""Unit tests for worker/main.py: the tiling status flow and zombie-task recovery.

`process_task` must move a task through `processing → tiling → completed` (both the
task and its submission), and a tiling failure (`result.hips_error`) must still end
in `completed`.  `_recover_zombie_tasks` runs at worker startup and rescues tasks
whose owning worker died mid-way: `processing` zombies fail, `tiling` zombies
complete without a sky layer.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from uuid import uuid4

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models.db import Submission, Task
from worker import main as worker_main


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
