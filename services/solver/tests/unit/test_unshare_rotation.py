"""Unsharing a collection rotates the tile secrets it was the last to publish (APO-92).

Design §5: dropping `share_token` kills the manifest instantly, but the tile URLs the
manifest handed out need no auth at all — they stay live until the image is re-addressed
under a fresh secret. `DELETE /me/collections/{id}/share` therefore schedules
`rotate_image_secrets` in `BackgroundTasks` for every image of the collection that no
*other* shared collection still publishes.

The public bucket is a `FakeHipsStorage` here: the keys it holds are exactly what an
anonymous GET would find, so "the old tile URL now 404s" is a real assertion rather than
a call count on a mock.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app import dependencies
from app.dependencies import get_current_user, get_hips_storage
from app.main import app
from app.services.hips_storage import HipsStorageError
from app.services.image_tiles import rotate_image_secrets, tile_prefix

from .conftest import TEST_DB_URL, TEST_USER
# Not `caplog`: the session-scoped alembic fixture runs `fileConfig`, which disables every
# logger that already exists, so records never reach pytest's handler (see test_hips.py).
from .test_hips import capture_logs

OTHER_USER = "other-user-999"
PUBLIC_ROOT = "https://storage.yandexcloud.net/skymap-static-data"

# The keys a freshly tiled image owns: a couple of orders plus the thumb.
TILE_SUFFIXES = ("Norder0/Npix3.png", "Norder3/Npix193.png", "thumb.jpg")

UPLOADED_AT = datetime(2026, 9, 3, 12, 0, tzinfo=timezone.utc)


# --- The public bucket, faked ---

class FakeHipsStorage:
    """In-memory public bucket. Holds keys; `get` answers as a viewer's browser would."""

    def __init__(self):
        self.keys: set[str] = set()
        self.copied: list[tuple[str, str]] = []
        self.deleted: list[str] = []
        self.copy_fails_for: set[str] = set()

    # -- the HipsStorage surface `rotate_image_secret` uses --

    def list_prefix(self, prefix: str) -> list[str]:
        p = prefix.strip("/") + "/"
        return sorted(k for k in self.keys if k.startswith(p))

    def copy_prefix(self, src: str, dst: str) -> int:
        if src in self.copy_fails_for:
            raise HipsStorageError("bucket refused the copy")
        src_p, dst_p = src.strip("/") + "/", dst.strip("/") + "/"
        moved = self.list_prefix(src)
        for key in moved:
            self.keys.add(dst_p + key[len(src_p):])
        self.copied.append((src, dst))
        return len(moved)

    def delete_prefix(self, prefix: str) -> int:
        gone = self.list_prefix(prefix)
        self.keys -= set(gone)
        self.deleted.append(prefix)
        return len(gone)

    # -- test conveniences --

    def put_image(self, base: str) -> None:
        prefix = tile_prefix(base)
        assert prefix, base
        self.keys.update(f"{prefix}/{suffix}" for suffix in TILE_SUFFIXES)

    def get(self, url: str) -> int:
        """The HTTP status an anonymous GET of a tile URL would get."""
        key = url[url.index("img/"):]
        return 200 if key in self.keys else 404

    def rotations(self) -> set[str]:
        """Prefixes that were actually re-addressed."""
        return {src for src, _ in self.copied}


@pytest.fixture
async def bucket(client):
    """Depends on `client` on purpose: that fixture installs the shared MagicMock for
    `get_hips_storage`, and this override has to land after it."""
    storage = FakeHipsStorage()
    app.dependency_overrides[get_hips_storage] = lambda: storage
    return storage


@pytest.fixture
async def db_engine():
    """Direct DB access for state the API cannot produce (solved results, foreign items)."""
    engine = create_async_engine(TEST_DB_URL, echo=False)
    yield engine
    await engine.dispose()


