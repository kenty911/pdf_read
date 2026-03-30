"""add progress columns to jobs

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-30

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {c["name"] for c in inspector.get_columns("jobs")}

    if "total_lines" not in columns:
        op.add_column("jobs", sa.Column("total_lines", sa.Integer()))
    if "current_line" not in columns:
        op.add_column("jobs", sa.Column("current_line", sa.Integer(), server_default="0"))


def downgrade():
    op.drop_column("jobs", "current_line")
    op.drop_column("jobs", "total_lines")
