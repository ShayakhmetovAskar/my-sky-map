"""Message queue service — publish tasks to RabbitMQ via aio-pika."""

import json
import logging
from typing import Optional
from uuid import UUID

import aio_pika

from ..config import settings

logger = logging.getLogger(__name__)


class QueueService:
    def __init__(self):
        self._connection: Optional[aio_pika.abc.AbstractRobustConnection] = None
        self._channel: Optional[aio_pika.abc.AbstractChannel] = None

    async def _ensure_connected(self):
        if self._connection is None or self._connection.is_closed:
            url = f"amqp://{settings.rabbitmq_user}:{settings.rabbitmq_pass}@{settings.rabbitmq_host}:{settings.rabbitmq_port}/"
            self._connection = await aio_pika.connect_robust(url)
            self._channel = await self._connection.channel()
            await self._channel.declare_queue(settings.rabbitmq_queue, durable=True)
            logger.info("Connected to RabbitMQ at %s", settings.rabbitmq_host)

    async def publish_task(self, task_id: UUID, submission_id: UUID, object_key: str, options: Optional[dict] = None) -> None:
        """Publish a solver task to the processing queue."""
        await self._ensure_connected()

        message_body = json.dumps({
            "task_id": str(task_id),
            "submission_id": str(submission_id),
            "object_key": object_key,
            "options": options,
        })

        await self._channel.default_exchange.publish(
            aio_pika.Message(
                body=message_body.encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
            ),
            routing_key=settings.rabbitmq_queue,
        )
        logger.info("Published task %s to queue %s", task_id, settings.rabbitmq_queue)

    async def cancel_task(self, task_id: UUID) -> None:
        """Publish cancellation request to the queue."""
        await self._ensure_connected()

        message_body = json.dumps({
            "task_id": str(task_id),
            "action": "cancel",
        })

        await self._channel.default_exchange.publish(
            aio_pika.Message(
                body=message_body.encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
            ),
            routing_key=settings.rabbitmq_queue,
        )
        logger.info("Published cancel for task %s", task_id)

    async def close(self):
        if self._connection and not self._connection.is_closed:
            await self._connection.close()
            logger.info("RabbitMQ connection closed")