@pytest.fixture(autouse=True)
async def background_session(monkeypatch):
    """Bind the background rotation's own session factory to *this* test's event loop.

    `rotate_image_secret` cannot use the request's session — that one is closed long
    before `BackgroundTasks` runs — so it reaches for the module-level `async_session`.
    One engine per process is right in production and wrong here: each test gets a fresh
    event loop, and asyncpg connections pooled by the previous one fail on reuse. The
    failure would land inside the background task, where it is swallowed by design, and
    every assertion below would quietly test nothing.
    """
    engine = create_async_engine(TEST_DB_URL, echo=False)
    monkeypatch.setattr(
        dependencies, "async_session",
        async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False),
    )
    yield
    await engine.dispose()


# --- Helpers ---

def base_for(secret: str) -> str:
    return f"{PUBLIC_ROOT}/img/{secret}"


def tile_url(base: str) -> str:
    return f"{base}/{TILE_SUFFIXES[1]}"


# What the worker persists for a solved image; `/me/sky` and `/public/sky` both need it whole.
CALIBRATION = {
    "center_ra": 10.684,
    "center_dec": 41.269,
    "field_of_view": 0.93,
    "pixel_scale": 0.79,
    "orientation": 259.8,
    "corners": [[10.4, 41.0], [10.9, 41.5]],
}


def hips_result(base: str | None) -> dict:
    """`tasks.result` of a solved image — tiled (`hips`) or with tiling failed."""
    if base is None:
        return {**CALIBRATION, "hips_error": "tiling crashed"}
    return {
        **CALIBRATION,
        "hips": {"kmax": 6, "tiles": 3, "moc": {"0": [3]}, "base": base, "thumb": f"{base}/thumb.jpg"},
    }


async def seed_image(
    db_engine,
    bucket: FakeHipsStorage | None,
    *,
    secret: str,
    user_id: str = TEST_USER,
    status: str = "completed",
    tiled: bool = True,
) -> tuple[str, str]:
    """A solved submission + task with its tiles in the bucket. Returns (task_id, base)."""
    submission_id, task_id = uuid4(), uuid4()
    base = base_for(secret)
    result = hips_result(base if tiled else None)
    async with db_engine.begin() as conn:
        await conn.execute(
            text(
                "INSERT INTO submissions (id, user_id, status, filename, content_type,"
                " file_size_bytes, object_key, created_at, updated_at)"
                " VALUES (:id, :uid, 'completed', :fn, 'image/png', 1024, :key, :at, :at)"
            ),
            {
                "id": submission_id, "uid": user_id, "fn": f"{secret}.png",
                "key": f"users/{user_id}/submissions/{submission_id}/input/original.png",
                "at": UPLOADED_AT,
            },
        )
        await conn.execute(
            text(
                "INSERT INTO tasks (id, submission_id, user_id, status, result, created_at, updated_at)"
                " VALUES (:id, :sub, :uid, :st, CAST(:res AS json), :at, :at)"
            ),
            {"id": task_id, "sub": submission_id, "uid": user_id, "st": status,
             "res": json.dumps(result), "at": UPLOADED_AT},
        )
    if tiled and bucket is not None:
        bucket.put_image(base)
    return str(task_id), base


async def make_collection(client: AsyncClient, items: list[str] | None = None, title: str = "Orion") -> str:
    resp = await client.post("/me/collections", json={"title": title})
    assert resp.status_code == 201, resp.text
    collection_id = resp.json()["id"]
    if items:
        patch_resp = await client.patch(f"/me/collections/{collection_id}", json={"items": items})
        assert patch_resp.status_code == 200, patch_resp.text
    return collection_id


async def add_item_directly(db_engine, collection_id: str, task_id: str, position: int = 0) -> None:
    """Bypass `PATCH` — plants an item the owner API would have rejected."""
    async with db_engine.begin() as conn:
        await conn.execute(
            text("INSERT INTO collection_items (collection_id, task_id, position)"
                 " VALUES (:c, :t, :p)"),
            {"c": collection_id, "t": task_id, "p": position},
        )


async def share(client: AsyncClient, collection_id: str) -> str:
    resp = await client.post(f"/me/collections/{collection_id}/share")
    assert resp.status_code == 200, resp.text
    return resp.json()["token"]


