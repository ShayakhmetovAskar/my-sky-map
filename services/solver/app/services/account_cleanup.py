"""Erasing one account, and the batch the guest cron will reuse (APO-93, design §7).

The order below is the whole point of the module — every step assumes the ones
before it already happened:

1. ``share_token = NULL`` on the user's collections, committed on its own.  This
   is the only step that is *instant* and irreversible from a viewer's side: a
   live capability URL stops resolving on the very next request.  It goes first
   so that a purge that dies half-way (S3 down, credentials rotated) still leaves
   every shared link dead rather than pointing at tiles that are still there.
2. Purge the objects: the public ``img/{secret}/`` prefix of every image the user
   ever had tiled, then the private ``users/{sub}/``.  Public first, again
   because those need no auth to read.
3. ``DELETE`` the rows — collections (CASCADE → ``collection_items``) and
   submissions (CASCADE → ``tasks``) — in one transaction, *after* the objects
   are gone: ``tasks.result.hips.base`` holds the only record of where an image's
   tiles live, so committing first would strand them in a public bucket forever.
4. ``astrometry_api_keys`` — the user's own credential at astrometry.net (APO-40).
5. The identity itself at Zitadel.

Everything is idempotent: a second run finds no collections, lists empty
prefixes, deletes no rows.  A failure in steps 2–4 raises, so the caller can
retry (the API turns it into a 503); the row deletion has not happened yet, which
is what makes that retry able to find the account again.

``cleanup_users`` is the same code with a different selector — the 30-day
inactive-guest sweep of APO-40 is a list of ``user_id``s handed to this function.
"""

from __future__ import annotations

import asyncio
import inspect
import logging
from dataclasses import dataclass, field
from typing import Any, Iterable, List, Optional, Sequence, Tuple

from sqlalchemy import String, bindparam, delete, select, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.db import Submission, Task
from .hips_storage import HipsStorage
from .image_tiles import hips_base, redact_secrets, tile_prefix
from .storage import StorageService

logger = logging.getLogger(__name__)

# Tables that belong to sibling tickets and may not exist in every deployment yet:
# `collections` lands with APO-86, `astrometry_api_keys` with APO-40.  Both are
# addressed by raw SQL guarded on `to_regclass` so this module works either way —
# see the module note in docs and the integration notes of APO-93.
COLLECTIONS_TABLE = "collections"
API_KEYS_TABLE = "astrometry_api_keys"

# Sentinel: "no client was passed, resolve the default one".  `None` is a
# meaningful value here — it means "skip the identity provider entirely".
_UNSET: Any = object()


@dataclass
class AccountDeletion:
    """What one account deletion actually did — logged, and returned to a batch caller."""

    user_id: str
    share_tokens_revoked: int = 0
    tile_prefixes_purged: int = 0
    objects_removed: int = 0
    collections_deleted: int = 0
    submissions_deleted: int = 0
    api_keys_deleted: int = 0
    # "deleted" — the IdP removed the user; "skipped" — no management API wired up
    # yet (see `_delete_identity`); "failed" — the call raised, data is gone anyway.
    identity: str = "skipped"


@dataclass
class CleanupSummary:
    """Result of a batch sweep: one report per account, plus the ones that blew up."""

    deleted: List[AccountDeletion] = field(default_factory=list)
    failed: List[Tuple[str, str]] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.failed


def user_prefix(user_id: str) -> str:
    """Private-bucket prefix that holds everything the user ever uploaded.

    Covers `users/{sub}/submissions/{id}/...` for every submission at once.
    """
    return f"users/{_checked_user_id(user_id)}"


def _checked_user_id(user_id: str) -> str:
    """Reject a `user_id` that would widen an object prefix beyond one user.

    A blank sub would turn the purge prefix into `users/`, i.e. *every* account;
    a slash would let a crafted sub climb into a sibling's prefix.  Zitadel subs
    are digit strings, so this can only ever fire on a bug or a forged token.
    """
    if not isinstance(user_id, str) or not user_id.strip() or "/" in user_id:
        raise ValueError(f"refusing to purge storage for a suspicious user_id: {user_id!r}")
    return user_id


