"""My Sky schemas.

`SkyImage` is the whitelist payload shared by `GET /me/sky` and the public
`GET /public/sky/{token}` (APO-88): it must never carry `user_id`, `submission_id`,
object keys, presigned URLs or the original filename.
"""

from __future__ import annotations

from datetime import date as date_type
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SkyImageStatus(str, Enum):
    ready = "ready"      # solved and tiled: `result.hips` present
    tiling = "tiling"    # solved, tiles are being built
    failed = "failed"    # solved but tiling failed: `completed` without `result.hips`


# Task statuses that may reach the layer at all; pending, failed and cancelled tasks
# never do. Shared by `/me/sky` and `/public/sky/{token}` so the two cannot drift.
LISTED_TASK_STATUSES = ("completed", "tiling")


# --- Default title: "21h30m +12°10′ · 2026-09-03" ---

def format_ra_hm(ra_deg: float) -> str:
    """322.5 → '21h30m' (rounded to the minute, wraps at 24h)."""
    total_min = round(ra_deg / 15 * 60) % (24 * 60)
    hours, minutes = divmod(total_min, 60)
    return f"{hours:02d}h{minutes:02d}m"


def format_dec_dm(dec_deg: float) -> str:
    """12.17 → '+12°10′' (rounded to the arcminute, clamped to ±90°)."""
    sign = "-" if dec_deg < 0 else "+"
    total_min = min(round(abs(dec_deg) * 60), 90 * 60)
    degrees, minutes = divmod(total_min, 60)
    return f"{sign}{degrees:02d}°{minutes:02d}′"


def default_title(ra_deg: float, dec_deg: float, date: date_type) -> str:
    """Title used when the user has not named the image."""
    return f"{format_ra_hm(ra_deg)} {format_dec_dm(dec_deg)} · {date.isoformat()}"


# --- Status rules ---

def sky_status(task) -> Optional[SkyImageStatus]:
    """Layer status of a task, or None when the task has not been solved."""
    if task.status == "tiling":
        return SkyImageStatus.tiling
    if task.status != "completed":
        return None
    result = task.result or {}
    if result.get("hips") and not result.get("hips_error"):
        return SkyImageStatus.ready
    return SkyImageStatus.failed


# --- Schemas ---

class SkyImage(BaseModel):
    """One solved image of the sky layer.

    Tile metadata (`kmax`, `moc`, `base`, `thumb`) is present only for `ready` images;
    `failed` images are never listed.
    """

    id: UUID
    title: str
    date: date_type = Field(..., description="Upload date")
    ra: float = Field(..., description="Field center RA, degrees")
    dec: float = Field(..., description="Field center Dec, degrees")
    fov: float = Field(..., description="Field diameter, degrees")
    pixscale: float = Field(..., description="Pixel scale, arcsec/px")
    orientation: float = Field(..., description="Rotation east of north, degrees")
    kmax: Optional[int] = Field(None, description="Deepest HiPS order of the image pyramid")
    corners: Optional[list[tuple[float, float]]] = Field(None, description="Frame corners [ra, dec] from WCS")
    moc: Optional[dict[str, list[int]]] = Field(None, description="Tile coverage per order: {order: [npix, ...]}")
    base: Optional[str] = Field(None, description="Public base URL of the tile pyramid")
    thumb: Optional[str] = Field(None, description="Public thumbnail URL")
    width: Optional[int] = Field(None, description="Image width, px")
    height: Optional[int] = Field(None, description="Image height, px")
    status: SkyImageStatus

    @classmethod
    def from_task(cls, task, *, date: date_type, title: Optional[str] = None, **extra: Any):
        """Map a solved task onto the layer payload.

        Returns None when the image must not be listed: not solved, tiling failed,
        or the worker has not persisted the calibration yet. `extra` fields go to
        subclasses (e.g. `MySkyImage.filename`).
        """
        status = sky_status(task)
        if status is None or status is SkyImageStatus.failed:
            return None
        result = task.result or {}
        if "center_ra" not in result:
            return None
        hips = (result.get("hips") or {}) if status is SkyImageStatus.ready else {}
        base = hips.get("base")
        return cls(
            id=task.id,
            title=title or default_title(result["center_ra"], result["center_dec"], date),
            date=date,
            ra=result["center_ra"],
            dec=result["center_dec"],
            fov=result["field_of_view"],
            pixscale=result["pixel_scale"],
            orientation=result["orientation"],
            kmax=hips.get("kmax"),
            corners=result.get("corners"),
            moc=hips.get("moc"),
            base=base,
            thumb=hips.get("thumb") or (f"{base}/thumb.jpg" if base else None),
            width=result.get("width", hips.get("width")),
            height=result.get("height", hips.get("height")),
            status=status,
            **extra,
        )


class MySkyImage(SkyImage):
    """Owner's view: `SkyImage` plus the original filename (never exposed publicly)."""

    filename: str


class MySkyResponse(BaseModel):
    images: list[MySkyImage]


class PublicSkyResponse(BaseModel):
    """Payload of a shared collection (APO-88).

    `images` is typed as the base `SkyImage` on purpose: response_model filtering is the
    second line of defence, so even a `MySkyImage` handed to this model would be
    serialized without `filename`.
    """

    title: str
    images: list[SkyImage]
