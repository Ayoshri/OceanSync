from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from PIL import Image
import torch
import torchvision.transforms as transforms

from models import EmbeddingNet, SiameseNetwork, PriorityClassifier

# --- Setup ---
app = FastAPI()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load models
embedding_net = EmbeddingNet(pretrained=True).to(device)
siamese_model = SiameseNetwork(embedding_net).to(device)
priority_model = PriorityClassifier(embedding_dim=256).to(device)

# Preprocessing for images
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])


def preprocess(img_file: UploadFile):
    image = Image.open(img_file.file).convert("RGB")
    return transform(image).unsqueeze(0).to(device)


# --- API Route ---
@app.post("/compare")
async def compare_images(drone_img: UploadFile = File(...), user_img: UploadFile = File(...)):
    # Preprocess both images
    img1 = preprocess(drone_img)
    img2 = preprocess(user_img)

    # Run through Siamese
    e1, e2 = siamese_model(img1, img2)
    similarity = torch.cosine_similarity(e1, e2).item()

    # Run priority classifier (on drone embedding here, could also use avg)
    priority_logits = priority_model(e1)
    priority = torch.argmax(priority_logits, dim=1).item()
    priority_label = "High" if priority == 1 else "Low"

    # Match threshold
    match = similarity > 0.7  # adjust threshold as needed

    return JSONResponse({
        "similarity": round(float(similarity), 3),
        "match": bool(match),
        "priority": priority_label
    })