async def delete_account(
    user_id: str,
    *,
    db: AsyncSession,
    storage: Optional[StorageService] = None,
    hips_storage: Optional[HipsStorage] = None,
    zitadel: Any = _UNSET,
) -> AccountDeletion:
    """Erase one account: links, objects, rows, credentials, identity.

    Raises whatever storage or the database raises in steps 2–4, having left the
    rows intact so a retry can find them.  A failure of the last step (the
    identity provider) is recorded in the report instead of raised: by then the
    data is gone, and a batch caller must not treat that as "nothing happened".
    """
    user_id = _checked_user_id(user_id)
    storage, hips_storage = _resolve_storages(storage, hips_storage)
    report = AccountDeletion(user_id=user_id)

    # 1. Kill the capability URLs first, and commit that on its own.
    report.share_tokens_revoked = await _revoke_share_tokens(db, user_id)
    await db.commit()

    # 2. Objects: public tiles of every image, then the private prefix.
    prefixes = await _tile_prefixes(db, user_id)
    report.tile_prefixes_purged = len(prefixes)
    for prefix in prefixes:
        report.objects_removed += await asyncio.to_thread(hips_storage.delete_prefix, prefix)
    report.objects_removed += await asyncio.to_thread(storage.delete_prefix, user_prefix(user_id))

    # 3-4. Rows, in one transaction now that nothing points at live objects.
    report.collections_deleted = await _delete_collections(db, [user_id])
    report.submissions_deleted = (
        await db.execute(delete(Submission).where(Submission.user_id == user_id))
    ).rowcount or 0
    report.api_keys_deleted = await _delete_api_keys(db, [user_id])
    await db.commit()

    # 5. The identity, last: everything it owned is already gone.
    report.identity = await _delete_identity(user_id, zitadel)

    logger.info(
        "Deleted account %s: %d share links revoked, %d objects under %d tile prefixes purged, "
        "%d submissions, %d collections, %d api keys, identity=%s",
        user_id, report.share_tokens_revoked, report.objects_removed, report.tile_prefixes_purged,
        report.submissions_deleted, report.collections_deleted, report.api_keys_deleted,
        report.identity,
    )
    return report


async def cleanup_users(
    user_ids: Iterable[str],
    *,
    storage: Optional[StorageService] = None,
    hips_storage: Optional[HipsStorage] = None,
    zitadel: Any = _UNSET,
    session_factory=None,
) -> CleanupSummary:
    """Run :func:`delete_account` over a list of accounts — the guest sweep of APO-40.

    One session (and therefore one transaction) per account: a user whose tiles
    live in a bucket that is refusing writes must not roll back or block the rest
    of the batch.  Failures are collected, not raised — the next run retries them,
    since every step is idempotent.
    """
    if session_factory is None:
        from ..dependencies import async_session
        session_factory = async_session
    storage, hips_storage = _resolve_storages(storage, hips_storage)

    summary = CleanupSummary()
    for user_id in user_ids:
        try:
            async with session_factory() as db:
                summary.deleted.append(await delete_account(
                    user_id, db=db, storage=storage, hips_storage=hips_storage, zitadel=zitadel,
                ))
        except Exception as e:                       # noqa: BLE001 — one bad account, not a bad batch
            message = redact_secrets(str(e))
            logger.error("Cleanup of account %s failed: %s", user_id, message)
            summary.failed.append((user_id, message))
    return summary


# --- steps ---------------------------------------------------------------


async def _revoke_share_tokens(db: AsyncSession, user_ids: Sequence[str] | str) -> int:
    """`share_token = NULL` for every collection of the given users. Returns rows hit.

    Raw SQL on purpose: see the note on :data:`COLLECTIONS_TABLE`.
    """
    ids = [user_ids] if isinstance(user_ids, str) else list(user_ids)
    if not ids or not await _table_exists(db, COLLECTIONS_TABLE):
        return 0
    result = await db.execute(
        _by_user_ids(f"UPDATE {COLLECTIONS_TABLE} SET share_token = NULL "
                     f"WHERE user_id = ANY(:ids) AND share_token IS NOT NULL"),
        {"ids": ids},
    )
    return result.rowcount or 0


