// ============================================================
// Tab 2 — Agent Behavior Configuration
// ============================================================

export function renderBehaviorTab(container, state) {
  const b = state.behavior;

  container.innerHTML = `
    <div class="tab-section-title">⚙️ How It Works</div>
    <div class="tab-section-desc">Define how your agent responds, thinks, and handles tasks.</div>

    <div class="form-group">
      <label class="form-label">Response Style</label>
      <div class="toggle-group">
        ${['concise', 'balanced', 'detailed', 'conversational'].map(s => `
          <button class="toggle-option ${b.responseStyle === s ? 'active' : ''}" data-field="responseStyle" data-val="${s}">
            ${s === 'concise' ? '⚡' : s === 'balanced' ? '⚖️' : s === 'detailed' ? '📖' : '💬'} ${s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Autonomy Level: <span id="autonomy-val">${b.autonomy}%</span></label>
      <input type="range" class="range-slider" id="autonomy-slider" min="0" max="100" value="${b.autonomy}" />
      <div style="display: flex; justify-content: space-between;">
        <span class="form-hint">🛑 Ask before every action</span>
        <span class="form-hint">🚀 Fully autonomous</span>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Creativity Level: <span id="creativity-val">${b.creativity}%</span></label>
      <input type="range" class="range-slider" id="creativity-slider" min="0" max="100" value="${b.creativity}" />
      <div style="display: flex; justify-content: space-between;">
        <span class="form-hint">📏 Strict & predictable</span>
        <span class="form-hint">🎨 Creative & exploratory</span>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Error Handling Strategy</label>
      <div class="toggle-group">
        ${['explain', 'fix-silently', 'ask-user', 'retry'].map(s => `
          <button class="toggle-option ${b.errorHandling === s ? 'active' : ''}" data-field="errorHandling" data-val="${s}">
            ${s === 'explain' ? '📝 Explain' : s === 'fix-silently' ? '🔧 Auto-fix' : s === 'ask-user' ? '❓ Ask' : '🔄 Retry'}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Verbosity</label>
      <div class="toggle-group">
        ${['minimal', 'balanced', 'verbose'].map(s => `
          <button class="toggle-option ${b.verbosity === s ? 'active' : ''}" data-field="verbosity" data-val="${s}">
            ${s === 'minimal' ? '🔇' : s === 'balanced' ? '🔉' : '🔊'} ${s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
        <span>Tool Usage</span>
      </label>
      <div class="toggle-group">
        <button class="toggle-option ${b.toolUse ? 'active' : ''}" data-field="toolUse" data-val="true">✅ Allow tool use</button>
        <button class="toggle-option ${!b.toolUse ? 'active' : ''}" data-field="toolUse" data-val="false">🚫 No tools</button>
      </div>
    </div>
  `;

  // Toggle handlers
  container.querySelectorAll('.toggle-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      let val = btn.dataset.val;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      b[field] = val;
      renderBehaviorTab(container, state);
      window.dispatchStateChange();
    });
  });

  // Slider handlers
  const autonomySlider = container.querySelector('#autonomy-slider');
  autonomySlider?.addEventListener('input', (e) => {
    b.autonomy = parseInt(e.target.value);
    container.querySelector('#autonomy-val').textContent = b.autonomy + '%';
    window.dispatchStateChange();
  });

  const creativitySlider = container.querySelector('#creativity-slider');
  creativitySlider?.addEventListener('input', (e) => {
    b.creativity = parseInt(e.target.value);
    container.querySelector('#creativity-val').textContent = b.creativity + '%';
    window.dispatchStateChange();
  });
}
