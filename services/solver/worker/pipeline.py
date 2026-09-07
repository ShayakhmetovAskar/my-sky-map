"""Plate solving pipeline — orchestrates download → solve → upload → tile.

This module doesn't know about DB, queues, or HTTP handlers.
It receives task data, does the work, returns the result.
"""

import asyncio
import json
import logging
import tempfile
from pathlib import Path
from typing import Awaitable, Callable, Optional
from uuid import UUID

from app.config import settings
from app.services.hips_storage import HipsStorage
from app.services.storage import StorageService
from clients.astrometry_net import AstrometryNetClient
from worker.hips import build_hips, image_corners, image_size, load_wcs, new_image_secret, redact_secrets
from worker.mesh import get_mesh
from worker.solvers.astrometry_online import AstrometryOnlineSolver
from worker.solvers.base import BaseSolver

logger = logging.getLogger(__name__)

MESH_GRID_N = 40
MESH_GRID_M = 40

# Called with the solve result once it is uploaded, right before tiling starts.
OnSolved = Callable[[dict], Awaitable[None]]


def get_solver() -> BaseSolver:
    """Factory: create solver based on config."""
    if settings.solver_backend == "online":
        client = AstrometryNetClient(
            api_url=settings.astrometry_api_url,
            api_key=settings.astrometry_api_key,
        )
        return AstrometryOnlineSolver(client)
    raise ValueError(f"Unknown solver backend: {settings.solver_backend}")


