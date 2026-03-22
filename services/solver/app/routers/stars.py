"""Star name lookup — maps Gaia source_id to proper names."""

import json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stars", tags=["Stars"])

_STAR_NAMES: dict[str, str] = {}


def _load_star_names():
    global _STAR_NAMES
    data_file = Path(__file__).parent.parent / "data" / "star_names.json"
    if data_file.exists():
        try:
            _STAR_NAMES = json.loads(data_file.read_text())
            logger.info("Loaded %d star names", len(_STAR_NAMES))
        except json.JSONDecodeError as e:
            logger.error("Failed to parse star names: %s", e)
    else:
        logger.warning("Star names file not found: %s", data_file)


_load_star_names()


@router.get("/{source_id}")
async def get_star_name(source_id: str):
    name = _STAR_NAMES.get(source_id)
    if name is not None:
        return {"ProperName": name}
    raise HTTPException(status_code=404, detail="Star name not found")
