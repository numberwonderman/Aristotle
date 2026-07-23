"""
evaluate_onnx.py

Evaluates the exported validator.onnx model using ONNX Runtime.
This measures the actual model deployed in Aristotle.

Run:
    python evaluate_onnx.py
"""

import onnxruntime as ort
import pandas as pd
import numpy as np


# -----------------------------
# 1. Load dataset
# -----------------------------

data = pd.read_csv("training_data.csv")

# Same split logic used during evaluation
data = data.sample(frac=1, random_state=42).reset_index(drop=True)

split_idx = int(len(data) * 0.8)

test_data = data.iloc[split_idx:]

X_test = test_data[
    ["op", "lhs_delta", "rhs_delta"]
].values.astype(np.float32)

y_test = test_data[
    "is_valid"
].values.astype(np.int32)


print(f"Evaluating ONNX model on {len(test_data)} held-out samples.")


# -----------------------------
# 2. Load ONNX model
# -----------------------------

session = ort.InferenceSession(
    "validator.onnx",
    providers=["CPUExecutionProvider"]
)

input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name


print("ONNX input:", input_name)
print("ONNX output:", output_name)


# -----------------------------
# 3. Run inference
# -----------------------------

predictions = []
probabilities = []

for sample in X_test:

    tensor = np.array(
        [sample],
        dtype=np.float32
    )

    output = session.run(
        [output_name],
        {input_name: tensor}
    )

    probability = float(output[0][0][0])

    probabilities.append(probability)

    predictions.append(
        1 if probability > 0.5 else 0
    )


predictions = np.array(predictions)
probabilities = np.array(probabilities)


# -----------------------------
# 4. Metrics
# -----------------------------

tp = np.sum((predictions == 1) & (y_test == 1))
tn = np.sum((predictions == 0) & (y_test == 0))
fp = np.sum((predictions == 1) & (y_test == 0))
fn = np.sum((predictions == 0) & (y_test == 1))


accuracy = (tp + tn) / len(y_test)

precision = tp / (tp + fp) if (tp + fp) else 0

recall = tp / (tp + fn) if (tp + fn) else 0

f1 = (
    2 * precision * recall / (precision + recall)
    if precision + recall
    else 0
)


# -----------------------------
# 5. Confusion Matrix
# -----------------------------

print("\n--- Confusion Matrix ---")

print("""
                 Predicted
              VALID   INVALID

Actual VALID   {:4}     {:4}

Actual INVALID {:4}     {:4}
""".format(
    tp, fn,
    fp, tn
))


print("--- ONNX Test Results ---")
print(f"Accuracy:  {accuracy * 100:.2f}%")
print(f"Precision: {precision:.3f}")
print(f"Recall:    {recall:.3f}")
print(f"F1 Score:  {f1:.3f}")


# -----------------------------
# 6. Show worst false positives
# -----------------------------

print("\n--- False Positive Examples ---")

false_positive_indexes = np.where(
    (predictions == 1) &
    (y_test == 0)
)[0]


for i in false_positive_indexes[:10]:

    print(
        f"Input={X_test[i].tolist()} "
        f"confidence={probabilities[i]:.4f}"
    )


# -----------------------------
# 7. Edge cases
# -----------------------------

print("\n--- Edge Cases ---")

edge_cases = [
    ("valid 5/5", [0,5,5]),
    ("valid 15/15", [1,15,15]),
    ("invalid 5/9", [0,5,9]),
    ("hard invalid 5/7", [0,5,7]),
    ("outside range 50/50", [1,50,50]),
]


for name, values in edge_cases:

    tensor = np.array(
        [values],
        dtype=np.float32
    )

    output = session.run(
        [output_name],
        {input_name:tensor}
    )

    prob = float(output[0][0][0])

    print(
        f"{name}: "
        f"{prob:.4f} -> "
        f"{'VALID' if prob > .5 else 'INVALID'}"
    )