async def _delete_collections(db: AsyncSession, user_ids: Sequence[str]) -> int:
    """`DELETE FROM collections WHERE user_id IN (…)`; `collection_items` go by CASCADE.

    Explicit, never implicit: collections hang off `user_id`, a bare text column,
    so no foreign key reaches them from `submissions` or `tasks` — deleting the
    user's images alone would leave the collection rows (and their share tokens)
    behind.
    """
    if not user_ids or not await _table_exists(db, COLLECTIONS_TABLE):
        return 0
    result = await db.execute(
        _by_user_ids(f"DELETE FROM {COLLECTIONS_TABLE} WHERE user_id = ANY(:ids)"),
        {"ids": list(user_ids)},
    )
    return result.rowcount or 0


async def _delete_api_keys(db: AsyncSession, user_ids: Sequence[str]) -> int:
    """Drop the user's own astrometry.net credential (APO-40), if that table is deployed."""
    if not user_ids or not await _table_exists(db, API_KEYS_TABLE):
        return 0
    result = await db.execute(
        _by_user_ids(f"DELETE FROM {API_KEYS_TABLE} WHERE user_id = ANY(:ids)"),
        {"ids": list(user_ids)},
    )
    return result.rowcount or 0


def _by_user_ids(sql: str):
    """`text()` with `:ids` typed as a text[] — asyncpg needs the array type spelled out."""
    return text(sql).bindparams(bindparam("ids", type_=ARRAY(String)))


async def _table_exists(db: AsyncSession, table: str) -> bool:
    """Whether `table` is deployed in this database.

    `collections` (APO-86) and `astrometry_api_keys` (APO-40) are merged on their
    own schedules; this module must not break a deployment that is missing either.
    """
    found = (await db.execute(
        text("SELECT to_regclass(:qualified)"), {"qualified": f"public.{table}"}
    )).scalar()
    return found is not None


async def _tile_prefixes(db: AsyncSession, user_id: str) -> List[str]:
    """Every distinct `img/{secret}` prefix the user's images were tiled into.

    Order is stable (first seen) so the purge is reproducible in logs and tests.
    """
    rows = (await db.execute(
        select(Task.result).where(Task.user_id == user_id).order_by(Task.created_at)
    )).scalars().all()

    prefixes: List[str] = []
    seen = set()
    for result in rows:
        prefix = tile_prefix(hips_base(result))
        if prefix and prefix not in seen:
            seen.add(prefix)
            prefixes.append(prefix)
    return prefixes


async def _delete_identity(user_id: str, zitadel: Any) -> str:
    """Remove the user at Zitadel. Returns "deleted", "skipped" or "failed".

    TODO(APO-93): `clients.zitadel.ZitadelClient` only validates tokens today — it
    speaks no management API, so there is no `delete_user` to call and this step
    reports "skipped".  When the management client lands, it only has to grow a
    `delete_user(user_id)` (sync or async, both are handled here) and this hook
    starts working with no change at the call sites.  Until then an account
    deletion wipes every byte of the user's data and leaves an empty identity
    that can still sign in.
    """
    if zitadel is _UNSET:
        try:
            from ..dependencies import get_zitadel
            zitadel = get_zitadel()
        except Exception as e:                       # noqa: BLE001 — no IdP configured in this env
            logger.warning("No Zitadel client available for %s: %s", user_id, e)
            return "skipped"
    if zitadel is None:                              # caller deliberately owns this step
        return "skipped"

    delete_user = getattr(zitadel, "delete_user", None)
    if delete_user is None:
        logger.warning(
            "Zitadel user %s was NOT deleted: the client has no management API yet "
            "(TODO APO-93). All of the user's data has been erased.", user_id,
        )
        return "skipped"

    try:
        outcome = delete_user(user_id)
        if inspect.isawaitable(outcome):
            await outcome
    except Exception as e:                           # noqa: BLE001 — the data is already gone
        logger.error("Zitadel refused to delete user %s: %s. The user's data is erased; "
                     "the identity has to be removed by hand.", user_id, e)
        return "failed"
    return "deleted"


def _resolve_storages(
    storage: Optional[StorageService], hips_storage: Optional[HipsStorage],
) -> Tuple[StorageService, HipsStorage]:
    """Fall back to the app-wide clients.

    Imported here, not at module level: `dependencies` builds the engine and the
    storage clients on import, and a cron entry point may import this module long
    before (or without) the API app.
    """
    if storage is None or hips_storage is None:
        from ..dependencies import get_hips_storage, get_storage
        storage = storage or get_storage()
        hips_storage = hips_storage or get_hips_storage()
    return storage, hips_storage
