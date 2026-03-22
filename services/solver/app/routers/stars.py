"""Star catalog — 3-level lookup: in-memory cache → PostgreSQL → SIMBAD API."""

import asyncio
import json
import logging
import re
import signal
from functools import lru_cache
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_db
from ..models.db import StarAlias, StarCatalog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stars", tags=["Stars"])

# In-memory LRU cache: source_id → proper_name (or None for negative cache)
_MAX_CACHE_SIZE = 10_000
_cache: dict[str, Optional[str]] = {}

# Validate source_id: Gaia DR3 source_id is a positive integer (up to 19 digits)
_SOURCE_ID_PATTERN = re.compile(r"^\d{1,19}$")

SIMBAD_TIMEOUT = 10  # seconds


def _seed_cache():
    """Load IAU star names from JSON into cache on startup."""
    data_file = Path(__file__).parent.parent / "data" / "star_names.json"
    if data_file.exists():
        try:
            data = json.loads(data_file.read_text())
            _cache.update(data)
            logger.info("Loaded %d star names into cache", len(data))
        except json.JSONDecodeError as e:
            logger.error("Failed to parse star names: %s", e)


_seed_cache()


def _evict_cache_if_needed():
    """Remove oldest entries if cache exceeds limit."""
    if len(_cache) > _MAX_CACHE_SIZE:
        excess = len(_cache) - _MAX_CACHE_SIZE
        keys_to_remove = list(_cache.keys())[:excess]
        for k in keys_to_remove:
            del _cache[k]


async def _lookup_simbad(source_id: str) -> Optional[dict]:
    """Query SIMBAD for star identifiers by Gaia DR3 source_id.

    Returns dict with available fields or None if not found.
    Runs in thread pool since astroquery is synchronous.
    """

    def _query():
        try:
            from astroquery.simbad import Simbad

            simbad = Simbad()
            simbad.add_votable_fields("ids", "sp", "flux(V)", "flux(B)")
            simbad.TIMEOUT = SIMBAD_TIMEOUT

            result = simbad.query_object(f"Gaia DR3 {source_id}")
            if result is None or len(result) == 0:
                return None

            row = result[0]
            main_id = str(row["MAIN_ID"]) if row["MAIN_ID"] else None

            # Parse identifiers
            ids_str = str(row.get("IDS", ""))
            identifiers = [s.strip() for s in ids_str.split("|") if s.strip()]

            info = {"main_id": main_id, "identifiers": identifiers}

            # Extract catalog IDs from identifiers
            for ident in identifiers:
                if ident.startswith("HIP "):
                    try:
                        info["hip_id"] = int(ident[4:])
                    except ValueError:
                        pass
                elif ident.startswith("HD "):
                    try:
                        info["hd_id"] = int(ident[3:])
                    except ValueError:
                        pass
                elif ident.startswith("HR "):
                    try:
                        info["hr_id"] = int(ident[3:])
                    except ValueError:
                        pass
                elif ident.startswith("SAO "):
                    try:
                        info["sao_id"] = int(ident[4:])
                    except ValueError:
                        pass
                elif ident.startswith("TYC "):
                    info["tyc_id"] = ident[4:]
                elif ident.startswith("BD"):
                    info["bd_id"] = ident

            # Spectral type
            sp = row.get("SP_TYPE")
            if sp and str(sp) != "--":
                info["spectral_type"] = str(sp)

            # Magnitudes
            flux_v = row.get("FLUX_V")
            if flux_v and str(flux_v) != "--":
                try:
                    info["mag_v"] = float(flux_v)
                except (ValueError, TypeError):
                    pass

            flux_b = row.get("FLUX_B")
            if flux_b and str(flux_b) != "--":
                try:
                    info["mag_b"] = float(flux_b)
                except (ValueError, TypeError):
                    pass

            return info
        except Exception as e:
            logger.warning("SIMBAD query failed for %s: %s", source_id, e)
            return None

    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_query),
            timeout=SIMBAD_TIMEOUT + 5,
        )
    except asyncio.TimeoutError:
        logger.warning("SIMBAD query timed out for %s", source_id)
        return None


