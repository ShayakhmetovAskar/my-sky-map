"""Unit tests for sharing: POST/DELETE /me/collections/{id}/share and the public
GET /public/sky/{token} (APO-88)."""

from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException, Request
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.dependencies import get_current_user, get_db, get_is_guest
from app.main import app
from app.routers.collections import GUEST_SHARE_TTL
from app.routers.public import SHARE_TOKEN_RE
from app.schemas.sky import SkyImage

from .conftest import TEST_DB_URL, TEST_USER

OTHER_USER = "other-user-999"
MISSING_ID = "00000000-0000-0000-0000-000000000000"

# A 22-char url-safe token that is well-formed but was never issued.
UNKNOWN_TOKEN = "A" * 22

FILENAME = "andromeda_stack_2026.fits.png"
SECRET_BASE = "https://storage.yandexcloud.net/skymap-static-data/img/Qm3xK9pLa2Zt7VbN"

HIPS = {
    "kmax": 8,
    "tiles": 33,
    "moc": {"8": [198479, 198482], "0": [3]},
    "base": SECRET_BASE,
    "thumb": f"{SECRET_BASE}/thumb.jpg",
}

# Everything the worker persists, object keys and job URL included — none of it may surface.
CALIBRATION = {
    "center_ra": 322.5006928208016,
    "center_dec": 12.170153444689625,
    "field_of_view": 0.9342940374091998,
    "pixel_scale": 0.790666335806892,
    "orientation": 259.8079826946325,
    "corners": [[322.77323, 11.78662], [322.89376, 12.43637]],
    "width": 3008,
    "height": 3008,
    "original_image_key": f"users/{TEST_USER}/submissions/sub-1/input/{FILENAME}",
    "annotated_image_key": f"users/{TEST_USER}/submissions/sub-1/tasks/t-1/output/annotated.png",
    "wcs_key": f"users/{TEST_USER}/submissions/sub-1/tasks/t-1/output/wcs.fits",
    "astrometry_job_url": "https://nova.astrometry.net/jobs/123",
}
READY_RESULT = {**CALIBRATION, "hips": HIPS}

UPLOADED_AT = datetime(2026, 9, 3, 12, 0, tzinfo=timezone.utc)


# --- Fixtures / helpers ---

@pytest.fixture
async def db_engine():
    """Direct DB access for state the API cannot produce (solved results, expires_at)."""
    engine = create_async_engine(TEST_DB_URL, echo=False)
    yield engine
    await engine.dispose()


@pytest.fixture
async def anon_client(client):
    """A caller with no credentials, usable alongside the authenticated `client`.

    Depends on `client` for the DB override and the truncate teardown, and sends no
    Authorization header. The blanket auth override from `conftest` would hand every
    caller a user regardless of headers, so it is narrowed here to something that behaves
    like real auth: 401 without a header. That keeps `client` (which sends one) working
    while a 200 here still proves the public route declares no auth at all.
    """
    async def auth_or_401(request: Request) -> str:
        if "authorization" not in request.headers:
            raise HTTPException(status_code=401, detail="Missing token")
        return TEST_USER

    app.dependency_overrides[get_current_user] = auth_or_401
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


def _as_user(user_id: str) -> None:
    app.dependency_overrides[get_current_user] = lambda: user_id


def _as_guest(is_guest: bool = True) -> None:
    app.dependency_overrides[get_is_guest] = lambda: is_guest


async def seed_task(
    db_engine,
    *,
    user_id: str = TEST_USER,
    status: str = "completed",
    result: dict | None = READY_RESULT,
    filename: str = FILENAME,
    uploaded_at: datetime = UPLOADED_AT,
) -> str:
    """Insert a submission + task straight into the DB (the API never creates solved ones)."""
    submission_id, task_id = uuid4(), uuid4()
    async with db_engine.begin() as conn:
        await conn.execute(
            text(
                "INSERT INTO submissions (id, user_id, status, filename, content_type,"
                " file_size_bytes, object_key, created_at, updated_at)"
                " VALUES (:id, :uid, 'completed', :filename, 'image/png', 1024, :key, :at, :at)"
            ),
            {
                "id": submission_id, "uid": user_id, "filename": filename,
                "key": f"users/{user_id}/submissions/{submission_id}/input/original.png",
                "at": uploaded_at,
            },
        )
        await conn.execute(
            text(
                "INSERT INTO tasks (id, submission_id, user_id, status, result, created_at, updated_at)"
                " VALUES (:id, :sub, :uid, :status, CAST(:result AS json), :at, :at)"
            ),
            {
                "id": task_id, "sub": submission_id, "uid": user_id, "status": status,
                "result": json.dumps(result) if result is not None else None, "at": uploaded_at,
            },
        )
    return str(task_id)


