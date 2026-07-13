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
📊 Current Status (Honest Accounting)
Working and verified:
ONNX model loads and runs real inference in-browser (confirmed via console logging of input tensors and output probabilities across multiple test cases, producing varied, non-constant results).
Training and inference use a consistent, unnormalized feature scale — a normalization mismatch present in an earlier version has been identified and fixed.
The rule-based Socratic questioning engine is fully functional independent of the model.
In progress / not yet verified:
Hardware execution provider (e.g., WASM vs. actual NEON/SIMD acceleration on Arm silicon) has not yet been explicitly confirmed — latency and memory figures reported in the UI reflect real performance.now() measurements, but specific acceleration backend claims are not yet verified against real Arm hardware.
PWA installability (manifest icons, service worker registration) is being finalized.
The current validator model is intentionally small and trained on synthetic, narrowly-scoped data (algebra balancing steps only) — it is a proof-of-concept for real on-device inference, not a general mathematical reasoning system.
🚀 Running Locally
Clone the repository.
Serve the root directory with any static file server (e.g., VS Code Live Server, Python's http.server).
Open index.html in a browser. The engine will load trainer/validator.onnx on page load.
To retrain the model:
Bash
📄 License
MIT License — free to use, modify, and distribute.
