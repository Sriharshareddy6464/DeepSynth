import datetime
import logging
import os
import zipfile

from flask import Blueprint
from flask import request
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename

from backend.config.settings import DATASET_FOLDER
from backend.utils.response import json_error, json_success

logger = logging.getLogger(__name__)
admin_bp = Blueprint("admin", __name__)


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


@admin_bp.route("/api/admin/datasets", methods=["GET"])
@login_required
def admin_datasets():
    admin_error = ensure_admin()
    if admin_error:
        return admin_error
    return json_success({"datasets": get_datasets()})


@admin_bp.route("/api/admin/upload", methods=["POST"])
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


def register_admin_routes(app):
    app.register_blueprint(admin_bp)
