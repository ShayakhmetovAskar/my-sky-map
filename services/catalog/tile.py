#!/usr/bin/env python
"""Cut HEALPix star tiles from the local Gaia extract, in the format the app
already fetches: v1/Norder{k}/Npix{p}.csv

Two design points, both chosen against the obvious alternative for reasons that
were measured rather than assumed:

1. Stars are binned POSITIONALLY (ra/dec -> healpix), not by the source_id
   shift. Gaia's source_id does encode a level-12 nested index, but the existing
   pyramid was built positionally — ang2pix_nest(1, ra, dec) reproduces the
   published Norder1 tiles for 21015 of 21015 rows — and 66% of the rows in
   orders 0-1 are Hipparcos ids that carry no HEALPix at all.

2. Each order gets a fixed magnitude band, continuing the existing pyramid
   (order 2 = 8.17-9.08, order 3 = 9.08-9.89, order 4 = 9.89-10.76). Band edges
   are picked from measured counts so the per-tile weight matches what the app
   already loads: 10.76-12.0 at order 5 gives median 112 rows and max 1257,
   against order 4's median 133 and max 1065.

   The order-4 edge is 10.76, MEASURED from the published tiles (max G over 32
   sampled tiles = 10.759998), not the 10.74 this docstring used to claim. The
   bands must abut exactly: an order-5 band starting at 10.74 put 18652 stars in
   both levels at once, and since the renderer draws every level 0..target with
   additive blending, each of them was painted on top of itself.

   The tail does grow with depth — a band to 13.5 would put 9271 rows in the
   worst bulge tile — so each new order's edge is chosen by measuring the count
   distribution first, not by extrapolating.

3. Rows are accumulated as flat arrays and sorted ONCE at the end, rather than
   kept in a per-cell dict. The dict version held five small numpy arrays per
   occupied cell, which is fine at order 5 (12k cells) and fatal at order 8
   (786k cells -> ~4M array objects, ~400 MB of pure object overhead before any
   data). One lexsort over the flat arrays gives the same grouping.

Cells with no stars in the band still get a header-only file. They would
otherwise 404, and the loader's failed-URL backoff retries every 10 s forever.

Two things the extract makes it easy to get wrong, both fixed below and both
invisible without checking against the catalogue:

  - Some sky regions appear in more than one partition (o4_p115 overlaps
    o3_p29), so 26708 stars in bands 5-9 arrive two or three times. Rows are
    deduplicated by source_id before grouping.
  - duckdb hands back nullable columns as MaskedArray, and np.asarray drops the
    mask silently, filling with 0. For bp_rp that is not a missing value but the
    colour of a hot blue star, and it hit 417482 rows. The catalogue contains
    exactly zero genuine bp_rp == 0.0, so every such row was a mangled NULL.
"""

import argparse
import os
import re
import sys
import time
from pathlib import Path

import duckdb
import numpy as np
from astropy_healpix import HEALPix
from astropy.coordinates import SkyCoord
import astropy.units as u

RAW = os.environ.get("SKYMAP_CATALOG_DIR", "/Volumes/drive/skymap-catalog/raw")
OUT = os.environ.get("SKYMAP_TILES_DIR", "/Volumes/drive/skymap-catalog/tiles")
# Полосы яркости по уровням. Первые четыре — как в уже опубликованной пирамиде,
# order 5 подобран замером: см. комментарий в шапке.
BANDS = {
    5: (10.76, 12.0),    # 2.09 млн, медиана 112, max 1257
    6: (12.0, 13.0),     # 4.28 млн, медиана  51, max  994
    7: (13.0, 14.0),     # 9.48 млн, медиана  26, max 1594
    8: (14.0, 15.0),     # 20.1 млн, медиана  12, max 2316
    9: (15.0, 16.0),     # 41.1 млн, медиана   5, max 1783
}
HEADER = ["source_id", "ra", "dec", "phot_g_mean_mag", "bp_rp"]


