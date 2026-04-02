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
from backend.utils.file_utils import is_allowed_video
from backend.utils.response import json_error, json_success
import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn.functional as F
from flask import Flask, request, send_from_directory
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from huggingface_hub import hf_hub_download
from backend.models.db_models import User, db
from torch import nn
from torch.utils.data.dataset import Dataset
from torchvision import models, transforms
from werkzeug.exceptions import HTTPException
from werkzeug.utils import secure_filename

warnings.filterwarnings("ignore")

# Initialize MediaPipe Face Mesh for CPU
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    refine_landmarks=False,
)

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


class Model(nn.Module):
    def __init__(
        self,
        num_classes,
        latent_dim=2048,
        lstm_layers=1,
        hidden_dim=2048,
        bidirectional=False,
    ):
        super().__init__()
        backbone = models.resnext50_32x4d(pretrained=True)
        self.model = nn.Sequential(*list(backbone.children())[:-2])
        self.lstm = nn.LSTM(latent_dim, hidden_dim, lstm_layers, bidirectional)
        self.dp = nn.Dropout(0.4)
        self.linear1 = nn.Linear(2048, num_classes)
        self.avgpool = nn.AdaptiveAvgPool2d(1)

    def forward(self, x):
        batch_size, seq_length, channels, height, width = x.shape
        x = x.view(batch_size * seq_length, channels, height, width)
        fmap = self.model(x)
        x = self.avgpool(fmap)
        x = x.view(batch_size, seq_length, 2048)
        x_lstm, _ = self.lstm(x, None)
        return fmap, self.dp(self.linear1(x_lstm[:, -1, :]))


def extract_frames(video_path, num_frames=8):
    frames = []
    frame_paths = []
    unique_id = str(uuid.uuid4()).split("-")[0]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Error opening video file")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        raise ValueError("Video file appears to be empty")

    interval = max(total_frames // max(num_frames, 1), 1)

    count = 0
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if count % interval == 0 and frame_count < num_frames:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)

            if not results.multi_face_landmarks:
                count += 1
                continue

            try:
                face_landmarks = results.multi_face_landmarks[0]

                height, width, _ = frame.shape
                x_coordinates = [landmark.x for landmark in face_landmarks.landmark]
                y_coordinates = [landmark.y for landmark in face_landmarks.landmark]

                x_min, x_max = min(x_coordinates), max(x_coordinates)
                y_min, y_max = min(y_coordinates), max(y_coordinates)

                x = int(x_min * width)
                y = int(y_min * height)
                face_width = int((x_max - x_min) * width)
                face_height = int((y_max - y_min) * height)

                padding_x = int(face_width * 0.2)
                padding_y = int(face_height * 0.2)

                left = max(0, x - padding_x)
                top = max(0, y - padding_y)
                right = min(width, x + face_width + padding_x)
                bottom = min(height, y + face_height + padding_y)

                face_frame = frame[top:bottom, left:right, :]
                frame_filename = f"frame_{unique_id}_{frame_count}.jpg"
                frame_path = os.path.join(FRAMES_FOLDER, frame_filename)
                cv2.imwrite(frame_path, face_frame)
                frame_paths.append(frame_filename)
                frames.append(face_frame)
                frame_count += 1
                logger.info("Extracted frame %s: %s", frame_count, frame_filename)
            except Exception as error:
                logger.error("Error processing frame %s: %s", frame_count, error)

        count += 1
        if frame_count >= num_frames:
            break

    cap.release()

    if len(frames) == 0:
        raise ValueError("No faces detected in the video")

    return frames, frame_paths


def predict(model, img):
    with torch.no_grad():
        _, logits = model(img)
        probabilities = F.softmax(logits, dim=1)
        _, prediction = torch.max(probabilities, 1)
        confidence = probabilities[:, int(prediction.item())].item() * 100
        logger.info("Prediction confidence: %.2f%%", confidence)
        return int(prediction.item()), float(confidence)


class validation_dataset(Dataset):
    def __init__(self, video_names, sequence_length=60, transform=None):
        self.video_names = video_names
        self.transform = transform
        self.count = sequence_length

    def __len__(self):
        return len(self.video_names)

    def __getitem__(self, idx):
        video_path = self.video_names[idx]
        frames = []
        step = max(int(100 / self.count), 1)
        first_frame = np.random.randint(0, step)

        for i, frame in enumerate(self.frame_extract(video_path)):
            if i < first_frame:
                continue

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)

            try:
                if results.multi_face_landmarks:
                    face_landmarks = results.multi_face_landmarks[0]

                    height, width, _ = frame.shape
                    x_coordinates = [landmark.x for landmark in face_landmarks.landmark]
                    y_coordinates = [landmark.y for landmark in face_landmarks.landmark]

                    x_min, x_max = min(x_coordinates), max(x_coordinates)
                    y_min, y_max = min(y_coordinates), max(y_coordinates)

                    x = int(x_min * width)
                    y = int(y_min * height)
                    face_width = int((x_max - x_min) * width)
                    face_height = int((y_max - y_min) * height)

                    padding_x = int(face_width * 0.2)
                    padding_y = int(face_height * 0.2)

                    left = max(0, x - padding_x)
                    top = max(0, y - padding_y)
                    right = min(width, x + face_width + padding_x)
                    bottom = min(height, y + face_height + padding_y)

                    frame = frame[top:bottom, left:right, :]
            except Exception:
                pass

            frames.append(self.transform(frame))
            if len(frames) == self.count:
                break

        if not frames:
            raise ValueError("Unable to extract valid frames for inference")

        frames = torch.stack(frames)[: self.count]
        return frames.unsqueeze(0)

    def frame_extract(self, path):
        video = cv2.VideoCapture(path)
        success = True
        while success:
            success, image = video.read()
            if success:
                yield image


def detect_fake_video(video_path):
    start_time = time.time()

    im_size = 112
    mean = [0.485, 0.456, 0.406]
    std = [0.229, 0.224, 0.225]

    train_transforms = transforms.Compose(
        [
            transforms.ToPILImage(),
            transforms.Resize((im_size, im_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean, std),
        ]
    )

    video_dataset = validation_dataset([video_path], sequence_length=20, transform=train_transforms)
    model = Model(2)

    model_path = hf_hub_download(repo_id="imtiyaz123/DF_Model", filename="df_model.pt")
    model.load_state_dict(torch.load(model_path, map_location=torch.device("cpu")))
    model.eval()

    frames_tensor = video_dataset[0]
    prediction, confidence = predict(model, frames_tensor)

    processing_time = time.time() - start_time
    logger.info("Video processing completed in %.2f seconds", processing_time)

    return prediction, confidence, processing_time


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