async def _save_simbad_result(db: AsyncSession, source_id: str, simbad_data: dict):
    """Save SIMBAD result to star_catalog and star_aliases. Handles race conditions."""
    try:
        star = StarCatalog(
            source_id=source_id,
            proper_name=simbad_data.get("main_id"),
            hip_id=simbad_data.get("hip_id"),
            hd_id=simbad_data.get("hd_id"),
            hr_id=simbad_data.get("hr_id"),
            sao_id=simbad_data.get("sao_id"),
            tyc_id=simbad_data.get("tyc_id"),
            bd_id=simbad_data.get("bd_id"),
            spectral_type=simbad_data.get("spectral_type"),
            mag_v=simbad_data.get("mag_v"),
            mag_b=simbad_data.get("mag_b"),
            source="simbad",
        )
        db.add(star)

        for ident in simbad_data.get("identifiers", []):
            catalog = ident.split(" ")[0] if " " in ident else "other"
            db.add(StarAlias(source_id=source_id, alias=ident, catalog=catalog))

        await db.commit()
    except IntegrityError:
        # Race condition: another request already inserted this star
        await db.rollback()
        logger.debug("Star %s already exists (race condition), skipping insert", source_id)


def _validate_source_id(source_id: str):
    """Validate Gaia DR3 source_id format."""
    if not _SOURCE_ID_PATTERN.match(source_id):
        raise HTTPException(status_code=400, detail="Invalid source_id format")


@router.get("/{source_id}")
async def get_star_name(source_id: str, db: AsyncSession = Depends(get_db)):
    _validate_source_id(source_id)

    # 1. In-memory cache
    if source_id in _cache:
        name = _cache[source_id]
        if name is not None:
            return {"ProperName": name}
        raise HTTPException(status_code=404, detail="Star name not found")

    # 2. DB lookup
    result = await db.execute(
        select(StarCatalog).where(StarCatalog.source_id == source_id)
    )
    star = result.scalar_one_or_none()
    if star:
        _cache[source_id] = star.proper_name
        _evict_cache_if_needed()
        if star.proper_name:
            return {"ProperName": star.proper_name}
        raise HTTPException(status_code=404, detail="Star name not found")

    # 3. SIMBAD fallback
    simbad_data = await _lookup_simbad(source_id)
    if simbad_data:
        await _save_simbad_result(db, source_id, simbad_data)
        name = simbad_data.get("main_id")
        _cache[source_id] = name
        _evict_cache_if_needed()
        if name:
            return {"ProperName": name}

    # 4. Cache negative result
    _cache[source_id] = None
    _evict_cache_if_needed()
    raise HTTPException(status_code=404, detail="Star name not found")


@router.get("/{source_id}/details")
async def get_star_details(source_id: str, db: AsyncSession = Depends(get_db)):
    """Full star card with all catalog data and aliases."""
    _validate_source_id(source_id)

    result = await db.execute(
        select(StarCatalog).where(StarCatalog.source_id == source_id)
    )
    star = result.scalar_one_or_none()

    if not star:
        # Try SIMBAD
        simbad_data = await _lookup_simbad(source_id)
        if simbad_data:
            await _save_simbad_result(db, source_id, simbad_data)
            result = await db.execute(
                select(StarCatalog).where(StarCatalog.source_id == source_id)
            )
            star = result.scalar_one_or_none()

    if not star:
        raise HTTPException(status_code=404, detail="Star not found")

    # Get aliases
    aliases_result = await db.execute(
        select(StarAlias).where(StarAlias.source_id == source_id)
    )
    aliases = aliases_result.scalars().all()

    return {
        "source_id": star.source_id,
        "proper_name": star.proper_name,
        "identifiers": {
            "HIP": star.hip_id,
            "HD": star.hd_id,
            "HR": star.hr_id,
            "SAO": star.sao_id,
            "TYC": star.tyc_id,
            "BD": star.bd_id,
            "Bayer": star.bayer,
            "Flamsteed": star.flamsteed,
        },
        "astrometry": {
            "ra": star.ra,
            "dec": star.dec,
            "parallax": star.parallax,
            "distance_ly": star.distance_ly,
            "pm_ra": star.pm_ra,
            "pm_dec": star.pm_dec,
            "radial_velocity": star.radial_velocity,
        },
        "photometry": {
            "mag_v": star.mag_v,
            "mag_b": star.mag_b,
            "mag_g": star.mag_g,
            "abs_mag": star.abs_mag,
            "color_bv": star.color_bv,
        },
        "physical": {
            "spectral_type": star.spectral_type,
            "temperature": star.temperature,
            "luminosity": star.luminosity,
            "mass": star.mass,
            "radius": star.radius,
        },
        "classification": {
            "object_type": star.object_type,
            "constellation": star.constellation,
            "variability_type": star.variability_type,
        },
        "aliases": [a.alias for a in aliases],
    }
