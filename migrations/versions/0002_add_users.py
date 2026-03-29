"""add users and pending_registrations

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-29

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if "users" not in tables:
        op.create_table(
            "users",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("password_hash", sa.String(255), nullable=False),
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime()),
        )
        op.create_index("ix_users_email", "users", ["email"], unique=True)

    if "pending_registrations" not in tables:
        op.create_table(
            "pending_registrations",
            sa.Column("email", sa.String(255), primary_key=True),
            sa.Column("password_hash", sa.String(255), nullable=False),
            sa.Column("code", sa.String(6), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime()),
        )


def downgrade():
    op.drop_table("pending_registrations")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
