import logging
import time

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from huggingface_hub import hf_hub_download
from torch import nn
from torch.utils.data.dataset import Dataset
from torchvision import models, transforms

from backend.services.video_service import face_mesh

logger = logging.getLogger(__name__)


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
