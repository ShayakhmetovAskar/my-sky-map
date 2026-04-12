"""Scenario test — real end-to-end guest auth flow through real Zitadel.

No mocks of Zitadel. The test:
  1. Calls create_shadow_user against a running Zitadel instance
  2. Exchanges the service account token for a guest JWT
  3. Verifies the returned JWT validates through our JWKS-based auth
  4. Uses the JWT to hit our API endpoints as the guest
  5. Cleans up by deleting the shadow user

Requires env vars:
  - ZITADEL_ISSUER_URL
  - ZITADEL_ADMIN_PAT  (service account PAT with IAM_USER_MANAGER + IAM_END_USER_IMPERSONATOR)
  - GUEST_ORG_ID
  - GUEST_CLIENT_ID

The test SKIPs when they aren't set so `make test-scenario` still runs
without a full Zitadel stack in CI.
"""

import os

import pytest
from httpx import ASGITransport, AsyncClient

from app.dependencies import get_current_user, get_db
from app.guest_names import generate_guest_name
from app.main import app
from clients.zitadel import ZitadelClient


ZITADEL_ISSUER = os.environ.get("ZITADEL_ISSUER_URL", "")
ZITADEL_PAT = os.environ.get("ZITADEL_ADMIN_PAT", "")
ZITADEL_AUDIENCE = os.environ.get("ZITADEL_AUDIENCE", "")
GUEST_ORG_ID = os.environ.get("GUEST_ORG_ID", "")
GUEST_CLIENT_ID = os.environ.get("GUEST_CLIENT_ID", "")


requires_real_zitadel = pytest.mark.skipif(
    not (ZITADEL_ISSUER and ZITADEL_PAT and GUEST_ORG_ID and GUEST_CLIENT_ID),
    reason="Real Zitadel scenario test requires ZITADEL_ISSUER_URL, "
           "ZITADEL_ADMIN_PAT, GUEST_ORG_ID and GUEST_CLIENT_ID env vars",
)


@pytest.fixture
def zitadel_client():
    return ZitadelClient(issuer_url=ZITADEL_ISSUER, audience=ZITADEL_AUDIENCE)


@requires_real_zitadel
class TestRealZitadelGuestFlow:
    async def test_create_shadow_user_and_exchange_token(self, zitadel_client):
        """Creates a real Zitadel user and exchanges a real JWT.

        Cleans up the created user afterwards even if assertions fail.
        """
        public_name = generate_guest_name()
        user_id = None
        try:
            user_id = await zitadel_client.create_shadow_user(
                sa_token=ZITADEL_PAT,
                org_id=GUEST_ORG_ID,
                public_name=public_name,
            )
            assert user_id  # Zitadel numeric id

            # Exchange for a guest JWT with refresh token (offline_access scope)
            token_data = await zitadel_client.exchange_token(
                sa_token=ZITADEL_PAT,
                guest_user_id=user_id,
                client_id=GUEST_CLIENT_ID,
            )

            assert token_data["access_token"].count(".") == 2, \
                "Expected a JWT (header.payload.signature); got opaque token. " \
                "Check accessTokenType=JWT on the OIDC app and " \
                "requested_token_type=...token-type:jwt in exchange_token()."
            assert token_data["refresh_token"], \
                "Expected a refresh_token from offline_access scope"
            assert token_data["expires_in"] > 0

            # The JWT must validate through the same path as a real user
            validated_user_id = await zitadel_client.get_user_id(token_data["access_token"])
            assert validated_user_id == user_id, \
                "JWT sub claim must match the shadow user we created"

        finally:
            if user_id:
                deleted = await zitadel_client.delete_user(ZITADEL_PAT, user_id)
                assert deleted, f"Cleanup failed: could not delete shadow user {user_id}"

    async def test_guest_can_hit_protected_endpoint(self, zitadel_client):
        """After getting a real JWT the guest should be treated as an
        authenticated user by our API — the /submissions list should
        return 200 with an empty result, never 401.
        """
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

        from tests.scenario.conftest import TEST_DB_URL

        public_name = generate_guest_name()
        user_id = None

        # Override DB just like the default scenario client fixture
        engine = create_async_engine(TEST_DB_URL, echo=False)
        session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async def override_get_db():
            async with session_factory() as session:
                yield session

        app.dependency_overrides[get_db] = override_get_db
        # No override for get_current_user — we want REAL JWT validation

        try:
            user_id = await zitadel_client.create_shadow_user(
                sa_token=ZITADEL_PAT,
                org_id=GUEST_ORG_ID,
                public_name=public_name,
            )
            token_data = await zitadel_client.exchange_token(
                sa_token=ZITADEL_PAT,
                guest_user_id=user_id,
                client_id=GUEST_CLIENT_ID,
            )

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            ) as ac:
                resp = await ac.get("/submissions")

            assert resp.status_code == 200
            assert resp.json() == {"items": [], "total": 0}

        finally:
            app.dependency_overrides.clear()
            await engine.dispose()
            if user_id:
                await zitadel_client.delete_user(ZITADEL_PAT, user_id)

    async def test_refresh_token_mints_new_jwt(self, zitadel_client):
        """Verify refresh_token grant returns a fresh (possibly rotated)
        refresh token and a new JWT — the foundation for long-lived
        guest sessions on the frontend.
        """
        import httpx

        public_name = generate_guest_name()
        user_id = None

        try:
            user_id = await zitadel_client.create_shadow_user(
                sa_token=ZITADEL_PAT,
                org_id=GUEST_ORG_ID,
                public_name=public_name,
            )
            first = await zitadel_client.exchange_token(
                sa_token=ZITADEL_PAT,
                guest_user_id=user_id,
                client_id=GUEST_CLIENT_ID,
            )
            refresh_token = first["refresh_token"]
            assert refresh_token

            async with httpx.AsyncClient(timeout=15) as http:
                resp = await http.post(
                    f"{ZITADEL_ISSUER}/oauth/v2/token",
                    data={
                        "grant_type": "refresh_token",
                        "refresh_token": refresh_token,
                        "client_id": GUEST_CLIENT_ID,
                        "scope": "openid profile offline_access",
                    },
                )

            assert resp.status_code == 200, f"Refresh failed: {resp.text}"
            data = resp.json()
            assert data["access_token"].count(".") == 2, \
                "Refreshed access_token must still be a JWT (app's accessTokenType=JWT)"
            # The new JWT must still validate and point to the same guest
            validated = await zitadel_client.get_user_id(data["access_token"])
            assert validated == user_id

        finally:
            if user_id:
                await zitadel_client.delete_user(ZITADEL_PAT, user_id)
