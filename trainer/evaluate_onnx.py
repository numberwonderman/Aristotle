"""
evaluate_onnx.py

Evaluates the exported validator.onnx model using ONNX Runtime.
This measures the actual deployed Aristotle validator.

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

# Shuffle exactly once with fixed seed
data = data.sample(frac=1, random_state=42).reset_index(drop=True)

split_idx = int(len(data) * 0.8)

test_data = data.iloc[split_idx:]

X_test = test_data[
    [
        "op",
        "lhs_delta",
        "rhs_delta",
        "delta_difference"
    ]
].values.astype(np.float32)

y_test = test_data["is_valid"].values.astype(np.int32)

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

    tensor = np.array([sample], dtype=np.float32)

    output = session.run(
        [output_name],
        {input_name: tensor}
    )

    probability = float(output[0][0][0])

    probabilities.append(probability)

    predictions.append(
        1 if probability >= 0.5 else 0
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
# 5. Results
# -----------------------------

print("\n--- Confusion Matrix ---")

print(f"""
                 Predicted
              VALID   INVALID

Actual VALID   {tp:4}     {fn:4}

Actual INVALID {fp:4}     {tn:4}
""")


print("--- ONNX Test Results ---")
print(f"Accuracy:  {accuracy * 100:.2f}%")
print(f"Precision: {precision:.3f}")
print(f"Recall:    {recall:.3f}")
print(f"F1 Score:  {f1:.3f}")


# -----------------------------
# 5b. Confidence Statistics
# -----------------------------

print("\n--- Confidence Statistics ---")

valid_confidence = probabilities[y_test == 1].mean()
invalid_confidence = (1 - probabilities[y_test == 0]).mean()

print(f"Minimum raw output: {probabilities.min():.4f}")
print(f"Maximum raw output: {probabilities.max():.4f}")
print(f"Average VALID confidence:   {valid_confidence:.4f}")
print(f"Average INVALID confidence: {invalid_confidence:.4f}")

# -----------------------------
# 6. False Positives / Negatives
# -----------------------------

print("\n--- False Positive Examples ---")

false_positive_indexes = np.where(
    (predictions == 1) &
    (y_test == 0)
)[0]

if len(false_positive_indexes) == 0:
    print("None 🎉")
else:
    for i in false_positive_indexes[:10]:
        print(
            f"Input={X_test[i].tolist()} "
            f"confidence={probabilities[i]:.4f}"
        )


print("\n--- False Negative Examples ---")

false_negative_indexes = np.where(
    (predictions == 0) &
    (y_test == 1)
)[0]

if len(false_negative_indexes) == 0:
    print("None 🎉")
else:
    for i in false_negative_indexes[:10]:
        print(
            f"Input={X_test[i].tolist()} "
            f"confidence={probabilities[i]:.4f}"
        )


# -----------------------------
# 7. Edge Cases
# -----------------------------

print("\n--- Edge Cases ---")

edge_cases = [
    ("valid +5/+5",          [1, 5, 5, 0]),
    ("valid -10/-10",        [0, -10, -10, 0]),
    ("valid large 100/100",  [1, 100, 100, 0]),

    ("invalid 5/9",          [1, 5, 9, -4]),
    ("hard invalid 5/7",     [0, 5, 7, -2]),
    ("near miss 100/99",     [1, 100, 99, 1]),
]


for name, values in edge_cases:

    tensor = np.array([values], dtype=np.float32)

    output = session.run(
        [output_name],
        {input_name: tensor}
    )

    probability = float(output[0][0][0])

    verdict = (
        "VALID"
        if probability >= 0.5
        else "INVALID"
    )

    print(
        f"{name}: "
        f"{probability:.4f} -> {verdict}"
    )