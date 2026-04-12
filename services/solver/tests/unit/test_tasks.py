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
    """Task creation must require an astrometry.net key, falling back to
    UserSettings if one is saved. Also verifies the key is persisted in
    task.options so the worker can read it later."""

    async def test_rejects_when_no_key_provided(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        # No options at all
        resp = await client.post("/tasks", json={"submission_id": sub_id})
        assert resp.status_code == 422
        assert "astrometry_api_key" in resp.json()["detail"]

    async def test_rejects_when_only_other_options(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        # Options present but no api_key field
        resp = await client.post("/tasks", json={
            "submission_id": sub_id,
            "options": {"focal_length": 200, "pixel_size": 3.75},
        })
        assert resp.status_code == 422

    async def test_uses_key_from_request_options(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        resp = await _create_task(client, sub_id)
        assert resp.status_code == 201
        task_id = resp.json()["id"]

        # Verify the key was persisted into task.options for the worker
        from sqlalchemy import select
        from app.models.db import Task
        from tests.unit.conftest import TEST_DB_URL
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

        engine = create_async_engine(TEST_DB_URL, echo=False)
        sm = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with sm() as db:
            task = (await db.execute(select(Task).where(Task.id == task_id))).scalar_one()
            assert task.options["astrometry_api_key"] == "test-astro-key"
        await engine.dispose()

    async def test_falls_back_to_user_settings(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        # Save a key via the settings endpoint first
        save_resp = await client.put("/settings", json={"astrometry_api_key": "saved-user-key"})
        assert save_resp.status_code == 200

        # Now create a task WITHOUT api_key in options — should use UserSettings
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
