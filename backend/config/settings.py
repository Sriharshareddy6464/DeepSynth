import os

os.environ["KMP_DUPLICATE_LIB_OK"] = "True"
os.environ["MEDIAPIPE_DISABLE_GPU"] = "1"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
RUNTIME_DIR = os.path.join(INSTANCE_DIR, "runtime")
UPLOAD_FOLDER = os.path.join(RUNTIME_DIR, "uploads")
FRAMES_FOLDER = os.path.join(RUNTIME_DIR, "frames")
DATASET_FOLDER = os.path.join(BASE_DIR, "Admin", "datasets")
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov"}
RUNTIME_DIRECTORIES = [
    INSTANCE_DIR,
    RUNTIME_DIR,
    UPLOAD_FOLDER,
    FRAMES_FOLDER,
    DATASET_FOLDER,
]


class Settings:
    SECRET_KEY = os.environ.get(
        "SECRET_KEY",
        "dev-only-insecure-key-change-in-production",
    )
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///users.db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE = (
        os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true"
    )
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024
    UPLOAD_FOLDER = UPLOAD_FOLDER
    FRAMES_FOLDER = FRAMES_FOLDER
    DATASET_FOLDER = DATASET_FOLDER


def ensure_runtime_directories():
    for directory in RUNTIME_DIRECTORIES:
        os.makedirs(directory, exist_ok=True)
