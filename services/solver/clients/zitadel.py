"""Zitadel client — JWKS fetching, JWT validation, and user management.

Validates JWT tokens issued by Zitadel using public keys from JWKS endpoint.
Supports shadow user creation and token exchange for guest authentication.
Caches JWKS in memory to avoid fetching on every request.
"""

import base64
import logging
import time
import uuid
from typing import Optional

import httpx
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

JWKS_CACHE_TTL = 3600  # 1 hour


class ZitadelClient:
    def __init__(self, issuer_url: str, audience: str):
        self.issuer_url = issuer_url.rstrip("/")
        self.jwks_url = f"{self.issuer_url}/oauth/v2/keys"
        self.audience = audience
        self._jwks: Optional[dict] = None
        self._jwks_fetched_at: float = 0

    async def _fetch_jwks(self) -> dict:
        """Fetch JWKS from Zitadel, with caching."""
        now = time.time()
        if self._jwks and (now - self._jwks_fetched_at) < JWKS_CACHE_TTL:
            return self._jwks

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(self.jwks_url)
            resp.raise_for_status()
            self._jwks = resp.json()
            self._jwks_fetched_at = now
            logger.info("Fetched JWKS from %s (%d keys)", self.jwks_url, len(self._jwks.get("keys", [])))
            return self._jwks

    async def validate_token(self, token: str) -> dict:
        """Validate JWT and return decoded payload.

        Verifies:
        - Signature (RS256 via JWKS public key)
        - Expiration (exp)
        - Issuer (iss)
        - Audience (aud) — if configured

        Returns the full JWT payload dict.
        Raises ZitadelAuthError on any validation failure.
        """
        jwks = await self._fetch_jwks()

        options = {
            "verify_aud": bool(self.audience),
            "verify_iss": True,
            "verify_exp": True,
        }

        try:
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["RS256"],
                audience=self.audience or None,
                issuer=self.issuer_url,
                options=options,
            )
            return payload
        except JWTError as e:
            # On signature failure, try refetching JWKS (key rotation)
            if self._jwks_fetched_at < time.time() - 60:
                logger.info("JWT validation failed, refetching JWKS (possible key rotation)")
                self._jwks = None
                jwks = await self._fetch_jwks()
                try:
                    payload = jwt.decode(
                        token,
                        jwks,
                        algorithms=["RS256"],
                        audience=self.audience or None,
                        issuer=self.issuer_url,
                        options=options,
                    )
                    return payload
                except JWTError:
                    pass
            raise ZitadelAuthError(f"Token validation failed: {e}") from e

    async def get_user_id(self, token: str) -> str:
        """Validate token and return user_id (sub claim)."""
        payload = await self.validate_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise ZitadelAuthError("Token has no 'sub' claim")
        return user_id

    # --- Guest (Shadow Account) methods ---

    async def create_shadow_user(
        self,
        sa_token: str,
        org_id: str,
        public_name: str,
        display_name: str = "Guest User",
    ) -> str:
        """Create a shadow user in Zitadel (no email/password).

        Stores creation date and public_name in metadata so support can
        look up a guest by their human-readable ID.

        Returns user_id.
        """
        created_metadata = base64.b64encode(
            time.strftime("%Y-%m-%d").encode()
        ).decode()
        public_name_metadata = base64.b64encode(public_name.encode()).decode()

        body = {
            "organizationId": org_id,
            "human": {
                "profile": {
                    "givenName": "Guest",
                    "familyName": "User",
                    "displayName": display_name,
                },
                "email": {
                    "email": f"guest-{uuid.uuid4().hex[:12]}@skymap.guest",
                    "isEmailVerified": True,
                },
            },
            "metadata": [
                {"key": "GUEST_CREATED", "value": created_metadata},
                {"key": "GUEST_PUBLIC_NAME", "value": public_name_metadata},
            ],
        }

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{self.issuer_url}/v2/users/new",
                json=body,
                headers={"Authorization": f"Bearer {sa_token}"},
            )
            if resp.status_code not in (200, 201):
                raise ZitadelAuthError(f"Failed to create shadow user: {resp.status_code} {resp.text}")
            data = resp.json()

        user_id = data.get("userId") or data.get("id")
        if not user_id:
            raise ZitadelAuthError(f"No userId/id in response: {data}")

        logger.info("Created shadow user %s", user_id)
        return user_id

    async def exchange_token(self, sa_token: str, guest_user_id: str, client_id: str = "") -> dict:
        """Exchange service account token for a guest user JWT via Token Exchange (RFC 8693).

        Requests offline_access scope to receive a refresh_token for persistent sessions.
        Returns dict with keys: access_token, refresh_token (optional), token_type, expires_in.
        """
        body = {
            "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
            "client_id": client_id,
            "subject_token": guest_user_id,
            "subject_token_type": "urn:zitadel:params:oauth:token-type:user_id",
            "actor_token": sa_token,
            "actor_token_type": "urn:ietf:params:oauth:token-type:access_token",
            "scope": "openid profile offline_access",
            "requested_token_type": "urn:ietf:params:oauth:token-type:jwt",
        }

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{self.issuer_url}/oauth/v2/token",
                data=body,
                headers={"Authorization": f"Bearer {sa_token}"},
            )
            if resp.status_code != 200:
                raise ZitadelAuthError(f"Token exchange failed: {resp.status_code} {resp.text}")
            data = resp.json()

        logger.info("Token exchange succeeded for guest %s", guest_user_id)
        return {
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token"),
            "token_type": data.get("token_type", "Bearer"),
            "expires_in": data.get("expires_in", 3600),
        }

    async def delete_user(self, sa_token: str, user_id: str) -> bool:
        """Delete a user (for guest cleanup).

        Returns True if deletion succeeded (or user was already gone),
        False on any other error so the caller can decide whether to retry.
        """
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.delete(
                f"{self.issuer_url}/v2/users/{user_id}",
                headers={"Authorization": f"Bearer {sa_token}"},
            )

        if resp.status_code in (200, 204, 404):
            logger.info("Deleted user %s (status %s)", user_id, resp.status_code)
            return True

        logger.warning("Failed to delete user %s: %s %s", user_id, resp.status_code, resp.text)
        return False


class ZitadelAuthError(Exception):
    """Raised when JWT validation or user management fails."""
    pass
