/**
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

    async initialize() {
        try {
            this.session = await ort.InferenceSession.create('./trainer/validator.onnx');
            this.isReady = true;
            console.log("Aristotle Engine: Model loaded and ready.");
        } catch (e) {
            console.error("Failed to load model:", e);
            this.isReady = false;
        }
    }

    processInput(input) {
        this.history.push(input);
        const text = input.toLowerCase().trim();
        
        if (text.length < 3) return "That's a bit brief, my friend. Can you formalize that step further?";

        const templates = {
            equationState: (eq) => `You've established the equation "${eq}". What is your next strategic move to begin isolating the variable?`,
            algebraBalance: (op, val) => `I see you are attempting to balance the equation. If you ${op} ${val} from one side, did you rigorously apply the exact same operation to the other side?`,
            definition: (concept) => `You've introduced the concept of "${concept}". What formal axiom or foundational definition allows you to establish this state?`,
            implication: (cause, effect) => `If we accept that "${cause}", does "${effect}" necessarily follow in all boundary conditions?`,
            generic: "An interesting assertion. How does this logical step derive directly from your previous assumptions?"
        };

        if (text.includes("=")) {
            const hasActionKeyword = /(sub|add|minus|drop|move|isolate|divide|mult|\+|-)/i.test(text.replace(/^[a-z0-9\s\+\-\*\/\(\)]+=/, '')); 
            if (!hasActionKeyword && text.match(/^([a-z0-9\s\+\-\*\/\(\)]+)=([a-z0-9\s\+\-\*\/\(\)]+)$/i)) return templates.equationState(input.trim());
            
            const algebraicMove = text.match(/(sub|add|minus|\+|-)\s*([0-9a-z\s\^\*]+)$/i);
            if (algebraicMove) {
                let op = algebraicMove[1].toLowerCase() === '+' || algebraicMove[1].toLowerCase() === 'add' ? 'add' : 'subtract';
                return templates.algebraBalance(op, algebraicMove[2].trim());
            }
        }
        return templates.generic;
    }

    /**
     * Evaluates a math step by extracting [op, lhs, rhs] features
     * and passing them to the ONNX model.
     */
    async evaluateProofStep(userText) {
        if (!this.isReady) return { status: "Engine not initialized" };

        const startTime = performance.now();

        try {
            // Feature Extraction
            const op = userText.includes("+") ? 1 : 0;
            const matches = userText.match(/\d+/g);
            if (!matches || matches.length < 2) return { status: "Parse Error", isValid: false };
            
            const lhs_delta = parseFloat(matches[0]);
            const rhs_delta = parseFloat(matches[1]);

            // Tensor creation [1, 3]
            const tensorInput = new ort.Tensor('float32', Float32Array.from([op, lhs_delta, rhs_delta]), [1, 3]);
            
            const feeds = { [this.session.inputNames[0]]: tensorInput };
            const outputData = await this.session.run(feeds);
            const result = outputData[this.session.outputNames[0]].data[0];

            return {
                latency: (performance.now() - startTime).toFixed(2),
                isValid: result > 0.5,
                status: "Success"
            };
        } catch (error) {
            console.error("Inference execution error:", error);
            return { status: "Execution Fault", isValid: false };
        }
    }

    purgeMemory() {
        if (this.session) {
            this.session.release();
            this.session = null;
        }
        this.isReady = false;
    }
}