async def make_collection(client: AsyncClient, items: list[str] | None = None, title: str = "Orion") -> str:
    resp = await client.post("/me/collections", json={"title": title})
    assert resp.status_code == 201, resp.text
    collection_id = resp.json()["id"]
    if items:
        patch = await client.patch(f"/me/collections/{collection_id}", json={"items": items})
        assert patch.status_code == 200, patch.text
    return collection_id


async def share(client: AsyncClient, collection_id: str) -> str:
    resp = await client.post(f"/me/collections/{collection_id}/share")
    assert resp.status_code == 200, resp.text
    return resp.json()["token"]


async def get_expires_at(db_engine, collection_id: str) -> datetime | None:
    async with db_engine.begin() as conn:
        return (await conn.execute(
            text("SELECT expires_at FROM collections WHERE id = :id"), {"id": collection_id}
        )).scalar_one()


async def set_expires_at(db_engine, collection_id: str, when: datetime | None) -> None:
    async with db_engine.begin() as conn:
        await conn.execute(
            text("UPDATE collections SET expires_at = :when WHERE id = :id"),
            {"when": when, "id": collection_id},
        )


# --- POST /me/collections/{id}/share ---

class TestShare:
    async def test_issues_token(self, client: AsyncClient):
        collection_id = await make_collection(client)

        resp = await client.post(f"/me/collections/{collection_id}/share")
        assert resp.status_code == 200
        token = resp.json()["token"]

        # 16 bytes of url-safe base64, the exact shape the public router validates.
        assert SHARE_TOKEN_RE.fullmatch(token), token
        assert len(token) == 22
        assert resp.json() == {"token": token}  # no URL: the frontend builds it

    async def test_idempotent(self, client: AsyncClient):
        """A second POST must not silently invalidate links the owner already sent."""
        collection_id = await make_collection(client)

        first = await share(client, collection_id)
        second = await share(client, collection_id)
        assert first == second

    async def test_tokens_differ_between_collections(self, client: AsyncClient):
        a = await share(client, await make_collection(client, title="A"))
        b = await share(client, await make_collection(client, title="B"))
        assert a != b

    async def test_token_visible_in_owner_listing(self, client: AsyncClient):
        collection_id = await make_collection(client)
        token = await share(client, collection_id)

        listing = (await client.get("/me/collections")).json()
        row = next(c for c in listing if c["id"] == collection_id)
        assert row["share_token"] == token

    async def test_reset_is_delete_then_post(self, client: AsyncClient):
        collection_id = await make_collection(client)
        first = await share(client, collection_id)

        assert (await client.delete(f"/me/collections/{collection_id}/share")).status_code == 204
        second = await share(client, collection_id)
        assert second != first

    async def test_empty_collection_can_be_shared(self, client: AsyncClient, anon_client: AsyncClient):
        """Sharing before adding images is allowed; the viewer gets an empty state."""
        token = await share(client, await make_collection(client))

        resp = await anon_client.get(f"/public/sky/{token}")
        assert resp.status_code == 200
        assert resp.json()["images"] == []

    async def test_other_user_cannot_share(self, client: AsyncClient):
        collection_id = await make_collection(client)

        _as_user(OTHER_USER)
        resp = await client.post(f"/me/collections/{collection_id}/share")
        assert resp.status_code == 404

        # ...and the collection stayed private.
        _as_user(TEST_USER)
        row = next(c for c in (await client.get("/me/collections")).json() if c["id"] == collection_id)
        assert row["share_token"] is None

    async def test_missing_collection(self, client: AsyncClient):
        assert (await client.post(f"/me/collections/{MISSING_ID}/share")).status_code == 404

    async def test_registered_user_share_never_expires(self, client: AsyncClient):
        collection_id = await make_collection(client)
        await share(client, collection_id)

        row = next(c for c in (await client.get("/me/collections")).json() if c["id"] == collection_id)
        assert row["expires_at"] is None

    async def test_guest_share_expires_in_30_days(self, client: AsyncClient, db_engine):
        collection_id = await make_collection(client)
        _as_guest()

        before = datetime.now(timezone.utc)
        await share(client, collection_id)
        after = datetime.now(timezone.utc)

        # Straight from the DB: reading through /me/collections would push `expires_at`
        # forward itself (`extend_guest_expiry` runs on every owner request) and the
        # assertion would be measuring the read, not the share.
        expires_at = await get_expires_at(db_engine, collection_id)
        assert GUEST_SHARE_TTL == timedelta(days=30)
        assert before + GUEST_SHARE_TTL <= expires_at <= after + GUEST_SHARE_TTL


