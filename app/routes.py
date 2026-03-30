import os
import random
import uuid
from datetime import UTC, datetime, timedelta

from flask import (
    Blueprint,
    current_app,
    jsonify,
    make_response,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)
from werkzeug.security import generate_password_hash

from . import db
from .auth import get_user_id, require_auth, set_member_cookie, set_user_cookie, verify_recaptcha
from .converter import start_conversion
from .email import send_activation_email, send_password_reset_email
from .models import Job, PasswordResetCode, PendingRegistration, User, new_uuid
from .storage import get_upload_path

bp = Blueprint("main", __name__)


@bp.route("/")
def lp():
    # 会員ログイン済みなら /app へ
    user_id = get_user_id()
    if user_id:
        user = User.query.filter_by(id=user_id, is_verified=True).first()
        if user:
            return redirect(url_for("main.app_page"))
    return render_template(
        "lp.html",
        recaptcha_site_key=os.environ["RECAPTCHA_SITE_KEY"],
    )


@bp.route("/app")
def app_page():
    if get_user_id() is None:
        return redirect(url_for("main.lp"))
    static_folder = current_app.static_folder
    assert static_folder is not None
    return send_file(os.path.join(static_folder, "dist", "index.html"))


@bp.route("/api/auth/verify", methods=["POST"])
def verify_auth():
    data = request.get_json()
    token = (data or {}).get("token")
    if not token:
        return jsonify({"error": "token required"}), 400

    if not verify_recaptcha(token):
        return jsonify({"error": "reCAPTCHA verification failed"}), 403

    user_id = str(uuid.uuid4())
    resp = make_response(jsonify({"ok": True}))
    set_user_cookie(resp, user_id)
    return resp


@bp.route("/api/auth/me")
def auth_me():
    user_id = get_user_id()
    if user_id:
        user = User.query.filter_by(id=user_id, is_verified=True).first()
        if user:
            return jsonify({"type": "member", "email": user.email})
    return jsonify({"type": "guest", "email": None})


@bp.route("/api/auth/register", methods=["POST"])
@require_auth
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or "@" not in email:
        return jsonify({"error": "メールアドレスが無効です"}), 400
    if len(password) < 8:
        return jsonify({"error": "パスワードは8文字以上で入力してください"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "このメールアドレスはすでに登録されています"}), 409

    code = f"{random.randint(0, 999999):06d}"
    # MySQL は naive datetime で保存するため tzinfo なし
    expires_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(minutes=30)
    password_hash = generate_password_hash(password)

    pending = db.session.get(PendingRegistration, email)
    if pending:
        pending.password_hash = password_hash
        pending.code = code
        pending.expires_at = expires_at
    else:
        pending = PendingRegistration(
            email=email,
            password_hash=password_hash,
            code=code,
            expires_at=expires_at,
        )
        db.session.add(pending)
    db.session.commit()

    try:
        send_activation_email(email, code)
    except Exception:
        return jsonify({"error": "メール送信に失敗しました。しばらく経ってから再試行ください"}), 500

    return jsonify({"ok": True})


@bp.route("/api/auth/activate", methods=["POST"])
@require_auth
def activate():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()

    pending = db.session.get(PendingRegistration, email)
    if not pending:
        return jsonify({"error": "登録情報が見つかりません。再度登録してください"}), 404

    if pending.expires_at < datetime.now(UTC).replace(tzinfo=None):
        db.session.delete(pending)
        db.session.commit()
        return jsonify({"error": "コードの有効期限が切れています。再度登録してください"}), 400

    if pending.code != code:
        return jsonify({"error": "コードが正しくありません"}), 400

    guest_user_id = get_user_id()
    user = User(
        id=new_uuid(),
        email=email,
        password_hash=pending.password_hash,
        is_verified=True,
    )
    db.session.add(user)

    # ゲストのジョブを会員に移行
    if guest_user_id:
        Job.query.filter_by(user_id=guest_user_id).update({"user_id": user.id})

    db.session.delete(pending)
    db.session.commit()

    resp = make_response(jsonify({"ok": True}))
    set_member_cookie(resp, user.id)
    return resp


