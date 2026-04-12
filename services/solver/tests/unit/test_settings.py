"""Unit tests for /settings router (user API key storage)."""

import pytest
from httpx import AsyncClient


class TestGetSettings:
    async def test_empty_when_no_settings(self, client: AsyncClient):
        resp = await client.get("/settings")
        assert resp.status_code == 200
        assert resp.json() == {"astrometry_api_key": None}

    async def test_returns_masked_key(self, client: AsyncClient):
        await client.put("/settings", json={"astrometry_api_key": "fake-astro-key-16"})

        resp = await client.get("/settings")
        assert resp.status_code == 200
        masked = resp.json()["astrometry_api_key"]
        assert masked is not None
        # Never returns the raw key
        assert masked != "fake-astro-key-16"
        # First 4 + last 4 chars should still be visible as hints
        assert masked.startswith("fake")
        assert masked.endswith("y-16")
        assert "***" in masked

    async def test_short_key_still_masked(self, client: AsyncClient):
        await client.put("/settings", json={"astrometry_api_key": "tiny"})

        resp = await client.get("/settings")
        masked = resp.json()["astrometry_api_key"]
        assert masked != "tiny"
        assert "***" in masked


class TestPutSettings:
    async def test_creates_new(self, client: AsyncClient):
        resp = await client.put("/settings", json={"astrometry_api_key": "first-key"})
        assert resp.status_code == 200

    async def test_updates_existing(self, client: AsyncClient):
        # Initial key
        await client.put("/settings", json={"astrometry_api_key": "old-key-value"})

        # Overwrite
        resp = await client.put("/settings", json={"astrometry_api_key": "new-key-value"})
        assert resp.status_code == 200

        # Verify GET shows the NEW masked value
        get_resp = await client.get("/settings")
        assert get_resp.json()["astrometry_api_key"].startswith("new-")

    async def test_rejects_empty_string(self, client: AsyncClient):
        resp = await client.put("/settings", json={"astrometry_api_key": ""})
        assert resp.status_code == 422

    async def test_rejects_missing_field(self, client: AsyncClient):
        resp = await client.put("/settings", json={})
        assert resp.status_code == 422

    async def test_rejects_too_long(self, client: AsyncClient):
        resp = await client.put("/settings", json={"astrometry_api_key": "x" * 200})
        assert resp.status_code == 422


class TestUserIsolation:
    async def test_settings_per_user(self, client: AsyncClient):
        from app.dependencies import get_current_user
        from app.main import app

        # User A saves a key
        await client.put("/settings", json={"astrometry_api_key": "user-a-key"})
        resp_a = await client.get("/settings")
        assert resp_a.json()["astrometry_api_key"] is not None

        # Switch to user B
        app.dependency_overrides[get_current_user] = lambda: "other-user-999"

        # User B sees no key
        resp_b = await client.get("/settings")
        assert resp_b.json()["astrometry_api_key"] is None

        # User B saves their own key
        await client.put("/settings", json={"astrometry_api_key": "user-b-key"})
        resp_b2 = await client.get("/settings")
        assert resp_b2.json()["astrometry_api_key"].startswith("user")