async def unshare(client: AsyncClient, collection_id: str) -> None:
    resp = await client.delete(f"/me/collections/{collection_id}/share")
    assert resp.status_code == 204, resp.text


async def stored_base(db_engine, task_id: str) -> str | None:
    async with db_engine.begin() as conn:
        return (await conn.execute(
            text("SELECT result -> 'hips' ->> 'base' FROM tasks WHERE id = :id"), {"id": task_id}
        )).scalar_one()


async def sky_base(client: AsyncClient, task_id: str) -> str | None:
    resp = await client.get("/me/sky")
    assert resp.status_code == 200, resp.text
    return next(i for i in resp.json()["images"] if i["id"] == task_id)["base"]


async def set_expires_at(db_engine, collection_id: str, when: datetime | None) -> None:
    async with db_engine.begin() as conn:
        await conn.execute(
            text("UPDATE collections SET expires_at = :when WHERE id = :id"),
            {"when": when, "id": collection_id},
        )


# --- The acceptance criterion from the ticket ---

class TestRevokedLinkKillsTiles:
    async def test_share_tile_200_unshare_tile_404_and_new_base(
        self, client: AsyncClient, db_engine, bucket
    ):
        """share → tile 200 → unshare → old URL 404, `/me/sky` serves the new base."""
        task_id, base = await seed_image(db_engine, bucket, secret="Qm3xK9pLa2Zt7VbN")
        collection_id = await make_collection(client, [task_id])
        await share(client, collection_id)

        assert bucket.get(tile_url(base)) == 200

        await unshare(client, collection_id)

        assert bucket.get(tile_url(base)) == 404, "the revoked link's tiles are still live"

        new_base = await sky_base(client, task_id)
        assert new_base != base
        assert new_base.startswith(f"{PUBLIC_ROOT}/img/")
        assert bucket.get(tile_url(new_base)) == 200, "the owner's own image stopped resolving"

    async def test_every_object_moves_with_the_secret(self, client: AsyncClient, db_engine, bucket):
        task_id, base = await seed_image(db_engine, bucket, secret="Ck7dQvJm2pR4sT6uV8")
        collection_id = await make_collection(client, [task_id])
        await share(client, collection_id)
        await unshare(client, collection_id)

        new_base = await stored_base(db_engine, task_id)
        assert sorted(bucket.keys) == sorted(f"{tile_prefix(new_base)}/{s}" for s in TILE_SUFFIXES)

    async def test_thumb_url_follows_the_new_base(self, client: AsyncClient, db_engine, bucket):
        """`result.hips.thumb` is `{base}/thumb.jpg` — a stale one would 404 in the panel."""
        task_id, _ = await seed_image(db_engine, bucket, secret="ThumbSecret12345678")
        collection_id = await make_collection(client, [task_id])
        await share(client, collection_id)
        await unshare(client, collection_id)

        resp = await client.get("/me/sky")
        image = next(i for i in resp.json()["images"] if i["id"] == task_id)
        assert image["thumb"] == f"{image['base']}/thumb.jpg"
        assert bucket.get(image["thumb"]) == 200


# --- Which images get rotated ---

