"""DELETE /submissions/{id} purges storage synchronously (APO-87, design §3).

The row is the only pointer to a submission's objects — the private prefix and the
per-image tile prefix, which anyone holding the link can read without auth. So the
purge runs before the commit, and a storage failure must leave the database exactly
as it was, with a 503 that invites a retry.
"""

from __future__ import annotations

from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.db import Submission, Task
from app.services.hips_storage import HipsStorageError
from app.services.storage import StorageError
from tests.unit.conftest import TEST_USER

VALID_SUBMISSION = {
    "filename": "orion.jpg",
    "content_type": "image/jpeg",
    "file_size_bytes": 1024,
}

SECRET = "Ck7dQvJm2pR4sT6uV8wXyZ"
BASE = f"http://localhost:9000/skymap-static-data/img/{SECRET}"


@pytest.fixture
async def sessions():
    """Session factory on the test DB, for rows the API cannot create (solved tasks)."""
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    yield factory
    await engine.dispose()


async def _submission(client: AsyncClient) -> tuple[str, str]:
    resp = await client.post("/submissions", json=VALID_SUBMISSION)
    body = resp.json()
    return body["submission_id"], body["object_key"]


async def _tiled_task(factory, submission_id: str, base: str | None) -> UUID:
    """A completed task, with a sky layer (`base`) or with a tiling failure (None)."""
    task_id = uuid4()
    result = ({"hips": {"kmax": 6, "tiles": 42, "base": base, "thumb": f"{base}/thumb.jpg"}}
              if base else {"hips_error": "solver returned no WCS file"})
    async with factory() as db:
        db.add(Task(
            id=task_id,
            submission_id=UUID(submission_id),
            user_id=TEST_USER,
            status="completed",
            result=result,
        ))
        await db.commit()
    return task_id


async def _row_count(factory, submission_id: str) -> int:
    async with factory() as db:
        rows = (await db.execute(
            select(Submission).where(Submission.id == UUID(submission_id))
        )).scalars().all()
    return len(rows)


class TestPurgePrefixes:
    async def test_deletes_private_prefix_and_every_image(self, client, sessions,
                                                          mock_storage, mock_hips_storage):
        sub_id, object_key = await _submission(client)
        await _tiled_task(sessions, sub_id, BASE)
        other = f"http://localhost:9000/skymap-static-data/img/{'A' * 22}"
        await _tiled_task(sessions, sub_id, other)          # re-solve: second image, second secret
        await _tiled_task(sessions, sub_id, None)           # tiling failed: nothing to purge

        resp = await client.delete(f"/submissions/{sub_id}")
        assert resp.status_code == 204

        tile_prefixes = {call.args[0] for call in mock_hips_storage.delete_prefix.call_args_list}
        assert tile_prefixes == {f"img/{SECRET}", f"img/{'A' * 22}"}

        mock_storage.delete_prefix.assert_called_once()
        private = mock_storage.delete_prefix.call_args.args[0]
        assert private == f"users/{TEST_USER}/submissions/{sub_id}"
        # The prefix has to cover the upload itself and every task output under it.
        assert object_key.startswith(private + "/")

        assert await _row_count(sessions, sub_id) == 0

    async def test_untiled_submission_touches_only_the_private_bucket(self, client, sessions,
                                                                      mock_storage, mock_hips_storage):
        sub_id, _ = await _submission(client)

        assert (await client.delete(f"/submissions/{sub_id}")).status_code == 204

        mock_hips_storage.delete_prefix.assert_not_called()
        mock_storage.delete_prefix.assert_called_once()

    async def test_other_users_submission_purges_nothing(self, client, mock_storage, mock_hips_storage):
        from app.dependencies import get_current_user
        from app.main import app

        sub_id, _ = await _submission(client)
        app.dependency_overrides[get_current_user] = lambda: "other-user-999"

        assert (await client.delete(f"/submissions/{sub_id}")).status_code == 404
        mock_storage.delete_prefix.assert_not_called()
        mock_hips_storage.delete_prefix.assert_not_called()


class TestPurgeFailure:
    async def test_private_bucket_failure_is_503_and_keeps_the_row(self, client, sessions,
                                                                   mock_storage):
        sub_id, _ = await _submission(client)
        mock_storage.delete_prefix.side_effect = StorageError("failed to delete 3 of 12 objects")

        resp = await client.delete(f"/submissions/{sub_id}")
        assert resp.status_code == 503

        assert await _row_count(sessions, sub_id) == 1
        assert (await client.get(f"/submissions/{sub_id}")).status_code == 200

    async def test_tile_failure_is_503_and_stops_before_the_private_bucket(self, client, sessions,
                                                                          mock_storage, mock_hips_storage):
        sub_id, _ = await _submission(client)
        task_id = await _tiled_task(sessions, sub_id, BASE)
        mock_hips_storage.delete_prefix.side_effect = HipsStorageError(
            f"failed to delete 1 of 40 objects under img/{SECRET}/: img/{SECRET}/thumb.jpg: denied"
        )

        resp = await client.delete(f"/submissions/{sub_id}")
        assert resp.status_code == 503
        # The capability secret is quoted by the storage error; it must not travel back
        # to the client (nor into the logs — see redact_secrets).
        assert SECRET not in resp.text

        mock_storage.delete_prefix.assert_not_called()
        assert await _row_count(sessions, sub_id) == 1
        assert (await client.get(f"/tasks/{task_id}")).status_code == 200

    async def test_retry_after_a_failure_succeeds(self, client, sessions, mock_storage):
        sub_id, _ = await _submission(client)
        mock_storage.delete_prefix.side_effect = StorageError("boom")
        assert (await client.delete(f"/submissions/{sub_id}")).status_code == 503

        mock_storage.delete_prefix.side_effect = None
        mock_storage.delete_prefix.return_value = 0      # already gone — the purge is idempotent
        assert (await client.delete(f"/submissions/{sub_id}")).status_code == 204
        assert await _row_count(sessions, sub_id) == 0
