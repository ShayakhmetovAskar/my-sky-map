"""Scenario tests — happy path flows through the full API.

Real DB (Postgres) + Real Storage (MinIO). Only astrometry.net client is mocked.
"""

import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app.services.storage import StorageService
from tests.scenario.conftest import FAKE_CALIBRATION


VALID_SUBMISSION = {
    "filename": "orion.jpg",
    "content_type": "image/jpeg",
    "file_size_bytes": 68000,
}


class TestFullFlow:
    async def test_submission_to_completed(self, client: AsyncClient, mock_solver, real_storage: StorageService):
        # 1. Create submission
        resp = await client.post("/submissions", json=VALID_SUBMISSION)
        assert resp.status_code == 201
        sub_id = resp.json()["submission_id"]
        object_key = resp.json()["object_key"]

        # 2. Upload a test file to MinIO (simulating client upload via presigned URL)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            f.write(b"fake jpeg image data for testing")
            f.flush()
            real_storage.upload_file(object_key, f.name, "image/jpeg")

        # 3. Confirm upload
        resp = await client.post(f"/submissions/{sub_id}/confirm")
        assert resp.status_code == 200
        assert resp.json()["status"] == "uploaded"

        # 4. Create task
        resp = await client.post("/tasks", json={"submission_id": sub_id})
        assert resp.status_code == 201
        task_id = resp.json()["id"]

        # 5. Verify submission is processing
        resp = await client.get(f"/submissions/{sub_id}")
        assert resp.json()["status"] == "processing"

        # 6. Simulate worker (real storage, mock solver)
        with patch("worker.pipeline.get_solver", return_value=mock_solver):
            from worker.pipeline import process
            result = await process(task_id, object_key)

        # 7. Verify result
        assert result["center_ra"] == pytest.approx(83.857, abs=0.01)
        assert result["center_dec"] == pytest.approx(-5.411, abs=0.01)
        assert "annotated_image_url" not in result  # mock solver doesn't create files

    async def test_submission_lifecycle(self, client: AsyncClient):
        """Test status transitions: pending → uploaded → processing."""
        resp = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = resp.json()["submission_id"]

        # pending
        resp = await client.get(f"/submissions/{sub_id}")
        assert resp.json()["status"] == "pending"

        # uploaded
        await client.post(f"/submissions/{sub_id}/confirm")
        resp = await client.get(f"/submissions/{sub_id}")
        assert resp.json()["status"] == "uploaded"

        # processing
        await client.post("/tasks", json={"submission_id": sub_id})
        resp = await client.get(f"/submissions/{sub_id}")
        assert resp.json()["status"] == "processing"

    async def test_multiple_submissions(self, client: AsyncClient):
        sub_ids = []
        for i in range(3):
            resp = await client.post("/submissions", json={
                **VALID_SUBMISSION, "filename": f"star_{i}.fits", "content_type": "application/fits",
            })
            assert resp.status_code == 201
            sub_ids.append(resp.json()["submission_id"])

        resp = await client.get("/submissions")
        assert resp.json()["total"] == 3

    async def test_task_with_solver_options(self, client: AsyncClient):
        resp = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = resp.json()["submission_id"]
        await client.post(f"/submissions/{sub_id}/confirm")

        resp = await client.post("/tasks", json={
            "submission_id": sub_id,
            "options": {"focal_length": 200, "pixel_size": 3.75},
        })
        assert resp.status_code == 201
