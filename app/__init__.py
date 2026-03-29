import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
    )

    app.config["SECRET_KEY"] = os.environ["FLASK_SECRET_KEY"]
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100MB

    db.init_app(app)

    with app.app_context():
        from .routes import bp
        app.register_blueprint(bp)
        db.create_all()
        _migrate(db)

    return app


def _migrate(db):
    """既存テーブルへのカラム追加など、create_all では対応できない差分を適用する。"""
    migrations = [
        "ALTER TABLE jobs ADD COLUMN original_filename VARCHAR(255)",
    ]
    from sqlalchemy import text
    for sql in migrations:
        try:
            db.session.execute(text(sql))
            db.session.commit()
        except Exception:
            db.session.rollback()
