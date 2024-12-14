from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Star


async def get_stars_nside_pix(db: AsyncSession, nside: int, pix: int):
    result = await db.execute(
        select(Star).filter(
            and_(
                Star.pix == pix,
                Star.nside == nside
            )
        )
    )

    return result.scalars().all()
