"""Storage client for the PUBLIC bucket that serves per-image HiPS tiles (APO-81).

Separate from ``StorageService`` (private ``solver-data`` bucket, presigned URLs):
this bucket is read anonymously through a CDN, only ``s3:GetObject`` on ``img/*`` is
allowed to the public, and the worker writes with its own revocable key (``HIPS_*``).

Object layout (see docs/hips-storage.md):
    img/{image_secret}/Norder{k}/Npix{p}.png
    img/{image_secret}/thumb.jpg
"""

from __future__ import annotations

import io
import logging
from typing import List, Optional

from minio import Minio
from minio.commonconfig import CopySource
from minio.deleteobjects import DeleteObject

from ..config import settings

logger = logging.getLogger(__name__)

# Tiles are re-addressable (the secret rotates on unshare / delete), so never `immutable`.
TILE_CACHE_CONTROL = "public, max-age=86400"


class HipsStorageError(Exception):
    """Raised when a bulk operation on the public bucket did not fully succeed."""


def _prefix(prefix: str) -> str:
    """Normalise a key prefix to a directory-like ``a/b/`` form.

    The trailing slash matters: ``img/abc`` must never match ``img/abcdef`` —
    secrets are random strings and one may well be a prefix of another.
    """
    prefix = prefix.strip("/")
    return prefix + "/" if prefix else ""


class HipsStorage:
    def __init__(self, client: Optional[Minio] = None):
        self.client = client or Minio(
            settings.hips_endpoint,
            access_key=settings.hips_access_key,
            secret_key=settings.hips_secret_key,
            secure=settings.hips_secure,
        )
        self.bucket = settings.hips_bucket
        self.public_base_url = settings.hips_public_base_url.rstrip("/")

    def upload_bytes(self, key: str, data: bytes, content_type: str,
                     cache_control: Optional[str] = TILE_CACHE_CONTROL) -> None:
        """Upload an in-memory object. ``Cache-Control`` is stored as a response header."""
        metadata = {"Cache-Control": cache_control} if cache_control else None
        self.client.put_object(
            self.bucket, key, io.BytesIO(data), len(data),
            content_type=content_type, metadata=metadata,
        )

    def list_prefix(self, prefix: str) -> List[str]:
        """All object keys under ``prefix/`` (recursive)."""
        return [
            obj.object_name
            for obj in self.client.list_objects(self.bucket, prefix=_prefix(prefix), recursive=True)
        ]

    def delete_prefix(self, prefix: str) -> int:
        """Delete every object under ``prefix/``. Returns the number of objects removed."""
        keys = self.list_prefix(prefix)
        if not keys:
            return 0
        errors = list(self.client.remove_objects(self.bucket, [DeleteObject(k) for k in keys]))
        if errors:
            first = errors[0]
            raise HipsStorageError(
                f"failed to delete {len(errors)} of {len(keys)} objects under {_prefix(prefix)}: "
                f"{getattr(first, 'name', '?')}: {getattr(first, 'message', first)}"
            )
        return len(keys)

    def copy_prefix(self, src: str, dst: str) -> int:
        """Server-side copy of every object under ``src/`` to the same path under ``dst/``.

        Object metadata (content type, ``Cache-Control``) is carried over.
        Returns the number of objects copied.
        """
        src_p, dst_p = _prefix(src), _prefix(dst)
        keys = self.list_prefix(src)
        for key in keys:
            self.client.copy_object(self.bucket, dst_p + key[len(src_p):], CopySource(self.bucket, key))
        return len(keys)
