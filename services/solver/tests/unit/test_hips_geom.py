"""Unit tests for worker/hips_geom.py — the port of frontend/src/utils/healpix.js.

The reference (ra, dec) values were produced by the JS itself (node, ESM import of
healpix.js: heal2equatorial(...hipspix2healpix(nside, pix, u, v)) with ra += Math.PI,
exactly what MeshLoader.createTileGeometry does).  If the JS changes, regenerate.
"""

import math

import numpy as np
import pytest

from worker.hips_geom import (
    CELL_DEG_ORDER0,
    CONE_PAD_FACTOR,
    angular_separation,
    cone_candidates_by_order,
    kmax_for_pixscale,
    nest2xyf,
    tile_centers,
    tile_lattice_sky,
    tile_uv_to_radec,
)

# (order, pix, u, v, ra_js, dec_js) — radians, renderer convention (ra += PI, not wrapped)
JS_REFERENCE = [
    (0, 0, 0.5, 0.5, 7.0685834705770345, 0.7297276562269664),
    (0, 0, 1.0, 0.0, 3.141592653589793, 1.5707963267948966),        # north pole vertex (JS: !ra -> 0)
    (0, 4, 0.0, 0.0, 7.0685834705770345, 0.0),
    (0, 11, 1.0, 1.0, 4.71238898038469, -0.7297276562269666),
    (1, 12, 0.25, 0.75, 5.497787143782138, 0.1674480792196893),
    (2, 48, 0.0, 1.0, 5.497787143782138, 0.0),
    (2, 21, 0.7, 0.3, 9.293878266869804, 0.8183219506315599),
    (3, 193, 0.1, 0.9, 5.5959619142068195, 0.10016742116155974),
    (3, 593, 0.4, 0.6, 9.31644717961111, -0.9698336540995625),
    (4, 775, 0.33, 0.66, 5.596452788058942, 0.19583264622076357),
    (5, 3101, 0.5, 0.5, 5.620505606812989, 0.20987059226273774),
    (6, 12404, 0.9, 0.1, 5.620505606812989, 0.20774100204886503),
    (8, 198479, 0.123456, 0.987654, 5.620164725602305, 0.2049095990619354),
    (8, 207710, 0.5, 0.5, 5.237010409841579, 0.39002153541272166),
    (8, 786431, 1.0, 1.0, 5.494719182206366, -0.0026041696101148926),
    (8, 733321, 0.2, 0.8, 5.447079945284456, -1.1224424892547482),
    (8, 0, 0.0, 0.0, 7.071651432152805, 0.0026041696101148926),
]


def cone_candidates(order, ra_deg, dec_deg, radius_deg, pad_factor=CONE_PAD_FACTOR):
    """Candidates at one order — the last step of `cone_candidates_by_order`.

    A test helper, not production code: `worker.hips` walks every order on its way
    down, so the tiler has no use for a single-order shortcut.
    """
    *_, (_, cand) = cone_candidates_by_order(order, ra_deg, dec_deg, radius_deg, pad_factor)
    return cand


def _wrap(a):
    return (a + math.pi) % (2 * math.pi) - math.pi


class TestJsParity:
    @pytest.mark.parametrize("order,pix,u,v,ra_js,dec_js", JS_REFERENCE)
    def test_matches_js(self, order, pix, u, v, ra_js, dec_js):
        ra, dec = tile_uv_to_radec(order, pix, u, v)
        assert abs(_wrap(float(ra) - ra_js)) < 1e-9
        assert abs(float(dec) - dec_js) < 1e-9

    def test_vectorised_matches_scalar(self):
        pts = JS_REFERENCE
        for order in sorted({p[0] for p in pts}):
            rows = [p for p in pts if p[0] == order]
            pix = np.array([r[1] for r in rows])
            u = np.array([r[2] for r in rows])
            v = np.array([r[3] for r in rows])
            ra, dec = tile_uv_to_radec(order, pix, u, v)
            for i, r in enumerate(rows):
                assert abs(_wrap(float(ra[i]) - r[4])) < 1e-9
                assert abs(float(dec[i]) - r[5]) < 1e-9

    def test_lattice_orientation(self):
        """Row 0 of the lattice is v = 1 (top of the PNG), column 0 is u = 0."""
        ra, dec = tile_lattice_sky(3, 193, 5)
        ra_tl, dec_tl = tile_uv_to_radec(3, 193, 0.0, 1.0)
        ra_br, dec_br = tile_uv_to_radec(3, 193, 1.0, 0.0)
        assert ra[0, 0] == pytest.approx(math.degrees(ra_tl))
        assert dec[0, 0] == pytest.approx(math.degrees(dec_tl))
        assert ra[-1, -1] == pytest.approx(math.degrees(ra_br))
        assert dec[-1, -1] == pytest.approx(math.degrees(dec_br))

    def test_nest2xyf_vectorised(self):
        rng = np.random.default_rng(1)
        for order in (0, 3, 8):
            nside = 1 << order
            pix = rng.integers(0, 12 * nside * nside, size=50)
            face, ix, iy = nest2xyf(nside, pix)
            for i, p in enumerate(pix):
                f, x, y = nest2xyf(nside, int(p))
                assert (int(face[i]), int(ix[i]), int(iy[i])) == (int(f), int(x), int(y))
            assert (face >= 0).all() and (face < 12).all()
            assert (ix < nside).all() and (iy < nside).all()


