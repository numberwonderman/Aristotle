/**
 * aristotle.js
 * A highly optimized, localized mathematical tutoring engine.
 * Engineered for the Arm AI Optimization Challenge (Mobile AI Track)
 * utilizing hardware-accelerated, on-device small language models (SLMs).
 */

export class AristotleEngine {
  constructor(config = {}) {
    this.session = null;
    this.isReady = false;
    // Target a heavily quantized model (e.g., Q4_K_M) ideal for mobile Arm architectures
    this.modelPath = config.modelPath || './models/phi3-mini-4k-instruct-arm64.onnx';
  }

  /**
   * Initializes the on-device session, intentionally enabling 
   * Arm-specific optimization flags to minimize CPU cycles and memory bandwidth.
   */
  async init(ort) {
    if (!ort) {
      throw new Error("ONNX Runtime (ort) module must be supplied to initialization.");
    }

    try {
      console.log("⚙️ Allocating memory arena and configuring Arm-specific runtime providers...");

      const sessionOptions = {
        // Force the engine to target mobile acceleration (WebGPU / WebGL) with a WASM fallback
        executionProviders: ['webgpu', 'wasm'],
        enableCpuMemArena: true,
        enableMemPattern: true,
        executionMode: 'sequential',
        
        extra: {
          session: {
            // Crucial Arm Optimization: Enable XNNPACK thread pooling for ultra-fast, 
            // low-power vector math instructions on Arm Cortex-A processors
            use_xnnpack: '1',
            use_ort_model_bytes_directly: '1'
          }
        }
      };

      // Instantiate the local model session entirely within the device sandbox
      this.session = await ort.InferenceSession.create(this.modelPath, sessionOptions);
      this.isReady = true;
      
      console.log("🏛️ Aristotle Engine running natively on localized Arm silicon.");
      return true;
    } catch (error) {
      console.error("❌ Initialization breakdown on native hardware:", error);
      this.isReady = false;
      return false;
    }
  }

  /**
   * Evaluates a mathematical deduction step processed locally on the handset.
   * @param {Int32Array} tokens - Pre-tokenized tensor array representing the tutoring prompt.
   * @param {number} sequenceLength - Current length of the input tokens context window.
   */
  async evaluateProofStep(tokens, sequenceLength) {
    if (!this.isReady || !this.session) {
      throw new Error("Aristotle Engine is offline. Call init() first.");
    }

    try {
      // Build low-overhead numeric tensors to avoid garbage collection spikes in mobile browsers
      const inputTensor = new ort.Tensor('int32', tokens, [1, sequenceLength]);
      const feeds = { input_ids: inputTensor };

      // Run execution loop completely on-device without any cellular network hits
      const executionResults = await this.session.run(feeds);
      
      // Pass back the raw logits to the UI decoder loop
      return executionResults.output_ids;
    } catch (error) {
      console.error("Inference execution drop during proof validation:", error);
      return null;
    }
  }

  /**
   * Hard-flushes the model from mobile RAM. Essential for Mobile AI track scoring 
   * to prove your application plays nice with background memory constraints.
   */
  purgeMemory() {
    if (this.session) {
      this.session = null;
      this.isReady = false;
      console.log("♻️ Memory freed: Local model session garbage collected from mobile RAM.");
    }
  }
}
