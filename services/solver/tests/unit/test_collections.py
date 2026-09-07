"""Unit tests for the My Sky collections owner API (APO-86)."""

from __future__ import annotations

import json

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.dependencies import get_current_user
from app.main import app
from app.routers.collections import GUEST_SHARE_TTL

from .conftest import TEST_DB_URL, TEST_USER

OTHER_USER = "other-user-999"
MISSING_ID = "00000000-0000-0000-0000-000000000000"

VALID_SUBMISSION = {
    "filename": "test.jpg",
    "content_type": "image/jpeg",
    "file_size_bytes": 1024,
}


# --- Fixtures / helpers ---

@pytest.fixture
async def db_engine():
    """Direct DB access for state the public API cannot produce (task status/result, expires_at)."""
    engine = create_async_engine(TEST_DB_URL, echo=False)
    yield engine
    await engine.dispose()


def _as_user(user_id: str) -> None:
    app.dependency_overrides[get_current_user] = lambda: user_id


async def _create_task(client: AsyncClient) -> str:
    """Create submission → confirm → task; returns task id (status: pending)."""
    create = await client.post("/submissions", json=VALID_SUBMISSION)
    sub_id = create.json()["submission_id"]
    await client.post(f"/submissions/{sub_id}/confirm")
    resp = await client.post("/tasks", json={"submission_id": sub_id})
    assert resp.status_code == 201
    return resp.json()["id"]


async def _set_task_state(db_engine, task_id: str, status: str, result: dict | None) -> None:
    async with db_engine.begin() as conn:
        await conn.execute(
            text("UPDATE tasks SET status = :status, result = CAST(:result AS json) WHERE id = :id"),
            {"status": status, "result": json.dumps(result) if result is not None else None, "id": task_id},
        )


async def _ready_task(client: AsyncClient, db_engine) -> str:
    """A solved and tiled image: completed with result.hips."""
    task_id = await _create_task(client)
    await _set_task_state(db_engine, task_id, "completed", {"center_ra": 1.0, "hips": {"base": "img/secret/"}})
    return task_id


async def _create_collection(client: AsyncClient, title: str = "Orion") -> dict:
    resp = await client.post("/me/collections", json={"title": title})
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _get_collection(client: AsyncClient, collection_id: str) -> dict | None:
    resp = await client.get("/me/collections")
    assert resp.status_code == 200
    return next((c for c in resp.json() if c["id"] == collection_id), None)


# --- Create ---

class TestCreateCollection:
    async def test_success(self, client: AsyncClient):
        resp = await client.post("/me/collections", json={"title": "  Orion  "})
        assert resp.status_code == 201
        data = resp.json()
        UUID(data["id"])
        assert data["title"] == "Orion"
        assert data["items"] == []
        assert data["share_token"] is None
        assert data["expires_at"] is None
        assert data["created_at"] and data["updated_at"]

    @pytest.mark.parametrize("title", ["", "   ", "x" * 81])
    async def test_invalid_title(self, client: AsyncClient, title: str):
        resp = await client.post("/me/collections", json={"title": title})
        assert resp.status_code == 422

    async def test_title_max_length_ok(self, client: AsyncClient):
        resp = await client.post("/me/collections", json={"title": "x" * 80})
        assert resp.status_code == 201

    async def test_missing_title(self, client: AsyncClient):
        resp = await client.post("/me/collections", json={})
        assert resp.status_code == 422

    async def test_limit_50_per_user(self, client: AsyncClient):
        for i in range(50):
            await _create_collection(client, f"c{i}")

        resp = await client.post("/me/collections", json={"title": "one too many"})
        assert resp.status_code == 422

        # Limit is per user: another user can still create
        _as_user(OTHER_USER)
        resp = await client.post("/me/collections", json={"title": "mine"})
        assert resp.status_code == 201


# --- List ---

class TestListCollections:
    async def test_empty(self, client: AsyncClient):
        resp = await client.get("/me/collections")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_lists_own_with_items_in_order(self, client: AsyncClient, db_engine):
        a = await _create_collection(client, "A")
        b = await _create_collection(client, "B")
        t1, t2 = await _ready_task(client, db_engine), await _ready_task(client, db_engine)
        await client.patch(f"/me/collections/{b['id']}", json={"items": [t2, t1]})

        resp = await client.get("/me/collections")
        assert resp.status_code == 200
        data = resp.json()
        assert [c["id"] for c in data] == [a["id"], b["id"]]
        assert data[0]["items"] == []
        assert data[1]["items"] == [t2, t1]
        assert set(data[1]) >= {"id", "title", "items", "share_token", "expires_at", "created_at", "updated_at"}

    async def test_user_isolation(self, client: AsyncClient):
        await _create_collection(client, "A's")

        _as_user(OTHER_USER)
        resp = await client.get("/me/collections")
        assert resp.json() == []


# --- Update ---

