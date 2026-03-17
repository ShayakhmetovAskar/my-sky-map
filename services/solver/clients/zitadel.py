"""Zitadel client — JWKS fetching and JWT validation.

Validates JWT tokens issued by Zitadel using public keys from JWKS endpoint.
Caches JWKS in memory to avoid fetching on every request.
"""

import logging
import time
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


class ZitadelAuthError(Exception):
    """Raised when JWT validation fails."""
    pass