@bp.route("/api/auth/login", methods=["POST"])
@require_auth
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email, is_verified=True).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "メールアドレスまたはパスワードが正しくありません"}), 401

    guest_user_id = get_user_id()
    if guest_user_id and guest_user_id != user.id:
        Job.query.filter_by(user_id=guest_user_id).update({"user_id": user.id})
        db.session.commit()

    resp = make_response(jsonify({"ok": True}))
    set_member_cookie(resp, user.id)
    return resp


@bp.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email or "@" not in email:
        return jsonify({"error": "メールアドレスが無効です"}), 400

    user = User.query.filter_by(email=email, is_verified=True).first()
    # 存在しない場合も同じレスポンスを返す（メール存在確認を防ぐ）
    if user:
        code = f"{random.randint(0, 999999):06d}"
        expires_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(minutes=30)

        reset = db.session.get(PasswordResetCode, email)
        if reset:
            reset.code = code
            reset.expires_at = expires_at
        else:
            reset = PasswordResetCode(email=email, code=code, expires_at=expires_at)
            db.session.add(reset)
        db.session.commit()

        try:
            send_password_reset_email(email, code)
        except Exception:
            return jsonify({"error": "メール送信に失敗しました"}), 500

    return jsonify({"ok": True})


@bp.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()
    new_password = data.get("password") or ""

    if len(new_password) < 8:
        return jsonify({"error": "パスワードは8文字以上で入力してください"}), 400

    reset = db.session.get(PasswordResetCode, email)
    if not reset:
        return jsonify({"error": "コードが無効です。再度メールアドレスを入力してください"}), 400

    if reset.expires_at < datetime.now(UTC).replace(tzinfo=None):
        db.session.delete(reset)
        db.session.commit()
        return jsonify({"error": "コードの有効期限が切れています。再度お試しください"}), 400

    if reset.code != code:
        return jsonify({"error": "コードが正しくありません"}), 400

    user = User.query.filter_by(email=email, is_verified=True).first()
    if not user:
        return jsonify({"error": "ユーザーが見つかりません"}), 404

    user.set_password(new_password)
    db.session.delete(reset)
    db.session.commit()

    resp = make_response(jsonify({"ok": True}))
    set_member_cookie(resp, user.id)
    return resp


@bp.route("/api/logout", methods=["POST"])
def logout():
    resp = make_response(redirect(url_for("main.lp")))
    resp.delete_cookie("user_id")
    return resp


@bp.route("/api/jobs", methods=["POST"])
@require_auth
def create_job():
    user_id = get_user_id()

    existing = Job.query.filter_by(user_id=user_id, status="processing").first()
    if existing:
        return jsonify({"error": "job already running", "job_id": existing.id}), 429

    if "file" not in request.files:
        return jsonify({"error": "file required"}), 400

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "PDFファイルのみアップロード可能です"}), 400

    job_id = str(uuid.uuid4())
    upload_path = get_upload_path(job_id)
    file.save(str(upload_path))

    original_filename = file.filename
    job = Job(
        id=job_id,
        user_id=user_id,
        status="processing",
        pdf_path=str(upload_path),
        original_filename=original_filename,
    )
    db.session.add(job)
    db.session.commit()

    start_conversion(current_app._get_current_object(), job_id)

    return jsonify({"job_id": job_id}), 202


@bp.route("/api/jobs")
@require_auth
def list_jobs():
    user_id = get_user_id()
    jobs = Job.query.filter_by(user_id=user_id).order_by(Job.created_at.desc()).all()
    return jsonify([j.to_dict() for j in jobs])


@bp.route("/api/jobs/<job_id>/status")
@require_auth
def job_status(job_id):
    user_id = get_user_id()
    job = Job.query.filter_by(id=job_id, user_id=user_id).first_or_404()
    return jsonify(job.to_dict())


@bp.route("/api/jobs/<job_id>/download")
@require_auth
def download(job_id):
    user_id = get_user_id()
    job = Job.query.filter_by(id=job_id, user_id=user_id).first_or_404()

    if job.status != "completed":
        return jsonify({"error": "変換が完了していません"}), 400

    from pathlib import Path

    stem = Path(job.original_filename).stem if job.original_filename else "output"
    download_name = stem + ".mp3"

    return send_file(
        job.mp3_path,
        as_attachment=True,
        download_name=download_name,
        mimetype="audio/mpeg",
    )
