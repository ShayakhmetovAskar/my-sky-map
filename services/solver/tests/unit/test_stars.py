"""Unit tests for star catalog endpoint."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.routers.stars import _cache


class TestGetStarName:
    """GET /stars/{source_id}"""

    async def test_from_cache(self, client):
        """Returns cached star name."""
        _cache["12345"] = "Sirius"
        res = await client.get("/stars/12345")
        assert res.status_code == 200
        assert res.json() == {"ProperName": "Sirius"}
        del _cache["12345"]

    async def test_negative_cache(self, client):
        """Returns 404 for negatively cached source_id."""
        _cache["99999"] = None
        res = await client.get("/stars/99999")
        assert res.status_code == 404
        del _cache["99999"]

    async def test_not_found(self, client):
        """Returns 404 when star not in cache, DB, or SIMBAD."""
        with patch("app.routers.stars._lookup_simbad", new_callable=AsyncMock, return_value=None):
            _cache.pop("nonexistent", None)
            res = await client.get("/stars/nonexistent")
            assert res.status_code == 404

    async def test_from_db(self, client, db_session):
        """Returns star name from DB when not in cache."""
        from app.models.db import StarCatalog

        star = StarCatalog(source_id="db_test_123", proper_name="Teststar", source="test")
        db_session.add(star)
        await db_session.commit()

        _cache.pop("db_test_123", None)
        res = await client.get("/stars/db_test_123")
        assert res.status_code == 200
        assert res.json() == {"ProperName": "Teststar"}

    async def test_simbad_fallback(self, client):
        """Queries SIMBAD when not in cache or DB."""
        simbad_result = {
            "main_id": "* alf CMa",
            "identifiers": ["HIP 32349", "HD 48915"],
            "hip_id": 32349,
            "hd_id": 48915,
        }
        with patch("app.routers.stars._lookup_simbad", new_callable=AsyncMock, return_value=simbad_result):
            _cache.pop("simbad_test_456", None)
            res = await client.get("/stars/simbad_test_456")
            assert res.status_code == 200
            assert res.json()["ProperName"] == "* alf CMa"


class TestGetStarDetails:
    """GET /stars/{source_id}/details"""

    async def test_details_from_db(self, client, db_session):
        """Returns full star card from DB."""
        from app.models.db import StarCatalog, StarAlias

        star = StarCatalog(
            source_id="detail_test_789",
            proper_name="Detailstar",
            hip_id=12345,
            hd_id=67890,
            spectral_type="G2V",
            mag_v=4.5,
            source="test",
        )
        db_session.add(star)
        db_session.add(StarAlias(source_id="detail_test_789", alias="HIP 12345", catalog="HIP"))
        db_session.add(StarAlias(source_id="detail_test_789", alias="HD 67890", catalog="HD"))
        await db_session.commit()

        res = await client.get("/stars/detail_test_789/details")
        assert res.status_code == 200
        data = res.json()
        assert data["proper_name"] == "Detailstar"
        assert data["identifiers"]["HIP"] == 12345
        assert data["identifiers"]["HD"] == 67890
        assert data["physical"]["spectral_type"] == "G2V"
        assert data["photometry"]["mag_v"] == 4.5
        assert "HIP 12345" in data["aliases"]
        assert "HD 67890" in data["aliases"]

    async def test_details_not_found(self, client):
        """Returns 404 when star not found anywhere."""
        with patch("app.routers.stars._lookup_simbad", new_callable=AsyncMock, return_value=None):
            res = await client.get("/stars/nonexistent_detail/details")
            assert res.status_code == 404
