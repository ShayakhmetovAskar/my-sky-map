#!/usr/bin/env python3
"""APO-80 spike: upload generated tiles + moc.json to a test prefix of the public bucket.

Uses the S3 REST API with a Yandex IAM token (X-YaCloud-SubjectToken), no static keys.
  yc iam create-token > iam.token
  spike_hips_upload.py --tiles /tmp/hips --token iam.token [--prefix spike/hips]
"""

import argparse
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BUCKET = "https://storage.yandexcloud.net/skymap-static-data"


def put(token, key, data, content_type):
    req = urllib.request.Request(f"{BUCKET}/{key}", data=data, method="PUT", headers={
        "X-YaCloud-SubjectToken": token,
        "Content-Type": content_type,
        "Cache-Control": "public, max-age=300",
    })
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status
        except Exception:  # noqa: BLE001
            if attempt == 3:
                raise
            time.sleep(1.5 * (attempt + 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tiles", required=True)
    ap.add_argument("--token", required=True)
    ap.add_argument("--prefix", default="spike/hips")
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    token = Path(args.token).read_text().strip()
    tiles = Path(args.tiles)
    files = sorted(tiles.glob("Norder*/Npix*.png"))
    jobs = [(f"{args.prefix}/{f.relative_to(tiles)}", f.read_bytes(), "image/png") for f in files]
    jobs.append((f"{args.prefix}/moc.json", (tiles / "moc.json").read_bytes(), "application/json"))

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        statuses = list(pool.map(lambda j: put(token, *j), jobs))
    bad = [s for s in statuses if s not in (200, 201)]
    print(f"uploaded {len(jobs) - len(bad)}/{len(jobs)} objects to {BUCKET}/{args.prefix} in {time.time() - t0:.1f}s")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
