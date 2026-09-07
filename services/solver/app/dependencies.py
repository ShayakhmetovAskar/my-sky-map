"""FastAPI dependencies: DB session, current user, services."""

import logging
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import settings
from .services.hips_storage import HipsStorage
from .services.storage import StorageService

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

security = HTTPBearer()

_storage = StorageService()

# Lazy init — Zitadel client created on first use (avoids import-time HTTP calls)
_zitadel_client = None

# Lazy init — the public bucket is only touched on delete/rotate, and its
# credentials are an optional Secret in the cluster (see docs/hips-storage.md).
_hips_storage = None


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


async def get_is_guest(user_id: str = Depends(get_current_user)) -> bool:
    """Whether the caller is a guest (shadow) account.

    Guests may share, but their claim on the data is a refresh token in localStorage, so
    anything they share has to expire on its own (design §5) — `POST /me/collections/{id}/share`
    stamps `expires_at` when this is true.

    Guest auth (APO-40) has not landed on this branch and nothing distinguishes a shadow
    account from a real one yet, so today this is False for everyone: shares simply never
    expire. This function is the single place APO-40 has to teach about its shadow org.
    """
    return False


def get_storage() -> StorageService:
    return _storage


def get_hips_storage() -> HipsStorage:
    global _hips_storage
    if _hips_storage is None:
        _hips_storage = HipsStorage()
    return _hips_storage
