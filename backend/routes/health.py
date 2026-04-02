from flask import Blueprint

from backend.utils.response import json_success

health_bp = Blueprint("health", __name__)


@health_bp.route("/")
@health_bp.route("/api/health")
def healthcheck():
    return json_success(
        {
            "service": "DeepSynth API",
            "ui": "React frontend",
            "status": "ok",
        }
    )


def register_health_routes(app):
    app.register_blueprint(health_bp)
