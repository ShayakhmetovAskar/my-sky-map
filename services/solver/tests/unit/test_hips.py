"""Unit tests for worker/hips.py — the per-image tiler (storage is a fake)."""

import io
import logging
import re
from contextlib import contextmanager

import numpy as np
import pytest
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image

from worker import hips
from worker.hips import (
    CACHE_CONTROL,
    build_hips,
    new_image_secret,
    redact_secrets,
    cut_tile,
    downscale,
    image_corners,
    image_footprint,
    load_image,
    make_thumb,
    pixel_scale_arcsec,
)
from worker.hips_geom import TILE, kmax_for_pixscale, tile_uv_to_radec

from .test_hips_geom import cone_candidates       # single-order helper; see its docstring

CENTER_RA, CENTER_DEC = 83.8, -5.4


class FakeStorage:
    """Collects uploads in memory: key -> (data, content_type, cache_control)."""

    public_base_url = "http://localhost:9000/skymap-static-data"

    def __init__(self):
        self.objects = {}

    def upload_bytes(self, key, data, content_type, cache_control=None):
        self.objects[key] = (bytes(data), content_type, cache_control)


def make_wcs(w, h, pixscale_arcsec, ra=CENTER_RA, dec=CENTER_DEC, rot_deg=0.0):
    wcs = WCS(naxis=2)
    wcs.wcs.ctype = ["RA---TAN", "DEC--TAN"]
    wcs.wcs.crpix = [(w + 1) / 2, (h + 1) / 2]
    wcs.wcs.crval = [ra, dec]
    s = pixscale_arcsec / 3600.0
    c, si = np.cos(np.radians(rot_deg)), np.sin(np.radians(rot_deg))
    wcs.wcs.cd = [[-s * c, s * si], [s * si, s * c]]
    return wcs


def write_wcs(path, wcs, w, h):
    header = wcs.to_header()
    header["IMAGEW"] = w
    header["IMAGEH"] = h
    header.tofile(str(path), overwrite=True)


def coord_image(w, h):
    """RGB image whose R encodes x and G encodes y (0..255), B constant."""
    xs = (np.arange(w) / max(1, w - 1) * 255).astype(np.uint8)
    ys = (np.arange(h) / max(1, h - 1) * 255).astype(np.uint8)
    img = np.empty((h, w, 3), dtype=np.uint8)
    img[:, :, 0] = xs[None, :]
    img[:, :, 1] = ys[:, None]
    img[:, :, 2] = 77
    return img


@contextmanager
def capture_logs(logger_name: str):
    """Collect records of one logger.

    Not caplog: the session-scoped alembic fixture runs `fileConfig`, which disables
    every logger that already exists, so records never reach pytest's handler.
    """
    logger = logging.getLogger(logger_name)
    records = []

    class Collector(logging.Handler):
        def emit(self, record):
            records.append(record)

    handler = Collector()
    was_disabled, level, propagate = logger.disabled, logger.level, logger.propagate
    logger.disabled = False
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    logger.addHandler(handler)
    try:
        yield records
    finally:
        logger.removeHandler(handler)
        logger.disabled, logger.propagate = was_disabled, propagate
        logger.setLevel(level)


def jpeg_markers(data: bytes):
    """Segment markers of a JPEG (0xD8 .. up to SOS)."""
    markers, i = [], 2
    while i + 4 <= len(data):
        assert data[i] == 0xFF
        marker = data[i + 1]
        markers.append(marker)
        if marker == 0xDA:  # start of scan
            break
        seg_len = int.from_bytes(data[i + 2:i + 4], "big")
        i += 2 + seg_len
    return markers


@pytest.fixture
def scene(tmp_path):
    """400x300 image at 10"/px (~1.1 x 0.8 deg), TAN WCS on disk."""
    w, h, pixscale = 400, 300, 10.0
    img = coord_image(w, h)
    image_path = tmp_path / "input.png"
    Image.fromarray(img, "RGB").save(image_path)
    wcs = make_wcs(w, h, pixscale, rot_deg=20.0)
    wcs_path = tmp_path / "wcs.fits"
    write_wcs(wcs_path, wcs, w, h)
    return {"w": w, "h": h, "pixscale": pixscale, "img": img, "wcs": wcs,
            "image_path": image_path, "wcs_path": wcs_path}


