"""add collections and collection_items tables

Revision ID: a7e3c1d94b52
Revises: c2ff37466c44
Create Date: 2026-09-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'a7e3c1d94b52'
down_revision: Union[str, Sequence[str], None] = 'c2ff37466c44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "collections",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(80), nullable=False),
        sa.Column("share_token", sa.String(32), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_collections_user_id", "collections", ["user_id"])
    op.create_index(
        "uq_collections_share_token",
        "collections",
        ["share_token"],
        unique=True,
        postgresql_where=sa.text("share_token IS NOT NULL"),
    )

    op.create_table(
        "collection_items",
        sa.Column(
            "collection_id",
            UUID(as_uuid=True),
            sa.ForeignKey("collections.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "task_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
    )
    op.create_index("ix_collection_items_task_id", "collection_items", ["task_id"])


def downgrade() -> None:
    op.drop_index("ix_collection_items_task_id", table_name="collection_items")
    op.drop_table("collection_items")
    op.drop_index("uq_collections_share_token", table_name="collections")
    op.drop_index("ix_collections_user_id", table_name="collections")
    op.drop_table("collections")
