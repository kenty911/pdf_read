import os
import smtplib
from email.mime.text import MIMEText


def send_activation_email(to_email: str, code: str) -> None:
    smtp_host = os.environ["SMTP_HOST"]
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ["SMTP_USER"]
    smtp_password = os.environ["SMTP_PASSWORD"]
    from_addr = os.environ.get("SMTP_FROM", "info@pdf-to-mp3.ken-ty.com")

    body = f"""PDF to MP3 へのご登録ありがとうございます。

アクティベーションコード: {code}

このコードは30分間有効です。
画面にコードを入力して会員登録を完了してください。

このメールに心当たりがない場合は無視してください。
"""
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = "PDF to MP3 - アクティベーションコード"
    msg["From"] = from_addr
    msg["To"] = to_email

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(from_addr, [to_email], msg.as_string())


def send_password_reset_email(to_email: str, code: str) -> None:
    smtp_host = os.environ["SMTP_HOST"]
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ["SMTP_USER"]
    smtp_password = os.environ["SMTP_PASSWORD"]
    from_addr = os.environ.get("SMTP_FROM", "info@pdf-to-mp3.ken-ty.com")

    body = f"""PDF to MP3 のパスワード再設定のご依頼を受け付けました。

パスワード再設定コード: {code}

このコードは30分間有効です。
画面にコードを入力して新しいパスワードを設定してください。

このメールに心当たりがない場合は無視してください。
"""
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = "PDF to MP3 - パスワード再設定コード"
    msg["From"] = from_addr
    msg["To"] = to_email

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(from_addr, [to_email], msg.as_string())