class TestInputs:
    def test_load_wcs_roundtrip(self, scene):
        wcs = hips.load_wcs(scene["wcs_path"])
        assert pixel_scale_arcsec(wcs) == pytest.approx(scene["pixscale"], rel=1e-6)

    def test_footprint_and_corners(self, scene):
        c_ra, c_dec, radius = image_footprint(scene["wcs"], scene["w"], scene["h"])
        assert c_ra == pytest.approx(CENTER_RA, abs=1e-6)
        assert c_dec == pytest.approx(CENTER_DEC, abs=1e-6)
        half_diag = np.hypot(scene["w"] - 1, scene["h"] - 1) / 2 * scene["pixscale"] / 3600
        assert radius == pytest.approx(half_diag, rel=1e-3)
        corners = image_corners(scene["wcs"], scene["w"], scene["h"])
        assert len(corners) == 4 and all(len(c) == 2 for c in corners)
        for ra, dec in corners:
            assert abs(ra - CENTER_RA) < 1.0 and abs(dec - CENTER_DEC) < 1.0

    def test_load_png_is_uint8_rgb(self, scene):
        img = load_image(scene["image_path"])
        assert img.dtype == np.uint8 and img.shape == (scene["h"], scene["w"], 3)
        np.testing.assert_array_equal(img, scene["img"])

    def test_load_fits(self, tmp_path):
        data = np.arange(20 * 30, dtype=np.float32).reshape(20, 30)
        path = tmp_path / "input.fits"
        fits.PrimaryHDU(data).writeto(path)
        img = load_image(path)
        assert img.dtype == np.uint8 and img.shape == (20, 30, 3)
        assert img[0, 0, 0] < img[-1, -1, 0]  # stretched, row order preserved

    def test_downscale_noop_when_small(self):
        img = coord_image(100, 50)
        out, (sx, sy) = downscale(img, max_side=4096)
        assert out is img and (sx, sy) == (1.0, 1.0)

    def test_downscale_long_side(self):
        img = coord_image(600, 400)
        out, (sx, sy) = downscale(img, max_side=300)
        assert out.shape == (200, 300, 3)
        assert sx == pytest.approx(0.5) and sy == pytest.approx(0.5)


