# pdf-to-mp3

PDFをアップロードするとVoiceVox（日本語TTS）でMP3に変換するWebアプリ。

## 技術スタック

- **フロントエンド/バックエンド**: Next.js 15 (App Router, SSR, Server Actions) + Drizzle ORM + MySQL
- **ワーカー**: Python 3.12 + VoiceVox 0.16.2（K8s Job として都度起動）
- **インフラ**: Kubernetes シングルノード / ArgoCD / GHCR

## ローカル開発セットアップ

```bash
# Service
cd service
npm install
npm run db:generate
npm run dev

# Worker
cd worker
uv sync
uv run lefthook install
```

## デプロイ

`main` へ push → GitHub Actions が変更パスを検知してビルド：

| 変更パス | ビルド対象 | 更新ファイル |
|---|---|---|
| `service/**` | `_web` イメージ | `k8s/web.yaml` |
| `worker/**` | `_worker` イメージ | `k8s/config.yaml` |

ArgoCD がマニフェスト変更を検知して自動デプロイ（`kubectl apply` 不要）。
