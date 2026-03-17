"""Message queue service — publish tasks to RabbitMQ."""

from typing import Optional
from uuid import UUID


class QueueService:
    """Interface for publishing solver tasks to the message queue."""

    async def publish_task(self, task_id: UUID, submission_id: UUID, object_key: str, options: Optional[dict] = None) -> None:
        """Publish a solver task to the processing queue."""
        raise NotImplementedError

    async def cancel_task(self, task_id: UUID) -> None:
        """Request cancellation of a queued/running task."""
        raise NotImplementedError
