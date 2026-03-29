from datetime import datetime
from . import db


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), nullable=False, index=True)
    status = db.Column(
        db.Enum("processing", "completed", "failed"),
        nullable=False,
        default="processing",
    )
    pdf_path = db.Column(db.String(512))
    mp3_path = db.Column(db.String(512))
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "error": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
