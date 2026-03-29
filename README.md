# pdf-to-mp3

PDFをアップロードするとVoiceVox（日本語TTS）でMP3に変換するWebアプリ。

## 技術スタック

- **バックエンド**: Flask + SQLAlchemy + MySQL（バックグラウンドスレッドで変換処理）
- **フロントエンド**: React + Vite + Tailwind CSS（静的ファイルとしてFlaskから配信）
- **TTS**: VoiceVox 0.16.2（ONNX Runtime CPU、Dockerイメージに同梱）
- **認証**: Google reCAPTCHA v3 + UUID v4 Cookie

## デプロイ

GitHub Actionsでイメージをビルド・GHCRにpush → `k8s/flask.yaml` のタグを自動更新 → ArgoCDが自動デプロイ。

## ローカル開発セットアップ

```bash
uv sync
uv run lefthook install   # pre-commitフック有効化
cd frontend && npm install
```
