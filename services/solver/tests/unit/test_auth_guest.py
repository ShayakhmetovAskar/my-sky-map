"""Unit tests for /auth/guest router.

The Zitadel API calls are mocked so the tests don't need a running
Zitadel instance. We only care that our router orchestrates the calls
correctly and handles rate limiting / config errors.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from httpx import ASGITransport, AsyncClient

from app.main import app
from app.routers import auth_guest as auth_guest_module


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Clear the module-level rate limiter between tests."""
    auth_guest_module._guest_requests.clear()
    yield
    auth_guest_module._guest_requests.clear()


@pytest.fixture
def mock_zitadel(monkeypatch):
    """Replace get_zitadel_client() with a mock that simulates success."""
    fake_client = MagicMock()
    fake_client.create_shadow_user = AsyncMock(return_value="guest-user-id-123")
    fake_client.exchange_token = AsyncMock(return_value={
        "access_token": "eyJhbG.fake.jwt",
        "refresh_token": "refresh-token-xyz",
        "token_type": "Bearer",
        "expires_in": 43199,
    })

    monkeypatch.setattr(auth_guest_module, "get_zitadel_client", lambda: fake_client)
    return fake_client


@pytest.fixture
def configured_settings(monkeypatch):
    """Set the env values needed for /auth/guest to succeed."""
    monkeypatch.setattr(auth_guest_module.settings, "guest_sa_key", "test-pat")
    monkeypatch.setattr(auth_guest_module.settings, "guest_org_id", "test-org-id")
    monkeypatch.setattr(auth_guest_module.settings, "guest_client_id", "test-client-id")


@pytest.fixture
async def unauth_client():
    """HTTP client without the TEST_USER auth override — /auth/guest is public."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestGuestAuth:
    async def test_success_returns_token_and_public_name(
        self, unauth_client, mock_zitadel, configured_settings,
    ):
        resp = await unauth_client.post("/auth/guest")

        assert resp.status_code == 200
        data = resp.json()
        assert data["token"] == "eyJhbG.fake.jwt"
        assert data["refresh_token"] == "refresh-token-xyz"
        assert data["user_id"] == "guest-user-id-123"
        assert data["expires_in"] == 43199
        # public_name is generated server-side — just assert it's the expected format
        assert "-" in data["public_name"]
        assert data["public_name"].count("-") == 2

    async def test_public_name_passed_to_zitadel(
        self, unauth_client, mock_zitadel, configured_settings,
    ):
        resp = await unauth_client.post("/auth/guest")
        assert resp.status_code == 200

        call = mock_zitadel.create_shadow_user.await_args
        assert call.kwargs["org_id"] == "test-org-id"
        assert call.kwargs["sa_token"] == "test-pat"
        # Must match what's returned to the client
        returned_public_name = resp.json()["public_name"]
        assert call.kwargs["public_name"] == returned_public_name
        # Display name should include the public name for visibility in admin UI
        assert returned_public_name in call.kwargs["display_name"]

    async def test_token_exchange_uses_created_user(
        self, unauth_client, mock_zitadel, configured_settings,
    ):
        await unauth_client.post("/auth/guest")

        call = mock_zitadel.exchange_token.await_args
        assert call.kwargs["guest_user_id"] == "guest-user-id-123"
        assert call.kwargs["sa_token"] == "test-pat"
        assert call.kwargs["client_id"] == "test-client-id"

    async def test_503_when_service_account_not_configured(
        self, unauth_client, mock_zitadel, monkeypatch,
    ):
        monkeypatch.setattr(auth_guest_module.settings, "guest_sa_key", "")

        resp = await unauth_client.post("/auth/guest")
        assert resp.status_code == 503

    async def test_502_when_zitadel_fails(
        self, unauth_client, mock_zitadel, configured_settings,
    ):
        mock_zitadel.create_shadow_user.side_effect = RuntimeError("Zitadel down")

        resp = await unauth_client.post("/auth/guest")
        assert resp.status_code == 502


class TestRateLimit:
    async def test_allows_up_to_limit(
        self, unauth_client, mock_zitadel, configured_settings,
    ):
        # RATE_LIMIT = 10 per hour per IP
        for _ in range(auth_guest_module.RATE_LIMIT):
            resp = await unauth_client.post("/auth/guest")
            assert resp.status_code == 200

    async def test_blocks_over_limit(
        self, unauth_client, mock_zitadel, configured_settings,
    ):
        for _ in range(auth_guest_module.RATE_LIMIT):
            await unauth_client.post("/auth/guest")

        resp = await unauth_client.post("/auth/guest")
        assert resp.status_code == 429
        assert "too many" in resp.json()["detail"].lower()

    async def test_allows_again_after_window(
        self, unauth_client, mock_zitadel, configured_settings, monkeypatch,
    ):
        import time as _time

        for _ in range(auth_guest_module.RATE_LIMIT):
            await unauth_client.post("/auth/guest")

        # Pretend an hour has passed: push all timestamps back in time
        for ip, timestamps in auth_guest_module._guest_requests.items():
            auth_guest_module._guest_requests[ip] = [
                t - auth_guest_module.RATE_WINDOW - 1 for t in timestamps
            ]

        resp = await unauth_client.post("/auth/guest")
        assert resp.status_code == 200
