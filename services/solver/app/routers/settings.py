"""User settings router — astrometry.net API key storage.

The key is persisted in the dedicated `astrometry_api_keys` table so the
plaintext secret lives in exactly one place. GET returns a masked value;
the raw key is never exposed by the API.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_current_user, get_db
from ..models.db import AstrometryApiKey
from ..models.schemas import UpdateUserSettingsRequest, UserSettingsResponse

router = APIRouter(prefix="/settings", tags=["Settings"])


def _mask_key(key: str) -> str:
    """Mask API key: show first 4 + last 4 chars."""
    if len(key) <= 8:
        return key[:2] + "***" + key[-2:]
    return key[:4] + "***" + key[-4:]


@router.get("", response_model=UserSettingsResponse)
async def get_settings(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(AstrometryApiKey, user_id)
    if not row or not row.api_key:
        return UserSettingsResponse(astrometry_api_key=None)
    return UserSettingsResponse(astrometry_api_key=_mask_key(row.api_key))


@router.put("", response_model=UserSettingsResponse, status_code=status.HTTP_200_OK)
async def update_settings(
    body: UpdateUserSettingsRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(AstrometryApiKey, user_id)
    if row:
        row.api_key = body.astrometry_api_key
    else:
        row = AstrometryApiKey(user_id=user_id, api_key=body.astrometry_api_key)
        db.add(row)

    await db.commit()
    await db.refresh(row)
    return UserSettingsResponse(astrometry_api_key=_mask_key(row.api_key))