class TestRotationScope:
    async def test_image_in_another_shared_collection_is_untouched(
        self, client: AsyncClient, db_engine, bucket
    ):
        """The core rule of §5: a live link elsewhere still needs those tile URLs."""
        shared_id, shared_base = await seed_image(db_engine, bucket, secret="StillSharedAAAAAAA")
        lonely_id, lonely_base = await seed_image(db_engine, bucket, secret="OnlyHereBBBBBBBBBB")

        revoked = await make_collection(client, [shared_id, lonely_id], title="Revoked")
        keeper = await make_collection(client, [shared_id], title="Keeper")
        keeper_token = await share(client, keeper)
        await share(client, revoked)

        await unshare(client, revoked)

        assert bucket.rotations() == {tile_prefix(lonely_base)}
        assert await stored_base(db_engine, shared_id) == shared_base
        assert bucket.get(tile_url(shared_base)) == 200
        assert bucket.get(tile_url(lonely_base)) == 404

        # ...and the link that is still live keeps resolving to that untouched base
        anon = await client.get(f"/public/sky/{keeper_token}")
        assert anon.status_code == 200
        assert [i["base"] for i in anon.json()["images"]] == [shared_base]

    async def test_image_in_another_private_collection_is_rotated(
        self, client: AsyncClient, db_engine, bucket
    ):
        """A collection with no token publishes nothing — it must not veto the rotation."""
        task_id, base = await seed_image(db_engine, bucket, secret="PrivateElsewhereCC")
        revoked = await make_collection(client, [task_id], title="Revoked")
        await make_collection(client, [task_id], title="Private")
        await share(client, revoked)

        await unshare(client, revoked)

        assert bucket.rotations() == {tile_prefix(base)}
        assert await stored_base(db_engine, task_id) != base

    async def test_foreign_private_collection_does_not_block_rotation(
        self, client: AsyncClient, db_engine, bucket
    ):
        """Another user's *private* collection is not a live link either."""
        task_id, base = await seed_image(db_engine, bucket, secret="ForeignPrivateDDDDD")
        revoked = await make_collection(client, [task_id], title="Revoked")

        app.dependency_overrides[get_current_user] = lambda: OTHER_USER
        foreign = await make_collection(client, title="Foreign")
        await add_item_directly(db_engine, foreign, task_id)
        app.dependency_overrides[get_current_user] = lambda: TEST_USER

        await share(client, revoked)
        await unshare(client, revoked)

        assert bucket.rotations() == {tile_prefix(base)}

    async def test_expired_guest_share_elsewhere_still_counts_as_shared(
        self, client: AsyncClient, db_engine, bucket
    ):
        """`extend_guest_expiry` revives an expired guest link, so its tiles stay put."""
        task_id, base = await seed_image(db_engine, bucket, secret="GuestExpiredEEEEEE")
        revoked = await make_collection(client, [task_id], title="Revoked")
        keeper = await make_collection(client, [task_id], title="Guest keeper")
        await share(client, keeper)
        await share(client, revoked)
        await set_expires_at(db_engine, keeper, datetime.now(timezone.utc) - timedelta(days=1))

        await unshare(client, revoked)

        assert bucket.rotations() == set()
        assert await stored_base(db_engine, task_id) == base

    async def test_another_users_image_is_never_rotated(self, client: AsyncClient, db_engine, bucket):
        """Defence in depth: a stray item must not let one user break another user's URLs."""
        mine_id, mine_base = await seed_image(db_engine, bucket, secret="MineFFFFFFFFFFFFFF")
        theirs_id, theirs_base = await seed_image(
            db_engine, bucket, secret="TheirsGGGGGGGGGGGG", user_id=OTHER_USER
        )
        collection_id = await make_collection(client, [mine_id])
        await add_item_directly(db_engine, collection_id, theirs_id, position=1)
        await share(client, collection_id)

        await unshare(client, collection_id)

        assert bucket.rotations() == {tile_prefix(mine_base)}
        assert await stored_base(db_engine, theirs_id) == theirs_base

    async def test_untiled_images_are_skipped(self, client: AsyncClient, db_engine, bucket):
        """`tiling` and tiling-failed images own no secret; queueing them is pure waste."""
        tiling_id, _ = await seed_image(db_engine, bucket, secret="unused1", status="tiling", tiled=False)
        failed_id, _ = await seed_image(db_engine, bucket, secret="unused2", tiled=False)
        ready_id, ready_base = await seed_image(db_engine, bucket, secret="ReadyHHHHHHHHHHHHH")

        collection_id = await make_collection(client, [tiling_id, ready_id])
        # A tiling failure is only reachable after the item was added, so plant it directly.
        await add_item_directly(db_engine, collection_id, failed_id, position=2)
        await share(client, collection_id)
        await unshare(client, collection_id)

        assert bucket.rotations() == {tile_prefix(ready_base)}

    async def test_all_images_of_the_collection_are_rotated(self, client: AsyncClient, db_engine, bucket):
        images = [await seed_image(db_engine, bucket, secret=f"Multi{i}IIIIIIIIIIIII") for i in range(3)]
        collection_id = await make_collection(client, [task_id for task_id, _ in images])
        await share(client, collection_id)

        await unshare(client, collection_id)

        assert bucket.rotations() == {tile_prefix(base) for _, base in images}
        for task_id, base in images:
            assert await stored_base(db_engine, task_id) != base
            assert bucket.get(tile_url(base)) == 404


