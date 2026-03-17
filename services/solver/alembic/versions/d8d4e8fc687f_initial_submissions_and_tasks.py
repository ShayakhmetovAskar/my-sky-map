"""initial: submissions and tasks

Revision ID: d8d4e8fc687f
Revises:
Create Date: 2026-03-17 04:07:19.958791

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON


revision: str = 'd8d4e8fc687f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    submission_status = sa.Enum(
        "pending", "uploaded", "processing", "completed", "failed",
        name="submission_status",
    )
    task_status = sa.Enum(
        "pending", "processing", "completed", "failed", "cancelled",
        name="task_status",
    )

    op.create_table(
        "submissions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String, nullable=False, index=True),
        sa.Column("status", submission_status, nullable=False, server_default="pending"),
        sa.Column("filename", sa.String, nullable=False),
        sa.Column("content_type", sa.String, nullable=False),
        sa.Column("file_size_bytes", sa.Integer, nullable=False),
        sa.Column("object_key", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "tasks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", UUID(as_uuid=True), sa.ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String, nullable=False, index=True),
        sa.Column("status", task_status, nullable=False, server_default="pending"),
        sa.Column("options", JSON, nullable=True),
        sa.Column("result", JSON, nullable=True),
        sa.Column("error_code", sa.String, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("tasks")
    op.drop_table("submissions")
    sa.Enum(name="task_status").drop(op.get_bind())
    sa.Enum(name="submission_status").drop(op.get_bind())
