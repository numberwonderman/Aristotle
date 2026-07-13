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
            console.log("Aristotle Engine: Ready.");
        } catch (e) {
            console.error("Failed to load model:", e);
            this.isReady = false;
        }
    }

    async evaluateProofStep(userText) {
        if (!this.isReady) return { latency: 0, isValid: false, probability: 0 };

        const startTime = performance.now();

        try {
            // Heuristic Parser: extract 'op' and 'deltas'
            // Maps "Add" to 1, otherwise 0.
            const op = userText.toLowerCase().includes("add") ? 1 : 0;
            const numbers = userText.match(/\d+/g)?.map(Number) || [0, 0];
            
            // Extract the last two numbers found in the sentence as the deltas
            const lhs_delta = numbers.length >= 2 ? numbers[numbers.length - 2] : 0;
            const rhs_delta = numbers.length >= 1 ? numbers[numbers.length - 1] : 0;

            console.log("Feeding to model:", [op, lhs_delta, rhs_delta]);

            const tensorInput = new ort.Tensor('float32', Float32Array.from([op, lhs_delta, rhs_delta]), [1, 3]);
            const feeds = { [this.session.inputNames[0]]: tensorInput };
            
            const outputData = await this.session.run(feeds);
            const result = outputData[this.session.outputNames[0]].data[0];

            return {
                latency: (performance.now() - startTime),
                isValid: result > 0.5,
                probability: result // Key addition for the UI Confidence Bar
            };
        } catch (error) {
            console.error("Inference execution error:", error);
            return { latency: 0, isValid: false, probability: 0 };
        }
    }
}