class TestKmax:
    @pytest.mark.parametrize("pixscale,expected", [
        (412.2, 0),      # one tile pixel at order 0
        (1000.0, 0),     # coarser than order 0 -> clamped
        (206.1, 1),
        (30.0, 4),       # log2(13.74) = 3.78 -> 4
        (6.0, 6),        # log2(68.7) = 6.1
        (2.5, 7),        # log2(164.9) = 7.37
        (1.6, 8),        # log2(257.6) = 8.0
        (0.5, 8),        # cap
    ])
    def test_table(self, pixscale, expected):
        assert kmax_for_pixscale(pixscale) == expected

    def test_cap_override(self):
        assert kmax_for_pixscale(0.5, cap=6) == 6

    @pytest.mark.parametrize("bad", [0.0, -1.0, float("nan"), float("inf")])
    def test_invalid(self, bad):
        with pytest.raises(ValueError):
            kmax_for_pixscale(bad)


class TestCone:
    def test_pad_covers_every_cell(self):
        """The cone pad must exceed the centre-to-corner distance of every cell at every order."""
        for order in range(0, 9):
            n = 12 * 4 ** order
            pix = np.arange(n)
            cra, cdec = tile_centers(order, pix)
            worst = 0.0
            for u, v in ((0, 0), (0, 1), (1, 0), (1, 1)):
                ra, dec = tile_uv_to_radec(order, pix, u, v)
                worst = max(worst, float(angular_separation(cra, cdec, ra, dec).max()))
            pad = math.radians(CELL_DEG_ORDER0 / (1 << order) * CONE_PAD_FACTOR)
            assert worst < pad, f"order {order}: corner {math.degrees(worst):.3f} > pad {math.degrees(pad):.3f}"

    @pytest.mark.parametrize("ra,dec", [(83.8, -5.4), (0.2, 0.1), (359.9, 45.0), (10.0, 89.5), (200.0, -89.9)])
    def test_contains_the_cell_under_the_centre(self, ra, dec):
        for order in (0, 2, 5, 8):
            n = 12 * 4 ** order
            cra, cdec = tile_centers(order, np.arange(n))
            nearest = int(np.argmin(angular_separation(cra, cdec, math.radians(ra), math.radians(dec))))
            cand = cone_candidates(order, ra, dec, 0.01)
            assert nearest in set(int(p) for p in cand)

    def test_whole_sky_keeps_all_twelve_base_cells(self):
        assert len(cone_candidates(0, 10.0, 10.0, 180.0)) == 12
        # a hemisphere keeps everything but the cells around the antipode
        assert 6 <= len(cone_candidates(0, 10.0, 10.0, 90.0)) <= 12

    def test_by_order_is_hierarchical(self):
        prev = None
        for order, cand in cone_candidates_by_order(6, 83.8, -5.4, 0.5):
            cand = set(int(p) for p in cand)
            assert cand, f"no candidates at order {order}"
            if prev is not None:
                assert {p >> 2 for p in cand} <= prev
            prev = cand

    def test_small_field_deep_order_is_small(self):
        cand = cone_candidates(8, 83.8, -5.4, 0.4)
        assert 4 <= len(cand) <= 120