# --- DELETE /me/collections/{id}/share ---

class TestUnshare:
    async def test_revokes(self, client: AsyncClient):
        collection_id = await make_collection(client)
        await share(client, collection_id)

        resp = await client.delete(f"/me/collections/{collection_id}/share")
        assert resp.status_code == 204
        assert resp.content == b""

        row = next(c for c in (await client.get("/me/collections")).json() if c["id"] == collection_id)
        assert row["share_token"] is None

    async def test_idempotent_on_private_collection(self, client: AsyncClient):
        collection_id = await make_collection(client)
        assert (await client.delete(f"/me/collections/{collection_id}/share")).status_code == 204
        assert (await client.delete(f"/me/collections/{collection_id}/share")).status_code == 204

    async def test_keeps_guest_expiry_marker(self, client: AsyncClient):
        """`expires_at` marks the row as a guest's, not the link as live — unshare keeps it,
        otherwise `extend_guest_expiry` and the guest cleanup (APO-93) lose the collection."""
        collection_id = await make_collection(client)
        _as_guest()
        await share(client, collection_id)

        await client.delete(f"/me/collections/{collection_id}/share")
        row = next(c for c in (await client.get("/me/collections")).json() if c["id"] == collection_id)
        assert row["share_token"] is None
        assert row["expires_at"] is not None

    async def test_other_user_cannot_unshare(self, client: AsyncClient):
        collection_id = await make_collection(client)
        token = await share(client, collection_id)

        _as_user(OTHER_USER)
        assert (await client.delete(f"/me/collections/{collection_id}/share")).status_code == 404

        _as_user(TEST_USER)
        row = next(c for c in (await client.get("/me/collections")).json() if c["id"] == collection_id)
        assert row["share_token"] == token  # still live

    async def test_missing_collection(self, client: AsyncClient):
        assert (await client.delete(f"/me/collections/{MISSING_ID}/share")).status_code == 404


# --- GET /public/sky/{token} ---

