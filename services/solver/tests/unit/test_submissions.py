"""Unit tests for submissions router."""

import pytest
from httpx import AsyncClient


VALID_SUBMISSION = {
    "filename": "andromeda.fits",
    "content_type": "application/fits",
    "file_size_bytes": 5000000,
}


class TestCreateSubmission:
    async def test_success(self, client: AsyncClient, mock_storage):
        resp = await client.post("/submissions", json=VALID_SUBMISSION)
        assert resp.status_code == 201
        data = resp.json()
        assert "submission_id" in data
        assert "upload_url" in data
        assert data["object_key"].endswith("/input/original.fits")
        mock_storage.generate_presigned_upload_url.assert_called_once()

    async def test_invalid_content_type(self, client: AsyncClient):
        body = {**VALID_SUBMISSION, "content_type": "video/mp4"}
        resp = await client.post("/submissions", json=body)
        assert resp.status_code == 422

    async def test_file_too_large(self, client: AsyncClient):
        body = {**VALID_SUBMISSION, "file_size_bytes": 60_000_000}
        resp = await client.post("/submissions", json=body)
        assert resp.status_code == 422

    async def test_unauthorized(self, client: AsyncClient):
        # Remove auth override — use raw client without token
        from app.main import app
        from app.dependencies import get_current_user
        # Restore real auth (requires Bearer token validation)
        if get_current_user in app.dependency_overrides:
            del app.dependency_overrides[get_current_user]

        from httpx import ASGITransport, AsyncClient as AC
        async with AC(transport=ASGITransport(app=app), base_url="http://test") as raw:
            resp = await raw.post("/submissions", json=VALID_SUBMISSION)
            assert resp.status_code in (401, 403)


class TestListSubmissions:
    async def test_empty(self, client: AsyncClient):
        resp = await client.get("/submissions")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_pagination(self, client: AsyncClient):
        # Create 3 submissions
        for i in range(3):
            await client.post("/submissions", json={**VALID_SUBMISSION, "filename": f"img{i}.fits"})

        resp = await client.get("/submissions?limit=2&offset=0")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 2
        assert data["total"] == 3

        resp2 = await client.get("/submissions?limit=2&offset=2")
        assert len(resp2.json()["items"]) == 1

    async def test_user_isolation(self, client: AsyncClient):
        from app.dependencies import get_current_user
        from app.main import app

        # User A creates a submission
        await client.post("/submissions", json=VALID_SUBMISSION)

        # User A sees it
        resp_a = await client.get("/submissions")
        assert resp_a.json()["total"] == 1

        # Switch to user B
        app.dependency_overrides[get_current_user] = lambda: "other-user-999"

        # User B does not see it
        resp_b = await client.get("/submissions")
        assert resp_b.json()["total"] == 0


class TestGetSubmission:
    async def test_success(self, client: AsyncClient):
        create = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = create.json()["submission_id"]

        resp = await client.get(f"/submissions/{sub_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == sub_id
        assert data["status"] == "pending"
        assert "tasks" in data

    async def test_not_found(self, client: AsyncClient):
        resp = await client.get("/submissions/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    async def test_other_user(self, client: AsyncClient):
        from app.dependencies import get_current_user
        from app.main import app

        create = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = create.json()["submission_id"]

        # Switch to different user
        app.dependency_overrides[get_current_user] = lambda: "other-user-999"

        resp = await client.get(f"/submissions/{sub_id}")
        assert resp.status_code == 404


class TestDeleteSubmission:
    async def test_success(self, client: AsyncClient, mock_storage):
        create = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = create.json()["submission_id"]

        resp = await client.delete(f"/submissions/{sub_id}")
        assert resp.status_code == 204

        mock_storage.delete_object.assert_called_once()

        # Verify deleted
        resp2 = await client.get(f"/submissions/{sub_id}")
        assert resp2.status_code == 404

    async def test_not_found(self, client: AsyncClient):
        resp = await client.delete("/submissions/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404


class TestConfirmSubmission:
    async def test_success(self, client: AsyncClient):
        create = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = create.json()["submission_id"]

        resp = await client.post(f"/submissions/{sub_id}/confirm")
        assert resp.status_code == 200
        assert resp.json()["status"] == "uploaded"

    async def test_already_uploaded(self, client: AsyncClient):
        create = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = create.json()["submission_id"]

        # Confirm once
        await client.post(f"/submissions/{sub_id}/confirm")

        # Confirm again — should fail
        resp = await client.post(f"/submissions/{sub_id}/confirm")
        assert resp.status_code == 409

    async def test_not_found(self, client: AsyncClient):
        resp = await client.post("/submissions/00000000-0000-0000-0000-000000000000/confirm")
        assert resp.status_code == 404
