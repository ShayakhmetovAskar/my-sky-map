"""User settings router — API key management."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_current_user, get_db
from ..models.db import UserSettings
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
    row = await db.get(UserSettings, user_id)
    if not row or not row.astrometry_api_key:
        return UserSettingsResponse(astrometry_api_key=None)
    return UserSettingsResponse(astrometry_api_key=_mask_key(row.astrometry_api_key))


@router.put("", response_model=UserSettingsResponse, status_code=status.HTTP_200_OK)
async def update_settings(
    body: UpdateUserSettingsRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(UserSettings, user_id)
    if row:
        row.astrometry_api_key = body.astrometry_api_key
    else:
        row = UserSettings(user_id=user_id, astrometry_api_key=body.astrometry_api_key)
        db.add(row)

    await db.commit()
    await db.refresh(row)
    return UserSettingsResponse(astrometry_api_key=_mask_key(row.astrometry_api_key))
