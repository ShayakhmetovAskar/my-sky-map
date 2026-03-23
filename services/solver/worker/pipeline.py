"""Plate solving pipeline — orchestrates download → solve → upload.

This module doesn't know about DB, queues, or HTTP handlers.
It receives task data, does the work, returns the result.
"""

import json
import logging
import tempfile
from pathlib import Path
from typing import Optional
from uuid import UUID

from app.config import settings
from app.services.storage import StorageService
from clients.astrometry_net import AstrometryNetClient
from worker.mesh import get_mesh
from worker.solvers.astrometry_online import AstrometryOnlineSolver
from worker.solvers.base import BaseSolver

logger = logging.getLogger(__name__)

MESH_GRID_N = 40
MESH_GRID_M = 40


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
    def __init__(self, storage: StorageService, solver: BaseSolver):
        self.storage = storage
        self.solver = solver

    async def process(self, task_id: UUID, object_key: str, options: Optional[dict] = None) -> dict:
        """Run full pipeline: download → solve → generate mesh → upload → return result."""
        output_prefix = self._output_prefix(object_key, task_id)

        with tempfile.TemporaryDirectory() as temp_dir:
            work_dir = Path(temp_dir)

            image_path = self._download_image(object_key, work_dir)
            solve_result = await self.solver.solve(image_path, options)
            mesh_data = self._generate_mesh(image_path, solve_result.wcs_path)
            result = self._upload_results(output_prefix, solve_result, mesh_data, work_dir)
            result["original_image_key"] = object_key

            logger.info("Task %s completed: ra=%.4f, dec=%.4f", task_id, result["center_ra"], result["center_dec"])
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
    def _output_prefix(object_key: str, task_id: UUID) -> str:
        """Derive S3 output path from input object_key.

        Input:  users/{uid}/submissions/{sid}/input/original.ext
        Output: users/{uid}/submissions/{sid}/tasks/{tid}/output
        """
        parts = object_key.split("/")
        return "/".join(parts[:4]) + f"/tasks/{task_id}/output"


async def process(task_id: UUID, object_key: str, options: Optional[dict] = None) -> dict:
    """Entry point called by worker/main.py."""
    storage = StorageService()
    solver = get_solver()
    pipeline = Pipeline(storage, solver)
    return await pipeline.process(task_id, object_key, options)
