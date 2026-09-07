"""add 'tiling' to task_status and submission_status

The worker moves a task (and its submission) to `tiling` after the solve while it cuts
the image into HiPS tiles (APO-83); the frontend shows a "Building your sky" state.

Revision ID: 4f7c1e2a9b3d
Revises: c2ff37466c44
Create Date: 2026-09-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '4f7c1e2a9b3d'
down_revision: Union[str, Sequence[str], None] = 'c2ff37466c44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_ENUMS = (
    # (type name, table, values without 'tiling')
    ("task_status", "tasks", ("pending", "processing", "completed", "failed", "cancelled")),
    ("submission_status", "submissions", ("pending", "uploaded", "processing", "completed", "failed")),
)


def upgrade() -> None:
    """Upgrade schema."""
    # ADD VALUE must not run inside the migration transaction (Postgres < 12 refuses,
    # >= 12 forbids using the value before commit), hence the autocommit block.
    with op.get_context().autocommit_block():
        for type_name, _, _ in _ENUMS:
            op.execute(f"ALTER TYPE {type_name} ADD VALUE IF NOT EXISTS 'tiling' AFTER 'processing'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres cannot drop an enum value: map rows back and rebuild each type.
    for type_name, table, values in _ENUMS:
        op.execute(f"UPDATE {table} SET status = 'processing' WHERE status = 'tiling'")
        op.execute(f"ALTER TYPE {type_name} RENAME TO {type_name}_old")
        quoted = ", ".join(f"'{v}'" for v in values)
        op.execute(f"CREATE TYPE {type_name} AS ENUM ({quoted})")
        op.execute(f"ALTER TABLE {table} ALTER COLUMN status DROP DEFAULT")
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN status TYPE {type_name} "
            f"USING status::text::{type_name}"
        )
        op.execute(f"ALTER TABLE {table} ALTER COLUMN status SET DEFAULT 'pending'")
        op.execute(f"DROP TYPE {type_name}_old")
