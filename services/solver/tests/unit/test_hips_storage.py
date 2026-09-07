"""Unit tests for app/services/hips_storage.py — the public-bucket client (MinIO is mocked)."""

from unittest.mock import MagicMock

import pytest

from app.services.hips_storage import HipsStorage, HipsStorageError, TILE_CACHE_CONTROL


class FakeError:
    def __init__(self, name, message="denied"):
        self.name = name
        self.message = message


def make_storage(objects=()):
    client = MagicMock()
    client.list_objects.return_value = [MagicMock(object_name=name) for name in objects]
    client.remove_objects.return_value = iter(())
    return HipsStorage(client=client), client


class TestUpload:
    def test_upload_bytes_sets_cache_control(self):
        storage, client = make_storage()
        storage.upload_bytes("img/secret/Norder3/Npix193.png", b"\x89PNG...", "image/png")

        client.put_object.assert_called_once()
        args, kwargs = client.put_object.call_args
        bucket, key, stream, length = args
        assert bucket == storage.bucket
        assert key == "img/secret/Norder3/Npix193.png"
        assert length == len(b"\x89PNG...") and stream.read() == b"\x89PNG..."
        assert kwargs["content_type"] == "image/png"
        assert TILE_CACHE_CONTROL == "public, max-age=86400"
        assert kwargs["metadata"] == {"Cache-Control": TILE_CACHE_CONTROL}

    def test_upload_bytes_without_cache_control(self):
        storage, client = make_storage()
        storage.upload_bytes("img/s/thumb.jpg", b"jpg", "image/jpeg", cache_control=None)
        assert client.put_object.call_args.kwargs["metadata"] is None


class TestPrefixOperations:
    def test_list_prefix_is_recursive_and_slash_terminated(self):
        storage, client = make_storage(["img/abc/Norder0/Npix3.png", "img/abc/thumb.jpg"])
        assert storage.list_prefix("img/abc") == ["img/abc/Norder0/Npix3.png", "img/abc/thumb.jpg"]
        kwargs = client.list_objects.call_args.kwargs
        assert kwargs["prefix"] == "img/abc/"      # never "img/abc": would also match img/abcdef
        assert kwargs["recursive"] is True

    def test_delete_prefix(self):
        keys = ["img/abc/Norder0/Npix3.png", "img/abc/thumb.jpg"]
        storage, client = make_storage(keys)

        assert storage.delete_prefix("img/abc") == 2
        deleted = [d.name for d in client.remove_objects.call_args.args[1]]
        assert deleted == keys

    def test_delete_prefix_empty(self):
        storage, client = make_storage([])
        assert storage.delete_prefix("img/gone") == 0
        client.remove_objects.assert_not_called()

    def test_delete_prefix_reports_failures(self):
        storage, client = make_storage(["img/abc/thumb.jpg"])
        client.remove_objects.return_value = iter([FakeError("img/abc/thumb.jpg")])

        with pytest.raises(HipsStorageError, match="thumb.jpg"):
            storage.delete_prefix("img/abc")

    def test_copy_prefix_preserves_relative_paths(self):
        storage, client = make_storage(["img/old/Norder0/Npix3.png", "img/old/thumb.jpg"])

        assert storage.copy_prefix("img/old", "img/new") == 2
        targets = [call.args[1] for call in client.copy_object.call_args_list]
        assert targets == ["img/new/Norder0/Npix3.png", "img/new/thumb.jpg"]
        sources = [call.args[2] for call in client.copy_object.call_args_list]
        assert [s.object_name for s in sources] == ["img/old/Norder0/Npix3.png", "img/old/thumb.jpg"]
        assert all(s.bucket_name == storage.bucket for s in sources)

    def test_copy_prefix_empty(self):
        storage, client = make_storage([])
        assert storage.copy_prefix("img/old", "img/new") == 0
        client.copy_object.assert_not_called()
