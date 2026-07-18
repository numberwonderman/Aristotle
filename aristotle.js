export class AristotleEngine {
    constructor() {
        this.history = [];
        this.isReady = false;
        this.session = null;
        this.lastValidatedStep = null; // holds {op, value} only when processInput confirms a real balancing step
    }

    async initialize() {
        try {
            // Path corrected to match your 'trainer' folder structure
            this.session = await ort.InferenceSession.create('./trainer/validator.onnx');
            this.isReady = true;
            console.log("Aristotle Engine: Ready. Input node name:", this.session.inputNames[0]);
        } catch (e) {
            console.error("Engine failed to initialize:", e);
            this.isReady = false;
            throw e;
        }
    }

    /**
     * The core brain: Dynamically analyzes deductions and algebra transitions.
     * Reordered: Structural 'if...then' logic now takes priority.
     */
    processInput(input) {
        this.history.push(input);
        const text = input.toLowerCase().trim();

        // Reset each call — only set below if we confirm a real balancing step
        this.lastValidatedStep = null;

        if (text.length < 3) {
            return "That's a bit brief, my friend. Can you formalize that step further?";
        }

        const templates = {
            equationState: (eq) => `You've established the equation "${eq}". What is your next strategic move to begin isolating the variable?`,
            algebraBalance: (op, val) => `I see you are attempting to balance the equation. If you ${op} ${val} from one side, did you rigorously apply the exact same operation to the other side?`,
            definition: (concept) => `You've introduced the concept of "${concept}". What formal axiom or foundational definition allows you to establish this state?`,
            implication: (cause, effect) => `If we accept that "${cause}", does "${effect}" necessarily follow in all boundary conditions, or are there edge cases to consider?`,
            generic: "An interesting assertion. How does this logical step derive directly from your previous assumptions or axioms?"
        };

        // 1. PRIORITIZED: Structural Implications (if/then)
        if (text.includes("if") && text.includes("then")) {
            const match = input.match(/if\s+(.*?),\s*then\s+(.*)/i);
            if (match && match[1] && match[2]) {
                return templates.implication(match[1].trim(), match[2].trim());
            }
        }

        // 2. Mathematical State/Equality
        if (text.includes("=")) {
            const hasActionKeyword = /(sub|add|minus|drop|move|isolate|divide|mult|\+|-)/i.test(text.replace(/^[a-z0-9\s\+\-\*\/\(\)]+=/, ''));

            if (!hasActionKeyword && text.match(/^([a-z0-9\s\+\-\*\/\(\)]+)=([a-z0-9\s\+\-\*\/\(\)]+)$/i)) {
                // NEW: bare equation — check if it's a simple numeric equality first.
                // This is plain arithmetic, not a learned judgment, so no model call needed.
                const [lhsRaw, rhsRaw] = input.split('=');
                const lhs = parseFloat(lhsRaw);
                const rhs = parseFloat(rhsRaw);

                if (!isNaN(lhs) && !isNaN(rhs)) {
                    const isTrue = lhs === rhs;
                    return isTrue
                        ? `You've established the true equation "${input.trim()}". What is your next strategic move to begin isolating the variable?`
                        : `Hold on — is "${input.trim()}" actually a true statement? Double check that before we continue.`;
                }

                // Non-numeric equation (e.g. contains variables) — fall back to original behavior
                return templates.equationState(input.trim());
            }

            const algebraicMove = text.match(/(sub|add|minus|\+|-)\s*([0-9a-z\s\^\*]+)$/i);
            if (algebraicMove) {
                let operation = algebraicMove[1].toLowerCase();
                let value = algebraicMove[2].trim();

                if (operation === '+' || operation === 'add') operation = 'add';
                if (operation === '-' || operation === 'sub' || operation === 'minus') operation = 'subtract';

                // Only mark this as a validated balancing step if the value is a clean number
                const numericValue = parseFloat(value);
                if (!isNaN(numericValue)) {
                    this.lastValidatedStep = { op: operation, value: numericValue };
                }

                return templates.algebraBalance(operation, value);
            }
        }

        // 3. Keyword-based heuristics (Fallback)
        const mathKeywords = ["parity", "even", "odd", "integer", "bounded", "continuous", "limit", "sequence", "trajectory"];
        for (const keyword of mathKeywords) {
            if (text.includes(keyword)) {
                return templates.definition(keyword);
            }
        }

        return templates.generic;
    }

    /**
     * Evaluates a mathematical deduction step via real on-device ONNX inference.
     * Only runs the model if processInput already confirmed this was a real
     * balancing step (this.lastValidatedStep). No independent re-parsing of raw text.
     */
    async evaluateProofStep(userText) {
        if (!this.isReady) return { latency: 0, isValid: false, probability: 0, status: "Engine not initialized" };

        // GUARDRAIL: don't call the model unless processInput already confirmed
        // this text represents an actual balancing-step transformation.
        if (!this.lastValidatedStep) {
            return { latency: 0, isValid: false, probability: 0, status: "Not a balancing step — model not invoked" };
        }

        const t0 = performance.now();

        try {
            const { op: operation, value } = this.lastValidatedStep;
            const op = operation === 'add'
