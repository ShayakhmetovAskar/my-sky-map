#!/usr/bin/env python3
"""APO-80 spike: does a generated tile line up with the DSS tile of the same (order, pix)?

For each generated tile we fetch the public DSS tile with the same address, high-pass
both (stars survive, sky background does not), and cross-correlate the DSS tile with
the 8 dihedral transforms of ours (identity, rotations, flips). The transform with the
highest normalised peak tells us the orientation; the peak position tells us the
residual shift in pixels. Expected if the geometry port is right: identity wins on
every tile with a shift of ~0 px.

Usage:
  spike_hips_check.py --tiles /tmp/hips --orders 5,6,7 [--per-order 4]
"""

import argparse
import io
import json
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_erosion
from scipy.signal import fftconvolve

DSS_BASE = "https://storage.yandexcloud.net/skymap-static-data/dss/v1"

TRANSFORMS = {
    "identity": lambda a: a,
    "rot90": lambda a: np.rot90(a, 1),
    "rot180": lambda a: np.rot90(a, 2),
    "rot270": lambda a: np.rot90(a, 3),
    "flipx": lambda a: a[:, ::-1],
    "flipy": lambda a: a[::-1, :],
    "transpose": lambda a: a.T,
    "antitranspose": lambda a: np.rot90(a, 2).T,
}


def gray(rgb):
    rgb = rgb.astype(np.float32)
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def highpass(g, sigma=6.0):
    return g - gaussian_filter(g, sigma)


def fetch_dss(order, pix):
    url = f"{DSS_BASE}/Norder{order}/Npix{pix}.jpg"
    data = urllib.request.urlopen(url, timeout=30).read()
    return np.asarray(Image.open(io.BytesIO(data)).convert("RGB"))


def ncc_peak(ref, cand, mask, search=64):
    """Normalised cross-correlation peak of `cand` against `ref` within +-search px."""
    m = mask.astype(np.float32)
    a = (ref - ref[mask].mean()) * m
    b = (cand - cand[mask].mean()) * m
    corr = fftconvolve(a, b[::-1, ::-1], mode="same")
    norm = np.sqrt((a ** 2).sum() * (b ** 2).sum()) + 1e-9
    corr /= norm
    c = np.array(corr.shape) // 2
    win = corr[c[0] - search:c[0] + search + 1, c[1] - search:c[1] + search + 1]
    iy, ix = np.unravel_index(np.argmax(win), win.shape)
    return float(win[iy, ix]), int(iy - search), int(ix - search)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tiles", required=True)
    ap.add_argument("--orders", default="5,6,7")
    ap.add_argument("--per-order", type=int, default=4, help="tiles per order, best-covered first")
    ap.add_argument("--min-coverage", type=float, default=0.5)
    args = ap.parse_args()

    tiles = Path(args.tiles)
    moc = json.loads((tiles / "moc.json").read_text())["orders"]
    verdicts = []
    for k in (int(x) for x in args.orders.split(",")):
        pixes = moc.get(str(k), [])
        if not pixes:
            print(f"order {k}: no tiles")
            continue
        # rank by coverage
        cov = []
        for p in pixes:
            a = np.asarray(Image.open(tiles / f"Norder{k}" / f"Npix{p}.png"))
            cov.append((float((a[..., 3] > 0).mean()), p))
        cov.sort(reverse=True)
        for coverage, p in cov[: args.per_order]:
            if coverage < args.min_coverage:
                continue
            mine = np.asarray(Image.open(tiles / f"Norder{k}" / f"Npix{p}.png"))
            try:
                dss = fetch_dss(k, p)
            except Exception as e:  # noqa: BLE001
                print(f"order {k} pix {p}: no DSS tile ({e})")
                continue
            if dss.shape[:2] != mine.shape[:2]:
                print(f"order {k} pix {p}: size mismatch dss={dss.shape[:2]} mine={mine.shape[:2]}")
                continue
            mask0 = binary_erosion(mine[..., 3] > 0, iterations=8)
            ref = highpass(gray(dss))
            g = highpass(gray(mine[..., :3]))
            results = {}
            for name, T in TRANSFORMS.items():
                tm = T(mask0)
                if tm.sum() < 2000:
                    continue
                results[name] = ncc_peak(ref, T(g), tm)
            best = max(results, key=lambda n: results[n][0])
            bv, by, bx = results[best]
            iv, iy, ix = results.get("identity", (float("nan"), 0, 0))
            verdicts.append((k, p, best, bv, by, bx, iv))
            print(f"order {k} pix {p:>8} cov {coverage:4.2f}: best={best:<13} ncc={bv:.3f} shift=({bx:+d},{by:+d}) px | "
                  f"identity ncc={iv:.3f} shift=({ix:+d},{iy:+d})", flush=True)

    if not verdicts:
        print("nothing compared")
        return 1
    names = [v[2] for v in verdicts]
    majority = max(set(names), key=names.count)
    ident = [v for v in verdicts if v[2] == "identity"]
    shifts = np.array([[v[5], v[4]] for v in ident]) if ident else np.zeros((0, 2))
    print("\n=== verdict ===")
    print(f"tiles compared: {len(verdicts)}, majority transform: {majority} ({names.count(majority)}/{len(names)})")
    if ident:
        print(f"identity shift median (dx, dy) = ({np.median(shifts[:, 0]):+.1f}, {np.median(shifts[:, 1]):+.1f}) px, "
              f"max |shift| = {np.abs(shifts).max():.0f} px")
    ok = majority == "identity" and (len(ident) == 0 or np.abs(shifts).max() <= 3)
    print("PASS: orientation = renderer convention, aligned within 3 px" if ok else "FAIL: see per-tile lines above")
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
