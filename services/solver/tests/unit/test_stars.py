"""Unit tests for star catalog endpoint."""

import pytest
from contextlib import contextmanager
from unittest.mock import AsyncMock, patch

from app.routers.stars import _cache


@contextmanager
def cache_entry(key, value):
    """Context manager for safe cache manipulation in tests."""
    _cache[key] = value
    try:
        yield
    finally:
        _cache.pop(key, None)


class TestGetStarName:
    """GET /stars/{source_id}"""

    async def test_from_cache(self, client):
        """Returns cached star name."""
        with cache_entry("12345", "Sirius"):
            res = await client.get("/stars/12345")
            assert res.status_code == 200
            assert res.json() == {"ProperName": "Sirius"}

    async def test_empty_cache(self, client):
        """Returns empty string for cached source_id with no name."""
        with cache_entry("99999", ""):
            res = await client.get("/stars/99999")
            assert res.status_code == 200
            assert res.json() == {"ProperName": ""}

    async def test_invalid_source_id(self, client):
        """Returns 400 for invalid source_id format."""
        res = await client.get("/stars/not-a-number")
        assert res.status_code == 400

    async def test_not_found(self, client):
        """Returns empty string when star not in cache, DB, or SIMBAD."""
        with patch("app.routers.stars._lookup_simbad", new_callable=AsyncMock, return_value=None):
            _cache.pop("77777777777", None)
            try:
                res = await client.get("/stars/77777777777")
                assert res.status_code == 200
                assert res.json() == {"ProperName": ""}
            finally:
                _cache.pop("77777777777", None)

    async def test_from_db(self, client):
        """Returns star name from DB when not in cache."""
        from app.models.db import StarCatalog
        from app.dependencies import get_db
        from app.main import app

        override = app.dependency_overrides[get_db]
        async for session in override():
            star = StarCatalog(source_id="11111111111", proper_name="Teststar", source="test")
            session.add(star)
            await session.commit()

        _cache.pop("11111111111", None)
        try:
            res = await client.get("/stars/11111111111")
            assert res.status_code == 200
            assert res.json() == {"ProperName": "Teststar"}
        finally:
            _cache.pop("11111111111", None)

    async def test_simbad_fallback_with_name(self, client):
        """Queries SIMBAD and returns proper name from NAME identifier."""
        simbad_result = {
            "main_id": "* alf CMa",
            "proper_name": "Sirius",
            "identifiers": ["NAME Sirius", "HIP 32349", "HD 48915"],
            "hip_id": 32349,
            "hd_id": 48915,
        }
        with patch("app.routers.stars._lookup_simbad", new_callable=AsyncMock, return_value=simbad_result):
            _cache.pop("22222222222", None)
            try:
                res = await client.get("/stars/22222222222")
                assert res.status_code == 200
                assert res.json()["ProperName"] == "Sirius"
            finally:
                _cache.pop("22222222222", None)

    async def test_simbad_fallback_no_proper_name(self, client):
        """SIMBAD star without NAME → returns main_id as display name."""
        simbad_result = {
            "main_id": "* bet Ori",
            "proper_name": "* bet Ori",
            "identifiers": ["HIP 25336", "HD 34085"],
            "hip_id": 25336,
        }
        with patch("app.routers.stars._lookup_simbad", new_callable=AsyncMock, return_value=simbad_result):
            _cache.pop("33333333333333", None)
            try:
                res = await client.get("/stars/33333333333333")
                assert res.status_code == 200
                assert res.json()["ProperName"] == "* bet Ori"
            finally:
                _cache.pop("33333333333333", None)


class TestGetStarDetails:
    """GET /stars/{source_id}/details"""

    async def test_details_from_db(self, client):
        """Returns full star card from DB."""
        from app.models.db import StarCatalog, StarAlias
        from app.dependencies import get_db
        from app.main import app

        override = app.dependency_overrides[get_db]
        async for session in override():
            star = StarCatalog(
                source_id="33333333333",
                proper_name="Detailstar",
                hip_id=12345,
                hd_id=67890,
                spectral_type="G2V",
                mag_v=4.5,
                source="test",
            )
            session.add(star)
            session.add(StarAlias(source_id="33333333333", alias="HIP 12345", catalog="HIP"))
            session.add(StarAlias(source_id="33333333333", alias="HD 67890", catalog="HD"))
            await session.commit()

        res = await client.get("/stars/33333333333/details")
        assert res.status_code == 200
        data = res.json()
        assert data["proper_name"] == "Detailstar"
        assert data["identifiers"]["HIP"] == 12345
        assert data["identifiers"]["HD"] == 67890
        assert data["physical"]["spectral_type"] == "G2V"
        assert data["photometry"]["mag_v"] == 4.5
        assert "HIP 12345" in data["aliases"]

    async def test_details_not_found(self, client):
        """Returns 404 when star not found anywhere."""
        with patch("app.routers.stars._lookup_simbad", new_callable=AsyncMock, return_value=None):
            res = await client.get("/stars/44444444444/details")
            assert res.status_code == 404

    async def test_details_invalid_id(self, client):
        """Returns 400 for invalid source_id."""
        res = await client.get("/stars/abc/details")
        assert res.status_code == 400
