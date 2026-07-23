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
Real ONNX inference — loads trainer/validator.onnx via onnxruntime-web's ort.InferenceSession, and runs actual forward-pass inference, but **only on input the parser has already confirmed represents a genuine two-sided balancing step** (see "Gatekeeping" below).

trainer/ — Python training pipeline:

data_generator.py — generates synthetic training examples of correctly/incorrectly balanced algebra steps.
trainer.py — trains a small feedforward network (3 → 8 → 1) on that data and exports it to validator.onnx.


The parser and the ONNX validator are decoupled by design — see 🔭 Expansion Plans below.


🔒 Gatekeeping: The Model Only Speaks When It Knows

Earlier versions of this engine would attempt to extract *any* two numbers from user input and feed them to the model, regardless of whether the input actually represented a balancing step. This produced confident-looking but meaningless output on inputs like a bare arithmetic fact ("2+3=5") — the model would return a probability even though the question being asked didn't match anything it was trained to judge.

This has been fixed at the architecture level: `evaluateProofStep()` now only invokes the ONNX model when the parser (`processInput()`) has independently confirmed the input matches a real balancing-step pattern. If that confirmation isn't present, the engine returns `"Not a balancing step — model not invoked"` rather than guessing.

**Independent extraction from both sides.** A second, subtler version of this problem was found and fixed during testing: an earlier implementation extracted a single value from the input and applied it to both sides of the comparison by construction, which meant the model could never actually see a genuinely mismatched case (e.g., "x+7=x+5") — it would always receive matching numbers regardless of what the user typed. The parser now extracts a delta independently from each side of the equation and passes both to the model separately, so a real mismatch can be — and has been confirmed to be — correctly flagged as invalid.

Bare numeric equations (e.g., "5=5" or "2=5") are handled separately and correctly, via plain arithmetic equality — not the model. This is a deliberate design choice: checking whether two numbers are equal doesn't require a learned judgment, so no model call is made for it. The model is reserved for the one thing it was actually trained to assess: whether a transformation was legitimately applied to both sides.

**In short: the engine is designed to be honest about the boundary of what it knows, rather than producing a confident answer for every input.**


📊 Current Status (Honest Accounting)

Working and verified:

ONNX model loads and runs real inference in-browser (confirmed via console logging of input tensors and output probabilities across multiple test cases, producing varied, non-constant results).
Training and inference use a consistent, unnormalized feature scale — a normalization mismatch present in an earlier version has been identified and fixed.
The rule-based Socratic questioning engine is fully functional independent of the model.
The model is only invoked on input confirmed to be an addition/subtraction balancing step, with independently-extracted values from each side; all other input is handled by the rule-based layer alone, with an explicit "not applicable" status rather than a guessed answer.
Confirmed via live testing that genuinely mismatched steps (e.g., "x+2=x+3") are correctly flagged as invalid by the model.
Bare numeric equality (e.g., "5=5" vs. "2=5") is evaluated correctly via direct arithmetic comparison.
PWA installable — manifest icons and service worker registration confirmed working.
AI-off toggle — a switch in the UI lets the student disable the ONNX validator; when off, no inference call is made and the rule-based Socratic engine responds standalone.

**Verified on real Arm hardware:**

Latency and correctness were measured live on a Samsung Galaxy phone (Arm-based) in airplane mode, confirming both offline capability and real on-device inference performance:

- First inference (model warm-up/compilation): ~53ms
- Steady-state inference (subsequent runs): ~2-4ms, averaged across 5 runs (2ms, 3ms, 3ms, 3ms, 4ms)
- One steady-state run returned an incorrect classification at 66% confidence — a borderline case consistent with the model's documented precision of 0.910 (see Model Evaluation below). This was expected given the ~9% false-positive rate on invalid steps and is not a new bug.

These measurements confirm the engine runs entirely on-device on Arm mobile hardware with no network dependency, at low latency after initial model load.

Known model limitation (not a bug):

The validator model has a measured precision of 0.910 (see Model Evaluation below), meaning roughly 9% of genuinely invalid steps may still be misclassified as valid. This was confirmed directly: "x+2=x+3" was correctly flagged invalid, while "x+5=x+7" was incorrectly passed as valid — and reconfirmed during on-device Arm testing above. This is expected behavior for a classifier at this accuracy level, not a parsing or architecture bug — the parser now correctly delivers real, independent values to the model in all cases. Improving this further would require a larger or more diverse training dataset and a retrain.

Scope boundaries (explicit, not oversights):

**Addition and subtraction only.** Neither the parser nor the model currently recognizes multiplication or division as balancing operations. Input like "divide both sides by 5" will not be evaluated by the model and will fall back to a generic Socratic prompt. This is planned future work (see Expansion Plans), not a bug.
The validator model was trained only on positive integers 1–20; the parser does not currently pass decimals or negative values to it, to avoid feeding the model out-of-distribution input it was never evaluated on.


🔭 Expansion Plans

The parser and validator model are modular by design: the regex-driven parsing layer and the ONNX inference step are decoupled from algebra-specific logic, so both pieces can be swapped independently to support other math domains (e.g., geometry, inequalities) without rearchitecting the engine.

Planned next steps:

**Multiplication/division support.** This requires more than a parser update — balancing a multiplicative step means checking a ratio rather than a delta, which is a different feature definition for the model. This will require a new labeled dataset and a full retrain, not just a parser change.
Support for decimal and negative values, paired with a retrain on an expanded dataset (currently untested at those values).
**Improve model precision** with a larger/more diverse training dataset, to reduce the ~9% rate at which genuinely invalid steps are misclassified as valid.
Broader edge-case evaluation including negative-delta inputs (not yet tested — see Model Evaluation below).
Extending the parser/validator pair to additional math domains beyond algebra balancing.


🧪 Model Evaluation

The validator model was evaluated on a held-out test split (80% train / 20% test, 2,000 total synthetic examples) that it never saw during training:

MetricScoreAccuracy95.00% (380/400 correct)Precision0.910Recall1.000F1 Score0.953

A recall of 1.000 means the model never incorrectly flags a genuinely valid algebra step as invalid — an important property for a tutoring tool, where falsely telling a student their correct work is wrong would undermine trust in the guide. A precision of 0.910 means roughly 9% of invalid steps may be incorrectly passed as valid — confirmed directly during live testing (see Known Limitations above) and reconfirmed during real-device latency testing on Arm hardware.

This is a small, narrowly-scoped classifier trained on positive integers 1–20 — it validates one specific pattern (equal-value add/subtract operations applied independently to both sides of an equation) rather than performing general mathematical reasoning. A limited set of out-of-range and boundary cases were spot-checked and returned correct classifications, but this has not yet been tested systematically (e.g., no negative-delta cases have been evaluated) — that broader sweep is planned before final submission.

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
