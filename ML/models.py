import torch
import torch.nn as nn
import torchvision.models as models


class EmbeddingNet(nn.Module):
    def __init__(self, pretrained=True):
        super().__init__()
        backbone = models.resnet18(pretrained=pretrained)
        # remove final fc
        modules = list(backbone.children())[:-1]
        self.feature = nn.Sequential(*modules)
        self.fc = nn.Linear(backbone.fc.in_features, 256)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.feature(x)  # (B, feat, 1,1)
        x = x.flatten(1)
        x = self.fc(x)
        x = self.relu(x)
        return x


class SiameseNetwork(nn.Module):
    def __init__(self, embedding_net):
        super().__init__()
        self.embedding = embedding_net

    def forward(self, x1, x2):
        e1 = self.embedding(x1)
        e2 = self.embedding(x2)
        return e1, e2


class PriorityClassifier(nn.Module):
    def __init__(self, embedding_dim=256, pretrained=False):
        super().__init__()
        self.classifier = nn.Sequential(
            nn.Linear(embedding_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 2)
        )

    def forward(self, emb):
        return self.classifier(emb)
