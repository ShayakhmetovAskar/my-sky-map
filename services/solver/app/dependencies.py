"""FastAPI dependencies: DB session, current user, services."""

import logging
import re
from typing import AsyncGenerator, Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import settings
from .services.storage import StorageService

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

security = HTTPBearer(auto_error=False)

_storage = StorageService()

# Lazy init — Zitadel client created on first use (avoids import-time HTTP calls)
_zitadel_client = None


def _get_zitadel_client():
    global _zitadel_client
    if _zitadel_client is None:
        from clients.zitadel import ZitadelClient
        _zitadel_client = ZitadelClient(
            issuer_url=settings.zitadel_issuer_url,
            audience=settings.zitadel_audience,
        )
    return _zitadel_client


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def _validate_token(token: str) -> str:
    """Validate JWT and return Zitadel user_id (sub claim)."""
    try:
        client = _get_zitadel_client()
        return await client.get_user_id(token)
    except Exception as e:
        logger.warning("Auth failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """Strict auth — requires valid JWT. Used for merge endpoint."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    return await _validate_token(credentials.credentials)


async def get_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_anonymous_id: Optional[str] = Header(None),
) -> str:
    """Flexible auth — accepts JWT or anonymous ID header."""
    # 1. JWT present → validate and return Zitadel user_id
    if credentials and credentials.credentials:
        return await _validate_token(credentials.credentials)
    # 2. Anonymous header → validate UUID format and return prefixed anon ID
    if x_anonymous_id:
        if len(x_anonymous_id) > 36 or not re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", x_anonymous_id, re.I):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid anonymous ID format")
        return f"anon_{x_anonymous_id}"
    # 3. Nothing → reject
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Provide Authorization header or X-Anonymous-Id",
    )


def get_storage() -> StorageService:
    return _storage
