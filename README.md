# 🏛️ Project Aristotle

An optimized, on-device, logic-based mathematical tutoring engine designed for mobile accessibility. Built specifically for the **Arm AI Optimization Challenge (Mobile AI Track)**.

---

## 👁️ The Vision: A Tutor, Not a Cheating Machine

Aristotle is explicitly designed **not** to be an answer generator or a homework short-cut. Instead, it acts as an **On-Device Socratic Math Guide**. 

### Rooted in Historical Logic
The project is named after the historical philosopher **Aristotle**, the father of formal logic. In ancient Greece, Aristotle pioneered the study of syllogisms and deductive reasoning—the systematic framework showing how premises logically connect to valid conclusions. Project Aristotle modernizes this exact philosophy. It doesn't focus on arithmetic; it focuses on *validity*.

Traditional AI tools often undermine learning by instantly giving students the final product. Aristotle shifts the focus back to the learning process:
* **Step-by-Step Logic Verification:** Just like the historical Socratic method, students input their own mathematical deductions and proof steps. 
* **Deductive Guidance:** The local engine parses the structural flow of the math, acting as an interactive guardrail that highlights logic breakdowns without just handing out answers.
* **Equity & Autonomy:** By running fully local on-device, Aristotle requires zero internet or data connectivity, providing immediate, high-tier educational support to students anytime, anywhere.

---

## 🛠️ Architecture Overview

The workspace is intentionally engineered to be lightweight, responsive, and completely self-contained for maximum performance-per-watt efficiency on Arm silicon.

* **`index.html`** - A distraction-free, highly accessible user interface built with semantic HTML. Natively supports screen readers, keyboard navigation, and responsive mobile viewport scaling.
* **`aristotle.js`** - The centralized "brain box" containing the `AristotleEngine` class. This handles the on-device inference pipeline, token tensor evaluation, and memory lifecycle management (including hard-purging model sessions from mobile RAM to keep device overhead minimal).

---

## 🚀 Sandbox Testing

The repository currently runs in a verified local sandbox environment, bypassing physical weight distribution to allow immediate frontend pipeline testing inside a web sandbox (like GitHub Codespaces or VS Code Live Server).

### Local Execution Instructions
1. Clone the repository.
2. Launch the project using your preferred local server (e.g., **Live Server** on port `5500` or Python's `http.server`).
3. Open the browser preview to witness the engine securely initialize the Arm-optimized sandbox layout.