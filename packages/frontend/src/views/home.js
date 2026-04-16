// ============================================================
// Home View — Landing Page for AgentVendi
// ============================================================

export function renderHome() {
  const container = document.getElementById('view-home');
  if (!container) return;

  container.innerHTML = `
    <div class="home-hero">
      <div class="hero-content">
        <div class="vending-badge">🎰 v1.0 Release</div>
        <h1 class="hero-title">The AI Agent <span class="accent">Vending Machine</span></h1>
        <p class="hero-subtitle">Configure specialized AI agents for any IDE in 60 seconds. <br>Local-first. Enterprise-ready. No-code creation.</p>
        
        <div class="hero-actions">
          <button class="btn btn-glow btn-lg" onclick="window.switchView('vending')">Start Building →</button>
          <button class="btn btn-outline btn-lg" onclick="window.switchView('marketplace')">Browse Marketplace</button>
        </div>

        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-val">16+</span>
            <span class="stat-label">Pro Templates</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">8+</span>
            <span class="stat-label">Export Formats</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">100%</span>
            <span class="stat-label">Local & Private</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="vending-3d">
          <div class="machine-body">
            <div class="machine-screen">READY</div>
            <div class="machine-slots">
              <div class="slot">🤖</div>
              <div class="slot">🧬</div>
              <div class="slot">📦</div>
            </div>
          </div>
          <div class="machine-glow"></div>
        </div>
      </div>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🧩</div>
        <h3>Universal Adapters</h3>
        <p>Export to Cursor, Windsurf, Aider, Cline, and Copilot from a single configuration.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <h3>Cognitive Calibration</h3>
        <p>AI-powered questionnaire matches your agent to your biological working style.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🏢</div>
        <h3>Enterprise Grade</h3>
        <p>Deploy on intranet/air-gapped networks with global prompt policies and local AI.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🏪</div>
        <h3>Marketplace</h3>
        <p>Fork and customize community-built agents for specialized software stacks.</p>
      </div>
    </div>

    <div class="trusted-section">
      <p>Universal fit for any development stack</p>
      <div class="logo-cloud">
        <span>VS CODE</span>
        <span>CURSOR</span>
        <span>GITHUB</span>
        <span>CLAUDE</span>
        <span>OLLAMA</span>
      </div>
    </div>
  `;
}
