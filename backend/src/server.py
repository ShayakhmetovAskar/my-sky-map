import math

from fastapi import FastAPI, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.queries import get_stars_nside_pix


def validate_parameters(nside: int, pix: int):
    """
    Валидация параметров nside и pix.

    - nside должен быть степенью двойки начиная с 1 (1, 2, 4, 8, ...)
    - pix должен быть меньше чем 12 * nside ** 2
    """

    if nside < 1 or not math.log2(nside).is_integer():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="nside must be a power of two"
        )

    max_pix = 12 * nside ** 2
    if pix >= max_pix:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"pix must be less than {max_pix} for nside={nside}"
        )


app = FastAPI()


@app.get("/stars/get")
async def get_stars_in_fov_api(
        nside: int = Query(..., description="nside"),
        pix: int = Query(..., description="pix"),
        db: AsyncSession = Depends(get_db),
):
    validate_parameters(nside, pix)

    stars = await get_stars_nside_pix(db, nside, pix)
    return [
        {
            "source_id": star.source_id,
            "ra": star.ra,
            "de": star.dec,
            "vmag": star.phot_g_mean_mag,
            "b_v": (
                (star.phot_bp_mean_mag - star.phot_g_mean_mag)
                if star.phot_bp_mean_mag is not None and star.phot_g_mean_mag is not None
                else 0.0  # Neutral white color
            ),
            "nside": star.nside,
            "pix": star.pix
        }
        for star in stars
    ]