class TestPublicSkyLifecycle:
    async def test_share_then_anon_read_then_revoke(
        self, client: AsyncClient, anon_client: AsyncClient, db_engine
    ):
        """The headline flow: share -> anonymous 200 -> revoke -> 404."""
        task_id = await seed_task(db_engine)
        collection_id = await make_collection(client, items=[task_id], title="Autumn nights")
        token = await share(client, collection_id)

        resp = await anon_client.get(f"/public/sky/{token}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["title"] == "Autumn nights"
        assert [img["id"] for img in body["images"]] == [task_id]

        assert (await client.delete(f"/me/collections/{collection_id}/share")).status_code == 204

        after = await anon_client.get(f"/public/sky/{token}")
        assert after.status_code == 404

    async def test_no_auth_required(self, anon_client: AsyncClient, client: AsyncClient):
        """Sanity-check the fixture: with auth restored, an authenticated route rejects us."""
        token = await share(client, await make_collection(client))

        assert (await anon_client.get("/me/sky")).status_code in (401, 403)
        assert "authorization" not in {k.lower() for k in anon_client.headers}
        assert (await anon_client.get(f"/public/sky/{token}")).status_code == 200

    async def test_image_payload(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        task_id = await seed_task(db_engine)
        token = await share(client, await make_collection(client, items=[task_id]))

        image = (await anon_client.get(f"/public/sky/{token}")).json()["images"][0]
        assert image == {
            "id": task_id,
            "title": "21h30m +12°10′ · 2026-09-03",  # derived from coordinates + upload date
            "date": "2026-09-03",
            "ra": CALIBRATION["center_ra"],
            "dec": CALIBRATION["center_dec"],
            "fov": CALIBRATION["field_of_view"],
            "pixscale": CALIBRATION["pixel_scale"],
            "orientation": CALIBRATION["orientation"],
            "kmax": 8,
            "corners": CALIBRATION["corners"],
            "moc": HIPS["moc"],
            "base": SECRET_BASE,
            "thumb": f"{SECRET_BASE}/thumb.jpg",
            "width": 3008,
            "height": 3008,
            "status": "ready",
        }

    async def test_preserves_collection_order(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        first = await seed_task(db_engine, uploaded_at=datetime(2026, 9, 1, tzinfo=timezone.utc))
        second = await seed_task(db_engine, uploaded_at=datetime(2026, 9, 5, tzinfo=timezone.utc))
        # Curated order, deliberately not the upload order /me/sky would use.
        token = await share(client, await make_collection(client, items=[second, first]))

        images = (await anon_client.get(f"/public/sky/{token}")).json()["images"]
        assert [img["id"] for img in images] == [second, first]

    async def test_tiling_image_listed_without_tiles(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        task_id = await seed_task(db_engine, status="tiling", result=CALIBRATION)
        token = await share(client, await make_collection(client, items=[task_id]))

        image = (await anon_client.get(f"/public/sky/{token}")).json()["images"][0]
        assert image["status"] == "tiling"
        assert image["base"] is None and image["moc"] is None and image["kmax"] is None
        assert image["ra"] == CALIBRATION["center_ra"]  # outline can already be drawn

    async def test_failed_tiling_not_listed(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        """`completed` without `hips` means tiling failed — not part of the layer.

        Such an image can only have been added while it was still `tiling` (the owner API
        refuses a completed task without tiles), so this replays that exact sequence:
        added mid-tiling, tiling then failed, must disappear from the shared view.
        """
        ok = await seed_task(db_engine)
        broken = await seed_task(db_engine, status="tiling", result=CALIBRATION)
        collection_id = await make_collection(client, items=[ok, broken])
        token = await share(client, collection_id)

        assert len((await anon_client.get(f"/public/sky/{token}")).json()["images"]) == 2

        async with db_engine.begin() as conn:
            await conn.execute(
                text("UPDATE tasks SET status = 'completed', result = CAST(:r AS json) WHERE id = :id"),
                {"r": json.dumps({**CALIBRATION, "hips_error": "boom"}), "id": broken},
            )

        images = (await anon_client.get(f"/public/sky/{token}")).json()["images"]
        assert [img["id"] for img in images] == [ok]

    async def test_deleted_image_drops_out(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        """CASCADE from collection_items; the link keeps working with what is left."""
        kept = await seed_task(db_engine)
        removed = await seed_task(db_engine)
        token = await share(client, await make_collection(client, items=[kept, removed]))

        async with db_engine.begin() as conn:
            await conn.execute(text("DELETE FROM tasks WHERE id = :id"), {"id": removed})

        images = (await anon_client.get(f"/public/sky/{token}")).json()["images"]
        assert [img["id"] for img in images] == [kept]


class TestPublicSkyRejects:
    """Malformed, unknown, revoked and expired tokens are indistinguishable: all 404."""

    @pytest.mark.parametrize("token, reason", [
        ("short", "too short"),
        ("A" * 21, "21 chars"),
        ("A" * 23, "23 chars"),
        ("A" * 20 + "!!", "illegal character"),
        ("A" * 21 + "+", "non-url-safe base64 alphabet"),
        ("A" * 20 + "%20", "percent-encoded space"),
        ("../../etc/passwd", "traversal"),
        ("A" * 21 + "а", "cyrillic lookalike"),
        ("' OR 1=1 --", "sql-ish"),
        # Python's `$` matches before a trailing newline, so an anchored `match` would
        # let this one through to the database; the router uses `fullmatch`.
        ("A" * 22 + "%0A", "percent-encoded trailing newline"),
        ("A" * 22 + "%00", "percent-encoded NUL"),
    ])
    async def test_malformed_token(self, anon_client: AsyncClient, token: str, reason: str):
        resp = await anon_client.get(f"/public/sky/{token}")
        assert resp.status_code == 404, f"{reason}: {resp.status_code}"

    async def test_unknown_token(self, anon_client: AsyncClient):
        assert (await anon_client.get(f"/public/sky/{UNKNOWN_TOKEN}")).status_code == 404

    async def test_malformed_token_does_not_touch_the_db(self, anon_client: AsyncClient):
        """A scan of random paths must be answered by the regex, never by a query.

        The session is swapped for one that raises on `execute`, so any query at all fails
        the test loudly instead of quietly costing a round trip.
        """
        session = MagicMock(spec=AsyncSession)
        session.execute = AsyncMock(side_effect=AssertionError("query issued for a malformed token"))

        async def override_get_db():
            yield session

        app.dependency_overrides[get_db] = override_get_db
        try:
            for token in ("not-a-valid-token", "A" * 22 + "%0A", "A" * 23):
                resp = await anon_client.get(f"/public/sky/{token}")
                assert resp.status_code == 404, token
            session.execute.assert_not_awaited()

            # Control: a well-formed token does reach the session (the mock then blows up),
            # proving the assertion above is not passing for the wrong reason.
            with pytest.raises(AssertionError, match="query issued"):
                await anon_client.get(f"/public/sky/{UNKNOWN_TOKEN}")
        finally:
            app.dependency_overrides.pop(get_db, None)

    async def test_expired_guest_share(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        task_id = await seed_task(db_engine)
        collection_id = await make_collection(client, items=[task_id])
        token = await share(client, collection_id)

        assert (await anon_client.get(f"/public/sky/{token}")).status_code == 200

        await set_expires_at(db_engine, collection_id, datetime.now(timezone.utc) - timedelta(seconds=1))
        assert (await anon_client.get(f"/public/sky/{token}")).status_code == 404

    async def test_not_yet_expired_share_still_works(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        collection_id = await make_collection(client)
        token = await share(client, collection_id)

        await set_expires_at(db_engine, collection_id, datetime.now(timezone.utc) + timedelta(days=1))
        assert (await anon_client.get(f"/public/sky/{token}")).status_code == 200

    async def test_expired_share_revived_by_owner_activity(
        self, client: AsyncClient, anon_client: AsyncClient, db_engine
    ):
        """`extend_guest_expiry` runs on any owner request, so the link comes back."""
        collection_id = await make_collection(client)
        token = await share(client, collection_id)
        await set_expires_at(db_engine, collection_id, datetime.now(timezone.utc) - timedelta(seconds=1))
        assert (await anon_client.get(f"/public/sky/{token}")).status_code == 404

        await client.get("/me/collections")
        assert (await anon_client.get(f"/public/sky/{token}")).status_code == 200

    async def test_no_write_methods(self, anon_client: AsyncClient, client: AsyncClient):
        token = await share(client, await make_collection(client))
        for method in ("post", "put", "patch", "delete"):
            resp = await getattr(anon_client, method)(f"/public/sky/{token}")
            assert resp.status_code == 405, method


class TestPublicSkyHeaders:
    async def test_on_success(self, client: AsyncClient, anon_client: AsyncClient):
        token = await share(client, await make_collection(client))

        resp = await anon_client.get(f"/public/sky/{token}")
        assert resp.status_code == 200
        assert resp.headers["cache-control"] == "no-store"
        assert resp.headers["x-robots-tag"] == "noindex, nofollow"

    @pytest.mark.parametrize("token", ["nope", UNKNOWN_TOKEN])
    async def test_on_404(self, anon_client: AsyncClient, token: str):
        """The 404 is exactly what a revoked link gets — caching it would be the bug."""
        resp = await anon_client.get(f"/public/sky/{token}")
        assert resp.status_code == 404
        assert resp.headers["cache-control"] == "no-store"
        assert resp.headers["x-robots-tag"] == "noindex, nofollow"

    async def test_after_revoke(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        collection_id = await make_collection(client, items=[await seed_task(db_engine)])
        token = await share(client, collection_id)
        await client.delete(f"/me/collections/{collection_id}/share")

        resp = await anon_client.get(f"/public/sky/{token}")
        assert resp.status_code == 404
        assert resp.headers["cache-control"] == "no-store"


class TestPublicSkyWhitelist:
    async def test_filename_appears_nowhere(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        """The whole point of the public schema: no field, anywhere, carries the filename."""
        task_id = await seed_task(db_engine, filename=FILENAME)
        token = await share(client, await make_collection(client, items=[task_id]))

        resp = await anon_client.get(f"/public/sky/{token}")
        raw = resp.text

        assert FILENAME not in raw
        assert "filename" not in raw
        # Also its stem, in case something derives a title from it.
        assert "andromeda_stack_2026" not in raw

        # Field by field, including nested values — a substring check on the body alone
        # would pass if the leak sat behind a key we never thought to look at.
        for image in resp.json()["images"]:
            assert "filename" not in image
            for key, value in image.items():
                assert "filename" not in key.lower()
                assert FILENAME not in json.dumps(value)

    async def test_no_private_fields(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        task_id = await seed_task(db_engine)
        token = await share(client, await make_collection(client, items=[task_id]))

        resp = await anon_client.get(f"/public/sky/{token}")
        body = resp.json()
        image = body["images"][0]

        assert set(image) == {
            "id", "title", "date", "ra", "dec", "fov", "pixscale", "orientation", "kmax",
            "corners", "moc", "base", "thumb", "width", "height", "status",
        }
        assert set(image) == set(SkyImage.model_fields)
        assert set(body) == {"title", "images"}

        raw = resp.text
        for leak in (
            "user_id", TEST_USER, "submission_id", "object_key", "original_image_key",
            "annotated_image_key", "wcs_key", "mesh_json_key", "astrometry_job_url",
            "astrometry", "nova.astrometry.net", "presigned", "X-Amz-Signature",
            f"users/{TEST_USER}", "hips_error", "error_code", "error_message",
        ):
            assert leak not in raw, leak

    async def test_base_is_the_only_secret_exposed(self, client: AsyncClient, anon_client: AsyncClient, db_engine):
        """The link legitimately reveals each image's own tile prefix — and nothing beyond it."""
        task_id = await seed_task(db_engine)
        token = await share(client, await make_collection(client, items=[task_id]))

        image = (await anon_client.get(f"/public/sky/{token}")).json()["images"][0]
        assert image["base"] == SECRET_BASE
        assert image["thumb"].startswith(SECRET_BASE)
        assert re.fullmatch(r"https://\S+/img/[A-Za-z0-9_-]+", image["base"])

    async def test_other_users_images_never_surface(
        self, client: AsyncClient, anon_client: AsyncClient, db_engine
    ):
        """Defence in depth: even a row smuggled past PATCH validation stays invisible."""
        mine = await seed_task(db_engine)
        theirs = await seed_task(db_engine, user_id=OTHER_USER, filename="not-mine.png")
        collection_id = await make_collection(client, items=[mine])
        token = await share(client, collection_id)

        async with db_engine.begin() as conn:
            await conn.execute(
                text("INSERT INTO collection_items (collection_id, task_id, position)"
                     " VALUES (:c, :t, 1)"),
                {"c": collection_id, "t": theirs},
            )

        images = (await anon_client.get(f"/public/sky/{token}")).json()["images"]
        assert [img["id"] for img in images] == [mine]

    async def test_public_schema_is_a_subset_of_the_owner_schema(self):
        """Static guard: a field added to the owner's view cannot leak by inheritance."""
        from app.schemas.sky import MySkyImage

        assert set(MySkyImage.model_fields) - set(SkyImage.model_fields) == {"filename"}
        assert "filename" not in SkyImage.model_fields
