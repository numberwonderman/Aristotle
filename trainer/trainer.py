import torch
import torch.nn as nn
import pandas as pd

# 1. Load the data
data = pd.read_csv('training_data.csv')

features = torch.tensor(
    data[
        [
            'op',
            'lhs_delta',
            'rhs_delta',
            'delta_difference'
        ]
    ].values,
    dtype=torch.float32
)

labels = torch.tensor(
    data['is_valid'].values,
    dtype=torch.float32
).unsqueeze(1)


# 2. Define the model
# Changed from Linear(3,8) to Linear(4,8)
model = nn.Sequential(
    nn.Linear(4, 8),
    nn.ReLU(),
    nn.Linear(8, 1),
    nn.Sigmoid()
)


# 3. Train
optimizer = torch.optim.Adam(
    model.parameters(),
    lr=0.01
)

criterion = nn.BCELoss()


for epoch in range(500):
    optimizer.zero_grad()

    predictions = model(features)

    loss = criterion(
        predictions,
        labels
    )

    loss.backward()
    optimizer.step()


print(f"Final training loss: {loss.item():.4f}")


# 4. Export ONNX
dummy_input = torch.randn(1, 4)

torch.onnx.export(
    model,
    dummy_input,
    "validator.onnx",
    opset_version=14,
    input_names=["input"],
    output_names=["output"]
)


print("Trainer complete: validator.onnx exported.")