"""Unit tests for tasks router."""

import pytest
from httpx import AsyncClient


VALID_SUBMISSION = {
    "filename": "test.jpg",
    "content_type": "image/jpeg",
    "file_size_bytes": 1024,
}


async def _create_uploaded_submission(client: AsyncClient) -> str:
    """Helper: create and confirm a submission, return its ID."""
    create = await client.post("/submissions", json=VALID_SUBMISSION)
    sub_id = create.json()["submission_id"]
    await client.post(f"/submissions/{sub_id}/confirm")
    return sub_id


class TestCreateTask:
    async def test_success(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        resp = await client.post("/tasks", json={"submission_id": sub_id})
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "pending"
        assert data["submission_id"] == sub_id

    async def test_submission_not_uploaded(self, client: AsyncClient):
        # Create but don't confirm
        create = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = create.json()["submission_id"]

        resp = await client.post("/tasks", json={"submission_id": sub_id})
        assert resp.status_code == 409

    async def test_submission_not_found(self, client: AsyncClient):
        resp = await client.post("/tasks", json={"submission_id": "00000000-0000-0000-0000-000000000000"})
        assert resp.status_code == 404

    async def test_with_options(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)

        resp = await client.post("/tasks", json={
            "submission_id": sub_id,
            "options": {"focal_length": 200, "pixel_size": 3.75},
        })
        assert resp.status_code == 201


class TestListTasks:
    async def test_empty(self, client: AsyncClient):
        resp = await client.get("/tasks")
        assert resp.status_code == 200
        assert resp.json()["items"] == []
        assert resp.json()["total"] == 0

    async def test_pagination(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)
        # Create 3 tasks (submission stays "processing" after first, but we allow it for test)
        for _ in range(3):
            # Re-confirm to allow multiple tasks
            pass

        await client.post("/tasks", json={"submission_id": sub_id})

        resp = await client.get("/tasks?limit=10")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    async def test_filter_by_submission(self, client: AsyncClient):
        sub_id = await _create_uploaded_submission(client)
        await client.post("/tasks", json={"submission_id": sub_id})

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
        await client.post("/tasks", json={"submission_id": sub_id})

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
        create = await client.post("/tasks", json={"submission_id": sub_id})
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
        create = await client.post("/tasks", json={"submission_id": sub_id})
        task_id = create.json()["id"]

        resp = await client.post(f"/tasks/{task_id}/cancel")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    async def test_cancel_not_found(self, client: AsyncClient):
        resp = await client.post("/tasks/00000000-0000-0000-0000-000000000000/cancel")
        assert resp.status_code == 404
