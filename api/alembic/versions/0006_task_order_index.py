"""task order index

Revision ID: 0006_task_order_index
Revises: 0005_agent_runs_goal_id
Create Date: 2026-09-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006_task_order_index'
down_revision: Union[str, None] = '0005_agent_runs_goal_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('order_index', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('tasks', 'order_index')
