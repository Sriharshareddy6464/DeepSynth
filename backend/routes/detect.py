import logging
import os
import traceback
import uuid

from flask import Blueprint
from flask import current_app, request, send_from_directory
from flask_login import login_required
from werkzeug.utils import secure_filename

from backend.services.ml_service import detect_fake_video
from backend.services.video_service import extract_frames
from backend.utils.file_utils import is_allowed_video
from backend.utils.response import json_error, json_success

logger = logging.getLogger(__name__)
detect_bp = Blueprint("detect", __name__)


@detect_bp.route("/api/assets/frames/<path:filename>", methods=["GET"])
@login_required
def serve_frame(filename):
    return send_from_directory(current_app.config["FRAMES_FOLDER"], filename)


@detect_bp.route("/api/detect", methods=["POST"])
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
    video_path = os.path.join(current_app.config["UPLOAD_FOLDER"], video_filename)
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


def register_detect_routes(app):
    app.register_blueprint(detect_bp)
