import logging
import os
import uuid

import cv2
import mediapipe as mp
from flask import current_app

from backend.config.settings import FRAMES_FOLDER

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    refine_landmarks=False,
)

logger = logging.getLogger(__name__)


def extract_frames(video_path, num_frames=8):
    frames = []
    frame_paths = []
    unique_id = str(uuid.uuid4()).split("-")[0]
    target_frames_folder = current_app.config.get("FRAMES_FOLDER", FRAMES_FOLDER)

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
                frame_path = os.path.join(target_frames_folder, frame_filename)
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
