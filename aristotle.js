/**
 * aristotle.js
 * Optimized for Arm AI (Mobile AI Track)
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
            console.log("Aristotle Engine: Ready. Input node name:", this.session.inputNames[0]);
        } catch (e) {
            console.error("Failed to load model:", e);
            this.isReady = false;
        }
    }

    processInput(input) {
        this.history.push(input);
        return "Analyzing logical step..."; 
    }

    async evaluateProofStep(userText) {
        if (!this.isReady) return { status: "Engine not initialized", isValid: false };

        const startTime = performance.now();

        try {
            const op = userText.includes("+") ? 1 : 0;
            const matches = userText.match(/\d+/g);
            
            console.log("Debug - Parser extracted:", matches); 
            
            if (!matches || matches.length < 2) return { status: "Parse Error", isValid: false };
            
            // Normalize inputs to match training scale (1-20 range normalized)
            const lhs_delta = parseFloat(matches[0]) / 20.0;
            const rhs_delta = parseFloat(matches[1]) / 20.0;

            console.log("Debug - Feeding to model:", [op, lhs_delta, rhs_delta]);

            // Create Tensor
            const tensorInput = new ort.Tensor('float32', Float32Array.from([op, lhs_delta, rhs_delta]), [1, 3]);
            
            // Use the dynamic input name found in initialize()
            const inputName = this.session.inputNames[0];
            const feeds = { [inputName]: tensorInput };
            
            const outputData = await this.session.run(feeds);
            const result = outputData[this.session.outputNames[0]].data[0];

            console.log("Debug - Model output probability:", result);

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
