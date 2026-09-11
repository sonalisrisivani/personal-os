"""create job applications and reminders tables

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-11 17:35:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "job_applications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="applied"),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("job_url", sa.String(), nullable=True),
        sa.Column("salary_range", sa.String(), nullable=True),
        sa.Column("applied_at", sa.Date(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("source", sa.String(), nullable=False, server_default="manual"),
        sa.Column("external_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_job_applications_external_id"), "job_applications", ["external_id"], unique=True)

    op.create_table(
        "application_reminders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("application_id", sa.UUID(), nullable=False),
        sa.Column("reminder_type", sa.String(), nullable=False, server_default="follow_up"),
        sa.Column("due_date", sa.DateTime(), nullable=False),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["job_applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("application_reminders")
    op.drop_index(op.f("ix_job_applications_external_id"), table_name="job_applications")
    op.drop_table("job_applications")
