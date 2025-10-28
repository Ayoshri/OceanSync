import os
import csv
import random
from PIL import Image
import torch
from torchvision import transforms




def make_dirs(path):
os.makedirs(path, exist_ok=True)




def default_transforms(img_size=224, train=True):
if train:
return transforms.Compose([
transforms.Resize((img_size, img_size)),
transforms.RandomHorizontalFlip(),
transforms.RandomRotation(10),
transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
transforms.ToTensor(),
transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])
else:
return transforms.Compose([
transforms.Resize((img_size, img_size)),
transforms.ToTensor(),
transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])


# Helper to read CSV with columns: drone_path,user_path,match(0/1),priority(0/1)


def read_pairs_csv(path):
pairs = []
with open(path, 'r') as f:
reader = csv.DictReader(f)
for r in reader:
pairs.append(r)
return pairs