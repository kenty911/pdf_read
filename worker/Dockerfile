# Stage 1: VoiceVox バイナリダウンロード
FROM debian:bookworm-slim AS voicevox-downloader

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /tmp/ort /voicevox/onnxruntime \
    && curl -fsSL \
      "https://github.com/VOICEVOX/onnxruntime-builder/releases/download/voicevox_onnxruntime-1.17.3/voicevox_onnxruntime-linux-x64-1.17.3.tgz" \
      | tar -xzf - --strip-components=1 -C /tmp/ort \
    && mv /tmp/ort/lib /voicevox/onnxruntime/lib

RUN mkdir -p /voicevox/models/vvms \
    && curl -fsSL \
      "https://github.com/VOICEVOX/voicevox_vvm/releases/download/0.16.2/0.vvm" \
      -o /voicevox/models/vvms/0.vvm

RUN mkdir -p /voicevox/dict \
    && curl -fsSL \
      "https://downloads.sourceforge.net/project/open-jtalk/Dictionary/open_jtalk_dic-1.11/open_jtalk_dic_utf_8-1.11.tar.gz" \
      | tar -xzf - -C /voicevox/dict

# Stage 2: アプリケーション
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY worker/pyproject.toml worker/uv.lock ./
RUN uv sync --frozen --no-dev

COPY --from=voicevox-downloader /voicevox /app/voicevox

COPY worker/main.py worker/converter.py worker/pdf_processor.py worker/db.py ./

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

CMD ["python", "main.py"]
