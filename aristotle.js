4/**
 * aristotle.js
 * A highly optimized, localized mathematical tutoring engine.
 * Engineered for the Arm AI Optimization Challenge (Mobile AI Track)
 * Utilizing ONNX Runtime Web for localized handset execution.
 */

export class AristotleEngine {
    constructor() {
        this.history = [];
        this.isReady = false;
        this.session = null;
    }

    /**
     * Load the ONNX model into memory. 
     * Call this once when your app initializes.
     */
    async initialize() {
        try {
            // Loading model from the trainer directory
            this.session = await ort.InferenceSession.create('./trainer/validator.onnx');
            this.isReady = true;
            console.log("Aristotle Engine: Model loaded and ready.");
        } catch (e) {
            console.error("Failed to load model:", e);
            this.isReady = false;
        }
    }

    /**
     * The core brain: Dynamically analyzes deductions and algebra transitions.
     * @param {string} input - The user's math step.
     */
    processInput(input) {
        this.history.push(input);
        const text = input.toLowerCase().trim();
        
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

        if (text.includes("=")) {
            const hasActionKeyword = /(sub|add|minus|drop|move|isolate|divide|mult|\+|-)/i.test(text.replace(/^[a-z0-9\s\+\-\*\/\(\)]+=/, '')); 
            if (!hasActionKeyword && text.match(/^([a-z0-9\s\+\-\*\/\(\)]+)=([a-z0-9\s\+\-\*\/\(\)]+)$/i)) {
                return templates.equationState(input.trim());
            }
            const algebraicMove = text.match(/(sub|add|minus|\+|-)\s*([0-9a-z\s\^\*]+)$/i);
            if (algebraicMove) {
                let operation = algebraicMove[1].toLowerCase();
                let value = algebraicMove[2].trim();
                if (operation === '+' || operation === 'add') operation = 'add';
                if (operation === '-' || operation === 'sub' || operation === 'minus') operation = 'subtract';
                return templates.algebraBalance(operation, value);
            }
        }

        if (text.includes("if") && text.includes("then")) {
            const match = input.match(/if\s+(.*?),\s*then\s+(.*)/i);
            if (match && match[1] && match[2]) {
                return templates.implication(match[1].trim(), match[2].trim());
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

    /**
     * Evaluates a mathematical deduction step using the ONNX model.
     */
    async evaluateProofStep(tokens, sequenceLength) {
        /**
     * Evaluates a math step by extracting [op, lhs, rhs] features
     * and passing them to the ONNX model.
     */
    async evaluateProofStep(userText) {
        if (!this.isReady) return { status: "Engine not initialized" };

        const startTime = performance.now();

        try {
            // 1. Feature Extraction: Turn text into the 3 numbers the model expects
            // Op: 1 for addition (+), 0 for subtraction (-)
            const op = userText.includes("+") ? 1 : 0;
            
            // Extract numbers (Finds the first two numbers in the string)
            const matches = userText.match(/\d+/g);
            if (!matches || matches.length < 2) {
                return { status: "Could not parse math features", isValid: false };
            }
            
            const lhs_delta = parseFloat(matches[0]);
            const rhs_delta = parseFloat(matches[1]);

            // 2. Prepare Tensor: [1, 3] shape matching your PyTorch nn.Linear(3, 8)
            const tensorInput = new ort.Tensor('float32', Float32Array.from([op, lhs_delta, rhs_delta]), [1, 3]);
            
            // 3. Inference
            const feeds = { [this.session.inputNames[0]]: tensorInput };
            const outputData = await this.session.run(feeds);
            const result = outputData[this.session.outputNames[0]].data[0];

            const endTime = performance.now();
            return {
                latency: (endTime - startTime).toFixed(2),
                isValid: result > 0.5,
                status: "Success"
            };

        } catch (error) {
            console.error("Inference execution error:", error);
            return { status: "Execution Fault", isValid: false };
        }
    }


    /**
     * Hard-flushes the model from mobile RAM.
     */
    purgeMemory() {
        if (this.session) {
            this.session.release();
            this.session = null;
        }
        this.isReady = false;
        console.log("♻️ Memory freed: Model session released.");
    }
}
