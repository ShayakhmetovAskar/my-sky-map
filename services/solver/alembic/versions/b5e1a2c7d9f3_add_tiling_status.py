"""add tiling status to task_status and submission_status

Revision ID: b5e1a2c7d9f3
Revises: c2ff37466c44
Create Date: 2026-09-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b5e1a2c7d9f3'
down_revision: Union[str, Sequence[str], None] = 'c2ff37466c44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add the `tiling` label (APO-79: HiPS tiling step after solve).

    ADD VALUE is not allowed inside a transaction block on PostgreSQL < 12, hence the
    autocommit block. IF NOT EXISTS keeps the migration idempotent next to the worker
    migration (APO-83) that adds the same label.
    """
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'tiling' AFTER 'processing'")
        op.execute("ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'tiling' AFTER 'processing'")


def downgrade() -> None:
    """PostgreSQL cannot drop a label from an enum type; the extra label is harmless."""
    pass
