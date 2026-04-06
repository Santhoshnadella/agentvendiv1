// ============================================================
// Tab 5 — Guardrails & Standards
// ============================================================

const SAFETY_PRESETS = [
  { id: 'no-secrets', label: '🔐 Never expose secrets or credentials' },
  { id: 'no-delete', label: '🗑️ Never delete files without confirmation' },
  { id: 'no-prod', label: '🚫 Never run commands on production' },
  { id: 'no-external', label: '🌐 No external API calls without approval' },
  { id: 'no-overwrite', label: '📝 Never overwrite without backup' },
  { id: 'privacy', label: '👁️ Respect user privacy in all outputs' },
];

const POLICY_PRESETS = [
  { id: 'test-first', label: '✅ Write tests before implementation' },
  { id: 'document', label: '📚 Document all public functions' },
  { id: 'types', label: '🏷️ Use strong typing everywhere' },
  { id: 'lint', label: '🧹 Follow linting rules strictly' },
  { id: 'semver', label: '📦 Follow semantic versioning' },
  { id: 'dry', label: '♻️ DRY — avoid code duplication' },
  { id: 'solid', label: '🧱 Follow SOLID principles' },
  { id: 'accessibility', label: '♿ Ensure web accessibility (WCAG)' },
];

export function renderGuardrailsTab(container, state) {
  const g = state.guardrails;

  container.innerHTML = `
    <div class="tab-section-title">🛡️ Guardrails & Standards</div>
    <div class="tab-section-desc">Set safety boundaries, coding standards, and quality expectations.</div>

    <div class="form-group">
      <label class="form-label">Safety Rules</label>
      <div class="form-hint">Select rules your agent must always follow:</div>
      <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
        ${SAFETY_PRESETS.map(s => `
          <label class="question-option ${g.safetyRules.includes(s.id) ? 'selected' : ''}" data-safety="${s.id}" style="cursor: pointer;">
            ${s.label}
          </label>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Coding Standards</label>
      <div class="form-hint">Select practices the agent should enforce:</div>
      <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
        ${POLICY_PRESETS.map(p => `
          <label class="question-option ${g.contentPolicies.includes(p.id) ? 'selected' : ''}" data-policy="${p.id}" style="cursor: pointer;">
            ${p.label}
          </label>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Output Format Standards</label>
      <textarea class="form-textarea" id="output-format"
        placeholder="e.g., Always respond in markdown. Use code fences with language identifiers. Include file paths in comments."
        rows="3">${g.outputFormat}</textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Prohibited Topics</label>
      <textarea class="form-textarea" id="prohibited-topics"
        placeholder="Topics or actions the agent should never engage with..."
        rows="2">${g.prohibitedTopics}</textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Quality Threshold</label>
      <div class="toggle-group">
        ${['low', 'medium', 'high', 'strict'].map(q => `
          <button class="toggle-option ${g.qualityThreshold === q ? 'active' : ''}" data-quality="${q}">
            ${q === 'low' ? '🟢' : q === 'medium' ? '🟡' : q === 'high' ? '🟠' : '🔴'} ${q.charAt(0).toUpperCase() + q.slice(1)}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Custom Rules</label>
      <textarea class="form-textarea" id="custom-rules"
        placeholder="Any additional rules or guidelines not covered above..."
        rows="3">${g.customRules}</textarea>
    </div>
  `;

  // Safety rules toggle
  container.querySelectorAll('[data-safety]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.safety;
      if (g.safetyRules.includes(id)) {
        g.safetyRules = g.safetyRules.filter(r => r !== id);
      } else {
        g.safetyRules.push(id);
      }
      el.classList.toggle('selected');
      window.dispatchStateChange();
    });
  });

  // Content policies toggle
  container.querySelectorAll('[data-policy]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.policy;
      if (g.contentPolicies.includes(id)) {
        g.contentPolicies = g.contentPolicies.filter(p => p !== id);
      } else {
        g.contentPolicies.push(id);
      }
      el.classList.toggle('selected');
      window.dispatchStateChange();
    });
  });

  // Quality threshold
  container.querySelectorAll('[data-quality]').forEach(btn => {
    btn.addEventListener('click', () => {
      g.qualityThreshold = btn.dataset.quality;
      renderGuardrailsTab(container, state);
      window.dispatchStateChange();
    });
  });

  // Text fields
  const bind = (id, key) => {
    container.querySelector(`#${id}`)?.addEventListener('input', (e) => {
      g[key] = e.target.value;
      window.dispatchStateChange();
    });
  };
  bind('output-format', 'outputFormat');
  bind('prohibited-topics', 'prohibitedTopics');
  bind('custom-rules', 'customRules');
}
