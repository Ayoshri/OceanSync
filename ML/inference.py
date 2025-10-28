import torch
import torch.nn.functional as F


def infer(siamm, clf, drone_img, user_img, device, threshold=0.8):
    siamm.eval()
    clf.eval()
    with torch.no_grad():
        e1, e2 = siamm(drone_img.to(device).unsqueeze(0), user_img.to(device).unsqueeze(0))
        dist = F.pairwise_distance(e1, e2).item()
        # smaller dist => more similar. Convert to similarity score
        sim_score = 1.0 / (1.0 + dist)
        match = sim_score >= threshold
        priority = None
        if match:
            logits = clf(e1)
            pr = torch.argmax(logits, dim=1).item()
            priority = 'high' if pr == 1 else 'low'
        return match, sim_score, priority
