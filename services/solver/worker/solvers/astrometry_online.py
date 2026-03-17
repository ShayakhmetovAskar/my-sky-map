"""Astrometry.net online solver — uses nova.astrometry.net API via client."""

import logging
from pathlib import Path
from typing import Optional

from clients.astrometry_net import AstrometryNetClient, AstrometryApiError
from .base import BaseSolver, SolveError, SolveResult

logger = logging.getLogger(__name__)


class AstrometryOnlineSolver(BaseSolver):
    def __init__(self, client: AstrometryNetClient):
        self.client = client

    async def solve(self, file_path: Path, options: Optional[dict] = None) -> SolveResult:
        """Upload image to nova.astrometry.net, wait for result, download outputs."""
        output_dir = file_path.parent

        try:
            session = await self.client.login()

            # Build solver hints from options
            hints = self._build_hints(options)

            subid = await self.client.upload(file_path, session, hints)

            logger.info("Waiting for job...")
            job_id = await self.client.wait_for_job(subid)

            logger.info("Waiting for solve result...")
            await self.client.wait_for_result(job_id)

            # Fetch calibration
            cal = await self.client.get_calibration(job_id)
            logger.info("Calibration: ra=%.4f, dec=%.4f, pixscale=%.3f", cal["ra"], cal["dec"], cal["pixscale"])

            # Download outputs
            annotated_path = output_dir / "annotated.png"
            await self.client.download_annotated_image(job_id, annotated_path)

            wcs_path = output_dir / "wcs.fits"
            await self.client.download_wcs(job_id, wcs_path)

            return SolveResult(
                center_ra=cal["ra"],
                center_dec=cal["dec"],
                field_of_view=cal["radius"] * 2,
                pixel_scale=cal["pixscale"],
                orientation=cal["orientation"],
                annotated_image_path=annotated_path,
                wcs_path=wcs_path,
            )

        except AstrometryApiError as e:
            raise SolveError("astrometry_api_error", str(e)) from e

    @staticmethod
    def _build_hints(options: Optional[dict]) -> Optional[dict]:
        """Convert solver options to astrometry.net API hints."""
        if not options:
            return None

        hints = {}
        focal_length = options.get("focal_length")
        pixel_size = options.get("pixel_size")

        if focal_length and pixel_size:
            # pixel_scale (arcsec/px) = 206.265 * pixel_size_um / focal_length_mm
            pixel_scale = 206.265 * pixel_size / focal_length
            hints["scale_units"] = "arcsecperpix"
            hints["scale_lower"] = pixel_scale * 0.8
            hints["scale_upper"] = pixel_scale * 1.2

        return hints if hints else None
