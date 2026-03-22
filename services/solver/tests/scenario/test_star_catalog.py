"""Scenario tests — star catalog flows with real DB, mocked SIMBAD."""

from unittest.mock import patch, AsyncMock

import pytest
from httpx import AsyncClient


class TestStarCatalogFlow:
    """Full flow: lookup → SIMBAD → cache → DB → repeat."""

    async def test_iau_star_from_seed(self, client: AsyncClient):
        """IAU stars loaded from JSON seed are available immediately."""
        # Sirius is in star_names.json with Gaia source_id
        # Use a known IAU star from the seed
        resp = await client.get("/stars/4472832130942575872")
        assert resp.status_code == 200
        # Should return from cache (JSON seed), no SIMBAD call

    async def test_simbad_lookup_and_db_cache(self, client: AsyncClient):
        """First request → SIMBAD, second request → DB cache."""
        simbad_result = AsyncMock()

        async def mock_simbad(source_id):
            return {
                "main_id": "* alf Lyr",
                "proper_name": "Vega",
                "identifiers": ["NAME Vega", "HIP 91262", "HD 172167", "HR 7001"],
                "hip_id": 91262,
                "hd_id": 172167,
                "hr_id": 7001,
                "spectral_type": "A0V",
                "mag_v": 0.03,
            }

        with patch("app.routers.stars._lookup_simbad", side_effect=mock_simbad) as mock:
            # First request — goes to SIMBAD
            resp1 = await client.get("/stars/9999999999999999999")
            assert resp1.status_code == 200
            assert resp1.json()["ProperName"] == "Vega"
            assert mock.call_count == 1

            # Second request — from in-memory cache, no SIMBAD
            resp2 = await client.get("/stars/9999999999999999999")
            assert resp2.status_code == 200
            assert resp2.json()["ProperName"] == "Vega"
            assert mock.call_count == 1  # Still 1, not 2

    async def test_simbad_no_proper_name_returns_main_id(self, client: AsyncClient):
        """Star without IAU name returns SIMBAD main_id as display name."""
        async def mock_simbad(source_id):
            return {
                "main_id": "* bet Cyg",
                "proper_name": "* bet Cyg",  # No NAME entry → falls back to main_id
                "identifiers": ["HIP 95947", "HD 183912"],
                "hip_id": 95947,
            }

        with patch("app.routers.stars._lookup_simbad", side_effect=mock_simbad):
            resp = await client.get("/stars/8888888888888888888")
            assert resp.status_code == 200
            assert resp.json()["ProperName"] == "* bet Cyg"

    async def test_simbad_not_found_returns_empty(self, client: AsyncClient):
        """Star not in SIMBAD returns empty ProperName."""
        with patch("app.routers.stars._lookup_simbad", new_callable=AsyncMock, return_value=None):
            resp = await client.get("/stars/1111111111111111111")
            assert resp.status_code == 200
            assert resp.json()["ProperName"] == ""

    async def test_hip_id_lookup(self, client: AsyncClient):
        """Short IDs (≤6 digits) are queried as HIP first."""
        async def mock_simbad(source_id):
            return {
                "main_id": "* alf CMa A",
                "proper_name": "Sirius",
                "identifiers": ["NAME Sirius", "HIP 32349"],
                "hip_id": 32349,
            }

        with patch("app.routers.stars._lookup_simbad", side_effect=mock_simbad):
            resp = await client.get("/stars/32349")
            assert resp.status_code == 200
            assert resp.json()["ProperName"] == "Sirius"

    async def test_details_endpoint(self, client: AsyncClient):
        """GET /stars/{id}/details returns full card after SIMBAD lookup."""
        async def mock_simbad(source_id):
            return {
                "main_id": "* tau Cyg",
                "proper_name": None,
                "identifiers": ["HIP 104887", "HD 202444", "HR 8130", "SAO 71121"],
                "hip_id": 104887,
                "hd_id": 202444,
                "hr_id": 8130,
                "sao_id": 71121,
                "spectral_type": "F2IV",
                "mag_v": 3.73,
                "mag_b": 4.12,
            }

        with patch("app.routers.stars._lookup_simbad", side_effect=mock_simbad):
            resp = await client.get("/stars/7777777777777777777/details")
            assert resp.status_code == 200
            data = resp.json()
            assert data["identifiers"]["HIP"] == 104887
            assert data["identifiers"]["HD"] == 202444
            assert data["identifiers"]["HR"] == 8130
            assert data["physical"]["spectral_type"] == "F2IV"
            assert data["photometry"]["mag_v"] == pytest.approx(3.73, abs=0.01)
            assert len(data["aliases"]) >= 4

    async def test_invalid_source_id(self, client: AsyncClient):
        """Non-numeric source_id returns 400."""
        resp = await client.get("/stars/not-a-number")
        assert resp.status_code == 400

    async def test_details_invalid_source_id(self, client: AsyncClient):
        """Non-numeric source_id on details returns 400."""
        resp = await client.get("/stars/abc/details")
        assert resp.status_code == 400