class TestCutTile:
    def test_tile_outside_image_is_none(self, scene):
        kmax = kmax_for_pixscale(scene["pixscale"])
        candidates = set(int(p) for p in cone_candidates(kmax, CENTER_RA, CENTER_DEC, 1.0))
        far = next(p for p in range(12 * 4 ** kmax) if p not in candidates)
        assert cut_tile(scene["wcs"], scene["img"], kmax, far) is None
        # antipode at order 0 as well
        assert cut_tile(scene["wcs"], scene["img"], 0, 9, center=(CENTER_RA, CENTER_DEC), max_sep_deg=5.0) is None

    def test_tile_under_center_samples_image(self, scene):
        kmax = kmax_for_pixscale(scene["pixscale"])
        cra, cdec = tile_uv_to_radec(kmax, np.arange(12 * 4 ** kmax), 0.5, 0.5)
        from worker.hips_geom import angular_separation
        pix = int(np.argmin(angular_separation(cra, cdec, np.radians(CENTER_RA), np.radians(CENTER_DEC))))
        tile = cut_tile(scene["wcs"], scene["img"], kmax, pix, edge_ramp_px=1.0)
        assert tile is not None and tile.shape == (TILE, TILE, 4) and tile.dtype == np.uint8
        alpha = tile[:, :, 3]
        assert (alpha == 255).sum() > 1000
        assert alpha.min() == 0 or (alpha > 0).all()  # either the edge is in the tile or fully covered
        assert (tile[:, :, 2][alpha == 255] == 77).all()

        # Orientation check: for opaque tile pixels, recompute the image coordinate from the
        # tile pixel's sky position and compare with the colour-encoded x / y.
        rows, cols = np.nonzero(alpha == 255)
        sel = slice(None, None, 97)
        rows, cols = rows[sel], cols[sel]
        u = (cols + 0.5) / TILE
        v = 1.0 - (rows + 0.5) / TILE
        ra, dec = tile_uv_to_radec(kmax, pix, u, v)
        x, y = scene["wcs"].all_world2pix(np.degrees(ra), np.degrees(dec), 0)
        exp_r = x / (scene["w"] - 1) * 255
        exp_g = y / (scene["h"] - 1) * 255
        assert np.abs(tile[rows, cols, 0].astype(float) - exp_r).max() < 3
        assert np.abs(tile[rows, cols, 1].astype(float) - exp_g).max() < 3

    def test_edge_ramp_softens_border(self, scene):
        """With a wide ramp the tile has many partially transparent pixels; with 1 px almost none."""
        kmax = kmax_for_pixscale(scene["pixscale"])
        cra, cdec = tile_uv_to_radec(kmax - 2, np.arange(12 * 4 ** (kmax - 2)), 0.5, 0.5)
        from worker.hips_geom import angular_separation
        pix = int(np.argmin(angular_separation(cra, cdec, np.radians(CENTER_RA), np.radians(CENTER_DEC))))
        hard = cut_tile(scene["wcs"], scene["img"], kmax - 2, pix, edge_ramp_px=1.0)
        soft = cut_tile(scene["wcs"], scene["img"], kmax - 2, pix, edge_ramp_px=8.0)
        assert hard is not None and soft is not None
        partial = lambda t: ((t[:, :, 3] > 0) & (t[:, :, 3] < 255)).sum()
        assert partial(soft) > partial(hard) * 3


class TestSecrets:
    def test_new_secret_is_128_bit_urlsafe(self):
        a, b = new_image_secret(), new_image_secret()
        assert a != b
        assert re.fullmatch(r"[A-Za-z0-9_-]{22}", a)

    def test_redact_hides_the_secret_only(self):
        secret = new_image_secret()
        msg = f"S3 operation failed on /skymap-static-data/img/{secret}/Norder3/Npix193.png: AccessDenied"
        out = redact_secrets(msg)
        assert secret not in out
        assert out.endswith("/Norder3/Npix193.png: AccessDenied")
        assert "img/***" in out

    def test_redact_leaves_other_text_alone(self):
        assert redact_secrets("no secret here") == "no secret here"


class TestThumb:
    def test_thumb_is_small_jpeg_without_metadata(self):
        img = coord_image(800, 500)
        data = make_thumb(img)
        assert data[:2] == b"\xff\xd8"
        markers = jpeg_markers(data)
        assert 0xE1 not in markers  # APP1: EXIF / XMP
        assert 0xE2 not in markers  # APP2: ICC profile
        with Image.open(io.BytesIO(data)) as im:
            assert im.format == "JPEG" and im.size == (256, 160)
            assert "exif" not in im.info and "icc_profile" not in im.info


class TestImageSize:
    """Dimensions from the header only — the solve half needs them, decoding does not."""

    def test_reads_a_png_without_decoding_it(self, scene):
        assert hips.image_size(scene["image_path"]) == (scene["w"], scene["h"])

    def test_agrees_with_the_decoded_image(self, scene):
        h, w = hips.load_image(scene["image_path"]).shape[:2]
        assert hips.image_size(scene["image_path"]) == (w, h)

    def test_reads_a_fits(self, tmp_path):
        path = tmp_path / "frame.fits"
        fits.PrimaryHDU(np.zeros((37, 91), dtype=np.float32)).writeto(str(path))
        assert hips.image_size(path) == (91, 37)

    def test_an_empty_fits_has_no_size(self, tmp_path):
        path = tmp_path / "empty.fits"
        fits.PrimaryHDU().writeto(str(path))
        with pytest.raises(ValueError):
            hips.image_size(path)