# --- The other two ways an owner revokes a link ---

class TestDeleteCollectionRevokes:
    """`DELETE /me/collections/{id}` is "revoke the link" too, and must kill the tiles."""

    async def test_deleting_a_shared_collection_rotates_its_images(
        self, client: AsyncClient, db_engine, bucket
    ):
        task_id, base = await seed_image(db_engine, bucket, secret="DeletedMMMMMMMMMMM")
        collection_id = await make_collection(client, [task_id])
        await share(client, collection_id)
        assert bucket.get(tile_url(base)) == 200

        assert (await client.delete(f"/me/collections/{collection_id}")).status_code == 204

        assert bucket.rotations() == {tile_prefix(base)}
        assert bucket.get(tile_url(base)) == 404, "a copied tile URL outlived the collection"
        new_base = await stored_base(db_engine, task_id)
        assert new_base != base and bucket.get(tile_url(new_base)) == 200

    async def test_an_image_another_link_still_serves_is_left_alone(
        self, client: AsyncClient, db_engine, bucket
    ):
        shared_id, shared_base = await seed_image(db_engine, bucket, secret="KeptOnDeleteAAAAAA")
        lonely_id, lonely_base = await seed_image(db_engine, bucket, secret="GoneOnDeleteBBBBBB")
        doomed = await make_collection(client, [shared_id, lonely_id], title="Doomed")
        keeper = await make_collection(client, [shared_id], title="Keeper")
        await share(client, keeper)
        await share(client, doomed)

        assert (await client.delete(f"/me/collections/{doomed}")).status_code == 204

        assert bucket.rotations() == {tile_prefix(lonely_base)}
        assert await stored_base(db_engine, shared_id) == shared_base
        assert bucket.get(tile_url(shared_base)) == 200


class TestRemovingAnItemRevokes:
    """`PATCH {items: [...]}` that drops an image from a shared collection revokes it."""

    async def test_removed_image_is_rotated(self, client: AsyncClient, db_engine, bucket):
        dropped_id, dropped_base = await seed_image(db_engine, bucket, secret="DroppedCCCCCCCCCCC")
        kept_id, kept_base = await seed_image(db_engine, bucket, secret="KeptItemDDDDDDDDDD")
        collection_id = await make_collection(client, [dropped_id, kept_id])
        await share(client, collection_id)

        resp = await client.patch(f"/me/collections/{collection_id}", json={"items": [kept_id]})
        assert resp.status_code == 200, resp.text

        assert bucket.rotations() == {tile_prefix(dropped_base)}
        assert bucket.get(tile_url(dropped_base)) == 404
        # the image the link still publishes must keep the URLs its viewers are using
        assert await stored_base(db_engine, kept_id) == kept_base
        assert bucket.get(tile_url(kept_base)) == 200

    async def test_a_removed_image_shared_elsewhere_is_left_alone(
        self, client: AsyncClient, db_engine, bucket
    ):
        task_id, base = await seed_image(db_engine, bucket, secret="RemovedButSharedEEE")
        collection_id = await make_collection(client, [task_id], title="Edited")
        keeper = await make_collection(client, [task_id], title="Keeper")
        await share(client, keeper)
        await share(client, collection_id)

        await client.patch(f"/me/collections/{collection_id}", json={"items": []})

        assert bucket.copied == []
        assert await stored_base(db_engine, task_id) == base

    async def test_editing_a_private_collection_rotates_nothing(
        self, client: AsyncClient, db_engine, bucket
    ):
        """No link was handed out, so removing an item revokes nothing."""
        task_id, base = await seed_image(db_engine, bucket, secret="PrivateEditFFFFFFF")
        collection_id = await make_collection(client, [task_id])

        await client.patch(f"/me/collections/{collection_id}", json={"items": []})

        assert bucket.copied == []
        assert await stored_base(db_engine, task_id) == base

    async def test_reordering_and_adding_rotate_nothing(
        self, client: AsyncClient, db_engine, bucket
    ):
        """Only *removal* revokes: the same images under a new order are still published."""
        first, first_base = await seed_image(db_engine, bucket, secret="ReorderOneGGGGGGGG")
        second, second_base = await seed_image(db_engine, bucket, secret="ReorderTwoHHHHHHHH")
        collection_id = await make_collection(client, [first])
        await share(client, collection_id)

        await client.patch(f"/me/collections/{collection_id}", json={"items": [second, first]})

        assert bucket.copied == []
        assert await stored_base(db_engine, first) == first_base
        assert await stored_base(db_engine, second) == second_base


