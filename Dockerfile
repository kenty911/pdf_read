# Stage 1: VoiceVox バイナリを直接ダウンロード（対話不要）
FROM debian:bookworm-slim AS voicevox-downloader

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# ONNX Runtime (CPU, Linux x64)
RUN mkdir -p /tmp/ort /voicevox/onnxruntime \
    && curl -fsSL \
      "https://github.com/VOICEVOX/onnxruntime-builder/releases/download/voicevox_onnxruntime-1.17.3/voicevox_onnxruntime-linux-x64-1.17.3.tgz" \
      | tar -xzf - --strip-components=1 -C /tmp/ort \
    && mv /tmp/ort/lib /voicevox/onnxruntime/lib

# Voice model (0.vvm のみ使用)
RUN mkdir -p /voicevox/models/vvms \
    && curl -fsSL \
      "https://github.com/VOICEVOX/voicevox_vvm/releases/download/0.16.2/0.vvm" \
      -o /voicevox/models/vvms/0.vvm

# OpenJTalk 辞書
RUN mkdir -p /voicevox/dict \
    && curl -fsSL \
      "https://downloads.sourceforge.net/project/open-jtalk/Dictionary/open_jtalk_dic-1.11/open_jtalk_dic_utf_8-1.11.tar.gz" \
      | tar -xzf - -C /voicevox/dict

# Stage 2: フロントエンドビルド
FROM node:20-slim AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 3: アプリケーション
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# VoiceVox バイナリをコピー
COPY --from=voicevox-downloader /voicevox /app/voicevox

# フロントエンドビルド成果物をコピー
COPY --from=frontend-builder /frontend/dist /app/static/dist

COPY app/        /app/app/
COPY migrations/ /app/migrations/
COPY templates/  /app/templates/
COPY wsgi.py     /app/wsgi.py

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--timeout", "120"]
