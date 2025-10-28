import torch
import torch.nn.functional as F
import argparse
import yaml
from sklearn.metrics import f1_score
from data_loader import PairedImageDataset
from torch.utils.data import DataLoader
from models import EmbeddingNet, SiameseNetwork, PriorityClassifier
from utils import default_transforms
from losses import contrastive_loss


def train_epoch(siamm, clf, loader, opt_siam, opt_clf, device, margin):
    siamm.train()
    clf.train()
    total_loss = 0.0
    for drone_imgs, user_imgs, matches, priorities in loader:
        drone_imgs, user_imgs, matches, priorities = drone_imgs.to(device), user_imgs.to(device), matches.to(device), priorities.to(device)
        opt_siam.zero_grad()
        opt_clf.zero_grad()
        e1, e2 = siamm(drone_imgs, user_imgs)
        loss_siam = contrastive_loss(e1, e2, matches, margin)
        # For classifier, only train on positive pairs
        mask = matches == 1
        if mask.any():
            emb_pos = e1[mask]
            pri_pos = priorities[mask]
            logits = clf(emb_pos)
            loss_clf = F.cross_entropy(logits, pri_pos)
        else:
            loss_clf = torch.tensor(0.0, device=device)
        loss = loss_siam + loss_clf
        loss.backward()
        opt_siam.step()
        opt_clf.step()
        total_loss += loss.item()
    return total_loss / len(loader)


def eval_epoch(siamm, clf, loader, device, margin):
    siamm.eval()
    clf.eval()
    sims = []
    labs = []
    pri_preds = []
    pri_trues = []
    with torch.no_grad():
        for drone_imgs, user_imgs, matches, priorities in loader:
            drone_imgs, user_imgs, matches, priorities = drone_imgs.to(device), user_imgs.to(device), matches.to(device), priorities.to(device)
            e1, e2 = siamm(drone_imgs, user_imgs)
            dist = F.pairwise_distance(e1, e2)
            sim_score = 1.0 / (1.0 + dist)
            sims.extend(sim_score.cpu().numpy().tolist())
            labs.extend(matches.cpu().numpy().tolist())
            # For priority, only on positive pairs
            mask = matches == 1
            if mask.any():
                emb_pos = e1[mask]
                logits = clf(emb_pos)
                preds = torch.argmax(logits, dim=1).cpu().numpy().tolist()
                pri_preds.extend(preds)
                pri_trues.extend(priorities[mask].cpu().numpy().tolist())
    # compute simple thresholds and metrics
    # For similarity, choose threshold by looking at distribution later. Here we'll compute ROC/AUC elsewhere.
    pri_f1 = None
    if len(pri_trues) > 0:
        pri_f1 = f1_score(pri_trues, pri_preds, average='binary')
    return sims, labs, pri_f1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', default='config.yaml')
    args = parser.parse_args()
    cfg = yaml.safe_load(open(args.config))
    device = torch.device(cfg['training']['device'] if torch.cuda.is_available() else 'cpu')

    train_trans = default_transforms(cfg['dataset']['img_size'], train=True)
    val_trans = default_transforms(cfg['dataset']['img_size'], train=False)

    train_ds = PairedImageDataset(cfg['dataset']['train_pairs_csv'], cfg['dataset']['root'], transform=train_trans)
    val_ds = PairedImageDataset(cfg['dataset']['val_pairs_csv'], cfg['dataset']['root'], transform=val_trans)

    train_loader = DataLoader(train_ds, batch_size=cfg['training']['batch_size'], shuffle=True, num_workers=4)
    val_loader = DataLoader(val_ds, batch_size=cfg['training']['batch_size'], shuffle=False, num_workers=4)

    emb_net = EmbeddingNet(pretrained=True)
    siamm = SiameseNetwork(emb_net).to(device)
    clf = PriorityClassifier(embedding_dim=256).to(device)

    opt_siam = torch.optim.Adam(siamm.parameters(), lr=cfg['training']['lr'])
    opt_clf = torch.optim.Adam(clf.parameters(), lr=cfg['training']['lr'])

    best_val_f1 = -1
    for epoch in range(cfg['training']['epochs']):
        print(f'Epoch {epoch+1}/{cfg['training']['epochs']}')
        train_loss = train_epoch(siamm, clf, train_loader, opt_siam, opt_clf, device, cfg['training']['margin'])
        sims, labs, pri_f1 = eval_epoch(siamm, clf, val_loader, device, cfg['training']['margin'])
        print('Train Loss:', train_loss)
        print('Val priority F1:', pri_f1)
        # save models
        torch.save(siamm.state_dict(), f'checkpoint/siamese_epoch{epoch+1}.pth')
        torch.save(clf.state_dict(), f'checkpoint/priority_epoch{epoch+1}.pth')


if __name__ == '__main__':
    main()
