"""empty message

Revision ID: 7a9339458285
Revises: 43f7a23c7994, 59c148e1195a
Create Date: 2025-10-26 00:43:38.256874

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a9339458285'
down_revision: Union[str, Sequence[str], None] = ('43f7a23c7994', '59c148e1195a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