# --- When nothing should happen ---

class TestNoRotation:
    async def test_unsharing_a_never_shared_collection_rotates_nothing(
        self, client: AsyncClient, db_engine, bucket
    ):
        task_id, base = await seed_image(db_engine, bucket, secret="NeverSharedJJJJJJJ")
        collection_id = await make_collection(client, [task_id])

        await unshare(client, collection_id)

        assert bucket.copied == [] and bucket.deleted == []
        assert await stored_base(db_engine, task_id) == base

    async def test_second_unshare_is_a_no_op(self, client: AsyncClient, db_engine, bucket):
        """A repeated DELETE must not churn the bucket a second time."""
        task_id, _ = await seed_image(db_engine, bucket, secret="TwiceKKKKKKKKKKKKK")
        collection_id = await make_collection(client, [task_id])
        await share(client, collection_id)

        await unshare(client, collection_id)
        rotated_once = await stored_base(db_engine, task_id)
        await unshare(client, collection_id)

        assert len(bucket.copied) == 1
        assert await stored_base(db_engine, task_id) == rotated_once

    async def test_empty_collection_rotates_nothing(self, client: AsyncClient, bucket):
        collection_id = await make_collection(client)
        await share(client, collection_id)
        await unshare(client, collection_id)
        assert bucket.copied == []

    async def test_a_rejected_unshare_rotates_nothing(self, client: AsyncClient, db_engine, bucket):
        """404 for a non-owner — and no side effect on the way out."""
        task_id, base = await seed_image(db_engine, bucket, secret="NotYoursLLLLLLLLLL")
        collection_id = await make_collection(client, [task_id])
        token = await share(client, collection_id)

        app.dependency_overrides[get_current_user] = lambda: OTHER_USER
        resp = await client.delete(f"/me/collections/{collection_id}/share")
        app.dependency_overrides[get_current_user] = lambda: TEST_USER

        assert resp.status_code == 404
        assert bucket.copied == []
        assert bucket.get(tile_url(base)) == 200
        assert (await client.get(f"/public/sky/{token}")).status_code == 200

    async def test_deleting_a_never_shared_collection_rotates_nothing(
        self, client: AsyncClient, db_engine, bucket
    ):
        """No link was ever handed out, so no tile URL needs to die."""
        task_id, base = await seed_image(db_engine, bucket, secret="DeletedPrivateMMMMM")
        collection_id = await make_collection(client, [task_id])

        assert (await client.delete(f"/me/collections/{collection_id}")).status_code == 204

        assert bucket.copied == []
        assert await stored_base(db_engine, task_id) == base
        assert bucket.get(tile_url(base)) == 200


# --- The unshare response neither waits on, nor fails with, the bucket ---

