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
