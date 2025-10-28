import torch
from torch.utils.data import Dataset, DataLoader
import os
from PIL import Image
from utils import read_pairs_csv


class PairedImageDataset(Dataset):
    """CSV columns expected: drone_path,user_path,match,priority
    match: 1 if same scene, 0 otherwise
    priority: 1 high, 0 low (only meaningful if match==1)"""
    def __init__(self, pairs_csv, root, transform=None):
        self.pairs = read_pairs_csv(pairs_csv)
        self.root = root
        self.transform = transform

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, idx):
        row = self.pairs[idx]
        drone_img = Image.open(os.path.join(self.root, row['drone_path'])).convert('RGB')
        user_img = Image.open(os.path.join(self.root, row['user_path'])).convert('RGB')
        if self.transform:
            drone_img = self.transform(drone_img)
            user_img = self.transform(user_img)
        match = torch.tensor(int(row['match']), dtype=torch.float32)
        priority = torch.tensor(int(row.get('priority', 0)), dtype=torch.long)
        return drone_img, user_img, match, priority