class Pipeline:
    def __init__(self, storage: StorageService, solver: BaseSolver, hips_storage: Optional[HipsStorage] = None):
        self.storage = storage
        self.solver = solver
        self.hips_storage = hips_storage  # None disables the tiling step

    async def process(self, task_id: UUID, object_key: str, options: Optional[dict] = None,
                      on_solved: Optional[OnSolved] = None) -> dict:
        """Run full pipeline: download → solve → generate mesh → upload → tile → return result.

        ``on_solved`` receives the solve result before the (long) tiling step so the
        caller can publish it and flip the task to ``tiling``.
        """
        output_prefix = self._output_prefix(object_key, task_id)

        with tempfile.TemporaryDirectory() as temp_dir:
            work_dir = Path(temp_dir)

            image_path = self._download_image(object_key, work_dir)
            solve_result = await self.solver.solve(image_path, options)
            mesh_data = self._generate_mesh(image_path, solve_result.wcs_path)
            result = self._upload_results(output_prefix, solve_result, mesh_data, work_dir)
            result.update(self._frame_geometry(image_path, solve_result.wcs_path))
            result["original_image_key"] = object_key
            logger.info("Task %s solved: ra=%.4f, dec=%.4f", task_id, result["center_ra"], result["center_dec"])

            if self.hips_storage is not None:
                # The secret is minted here, before the first upload, and handed to the
                # caller as `hips_pending` so it is committed with the solve result. A
                # delete or an account erasure that lands mid-tiling can then find the
                # prefix; a crash leaves it recoverable instead of orphaned forever.
                secret = new_image_secret()
                if on_solved is not None:
                    pending = f"{self.hips_storage.public_base_url.rstrip('/')}/img/{secret}"
                    await on_solved({**result, "hips_pending": pending})
                # `hips_pending` is deliberately not in the dict below: the final write
                # replaces the whole result, so the key disappears once tiling is over.
                result.update(await self._build_hips(image_path, solve_result.wcs_path, secret))

            logger.info("Task %s completed", task_id)
            return result

    def _download_image(self, object_key: str, work_dir: Path) -> Path:
        """Download input image from MinIO to local temp dir."""
        ext = Path(object_key).suffix
        local_path = work_dir / f"input{ext}"
        logger.info("Downloading %s", object_key)
        self.storage.download_object(object_key, str(local_path))
        return local_path

    def _generate_mesh(self, image_path: Path, wcs_path: Optional[Path]) -> Optional[list]:
        """Generate RA/Dec mesh grid from WCS header."""
        if not wcs_path or not wcs_path.exists():
            return None
        try:
            mesh = get_mesh(MESH_GRID_N, MESH_GRID_M, str(image_path), str(wcs_path))
            logger.info("Generated %dx%d mesh", MESH_GRID_N, MESH_GRID_M)
            return mesh
        except Exception as e:
            logger.warning("Mesh generation failed: %s", e)
            return None

    def _upload_results(self, output_prefix: str, solve_result, mesh_data: Optional[list], work_dir: Path) -> dict:
        """Upload solve outputs to MinIO, return result dict with object keys (not presigned URLs)."""
        result = {
            "center_ra": solve_result.center_ra,
            "center_dec": solve_result.center_dec,
            "field_of_view": solve_result.field_of_view,
            "pixel_scale": solve_result.pixel_scale,
            "orientation": solve_result.orientation,
        }

        if solve_result.astrometry_job_id:
            base = settings.astrometry_api_url.rstrip("/").removesuffix("/api")
            result["astrometry_job_url"] = f"{base}/jobs/{solve_result.astrometry_job_id}"

        if solve_result.annotated_image_path and solve_result.annotated_image_path.exists():
            key = f"{output_prefix}/annotated.png"
            self.storage.upload_file(key, str(solve_result.annotated_image_path), "image/png")
            result["annotated_image_key"] = key

        if solve_result.wcs_path and solve_result.wcs_path.exists():
            key = f"{output_prefix}/wcs.fits"
            self.storage.upload_file(key, str(solve_result.wcs_path), "application/fits")
            result["wcs_key"] = key

        if mesh_data is not None:
            mesh_path = work_dir / "mesh.json"
            mesh_path.write_text(json.dumps(mesh_data))
            key = f"{output_prefix}/mesh.json"
            self.storage.upload_file(key, str(mesh_path), "application/json")
            result["mesh_json_key"] = key

        return result

    @staticmethod
    def _frame_geometry(image_path: Path, wcs_path: Optional[Path]) -> dict:
        """``corners`` + ``width``/``height`` of the frame, computed in the solve half.

        The UI draws the outline of an image that is still ``tiling`` (design §7) and the
        layer payload carries its dimensions, but ``build_hips`` only returns those when
        the whole pyramid is done — so they are derived here, from the WCS that is already
        on disk, and published with the solve result. ``build_hips`` recomputes the same
        values and simply overwrites them.

        Never raises: this is metadata, and losing it must not fail a solve.
        """
        if not wcs_path or not wcs_path.exists():
            return {}
        try:
            width, height = image_size(image_path)
            return {
                "corners": image_corners(load_wcs(wcs_path), width, height),
                "width": width,
                "height": height,
            }
        except Exception as e:
            logger.warning("Frame geometry unavailable: %s", e)
            return {}

    async def _build_hips(self, image_path: Path, wcs_path: Optional[Path], secret: str) -> dict:
        """Tiling step (APO-83). Never raises: a failed sky layer must not fail the solve.

        Returns ``{"hips": ..., "corners": ...}`` on success, ``{"hips_error": msg}`` otherwise.
        The tiler is CPU-bound numpy, so it runs in a thread and keeps the event loop free.
        ``secret`` comes from :meth:`process`, which has already published it as
        ``hips_pending``, so a half-written pyramid is reachable from the database as well
        as from the cleanup below. Error messages are redacted because a storage error
        quotes the key it failed on.
        """
        try:
            if not wcs_path or not wcs_path.exists():
                raise FileNotFoundError("solver returned no WCS file")
            built = await asyncio.to_thread(
                build_hips, image_path, wcs_path, self.hips_storage, self.hips_storage.public_base_url,
                secret=secret,
            )
            hips = built["hips"]
            logger.info("Sky layer built: kmax=%d, %d tiles, %.1fs", hips["kmax"], hips["tiles"], hips["seconds"])
            return built
        except Exception as e:
            message = redact_secrets(str(e))
            logger.warning("Sky layer build failed: %s", message)
            await self._discard_partial_hips(secret)
            return {"hips_error": message}

    async def _discard_partial_hips(self, secret: str) -> None:
        """Best-effort removal of the tiles a failed run already uploaded.

        The final write replaces `hips_pending` with `hips_error`, so once the failure is
        committed nothing references them and they would sit in the public bucket forever.
        A crash before that write is covered by `_recover_zombie_tasks`, which reads the
        prefix back out of `hips_pending`.
        """
        try:
            removed = await asyncio.to_thread(self.hips_storage.delete_prefix, f"img/{secret}")
            if removed:
                logger.info("Discarded %d tiles of the failed sky layer", removed)
        except Exception as e:
            logger.warning("Could not clean up the failed sky layer: %s", redact_secrets(str(e)))

    @staticmethod
    def _output_prefix(object_key: str, task_id: UUID) -> str:
        """Derive S3 output path from input object_key.

        Input:  users/{uid}/submissions/{sid}/input/original.ext
        Output: users/{uid}/submissions/{sid}/tasks/{tid}/output
        """
        parts = object_key.split("/")
        return "/".join(parts[:4]) + f"/tasks/{task_id}/output"


async def process(task_id: UUID, object_key: str, options: Optional[dict] = None,
                  on_solved: Optional[OnSolved] = None) -> dict:
    """Entry point called by worker/main.py."""
    storage = StorageService()
    solver = get_solver()
    hips_storage = HipsStorage()
    pipeline = Pipeline(storage, solver, hips_storage)
    return await pipeline.process(task_id, object_key, options, on_solved=on_solved)
