"""Unit tests for Zitadel client — JWT validation with mocked JWKS."""

import time
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from jose import jwt as jose_jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from clients.zitadel import ZitadelClient, ZitadelAuthError


def _generate_rsa_keypair():
    """Generate RSA key pair for test JWT signing."""
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    return private_key, public_key


def _make_jwks(public_key) -> dict:
    """Create JWKS dict from public key."""
    from jose.backends import RSAKey
    key = RSAKey(algorithm="RS256", key=public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode())
    jwk = key.to_dict()
    jwk["kid"] = "test-key-1"
    jwk["use"] = "sig"
    jwk["alg"] = "RS256"
    return {"keys": [jwk]}


def _sign_jwt(private_key, claims: dict) -> str:
    """Sign a JWT with the test private key."""
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    return jose_jwt.encode(claims, pem, algorithm="RS256", headers={"kid": "test-key-1"})


ISSUER = "http://test-zitadel:8080"
AUDIENCE = "test-project-id"


class TestZitadelClient:
    @pytest.fixture
    def keypair(self):
        return _generate_rsa_keypair()

    @pytest.fixture
    def valid_token(self, keypair):
        private_key, _ = keypair
        return _sign_jwt(private_key, {
            "sub": "user-uuid-123",
            "iss": ISSUER,
            "aud": [AUDIENCE],
            "exp": int(time.time()) + 3600,
        })

    @pytest.fixture
    def expired_token(self, keypair):
        private_key, _ = keypair
        return _sign_jwt(private_key, {
            "sub": "user-uuid-123",
            "iss": ISSUER,
            "aud": [AUDIENCE],
            "exp": int(time.time()) - 100,
        })

    async def test_get_user_id_success(self, keypair, valid_token):
        _, public_key = keypair
        jwks = _make_jwks(public_key)

        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)

        with patch.object(client, "_fetch_jwks", return_value=jwks):
            user_id = await client.get_user_id(valid_token)

        assert user_id == "user-uuid-123"

    async def test_expired_token_raises(self, keypair, expired_token):
        _, public_key = keypair
        jwks = _make_jwks(public_key)

        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)

        with patch.object(client, "_fetch_jwks", return_value=jwks):
            with pytest.raises(ZitadelAuthError, match="Token validation failed"):
                await client.get_user_id(expired_token)

    async def test_wrong_issuer_raises(self, keypair):
        private_key, public_key = keypair
        jwks = _make_jwks(public_key)
        token = _sign_jwt(private_key, {
            "sub": "user-uuid-123",
            "iss": "http://wrong-issuer",
            "aud": [AUDIENCE],
            "exp": int(time.time()) + 3600,
        })

        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)

        with patch.object(client, "_fetch_jwks", return_value=jwks):
            with pytest.raises(ZitadelAuthError):
                await client.get_user_id(token)

    async def test_no_sub_claim_raises(self, keypair):
        private_key, public_key = keypair
        jwks = _make_jwks(public_key)
        token = _sign_jwt(private_key, {
            "iss": ISSUER,
            "aud": [AUDIENCE],
            "exp": int(time.time()) + 3600,
            # no "sub"
        })

        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)

        with patch.object(client, "_fetch_jwks", return_value=jwks):
            with pytest.raises(ZitadelAuthError, match="no 'sub' claim"):
                await client.get_user_id(token)

    async def test_jwks_caching(self, keypair, valid_token):
        _, public_key = keypair
        jwks = _make_jwks(public_key)

        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        mock_fetch = AsyncMock(return_value=jwks)

        with patch("httpx.AsyncClient.get", return_value=MagicMock(json=lambda: jwks, raise_for_status=lambda: None)):
            # First call fetches
            await client._fetch_jwks()
            # Second call should use cache
            result = await client._fetch_jwks()

        assert result == jwks


def _mock_http_response(status_code: int, json_data=None, text: str = ""):
    """Build a MagicMock that looks enough like an httpx Response."""
    resp = MagicMock()
    resp.status_code = status_code
    resp.json = lambda: json_data or {}
    resp.text = text
    return resp


