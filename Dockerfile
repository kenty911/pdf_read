FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml ./
RUN uv sync --no-dev

COPY app/       /app/app/
COPY templates/ /app/templates/
COPY static/    /app/static/
COPY wsgi.py    /app/wsgi.py

ENV PATH="/app/.venv/bin:$PATH"

# VoiceVox バイナリは hostPath volume でマウント
# k8s: /data/voicevox → /app/voicevox
# ローカル開発: docker-compose の volumes で同様にマウント

EXPOSE 8000

CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--timeout", "120"]