class TestBestEffort:
    async def test_a_failing_bucket_still_returns_204_and_keeps_the_link_revoked(
        self, client: AsyncClient, db_engine, bucket
    ):
        """Rotation is best-effort; revocation is not. The token is gone either way."""
        task_id, base = await seed_image(db_engine, bucket, secret="CopyFailsNNNNNNNNN")
        bucket.copy_fails_for.add(tile_prefix(base))
        collection_id = await make_collection(client, [task_id])
        token = await share(client, collection_id)

        await unshare(client, collection_id)

        assert (await client.get(f"/public/sky/{token}")).status_code == 404
        # The image is untouched and still points where it did — a retry can pick it up.
        assert await stored_base(db_engine, task_id) == base
        assert bucket.get(tile_url(base)) == 200

    async def test_one_failing_image_does_not_strand_the_others(
        self, client: AsyncClient, db_engine, bucket
    ):
        bad_id, bad_base = await seed_image(db_engine, bucket, secret="BadOnePPPPPPPPPPPP")
        good_id, good_base = await seed_image(db_engine, bucket, secret="GoodOneQQQQQQQQQQQ")
        bucket.copy_fails_for.add(tile_prefix(bad_base))

        collection_id = await make_collection(client, [bad_id, good_id])
        await share(client, collection_id)
        await unshare(client, collection_id)

        assert await stored_base(db_engine, bad_id) == bad_base
        assert await stored_base(db_engine, good_id) != good_base
        assert bucket.get(tile_url(good_base)) == 404

    async def test_rotation_is_scheduled_as_a_background_task(
        self, client: AsyncClient, db_engine, bucket
    ):
        """It must not run inline: 30–150 CopyObject calls per image would hold the response.

        Patching `BackgroundTasks.add_task` away leaves the endpoint with nothing to do,
        so an untouched bucket is proof the work was handed off rather than done here.
        """
        task_id, _ = await seed_image(db_engine, bucket, secret="BackgroundRRRRRRRR")
        collection_id = await make_collection(client, [task_id])
        await share(client, collection_id)

        with patch("fastapi.BackgroundTasks.add_task") as add_task:
            await unshare(client, collection_id)

        assert add_task.call_count == 1
        args, kwargs = add_task.call_args
        assert args[0] is rotate_image_secrets
        assert [str(i) for i in args[1]] == [task_id]
        assert kwargs["hips_storage"] is bucket
        assert bucket.copied == []          # nothing ran inline


# --- The batch helper on its own ---

class TestRotateImageSecrets:
    async def test_counts_only_what_moved(self):
        ids = [uuid4(), uuid4(), uuid4()]
        with patch("app.services.image_tiles.rotate_image_secret",
                   new=AsyncMock(side_effect=["base-a", None, "base-c"])) as rotate:
            moved = await rotate_image_secrets(ids)
        assert moved == 2
        assert [call.args[0] for call in rotate.await_args_list] == ids

    async def test_an_exception_does_not_stop_the_walk(self):
        ids = [uuid4(), uuid4(), uuid4()]
        with patch("app.services.image_tiles.rotate_image_secret",
                   new=AsyncMock(side_effect=[RuntimeError("boom"), "base-b", "base-c"])):
            assert await rotate_image_secrets(ids) == 2

    async def test_a_log_line_never_carries_the_secret(self):
        """A raised storage error quotes the object key; the log line must not."""
        secret_key = "img/LeakedSecret1234567/Norder3/Npix1.png"
        with patch("app.services.image_tiles.rotate_image_secret",
                   new=AsyncMock(side_effect=HipsStorageError(f"failed on {secret_key}"))):
            with capture_logs("app.services.image_tiles") as records:
                await rotate_image_secrets([uuid4()])

        text = " ".join(record.getMessage() for record in records)
        assert "LeakedSecret" not in text
        assert "img/***" in text

    async def test_empty_list_touches_nothing(self):
        with patch("app.services.image_tiles.rotate_image_secret", new=AsyncMock()) as rotate:
            assert await rotate_image_secrets([]) == 0
        rotate.assert_not_awaited()
