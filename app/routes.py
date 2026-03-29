import os
import uuid

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

from . import db
from .auth import get_user_id, require_auth, set_user_cookie, verify_recaptcha
from .converter import start_conversion
from .models import Job
from .storage import get_upload_path

bp = Blueprint("main", __name__)


@bp.route("/")
def lp():
    return render_template(
        "lp.html",
        recaptcha_site_key=os.environ["RECAPTCHA_SITE_KEY"],
    )


@bp.route("/app")
def app_page():
    if get_user_id() is None:
        return redirect(url_for("main.lp"))
    return render_template("app.html")


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

    job = Job(id=job_id, user_id=user_id, status="processing", pdf_path=str(upload_path))
    db.session.add(job)
    db.session.commit()

    start_conversion(current_app._get_current_object(), job_id)

    return jsonify({"job_id": job_id}), 202


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

    return send_file(
        job.mp3_path,
        as_attachment=True,
        download_name="output.mp3",
        mimetype="audio/mpeg",
    )
