# Secrets セットアップ手順

## namespaceの作成
```bash
kubectl create namespace pdf-to-mp3
```

## 作成コマンド
```bash
# 値の生成例（必要に応じて変更）
export FLASK_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
export DB_PASSWORD=$(openssl rand -hex 16)
export DATABASE_URL="mysql+pymysql://appuser:${DB_PASSWORD}@mysql:3306/pdftomp3"
export RECAPTCHA_SECRET_KEY='<Google reCAPTCHA v3 シークレットキー>'
export MYSQL_ROOT_PASSWORD='<MySQLルートパスワード>'
export MYSQL_PASSWORD="${DB_PASSWORD}"
export SMTP_PASSWORD='<さくらのメールボックス メールパスワード>'
export INTERNAL_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")

# 作成コマンド（環境変数を展開させるためにダブルクオートを使用）
kubectl create secret generic pdf-to-mp3-secret \
  --namespace pdf-to-mp3 \
  --from-literal=FLASK_SECRET_KEY="$FLASK_SECRET_KEY" \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=RECAPTCHA_SECRET_KEY="$RECAPTCHA_SECRET_KEY" \
  --from-literal=MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
  --from-literal=MYSQL_PASSWORD="$MYSQL_PASSWORD" \
  --from-literal=SMTP_PASSWORD="$SMTP_PASSWORD" \
  --from-literal=INTERNAL_SECRET="$INTERNAL_SECRET"
```

## 確認

```bash
kubectl get secret pdf-to-mp3-secret -n pdf-to-mp3
```

