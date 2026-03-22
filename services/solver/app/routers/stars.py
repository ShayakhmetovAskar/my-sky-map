"""Star catalog — 3-level lookup: in-memory cache → PostgreSQL → SIMBAD API."""

import asyncio
import json
import logging
import re
from collections import OrderedDict
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
_cache: OrderedDict[str, Optional[str]] = OrderedDict()
_cache_lock = asyncio.Lock()

# Limit concurrent SIMBAD requests
_simbad_semaphore = asyncio.Semaphore(10)

# Validate source_id: Gaia DR3 source_id (up to 19 digits) or HIP ID (up to 6 digits)
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
    """Remove least recently used entries if cache exceeds limit."""
    while len(_cache) > _MAX_CACHE_SIZE:
        _cache.popitem(last=False)  # Remove oldest (front of OrderedDict)


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

            # Try Gaia DR3 first, then HIP for short IDs (HIP max 6 digits)
            query_id = f"Gaia DR3 {source_id}"
            if len(source_id) <= 6:
                query_id = f"HIP {source_id}"

            result = simbad.query_object(query_id)
            if result is None or len(result) == 0:
                # Fallback only makes sense if formats differ
                if len(source_id) <= 6:
                    # Already tried HIP, try Gaia
                    result = simbad.query_object(f"Gaia DR3 {source_id}")
                # Don't try HIP fallback for long IDs — HIP max 6 digits
                if result is None or len(result) == 0:
                    return None

            row = result[0]
            # Handle both old and new SIMBAD API column names
            main_id = None
            for col in ["MAIN_ID", "main_id"]:
                if col in row.colnames:
                    val = row[col]
                    if val and str(val) != "--":
                        main_id = str(val)
                        break

            # Parse identifiers
            ids_str = ""
            for col in ["IDS", "ids"]:
                if col in row.colnames:
                    ids_str = str(row[col])
                    break
            identifiers = [s.strip() for s in ids_str.split("|") if s.strip()]

            # Extract proper name from NAME identifiers (e.g. "NAME Sirius")
            proper_name = None
            for ident in identifiers:
                if ident.startswith("NAME "):
                    proper_name = ident[5:]
                    break

            # proper_name: IAU name if exists, otherwise SIMBAD main_id as display name
            info = {"main_id": main_id, "proper_name": proper_name or main_id, "identifiers": identifiers}

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
                elif ident.startswith("BD+") or ident.startswith("BD-"):
                    info["bd_id"] = ident

            # Spectral type (handle both old/new column names)
            for col in ["SP_TYPE", "sp_type"]:
                if col in row.colnames:
                    sp = row[col]
                    if sp and str(sp) != "--" and str(sp) != "":
                        info["spectral_type"] = str(sp)
                    break

            # Magnitudes
            for col in ["FLUX_V", "flux_v"]:
                if col in row.colnames:
                    try:
                        val = row[col]
                        if val and str(val) != "--":
                            info["mag_v"] = float(val)
                    except (ValueError, TypeError):
                        pass
                    break

            for col in ["FLUX_B", "flux_b"]:
                if col in row.colnames:
                    try:
                        val = row[col]
                        if val and str(val) != "--":
                            info["mag_b"] = float(val)
                    except (ValueError, TypeError):
                        pass
                    break

            return info
        except Exception as e:
            logger.warning("SIMBAD query failed for %s: %s", source_id, e)
            return None

    async with _simbad_semaphore:
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
            proper_name=simbad_data.get("proper_name") or simbad_data.get("main_id"),
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
            # Extract catalog prefix (handle BD+20, TYC 1234, etc.)
            if ident.startswith("BD+") or ident.startswith("BD-"):
                catalog = "BD"
            elif ident.startswith("NAME "):
                catalog = "NAME"
            elif " " in ident:
                catalog = ident.split(" ")[0]
            else:
                catalog = "other"
            db.add(StarAlias(source_id=source_id, alias=ident, catalog=catalog))

        await db.commit()
    except IntegrityError:
        await db.rollback()
        logger.debug("Star %s already exists (race condition), skipping insert", source_id)
    except Exception as e:
        await db.rollback()
        logger.warning("Failed to save star %s: %s", source_id, e)


def _validate_source_id(source_id: str):
    """Validate Gaia DR3 source_id format."""
    if not _SOURCE_ID_PATTERN.match(source_id):
        raise HTTPException(status_code=400, detail="Invalid source_id format")


@router.get("/{source_id}")
async def get_star_name(source_id: str, db: AsyncSession = Depends(get_db)):
    _validate_source_id(source_id)

    # 1. In-memory cache (LRU: move to end on hit)
    async with _cache_lock:
        if source_id in _cache:
            _cache.move_to_end(source_id)
            return {"ProperName": _cache[source_id]}

    # 2. DB lookup
    result = await db.execute(
        select(StarCatalog).where(StarCatalog.source_id == source_id)
    )
    star = result.scalar_one_or_none()
    if star:
        name = star.proper_name or ""
        async with _cache_lock:
            _cache[source_id] = name
            _evict_cache_if_needed()
        return {"ProperName": name}

    # 3. SIMBAD fallback
    simbad_data = await _lookup_simbad(source_id)
    if simbad_data:
        name = simbad_data.get("proper_name") or simbad_data.get("main_id") or ""
        await _save_simbad_result(db, source_id, simbad_data)
        async with _cache_lock:
            _cache[source_id] = name
            _evict_cache_if_needed()
        return {"ProperName": name}

    # 4. Not found anywhere — return empty, don't cache
    return {"ProperName": ""}


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
