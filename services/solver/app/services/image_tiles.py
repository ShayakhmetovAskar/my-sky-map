"""Storage lifecycle of one solved image (APO-87).

Two operations sit on the same machinery — `docs/my-sky-collections-sharing.md`
§3 (deletion) and §5 (revocation):

* **purge** — deleting a submission wipes everything it owns: the private prefix
  `users/{sub}/submissions/{id}/` (the upload *and* every task's output, which
  used to be left behind) and the public `img/{image_secret}/` of each image that
  was tiled.  It runs synchronously, before the row is committed away: the row is
  the only record of where those objects live, and the tiles need no auth to read.
* **rotation** — "Stop sharing" (APO-92) and account deletion (APO-93) re-address
  an image under a fresh secret instead of re-cutting 30–150 tiles.

The secret in a key is a capability: it must never reach the logs, so every
message that may quote an object key goes through `redact_secrets` first.
"""

from __future__ import annotations

import asyncio
import logging
import re
import secrets
from typing import Any, Dict, Iterable, Optional
from uuid import UUID

from ..models.db import Task
from .hips_storage import HipsStorage
from .storage import StorageService

logger = logging.getLogger(__name__)

# `result.hips.base` is `{HIPS_PUBLIC_BASE_URL}/img/{secret}`.  The endpoint in the
# config may have changed since the tiles were written (dev MinIO -> object storage),
# so the key prefix is read off the tail of the URL instead of by stripping the
# base URL that happens to be configured now.
_BASE_RE = re.compile(r"(?:^|/)(img/[A-Za-z0-9_-]{16,})/?$")
_SECRET_RE = re.compile(r"img/[A-Za-z0-9_-]{16,}")


def new_image_secret() -> str:
    """128-bit URL-safe secret that addresses one image's tiles (22 chars).

    Same recipe as `worker.hips.new_image_secret`, duplicated so the API does not
    import the worker package.
    """
    return secrets.token_urlsafe(16)


def redact_secrets(text: str) -> str:
    """Blank out image secrets in a message before it is logged."""
    return _SECRET_RE.sub("img/***", text)


def hips_base(result: Any) -> Optional[str]:
    """`result.hips.base` of a task, or None when the image was never tiled."""
    if not isinstance(result, dict):
        return None
    hips = result.get("hips")
    if not isinstance(hips, dict):
        return None
    base = hips.get("base")
    return base if isinstance(base, str) else None


def tile_prefix(base: Optional[str]) -> Optional[str]:
    """Public-bucket key prefix (`img/{secret}`) behind a `base` URL, or None."""
    if not isinstance(base, str):
        return None
    match = _BASE_RE.search(base.strip())
    return match.group(1) if match else None


def submission_prefix(user_id: str, submission_id) -> str:
    """Private-bucket prefix of one submission — the layout `create_submission` writes.

    Covers `input/original.*` and `tasks/{task_id}/output/*` alike.
    """
    return f"users/{user_id}/submissions/{submission_id}"


async def purge_submission_objects(
    user_id: str,
    submission_id: UUID,
    tile_bases: Iterable[Optional[str]],
    *,
    storage: StorageService,
    hips_storage: HipsStorage,
) -> int:
    """Delete every object of one submission. Returns how many were removed.

    Raises `StorageError` / `HipsStorageError` (or whatever the client raises) if
    anything is left behind — the caller must then leave the database alone, so a
    retry can find the submission and try again.  Both halves are idempotent: a
    second run lists an empty prefix and deletes nothing.

    Public tiles go first — they are the ones readable by anyone holding the link.
    """
    removed = 0
    seen = set()
    for base in tile_bases:
        prefix = tile_prefix(base)
        if prefix and prefix not in seen:
            seen.add(prefix)
            removed += await asyncio.to_thread(hips_storage.delete_prefix, prefix)
    removed += await asyncio.to_thread(
        storage.delete_prefix, submission_prefix(user_id, submission_id)
    )
    return removed


async def rotate_image_secret(
    task_id: UUID,
    *,
    hips_storage: Optional[HipsStorage] = None,
    session_factory=None,
) -> Optional[str]:
    """Re-address one image's tiles under a fresh secret; return the new `base`.

    Copy the prefix, drop the old one, then publish the new `base` in
    `result.hips`.  The old prefix is dropped *before* the commit on purpose: the
    point of a rotation is that the revoked link stops resolving, so a crash in
    the middle should leave a loudly broken image (fixable by re-solving) rather
    than a link that is quietly still live.

    Returns None when there is nothing to rotate (task gone, never tiled) or when
    storage refused.  Best-effort by design — the caller runs it in
    `BackgroundTasks`, where an exception would be logged as a traceback quoting
    the object key, i.e. the secret itself.
    """
    # Imported here, not at module level: `dependencies` builds the engine and the
    # storage clients on import, and this module is also reachable from the worker.
    if hips_storage is None:
        from ..dependencies import get_hips_storage
        hips_storage = get_hips_storage()
    if session_factory is None:
        from ..dependencies import async_session
        session_factory = async_session

    async with session_factory() as db:
        task = await db.get(Task, task_id)
        if task is None:
            logger.warning("Secret rotation skipped: task %s is gone", task_id)
            return None

        old_base = hips_base(task.result)
        old_prefix = tile_prefix(old_base)
        if not old_prefix:
            return None                      # never tiled, or tiling failed — no secret to revoke

        new_prefix = f"img/{new_image_secret()}"
        try:
            await asyncio.to_thread(hips_storage.copy_prefix, old_prefix, new_prefix)
        except Exception as e:
            logger.warning("Secret rotation failed to copy tiles of task %s: %s",
                           task_id, redact_secrets(str(e)))
            await _discard_prefix(hips_storage, new_prefix)
            return None

        try:
            await asyncio.to_thread(hips_storage.delete_prefix, old_prefix)
        except Exception as e:
            # Both copies are alive and the row still points at the old one; undo the
            # copy so the next attempt starts from a clean state.
            logger.warning("Secret rotation failed to drop the old tiles of task %s: %s",
                           task_id, redact_secrets(str(e)))
            await _discard_prefix(hips_storage, new_prefix)
            return None

        new_base = _rebase(old_base, old_prefix, new_prefix)
        task.result = _rewrite_hips(task.result, old_base, new_base)
        await db.commit()

        logger.info("Rotated the tile secret of task %s", task_id)
        return new_base


async def _discard_prefix(hips_storage: HipsStorage, prefix: str) -> None:
    """Best-effort cleanup of a prefix nothing references (a half-finished copy)."""
    try:
        await asyncio.to_thread(hips_storage.delete_prefix, prefix)
    except Exception as e:
        logger.warning("Could not clean up an orphaned tile prefix: %s", redact_secrets(str(e)))


def _rebase(base: str, old_prefix: str, new_prefix: str) -> str:
    """Swap the trailing `img/{secret}` of a base URL, keeping host and bucket."""
    head = base.strip().rstrip("/")
    return head[: len(head) - len(old_prefix)] + new_prefix


def _rewrite_hips(result: Dict[str, Any], old_base: str, new_base: str) -> Dict[str, Any]:
    """Copy of `result` with every URL under `hips` moved to the new base.

    A fresh dict, not an in-place edit: SQLAlchemy does not track mutation of a
    JSON column.  `thumb` is `{base}/thumb.jpg`, so it moves with `base`.
    """
    old = old_base.strip().rstrip("/")
    hips = {
        key: (new_base + value[len(old):]
              if isinstance(value, str) and value.startswith(old) else value)
        for key, value in result["hips"].items()
    }
    return {**result, "hips": hips}
