"""FastAPI dependencies: DB session, current user, services."""

import logging
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import settings
from .services.storage import StorageService

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

security = HTTPBearer()

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


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Validate JWT via Zitadel JWKS and return user_id (sub claim)."""
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    try:
        client = _get_zitadel_client()
        user_id = await client.get_user_id(token)
        return user_id
    except Exception as e:
        logger.warning("Auth failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_storage() -> StorageService:
    return _storage
