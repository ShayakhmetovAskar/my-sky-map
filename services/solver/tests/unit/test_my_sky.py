"""Unit tests for GET /me/sky and the shared SkyImage schema."""

import json
from datetime import date, datetime, timezone
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models.db import Submission, Task
from app.schemas.sky import MySkyImage, SkyImage, default_title, format_dec_dm, format_ra_hm
from tests.unit.conftest import TEST_DB_URL, TEST_USER

FILENAME = "r_m15_seq_stacked_GraXpert.fits.png"
OTHER_USER = "other-user-999"
SECRET_BASE = "https://storage.yandexcloud.net/skymap-static-data/img/Qm3xK9pLa2Zt7VbN"

HIPS = {
    "kmax": 8,
    "tiles": 33,
    "moc": {"8": [198479, 198482, 198483], "7": [49619, 49620], "0": [3]},
    "base": SECRET_BASE,
    "thumb": f"{SECRET_BASE}/thumb.jpg",
}

# What the worker persists in tasks.result (object keys included: they must not leak).
CALIBRATION = {
    "center_ra": 322.5006928208016,
    "center_dec": 12.170153444689625,
    "field_of_view": 0.9342940374091998,
    "pixel_scale": 0.790666335806892,
    "orientation": 259.8079826946325,
    "corners": [[322.77323, 11.78662], [322.89376, 12.43637], [322.22822, 12.55385], [322.10882, 11.90358]],
    "width": 3008,
    "height": 3008,
    "original_image_key": f"users/{TEST_USER}/submissions/sub-1/input/original.png",
    "annotated_image_key": f"users/{TEST_USER}/submissions/sub-1/tasks/task-1/output/annotated.png",
    "wcs_key": f"users/{TEST_USER}/submissions/sub-1/tasks/task-1/output/wcs.fits",
    "mesh_json_key": f"users/{TEST_USER}/submissions/sub-1/tasks/task-1/output/mesh.json",
    "astrometry_job_url": "https://nova.astrometry.net/jobs/123",
}
READY_RESULT = {**CALIBRATION, "hips": HIPS}

UPLOADED_AT = datetime(2026, 9, 3, 12, 0, tzinfo=timezone.utc)


