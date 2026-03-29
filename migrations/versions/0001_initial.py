"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if "jobs" not in tables:
        op.create_table(
            "jobs",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("user_id", sa.String(36), nullable=False),
            sa.Column(
                "status",
                sa.Enum("processing", "completed", "failed"),
                nullable=False,
            ),
            sa.Column("original_filename", sa.String(255)),
            sa.Column("pdf_path", sa.String(512)),
            sa.Column("mp3_path", sa.String(512)),
            sa.Column("error_message", sa.Text()),
            sa.Column("created_at", sa.DateTime()),
            sa.Column("updated_at", sa.DateTime()),
        )
        op.create_index("ix_jobs_user_id", "jobs", ["user_id"])
    else:
        # 既存インストール: 不足カラムを追加
        columns = {c["name"] for c in inspector.get_columns("jobs")}
        if "original_filename" not in columns:
            op.add_column("jobs", sa.Column("original_filename", sa.String(255)))


def downgrade():
    op.drop_table("jobs")
