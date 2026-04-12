"""Scenario tests — error flows and edge cases.

Real DB (Postgres) + Real Storage (MinIO). Only astrometry.net client is mocked.
"""

import pytest
from unittest.mock import patch

from httpx import AsyncClient

from worker.solvers.base import SolveError


VALID_SUBMISSION = {
    "filename": "test.jpg",
    "content_type": "image/jpeg",
    "file_size_bytes": 1024,
}

TASK_OPTIONS = {"astrometry_api_key": "test-astro-key"}


class TestErrorFlows:
    async def test_create_task_for_pending_submission(self, client: AsyncClient):
        resp = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = resp.json()["submission_id"]

        resp = await client.post("/tasks", json={"submission_id": sub_id, "options": TASK_OPTIONS})
        assert resp.status_code == 409

    async def test_double_confirm(self, client: AsyncClient):
        resp = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = resp.json()["submission_id"]

        resp = await client.post(f"/submissions/{sub_id}/confirm")
        assert resp.status_code == 200

        resp = await client.post(f"/submissions/{sub_id}/confirm")
        assert resp.status_code == 409

    async def test_cancel_then_cancel_again(self, client: AsyncClient):
        resp = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = resp.json()["submission_id"]
        await client.post(f"/submissions/{sub_id}/confirm")
        resp = await client.post("/tasks", json={"submission_id": sub_id, "options": TASK_OPTIONS})
        task_id = resp.json()["id"]

        resp = await client.post(f"/tasks/{task_id}/cancel")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

        resp = await client.post(f"/tasks/{task_id}/cancel")
        assert resp.status_code == 409

    async def test_solver_failure(self, client: AsyncClient, mock_solver, real_storage):
        mock_solver.solve.side_effect = SolveError("solver_timeout", "No solution found")

        resp = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = resp.json()["submission_id"]
        object_key = resp.json()["object_key"]

        # Upload fake file so download doesn't fail
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            f.write(b"fake data")
            f.flush()
            real_storage.upload_file(object_key, f.name, "image/jpeg")

        await client.post(f"/submissions/{sub_id}/confirm")
        resp = await client.post("/tasks", json={"submission_id": sub_id, "options": TASK_OPTIONS})
        task_id = resp.json()["id"]

        with patch("worker.pipeline.get_solver", return_value=mock_solver):
            from worker.pipeline import process
            with pytest.raises(SolveError) as exc_info:
                await process(task_id, object_key, options=TASK_OPTIONS)

        assert exc_info.value.code == "solver_timeout"

    async def test_delete_submission_cascades_tasks(self, client: AsyncClient):
        resp = await client.post("/submissions", json=VALID_SUBMISSION)
        sub_id = resp.json()["submission_id"]
        await client.post(f"/submissions/{sub_id}/confirm")
        resp = await client.post("/tasks", json={"submission_id": sub_id, "options": TASK_OPTIONS})
        task_id = resp.json()["id"]

        resp = await client.get(f"/tasks/{task_id}")
        assert resp.status_code == 200

        resp = await client.delete(f"/submissions/{sub_id}")
        assert resp.status_code == 204

        resp = await client.get(f"/tasks/{task_id}")
        assert resp.status_code == 404

    async def test_nonexistent_resources(self, client: AsyncClient):
        fake = "00000000-0000-0000-0000-000000000000"

        assert (await client.get(f"/submissions/{fake}")).status_code == 404
        assert (await client.post(f"/submissions/{fake}/confirm")).status_code == 404
        assert (await client.delete(f"/submissions/{fake}")).status_code == 404
        assert (await client.get(f"/tasks/{fake}")).status_code == 404
        assert (await client.post(f"/tasks/{fake}/cancel")).status_code == 404
        assert (await client.post("/tasks", json={"submission_id": fake, "options": TASK_OPTIONS})).status_code == 404
