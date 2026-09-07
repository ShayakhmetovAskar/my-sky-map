"""HiPS tile geometry — a 1:1 port of ``frontend/src/utils/healpix.js``.

The renderer (``MeshLoader.createTileGeometry``) places tile ``(order, pix)`` on the
sphere with ``hipspix2healpix`` + ``heal2equatorial`` and then adds ``PI`` to RA.
The worker samples every tile pixel at exactly that sky position, so an image lands
where the renderer will draw it — no HiPS-standard orientation guessing. Verified
against the DSS backdrop in the APO-80 spike (identity orientation, 0 px shift).

Everything here is pure numpy; ``pix`` may be a scalar or an int array and ``u``/``v``
may be arrays, with normal broadcasting.  Keep the arithmetic in the same order as
the JS so the two stay bit-for-bit comparable (see ``tests/unit/test_hips_geom.py``).
"""

from __future__ import annotations

import math
from typing import Iterator, Tuple

import numpy as np

TILE = 512                  # tile side in pixels (HiPS standard, same as the DSS backdrop)
ARCSEC_ORDER0 = 412.2       # tile pixel at order 0: 58.63 deg * 3600 / 512
CELL_DEG_ORDER0 = 58.63     # mean HEALPix cell width at nside = 1
KMAX_CAP = 8                # deepest order we ever cut (also the limit of nest2xyf's 8-bit ix/iy)

# Padding for the cone search, in units of the mean cell width at that order.  Must be
# >= the largest centre-to-corner distance of any cell at that order (worst case is the
# polar cap at order 0: 48.19 deg = 0.82 cell widths); 1.2 leaves margin for the
# elongated cells near the base-cell boundaries at higher orders.
CONE_PAD_FACTOR = 1.2


# ---------------------------------------------------------------------------
# healpix.js port
# ---------------------------------------------------------------------------

def _ctab() -> list:
    def Z(a):
        return [a, a + 1, a + 256, a + 257]

    def Y(a):
        return Z(a) + Z(a + 2) + Z(a + 512) + Z(a + 514)

    def X(a):
        return Y(a) + Y(a + 4) + Y(a + 1024) + Y(a + 1028)

    return X(0) + X(8) + X(2048) + X(2056)


CTAB = np.array(_ctab(), dtype=np.int64)

FACES = np.array(
    [(-3, 0), (-1, 0), (1, 0), (3, 0),
     (-4, -1), (-2, -1), (0, -1), (2, -1),
     (-3, -2), (-1, -2), (1, -2), (3, -2)],
    dtype=np.float64,
)


def nest2xyf(nside: int, pix):
    """Nested pixel index -> (face, ix, iy). Vectorised over ``pix``."""
    pix = np.asarray(pix, dtype=np.int64)
    npface = nside * nside
    face = pix // npface
    p = pix & (npface - 1)
    raw = (p & 0x5555) | ((p & 0x55550000) >> 15)
    ix = CTAB[raw & 0xFF] | (CTAB[raw >> 8] << 4)
    p = p >> 1
    raw = (p & 0x5555) | ((p & 0x55550000) >> 15)
    iy = CTAB[raw & 0xFF] | (CTAB[raw >> 8] << 4)
    return face, ix, iy


def hipspix2healpix(nside: int, pix, x, y):
    """(x, y) in [0, 1]^2 inside tile ``pix`` at ``nside`` -> HEALPix plane (hx, hy)."""
    face, ix, iy = nest2xyf(nside, pix)
    hx = FACES[face, 0] * (math.pi / 4)
    hy = FACES[face, 1] * (math.pi / 4)

    hx = hx + (ix - iy) * math.pi / 4 / nside
    hy = hy + (ix + iy) * math.pi / 4 / nside

    hx = hx + math.pi / 4 / nside
    hy = hy + math.pi / 4 / nside

    hx = hx - (math.pi / 4 / nside * (np.asarray(x, dtype=np.float64) + y))
    hy = hy + (math.pi / 4 / nside * (np.asarray(x, dtype=np.float64) - y))
    return hx, hy


def heal2equatorial(xs, ys):
    """HEALPix plane -> (ra, dec) in radians. Vectorised port of the JS.

    https://iopscience.iop.org/article/10.1086/427976/pdf
    """
    PI = np.pi
    xs = np.asarray(xs, dtype=np.float64)
    ys = np.asarray(ys, dtype=np.float64)
    xs, ys = np.broadcast_arrays(xs, ys)
    phi = np.empty(xs.shape, dtype=np.float64)
    theta = np.empty(xs.shape, dtype=np.float64)

    # 1) equatorial zone: |y_s| < pi/4
    eq = np.abs(ys) < PI / 4
    phi[eq] = xs[eq]
    theta[eq] = np.arccos(np.clip((8 / (3 * PI)) * ys[eq], -1, 1))

    # 2) polar zone: |y_s| >= pi/4
    p = ~eq
    x_t = np.mod(xs[p], PI / 2)                      # JS: % then + pi/2 if negative
    abs_ys = np.abs(ys[p])
    with np.errstate(divide="ignore", invalid="ignore"):
        phi[p] = xs[p] - ((abs_ys - PI / 4) / (abs_ys - PI / 2)) * (x_t - PI / 4)
    bracket = 1 - (1 / 3) * np.power(2 - (4 * abs_ys) / PI, 2)
    sign = np.where(ys[p] >= 0, 1.0, -1.0)
    theta[p] = np.arccos(np.clip(bracket * sign, -1, 1))

    ra = np.mod(phi, 2 * PI)
    ra = np.where(np.isfinite(ra), ra, 0.0)          # JS: `if (!ra) ra = 0` (exact pole -> phi is NaN)
    dec = PI / 2 - theta
    return ra, dec