class TestUpdateCollection:
    async def test_rename(self, client: AsyncClient):
        col = await _create_collection(client)
        resp = await client.patch(f"/me/collections/{col['id']}", json={"title": "Winter sky"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Winter sky"
        assert resp.json()["items"] == []
        assert resp.json()["updated_at"] >= col["updated_at"]

    async def test_rename_invalid_title(self, client: AsyncClient):
        col = await _create_collection(client)
        resp = await client.patch(f"/me/collections/{col['id']}", json={"title": ""})
        assert resp.status_code == 422
        assert (await _get_collection(client, col["id"]))["title"] == "Orion"

    async def test_set_items_keeps_order(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        tasks = [await _ready_task(client, db_engine) for _ in range(3)]
        order = [tasks[2], tasks[0], tasks[1]]

        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": order})
        assert resp.status_code == 200
        assert resp.json()["items"] == order
        assert (await _get_collection(client, col["id"]))["items"] == order

    async def test_reorder_and_replace(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        t1, t2, t3 = [await _ready_task(client, db_engine) for _ in range(3)]
        await client.patch(f"/me/collections/{col['id']}", json={"items": [t1, t2, t3]})

        # Reverse — same PKs, new positions
        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": [t3, t2, t1]})
        assert resp.status_code == 200
        assert resp.json()["items"] == [t3, t2, t1]

        # Drop one — full list is authoritative
        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": [t2]})
        assert resp.status_code == 200
        assert resp.json()["items"] == [t2]
        assert (await _get_collection(client, col["id"]))["items"] == [t2]

    async def test_clear_items(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        t1 = await _ready_task(client, db_engine)
        await client.patch(f"/me/collections/{col['id']}", json={"items": [t1]})

        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": []})
        assert resp.status_code == 200
        assert resp.json()["items"] == []

    async def test_title_and_items_together(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        t1 = await _ready_task(client, db_engine)
        resp = await client.patch(f"/me/collections/{col['id']}", json={"title": "Both", "items": [t1]})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Both"
        assert resp.json()["items"] == [t1]

    async def test_empty_body_is_noop(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        t1 = await _ready_task(client, db_engine)
        await client.patch(f"/me/collections/{col['id']}", json={"items": [t1]})

        resp = await client.patch(f"/me/collections/{col['id']}", json={})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Orion"
        assert resp.json()["items"] == [t1]

    @pytest.mark.parametrize(
        "status,result",
        [
            ("failed", None),
            ("completed", {"center_ra": 1.0}),  # solved but tiling failed → no hips
            ("completed", {"center_ra": 1.0, "hips_error": "boom"}),
            ("pending", None),
            ("processing", None),
            ("cancelled", None),
        ],
    )
    async def test_not_ready_task_rejected(self, client: AsyncClient, db_engine, status, result):
        col = await _create_collection(client)
        ok = await _ready_task(client, db_engine)
        bad = await _create_task(client)
        await _set_task_state(db_engine, bad, status, result)

        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": [ok, bad]})
        assert resp.status_code == 404
        # Whole request rejected — nothing partially written
        assert (await _get_collection(client, col["id"]))["items"] == []

    async def test_unknown_task_rejected(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        ok = await _ready_task(client, db_engine)
        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": [ok, str(uuid4())]})
        assert resp.status_code == 404
        assert (await _get_collection(client, col["id"]))["items"] == []

    async def test_other_users_task_rejected(self, client: AsyncClient, db_engine):
        """IDOR: a ready task owned by someone else cannot be added."""
        _as_user(OTHER_USER)
        foreign = await _ready_task(client, db_engine)

        _as_user(TEST_USER)
        col = await _create_collection(client)
        mine = await _ready_task(client, db_engine)
        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": [mine, foreign]})
        assert resp.status_code == 404
        assert (await _get_collection(client, col["id"]))["items"] == []

    async def test_other_users_collection_404(self, client: AsyncClient, db_engine):
        """IDOR: a collection id of another user behaves as if it does not exist."""
        col = await _create_collection(client, "A's")

        _as_user(OTHER_USER)
        foreign_task = await _ready_task(client, db_engine)
        resp = await client.patch(f"/me/collections/{col['id']}", json={"title": "pwned", "items": [foreign_task]})
        assert resp.status_code == 404

        _as_user(TEST_USER)
        unchanged = await _get_collection(client, col["id"])
        assert unchanged["title"] == "A's"
        assert unchanged["items"] == []

    async def test_not_found(self, client: AsyncClient):
        resp = await client.patch(f"/me/collections/{MISSING_ID}", json={"title": "x"})
        assert resp.status_code == 404

    async def test_duplicate_items_422(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        t1 = await _ready_task(client, db_engine)
        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": [t1, t1]})
        assert resp.status_code == 422

    async def test_items_limit_200(self, client: AsyncClient):
        col = await _create_collection(client)
        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": [str(uuid4()) for _ in range(201)]})
        assert resp.status_code == 422

    async def test_invalid_item_id_422(self, client: AsyncClient):
        col = await _create_collection(client)
        resp = await client.patch(f"/me/collections/{col['id']}", json={"items": ["not-a-uuid"]})
        assert resp.status_code == 422

    async def test_same_task_in_two_collections(self, client: AsyncClient, db_engine):
        a = await _create_collection(client, "A")
        b = await _create_collection(client, "B")
        t1 = await _ready_task(client, db_engine)
        assert (await client.patch(f"/me/collections/{a['id']}", json={"items": [t1]})).status_code == 200
        assert (await client.patch(f"/me/collections/{b['id']}", json={"items": [t1]})).status_code == 200

        # Removing from one does not touch the other
        await client.patch(f"/me/collections/{a['id']}", json={"items": []})
        assert (await _get_collection(client, b["id"]))["items"] == [t1]


# --- Delete ---

class TestDeleteCollection:
    async def test_success(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        t1 = await _ready_task(client, db_engine)
        await client.patch(f"/me/collections/{col['id']}", json={"items": [t1]})

        resp = await client.delete(f"/me/collections/{col['id']}")
        assert resp.status_code == 204
        assert await _get_collection(client, col["id"]) is None

        # Items are gone, the task itself is untouched
        async with db_engine.connect() as conn:
            n = (await conn.execute(text("SELECT count(*) FROM collection_items"))).scalar()
        assert n == 0
        assert (await client.get(f"/tasks/{t1}")).status_code == 200

    async def test_not_found(self, client: AsyncClient):
        resp = await client.delete(f"/me/collections/{MISSING_ID}")
        assert resp.status_code == 404

    async def test_other_users_collection_404(self, client: AsyncClient):
        col = await _create_collection(client)

        _as_user(OTHER_USER)
        resp = await client.delete(f"/me/collections/{col['id']}")
        assert resp.status_code == 404

        _as_user(TEST_USER)
        assert await _get_collection(client, col["id"]) is not None


# --- Cascade from tasks ---

class TestTaskCascade:
    async def test_task_row_delete_removes_item(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        t1, t2 = await _ready_task(client, db_engine), await _ready_task(client, db_engine)
        await client.patch(f"/me/collections/{col['id']}", json={"items": [t1, t2]})

        async with db_engine.begin() as conn:
            await conn.execute(text("DELETE FROM tasks WHERE id = :id"), {"id": t1})

        assert (await _get_collection(client, col["id"]))["items"] == [t2]

    async def test_submission_delete_removes_item(self, client: AsyncClient, db_engine):
        """DELETE /submissions cascades submission → task → collection_items."""
        col = await _create_collection(client)
        t1 = await _ready_task(client, db_engine)
        await client.patch(f"/me/collections/{col['id']}", json={"items": [t1]})
        sub_id = (await client.get(f"/tasks/{t1}")).json()["submission_id"]

        resp = await client.delete(f"/submissions/{sub_id}")
        assert resp.status_code == 204

        col_after = await _get_collection(client, col["id"])
        assert col_after is not None  # the collection survives, only the item goes
        assert col_after["items"] == []


# --- Guest expiry extension ---

async def _set_expires_at(db_engine, collection_id: str, value: datetime | None) -> None:
    async with db_engine.begin() as conn:
        await conn.execute(
            text("UPDATE collections SET expires_at = :v WHERE id = :id"),
            {"v": value, "id": collection_id},
        )


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


class TestGuestExpiryExtension:
    async def test_owner_request_extends_expires_at(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        stale = datetime.now(timezone.utc) - timedelta(days=3)
        await _set_expires_at(db_engine, col["id"], stale)

        before = datetime.now(timezone.utc)
        resp = await client.get("/me/collections")
        assert resp.status_code == 200
        expires = _parse(resp.json()[0]["expires_at"])
        assert before + GUEST_SHARE_TTL - timedelta(minutes=1) <= expires <= datetime.now(timezone.utc) + GUEST_SHARE_TTL

    async def test_extends_even_when_request_fails(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        await _set_expires_at(db_engine, col["id"], datetime.now(timezone.utc) - timedelta(days=3))

        resp = await client.patch(f"/me/collections/{MISSING_ID}", json={"title": "x"})
        assert resp.status_code == 404

        async with db_engine.connect() as conn:
            expires = (await conn.execute(text("SELECT expires_at FROM collections WHERE id = :id"), {"id": col["id"]})).scalar()
        assert expires > datetime.now(timezone.utc) + GUEST_SHARE_TTL - timedelta(minutes=1)

    async def test_null_expires_at_stays_null(self, client: AsyncClient):
        col = await _create_collection(client)
        resp = await client.get("/me/collections")
        assert resp.json()[0]["id"] == col["id"]
        assert resp.json()[0]["expires_at"] is None

    async def test_other_users_collections_not_extended(self, client: AsyncClient, db_engine):
        col = await _create_collection(client)
        stale = datetime.now(timezone.utc) - timedelta(days=3)
        await _set_expires_at(db_engine, col["id"], stale)

        _as_user(OTHER_USER)
        await client.get("/me/collections")

        async with db_engine.connect() as conn:
            expires = (await conn.execute(text("SELECT expires_at FROM collections WHERE id = :id"), {"id": col["id"]})).scalar()
        assert abs((expires - stale).total_seconds()) < 1
