# 🏛️ Project Aristotle

An on-device, logic-based mathematical tutoring engine built for the Arm AI Optimization Challenge (Mobile AI Track).

---

# 👁️ The Vision: A Tutor, Not a Cheating Machine

Aristotle is explicitly designed to be an answer-free mathematical reasoning guide, not a homework shortcut.

Instead of solving problems for students, Aristotle helps students examine their own reasoning through an on-device Socratic tutoring approach.

## Rooted in Historical Logic

The project is named after the historical philosopher Aristotle, who pioneered formal logic and deductive reasoning.

Ancient logical systems focused on one central question:

> Does a conclusion actually follow from the premises?

Project Aristotle modernizes that idea for mathematics. It does not focus on generating answers; it focuses on verifying whether a student's reasoning step is logically valid.

## Core Principles

- **Step-by-Step Logic Verification**  
  Students enter their own mathematical deductions and proof steps.

- **Deductive Guidance**  
  A local rule-based engine analyzes mathematical structure and generates Socratic questions rather than revealing solutions.

- **On-Device AI Validation**  
  A small neural network runs completely locally in the browser through ONNX Runtime Web to verify whether algebraic balancing operations were applied correctly.

- **Privacy and Accessibility**  
  No server inference is required. Once loaded, the application runs entirely client-side.

---

# 🛠️ Architecture Overview

```

index.html
│
├── Accessible UI
│   ├── Screen reader support
│   ├── Keyboard navigation
│   └── Responsive mobile layout
│
├── aristotle.js
│   └── AristotleEngine
│       ├── Socratic rule-based reasoning layer
│       ├── Mathematical structure parser
│       └── ONNX Runtime Web inference
│
└── trainer/
├── data_generator.py
├── trainer.py
├── evaluate_onnx.py
└── validator.onnx

```

## AristotleEngine

The engine combines two separate systems:

### 1. Rule-Based Socratic Layer

The primary tutoring logic.

It handles:

- Equation states
- Algebra operation detection
- If/then logical statements
- Mathematical concept prompts

The goal is not to solve the student's problem, but to ask questions that encourage reflection.

### 2. ONNX Validator

The AI validation layer loads:

```

trainer/validator.onnx

```

using:

```

onnxruntime-web

```

The model performs real neural-network inference, but only after the parser confirms that the input represents a valid algebra balancing step.

---

# 🔒 Model Gatekeeping

Earlier versions attempted to send any two numbers found in user input into the neural network.

This created meaningless predictions for inputs outside the model's purpose, such as:

```

2+3=5

```

The architecture was corrected:

1. The parser identifies whether the input represents a genuine balancing operation.
2. Only confirmed balancing steps are sent to the ONNX model.
3. Unsupported inputs are handled by the Socratic rule engine.

If the input is not applicable:

```

Not a balancing step — model not invoked

```

is returned instead of an unsupported prediction.

## Independent Side Extraction

The parser extracts transformations independently from both sides.

Example:

```

x + 7 = x + 5

```

becomes:

```

lhs_delta = 7
rhs_delta = 5

```

This allows the validator to detect real mismatches.

---

# 🤖 Validator Model

The ONNX validator is a small feedforward neural network:

```

4 → 8 → 1

```

Input features:

```

[
op,
lhs_delta,
rhs_delta,
delta_difference
]

```

Where:

- `op`
  - `1` = addition
  - `0` = subtraction

- `lhs_delta`
  - Value applied to the left side

- `rhs_delta`
  - Value applied to the right side

- `delta_difference`
  - Difference between the two applied values

The validator is intentionally narrow. It does not attempt general mathematical reasoning.

It evaluates one specific property:

> Was the same addition/subtraction transformation applied independently to both sides of an equation?

---

# 📊 Current Status

## Working and Verified

✅ ONNX model loads and runs inference in-browser  
✅ ONNX Runtime Web integration complete  
✅ Browser inference matches ONNX evaluation pipeline  
✅ Rule-based Socratic tutoring engine functional  
✅ Model gatekeeping prevents unsupported inference  
✅ Parser extracts both sides independently  
✅ PWA installable  
✅ Service worker supports offline operation  
✅ AI toggle disables inference completely  

---

# 📱 Arm Hardware Verification

The application was tested on a Samsung Galaxy phone using Arm-based hardware.

Confirmed:

- Fully local inference
- No network dependency after loading
- Real browser ONNX inference

Measured latency:

```

First inference:
~53 ms

Steady-state inference:
2-4 ms

```

Measured steady-state runs:

```

2ms
3ms
3ms
3ms
4ms

```

---

# 🧪 Model Evaluation

The validator model was evaluated using ONNX Runtime on a held-out test split.

Evaluation artifact:

```

trainer/aristotle_validator_results.txt

```

Configuration:

```

Model:
validator.onnx

Runtime:
ONNX Runtime CPUExecutionProvider

Held-out samples:
400

```

## Results

| Metric | Score |
|---|---:|
| Accuracy | 100.00% |
| Precision | 1.000 |
| Recall | 1.000 |
| F1 Score | 1.000 |

## Confusion Matrix

```

```
             Predicted
          VALID   INVALID
```

Actual VALID    203        0

Actual INVALID    0      197

```

## Edge Validation

```

valid +5/+5:
0.9943 -> VALID

valid -10/-10:
0.9527 -> VALID

valid large 100/100:
0.9970 -> VALID

invalid 5/9:
0.0000 -> INVALID

hard invalid 5/7:
0.0000 -> INVALID

near miss 100/99:
0.1106 -> INVALID

```

---

# 🔭 Expansion Plans

The architecture is modular and can expand beyond algebra balancing.

Future work:

## Multiplication and Division

Requires:

- New feature representation
- New labeled dataset
- Model retraining

## Broader Numerical Support

Future versions could support:

- Negative values
- Decimals
- Larger integers

with additional training data.

## Improved Validation

Potential improvements:

- Larger datasets
- More difficult boundary cases
- More algebra transformations

## Additional Domains

Possible extensions:

- Inequalities
- Geometry reasoning
- Proof verification
- Symbolic mathematics

---

# 🚀 Running Locally

Clone the repository.

Serve the root directory using a static file server:

Examples:

```

VS Code Live Server

````

or:

```bash
python -m http.server
````

Open:

```
index.html
```

The engine automatically loads:

```
trainer/validator.onnx
```

---

# 🔧 Retraining the Model

```bash
cd trainer

pip install -r requirements.txt

python data_generator.py

python trainer.py
```

Evaluate:

```bash
python evaluate_onnx.py
```

---

# 📄 License

MIT License — free to use, modify, and distribute

