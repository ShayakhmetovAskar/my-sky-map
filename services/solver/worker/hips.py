"""Per-image HiPS tiler — cuts one solved image into 512x512 RGBA HEALPix tiles (APO-83).

Ported from the validated APO-80 spike (``scripts/spike_hips.py``).  Per tile the WCS
is evaluated on a coarse ``GRID x GRID`` lattice (SIP is smooth), image pixel
coordinates are bilinearly interpolated to the 512x512 tile pixels with
``map_coordinates`` and the image is sampled bilinearly.  Pixels outside the image get
alpha 0, with a ramp of ~one tile pixel (measured in image pixels) along the border so
the edge is not a staircase on the orders below ``kmax``.  Tiles with zero alpha are
not written.

Every image gets its own random secret; the tiles live under ``img/{secret}/`` in the
public bucket and the secret reaches the outside world only through ``result.hips.base``
(and ``result.hips_pending`` while the pyramid is being written) — never through a log.
Nothing is read back or composited — one image writes only its own folder.
"""

from __future__ import annotations

import io
import logging
import math
import re
import secrets
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from astropy.wcs.utils import proj_plane_pixel_scales
from PIL import Image
from scipy.ndimage import map_coordinates

from worker.hips_geom import (
    ARCSEC_ORDER0,
    KMAX_CAP,
    TILE,
    angular_separation,
    cone_candidates_by_order,
    kmax_for_pixscale,
    tile_lattice_sky,
)

logger = logging.getLogger(__name__)

GRID = 33                    # WCS lattice per tile; 512 / 32 = 16 px between lattice points
MAX_SIDE = 4096              # images larger than this (long side) are downscaled before sampling
THUMB_SIZE = 256
PNG_COMPRESS_LEVEL = 6
JPEG_QUALITY = 85
CACHE_CONTROL = "public, max-age=86400"
FITS_EXTENSIONS = (".fits", ".fit", ".fts")


SECRET_RE = re.compile(r"img/[A-Za-z0-9_-]{22}")


def new_image_secret() -> str:
    """128-bit URL-safe secret that addresses one image's tiles (22 chars)."""
    return secrets.token_urlsafe(16)


def redact_secrets(text: str) -> str:
    """Blank out image secrets in a message before it is logged.

    A storage error quotes the object key, which contains the capability secret that
    makes the tiles reachable — it must never reach the logs (docs/hips-storage.md).
    """
    return SECRET_RE.sub("img/***", text)


# ---------------------------------------------------------------------------
# Inputs
# ---------------------------------------------------------------------------

def load_wcs(path) -> WCS:
    """Parse the solver's WCS file.

    ``fits.Header.fromfile`` happily returns an empty header for a truncated or
    corrupt file, and ``WCS`` then builds a silent identity transform that would
    smear the image somewhere near (1, 1) — so require real celestial axes.
    """
    try:
        header = fits.Header.fromfile(str(path), endcard=False)
    except Exception:
        header = fits.Header.fromtextfile(str(path))
    wcs = WCS(header)
    if not wcs.has_celestial:
        raise ValueError(f"WCS file has no celestial axes: {Path(path).name}")
    return wcs


