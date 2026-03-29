# Stage 1: VoiceVox バイナリをダウンロード
# expect で疑似TTYを作成し、ライセンス同意プロンプトを自動応答する
FROM python:3.12-slim AS voicevox-downloader
RUN apt-get update && apt-get install -y --no-install-recommends curl expect \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /voicevox
RUN curl -sSfL \
    "https://github.com/VOICEVOX/voicevox_core/releases/download/0.16.2/download-linux-x64" \
    -o download \
    && chmod +x download
RUN expect -c '
  set timeout 300
  spawn ./download -o ./assets --exclude c-api
  expect {
    -re {\[y,n,r\]} { send "y\r"; exp_continue }
    eof
  }
  wait
'

# Stage 2: アプリケーション
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml ./
RUN uv sync --no-dev

# VoiceVox バイナリをコピー
COPY --from=voicevox-downloader /voicevox/assets /app/voicevox/

COPY app/       /app/app/
COPY templates/ /app/templates/
COPY static/    /app/static/
COPY wsgi.py    /app/wsgi.py

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--timeout", "120"]
