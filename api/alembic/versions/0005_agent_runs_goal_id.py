"""add goal_id to agent_runs

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-12 02:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('agent_runs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('goal_id', sa.UUID(), nullable=True))
        batch_op.alter_column('project_id', existing_type=sa.UUID(), nullable=True)
        batch_op.create_foreign_key('fk_agent_runs_goal_id_goals', 'goals', ['goal_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('agent_runs', schema=None) as batch_op:
        batch_op.drop_constraint('fk_agent_runs_goal_id_goals', type_='foreignkey')
        batch_op.alter_column('project_id', existing_type=sa.UUID(), nullable=False)
        batch_op.drop_column('goal_id')
