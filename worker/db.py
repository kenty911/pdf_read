import os
import re

import pymysql
import pymysql.cursors


def _parse_url(url: str):
    """mysql+pymysql://user:pass@host:port/db → 接続パラメータ"""
    url = re.sub(r"^mysql\+pymysql://", "", url)
    m = re.match(r"(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:/]+)(?::(?P<port>\d+))?/(?P<db>.+)", url)
    if not m:
        raise ValueError(f"Invalid DATABASE_URL: {url}")
    return {
        "host": m.group("host"),
        "port": int(m.group("port") or 3306),
        "user": m.group("user"),
        "password": m.group("password"),
        "database": m.group("db"),
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
        "autocommit": False,
    }


def get_connection() -> pymysql.Connection:
    params = _parse_url(os.environ["DATABASE_URL"])
    return pymysql.connect(**params)


class JobDB:
    def __init__(self, conn: pymysql.Connection, job_id: str):
        self.conn = conn
        self.job_id = job_id

    def mark_processing(self) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status='processing', updated_at=NOW() WHERE id=%s",
                (self.job_id,),
            )
        self.conn.commit()

    def mark_completed(self, mp3_path: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status='completed', mp3_path=%s, updated_at=NOW() WHERE id=%s",
                (mp3_path, self.job_id),
            )
        self.conn.commit()

    def mark_failed(self, error: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status='failed', error_message=%s, updated_at=NOW() WHERE id=%s",
                (error[:65535], self.job_id),
            )
        self.conn.commit()

    def update_progress(self, current_line: int, total_lines: int | None = None) -> None:
        with self.conn.cursor() as cur:
            if total_lines is not None:
                cur.execute(
                    "UPDATE jobs SET current_line=%s, total_lines=%s, updated_at=NOW() WHERE id=%s",
                    (current_line, total_lines, self.job_id),
                )
            else:
                cur.execute(
                    "UPDATE jobs SET current_line=%s, updated_at=NOW() WHERE id=%s",
                    (current_line, self.job_id),
                )
        self.conn.commit()

    def get_pdf_path(self) -> str | None:
        with self.conn.cursor() as cur:
            cur.execute("SELECT pdf_path FROM jobs WHERE id=%s", (self.job_id,))
            row = cur.fetchone()
        return row["pdf_path"] if row else None
