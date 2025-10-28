import os
import csv
import random
from sklearn.model_selection import train_test_split

# Paths
root = "./ML"
drone_dir = os.path.join(root, "drone")
user_dir = os.path.join(root, "user")

# Output CSVs
train_csv = os.path.join(root, "train_pairs.csv")
val_csv = os.path.join(root, "val_pairs.csv")

# Get images
drone_imgs = sorted(os.listdir(drone_dir))
user_imgs = sorted(os.listdir(user_dir))

pairs = []

# 1. Positive pairs (same index = same scene)
for d, u in zip(drone_imgs, user_imgs):
    # Assign random priority (1=high, 0=low)
    priority = random.choice([0, 1])
    pairs.append([f"drone/{d}", f"user/{u}", 1, priority])

# 2. Negative pairs (random mismatches)
for i in range(len(drone_imgs)):
    d = drone_imgs[i]
    u = random.choice(user_imgs)
    # Ensure not the same scene
    if user_imgs[i] != u:
        pairs.append([f"drone/{d}", f"user/{u}", 0, 0])

# Shuffle dataset
random.shuffle(pairs)

# Split into train/val (80/20)
train_data, val_data = train_test_split(pairs, test_size=0.2, random_state=42)

# Save to CSV
def save_csv(path, data):
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["drone_path", "user_path", "match", "priority"])
        writer.writerows(data)

save_csv(train_csv, train_data)
save_csv(val_csv, val_data)

print(f"✅ Done! Saved {len(train_data)} training pairs and {len(val_data)} validation pairs.")
