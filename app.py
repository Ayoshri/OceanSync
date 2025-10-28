from fastapi import FastAPI, UploadFile, File
import torch
import torch.nn.functional as F
from PIL import Image
from io import BytesIO
import os
import random

# Import your models and utilities
from models import EmbeddingNet, SiameseNetwork, PriorityClassifier
from utils import default_transforms

app = FastAPI()

# -----------------------------
# Load trained models safely
# -----------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

emb_net = EmbeddingNet(pretrained=False)
siamese = SiameseNetwork(emb_net).to(device)
priority_model = PriorityClassifier(embedding_dim=256).to(device)

# Siamese model
try:
    siamese.load_state_dict(torch.load("checkpoint/siamese_epoch10.pth", map_location=device))
    siamese.eval()
    siamese_loaded = True
except Exception as e:
    print("⚠️ Warning: Could not load Siamese model checkpoint:", e)
    siamese_loaded = False

# Priority model
try:
    priority_model.load_state_dict(torch.load("checkpoint/priority_epoch10.pth", map_location=device))
    priority_model.eval()
    priority_loaded = True
except Exception as e:
    print("⚠️ Warning: Could not load Priority model checkpoint:", e)
    priority_loaded = False

transform = default_transforms(224, train=False)

# -----------------------------
# Helper: prepare image
# -----------------------------
def prepare_image(img_bytes):
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    return transform(img).unsqueeze(0).to(device)

# -----------------------------
# API route: Compare images
# -----------------------------
@app.post("/compare")
async def compare(user_file: UploadFile = File(...)):
    # 1. Read user image
    user_bytes = await user_file.read()
    user_tensor = prepare_image(user_bytes)

    # 2. Fetch latest drone image from drone server API
    drone_path = "drone_test.jpg"
    if not os.path.exists(drone_path):
        return {"error": f"Drone image not found at {drone_path}"}

    with open(drone_path, "rb") as f:
        drone_bytes = f.read()
        drone_tensor = prepare_image(drone_bytes)

    # 3. Run ML models (or dummy outputs if missing)
    with torch.no_grad():
        if siamese_loaded:
            e1, e2 = siamese(drone_tensor, user_tensor)
            dist = F.pairwise_distance(e1, e2).item()
            sim_score = 1 / (1 + dist)
            match = sim_score > 0.8
        else:
            # Dummy similarity for testing
            sim_score = round(random.uniform(0, 1), 3)
            match = sim_score > 0.8
            e1 = e2 = None

        if match and priority_loaded:
            logits = priority_model(e1)
            pr = torch.argmax(logits, dim=1).item()
            priority = "high" if pr == 1 else "low"
        elif match:
            # Dummy priority for testing
            priority = random.choice(["high", "low"])
        else:
            priority = None

    return {
        "match": bool(match),
        "similarity": float(sim_score),
        "priority": priority
    }
