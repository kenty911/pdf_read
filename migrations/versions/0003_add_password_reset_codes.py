"""add password_reset_codes

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-29

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if "password_reset_codes" not in tables:
        op.create_table(
            "password_reset_codes",
            sa.Column("email", sa.String(255), primary_key=True),
            sa.Column("code", sa.String(6), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime()),
        )


def downgrade():
    op.drop_table("password_reset_codes")
