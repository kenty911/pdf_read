# CLAUDE.md

## プロジェクト概要

PDFをVoiceVox（日本語TTS）でMP3変換するWebアプリ。
Next.js フルスタック + Python Worker（K8s Job） + MySQL + Kubernetes（シングルノード）構成。

## 開発コマンド

```bash
# Next.js サービス（service/ 内で実行）
npm install                    # 依存インストール
npm run dev                    # 開発サーバー
npm run lint                   # biome check app/ server/ actions/
npm run format                 # biome format --write app/ server/ actions/
npm run db:generate            # Drizzle マイグレーション SQL 生成
npm run db:migrate             # マイグレーション実行

# Worker（worker/ 内で実行）
uv sync                        # 依存インストール（dev 含む）
uv run ruff check .            # lint
uv run ruff format .           # format
uv run lefthook install        # pre-commit フック有効化（初回のみ）
```

## アーキテクチャ

```
service/
  app/              Next.js App Router（SSR ページ）
  app/(app)/        認証必須エリア（ジョブ管理画面）
  server/db/        Drizzle client + schema + migrations/
  server/models/    Active Record（Job, User, PendingRegistration, PasswordResetCode）
  server/services/  auth / email / recaptcha / k8s / storage（Next.js 依存なし）
  actions/          Server Actions（'use server' はここだけ）
worker/
  main.py           K8s Job エントリポイント（JOB_ID 環境変数を読んで実行・終了）
  converter.py      VoiceVox 変換ロジック
  pdf_processor.py  PDF テキスト抽出・クリーニング
  db.py             pymysql 直接接続（JobDB クラス）
k8s/                Kubernetes マニフェスト
```

## CI/CD

- `main` へのpush → GitHub Actions で lint → Docker build → GHCR push → マニフェスト自動更新
- `service/**` 変更 → `_web` イメージビルド → `k8s/web.yaml` のタグ更新
- `worker/**` 変更 → `_worker` イメージビルド → `k8s/config.yaml` の `WORKER_IMAGE` 更新
- ArgoCDがマニフェスト変更を検知して**自動デプロイ**（`kubectl apply` は不要）
- `k8s/**` の変更はCIをスキップ（`paths-ignore`）

## 重要な制約・注意事項

- `server/` 配下は Next.js に依存しないこと（`next/headers` 等のインポート禁止）
- `'use server'` は `actions/` 配下のみに記述する
- DBスキーマ変更は `server/db/schema.ts` を編集後 `npm run db:generate` でマイグレーション SQL を生成する
- VoiceVoxバイナリは Worker Dockerイメージに同梱（ホスト環境に依存しない）
- Worker は K8s Job として起動し、処理完了後に自動終了（`ttlSecondsAfterFinished: 600` で自動削除）
- K8s Secrets のキー名: `DATABASE_URL`, `COOKIE_SECRET`, `RECAPTCHA_SECRET_KEY`, `SMTP_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`

## Kubernetes

- シングルノード、ReadWriteOnce PVC（同一ノードなので web・worker 両方マウント可能）
- `app-data` PVC に `/data/uploads/` と `/data/outputs/` を保存
- デプロイ先: `pdf-to-mp3` namespace
- 公開URL: `https://pdf-to-mp3.ken-ty.com`
- `web` ServiceAccount に `batch/jobs` の create/get/list/delete 権限（`k8s/rbac.yaml`）
