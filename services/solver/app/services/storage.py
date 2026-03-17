"""MinIO/S3 storage service — presigned URLs, file deletion."""


class StorageService:
    """Interface for S3-compatible object storage."""

    async def generate_presigned_upload_url(self, object_key: str, content_type: str) -> str:
        """Generate a presigned PUT URL for direct client upload."""
        raise NotImplementedError

    async def delete_object(self, object_key: str) -> None:
        """Delete an object from storage."""
        raise NotImplementedError

    async def object_exists(self, object_key: str) -> bool:
        """Check if an object exists in storage."""
        raise NotImplementedError
