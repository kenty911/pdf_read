# CLAUDE.md

## プロジェクト概要

PDFをVoiceVox（日本語TTS）でMP3変換するWebアプリ。
Flask API + React SPA + MySQL + Kubernetes（シングルノード）構成。

## 開発コマンド

```bash
# Python
uv sync                        # 依存インストール（dev含む）
uv run ruff check app/         # lint
uv run ruff format app/        # format
uv run ty check app/           # type check

# フロントエンド（frontend/ 内で実行）
npm run lint                   # biome check src/
npm run format                 # biome format --write src/
npm run build                  # Vite ビルド → ../static/dist/

# Hooks
uv run lefthook install        # pre-commit フック有効化（初回のみ）
```

## アーキテクチャ

```
app/            Flask アプリケーション（API + Jinja LP）
frontend/       React + Vite ソース（app ページのみSPA）
static/dist/    Vite ビルド成果物（git管理外、Dockerビルド時に生成）
templates/      lp.html のみ（Jinja）
migrations/     Alembic マイグレーション（起動時に自動適用）
k8s/            Kubernetes マニフェスト
```

## CI/CD

- `main` へのpush → GitHub Actions で lint → Docker build → GHCR push → `k8s/flask.yaml` のイメージタグ自動更新
- ArgoCDがマニフェスト変更を検知して**自動デプロイ**（`kubectl apply` は不要）
- `k8s/**` の変更はCIをスキップ（`paths-ignore`）

## 重要な制約・注意事項

- VoiceVoxバイナリはDockerイメージに同梱（ホスト環境に依存しない）
- MySQLスキーマ変更はマイグレーションファイル（`migrations/versions/`）に追加する。`db.create_all()` は使わない
- gunicornは `--workers 1 --threads 4`（VoiceVoxシングルトンのため）
- `uv sync --frozen` でビルド（`uv.lock` を厳密に使用）
- フロントエンドの `static/dist/` はgit管理外。`.dockerignore` に含めないこと

## Kubernetes

- シングルノード、ReadWriteOnce PVC
- `app-data` PVC に `/data/uploads/` と `/data/outputs/` を保存
- デプロイ先: `pdf-to-mp3` namespace
- 公開URL: `https://pdf-to-mp3.ken-ty.com`
