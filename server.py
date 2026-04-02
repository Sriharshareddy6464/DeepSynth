import datetime
import logging
import os
import time
import traceback
import uuid
import warnings
import zipfile

from backend.config.settings import (
    DATASET_FOLDER,
    FRAMES_FOLDER,
    Settings,
    UPLOAD_FOLDER,
    ensure_runtime_directories,
)
from backend.services.ml_service import detect_fake_video
from backend.services.video_service import extract_frames
from backend.utils.file_utils import is_allowed_video
from backend.utils.response import json_error, json_success
from flask import Flask, request, send_from_directory
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from backend.models.db_models import User, db
from werkzeug.exceptions import HTTPException
from werkzeug.utils import secure_filename

warnings.filterwarnings("ignore")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder=None)
app.config.from_object(Settings)
ensure_runtime_directories()

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

# Initialize SQLAlchemy
db.init_app(app)
def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }


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


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return json_error("Authentication required", status=401)


with app.app_context():
    db.create_all()


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


@app.route("/")
@app.route("/api/health")
def healthcheck():
    return json_success(
        {
            "service": "DeepSynth API",
            "ui": "React frontend",
            "status": "ok",
        }
    )


@app.route("/api/register", methods=["POST"])
@app.route("/api/signup", methods=["POST"])
def register():
    if not request.is_json:
        return json_error("Expected application/json request body", status=415)

    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return json_error("Username, email, and password are required", status=400)

    if len(password) < 8:
        return json_error("Password must be at least 8 characters long", status=400)

    if User.query.filter_by(email=email).first():
        return json_error("Email already exists", status=409)

    if User.query.filter_by(username=username).first():
        return json_error("Username already exists", status=409)

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return json_success(
        {
            "message": "Registration successful",
            "user": serialize_user(user),
        },
        status=201,
    )


@app.route("/api/login", methods=["POST"])
def login():
    if not request.is_json:
        return json_error("Expected application/json request body", status=415)

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return json_error("Email and password are required", status=400)

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return json_error("Invalid credentials", status=401)

    login_user(user)
    return json_success({"user": serialize_user(user)})


@app.route("/api/logout", methods=["POST"])
def logout():
    if current_user.is_authenticated:
        logout_user()
    return json_success({"message": "Logged out"})


@app.route("/api/me", methods=["GET"])
def get_current_user():
    if not current_user.is_authenticated:
        return json_success({"authenticated": False, "user": None})

    return json_success(
        {
            "authenticated": True,
            "user": serialize_user(current_user),
        }
    )


def ensure_admin():
    if not current_user.is_authenticated:
        return json_error("Authentication required", status=401)
    if not getattr(current_user, "is_admin", False):
        return json_error("Admin access required", status=403)
    return None


def get_datasets():
    datasets = []
    for item in os.listdir(DATASET_FOLDER):
        if item.endswith(".zip"):
            path = os.path.join(DATASET_FOLDER, item)
            stats = os.stat(path)
            datasets.append(
                {
                    "name": item,
                    "size": stats.st_size,
                    "upload_date": datetime.datetime.fromtimestamp(stats.st_mtime).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                }
            )
    return datasets


@app.route("/api/admin/datasets", methods=["GET"])
@login_required
def admin_datasets():
    admin_error = ensure_admin()
    if admin_error:
        return admin_error
    return json_success({"datasets": get_datasets()})


@app.route("/api/admin/upload", methods=["POST"])
@login_required
def admin_upload():
    admin_error = ensure_admin()
    if admin_error:
        return admin_error

    if "dataset" not in request.files:
        return json_error("No file uploaded", status=400)

    dataset = request.files["dataset"]
    if not dataset.filename:
        return json_error("No file selected", status=400)

    if not dataset.filename.lower().endswith(".zip"):
        return json_error("Invalid file format. Please upload ZIP files only.", status=400)

    filename = secure_filename(dataset.filename)
    filepath = os.path.join(DATASET_FOLDER, filename)

    try:
        dataset.save(filepath)
        with zipfile.ZipFile(filepath, "r") as zip_ref:
            zip_ref.testzip()

        logger.info("Dataset uploaded successfully: %s", filename)
        return json_success(
            {
                "message": "Dataset uploaded successfully",
                "dataset": {
                    "name": filename,
                    "size": os.path.getsize(filepath),
                    "upload_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                },
            }
        )
    except Exception as error:
        if os.path.exists(filepath):
            os.remove(filepath)
        logger.error("Error uploading dataset: %s", error)
        return json_error(f"Error uploading dataset: {error}", status=400)


@app.route("/api/assets/frames/<path:filename>", methods=["GET"])
@login_required
def serve_frame(filename):
    return send_from_directory(FRAMES_FOLDER, filename)


@app.route("/api/detect", methods=["POST"])
@login_required
def detect():
    if "video" not in request.files:
        return json_error("No video file uploaded", status=400)

    video = request.files["video"]
    if not video.filename:
        return json_error("No video file selected", status=400)

    if not is_allowed_video(video.filename):
        return json_error(
            "Invalid file format. Supported formats: MP4, AVI, MOV.",
            status=400,
        )

    safe_name = secure_filename(video.filename) or "upload.mp4"
    video_filename = f"{uuid.uuid4().hex}_{safe_name}"
    video_path = os.path.join(app.config["UPLOAD_FOLDER"], video_filename)
    video.save(video_path)

    try:
        if os.path.getsize(video_path) == 0:
            return json_error("Uploaded video file is empty", status=400)

        logger.info("Processing video: %s", video_filename)
        _, frame_paths = extract_frames(video_path)
        prediction_index, confidence, processing_time = detect_fake_video(video_path)

        prediction = "fake" if prediction_index == 0 else "real"
        logger.info("Video prediction: %s with confidence %.2f%%", prediction, confidence)

        return json_success(
            {
                "prediction": prediction,
                "confidence": round(confidence, 2),
                "frames": frame_paths,
                "frame_scores": [],
                "processing_time": round(processing_time, 2),
            }
        )
    except Exception as error:
        logger.error("Error processing video: %s", error)
        traceback.print_exc()
        return json_error(f"Error processing video: {error}", status=400)
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