@pytest.fixture
async def db(client):
    """Direct DB session to seed solved tasks (the API never creates them). Rows are
    truncated by the `client` fixture teardown."""
    engine = create_async_engine(TEST_DB_URL, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


async def seed_task(
    db: AsyncSession,
    *,
    user_id: str = TEST_USER,
    status: str = "completed",
    result=READY_RESULT,
    filename: str = FILENAME,
    uploaded_at: datetime = UPLOADED_AT,
) -> str:
    submission = Submission(
        user_id=user_id,
        status="completed",
        filename=filename,
        content_type="image/png",
        file_size_bytes=1024,
        object_key=f"users/{user_id}/submissions/{uuid4()}/input/original.png",
        created_at=uploaded_at,
    )
    db.add(submission)
    await db.flush()
    task = Task(submission_id=submission.id, user_id=user_id, status=status, result=result, created_at=uploaded_at)
    db.add(task)
    await db.commit()
    return str(task.id)


class TestGetMySky:
    async def test_empty(self, client: AsyncClient):
        resp = await client.get("/me/sky")
        assert resp.status_code == 200
        assert resp.json() == {"images": []}

    async def test_ready_images(self, client: AsyncClient, db: AsyncSession):
        older = await seed_task(db)
        newer = await seed_task(db, filename="m27.jpg", uploaded_at=datetime(2026, 9, 5, 8, 0, tzinfo=timezone.utc))

        resp = await client.get("/me/sky")
        assert resp.status_code == 200
        images = resp.json()["images"]
        assert [img["id"] for img in images] == [newer, older]  # newest first

        assert images[1] == {
            "id": older,
            "title": "21h30m +12°10′ · 2026-09-03",
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
            "filename": FILENAME,
        }
        assert images[0]["date"] == "2026-09-05"
        assert images[0]["filename"] == "m27.jpg"

    async def test_thumb_derived_from_base(self, client: AsyncClient, db: AsyncSession):
        hips = {k: v for k, v in HIPS.items() if k != "thumb"}
        await seed_task(db, result={**CALIBRATION, "hips": hips})

        img = (await client.get("/me/sky")).json()["images"][0]
        assert img["thumb"] == f"{SECRET_BASE}/thumb.jpg"

    async def test_tiling_without_hips(self, client: AsyncClient, db: AsyncSession):
        task_id = await seed_task(db, status="tiling", result=CALIBRATION)

        images = (await client.get("/me/sky")).json()["images"]
        assert len(images) == 1
        img = images[0]
        assert img["id"] == task_id
        assert img["status"] == "tiling"
        assert img["title"] == "21h30m +12°10′ · 2026-09-03"
        assert img["ra"] == CALIBRATION["center_ra"]
        assert img["corners"] == CALIBRATION["corners"]
        assert {img[k] for k in ("kmax", "moc", "base", "thumb")} == {None}

    async def test_tiling_without_result_not_listed(self, client: AsyncClient, db: AsyncSession):
        """Calibration not persisted yet — nothing to place on the map."""
        await seed_task(db, status="tiling", result=None)

        assert (await client.get("/me/sky")).json()["images"] == []

    async def test_completed_without_hips_not_listed(self, client: AsyncClient, db: AsyncSession):
        await seed_task(db, result=CALIBRATION)
        await seed_task(db, result={**CALIBRATION, "hips_error": "wcs is broken"})
        await seed_task(db, result={**CALIBRATION, "hips": None})

        assert (await client.get("/me/sky")).json()["images"] == []

    @pytest.mark.parametrize("status", ["pending", "processing", "failed", "cancelled"])
    async def test_unsolved_statuses_not_listed(self, client: AsyncClient, db: AsyncSession, status):
        await seed_task(db, status=status)

        assert (await client.get("/me/sky")).json()["images"] == []

    async def test_user_isolation(self, client: AsyncClient, db: AsyncSession):
        from app.dependencies import get_current_user
        from app.main import app

        mine = await seed_task(db)
        theirs = await seed_task(db, user_id=OTHER_USER, status="tiling", result=CALIBRATION)

        resp = await client.get("/me/sky")
        assert [img["id"] for img in resp.json()["images"]] == [mine]

        app.dependency_overrides[get_current_user] = lambda: OTHER_USER
        resp = await client.get("/me/sky")
        assert [img["id"] for img in resp.json()["images"]] == [theirs]

    async def test_no_private_fields(self, client: AsyncClient, db: AsyncSession):
        await seed_task(db)

        resp = await client.get("/me/sky")
        img = resp.json()["images"][0]
        private = {"user_id", "submission_id", "object_key", "filename"}

        # The shared schema is a strict whitelist: nothing private, no filename at all.
        assert set(SkyImage.model_fields) == {
            "id", "title", "date", "ra", "dec", "fov", "pixscale", "orientation", "kmax",
            "corners", "moc", "base", "thumb", "width", "height", "status",
        }
        assert set(SkyImage.model_fields).isdisjoint(private)
        public_view = SkyImage.model_validate(img).model_dump(mode="json")
        assert set(public_view) == set(SkyImage.model_fields)
        assert FILENAME not in json.dumps(public_view)
        assert FILENAME not in img["title"]

        # /me/sky adds only `filename` on top of the whitelist.
        assert set(img) == set(SkyImage.model_fields) | {"filename"}
        assert set(MySkyImage.model_fields) == set(SkyImage.model_fields) | {"filename"}
        body = resp.text
        for leak in ("user_id", "submission_id", "object_key", f"users/{TEST_USER}", "presigned", "astrometry"):
            assert leak not in body

    async def test_unauthorized(self, client: AsyncClient):
        from app.dependencies import get_current_user
        from app.main import app
        from httpx import ASGITransport

        app.dependency_overrides.pop(get_current_user, None)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as raw:
            resp = await raw.get("/me/sky")
            assert resp.status_code in (401, 403)


class TestDefaultTitle:
    @pytest.mark.parametrize("ra, expected", [
        (0.0, "00h00m"),
        (322.5, "21h30m"),
        (83.857, "05h35m"),
        (14.9999, "01h00m"),      # 59.9996 min rounds up and carries into the hour
        (359.999, "00h00m"),      # wraps at 24h
    ])
    def test_format_ra(self, ra, expected):
        assert format_ra_hm(ra) == expected

    @pytest.mark.parametrize("dec, expected", [
        (0.0, "+00°00′"),
        (12.17, "+12°10′"),
        (-5.411, "-05°25′"),
        (-0.5, "-00°30′"),
        (41.9999, "+42°00′"),     # carries into the degree
        (89.9999, "+90°00′"),     # clamped at the pole
        (-90.0, "-90°00′"),
    ])
    def test_format_dec(self, dec, expected):
        assert format_dec_dm(dec) == expected

    def test_default_title(self):
        assert default_title(322.5006928, 12.1701534, date(2026, 9, 3)) == "21h30m +12°10′ · 2026-09-03"
