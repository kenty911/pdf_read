import os
from pathlib import Path


def _base_dir() -> Path:
    return Path(os.environ.get("DATA_DIR", "/data"))


def get_upload_path(job_id: str) -> Path:
    path = _base_dir() / "uploads" / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path / "input.pdf"


def get_output_path(job_id: str) -> Path:
    path = _base_dir() / "outputs" / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path / "output.mp3"


def get_batch_dir(job_id: str) -> Path:
    path = _base_dir() / "outputs" / job_id / "batches"
    path.mkdir(parents=True, exist_ok=True)
    return path
