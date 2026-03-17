"""Unit tests for astrometry.net online solver."""

import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

from clients.astrometry_net import AstrometryApiError
from worker.solvers.astrometry_online import AstrometryOnlineSolver
from worker.solvers.base import SolveError


def _make_mock_client():
    client = AsyncMock()
    client.login.return_value = "session-123"
    client.upload.return_value = 12345
    client.wait_for_job.return_value = 67890
    client.wait_for_result.return_value = None
    client.get_calibration.return_value = {
        "ra": 83.857,
        "dec": -5.411,
        "radius": 0.4,
        "pixscale": 1.6,
        "orientation": 340.0,
    }
    client.download_annotated_image.return_value = None
    client.download_wcs.return_value = None
    return client


class TestAstrometryOnlineSolver:
    async def test_solve_success(self, tmp_path):
        client = _make_mock_client()

        # Create a fake image file
        image = tmp_path / "test.jpg"
        image.write_bytes(b"fake image data")

        # Make download methods create output files
        async def fake_download_annotated(job_id, path):
            path.write_bytes(b"annotated png")
        async def fake_download_wcs(job_id, path):
            path.write_bytes(b"wcs fits")

        client.download_annotated_image.side_effect = fake_download_annotated
        client.download_wcs.side_effect = fake_download_wcs

        solver = AstrometryOnlineSolver(client)
        result = await solver.solve(image)

        assert result.center_ra == 83.857
        assert result.center_dec == -5.411
        assert result.field_of_view == 0.8  # radius * 2
        assert result.pixel_scale == 1.6
        assert result.annotated_image_path.exists()
        assert result.wcs_path.exists()

        client.login.assert_called_once()
        client.upload.assert_called_once()
        client.wait_for_job.assert_called_once()
        client.wait_for_result.assert_called_once()

    async def test_solve_api_error(self, tmp_path):
        client = _make_mock_client()
        client.login.side_effect = AstrometryApiError("Login failed")

        image = tmp_path / "test.jpg"
        image.write_bytes(b"fake")

        solver = AstrometryOnlineSolver(client)
        with pytest.raises(SolveError) as exc_info:
            await solver.solve(image)
        assert exc_info.value.code == "astrometry_api_error"


class TestBuildHints:
    def test_with_focal_and_pixel(self):
        hints = AstrometryOnlineSolver._build_hints({
            "focal_length": 200,
            "pixel_size": 3.75,
        })
        assert hints is not None
        assert hints["scale_units"] == "arcsecperpix"
        # 206.265 * 3.75 / 200 = 3.867
        assert 3.0 < hints["scale_lower"] < hints["scale_upper"] < 5.0

    def test_without_options(self):
        assert AstrometryOnlineSolver._build_hints(None) is None

    def test_partial_options(self):
        hints = AstrometryOnlineSolver._build_hints({"focal_length": 200})
        assert hints is None
