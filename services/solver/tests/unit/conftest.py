"""Unit test fixtures — mocked services, real DB schema via Alembic."""

import os

import pytest
from unittest.mock import MagicMock

from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.dependencies import get_current_user, get_db, get_storage
from app.main import app
from app.services.storage import StorageService

TEST_USER = "test-user-001"
TEST_DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://skymap_user:skymap_password@localhost:5433/skymap_test",
)


# --- Alembic migrations (once per session) ---

@pytest.fixture(scope="session", autouse=True)
def apply_migrations():
    sync_url = TEST_DB_URL.replace("+asyncpg", "")
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", sync_url)
    command.upgrade(cfg, "head")
    yield
    command.downgrade(cfg, "base")


# --- Mock storage (shared) ---

@pytest.fixture
def mock_storage():
    storage = MagicMock(spec=StorageService)
    storage.generate_presigned_upload_url.return_value = "http://test-minio/presigned-upload"
    storage.generate_presigned_download_url.return_value = "http://test-minio/presigned-download"
    storage.delete_object.return_value = None
    storage.upload_file.return_value = None
    storage.download_object.return_value = None
    storage.object_exists.return_value = True
    return storage


# --- HTTP client (creates fresh engine per test) ---

@pytest.fixture
async def client(mock_storage):
    """HTTP client with all dependencies overridden. Fresh DB engine per test."""
    test_engine = create_async_engine(TEST_DB_URL, echo=False)
    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    app.dependency_overrides[get_storage] = lambda: mock_storage

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": "Bearer test-token"},
    ) as ac:
        yield ac

    # Cleanup
    async with test_engine.begin() as conn:
        await conn.execute(text("TRUNCATE tasks, submissions, user_settings, star_aliases, star_catalog CASCADE"))

    app.dependency_overrides.clear()
    await test_engine.dispose()




