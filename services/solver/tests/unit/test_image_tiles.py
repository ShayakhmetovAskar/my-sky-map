"""Unit tests for app/services/image_tiles.py — secret rotation (APO-87, design §5).

"Stop sharing" (APO-92) and account deletion (APO-93) revoke a tile URL by moving the
image to a fresh secret: copy the prefix, drop the old one, publish the new `base`.
Storage is mocked; the database is real, because the whole point is what `result.hips`
looks like afterwards.
"""

from __future__ import annotations

from uuid import UUID, uuid4

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.db import Submission, Task
from app.services.hips_storage import HipsStorageError
from app.services.image_tiles import (
    hips_base,
    hips_pending_base,
    new_image_secret,
    redact_secrets,
    rotate_image_secret,
    submission_prefix,
    tile_bases,
    tile_prefix,
)

PUBLIC = "http://localhost:9000/skymap-static-data"
SECRET = "Ck7dQvJm2pR4sT6uV8wXyZ"
BASE = f"{PUBLIC}/img/{SECRET}"


class TestPureHelpers:
    def test_new_secret_is_128_bit_urlsafe(self):
        secret = new_image_secret()
        assert len(secret) == 22 and secret != new_image_secret()

    @pytest.mark.parametrize("base, expected", [
        (BASE, f"img/{SECRET}"),
        (BASE + "/", f"img/{SECRET}"),
        (f"img/{SECRET}", f"img/{SECRET}"),                      # already a key prefix
        (f"https://storage.yandexcloud.net/bucket/img/{SECRET}", f"img/{SECRET}"),
        (f"{PUBLIC}/img/{SECRET}/Norder0/Npix3.png", None),      # a tile, not a base
        ("http://localhost:9000/skymap-static-data/dss/v1", None),
        ("", None),
        (None, None),
        (42, None),
    ])
    def test_tile_prefix(self, base, expected):
        assert tile_prefix(base) == expected

    def test_hips_base_tolerates_every_shape_of_result(self):
        assert hips_base({"hips": {"base": BASE}}) == BASE
        assert hips_base({"hips_error": "no WCS"}) is None
        assert hips_base({"hips": {"kmax": 6}}) is None
        assert hips_base({"hips": "nonsense"}) is None
        assert hips_base(None) is None

    def test_hips_pending_base_is_the_prefix_a_tiling_task_is_writing(self):
        pending = f"{PUBLIC}/img/PendingSecret12345678"
        assert hips_pending_base({"hips_pending": pending}) == pending
        assert hips_pending_base({"hips": {"base": BASE}}) is None
        assert hips_pending_base({"hips_pending": 42}) is None
        assert hips_pending_base(None) is None

    def test_tile_bases_covers_the_finished_and_the_in_flight_pyramid(self):
        """A purge that only looked at `hips.base` would miss a task mid-tiling."""
        pending = f"{PUBLIC}/img/PendingSecret12345678"
        assert tile_bases({"hips": {"base": BASE}}) == [BASE]
        assert tile_bases({"hips_pending": pending}) == [pending]
        # a re-solve can carry both: the old pyramid and the one being written
        assert tile_bases({"hips": {"base": BASE}, "hips_pending": pending}) == [BASE, pending]
        assert tile_bases({"hips_error": "no WCS"}) == []
        assert tile_bases(None) == []

    def test_submission_prefix_has_no_trailing_slash(self):
        sid = uuid4()
        assert submission_prefix("user-1", sid) == f"users/user-1/submissions/{sid}"

    def test_redact_secrets_blanks_the_capability(self):
        message = f"failed to delete img/{SECRET}/thumb.jpg"
        assert SECRET not in redact_secrets(message)
        assert redact_secrets(message) == "failed to delete img/***/thumb.jpg"


@pytest.fixture
async def sessions():
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    yield factory
    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE tasks, submissions CASCADE"))
    await engine.dispose()


async def _seed(factory, result) -> UUID:
    task_id, sub_id = uuid4(), uuid4()
    async with factory() as db:
        db.add(Submission(
            id=sub_id, user_id="rotate-user", status="completed", filename="orion.jpg",
            content_type="image/jpeg", file_size_bytes=1,
            object_key=f"users/rotate-user/submissions/{sub_id}/input/original.jpg",
        ))
        db.add(Task(id=task_id, submission_id=sub_id, user_id="rotate-user",
                    status="completed", result=result))
        await db.commit()
    return task_id


async def _result(factory, task_id: UUID) -> dict:
    async with factory() as db:
        return (await db.execute(select(Task.result).where(Task.id == task_id))).scalar_one()


