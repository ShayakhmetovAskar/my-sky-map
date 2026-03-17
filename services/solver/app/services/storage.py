"""MinIO/S3 storage service — presigned URLs, file operations."""

import logging
from datetime import timedelta

from minio import Minio
from minio.error import S3Error

from ..config import settings

logger = logging.getLogger(__name__)


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

    def _externalize_url(self, url: str) -> str:
        """Replace internal MinIO hostname with external endpoint for client access."""
        ext = settings.minio_external_endpoint
        if ext and ext != settings.minio_endpoint:
            return url.replace(
                f"http://{settings.minio_endpoint}",
                f"http://{ext}",
                1,
            )
        return url

    def generate_presigned_upload_url(self, object_key: str, content_type: str) -> str:
        """Generate a presigned PUT URL for direct client upload."""
        self._ensure_bucket()
        url = self.client.presigned_put_object(
            self.bucket,
            object_key,
            expires=timedelta(hours=1),
        )
        return self._externalize_url(url)

    def generate_presigned_download_url(self, object_key: str) -> str:
        """Generate a presigned GET URL for client download."""
        url = self.client.presigned_get_object(
            self.bucket,
            object_key,
            expires=timedelta(hours=1),
        )
        return self._externalize_url(url)

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

    def object_exists(self, object_key: str) -> bool:
        """Check if an object exists in storage."""
        try:
            self.client.stat_object(self.bucket, object_key)
            return True
        except S3Error:
            return False
