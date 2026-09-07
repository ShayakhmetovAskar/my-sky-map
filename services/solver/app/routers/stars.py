"""Star catalog — 3-level lookup: in-memory cache → PostgreSQL → SIMBAD API."""

import asyncio
import json
import logging
import re
import time
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

# In-memory LRU cache: source_id → proper_name ("" for a known star without a name)
_MAX_CACHE_SIZE = 10_000
_cache: OrderedDict[str, Optional[str]] = OrderedDict()
_cache_lock = asyncio.Lock()

# Negative cache: source_id → monotonic expiry. Faint Gaia stars are absent from
# SIMBAD and every miss costs three timed-out queries, so misses are remembered —
# but only for a while, and only for a real "not found" (see SimbadUnavailable).
NEGATIVE_CACHE_TTL = 24 * 60 * 60  # seconds
_negative_cache: OrderedDict[str, float] = OrderedDict()


class SimbadUnavailable(Exception):
    """SIMBAD could not be asked (timeout, network, server error).

    Distinct from "not found": callers must not negative-cache this, otherwise a
    short SIMBAD outage would hide star names for NEGATIVE_CACHE_TTL.
    """


# Limit concurrent SIMBAD requests
_simbad_semaphore = asyncio.Semaphore(10)

# Validate source_id: Gaia DR3 source_id (up to 19 digits) or HIP ID (up to 6 digits)
_SOURCE_ID_PATTERN = re.compile(r"^\d{1,19}$")

SIMBAD_TIMEOUT = 5  # seconds per SIMBAD HTTP request


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


def _evict_cache_if_needed(cache: OrderedDict = _cache):
    """Remove least recently used entries if cache exceeds limit."""
    while len(cache) > _MAX_CACHE_SIZE:
        cache.popitem(last=False)  # Remove oldest (front of OrderedDict)


def _simbad_query_sync(query_id: str):
    """One blocking SIMBAD query. Returns a non-empty table, or None if not found.

    Deliberately does not catch exceptions: a timeout or network error must reach
    `_lookup_simbad`, which turns it into SimbadUnavailable. Swallowing it here
    made an outage indistinguishable from "no such star".
    """
    from astroquery.simbad import Simbad
    simbad = Simbad()
    simbad.add_votable_fields("ids", "sp", "flux(V)", "flux(B)")
    simbad.TIMEOUT = SIMBAD_TIMEOUT
    result = simbad.query_object(query_id)
    if result is not None and len(result) > 0:
        return result
    return None


async def _lookup_simbad(source_id: str) -> Optional[dict]:
    """Query SIMBAD for star identifiers by Gaia DR3 source_id.

    Returns dict with available fields, or None if SIMBAD answered "not found".
    Raises SimbadUnavailable if no query answered and at least one failed.
    Runs in thread pool since astroquery is synchronous.
    """

    def _parse_result(result):
        """Parse SIMBAD result into dict. Extracted from _query for reuse."""
        if result is None or len(result) == 0:
            return None
        try:
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
            logger.warning("SIMBAD parse failed for %s: %s", source_id, e)
            return None

    # Build query list based on source_id length
    if len(source_id) <= 6:
        query_ids = [f"HIP {source_id}", f"Gaia DR3 {source_id}", f"Gaia DR2 {source_id}"]
    else:
        query_ids = [f"Gaia DR3 {source_id}", f"Gaia DR2 {source_id}"]

    async with _simbad_semaphore:
        # Run all queries in parallel
        tasks = [
            asyncio.wait_for(asyncio.to_thread(_simbad_query_sync, q), timeout=SIMBAD_TIMEOUT + 2)
            for q in query_ids
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    # Take first successful result
    for r in results:
        if r is not None and not isinstance(r, BaseException):
            return _parse_result(r)

    errors = [r for r in results if isinstance(r, BaseException)]
    if errors:
        # Nothing answered and something failed: we could not ask, which is not
        # the same as "not found". The failed query may have been the one that
        # would have matched.
        logger.warning("SIMBAD unavailable for %s: %r", source_id, errors[0])
        raise SimbadUnavailable(source_id) from errors[0]
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

    # 1. In-memory caches (LRU: move to end on hit)
    async with _cache_lock:
        if source_id in _cache:
            _cache.move_to_end(source_id)
            return {"ProperName": _cache[source_id]}
        expires_at = _negative_cache.get(source_id)
        if expires_at is not None:
            if time.monotonic() < expires_at:
                _negative_cache.move_to_end(source_id)
                return {"ProperName": ""}
            del _negative_cache[source_id]  # TTL passed — ask again

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
    try:
        simbad_data = await _lookup_simbad(source_id)
    except SimbadUnavailable:
        # Answer empty for now, but do NOT cache: this is "could not ask",
        # not "not found". The next request will try SIMBAD again.
        return {"ProperName": ""}
    if simbad_data:
        name = simbad_data.get("proper_name") or simbad_data.get("main_id") or ""
        await _save_simbad_result(db, source_id, simbad_data)
        async with _cache_lock:
            _cache[source_id] = name
            _evict_cache_if_needed()
        return {"ProperName": name}

    # 4. Not found anywhere — remember the miss for NEGATIVE_CACHE_TTL. Faint Gaia
    # stars are absent from SIMBAD, and every miss costs three queries at
    # SIMBAD_TIMEOUT each; without this the same star is re-queried on every
    # page load. The TTL bounds the damage if SIMBAD later learns the star.
    async with _cache_lock:
        _negative_cache[source_id] = time.monotonic() + NEGATIVE_CACHE_TTL
        _negative_cache.move_to_end(source_id)
        _evict_cache_if_needed(_negative_cache)
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
        try:
            simbad_data = await _lookup_simbad(source_id)
        except SimbadUnavailable:
            raise HTTPException(status_code=503, detail="Star lookup temporarily unavailable")
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