def _solved(base: str = BASE) -> dict:
    return {
        "calibration": {"pixscale": 1.6},
        "hips": {"kmax": 8, "tiles": 87, "moc": {"0": [3]},
                 "base": base, "thumb": f"{base}/thumb.jpg"},
    }


class TestRotateImageSecret:
    async def test_moves_the_prefix_and_republishes_the_base(self, sessions, mock_hips_storage):
        task_id = await _seed(sessions, _solved())

        new_base = await rotate_image_secret(
            task_id, hips_storage=mock_hips_storage, session_factory=sessions)

        old_prefix = f"img/{SECRET}"
        new_prefix = tile_prefix(new_base)
        assert new_prefix and new_prefix != old_prefix
        assert new_base == f"{PUBLIC}/{new_prefix}"            # same host and bucket

        # Copy first, then drop the old prefix: the revoked URL must stop resolving.
        assert [c[0] for c in mock_hips_storage.mock_calls] == ["copy_prefix", "delete_prefix"]
        mock_hips_storage.copy_prefix.assert_called_once_with(old_prefix, new_prefix)
        mock_hips_storage.delete_prefix.assert_called_once_with(old_prefix)

        stored = await _result(sessions, task_id)
        assert stored["hips"]["base"] == new_base
        assert stored["hips"]["thumb"] == f"{new_base}/thumb.jpg"
        assert SECRET not in str(stored)
        assert stored["hips"]["moc"] == {"0": [3]} and stored["calibration"] == {"pixscale": 1.6}

    async def test_is_a_noop_without_a_sky_layer(self, sessions, mock_hips_storage):
        for result in ({"hips_error": "solver returned no WCS file"}, None):
            task_id = await _seed(sessions, result)
            assert await rotate_image_secret(
                task_id, hips_storage=mock_hips_storage, session_factory=sessions) is None
        mock_hips_storage.copy_prefix.assert_not_called()
        mock_hips_storage.delete_prefix.assert_not_called()

    async def test_is_a_noop_for_a_task_that_is_gone(self, sessions, mock_hips_storage):
        assert await rotate_image_secret(
            uuid4(), hips_storage=mock_hips_storage, session_factory=sessions) is None
        mock_hips_storage.copy_prefix.assert_not_called()

    async def test_copy_failure_keeps_the_base_and_clears_the_partial_copy(self, sessions,
                                                                          mock_hips_storage):
        task_id = await _seed(sessions, _solved())
        mock_hips_storage.copy_prefix.side_effect = HipsStorageError("connection refused")

        assert await rotate_image_secret(
            task_id, hips_storage=mock_hips_storage, session_factory=sessions) is None

        # Whatever the copy managed to write is orphaned — it gets swept up.
        swept = mock_hips_storage.delete_prefix.call_args.args[0]
        assert swept != f"img/{SECRET}" and swept.startswith("img/")
        assert (await _result(sessions, task_id))["hips"]["base"] == BASE

    async def test_failure_to_drop_the_old_prefix_rolls_the_copy_back(self, sessions,
                                                                     mock_hips_storage):
        task_id = await _seed(sessions, _solved())
        old_prefix = f"img/{SECRET}"

        def refuse_the_old_one(prefix):
            if prefix == old_prefix:
                raise HipsStorageError(f"failed to delete 1 of 40 objects under {old_prefix}/")
            return 40

        mock_hips_storage.delete_prefix.side_effect = refuse_the_old_one

        assert await rotate_image_secret(
            task_id, hips_storage=mock_hips_storage, session_factory=sessions) is None

        # The base still points at tiles that exist; the copy is not left behind.
        assert (await _result(sessions, task_id))["hips"]["base"] == BASE
        dropped = [c.args[0] for c in mock_hips_storage.delete_prefix.call_args_list]
        assert dropped == [old_prefix, tile_prefix(mock_hips_storage.copy_prefix.call_args.args[1])]

    async def test_rotating_twice_chains(self, sessions, mock_hips_storage):
        task_id = await _seed(sessions, _solved())

        first = await rotate_image_secret(
            task_id, hips_storage=mock_hips_storage, session_factory=sessions)
        second = await rotate_image_secret(
            task_id, hips_storage=mock_hips_storage, session_factory=sessions)

        assert second not in (None, first)
        assert mock_hips_storage.copy_prefix.call_args.args[0] == tile_prefix(first)
        assert (await _result(sessions, task_id))["hips"]["base"] == second
