"""Unit tests for worker pipeline."""

import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from worker.pipeline import Pipeline, get_solver
from worker.solvers.base import SolveResult, SolveError


class TestPipeline:
    def _make_pipeline(self):
        storage = MagicMock()
        storage.download_object.return_value = None
        storage.upload_file.return_value = None
        storage.generate_presigned_download_url.return_value = "http://test/download"

        solver = AsyncMock()
        solver.solve.return_value = SolveResult(
            center_ra=83.857,
            center_dec=-5.411,
            field_of_view=0.8,
            pixel_scale=1.6,
            orientation=340.0,
        )

        return Pipeline(storage, solver), storage, solver

    async def test_process_success(self, tmp_path):
        pipeline, storage, solver = self._make_pipeline()

        result = await pipeline.process(
            task_id=uuid4(),
            object_key="users/uid/submissions/sid/input/original.jpg",
            options={"astrometry_api_key": "test-key"},
        )

        assert result["center_ra"] == 83.857
        assert result["center_dec"] == -5.411
        storage.download_object.assert_called_once()
        solver.solve.assert_called_once()

    async def test_process_solver_error(self):
        pipeline, storage, solver = self._make_pipeline()
        solver.solve.side_effect = SolveError("timeout", "Solver timed out")

        with pytest.raises(SolveError):
            await pipeline.process(
                task_id=uuid4(),
                object_key="users/uid/submissions/sid/input/original.jpg",
                options={"astrometry_api_key": "test-key"},
            )

    async def test_process_mesh_failure_graceful(self):
        pipeline, storage, solver = self._make_pipeline()
        # Solver returns result without WCS file
        solver.solve.return_value = SolveResult(
            center_ra=10.0, center_dec=20.0,
            field_of_view=1.0, pixel_scale=1.0, orientation=0.0,
            wcs_path=None,
        )

        result = await pipeline.process(
            task_id=uuid4(),
            object_key="users/uid/submissions/sid/input/original.jpg",
            options={"astrometry_api_key": "test-key"},
        )

        assert result["center_ra"] == 10.0
        assert "mesh_json_url" not in result

    def test_output_prefix(self):
        prefix = Pipeline._output_prefix(
            "users/uid/submissions/sid/input/original.jpg",
            uuid4(),
        )
        assert prefix.startswith("users/uid/submissions/sid/tasks/")
        assert prefix.endswith("/output")


class TestGetSolver:
    def test_online_backend(self):
        with patch("worker.pipeline.settings") as mock_settings:
            mock_settings.solver_backend = "online"
            mock_settings.astrometry_api_url = "http://test"
            solver = get_solver({"astrometry_api_key": "user-supplied-key"})
            assert type(solver).__name__ == "AstrometryOnlineSolver"

    def test_missing_api_key_raises(self):
        with patch("worker.pipeline.settings") as mock_settings:
            mock_settings.solver_backend = "online"
            with pytest.raises(ValueError, match="astrometry_api_key is required"):
                get_solver({})

    def test_no_options_raises(self):
        with patch("worker.pipeline.settings") as mock_settings:
            mock_settings.solver_backend = "online"
            with pytest.raises(ValueError, match="astrometry_api_key is required"):
                get_solver(None)

    def test_unknown_backend(self):
        with patch("worker.pipeline.settings") as mock_settings:
            mock_settings.solver_backend = "unknown"
            with pytest.raises(ValueError):
                get_solver({"astrometry_api_key": "test-key"})
