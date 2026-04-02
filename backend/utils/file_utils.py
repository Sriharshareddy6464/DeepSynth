import os

from backend.config.settings import ALLOWED_VIDEO_EXTENSIONS


def normalize_extension(filename):
    _, extension = os.path.splitext(filename or "")
    return extension.lower()


def is_allowed_video(filename):
    return normalize_extension(filename) in ALLOWED_VIDEO_EXTENSIONS
