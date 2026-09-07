"""DELETE /me/account and the guest sweep behind it (APO-93, design §7).

The order is the contract, so most of these tests assert *when* something happened
rather than only that it did:

    share_token = NULL  →  img/{secret}/  →  users/{sub}/  →  rows  →  Zitadel

The checks that have to observe the middle of the operation use a short-lived
synchronous connection from inside the storage mock — `delete_prefix` is called
through `asyncio.to_thread`, so it runs in a worker thread with no event loop of
its own, and it sees exactly what another process would see at that instant.
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.dependencies import get_zitadel
from app.main import app
from app.services.account_cleanup import cleanup_users, delete_account
from app.services.hips_storage import HipsStorageError
from app.services.storage import StorageError
from clients.zitadel import ZitadelClient
from tests.unit.conftest import TEST_USER

OTHER_USER = "other-user-999"

SECRET = "Ck7dQvJm2pR4sT6uV8wXyZ"
SECOND_SECRET = "Zy8Xw6Vu4Ts2Rp1Mj7Dk9C"
BASE = f"http://localhost:9000/skymap-static-data/img/{SECRET}"
SECOND_BASE = f"http://localhost:9000/skymap-static-data/img/{SECOND_SECRET}"

# The two tables this module reaches through raw SQL are owned by sibling tickets
# (collections — APO-86, astrometry_api_keys — APO-40) and are not in this
# branch's migrations. The fixtures below create the same shape by hand, so both
# the "table is deployed" and the "table is not deployed yet" paths get covered.
CREATE_COLLECTIONS = """
CREATE TABLE collections (
    id uuid PRIMARY KEY,
    user_id text NOT NULL,
    title varchar(80) NOT NULL,
    share_token varchar(32),
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE collection_items (
    collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    position int NOT NULL,
    PRIMARY KEY (collection_id, task_id)
);
"""
CREATE_API_KEYS = """
CREATE TABLE astrometry_api_keys (
    user_id text PRIMARY KEY,
    api_key text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
"""

SYNC_URL = settings.database_url.replace("+asyncpg", "")
_sync_engine = create_engine(SYNC_URL)


def peek(sql: str, **params):
    """Read committed state from outside the request's transaction (worker-thread safe)."""
    with _sync_engine.connect() as conn:
        return conn.execute(text(sql), params).scalar()


# --- fixtures ------------------------------------------------------------


@pytest.fixture
async def sessions():
    """Session factory on the test DB, for rows the API cannot create (solved tasks)."""
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    yield factory
    await engine.dispose()


def deployed(table: str) -> bool:
    return peek("SELECT to_regclass(:qualified)", qualified=f"public.{table}") is not None


def _borrowed_or_built(create_sql: str, drop_sql: str, table: str):
    """Yield a table to a test, whichever ticket ended up owning it.

    Once APO-86 / APO-40 are merged these tables come from migrations, and the
    fixture must leave that schema alone (dropping it would strip the tables from
    under every other test file in the session, and from `alembic downgrade`).
    Until then it builds the same shape itself and takes it back down.
    """
    if deployed(table):
        yield
        with _sync_engine.begin() as conn:
            conn.execute(text(f"DELETE FROM {table}"))    # rows only — the schema is not ours
        return
    with _sync_engine.begin() as conn:
        conn.execute(text(create_sql))
    yield
    with _sync_engine.begin() as conn:
        conn.execute(text(drop_sql))


@pytest.fixture
def collections_table():
    """`collections` + `collection_items` as APO-86 defines them."""
    yield from _borrowed_or_built(
        CREATE_COLLECTIONS, "DROP TABLE IF EXISTS collection_items, collections CASCADE",
        "collections")


@pytest.fixture
def api_keys_table():
    """`astrometry_api_keys` as APO-40 defines it."""
    yield from _borrowed_or_built(
        CREATE_API_KEYS, "DROP TABLE IF EXISTS astrometry_api_keys CASCADE",
        "astrometry_api_keys")


@pytest.fixture
def zitadel(client):
    """Identity provider with a working management API (which the real client lacks yet)."""
    mock = MagicMock()
    mock.delete_user = MagicMock(return_value=None)
    app.dependency_overrides[get_zitadel] = lambda: mock
    return mock


# --- row helpers ---------------------------------------------------------


async def add_submission(factory, user_id: str) -> UUID:
    from app.models.db import Submission

    sub_id = uuid4()
    async with factory() as db:
        db.add(Submission(
            id=sub_id, user_id=user_id, filename="orion.jpg", content_type="image/jpeg",
            file_size_bytes=1024, status="completed",
            object_key=f"users/{user_id}/submissions/{sub_id}/input/original.jpg",
        ))
        await db.commit()
    return sub_id


async def add_task(factory, submission_id: UUID, user_id: str, base: str | None) -> UUID:
    """A completed task, tiled into `base` or with tiling failed (`base=None`)."""
    from app.models.db import Task

    task_id = uuid4()
    result = ({"hips": {"kmax": 6, "tiles": 42, "base": base, "thumb": f"{base}/thumb.jpg"}}
              if base else {"hips_error": "solver returned no WCS file"})
    async with factory() as db:
        db.add(Task(id=task_id, submission_id=submission_id, user_id=user_id,
                    status="completed", result=result))
        await db.commit()
    return task_id


async def add_live_task(factory, submission_id: UUID, user_id: str, status: str,
                        result=None) -> UUID:
    """A task the worker still owns — pending, processing or mid-tiling."""
    from app.models.db import Task

    task_id = uuid4()
    async with factory() as db:
        db.add(Task(id=task_id, submission_id=submission_id, user_id=user_id,
                    status=status, result=result))
        await db.commit()
    return task_id


def add_collection(user_id: str, share_token: str | None, task_ids=()) -> UUID:
    collection_id = uuid4()
    with _sync_engine.begin() as conn:
        conn.execute(
            text("INSERT INTO collections (id, user_id, title, share_token) "
                 "VALUES (:id, :uid, :title, :token)"),
            {"id": collection_id, "uid": user_id, "title": "Orion nights", "token": share_token},
        )
        for position, task_id in enumerate(task_ids):
            conn.execute(
                text("INSERT INTO collection_items (collection_id, task_id, position) "
                     "VALUES (:cid, :tid, :pos)"),
                {"cid": collection_id, "tid": task_id, "pos": position},
            )
    return collection_id


def add_api_key(user_id: str) -> None:
    with _sync_engine.begin() as conn:
        conn.execute(
            text("INSERT INTO astrometry_api_keys (user_id, api_key) VALUES (:uid, :key)"),
            {"uid": user_id, "key": "abcdefghijklmnop"},
        )


async def full_account(factory, user_id: str = TEST_USER, base: str = BASE):
    """One submission, one tiled task, one shared collection holding it, one api key."""
    sub_id = await add_submission(factory, user_id)
    task_id = await add_task(factory, sub_id, user_id, base)
    collection_id = add_collection(user_id, "tok" + uuid.uuid4().hex[:16], [task_id])
    add_api_key(user_id)
    return sub_id, task_id, collection_id


def count(table: str, user_id: str) -> int:
    return peek(f"SELECT count(*) FROM {table} WHERE user_id = :uid", uid=user_id)


# --- tests ---------------------------------------------------------------


class TestOrder:
    async def test_links_die_before_the_purge_and_rows_outlive_it(
        self, client, sessions, collections_table, api_keys_table,
        mock_storage, mock_hips_storage, zitadel,
    ):
        sub_id, task_id, collection_id = await full_account(sessions)
        seen = {}

        def at_tiles(prefix):
            seen["tokens_left"] = peek(
                "SELECT count(*) FROM collections WHERE user_id = :uid AND share_token IS NOT NULL",
                uid=TEST_USER)
            seen["submissions"] = count("submissions", TEST_USER)
            return 40

        def at_private(prefix):
            seen["private_submissions"] = count("submissions", TEST_USER)
            return 3

        def at_identity(user_id):
            seen["identity_submissions"] = count("submissions", TEST_USER)
            seen["identity_collections"] = count("collections", TEST_USER)

        mock_hips_storage.delete_prefix.side_effect = at_tiles
        mock_storage.delete_prefix.side_effect = at_private
        zitadel.delete_user.side_effect = at_identity

        assert (await client.delete("/me/account")).status_code == 204

        # The capability URL is dead before a single object is touched...
        assert seen["tokens_left"] == 0
        # ...and the rows that point at those objects survive until the purge is done.
        assert seen["submissions"] == 1
        assert seen["private_submissions"] == 1
        # The identity goes last, once its data is committed away.
        assert seen["identity_submissions"] == 0
        assert seen["identity_collections"] == 0

        assert count("submissions", TEST_USER) == 0
        assert count("tasks", TEST_USER) == 0
        assert count("collections", TEST_USER) == 0
        assert count("astrometry_api_keys", TEST_USER) == 0
        assert peek("SELECT count(*) FROM collection_items WHERE collection_id = :cid",
                    cid=collection_id) == 0
        zitadel.delete_user.assert_called_once_with(TEST_USER)

    async def test_public_tiles_are_purged_before_the_private_prefix(
        self, client, sessions, mock_storage, mock_hips_storage, zitadel,
    ):
        sub_id = await add_submission(sessions, TEST_USER)
        await add_task(sessions, sub_id, TEST_USER, BASE)
        order = []
        mock_hips_storage.delete_prefix.side_effect = lambda p: order.append(("tiles", p)) or 1
        mock_storage.delete_prefix.side_effect = lambda p: order.append(("private", p)) or 1

        assert (await client.delete("/me/account")).status_code == 204

        assert order == [("tiles", f"img/{SECRET}"), ("private", f"users/{TEST_USER}")]

    async def test_purges_every_image_of_the_account_once(
        self, client, sessions, mock_storage, mock_hips_storage, zitadel,
    ):
        first = await add_submission(sessions, TEST_USER)
        second = await add_submission(sessions, TEST_USER)
        await add_task(sessions, first, TEST_USER, BASE)
        await add_task(sessions, first, TEST_USER, BASE)          # re-solve of the same image
        await add_task(sessions, second, TEST_USER, SECOND_BASE)
        await add_task(sessions, second, TEST_USER, None)         # tiling failed: nothing to purge

        assert (await client.delete("/me/account")).status_code == 204

        purged = [c.args[0] for c in mock_hips_storage.delete_prefix.call_args_list]
        assert purged == [f"img/{SECRET}", f"img/{SECOND_SECRET}"]
        # One sweep of the private bucket covers every submission of the user.
        mock_storage.delete_prefix.assert_called_once_with(f"users/{TEST_USER}")


class TestWorkInFlight:
    """The worker has to be taken off the account before its objects are swept.

    A task still running re-creates its output under the private prefix right after the
    purge emptied it, and a task in `tiling` keeps filling a *public* prefix whose row is
    about to be deleted — a world-readable pyramid nothing can name afterwards.
    """

    async def test_live_tasks_are_cancelled_before_a_single_object_is_touched(
        self, client, sessions, mock_storage, mock_hips_storage, zitadel,
    ):
        sub_id = await add_submission(sessions, TEST_USER)
        for status in ("pending", "processing", "tiling"):
            await add_live_task(sessions, sub_id, TEST_USER, status)
        seen = {}
        mock_storage.delete_prefix.side_effect = lambda prefix: seen.setdefault(
            "live_at_purge",
            peek("SELECT count(*) FROM tasks WHERE user_id = :uid AND status IN "
                 "('pending','processing','tiling')", uid=TEST_USER),
        ) or 0

        assert (await client.delete("/me/account")).status_code == 204

        assert seen["live_at_purge"] == 0

    async def test_the_prefix_a_task_was_still_tiling_is_purged(
        self, client, sessions, mock_storage, mock_hips_storage, zitadel,
    ):
        """`result.hips_pending` is the only record of a half-written pyramid."""
        pending_secret = "P" * 22
        sub_id = await add_submission(sessions, TEST_USER)
        await add_live_task(sessions, sub_id, TEST_USER, "tiling", {
            "center_ra": 1.0,
            "hips_pending": f"http://localhost:9000/skymap-static-data/img/{pending_secret}",
        })

        assert (await client.delete("/me/account")).status_code == 204

        assert [c.args[0] for c in mock_hips_storage.delete_prefix.call_args_list] == [
            f"img/{pending_secret}"]
        assert count("tasks", TEST_USER) == 0

    async def test_a_report_counts_what_it_cancelled(
        self, client, sessions, mock_storage, mock_hips_storage,
    ):
        sub_id = await add_submission(sessions, TEST_USER)
        await add_live_task(sessions, sub_id, TEST_USER, "processing")
        await add_task(sessions, sub_id, TEST_USER, BASE)          # already completed

        async with sessions() as db:
            report = await delete_account(TEST_USER, db=db, storage=mock_storage,
                                          hips_storage=mock_hips_storage, zitadel=None)

        assert report.tasks_cancelled == 1


class TestScope:
    async def test_leaves_every_other_account_untouched(
        self, client, sessions, collections_table, api_keys_table,
        mock_storage, mock_hips_storage, zitadel,
    ):
        await full_account(sessions, TEST_USER, BASE)
        await full_account(sessions, OTHER_USER, SECOND_BASE)

        assert (await client.delete("/me/account")).status_code == 204

        assert count("submissions", OTHER_USER) == 1
        assert count("tasks", OTHER_USER) == 1
        assert count("collections", OTHER_USER) == 1
        assert count("astrometry_api_keys", OTHER_USER) == 1
        assert peek("SELECT count(*) FROM collections "
                    "WHERE user_id = :uid AND share_token IS NOT NULL", uid=OTHER_USER) == 1

        # Neither the other user's tiles nor their private prefix were named.
        assert [c.args[0] for c in mock_hips_storage.delete_prefix.call_args_list] == [f"img/{SECRET}"]
        assert mock_storage.delete_prefix.call_args.args[0] == f"users/{TEST_USER}"


class TestStorageFailure:
    async def test_tile_failure_is_503_and_keeps_every_row(
        self, client, sessions, collections_table, api_keys_table,
        mock_storage, mock_hips_storage, zitadel,
    ):
        await full_account(sessions)
        mock_hips_storage.delete_prefix.side_effect = HipsStorageError(
            f"failed to delete 1 of 40 objects under img/{SECRET}/: img/{SECRET}/thumb.jpg: denied")

        resp = await client.delete("/me/account")

        assert resp.status_code == 503
        # The storage error quotes an object key, i.e. the image's capability secret.
        assert SECRET not in resp.text
        mock_storage.delete_prefix.assert_not_called()
        zitadel.delete_user.assert_not_called()
        assert count("submissions", TEST_USER) == 1
        assert count("collections", TEST_USER) == 1
        assert count("astrometry_api_keys", TEST_USER) == 1
        # Revocation is not rolled back: a half-done deletion still kills the links.
        assert peek("SELECT count(*) FROM collections "
                    "WHERE user_id = :uid AND share_token IS NOT NULL", uid=TEST_USER) == 0

    async def test_private_bucket_failure_is_503_and_keeps_every_row(
        self, client, sessions, mock_storage, zitadel,
    ):
        await add_submission(sessions, TEST_USER)
        mock_storage.delete_prefix.side_effect = StorageError("failed to delete 3 of 12 objects")

        assert (await client.delete("/me/account")).status_code == 503

        assert count("submissions", TEST_USER) == 1
        zitadel.delete_user.assert_not_called()

    async def test_retry_after_a_failure_finishes_the_job(
        self, client, sessions, collections_table, api_keys_table,
        mock_storage, mock_hips_storage, zitadel,
    ):
        await full_account(sessions)
        mock_storage.delete_prefix.side_effect = StorageError("boom")
        assert (await client.delete("/me/account")).status_code == 503

        mock_storage.delete_prefix.side_effect = None
        mock_storage.delete_prefix.return_value = 0       # already gone — the purge is idempotent
        assert (await client.delete("/me/account")).status_code == 204

        assert count("submissions", TEST_USER) == 0
        assert count("collections", TEST_USER) == 0
        # The tiles were listed again on the retry; deleting an empty prefix is a no-op.
        assert mock_hips_storage.delete_prefix.call_count == 2


class TestIdempotency:
    async def test_deleting_an_already_deleted_account_is_a_no_op(
        self, client, sessions, collections_table, api_keys_table,
        mock_storage, mock_hips_storage, zitadel,
    ):
        await full_account(sessions)

        assert (await client.delete("/me/account")).status_code == 204
        assert (await client.delete("/me/account")).status_code == 204

        assert mock_hips_storage.delete_prefix.call_count == 1     # no images left to find
        assert mock_storage.delete_prefix.call_count == 2          # the prefix is swept blindly
        assert zitadel.delete_user.call_count == 2

    async def test_second_report_counts_nothing(
        self, client, sessions, collections_table, api_keys_table,
        mock_storage, mock_hips_storage,
    ):
        await full_account(sessions)
        async with sessions() as db:
            first = await delete_account(TEST_USER, db=db, storage=mock_storage,
                                         hips_storage=mock_hips_storage, zitadel=None)
        async with sessions() as db:
            second = await delete_account(TEST_USER, db=db, storage=mock_storage,
                                          hips_storage=mock_hips_storage, zitadel=None)

        assert (first.share_tokens_revoked, first.submissions_deleted,
                first.collections_deleted, first.api_keys_deleted) == (1, 1, 1, 1)
        assert (second.share_tokens_revoked, second.submissions_deleted,
                second.collections_deleted, second.api_keys_deleted) == (0, 0, 0, 0)
        assert second.tile_prefixes_purged == 0


class TestMissingTables:
    """`collections` and `astrometry_api_keys` land with sibling tickets (APO-86, APO-40)."""

    async def test_deletion_works_before_those_tables_are_deployed(
        self, client, sessions, mock_storage, mock_hips_storage, zitadel,
    ):
        sub_id = await add_submission(sessions, TEST_USER)
        await add_task(sessions, sub_id, TEST_USER, BASE)

        assert (await client.delete("/me/account")).status_code == 204

        assert count("submissions", TEST_USER) == 0
        mock_hips_storage.delete_prefix.assert_called_once_with(f"img/{SECRET}")

    async def test_collections_are_deleted_explicitly_not_by_cascade(
        self, client, sessions, collections_table, mock_storage, mock_hips_storage, zitadel,
    ):
        # A collection with no items at all: nothing links it to the user's tasks,
        # so no CASCADE can ever reach it — only the explicit DELETE by user_id.
        add_collection(TEST_USER, "tok-empty-collection")

        assert (await client.delete("/me/account")).status_code == 204

        assert count("collections", TEST_USER) == 0


class TestIdentity:
    async def test_todo_hook_is_skipped_while_the_client_has_no_management_api(
        self, client, sessions, mock_storage, mock_hips_storage,
    ):
        """The real `ZitadelClient` only validates tokens — the data still has to go.

        And the answer must say so: a 204 would claim the whole account is gone while
        the login it names still works.
        """
        await add_submission(sessions, TEST_USER)
        app.dependency_overrides[get_zitadel] = lambda: MagicMock(spec=ZitadelClient)

        resp = await client.delete("/me/account")
        assert resp.status_code == 200
        assert resp.json() == {"data_erased": True, "identity": "skipped"}
        assert count("submissions", TEST_USER) == 0

        async with sessions() as db:
            report = await delete_account(TEST_USER, db=db, storage=mock_storage,
                                          hips_storage=mock_hips_storage,
                                          zitadel=MagicMock(spec=ZitadelClient))
        assert report.identity == "skipped"

    async def test_an_awaitable_delete_user_is_awaited(
        self, client, sessions, mock_storage, mock_hips_storage,
    ):
        idp = MagicMock()
        idp.delete_user = AsyncMock(return_value=None)
        async with sessions() as db:
            report = await delete_account(TEST_USER, db=db, storage=mock_storage,
                                          hips_storage=mock_hips_storage, zitadel=idp)

        idp.delete_user.assert_awaited_once_with(TEST_USER)
        assert report.identity == "deleted"

    async def test_an_identity_failure_does_not_resurrect_the_data(
        self, client, sessions, collections_table, api_keys_table,
        mock_storage, mock_hips_storage, zitadel,
    ):
        await full_account(sessions)
        zitadel.delete_user.side_effect = RuntimeError("zitadel returned 500")

        # The user asked for deletion and their data is gone — that is not a 503. But it
        # is not a 204 either: the caller has to learn the login outlived the request.
        resp = await client.delete("/me/account")
        assert resp.status_code == 200
        assert resp.json() == {"data_erased": True, "identity": "failed"}
        assert count("submissions", TEST_USER) == 0
        assert count("collections", TEST_USER) == 0


class TestGuestSweep:
    """`cleanup_users` — the same code with a different selector (APO-40 cron)."""

    async def test_cleans_every_account_in_the_list(
        self, client, sessions, collections_table, api_keys_table,
        mock_storage, mock_hips_storage,
    ):
        guests = ["guest-1", "guest-2"]
        await full_account(sessions, guests[0], BASE)
        await full_account(sessions, guests[1], SECOND_BASE)
        await full_account(sessions, TEST_USER, BASE)             # a real account, left alone
        idp = MagicMock()

        summary = await cleanup_users(guests, storage=mock_storage, hips_storage=mock_hips_storage,
                                      zitadel=idp, session_factory=sessions)

        assert summary.ok
        assert [r.user_id for r in summary.deleted] == guests
        for guest in guests:
            assert count("submissions", guest) == 0
            assert count("collections", guest) == 0
            assert count("astrometry_api_keys", guest) == 0
        assert count("submissions", TEST_USER) == 1
        assert count("collections", TEST_USER) == 1
        assert [c.args[0] for c in idp.delete_user.call_args_list] == guests
        assert {c.args[0] for c in mock_storage.delete_prefix.call_args_list} == {
            "users/guest-1", "users/guest-2"}

    async def test_one_broken_account_does_not_stop_the_sweep(
        self, client, sessions, collections_table, api_keys_table,
        mock_storage, mock_hips_storage,
    ):
        await full_account(sessions, "guest-1", BASE)
        await full_account(sessions, "guest-2", SECOND_BASE)
        mock_storage.delete_prefix.side_effect = (
            lambda prefix: (_ for _ in ()).throw(StorageError(f"bucket is down for {prefix}"))
            if prefix == "users/guest-1" else 0)

        summary = await cleanup_users(["guest-1", "guest-2"], storage=mock_storage,
                                      hips_storage=mock_hips_storage, zitadel=None,
                                      session_factory=sessions)

        assert not summary.ok
        assert [uid for uid, _ in summary.failed] == ["guest-1"]
        assert [r.user_id for r in summary.deleted] == ["guest-2"]
        assert count("submissions", "guest-1") == 1        # kept, so the next run retries it
        assert count("submissions", "guest-2") == 0
        # ...but guest-1's share link is already dead, failure or not.
        assert peek("SELECT count(*) FROM collections "
                    "WHERE user_id = :uid AND share_token IS NOT NULL", uid="guest-1") == 0

    async def test_an_empty_sweep_touches_nothing(self, client, sessions, mock_storage,
                                                  mock_hips_storage):
        summary = await cleanup_users([], storage=mock_storage, hips_storage=mock_hips_storage,
                                      zitadel=None, session_factory=sessions)

        assert summary.ok and summary.deleted == []
        mock_storage.delete_prefix.assert_not_called()


class TestPrefixSafety:
    @pytest.mark.parametrize("user_id", ["", "   ", "../other", "guest/1", None])
    async def test_refuses_a_user_id_that_would_widen_the_purge(
        self, client, sessions, mock_storage, mock_hips_storage, user_id,
    ):
        """A blank sub would turn `users/{sub}` into `users/` — every account at once."""
        async with sessions() as db:
            with pytest.raises(ValueError):
                await delete_account(user_id, db=db, storage=mock_storage,
                                     hips_storage=mock_hips_storage, zitadel=None)

        mock_storage.delete_prefix.assert_not_called()
        mock_hips_storage.delete_prefix.assert_not_called()
