"""add astrometry_api_keys table

Stores each user's astrometry.net API key in a dedicated table so the
plaintext secret lives in exactly one place and can be encrypted later
without touching other code paths. The worker looks up the key by
user_id at task-pickup time and never persists it anywhere else.

Revision ID: a1b2c3d4e5f6
Revises: c2ff37466c44
Create Date: 2026-04-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c2ff37466c44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('astrometry_api_keys',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('api_key', sa.String(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint('user_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('astrometry_api_keys')
