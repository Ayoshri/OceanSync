import torch.nn.functional as F


# Contrastive loss


def contrastive_loss(e1, e2, y, margin=1.0):
# y = 1 -> match (positive), y = 0 -> negative
euclidean = F.pairwise_distance(e1, e2)
# if y==1 -> want small distance, else bigger than margin
loss_pos = y * torch.pow(euclidean, 2)
loss_neg = (1 - y) * torch.pow(torch.clamp(margin - euclidean, min=0.0), 2)
return torch.mean(0.5 * (loss_pos + loss_neg))