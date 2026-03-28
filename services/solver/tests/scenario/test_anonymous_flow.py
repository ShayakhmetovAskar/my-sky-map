"""Scenario tests for anonymous user flow (APO-68).

Tests cover scenarios S1-S10 from the plan:
- S1: Anonymous solve (create submission, confirm, create task)
- S2: Anonymous sees own submissions
- S3: Merge anonymous → authenticated (submissions transfer)
- S4: Merge is idempotent (double merge)
- S5: Auth user with no anon data — merge returns 0
- S6: Anonymous submissions isolated between different anon IDs
- S7: After merge, anon ID no longer has submissions
- S8: Auth user creates submission (normal flow still works)
- S9: Merge transfers tasks too (not just submissions)
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.dependencies import get_user_id, get_current_user, get_db, get_storage
from app.main import app
from .conftest import TEST_DB_URL, ANON_USER, AUTH_USER


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def create_submission(client, filename="test.jpg"):
    resp = await client.post("/submissions", json={
        "filename": filename,
        "content_type": "image/jpeg",
        "file_size_bytes": 1024,
    })
    assert resp.status_code == 201
    return resp.json()


async def confirm_submission(client, submission_id):
    resp = await client.post(f"/submissions/{submission_id}/confirm")
    assert resp.status_code == 200
    return resp.json()


async def create_task(client, submission_id):
    resp = await client.post("/tasks", json={"submission_id": submission_id})
    assert resp.status_code == 201
    return resp.json()


async def list_submissions(client):
    resp = await client.get("/submissions")
    assert resp.status_code == 200
    return resp.json()


# ─── S1: Anonymous user can create submission ─────────────────────────────────

@pytest.mark.asyncio
async def test_s1_anonymous_solve(anon_client):
    """Anonymous user can create a submission."""
    sub = await create_submission(anon_client)
    assert sub["submission_id"]
    assert sub["upload_url"]


# ─── S2: Anonymous user sees own submissions ──────────────────────────────────

@pytest.mark.asyncio
async def test_s2_anonymous_sees_own_submissions(anon_client):
    """Anonymous user sees submissions created under their anon ID."""
    await create_submission(anon_client, "photo1.jpg")
    await create_submission(anon_client, "photo2.jpg")

    data = await list_submissions(anon_client)
    assert data["total"] == 2
    filenames = {s["filename"] for s in data["items"]}
    assert filenames == {"photo1.jpg", "photo2.jpg"}


# ─── S3: Merge anonymous → authenticated ─────────────────────────────────────

@pytest.mark.asyncio
async def test_s3_merge_transfers_submissions(real_storage):
    """After merge, anonymous submissions appear under authenticated user."""
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    try:
        # Phase 1: Create submission as anonymous
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_user_id] = lambda: ANON_USER
        app.dependency_overrides[get_storage] = lambda: real_storage

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as anon:
            sub = await create_submission(anon, "anon_photo.jpg")
            sub_id = sub["submission_id"]

        # Phase 2: Merge as authenticated user
        app.dependency_overrides[get_user_id] = lambda: AUTH_USER
        app.dependency_overrides[get_current_user] = lambda: AUTH_USER

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as auth:
            merge_resp = await auth.post("/auth/merge", json={"anonymous_id": "00000000-0000-4000-a000-000000000001"})
            assert merge_resp.status_code == 200
            assert merge_resp.json()["merged"] > 0

            # Verify submissions now visible under auth user
            subs = await list_submissions(auth)
            assert subs["total"] >= 1
            assert any(s["filename"] == "anon_photo.jpg" for s in subs["items"])

    finally:
        async with test_engine.begin() as conn:
            await conn.execute(text("TRUNCATE tasks, submissions, star_aliases, star_catalog CASCADE"))
        app.dependency_overrides.clear()
        await test_engine.dispose()


# ─── S4: Double merge is idempotent ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_s4_merge_idempotent(real_storage):
    """Calling merge twice returns 0 on second call."""
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    try:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_user_id] = lambda: ANON_USER
        app.dependency_overrides[get_storage] = lambda: real_storage

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as anon:
            await create_submission(anon)

        app.dependency_overrides[get_user_id] = lambda: AUTH_USER
        app.dependency_overrides[get_current_user] = lambda: AUTH_USER

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as auth:
            resp1 = await auth.post("/auth/merge", json={"anonymous_id": "00000000-0000-4000-a000-000000000001"})
            assert resp1.json()["merged"] > 0

            resp2 = await auth.post("/auth/merge", json={"anonymous_id": "00000000-0000-4000-a000-000000000001"})
            assert resp2.json()["merged"] == 0

    finally:
        async with test_engine.begin() as conn:
            await conn.execute(text("TRUNCATE tasks, submissions, star_aliases, star_catalog CASCADE"))
        app.dependency_overrides.clear()
        await test_engine.dispose()


# ─── S5: Auth user with no anon data ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_s5_merge_empty(auth_client):
    """Merge with non-existent anon ID returns 0."""
    resp = await auth_client.post("/auth/merge", json={"anonymous_id": "eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee"})
    assert resp.status_code == 200
    assert resp.json()["merged"] == 0


# ─── S6: Different anon IDs are isolated ──────────────────────────────────────

@pytest.mark.asyncio
async def test_s6_anon_isolation(real_storage):
    """Two different anonymous users don't see each other's submissions."""
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    try:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_storage] = lambda: real_storage

        # Anon user A creates submission
        app.dependency_overrides[get_user_id] = lambda: "anon:aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_a:
            await create_submission(client_a, "photo_a.jpg")

        # Anon user B creates submission
        app.dependency_overrides[get_user_id] = lambda: "anon:bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_b:
            await create_submission(client_b, "photo_b.jpg")
            subs = await list_submissions(client_b)
            assert subs["total"] == 1
            assert subs["items"][0]["filename"] == "photo_b.jpg"

        # Anon user A only sees their own
        app.dependency_overrides[get_user_id] = lambda: "anon:aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_a:
            subs = await list_submissions(client_a)
            assert subs["total"] == 1
            assert subs["items"][0]["filename"] == "photo_a.jpg"

    finally:
        async with test_engine.begin() as conn:
            await conn.execute(text("TRUNCATE tasks, submissions, star_aliases, star_catalog CASCADE"))
        app.dependency_overrides.clear()
        await test_engine.dispose()


# ─── S7: After merge, anon ID has no submissions ─────────────────────────────

@pytest.mark.asyncio
async def test_s7_anon_empty_after_merge(real_storage):
    """After merge, querying with old anon ID returns empty list."""
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    try:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_storage] = lambda: real_storage

        # Create as anon
        app.dependency_overrides[get_user_id] = lambda: ANON_USER
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as anon:
            await create_submission(anon)
            subs = await list_submissions(anon)
            assert subs["total"] == 1

        # Merge
        app.dependency_overrides[get_user_id] = lambda: AUTH_USER
        app.dependency_overrides[get_current_user] = lambda: AUTH_USER
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as auth:
            await auth.post("/auth/merge", json={"anonymous_id": "00000000-0000-4000-a000-000000000001"})

        # Anon ID now empty
        app.dependency_overrides[get_user_id] = lambda: ANON_USER
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as anon:
            subs = await list_submissions(anon)
            assert subs["total"] == 0

    finally:
        async with test_engine.begin() as conn:
            await conn.execute(text("TRUNCATE tasks, submissions, star_aliases, star_catalog CASCADE"))
        app.dependency_overrides.clear()
        await test_engine.dispose()


# ─── S8: Auth user normal flow still works ────────────────────────────────────

@pytest.mark.asyncio
async def test_s8_auth_user_normal_flow(auth_client):
    """Authenticated user can create submissions normally."""
    sub = await create_submission(auth_client)
    assert sub["submission_id"]

    subs = await list_submissions(auth_client)
    assert subs["total"] == 1


# ─── S9: Merge transfers tasks too ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_s9_merge_transfers_tasks(real_storage):
    """Merge transfers both submissions AND tasks to authenticated user."""
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    try:
        # Create submission + task as anon
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_user_id] = lambda: ANON_USER
        app.dependency_overrides[get_storage] = lambda: real_storage

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as anon:
            sub = await create_submission(anon)
            await confirm_submission(anon, sub["submission_id"])
            task = await create_task(anon, sub["submission_id"])
            task_id = task["id"]

        # Merge
        app.dependency_overrides[get_user_id] = lambda: AUTH_USER
        app.dependency_overrides[get_current_user] = lambda: AUTH_USER

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as auth:
            merge_resp = await auth.post("/auth/merge", json={"anonymous_id": "00000000-0000-4000-a000-000000000001"})
            assert merge_resp.json()["merged"] > 0

            # Task is now accessible under auth user
            task_resp = await auth.get(f"/tasks/{task_id}")
            assert task_resp.status_code == 200

    finally:
        async with test_engine.begin() as conn:
            await conn.execute(text("TRUNCATE tasks, submissions, star_aliases, star_catalog CASCADE"))
        app.dependency_overrides.clear()
        await test_engine.dispose()


# ─── S9b: Two anon IDs merge to same account ─────────────────────────────────

@pytest.mark.asyncio
async def test_s9b_two_anon_merge_to_one_account(real_storage):
    """Two different anonymous identities can be merged into the same account."""
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    try:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_storage] = lambda: real_storage

        # Anon A creates submission
        app.dependency_overrides[get_user_id] = lambda: "anon:cccccccc-cccc-4ccc-cccc-cccccccccccc"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_a:
            await create_submission(client_a, "from_chrome.jpg")

        # Anon B creates submission
        app.dependency_overrides[get_user_id] = lambda: "anon:dddddddd-dddd-4ddd-dddd-dddddddddddd"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client_b:
            await create_submission(client_b, "from_firefox.jpg")

        # Auth user merges both
        app.dependency_overrides[get_user_id] = lambda: AUTH_USER
        app.dependency_overrides[get_current_user] = lambda: AUTH_USER

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as auth:
            resp_a = await auth.post("/auth/merge", json={"anonymous_id": "cccccccc-cccc-4ccc-cccc-cccccccccccc"})
            assert resp_a.json()["merged"] > 0

            resp_b = await auth.post("/auth/merge", json={"anonymous_id": "dddddddd-dddd-4ddd-dddd-dddddddddddd"})
            assert resp_b.json()["merged"] > 0

            # Both submissions visible
            subs = await list_submissions(auth)
            assert subs["total"] == 2
            filenames = {s["filename"] for s in subs["items"]}
            assert filenames == {"from_chrome.jpg", "from_firefox.jpg"}

    finally:
        async with test_engine.begin() as conn:
            await conn.execute(text("TRUNCATE tasks, submissions, star_aliases, star_catalog CASCADE"))
        app.dependency_overrides.clear()
        await test_engine.dispose()


# ─── S10: No auth and no anon header → 401 ───────────────────────────────────

@pytest.mark.asyncio
async def test_s10_no_identity_rejected(real_storage):
    """Request without JWT and without X-Anonymous-Id gets 401."""
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    try:
        # Don't override get_user_id — use the real dependency
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_storage] = lambda: real_storage
        # Remove any get_user_id override so real dependency runs
        app.dependency_overrides.pop(get_user_id, None)
        app.dependency_overrides.pop(get_current_user, None)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # No Authorization, no X-Anonymous-Id
            resp = await client.get("/submissions")
            assert resp.status_code == 401

    finally:
        app.dependency_overrides.clear()
        await test_engine.dispose()


# ─── S11: Invalid anonymous ID format → 400 ──────────────────────────────────

@pytest.mark.asyncio
async def test_s11_invalid_anon_id_rejected(real_storage):
    """Malformed X-Anonymous-Id (not UUID) returns 400, not accepted."""
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    try:
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_storage] = lambda: real_storage
        app.dependency_overrides.pop(get_user_id, None)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Path traversal attempt
            resp1 = await client.get("/submissions", headers={"X-Anonymous-Id": "../../etc/passwd"})
            assert resp1.status_code == 400

            # SQL-like injection
            resp2 = await client.get("/submissions", headers={"X-Anonymous-Id": "'; DROP TABLE submissions;--"})
            assert resp2.status_code == 400

            # Empty string
            resp3 = await client.get("/submissions", headers={"X-Anonymous-Id": ""})
            assert resp3.status_code == 401  # empty header treated as missing

            # Valid UUID works
            resp4 = await client.get("/submissions", headers={"X-Anonymous-Id": "11111111-1111-4111-a111-111111111111"})
            assert resp4.status_code == 200

    finally:
        app.dependency_overrides.clear()
        await test_engine.dispose()
