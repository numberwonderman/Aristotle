"""
evaluate_model.py

Trains the validator model on a train/test split (rather than all data at
once) and reports real accuracy on data the model never saw during
training. This gives an honest measure of how well the model generalizes,
rather than just reporting training loss.

Run this after data_generator.py has produced training_data.csv.
This does NOT overwrite validator.onnx — it's purely for reporting metrics.
"""

import torch
import torch.nn as nn
import pandas as pd
import numpy as np

# 1. Load and split the data
data = pd.read_csv('training_data.csv')
data = data.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle

split_idx = int(len(data) * 0.8)
train_data = data.iloc[:split_idx]
test_data = data.iloc[split_idx:]

train_features = torch.tensor(train_data[['op', 'lhs_delta', 'rhs_delta']].values, dtype=torch.float32)
train_labels = torch.tensor(train_data['is_valid'].values, dtype=torch.float32).unsqueeze(1)

test_features = torch.tensor(test_data[['op', 'lhs_delta', 'rhs_delta']].values, dtype=torch.float32)
test_labels = torch.tensor(test_data['is_valid'].values, dtype=torch.float32).unsqueeze(1)

print(f"Training on {len(train_data)} samples, evaluating on {len(test_data)} held-out samples.")

# 2. Define and train the model (same architecture as trainer.py)
model = nn.Sequential(nn.Linear(3, 8), nn.ReLU(), nn.Linear(8, 1), nn.Sigmoid())
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
criterion = nn.BCELoss()

for epoch in range(500):
    optimizer.zero_grad()
    loss = criterion(model(train_features), train_labels)
    loss.backward()
    optimizer.step()

print(f"Final training loss: {loss.item():.4f}")

# 3. Evaluate on held-out test data
model.eval()
with torch.no_grad():
    test_predictions = model(test_features)
    predicted_labels = (test_predictions > 0.5).float()

    correct = (predicted_labels == test_labels).sum().item()
    total = test_labels.size(0)
    accuracy = correct / total

    # Precision / Recall / F1 for the "valid" class
    true_positives = ((predicted_labels == 1) & (test_labels == 1)).sum().item()
    false_positives = ((predicted_labels == 1) & (test_labels == 0)).sum().item()
    false_negatives = ((predicted_labels == 0) & (test_labels == 1)).sum().item()

    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

print("\n--- Held-Out Test Set Results ---")
print(f"Accuracy:  {accuracy * 100:.2f}%  ({correct}/{total} correct)")
print(f"Precision: {precision:.3f}")
print(f"Recall:    {recall:.3f}")
print(f"F1 Score:  {f1:.3f}")

# 4. Sanity-check edge cases: does the model generalize past the training range?
print("\n--- Edge Case Sanity Checks ---")
edge_cases = [
    ("op=0, matching deltas (5,5) — should be VALID", [0, 5, 5]),
    ("op=1, matching deltas (15,15) — should be VALID", [1, 15, 15]),
    ("op=0, mismatched deltas (5,9) — should be INVALID", [0, 5, 9]),
    ("op=1, extreme value outside training range (50,50)", [1, 50, 50]),
    ("op=0, zero deltas (0,0)", [0, 0, 0]),
]

model.eval()
with torch.no_grad():
    for label, values in edge_cases:
        tensor_input = torch.tensor([values], dtype=torch.float32)
        prob = model(tensor_input).item()
        verdict = "VALID" if prob > 0.5 else "INVALID"
        print(f"{label}: prob={prob:.4f} -> {verdict}")
