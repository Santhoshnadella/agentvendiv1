// ============================================================
// Masterclass View — The 12-Step Agent Guide
// ============================================================

import { parseAgentScript } from '../lib/parser.js';
import { state, saveState } from '../lib/state.js';

export function renderMasterclass(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="masterclass-container">
      <div class="masterclass-sidebar">
        <h3>Agent Masterclass</h3>
        <nav class="masterclass-nav">
          <a href="#step-1">1. Define Scope</a>
          <a href="#step-2">2. Core Model</a>
          <a href="#step-3">3. Architecture</a>
          <a href="#step-4">4. Adding Tools</a>
          <a href="#step-7">7. Feedback Loop</a>
          <a href="#step-10">10. Deployment</a>
        </nav>
        
        <div class="quick-script-panel">
          <h4>⚡ Vendi Script (v1.0)</h4>
          <p class="form-hint">Paste a Polymath Agent Generator script (Python-like) below to auto-configure the machine.</p>
          <textarea id="script-paste" class="form-input" rows="6" placeholder="Example: AGENT_CONFIG = { 'name': 'PolymathCoder' } ..."></textarea>
          <button id="btn-import-script" class="btn btn-glow btn-sm" style="width: 100%; margin-top: 10px;">
            Convert Vendi Script
          </button>
        </div>
      </div>

      <div class="masterclass-content">
        <h1 id="step-1">🧠 1. Define the Agent’s Scope</h1>
        <p>Start by narrowing what your agent should do: Debug code, generate specs, refactor, or answer questions.</p>
        
        <h1 id="step-2">⚙️ 2. Choose the Core Model</h1>
        <p>Pick an LLM with strong coding ability (GPT-4/5, Code Llama, DeepSeek). Consider context length and tool-calling ability.</p>
        
        <h1 id="step-3">🧩 3. Design the Agent Architecture</h1>
        <p>A typical coding agent has an Input Layer (Prompt, Codebase, Errors) and a Reasoning Loop (ReAct pattern).</p>

        <h1 id="step-4">🛠️ 4. Add Tools (Critical)</h1>
        <p>Your agent becomes powerful when it can act: File reader/writer, Code executor, Test runner.</p>

        <h1 id="step-5">🔄 5. Implement the Agent Loop</h1>
        <div class="code-block">while not done: response = model(prompt + history)...</div>

        <h1 id="step-6">🧠 6. Context Management</h1>
        <p>RAG for code, Vector DBs (FAISS, Pinecone), and AST parsing keep the agent smart.</p>

        <h1 id="step-7">🧪 7. Add Execution + Feedback Loop</h1>
        <p>Write code → Run → Error → Fix → Repeat. This is the magic of intelligence.</p>

        <h1 id="step-8">🧰 8. Safety & Guardrails</h1>
        <p>Sandbox execution (Docker), limit file access, and prevent destructive commands (rm -rf).</p>

        <h1 id="step-9">📊 9. Evaluation System</h1>
        <p>Measure performance using pass rates, unit tests, and benchmarks (HumanEval, MBPP).</p>

        <h1 id="step-10">🚀 10. Deployment</h1>
        <p>IDE Integration (VS Code), Web Apps, or CLI tools (aider fix bug.py).</p>

        <h1 id="step-11">🏗️ 11. Tech Stack Example</h1>
        <p>Backend: FastAPI. LLM API: OpenAI. Storage: FAISS. Execution: Docker sandbox.</p>

        <h1 id="step-12">🔁 12. Iteration & Improvement</h1>
        <div class="success-banner">Real agents improve over time. Start simple — don’t over-engineer. Tools > Prompts.</div>

        <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 60px 0;" />

        <h1 id="vendi-script-guide">🐍 Vendi Script Specification</h1>
        <p>The **Vendi Script** is a platform-specific Python-based syntax that allows for high-fidelity agent overrides. It is ideal for CI/CD pipelines and automated agent generation.</p>
        
        <div class="code-block" style="background: var(--bg-panel);">
          """<br/>
          POLYMATH AGENT GENERATOR v1.0<br/>
          """<br/><br/>
          AGENT_CONFIG = {<br/>
          &nbsp;&nbsp;"name": "PolymathCoder",<br/>
          &nbsp;&nbsp;"role": "Expert Python/JS Developer",<br/>
          &nbsp;&nbsp;"capabilities": ["Self-Correction", "Test-Driven Development"],<br/>
          &nbsp;&nbsp;"sandbox": "enabled"<br/>
          }<br/><br/>
          SYSTEM_PROMPT = """..."""
        </div>
        
        <p class="form-hint">Supported keys in <code>AGENT_CONFIG</code>: <span>name</span>, <span>role</span>, <span>capabilities</span> (Self-Correction, Test-Driven Development, Code Optimization), <span>sandbox</span> (enabled/disabled), <span>loop_limit</span> (1-20).</p>
      </div>
    </div>
  `;

  // Script-to-Agent logic
  container.querySelector('#btn-import-script')?.addEventListener('click', () => {
    const text = container.querySelector('#script-paste').value;
    if (!text.trim()) return;

    const importedState = parseAgentScript(text);
    Object.assign(state, importedState);
    saveState();

    window.showToast('🚀 Script converted! Switching to Create view...', 'success');
    window.switchView('vending');
  });
}