class TestBuildHips:
    KEY_RE = re.compile(r"^img/(?P<secret>[A-Za-z0-9_-]{22})/(Norder(?P<k>\d+)/Npix(?P<p>\d+)\.png|thumb\.jpg)$")

    def test_full_build(self, scene):
        storage = FakeStorage()
        with capture_logs("worker.hips") as records:
            built = build_hips(scene["image_path"], scene["wcs_path"], storage, storage.public_base_url)
        logged = "\n".join(r.getMessage() for r in records)

        hips_res, corners = built["hips"], built["corners"]
        assert hips_res["kmax"] == kmax_for_pixscale(scene["pixscale"])
        assert len(corners) == 4
        assert hips_res["seconds"] >= 0
        # `SkyImage.width`/`height` read these off the top level of `result`
        assert (built["width"], built["height"]) == (scene["w"], scene["h"])

        secret = hips_res["base"].rsplit("/", 1)[1]
        assert re.fullmatch(r"[A-Za-z0-9_-]{22}", secret)
        assert hips_res["base"] == f"{storage.public_base_url}/img/{secret}"
        assert hips_res["thumb"] == f"{hips_res['base']}/thumb.jpg"

        # every key is well-formed and lives under this image's secret
        uploaded_tiles = set()
        for key, (data, ctype, cc) in storage.objects.items():
            m = self.KEY_RE.match(key)
            assert m and m.group("secret") == secret, key
            assert cc == CACHE_CONTROL == "public, max-age=86400"
            if key.endswith(".png"):
                assert ctype == "image/png"
                with Image.open(io.BytesIO(data)) as im:
                    assert im.size == (TILE, TILE) and im.mode == "RGBA"
                uploaded_tiles.add((int(m.group("k")), int(m.group("p"))))
            else:
                assert ctype == "image/jpeg"
        assert f"img/{secret}/thumb.jpg" in storage.objects

        # MOC == exactly the written tiles, all orders 0..kmax present for a ~1 deg field
        moc_tiles = {(int(k), p) for k, pixes in hips_res["moc"].items() for p in pixes}
        assert moc_tiles == uploaded_tiles
        assert hips_res["tiles"] == len(uploaded_tiles)
        assert set(hips_res["moc"]) == {str(k) for k in range(hips_res["kmax"] + 1)}
        assert all(v == sorted(v) for v in hips_res["moc"].values())
        # coverage is upward-closed: the parent of every tile is written too
        for k, p in moc_tiles:
            if k > 0:
                assert (k - 1, p >> 2) in moc_tiles

        # the worker never logs the secret
        assert any("kmax" in msg for msg in logged.splitlines()), logged
        assert secret not in logged

    def test_downscale_lowers_kmax(self, scene):
        storage = FakeStorage()
        built = build_hips(scene["image_path"], scene["wcs_path"], storage, storage.public_base_url, max_side=200)
        # 400 px -> 200 px: the effective pixel is twice as coarse, one order less deep
        assert built["hips"]["kmax"] == kmax_for_pixscale(scene["pixscale"] * 2)
        assert built["hips"]["tiles"] > 0

    def test_explicit_secret(self, scene):
        storage = FakeStorage()
        built = build_hips(scene["image_path"], scene["wcs_path"], storage, storage.public_base_url, secret="s3cret")
        assert built["hips"]["base"].endswith("/img/s3cret")
        assert all(k.startswith("img/s3cret/") for k in storage.objects)

    def test_broken_wcs_raises(self, scene, tmp_path):
        """A corrupt WCS file parses into an empty header — that must not become an
        identity transform that smears the image onto some arbitrary cell."""
        bad = tmp_path / "bad.fits"
        bad.write_bytes(b"not a wcs at all")
        storage = FakeStorage()
        with pytest.raises(ValueError, match="celestial"):
            build_hips(scene["image_path"], bad, storage, "http://x")
        assert storage.objects == {}
