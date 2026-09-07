#!/usr/bin/env python3
"""APO-80 spike: cut HiPS tiles (512x512 RGBA PNG) from ONE solved image.

Throwaway code. The point is to answer three questions before building the real
thing (APO-83): does a tile land exactly on the DSS backdrop, what is the tile
pixel orientation, and how long / how big is it on a real image.

Tile geometry is a direct port of the renderer's own math —
frontend/src/utils/healpix.js (hipspix2healpix + heal2equatorial) plus the
`ra += PI` that createTileGeometry applies — so every tile pixel is sampled at
the sky position where MeshLoader will draw it. No HiPS-standard orientation
guessing: the renderer defines the convention, we follow it.

Per tile: the WCS is evaluated on a coarse GRID x GRID lattice (SIP is smooth),
image pixel coordinates are bilinearly interpolated to the 512x512 tile pixels,
and the image is sampled with bilinear interpolation. Pixels outside the image
get alpha 0. Tiles with no coverage are not written.

Usage:
  spike_hips.py --wcs wcs.fits --image original.png --out /tmp/hips [--kmax 7]
"""

import argparse
import json
import math
import sys
import time
from pathlib import Path

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from astropy.wcs.utils import proj_plane_pixel_scales
from astropy_healpix import HEALPix
import astropy.units as u
from PIL import Image
from scipy.ndimage import map_coordinates

TILE = 512
GRID = 33            # WCS lattice per tile; 512/32 = 16 px between lattice points
ARCSEC_ORDER0 = 412.2  # tile pixel size at order 0: 58.63 deg * 3600 / 512

# ---------------------------------------------------------------------------
# Port of frontend/src/utils/healpix.js — keep 1:1 with the JS.
# ---------------------------------------------------------------------------

def _ctab():
    def Z(a): return [a, a + 1, a + 256, a + 257]
    def Y(a): return Z(a) + Z(a + 2) + Z(a + 512) + Z(a + 514)
    def X(a): return Y(a) + Y(a + 4) + Y(a + 1024) + Y(a + 1028)
    return X(0) + X(8) + X(2048) + X(2056)


CTAB = _ctab()

FACES = [(-3, 0), (-1, 0), (1, 0), (3, 0),
         (-4, -1), (-2, -1), (0, -1), (2, -1),
         (-3, -2), (-1, -2), (1, -2), (3, -2)]


def nest2xyf(nside, pix):
    npface = nside * nside
    face = pix // npface
    pix &= npface - 1
    raw = (pix & 0x5555) | ((pix & 0x55550000) >> 15)
    ix = CTAB[raw & 0xff] | (CTAB[raw >> 8] << 4)
    pix >>= 1
    raw = (pix & 0x5555) | ((pix & 0x55550000) >> 15)
    iy = CTAB[raw & 0xff] | (CTAB[raw >> 8] << 4)
    return face, ix, iy


def hipspix2healpix(nside, pix, x, y):
    """(x, y) in [0,1]^2 inside tile `pix` at `nside` -> HEALPix plane (hx, hy)."""
    face, ix, iy = nest2xyf(nside, pix)
    q = math.pi / 4
    hx0, hy0 = FACES[face]
    hx = hx0 * q + (ix - iy) * q / nside + q / nside
    hy = hy0 * q + (ix + iy) * q / nside + q / nside
    hx = hx - q / nside * (x + y)
    hy = hy + q / nside * (x - y)
    return hx, hy


