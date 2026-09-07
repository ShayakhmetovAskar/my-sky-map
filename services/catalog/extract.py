#!/usr/bin/env python
"""Extract the columns skymap needs from the Gaia DR3 HATS mirror on AWS Open Data.

The mirror holds 1.81e9 sources across 2017 parquet partitions (0.70 TB, 153
columns). Parquet stores each column as a contiguous byte range, so projecting the
five columns we need pulls 7.68% of the bytes — measured from the parquet footer,
not estimated:

    dec              8.8 B/row      source_id        6.3 B/row
    ra               8.7 B/row      phot_g_mean_mag  5.4 B/row
                                    bp_rp            5.3 B/row
    -> 34.5 B/row, ~58 GB for the whole catalogue

AWS Open Data sponsors the egress, so the transfer is free.

Resumable: a partition whose output already exists is skipped. Output is written
to a .tmp file and renamed on success, so an interrupted partition is never
mistaken for a finished one.

Usage:
    python extract.py                 # everything, into $SKYMAP_CATALOG_DIR
    python extract.py --limit 1       # one partition, to measure throughput
    python extract.py --out /some/dir
"""

import argparse
import os
import re
import sys
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BUCKET = "https://stpubdata.s3.amazonaws.com/"
PREFIX = "gaia/gaia_dr3/public/hats/gaia/dataset/"
COLUMNS = ("source_id", "ra", "dec", "phot_g_mean_mag", "bp_rp")
DEFAULT_OUT = os.environ.get("SKYMAP_CATALOG_DIR", "/Volumes/drive/skymap-catalog/raw")


def list_partitions(cache: Path) -> list[str]:
    """List every parquet partition key. Cached — the listing costs 3 round trips."""
    if cache.exists():
        return [k for k in cache.read_text().splitlines() if k]

    keys: list[str] = []
    token = None
    while True:
        url = f"{BUCKET}?list-type=2&prefix={PREFIX}&max-keys=1000"
        if token:
            url += "&continuation-token=" + urllib.parse.quote(token)
        xml = urllib.request.urlopen(url, timeout=60).read().decode()
        # data_thumbnail.parquet also sits under this prefix and is not a partition
        keys += [
            k
            for k in re.findall(r"<Key>(.*?)</Key>", xml)
            if k.endswith(".parquet") and re.search(r"Norder=\d+.*Npix=\d+", k)
        ]
        m = re.search(r"<NextContinuationToken>(.*?)</NextContinuationToken>", xml)
        if not m:
            break
        token = m.group(1)

    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text("\n".join(keys))
    return keys


def out_name(key: str) -> str:
    """Norder=2/Dir=0/Npix=137.parquet -> o2_p137.parquet"""
    norder = re.search(r"Norder=(\d+)", key)
    npix = re.search(r"Npix=(\d+)", key)
    return f"o{norder.group(1)}_p{npix.group(1)}.parquet"


def human(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(n) < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} PB"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--limit", type=int, default=0, help="stop after N partitions")
    ap.add_argument(
        "--workers",
        type=int,
        default=8,
        help="parallel partitions; the fetch is latency-bound, not bandwidth-bound",
    )
    args = ap.parse_args()

    import duckdb

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    keys = list_partitions(out.parent / "partitions.txt")
    todo = [k for k in keys if not (out / out_name(k)).exists()]
    done_already = len(keys) - len(todo)
    if args.limit:
        todo = todo[: args.limit]

    print(f"partitions: {len(keys)} total, {done_already} already done, {len(todo)} to fetch")
    if not todo:
        print("nothing to do")
        return 0

    base = duckdb.connect()
    base.execute("INSTALL httpfs; LOAD httpfs;")

    cols = ", ".join(COLUMNS)
    started = time.time()
    lock = threading.Lock()
    state = {"n": 0, "bytes": 0, "failed": 0}

    def fetch(key: str) -> None:
        dest = out / out_name(key)
        tmp = dest.with_suffix(".tmp")
        con = base.cursor()  # thread-local cursor over the shared database
        try:
            con.execute(
                f"COPY (SELECT {cols} FROM read_parquet('{BUCKET}{key}')) "
                f"TO '{tmp}' (FORMAT PARQUET, COMPRESSION ZSTD)"
            )
            tmp.rename(dest)
            size = dest.stat().st_size
        except Exception as exc:  # noqa: BLE001 - one bad partition must not stop the run
            tmp.unlink(missing_ok=True)
            with lock:
                state["failed"] += 1
                print(f"\nFAILED {key}: {exc}", flush=True)
            return

        with lock:
            state["n"] += 1
            state["bytes"] += size
            n, done_bytes = state["n"], state["bytes"]
            elapsed = time.time() - started
            eta = (len(todo) - n) * (elapsed / n)
            pct = n / len(todo)
            bar = "#" * int(pct * 30)
            line = (
                f"[{bar:<30}] {pct * 100:5.1f}%  {n}/{len(todo)}  "
                f"{human(done_bytes)}  {human(done_bytes / elapsed)}/s  "
                f"ETA {eta / 3600:4.2f}h"
            )
            # redraw in place on a terminal; append periodically when piped to a log
            if sys.stdout.isatty():
                print("\r" + line + "  ", end="", flush=True)
            elif n % 25 == 0 or n == len(todo):
                print(line, flush=True)

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        list(pool.map(fetch, todo))

    mins = (time.time() - started) / 60
    print(f"\n\ndone: {human(state['bytes'])} in {mins:.1f} min ({state['failed']} failed)")
    if state["failed"]:
        print("re-run the same command — finished partitions are skipped")
    return 1 if state["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
