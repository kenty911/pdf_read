import os
from functools import wraps

import requests as http_requests
from flask import current_app, jsonify, request
from itsdangerous import BadSignature, URLSafeSerializer

COOKIE_NAME = "user_id"
COOKIE_MAX_AGE = 315360000  # 約10年（ゲスト）
MEMBER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30日（会員）


def _serializer() -> URLSafeSerializer:
    return URLSafeSerializer(current_app.config["SECRET_KEY"], salt="user-id")


def get_user_id() -> str | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        return _serializer().loads(token)
    except BadSignature:
        return None


def set_user_cookie(response, user_id: str):
    token = _serializer().dumps(user_id)
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="Strict",
    )
    return response


def set_member_cookie(response, user_id: str):
    token = _serializer().dumps(user_id)
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=MEMBER_COOKIE_MAX_AGE,
        httponly=True,
        samesite="Strict",
    )
    return response


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if get_user_id() is None:
            return jsonify({"error": "unauthorized"}), 401
        return f(*args, **kwargs)

    return decorated


def verify_recaptcha(token: str) -> bool:
    secret = os.environ["RECAPTCHA_SECRET_KEY"]
    try:
        resp = http_requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": secret, "response": token},
            timeout=5,
        )
        result = resp.json()
        return result.get("success") is True and result.get("score", 0) >= 0.5
    except Exception:
        return False
