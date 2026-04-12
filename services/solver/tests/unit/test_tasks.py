"""Unit tests for tasks router."""

import pytest
from httpx import AsyncClient


VALID_SUBMISSION = {
    "filename": "test.jpg",
    "content_type": "image/jpeg",
    "file_size_bytes": 1024,
}

# All task creations now require an astrometry.net API key. Reuse one shared
# value across the happy-path cases so each test only has to think about
# the behaviour it's actually exercising.
DEFAULT_TASK_BODY_WITH_KEY = {
    "options": {"astrometry_api_key": "test-astro-key"},
}


async def _create_uploaded_submission(client: AsyncClient) -> str:
    """Helper: create and confirm a submission, return its ID."""
    create = await client.post("/submissions", json=VALID_SUBMISSION)
    sub_id = create.json()["submission_id"]
    await client.post(f"/submissions/{sub_id}/confirm")
    return sub_id


async def _create_task(client: AsyncClient, sub_id: str, **options):
    """Helper: create a task with required api_key + extra options."""
    body = {
        "submission_id": sub_id,
        "options": {"astrometry_api_key": "test-astro-key", **options},
    }
    return await client.post("/tasks", json=body)


class TestCreateTask:
    async def test_success(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        resp = await _create_task(client, sub_id)
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "pending"
        assert data["submission_id"] == sub_id

    async def test_submission_not_uploaded(self, client: AsyncClient):
        # Create but don't confirm
        create = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = create.json()["submission_id"]

        resp = await _create_task(client, sub_id)
        assert resp.status_code == 409

    async def test_submission_not_found(self, client: AsyncClient):
        resp = await client.post("/tasks", json={
            "submission_id": "00000000-0000-0000-0000-000000000000",
            "options": {"astrometry_api_key": "test-astro-key"},
        })
        assert resp.status_code == 404

    async def test_with_options(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        resp = await _create_task(client, sub_id, focal_length=200, pixel_size=3.75)
        assert resp.status_code == 201


class TestApiKeyResolution:
    """Task creation must require an astrometry.net key, upserting it
    into the dedicated api_keys table when provided in the request. The
    key is NEVER written to task.options — the worker looks it up by
    user_id at pickup time."""

    async def test_rejects_when_no_key_stored_and_none_in_request(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        # No options at all, no stored key for the user
        resp = await client.post("/tasks", json={"submission_id": sub_id})
        assert resp.status_code == 422
        assert "astrometry_api_key" in resp.json()["detail"]

    async def test_rejects_when_only_other_options(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        # Options present but no api_key field and no stored key
        resp = await client.post("/tasks", json={
            "submission_id": sub_id,
            "options": {"focal_length": 200, "pixel_size": 3.75},
        })
        assert resp.status_code == 422

    async def test_request_key_is_upserted_and_not_stored_on_task(self, client: AsyncClient):
        """When the request carries an api_key, it must be saved into
        astrometry_api_keys AND stripped from task.options."""
        sub_id = await _create_uploaded_submission(client)

        resp = await _create_task(client, sub_id)
        assert resp.status_code == 201
        task_id = resp.json()["id"]

        from sqlalchemy import select
        from app.models.db import AstrometryApiKey, Task
        from tests.unit.conftest import TEST_DB_URL, TEST_USER
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

        engine = create_async_engine(TEST_DB_URL, echo=False)
        sm = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with sm() as db:
            task = (await db.execute(select(Task).where(Task.id == task_id))).scalar_one()
            # task.options must NOT leak the api key
            assert task.options is None or "astrometry_api_key" not in (task.options or {})

            stored = await db.get(AstrometryApiKey, TEST_USER)
            assert stored is not None
            assert stored.api_key == "test-astro-key"
        await engine.dispose()

    async def test_preserves_other_options_on_task(self, client: AsyncClient):
        """focal_length/pixel_size stay on the task even after the api_key
        is pulled out of the request."""
        sub_id = await _create_uploaded_submission(client)

        resp = await _create_task(client, sub_id, focal_length=200, pixel_size=3.75)
        assert resp.status_code == 201
        task_id = resp.json()["id"]

        from sqlalchemy import select
        from app.models.db import Task
        from tests.unit.conftest import TEST_DB_URL
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

        engine = create_async_engine(TEST_DB_URL, echo=False)
        sm = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with sm() as db:
            task = (await db.execute(select(Task).where(Task.id == task_id))).scalar_one()
            assert task.options == {"focal_length": 200, "pixel_size": 3.75}
        await engine.dispose()

    async def test_succeeds_with_only_stored_key(self, client: AsyncClient):
        """User saves key via /settings, then creates a task WITHOUT
        sending the key in options — should work."""
        sub_id = await _create_uploaded_submission(client)

        save_resp = await client.put("/settings", json={"astrometry_api_key": "saved-user-key"})
        assert save_resp.status_code == 200

        resp = await client.post("/tasks", json={"submission_id": sub_id})
        assert resp.status_code == 201


class TestListTasks:
    async def test_empty(self, client: AsyncClient):
        resp = await client.get("/tasks")
        assert resp.status_code == 200
        assert resp.json()["items"] == []
        assert resp.json()["total"] == 0

    async def test_pagination(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        await _create_task(client, sub_id)

        resp = await client.get("/tasks?limit=10")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    async def test_filter_by_submission(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)
        await _create_task(client, sub_id)

        resp = await client.get(f"/tasks?submission_id={sub_id}")
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

        # Non-existent submission filter
        resp2 = await client.get("/tasks?submission_id=00000000-0000-0000-0000-000000000000")
        assert resp2.json()["total"] == 0

    async def test_user_isolation(self, client: AsyncClient):
        from app.dependencies import get_current_user
        from app.main import app

        sub_id = await _create_uploaded_submission(client)
        await _create_task(client, sub_id)

        # User A sees tasks
        resp_a = await client.get("/tasks")
        assert resp_a.json()["total"] == 1

        # Switch to user B
        app.dependency_overrides[get_current_user] = lambda: "other-user-999"

        # User B does not see them
        resp_b = await client.get("/tasks")
        assert resp_b.json()["total"] == 0


class TestGetTask:
    async def test_success(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)
        create = await _create_task(client, sub_id)
        task_id = create.json()["id"]

        resp = await client.get(f"/tasks/{task_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == task_id
        assert data["result"] is None
        assert data["error"] is None

    async def test_not_found(self, client: AsyncClient):
        resp = await client.get("/tasks/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404


class TestCancelTask:
    async def test_cancel_pending(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)
        create = await _create_task(client, sub_id)
        task_id = create.json()["id"]

        resp = await client.post(f"/tasks/{task_id}/cancel")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    async def test_cancel_not_found(self, client: AsyncClient):
        resp = await client.post("/tasks/00000000-0000-0000-0000-000000000000/cancel")
        assert resp.status_code == 404
