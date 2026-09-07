"""MinIO/S3 storage service — presigned URLs, file operations."""

import logging
from datetime import timedelta
from typing import List

from minio import Minio
from minio.deleteobjects import DeleteObject
from minio.error import S3Error

from ..config import settings

logger = logging.getLogger(__name__)


class StorageError(Exception):
    """Raised when a bulk operation on the private bucket did not fully succeed."""


class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self.bucket = settings.minio_bucket

    def _ensure_bucket(self):
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)
            logger.info("Created bucket: %s", self.bucket)

    def generate_presigned_upload_url(self, object_key: str, content_type: str) -> str:
        """Generate a presigned PUT URL for direct client upload."""
        self._ensure_bucket()
        return self.client.presigned_put_object(
            self.bucket,
            object_key,
            expires=timedelta(hours=1),
        )

    def generate_presigned_download_url(self, object_key: str) -> str:
        """Generate a presigned GET URL for client download."""
        return self.client.presigned_get_object(
            self.bucket,
            object_key,
            expires=timedelta(hours=1),
        )

    def download_object(self, object_key: str, local_path: str) -> None:
        """Download an object from storage to local file."""
        self.client.fget_object(self.bucket, object_key, local_path)

    def upload_file(self, object_key: str, local_path: str, content_type: str = "application/octet-stream") -> None:
        """Upload a local file to storage."""
        self._ensure_bucket()
        self.client.fput_object(self.bucket, object_key, local_path, content_type=content_type)

    def delete_object(self, object_key: str) -> None:
        """Delete an object from storage."""
        try:
            self.client.remove_object(self.bucket, object_key)
        except S3Error as e:
            logger.warning("Failed to delete %s: %s", object_key, e)

    def list_prefix(self, prefix: str) -> List[str]:
        """All object keys under ``prefix/`` (recursive).

        The trailing slash matters: ``users/u/submissions/1`` must not also match
        ``users/u/submissions/1a``.
        """
        prefix = prefix.strip("/")
        prefix = prefix + "/" if prefix else ""
        return [
            obj.object_name
            for obj in self.client.list_objects(self.bucket, prefix=prefix, recursive=True)
        ]

    def delete_prefix(self, prefix: str) -> int:
        """Delete every object under ``prefix/``; return how many were removed.

        Unlike :meth:`delete_object` this raises instead of logging: it is used to
        purge a submission before its row is committed away, and a caller that
        cannot see the failure would drop the only pointer to those objects.
        """
        keys = self.list_prefix(prefix)
        if not keys:
            return 0
        errors = list(self.client.remove_objects(self.bucket, [DeleteObject(k) for k in keys]))
        if errors:
            first = errors[0]
            raise StorageError(
                f"failed to delete {len(errors)} of {len(keys)} objects under {prefix}: "
                f"{getattr(first, 'name', '?')}: {getattr(first, 'message', first)}"
            )
        return len(keys)

    def object_exists(self, object_key: str) -> bool:
        """Check if an object exists in storage."""
        try:
            self.client.stat_object(self.bucket, object_key)
            return True
        except S3Error:
            return False
