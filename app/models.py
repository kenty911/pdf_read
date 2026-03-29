import uuid
from datetime import UTC, datetime

from werkzeug.security import check_password_hash, generate_password_hash

from . import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class PendingRegistration(db.Model):
    __tablename__ = "pending_registrations"

    email = db.Column(db.String(255), primary_key=True)
    password_hash = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))


class PasswordResetCode(db.Model):
    __tablename__ = "password_reset_codes"

    email = db.Column(db.String(255), primary_key=True)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), nullable=False, index=True)
    status = db.Column(
        db.Enum("processing", "completed", "failed"),
        nullable=False,
        default="processing",
    )
    original_filename = db.Column(db.String(255))
    pdf_path = db.Column(db.String(512))
    mp3_path = db.Column(db.String(512))
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "error": self.error_message,
            "original_filename": self.original_filename,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


def new_uuid() -> str:
    return str(uuid.uuid4())
