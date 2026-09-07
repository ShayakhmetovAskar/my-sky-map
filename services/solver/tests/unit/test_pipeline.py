"""Unit tests for worker pipeline."""

import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from worker.pipeline import Pipeline, get_solver
from worker.solvers.base import SolveResult, SolveError

FAKE_HIPS = {
    "hips": {"kmax": 6, "tiles": 12, "moc": {"0": [3], "6": [12404]}, "base": "http://pub/img/s", "thumb": "http://pub/img/s/thumb.jpg", "seconds": 1.5},
    "corners": [[1.0, 2.0], [1.1, 2.0], [1.1, 2.1], [1.0, 2.1]],
}


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
        )

        assert result["center_ra"] == 10.0
        assert "mesh_json_url" not in result

    async def test_process_without_hips_storage_skips_tiling(self):
        pipeline, storage, solver = self._make_pipeline()
        on_solved = AsyncMock()

        with patch("worker.pipeline.build_hips") as build:
            result = await pipeline.process(
                task_id=uuid4(),
                object_key="users/uid/submissions/sid/input/original.jpg",
                on_solved=on_solved,
            )

        build.assert_not_called()
        on_solved.assert_not_called()
        assert "hips" not in result and "hips_error" not in result

    def test_output_prefix(self):
        prefix = Pipeline._output_prefix(
            "users/uid/submissions/sid/input/original.jpg",
            uuid4(),
        )
        assert prefix.startswith("users/uid/submissions/sid/tasks/")
        assert prefix.endswith("/output")


class TestPipelineTiling:
    def _make_pipeline(self, tmp_path, with_wcs=True):
        storage = MagicMock()
        hips_storage = MagicMock()
        hips_storage.public_base_url = "http://pub/skymap-static-data"

        wcs_path = None
        if with_wcs:
            wcs_path = tmp_path / "wcs.fits"
            wcs_path.write_bytes(b"SIMPLE  =                    T")

        solver = AsyncMock()
        solver.solve.return_value = SolveResult(
            center_ra=83.857, center_dec=-5.411, field_of_view=0.8, pixel_scale=1.6, orientation=340.0,
            wcs_path=wcs_path,
        )
        return Pipeline(storage, solver, hips_storage), hips_storage

    async def test_tiling_success(self, tmp_path):
        pipeline, hips_storage = self._make_pipeline(tmp_path)
        on_solved = AsyncMock()

        with patch("worker.pipeline.get_mesh", return_value=[[]]), \
             patch("worker.pipeline.build_hips", return_value=FAKE_HIPS) as build:
            result = await pipeline.process(
                task_id=uuid4(),
                object_key="users/uid/submissions/sid/input/original.jpg",
                on_solved=on_solved,
            )

        # on_solved got the solve result (no hips yet) before tiling started
        on_solved.assert_awaited_once()
        partial = on_solved.await_args.args[0]
        assert partial["center_ra"] == 83.857 and "hips" not in partial
        # the tiler was pointed at the public bucket
        args = build.call_args.args
        assert args[2] is hips_storage and args[3] == "http://pub/skymap-static-data"
        assert result["hips"] == FAKE_HIPS["hips"]
        assert result["corners"] == FAKE_HIPS["corners"]
        assert "hips_error" not in result

    async def test_tiling_error_does_not_fail_solve(self, tmp_path):
        pipeline, hips_storage = self._make_pipeline(tmp_path)
        on_solved = AsyncMock()

        with patch("worker.pipeline.get_mesh", return_value=[[]]), \
             patch("worker.pipeline.build_hips", side_effect=ValueError("bad wcs")):
            result = await pipeline.process(
                task_id=uuid4(),
                object_key="users/uid/submissions/sid/input/original.jpg",
                on_solved=on_solved,
            )

        on_solved.assert_awaited_once()
        assert result["center_ra"] == 83.857
        assert result["hips_error"] == "bad wcs"
        assert "hips" not in result
        # tiles already uploaded by the failed run are unreachable — drop them
        hips_storage.delete_prefix.assert_called_once()
        assert hips_storage.delete_prefix.call_args.args[0].startswith("img/")

    async def test_tiling_error_message_hides_the_secret(self, tmp_path):
        """A storage error quotes the key it failed on — the secret must not reach
        the logs or the stored result."""
        pipeline, hips_storage = self._make_pipeline(tmp_path)
        secrets_seen = []

        def explode(image_path, wcs_path, storage, base, secret=None):
            secrets_seen.append(secret)
            raise OSError(f"S3 operation failed on /bucket/img/{secret}/Norder3/Npix193.png: denied")

        with patch("worker.pipeline.get_mesh", return_value=[[]]), \
             patch("worker.pipeline.build_hips", side_effect=explode):
            result = await pipeline.process(
                task_id=uuid4(),
                object_key="users/uid/submissions/sid/input/original.jpg",
            )

        secret = secrets_seen[0]
        assert secret and secret not in result["hips_error"]
        assert "img/***" in result["hips_error"]
        # cleanup still targets the real prefix
        assert hips_storage.delete_prefix.call_args.args[0] == f"img/{secret}"

    async def test_cleanup_failure_is_swallowed(self, tmp_path):
        pipeline, hips_storage = self._make_pipeline(tmp_path)
        hips_storage.delete_prefix.side_effect = RuntimeError("bucket unreachable")

        with patch("worker.pipeline.get_mesh", return_value=[[]]), \
             patch("worker.pipeline.build_hips", side_effect=ValueError("bad wcs")):
            result = await pipeline.process(
                task_id=uuid4(),
                object_key="users/uid/submissions/sid/input/original.jpg",
            )

        assert result["hips_error"] == "bad wcs"

    async def test_no_wcs_gives_hips_error(self, tmp_path):
        pipeline, _ = self._make_pipeline(tmp_path, with_wcs=False)

        with patch("worker.pipeline.build_hips") as build:
            result = await pipeline.process(
                task_id=uuid4(),
                object_key="users/uid/submissions/sid/input/original.jpg",
            )

        build.assert_not_called()
        assert "WCS" in result["hips_error"]


class TestGetSolver:
    def test_online_backend(self):
        with patch("worker.pipeline.settings") as mock_settings:
            mock_settings.solver_backend = "online"
            mock_settings.astrometry_api_url = "http://test"
            mock_settings.astrometry_api_key = "test-key"
            solver = get_solver()
            assert type(solver).__name__ == "AstrometryOnlineSolver"

    def test_unknown_backend(self):
        with patch("worker.pipeline.settings") as mock_settings:
            mock_settings.solver_backend = "unknown"
            with pytest.raises(ValueError):
                get_solver()