class TestCreateShadowUser:
    async def test_sends_expected_body(self):
        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        post_mock = AsyncMock(return_value=_mock_http_response(201, {"userId": "new-user-456"}))

        with patch("httpx.AsyncClient.post", post_mock):
            user_id = await client.create_shadow_user(
                sa_token="test-pat",
                org_id="test-org-id",
                public_name="bright-nebula-a7f2",
            )

        assert user_id == "new-user-456"
        call = post_mock.await_args
        assert call.args[0] == f"{ISSUER}/v2/users/new"
        body = call.kwargs["json"]
        assert body["organizationId"] == "test-org-id"
        assert body["human"]["profile"]["givenName"] == "Guest"
        assert body["human"]["profile"]["familyName"] == "User"
        assert "@skymap.guest" in body["human"]["email"]["email"]
        assert body["human"]["email"]["isEmailVerified"] is True

        # Metadata: both GUEST_CREATED and GUEST_PUBLIC_NAME should be present
        meta_keys = {m["key"] for m in body["metadata"]}
        assert meta_keys == {"GUEST_CREATED", "GUEST_PUBLIC_NAME"}
        # public_name is base64 encoded
        import base64
        public_name_entry = next(m for m in body["metadata"] if m["key"] == "GUEST_PUBLIC_NAME")
        assert base64.b64decode(public_name_entry["value"]).decode() == "bright-nebula-a7f2"

        # Bearer auth on the call
        assert call.kwargs["headers"]["Authorization"] == "Bearer test-pat"

    async def test_falls_back_to_id_field(self):
        """v2 API returns `id` instead of `userId` in some versions."""
        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        with patch("httpx.AsyncClient.post", AsyncMock(return_value=_mock_http_response(200, {"id": "legacy-id-789"}))):
            user_id = await client.create_shadow_user(
                sa_token="test-pat",
                org_id="test-org-id",
                public_name="dark-comet-beef",
            )
        assert user_id == "legacy-id-789"

    async def test_raises_on_http_error(self):
        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        with patch("httpx.AsyncClient.post", AsyncMock(return_value=_mock_http_response(400, None, "bad request"))):
            with pytest.raises(ZitadelAuthError, match="Failed to create shadow user"):
                await client.create_shadow_user(
                    sa_token="test-pat",
                    org_id="test-org-id",
                    public_name="swift-moon-1234",
                )

    async def test_raises_when_no_user_id_in_response(self):
        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        with patch("httpx.AsyncClient.post", AsyncMock(return_value=_mock_http_response(201, {}))):
            with pytest.raises(ZitadelAuthError, match="No userId/id"):
                await client.create_shadow_user(
                    sa_token="test-pat",
                    org_id="test-org-id",
                    public_name="faint-star-0001",
                )


class TestExchangeToken:
    async def test_requests_jwt_with_offline_access(self):
        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        post_mock = AsyncMock(return_value=_mock_http_response(200, {
            "access_token": "eyJ.jwt.here",
            "refresh_token": "rt-abc",
            "token_type": "Bearer",
            "expires_in": 43199,
        }))

        with patch("httpx.AsyncClient.post", post_mock):
            result = await client.exchange_token(
                sa_token="test-pat",
                guest_user_id="guest-123",
                client_id="test-client-id",
            )

        assert result["access_token"] == "eyJ.jwt.here"
        assert result["refresh_token"] == "rt-abc"
        assert result["expires_in"] == 43199

        body = post_mock.await_args.kwargs["data"]
        assert body["grant_type"] == "urn:ietf:params:oauth:grant-type:token-exchange"
        assert body["subject_token"] == "guest-123"
        assert body["subject_token_type"] == "urn:zitadel:params:oauth:token-type:user_id"
        assert body["actor_token"] == "test-pat"
        # CRITICAL: without "jwt" here Zitadel returns an opaque token that
        # our JWKS validation can't verify. See lessons learned in docs.
        assert body["requested_token_type"] == "urn:ietf:params:oauth:token-type:jwt"
        # offline_access scope is what tells Zitadel to mint a refresh_token.
        assert "offline_access" in body["scope"]
        assert body["client_id"] == "test-client-id"

    async def test_raises_on_error(self):
        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        with patch("httpx.AsyncClient.post", AsyncMock(return_value=_mock_http_response(403, None, "impersonation denied"))):
            with pytest.raises(ZitadelAuthError, match="Token exchange failed"):
                await client.exchange_token(
                    sa_token="test-pat",
                    guest_user_id="guest-123",
                    client_id="test-client-id",
                )


class TestDeleteUser:
    async def test_returns_true_on_success(self):
        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        with patch("httpx.AsyncClient.delete", AsyncMock(return_value=_mock_http_response(200))):
            assert await client.delete_user("test-pat", "user-id") is True

    async def test_returns_true_on_already_gone(self):
        """404 means the user is already deleted — for a cleanup cron
        that's still a success."""
        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        with patch("httpx.AsyncClient.delete", AsyncMock(return_value=_mock_http_response(404))):
            assert await client.delete_user("test-pat", "user-id") is True

    async def test_returns_false_on_other_errors(self):
        client = ZitadelClient(issuer_url=ISSUER, audience=AUDIENCE)
        with patch("httpx.AsyncClient.delete", AsyncMock(return_value=_mock_http_response(500, None, "internal"))):
            assert await client.delete_user("test-pat", "user-id") is False