def _stretch(plane: np.ndarray) -> np.ndarray:
    """Linear 0.5–99.5 percentile stretch of a float plane to uint8."""
    finite = plane[np.isfinite(plane)]
    if finite.size == 0:
        return np.zeros(plane.shape, dtype=np.uint8)
    lo, hi = np.percentile(finite, [0.5, 99.5])
    if not hi > lo:
        lo, hi = float(finite.min()), float(finite.max())
    if not hi > lo:
        return np.zeros(plane.shape, dtype=np.uint8)
    scaled = (np.nan_to_num(plane, nan=lo) - lo) / (hi - lo)
    return (np.clip(scaled, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)


def _load_fits_rgb(path) -> np.ndarray:
    with fits.open(str(path)) as hdul:
        data = None
        for hdu in hdul:
            if hdu.data is not None and np.ndim(hdu.data) >= 2:
                data = np.asarray(hdu.data, dtype=np.float32)
                break
    if data is None:
        raise ValueError("No image data in FITS file")
    while data.ndim > 3:
        data = data[0]
    if data.ndim == 3:
        planes = [data[i] for i in range(3)] if data.shape[0] == 3 else [data[0]] * 3
    else:
        planes = [data] * 3
    return np.stack([_stretch(p) for p in planes], axis=-1)


def load_image(path) -> np.ndarray:
    """Image as uint8 RGB ``[H, W, 3]``, rows in the order the WCS refers to.

    No EXIF-orientation transpose: astrometry.net solves the raw pixel grid, and the
    spike confirmed that the WCS row index equals the PIL row index for JPEG/PNG.
    """
    path = Path(path)
    if path.suffix.lower() in FITS_EXTENSIONS:
        return _load_fits_rgb(path)
    with Image.open(path) as im:
        return np.asarray(im.convert("RGB"), dtype=np.uint8)


def image_size(path) -> Tuple[int, int]:
    """``(width, height)`` of an image, read from its header — the pixels are not decoded.

    The solve half needs the dimensions (for ``corners`` and the ``width``/``height`` of
    the layer payload) long before the tiler loads the image, and a full decode of a
    6000x4000 frame just to read two numbers is exactly the memory the worker cannot
    spare while three tasks share the pod.
    """
    path = Path(path)
    if path.suffix.lower() in FITS_EXTENSIONS:
        with fits.open(str(path)) as hdul:
            for hdu in hdul:
                shape = getattr(hdu, "shape", ()) or ()
                if len(shape) >= 2:
                    return int(shape[-1]), int(shape[-2])
        raise ValueError("No image data in FITS file")
    with Image.open(path) as im:
        return int(im.width), int(im.height)


def downscale(img: np.ndarray, max_side: int = MAX_SIDE) -> Tuple[np.ndarray, Tuple[float, float]]:
    """Shrink ``img`` so its long side is <= ``max_side``. Returns (image, (sx, sy)).

    ``sx``/``sy`` map original pixel-centre coordinates to the shrunken image:
    ``x' = (x + 0.5) * sx - 0.5``.  Both are 1.0 when nothing was done.
    """
    h, w = img.shape[:2]
    if max(w, h) <= max_side:
        return img, (1.0, 1.0)
    s = max_side / max(w, h)
    nw, nh = max(1, int(round(w * s))), max(1, int(round(h * s)))
    small = Image.fromarray(img, "RGB").resize((nw, nh), Image.Resampling.LANCZOS)
    return np.asarray(small, dtype=np.uint8), (nw / w, nh / h)


def pixel_scale_arcsec(wcs: WCS) -> float:
    """Mean |pixel scale| of the WCS in arcsec/px."""
    scales = np.abs(proj_plane_pixel_scales(wcs)) * 3600.0
    return float(np.mean(scales))


def image_footprint(wcs: WCS, w: int, h: int) -> Tuple[float, float, float]:
    """Centre (deg, deg) and bounding radius (deg) of the image on the sky."""
    xs = np.array([0, w - 1, w - 1, 0, (w - 1) / 2], dtype=np.float64)
    ys = np.array([0, 0, h - 1, h - 1, (h - 1) / 2], dtype=np.float64)
    ra, dec = wcs.all_pix2world(xs, ys, 0)
    if not (np.all(np.isfinite(ra)) and np.all(np.isfinite(dec))):
        raise ValueError("WCS does not map the image corners to the sky")
    c_ra, c_dec = float(ra[-1]), float(dec[-1])
    sep = angular_separation(np.radians(ra[:4]), np.radians(dec[:4]), math.radians(c_ra), math.radians(c_dec))
    return c_ra, c_dec, float(np.degrees(sep.max()))


def image_corners(wcs: WCS, w: int, h: int) -> List[List[float]]:
    """``[[ra, dec] x 4]`` of the frame corners (top-left, top-right, bottom-right, bottom-left)."""
    xs = np.array([0, w - 1, w - 1, 0], dtype=np.float64)
    ys = np.array([0, 0, h - 1, h - 1], dtype=np.float64)
    ra, dec = wcs.all_pix2world(xs, ys, 0)
    return [[round(float(r), 6), round(float(d), 6)] for r, d in zip(ra, dec)]


# ---------------------------------------------------------------------------
# Tiles
# ---------------------------------------------------------------------------

def cut_tile(wcs: WCS, img: np.ndarray, order: int, pix: int, *,
             scale: Tuple[float, float] = (1.0, 1.0), edge_ramp_px: float = 1.0,
             center: Optional[Tuple[float, float]] = None, max_sep_deg: Optional[float] = None,
             grid: int = GRID) -> Optional[np.ndarray]:
    """RGBA uint8 ``[TILE, TILE, 4]`` tile, or ``None`` if the tile does not touch the image.

    ``img`` may be a downscaled copy of the image the WCS describes; ``scale`` is the
    per-axis factor from ``downscale``.  ``center``/``max_sep_deg`` skip lattice points
    too far from the image for the (iterative, SIP) inverse WCS to be meaningful.
    """
    h, w = img.shape[:2]
    sx, sy = scale
    ra, dec = tile_lattice_sky(order, pix, grid)
    ok = np.isfinite(ra) & np.isfinite(dec)
    if center is not None and max_sep_deg is not None:
        sep = angular_separation(np.radians(ra), np.radians(dec),
                                 math.radians(center[0]), math.radians(center[1]))
        ok &= np.degrees(sep) <= max_sep_deg
    if not ok.any():
        return None

    px = np.full(ra.shape, np.nan)
    py = np.full(ra.shape, np.nan)
    with np.errstate(all="ignore"):
        x, y = wcs.all_world2pix(ra[ok], dec[ok], 0, quiet=True)
    px[ok] = (np.asarray(x, dtype=np.float64) + 0.5) * sx - 0.5
    py[ok] = (np.asarray(y, dtype=np.float64) + 0.5) * sy - 0.5
    bad = ~(np.isfinite(px) & np.isfinite(py))
    px[bad] = np.nan
    py[bad] = np.nan
    if bad.all():
        return None

    # cheap reject: the whole lattice is outside the image (with a one-lattice-cell margin)
    margin = max(w, h) / (grid - 1)
    if (np.nanmax(px) < -margin or np.nanmin(px) > w - 1 + margin
            or np.nanmax(py) < -margin or np.nanmin(py) > h - 1 + margin):
        return None

    # interpolate lattice pixel coords to the 512x512 pixel centres
    c = (np.arange(TILE) + 0.5) / TILE * (grid - 1)          # lattice coordinate of each pixel centre
    gj, gi = np.meshgrid(c, c, indexing="ij")                # gj: row (v), gi: column (u)
    px_f = map_coordinates(np.nan_to_num(px, nan=-1e9), [gj, gi], order=1, mode="nearest")
    py_f = map_coordinates(np.nan_to_num(py, nan=-1e9), [gj, gi], order=1, mode="nearest")
    inside = (px_f >= 0) & (px_f <= w - 1) & (py_f >= 0) & (py_f <= h - 1)
    if not inside.any():
        return None

    # Anti-aliased edge: alpha ramps over ~one TILE pixel (measured in image pixels),
    # otherwise the image border is a staircase wherever a tile pixel spans several
    # image pixels (every order below kmax).
    dist = np.minimum(np.minimum(px_f, w - 1 - px_f), np.minimum(py_f, h - 1 - py_f))
    alpha = np.clip(dist / max(1.0, edge_ramp_px), 0.0, 1.0)
    alpha8 = np.where(inside, np.rint(alpha * 255), 0).astype(np.uint8)
    if not alpha8.any():
        return None

    tile = np.zeros((TILE, TILE, 4), dtype=np.uint8)
    for ch in range(3):
        v = map_coordinates(img[:, :, ch], [py_f, px_f], output=np.float32, order=1, mode="constant", cval=0.0)
        tile[:, :, ch] = np.clip(np.rint(v), 0, 255).astype(np.uint8)
    tile[:, :, 3] = alpha8
    return tile


def encode_png(tile: np.ndarray) -> bytes:
    buf = io.BytesIO()
    Image.fromarray(tile, "RGBA").save(buf, format="PNG", compress_level=PNG_COMPRESS_LEVEL)
    return buf.getvalue()


def make_thumb(img: np.ndarray, size: int = THUMB_SIZE) -> bytes:
    """JPEG thumbnail (long side ``size``), re-encoded from pixels: no EXIF/XMP/ICC."""
    im = Image.fromarray(np.ascontiguousarray(img), "RGB")   # fresh image: carries no metadata
    im.thumbnail((size, size), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=JPEG_QUALITY)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def build_hips(image_path, wcs_path, storage, public_base_url: str, *,
               max_side: int = MAX_SIDE, kmax_cap: int = KMAX_CAP,
               secret: Optional[str] = None) -> Dict[str, Any]:
    """Cut, encode and upload every tile of one image; return the ``result`` fragment.

    ``storage`` needs ``upload_bytes(key, data, content_type, cache_control=...)``.
    Returns ``{"hips": {kmax, tiles, moc, base, thumb, seconds}, "corners": [[ra, dec] x 4],
    "width": w, "height": h}``.  ``corners``/``width``/``height`` are also written by the
    solve half (``Pipeline._frame_geometry``) so a ``tiling`` image already carries them;
    the values are identical, this call just restates them.
    Tiles are processed one at a time; nothing is held in memory beyond the image itself.
    """
    t0 = time.monotonic()
    wcs = load_wcs(wcs_path)
    img = load_image(image_path)
    h0, w0 = img.shape[:2]
    corners = image_corners(wcs, w0, h0)
    c_ra, c_dec, radius = image_footprint(wcs, w0, h0)

    img, (sx, sy) = downscale(img, max_side)
    pixscale = pixel_scale_arcsec(wcs) / ((sx + sy) / 2)      # arcsec per (possibly shrunken) pixel
    kmax = kmax_for_pixscale(pixscale, cap=kmax_cap)
    max_sep = min(89.0, 1.5 * radius + 2.0)                   # TAN is undefined past 90 deg anyway

    secret = secret or new_image_secret()
    prefix = f"img/{secret}"
    base = f"{public_base_url.rstrip('/')}/{prefix}"

    moc: Dict[str, List[int]] = {}
    tiles = 0
    for k, candidates in cone_candidates_by_order(kmax, c_ra, c_dec, radius):
        edge_ramp_px = (ARCSEC_ORDER0 / 2 ** k) / pixscale      # image px per tile px at this order
        written: List[int] = []
        for pix in (int(p) for p in candidates):
            tile = cut_tile(wcs, img, k, pix, scale=(sx, sy), edge_ramp_px=edge_ramp_px,
                            center=(c_ra, c_dec), max_sep_deg=max_sep)
            if tile is None:
                continue
            storage.upload_bytes(f"{prefix}/Norder{k}/Npix{pix}.png", encode_png(tile),
                                 "image/png", cache_control=CACHE_CONTROL)
            written.append(pix)
        if written:
            moc[str(k)] = written
        tiles += len(written)

    storage.upload_bytes(f"{prefix}/thumb.jpg", make_thumb(img), "image/jpeg", cache_control=CACHE_CONTROL)

    seconds = round(time.monotonic() - t0, 1)
    # NB: the secret is deliberately not logged.
    logger.info("hips: %dx%d px, %.2f\"/px, kmax %d, %d tiles, %.1fs", w0, h0, pixscale, kmax, tiles, seconds)
    return {
        "hips": {
            "kmax": kmax,
            "tiles": tiles,
            "moc": moc,
            "base": base,
            "thumb": f"{base}/thumb.jpg",
            "seconds": seconds,
        },
        "corners": corners,
        "width": w0,
        "height": h0,
    }
