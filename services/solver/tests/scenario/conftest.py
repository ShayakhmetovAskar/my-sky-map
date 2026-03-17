"""Scenario test fixtures — real DB + real MinIO, mocked external clients only.

Paradigm: mock ONLY external clients (astrometry.net API).
DB is real Postgres, storage is real MinIO.
"""

import pytest
from unittest.mock import AsyncMock

from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.dependencies import get_current_user, get_db, get_storage
from app.main import app
from app.services.storage import StorageService
from worker.solvers.base import BaseSolver, SolveResult

TEST_USER = "scenario-user-001"
TEST_DB_URL = "postgresql+asyncpg://skymap_user:skymap_password@localhost:5433/skymap_test"

FAKE_CALIBRATION = SolveResult(
    center_ra=83.857,
    center_dec=-5.411,
    field_of_view=0.796,
    pixel_scale=1.595,
    orientation=340.6,
    num_stars_matched=47,
)


# --- Alembic (once per session) ---

@pytest.fixture(scope="session", autouse=True)
def apply_migrations():
    sync_url = TEST_DB_URL.replace("+asyncpg", "")
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", sync_url)
    command.upgrade(cfg, "head")
    yield
    command.downgrade(cfg, "base")


# --- Real storage (connects to MinIO from docker-compose) ---

@pytest.fixture
def real_storage():
    return StorageService()


# --- Mock solver (no real astrometry.net calls) ---

@pytest.fixture
def mock_solver():
    solver = AsyncMock(spec=BaseSolver)
    solver.solve.return_value = FAKE_CALIBRATION
    return solver


# --- HTTP client with real DB + real storage ---

@pytest.fixture
async def client(real_storage):
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    app.dependency_overrides[get_storage] = lambda: real_storage

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": "Bearer test-token"},
    ) as ac:
        yield ac

    # Cleanup
    async with test_engine.begin() as conn:
        await conn.execute(text("TRUNCATE tasks, submissions CASCADE"))

    app.dependency_overrides.clear()
    await test_engine.dispose()
