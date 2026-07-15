🏛️ Project Aristotle

An on-device, logic-based mathematical tutoring engine, built for the Arm AI Optimization Challenge (Mobile AI Track).


👁️ The Vision: A Tutor, Not a Cheating Machine

Aristotle is explicitly designed not to be an answer generator or a homework short-cut. Instead, it acts as an On-Device Socratic Math Guide.

Rooted in Historical Logic

The project is named after the historical philosopher Aristotle, the father of formal logic. In ancient Greece, Aristotle pioneered the study of syllogisms and deductive reasoning — the systematic framework showing how premises logically connect to valid conclusions. Project Aristotle modernizes this exact philosophy. It doesn't focus on arithmetic; it focuses on validity.


Step-by-Step Logic Verification: Students input their own mathematical deductions and proof steps.
Deductive Guidance: A rule-based local engine parses the structural flow of the math and generates targeted Socratic questions — highlighting logic breakdowns without handing out answers.
On-Device AI Validation: A small trained neural network, running fully in-browser via ONNX Runtime Web, checks whether an algebraic balancing step was applied correctly (e.g., the same value subtracted or added to both sides of an equation).
Equity & Autonomy: The engine runs fully client-side with no server round-trip required for inference, once the page and model are loaded.



🛠️ Architecture Overview


index.html — A distraction-free, accessible UI. Supports screen readers, keyboard navigation, and responsive mobile viewport scaling.
aristotle.js — The AristotleEngine class. Combines:

Rule-based Socratic templating (regex-driven parsing of equation states, algebra moves, and if/then implications) — this is the primary tutoring logic.
Real ONNX inference — loads trainer/validator.onnx via onnxruntime-web's ort.InferenceSession, and runs actual forward-pass inference on parsed input to flag whether a step was correctly balanced.



trainer/ — Python training pipeline:

data_generator.py — generates synthetic training examples of correctly/incorrectly balanced algebra steps.
trainer.py — trains a small feedforward network (3 → 8 → 1) on that data and exports it to validator.onnx.


The parser and the ONNX validator are decoupled by design — see 🔭 Expansion Plans below.


📊 Current Status (Honest Accounting)

Working and verified:


ONNX model loads and runs real inference in-browser (confirmed via console logging of input tensors and output probabilities across multiple test cases, producing varied, non-constant results).
Training and inference use a consistent, unnormalized feature scale — a normalization mismatch present in an earlier version has been identified and fixed.
The rule-based Socratic questioning engine is fully functional independent of the model.
PWA installable — manifest icons and service worker registration confirmed working.


In progress / not yet verified:


Hardware execution provider (e.g., WASM vs. actual NEON/SIMD acceleration on Arm silicon) has not yet been explicitly confirmed on real Arm hardware — latency and memory figures reported in the UI reflect real performance.now() measurements, but specific acceleration backend claims are still unverified against physical Arm silicon. Testing on an Arm-based phone is planned to resolve this.
AI-off toggle — a control letting the student disable the ONNX validator and use the rule-based Socratic engine standalone is not yet implemented.
The current validator model is intentionally small and trained on synthetic, narrowly-scoped data (algebra balancing steps only) — it is a proof-of-concept for real on-device inference, not a general mathematical reasoning system.



🔭 Expansion Plans

The parser and validator model are modular by design: the regex-driven parsing layer and the ONNX inference step are decoupled from algebra-specific logic, so both pieces can be swapped independently to support other math domains (e.g., geometry, inequalities) without rearchitecting the engine.

Planned next steps:

Real-device testing on Arm-based phone hardware to confirm NEON/SIMD acceleration claims currently only measured via performance.now().
AI-off toggle so the rule-based Socratic engine can run standalone without the ONNX validator.
Extending the parser/validator pair to additional math domains beyond algebra balancing.


🧪 Model Evaluation

The validator model was evaluated on a held-out test split (80% train / 20% test, 2,000 total synthetic examples) that it never saw during training:

MetricScoreAccuracy95.00% (380/400 correct)Precision0.910Recall1.000F1 Score0.953

A recall of 1.000 means the model never incorrectly flags a genuinely valid algebra step as invalid — an important property for a tutoring tool, where falsely telling a student their correct work is wrong would undermine trust in the guide.

Edge case checks, including inputs outside the training data's 1–20 range, confirmed the model generalizes correctly rather than breaking down:

CaseModel OutputCorrect?Matching deltas (5, 5), subtract0.90 → VALID✅Matching deltas (15, 15), add0.92 → VALID✅Mismatched deltas (5, 9), subtract0.02 → INVALID✅Matching deltas outside training range (50, 50)0.95 → VALID✅Zero deltas (0, 0)0.86 → VALID✅

This is a small, narrowly-scoped classifier by design — it validates one specific pattern (equal-value operations applied to both sides of an equation) rather than performing general mathematical reasoning. The evaluation above is intended to honestly characterize what it does and does not do, rather than overstate its capabilities.

To reproduce these results: cd trainer && python evaluate_model.py


🚀 Running Locally


Clone the repository.
Serve the root directory with any static file server (e.g., VS Code Live Server, Python's http.server).
Open index.html in a browser. The engine will load trainer/validator.onnx on page load.


To retrain the model:

bashcd trainer
pip install -r requirements.txt
python data_generator.py   # produces training_data.csv
python trainer.py          # trains and exports validator.onnx


📄 License

MIT License — free to use, modify, and distribute.
