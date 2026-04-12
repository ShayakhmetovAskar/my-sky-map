"""add user_settings table

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
    op.create_table('user_settings',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('astrometry_api_key', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('user_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user_settings')