def heal2equatorial(xs, ys):
    """HEALPix plane -> (ra, dec) in radians. Vectorised port of the JS."""
    PI = np.pi
    xs = np.asarray(xs, dtype=np.float64)
    ys = np.asarray(ys, dtype=np.float64)
    phi = np.empty_like(xs)
    theta = np.empty_like(xs)

    eq = np.abs(ys) < PI / 4
    phi[eq] = xs[eq]
    theta[eq] = np.arccos(np.clip(8 / (3 * PI) * ys[eq], -1, 1))

    p = ~eq
    x_t = np.mod(xs[p], PI / 2)                       # JS: % then +PI/2 if negative
    absy = np.abs(ys[p])
    with np.errstate(divide="ignore", invalid="ignore"):
        phi[p] = xs[p] - ((absy - PI / 4) / (absy - PI / 2)) * (x_t - PI / 4)
    bracket = 1 - (1 / 3) * (2 - 4 * absy / PI) ** 2
    sign = np.where(ys[p] >= 0, 1.0, -1.0)
    theta[p] = np.arccos(np.clip(bracket * sign, -1, 1))

    ra = np.mod(phi, 2 * PI)
    dec = PI / 2 - theta
    return ra, dec


def tile_lattice_sky(nside, pix, grid, ra_offset_pi=True):
    """Sky coords (deg) of a grid x grid lattice over the tile.

    Lattice point (i, j): u = i/(grid-1), v = 1 - j/(grid-1).
    Row j = 0 is the TOP image row (three.js flipY: texture v=1 is the first row
    of the PNG). This is the only place where image-row vs texture-v is decided.
    """
    t = np.linspace(0.0, 1.0, grid)
    uu, vv = np.meshgrid(t, 1.0 - t)              # uu[j, i] = u_i, vv[j, i] = 1 - t_j
    hx, hy = hipspix2healpix(nside, pix, uu, vv)
    ra, dec = heal2equatorial(hx, hy)
    if ra_offset_pi:
        ra = np.mod(ra + np.pi, 2 * np.pi)        # createTileGeometry: ra += Math.PI
    return np.degrees(ra), np.degrees(dec)


# ---------------------------------------------------------------------------

def load_image(path):
    img = Image.open(path)
    if img.mode != "RGB":
        img = img.convert("RGB")
    return np.asarray(img, dtype=np.float32)


def load_wcs(path):
    try:
        header = fits.Header.fromfile(path, endcard=False)
    except Exception:
        header = fits.Header.fromtextfile(path)
    return WCS(header), header


def footprint(wcs, w, h):
    """Center and bounding radius (deg) of the image on the sky."""
    xs = np.array([0, w - 1, w - 1, 0, (w - 1) / 2])
    ys = np.array([0, 0, h - 1, h - 1, (h - 1) / 2])
    ra, dec = wcs.all_pix2world(xs, ys, 0)
    c_ra, c_dec = ra[-1], dec[-1]
    # angular separation of corners from the center
    r1, d1 = np.radians(ra[:4]), np.radians(dec[:4])
    r0, d0 = math.radians(c_ra), math.radians(c_dec)
    sep = np.arccos(np.clip(np.sin(d0) * np.sin(d1) + np.cos(d0) * np.cos(d1) * np.cos(r1 - r0), -1, 1))
    return float(c_ra), float(c_dec), float(np.degrees(sep.max()))


