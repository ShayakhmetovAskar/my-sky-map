"""Base solver interface — strategy pattern for plate solving backends."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class SolveResult:
    """Result of a plate solving operation."""
    center_ra: float
    center_dec: float
    field_of_view: float
    pixel_scale: float
    orientation: float
    num_stars_matched: int = 0
    annotated_image_path: Optional[Path] = None
    wcs_path: Optional[Path] = None
    astrometry_job_id: Optional[int] = None


class BaseSolver(ABC):
    """Abstract solver — implement this to add a new solving backend.

    To add a new solver:
    1. Create a new file in worker/solvers/
    2. Implement a class inheriting BaseSolver
    3. Implement solve() method
    4. Register in pipeline.py factory (get_solver())
    """

    @abstractmethod
    async def solve(self, file_path: Path, options: Optional[dict] = None) -> SolveResult:
        """Solve an image and return calibration data.

        Args:
            file_path: Path to the image file (FITS, JPEG, PNG)
            options: Optional solver hints (focal_length, pixel_size, etc.)

        Returns:
            SolveResult with coordinates, calibration, and output file paths

        Raises:
            SolveError: if solving fails
        """
        ...


class SolveError(Exception):
    """Raised when plate solving fails."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)
