import logging
import os
import warnings

from backend.config.settings import Settings, ensure_runtime_directories
from backend.models.db_models import db
from backend.routes.admin import admin_bp
from backend.routes.auth import auth_bp, configure_login_manager
from backend.routes.detect import detect_bp
from backend.routes.health import health_bp
from backend.utils.response import json_error
from flask import Flask, request
from flask_login import LoginManager
from werkzeug.exceptions import HTTPException

warnings.filterwarnings("ignore")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder=None)
app.config.from_object(Settings)
ensure_runtime_directories()

login_manager = LoginManager()
login_manager.init_app(app)
configure_login_manager(login_manager)

db.init_app(app)

with app.app_context():
    db.create_all()

app.register_blueprint(health_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(detect_bp)


def get_frontend_origin():
    origin = app.config.get("FRONTEND_ORIGIN")
    return origin.rstrip("/") if origin else None


def is_request_from_allowed_origin():
    origin = request.headers.get("Origin")
    if not origin:
        return False

    configured_origin = get_frontend_origin()
    if configured_origin:
        return origin.rstrip("/") == configured_origin

    return True


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return ("", 204)
    return None


@app.after_request
def after_request(response):
    if is_request_from_allowed_origin():
        response.headers["Access-Control-Allow-Origin"] = request.headers["Origin"]
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.errorhandler(HTTPException)
def handle_http_exception(error):
    return json_error(error.description, status=error.code or 500)


@app.errorhandler(Exception)
def handle_unexpected_exception(error):
    logger.exception("Unhandled application error")
    return json_error("Internal server error", status=500)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