def cut_tile(wcs, img, nside, pix, ra_offset_pi):
    """Return RGBA uint8 tile or None if the tile does not touch the image."""
    h, w, _ = img.shape
    ra, dec = tile_lattice_sky(nside, pix, GRID, ra_offset_pi)
    ok = np.isfinite(ra) & np.isfinite(dec)
    if not ok.any():
        return None
    px = np.full(ra.shape, np.nan)
    py = np.full(ra.shape, np.nan)
    with np.errstate(all="ignore"):
        x, y = wcs.all_world2pix(ra[ok], dec[ok], 0, quiet=True)
    px[ok], py[ok] = x, y
    # cheap reject: the whole lattice is outside the image (with a one-lattice-cell margin)
    margin = max(w, h) / (GRID - 1)
    if (np.nanmax(px) < -margin or np.nanmin(px) > w - 1 + margin
            or np.nanmax(py) < -margin or np.nanmin(py) > h - 1 + margin):
        return None

    # interpolate lattice pixel coords to the 512x512 pixel centres
    c = (np.arange(TILE) + 0.5) / TILE * (GRID - 1)         # lattice coordinate of each pixel centre
    gj, gi = np.meshgrid(c, c, indexing="ij")               # gj: row (v), gi: column (u)
    px_f = map_coordinates(np.nan_to_num(px, nan=-1e9), [gj, gi], order=1, mode="nearest")
    py_f = map_coordinates(np.nan_to_num(py, nan=-1e9), [gj, gi], order=1, mode="nearest")
    inside = (px_f >= 0) & (px_f <= w - 1) & (py_f >= 0) & (py_f <= h - 1)
    if not inside.any():
        return None

    tile = np.zeros((TILE, TILE, 4), dtype=np.uint8)
    for ch in range(3):
        v = map_coordinates(img[:, :, ch], [py_f, px_f], order=1, mode="constant", cval=0.0)
        tile[:, :, ch] = np.clip(v, 0, 255).astype(np.uint8)
    tile[:, :, 3] = np.where(inside, 255, 0).astype(np.uint8)
    return tile


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wcs", required=True)
    ap.add_argument("--image", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--kmax", type=int, default=None, help="override deepest order (auto from pixscale)")
    ap.add_argument("--kmin", type=int, default=0)
    ap.add_argument("--cap", type=int, default=8, help="hard cap on kmax")
    ap.add_argument("--no-ra-pi", action="store_true", help="do NOT add PI to RA (experiment)")
    args = ap.parse_args()

    t0 = time.time()
    wcs, header = load_wcs(args.wcs)
    img = load_image(args.image)
    h, w, _ = img.shape
    scales = proj_plane_pixel_scales(wcs) * 3600.0     # arcsec/px
    pixscale = float(np.mean(np.abs(scales)))
    kmax = args.kmax if args.kmax is not None else int(np.clip(round(math.log2(ARCSEC_ORDER0 / pixscale)), 0, args.cap))
    c_ra, c_dec, radius = footprint(wcs, w, h)
    print(f"image {w}x{h}px  pixscale {pixscale:.2f}\"/px  center ({c_ra:.4f}, {c_dec:.4f})  "
          f"radius {radius:.3f} deg  -> kmax {kmax}  (tile px at kmax = {ARCSEC_ORDER0 / 2**kmax:.2f}\")", flush=True)

    out = Path(args.out)
    moc = {}
    stats = {}
    total_bytes = 0
    ra_pi = not args.no_ra_pi
    for k in range(kmax, args.kmin - 1, -1):
        tk = time.time()
        nside = 2 ** k
        hp = HEALPix(nside=nside, order="nested", frame="icrs")
        pad = 58.63 / nside * 0.75                     # ~ half cell diagonal, generous
        cand = hp.cone_search_lonlat(c_ra * u.deg, c_dec * u.deg, (radius + pad) * u.deg)
        d = out / f"Norder{k}"
        d.mkdir(parents=True, exist_ok=True)
        written = []
        for pix in sorted(int(p) for p in cand):
            tile = cut_tile(wcs, img, nside, pix, ra_pi)
            if tile is None:
                continue
            f = d / f"Npix{pix}.png"
            Image.fromarray(tile, "RGBA").save(f, compress_level=6)
            total_bytes += f.stat().st_size
            written.append(pix)
        moc[str(k)] = written
        stats[k] = {"candidates": len(cand), "tiles": len(written), "seconds": round(time.time() - tk, 1)}
        print(f"order {k}: {len(written)} tiles of {len(cand)} candidates, {stats[k]['seconds']}s", flush=True)

    (out / "moc.json").write_text(json.dumps({"orders": moc}))
    summary = {
        "image": f"{w}x{h}", "pixscale_arcsec": round(pixscale, 3), "kmax": kmax,
        "center": [round(c_ra, 5), round(c_dec, 5)], "radius_deg": round(radius, 4),
        "tiles_total": sum(len(v) for v in moc.values()), "bytes_total": total_bytes,
        "seconds_total": round(time.time() - t0, 1), "per_order": stats, "ra_offset_pi": ra_pi,
    }
    (out / "summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
