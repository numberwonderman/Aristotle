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

    processInput(input) {
        this.history.push(input);
        const text = input.toLowerCase().trim();

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

        if (text.includes("if") && text.includes("then")) {
            const match = input.match(/if\s+(.*?),\s*then\s+(.*)/i);
            if (match && match[1] && match[2]) {
                return templates.implication(match[1].trim(), match[2].trim());
            }
        }

        if (text.includes("=")) {
            const hasActionKeyword = /(sub|add|minus|drop|move|isolate|divide|mult|\+|-)/i.test(text.replace(/^[a-z0-9\s\+\-\*\/\(\)]+=/, ''));

            if (!hasActionKeyword && text.match(/^([a-z0-9\s\+\-\*\/\(\)]+)=([a-z0-9\s\+\-\*\/\(\)]+)$/i)) {
                const [lhsRaw, rhsRaw] = input.split('=');
                const lhs = parseFloat(lhsRaw);
                const rhs = parseFloat(rhsRaw);

                if (!isNaN(lhs) && !isNaN(rhs)) {
                    const isTrue = lhs === rhs;
                    return isTrue
                        ? `You've established the true equation "${input.trim()}". What is your next strategic move to begin isolating the variable?`
                        : `Hold on — is "${input.trim()}" actually a true statement? Double check that before we continue.`;
                }

                return templates.equationState(input.trim());
            }

            const algebraicMove = text.match(/(sub|add|minus|\+|-)\s*([0-9a-z\s\^\*]+)$/i);
            if (algebraicMove) {
                let operation = algebraicMove[1].toLowerCase();
                let value = algebraicMove[2].trim();

                if (operation === '+' || operation === 'add') operation = 'add';
                if (operation === '-' || operation === 'sub' || operation === 'minus') operation = 'subtract';

                const numericValue = parseFloat(value);
                if (!isNaN(numericValue)) {
                    this.lastValidatedStep = { op: operation, value: numericValue };
                }

                return templates.algebraBalance(operation, value);
            }
        }

        const mathKeywords = ["parity", "even", "odd", "integer", "bounded", "continuous", "limit", "sequence", "trajectory"];
        for (const keyword of mathKeywords) {
            if (text.includes(keyword)) {
                return templates.definition(keyword);
            }
        }

        return templates.generic;
    }

    async evaluateProofStep(userText) {
        if (!this.isReady) return { latency: 0, isValid: false, probability: 0, status: "Engine not initialized" };

        if (!this.lastValidatedStep) {
            return { latency: 0, isValid: false, probability: 0, status: "Not a balancing step — model not invoked" };
        }

        const t0 = performance.now();

        try {
            const { op: operation, value } = this.lastValidatedStep;
            const op = operation === 'add' ? 1 : 0;

            const lhs_delta = value;
            const rhs_delta = value;

            const tensor = new ort.Tensor('float32', Float32Array.from([op, lhs_delta, rhs_delta]), [1, 3]);
            const feeds = { [this.session.inputNames[0]]: tensor };
            const output = await this.session.run(feeds);
            const probability = output[this.session.outputNames[0]].data[0];

            return {
                latency: performance.now() - t0,
                isValid: probability > 0.5,
                probability: probability,
                status: "Success"
            };
        } catch (e) {
            console.error("Inference execution error:", e);
            return { latency: 0, isValid: false, probability: 0, status: "Execution Fault" };
        }
    }

    purgeMemory() {
        if (this.session) {
            this.session.release();
            this.session = null;
        }
        this.isReady = false;
        this.lastValidatedStep = null;
    }
}