def partitions():
    fs = sorted(Path(RAW).glob("*.parquet"))
    out = []
    for f in fs:
        m = re.match(r"o(\d+)_p(\d+)\.parquet", f.name)
        if m:
            out.append((int(m.group(1)), int(m.group(2)), str(f)))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--order", type=int, default=5)
    ap.add_argument("--gmin", type=float, default=None,
                    help="нижняя граница полосы; по умолчанию берётся из BANDS")
    ap.add_argument("--gmax", type=float, default=None,
                    help="верхняя граница полосы; по умолчанию берётся из BANDS")
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    order = args.order
    if args.gmin is None or args.gmax is None:
        if order not in BANDS:
            print(f"для order {order} полоса не задана — укажи --gmin/--gmax "
                  f"после замера распределения", file=sys.stderr)
            return 2
        gmin, gmax = BANDS[order]
    else:
        gmin, gmax = args.gmin, args.gmax
    ncell = 12 * 4**order
    hp = HEALPix(nside=2**order, order="nested", frame="icrs")
    parts = partitions()
    if args.limit:
        parts = parts[: args.limit]
    print(f"order {order}: полоса G {gmin} – {gmax}, {ncell} ячеек, "
          f"партиций {len(parts)}", flush=True)

    # Копим плоскими кусками — по одному на партицию, склейка в самом конце.
    # idx влезает в int32 вплоть до order 14, g и bp_rp пишутся с 4 знаками,
    # так что float32 хватает; ra/dec остаются float64 ради 7 знаков.
    chunks: list[tuple] = []
    t0 = time.time()
    nread = 0

    con = duckdb.connect()
    for i, (po, pp, path) in enumerate(parts, 1):
        t = con.execute(f"""
            SELECT source_id, ra, dec, phot_g_mean_mag AS g, bp_rp
            FROM read_parquet('{path}')
            WHERE phot_g_mean_mag >= {gmin} AND phot_g_mean_mag < {gmax}
        """).fetchnumpy()
        n = len(t["source_id"])
        nread += n
        if n:
            # duckdb отдаёт nullable-колонки как MaskedArray, и np.asarray
            # молча срезает маску, подставляя нули. Для bp_rp ноль — это цвет
            # голубой звезды, поэтому NULL надо явно превратить в NaN: ниже
            # isfinite отличает его и пишет пустое поле.
            ra_ = np.ma.filled(t["ra"], np.nan).astype(np.float64)
            de_ = np.ma.filled(t["dec"], np.nan).astype(np.float64)
            idx = hp.skycoord_to_healpix(
                SkyCoord(ra_ * u.deg, de_ * u.deg, frame="icrs")).astype(np.int32)
            chunks.append((idx,
                           np.ma.filled(t["source_id"], 0).astype(np.int64),
                           ra_, de_,
                           np.ma.filled(t["g"], np.nan).astype(np.float32),
                           np.ma.filled(t["bp_rp"], np.nan).astype(np.float32)))
        if i % 100 == 0 or i == len(parts):
            el = time.time() - t0
            print(f"  {i}/{len(parts)} партиций, прочитано {nread:,} строк, "
                  f"{el/60:.1f} мин", flush=True)

    if not chunks:
        print("в полосе нет ни одной звезды", file=sys.stderr)
        return 1
    idx, sid, ra_, de_, g_, c_ = (np.concatenate([ch[j] for ch in chunks])
                                  for j in range(6))
    del chunks
    print(f"\nсклеено {idx.size:,} строк", flush=True)

    # Часть звёзд лежит в нескольких партициях экстракта, и без дедупликации
    # они попадают в тайл по два-три раза. Рендер складывает точки аддитивно,
    # поэтому дубль выглядит как аномально яркая звезда, а не как лишняя строка.
    keep = np.unique(sid, return_index=True)[1]
    if keep.size != sid.size:
        print(f"убрано дублей по source_id: {sid.size - keep.size:,}", flush=True)
        keep.sort()
        idx, sid, ra_, de_, g_, c_ = (a[keep] for a in (idx, sid, ra_, de_, g_, c_))

    # Звезда без координат или без величины не может быть размещена
    ok = np.isfinite(ra_) & np.isfinite(de_) & np.isfinite(g_)
    if not ok.all():
        print(f"пропущено строк без ra/dec/G: {int((~ok).sum()):,}", flush=True)
        idx, sid, ra_, de_, g_, c_ = (a[ok] for a in (idx, sid, ra_, de_, g_, c_))
    print(f"к нарезке {idx.size:,} строк, сортирую", flush=True)

    # В полосе берём ВСЕ звёзды ячейки — отбора по количеству нет.
    # Один lexsort даёт и группировку по ячейке, и порядок по яркости внутри.
    srt = np.lexsort((g_, idx))
    idx, sid, ra_, de_, g_, c_ = (a[srt] for a in (idx, sid, ra_, de_, g_, c_))
    del srt
    b0 = np.flatnonzero(np.r_[True, idx[1:] != idx[:-1]])
    b1 = np.r_[b0[1:], idx.size]
    sizes = b1 - b0
    print(f"ячеек с данными: {b0.size:,} из {ncell:,}", flush=True)
    print(f"строк на ячейку: min {sizes.min()} медиана {int(np.median(sizes))} "
          f"max {sizes.max()}  всего {int(sizes.sum()):,}", flush=True)

    d = Path(args.out) / f"Norder{order}"
    d.mkdir(parents=True, exist_ok=True)
    head = ",".join(HEADER) + "\n"
    filled = np.zeros(ncell, dtype=bool)
    written = 0
    for a, b in zip(b0, b1):
        cell = int(idx[a])
        filled[cell] = True
        with open(d / f"Npix{cell}.csv", "w", newline="") as f:
            f.write(head)
            for j in range(a, b):
                cc = "" if not np.isfinite(c_[j]) else f"{c_[j]:.4f}"
                f.write(f"{sid[j]},{ra_[j]:.7f},{de_[j]:.7f},{g_[j]:.4f},{cc}\n")
        written += 1
        if written % 50000 == 0:
            print(f"  записано {written:,}/{b0.size:,}, "
                  f"{(time.time()-t0)/60:.1f} мин", flush=True)

    # Пустые ячейки — заголовок без строк, иначе фронт получит 404 и будет
    # перезапрашивать их каждые 10 секунд из-за backoff в JsonLoader.
    empty = np.flatnonzero(~filled)
    for cell in empty:
        (d / f"Npix{int(cell)}.csv").write_text(head)
    print(f"\nзаписано {written:,} файлов с данными + {empty.size:,} пустых "
          f"в {d}", flush=True)
    print(f"время: {(time.time()-t0)/60:.1f} мин", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
