import torch
import torch.nn as nn
import pandas as pd

# 1. Load the data
data = pd.read_csv('training_data.csv')
features = torch.tensor(data[['op', 'lhs', 'rhs']].values, dtype=torch.float32)
labels = torch.tensor(data['is_valid'].values, dtype=torch.float32).unsqueeze(1)

# 2. Define the model
model = nn.Sequential(nn.Linear(3, 8), nn.ReLU(), nn.Linear(8, 1), nn.Sigmoid())

# 3. Train
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
criterion = nn.BCELoss()

for _ in range(100):
    optimizer.zero_grad()
    loss = criterion(model(features), labels)
    loss.backward()
    optimizer.step()

# 4. Export
dummy_input = torch.randn(1, 3)
torch.onnx.export(model, dummy_input, "validator.onnx", opset_version=14)
print("Trainer complete: validator.onnx exported.")
