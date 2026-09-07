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


# APO-40 MERGE BLOCKER: `get_is_guest` below is a stub. Guest auth must teach it about
# the shadow org before it ships, or every guest share becomes a permanent link owned by
# an account whose only claim is a refresh token in localStorage — the "ссылки-призраки"
# scenario `expires_at` exists to prevent (docs/my-sky-collections-sharing.md §5).
logger.warning(
    "APO-40 MERGE BLOCKER: guest detection is not wired (dependencies.get_is_guest is a "
    "stub returning False) — collection shares never expire. See docs/my-sky-collections-"
    "sharing.md §5."
)


async def get_is_guest(user_id: str = Depends(get_current_user)) -> bool:
    """Whether the caller is a guest (shadow) account.

    Guests may share, but their claim on the data is a refresh token in localStorage, so
    anything they share has to expire on its own (design §5) — `POST /me/collections/{id}/share`
    stamps `expires_at` when this is true.

    APO-40 MERGE BLOCKER — this is a stub. Guest auth has not landed on this branch and
    nothing distinguishes a shadow account from a real one yet, so today it is False for
    everyone and `extend_guest_expiry` is a permanent no-op: shares never expire. The
    tests that cover the expiry path (`test_public_sky.py::test_guest_share_expires_in_30_days`)
    pass by overriding this dependency, so they will keep passing against the stub —
    hence the warning logged at import above, which is the only thing that fails loudly.

    APO-40 has to replace the body with the shadow-org claim (the org id from
    `docs/guest-auth-setup.md`, or a `settings.guest_sub_prefix` check) and drop that
    warning. This is the single place it has to touch.
    """
    return False


def get_zitadel():
    """Zitadel client as a FastAPI dependency (see `services.account_cleanup`).

    Only account deletion asks for it explicitly; `get_current_user` keeps using
    the same lazily built instance directly.
    """
    return _get_zitadel_client()


def get_storage() -> StorageService:
    return _storage


def get_hips_storage() -> HipsStorage:
    global _hips_storage
    if _hips_storage is None:
        _hips_storage = HipsStorage()
    return _hips_storage
