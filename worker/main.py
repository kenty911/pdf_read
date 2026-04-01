#!/usr/bin/env python3
"""K8s Job エントリポイント。JOB_ID 環境変数を読んで変換を実行し終了する。"""
import logging
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def main() -> int:
    job_id = os.environ.get("JOB_ID")
    if not job_id:
        logger.error("JOB_ID 環境変数が設定されていません")
        return 1

    from converter import run_conversion
    from db import JobDB, get_connection

    conn = get_connection()
    job_db = JobDB(conn, job_id)

    try:
        job_db.mark_processing()
        mp3_path = run_conversion(job_id, job_db)
        job_db.mark_completed(mp3_path)
        logger.info(f"Job 完了: {job_id}")
        return 0
    except Exception as e:
        logger.exception(f"Job 失敗: {job_id}")
        try:
            job_db.mark_failed(str(e))
        except Exception:
            pass
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