# ---------------------------------------------------------------------------
# Tile <-> sky helpers (renderer convention: ra += pi)
# ---------------------------------------------------------------------------

def tile_uv_to_radec(order: int, pix, u, v):
    """Sky position (radians) of texture coordinate (u, v) of tile ``pix`` at ``order``.

    Includes the ``ra += PI`` that ``createTileGeometry`` applies, wrapped to [0, 2pi).
    """
    nside = 1 << order
    hx, hy = hipspix2healpix(nside, pix, u, v)
    ra, dec = heal2equatorial(hx, hy)
    return np.mod(ra + np.pi, 2 * np.pi), dec


def tile_lattice_sky(order: int, pix: int, grid: int):
    """Sky coords (deg) of a ``grid x grid`` lattice over one tile, as [row, col] arrays.

    Lattice point (i, j): u = i / (grid - 1), v = 1 - j / (grid - 1).  Row j = 0 is the
    TOP row of the PNG (three.js flipY: texture v = 1 is the first row of the image).
    This is the only place where image-row vs texture-v is decided.
    """
    t = np.linspace(0.0, 1.0, grid)
    uu, vv = np.meshgrid(t, 1.0 - t)                 # uu[j, i] = t_i, vv[j, i] = 1 - t_j
    ra, dec = tile_uv_to_radec(order, pix, uu, vv)
    return np.degrees(ra), np.degrees(dec)


def tile_centers(order: int, pix):
    """Sky positions (radians) of tile centres, vectorised over ``pix``."""
    pix = np.asarray(pix, dtype=np.int64)
    return tile_uv_to_radec(order, pix, 0.5, 0.5)


def angular_separation(ra1, dec1, ra2, dec2):
    """Great-circle distance (radians) — Vincenty form, stable at 0 and pi."""
    sdlon = np.sin(ra2 - ra1)
    cdlon = np.cos(ra2 - ra1)
    slat1, clat1 = np.sin(dec1), np.cos(dec1)
    slat2, clat2 = np.sin(dec2), np.cos(dec2)
    num1 = clat2 * sdlon
    num2 = clat1 * slat2 - slat1 * clat2 * cdlon
    den = slat1 * slat2 + clat1 * clat2 * cdlon
    return np.arctan2(np.hypot(num1, num2), den)


def kmax_for_pixscale(pixscale_arcsec: float, cap: int = KMAX_CAP) -> int:
    """Deepest order for an image: tile pixel at order k is 412.2"/2^k, match the image pixel.

    6"/px -> 6, 1.5"/px -> 8, 30"/px -> 4; clamped to [0, cap].
    """
    if not (math.isfinite(pixscale_arcsec) and pixscale_arcsec > 0):
        raise ValueError(f"invalid pixel scale: {pixscale_arcsec!r}")
    k = round(math.log2(ARCSEC_ORDER0 / pixscale_arcsec))
    return int(min(cap, max(0, k)))


def cone_candidates_by_order(kmax: int, ra_deg: float, dec_deg: float, radius_deg: float,
                             pad_factor: float = CONE_PAD_FACTOR) -> Iterator[Tuple[int, np.ndarray]]:
    """Yield ``(order, pix_array)`` for order 0..kmax: cells that may intersect the disk.

    Pure-numpy stand-in for ``astropy_healpix.cone_search_lonlat``: a cell is kept when
    its centre is within ``radius + pad(order)`` of the disk centre, and the candidates
    at order k+1 are the children of the candidates at order k.  With ``pad`` at least
    the centre-to-corner distance of the cells, no intersecting cell is ever dropped;
    the extra ones are cheaply rejected by the tile cutter.
    """
    ra0, dec0 = math.radians(ra_deg), math.radians(dec_deg)
    radius = math.radians(radius_deg)
    cand = np.arange(12, dtype=np.int64)
    for k in range(0, kmax + 1):
        if k > 0:
            cand = (cand[:, None] * 4 + np.arange(4, dtype=np.int64)).ravel()
        if cand.size:
            cra, cdec = tile_centers(k, cand)
            pad = math.radians(CELL_DEG_ORDER0 / (1 << k) * pad_factor)
            cand = cand[angular_separation(cra, cdec, ra0, dec0) <= radius + pad]
        yield k, cand
