# Secrets セットアップ手順

Secret は `kubectl create secret` コマンドで直接作成します。
YAML ファイルにシークレット値を書かないでください。

## 前提

```bash
kubectl config set-context --current --namespace=pdf-to-mp3
```

## 作成コマンド

```bash
kubectl create secret generic pdf-to-mp3-secret \
  --namespace pdf-to-mp3 \
  --from-literal=FLASK_SECRET_KEY='<32文字以上のランダム文字列>' \
  --from-literal=DATABASE_URL='mysql+pymysql://appuser:<password>@mysql:3306/pdftomp3' \
  --from-literal=RECAPTCHA_SECRET_KEY='<Google reCAPTCHA v3 シークレットキー>' \
  --from-literal=MYSQL_ROOT_PASSWORD='<MySQLルートパスワード>' \
  --from-literal=MYSQL_PASSWORD='<appuserのパスワード>'
```

## 値の生成例

```bash
# FLASK_SECRET_KEY の生成
python3 -c "import secrets; print(secrets.token_hex(32))"

# または openssl
openssl rand -hex 32
```

## 確認

```bash
kubectl get secret pdf-to-mp3-secret -n pdf-to-mp3
```

## 更新（値を変えたい場合）

```bash
kubectl create secret generic pdf-to-mp3-secret \
  --namespace pdf-to-mp3 \
  --from-literal=FLASK_SECRET_KEY='...' \
  ... \
  --dry-run=client -o yaml | kubectl apply -f -
```
