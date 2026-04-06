// ============================================================
// Tab 4 — Role Assignment
// ============================================================

const TONE_OPTIONS = [
  { id: 'professional', label: '👔 Professional', desc: 'Formal, structured, business-appropriate' },
  { id: 'friendly', label: '😊 Friendly', desc: 'Warm, approachable, conversational' },
  { id: 'technical', label: '🔧 Technical', desc: 'Precise, jargon-heavy, engineering-focused' },
  { id: 'mentor', label: '🎓 Mentor', desc: 'Patient, educational, explains reasoning' },
  { id: 'direct', label: '🎯 Direct', desc: 'Straight to the point, no fluff' },
  { id: 'creative', label: '🎨 Creative', desc: 'Imaginative, thinks outside the box' },
];

export function renderRoleTab(container, state) {
  const r = state.role;

  container.innerHTML = `
    <div class="tab-section-title">🎭 Role Assignment</div>
    <div class="tab-section-desc">Define who your agent is — its identity, purpose, and personality.</div>

    <div class="form-group">
      <label class="form-label">Role Title</label>
      <input class="form-input" id="role-title"
        value="${r.title}"
        placeholder="e.g., Senior Full-Stack Developer, Code Review Specialist, DevOps Engineer..." />
    </div>

    <div class="form-group">
      <label class="form-label">Persona Description</label>
      <textarea class="form-textarea" id="role-persona"
        placeholder="Describe your agent's personality and background. e.g., 'You are a senior developer with 15 years of experience in building scalable systems. You care deeply about code quality and always consider edge cases...'"
        rows="4">${r.persona}</textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Communication Tone</label>
      <div class="skill-grid" style="grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));">
        ${TONE_OPTIONS.map(t => `
          <div class="skill-card ${r.tone === t.id ? 'selected' : ''}" data-tone="${t.id}">
            <div class="skill-name">${t.label}</div>
            <div class="skill-desc">${t.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Primary Objectives</label>
      <textarea class="form-textarea" id="role-objectives"
        placeholder="What should the agent focus on? e.g.,&#10;- Write clean, maintainable code&#10;- Follow SOLID principles&#10;- Prioritize performance and security&#10;- Document all public APIs"
        rows="4">${r.objectives}</textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Constraints</label>
      <textarea class="form-textarea" id="role-constraints"
        placeholder="What should the agent avoid? e.g.,&#10;- Never modify test files without asking&#10;- Don't use deprecated APIs&#10;- Avoid premature optimization"
        rows="3">${r.constraints}</textarea>
    </div>
  `;

  // Text inputs
  const bind = (id, key) => {
    container.querySelector(`#${id}`)?.addEventListener('input', (e) => {
      r[key] = e.target.value;
      window.dispatchStateChange();
    });
  };
  bind('role-title', 'title');
  bind('role-persona', 'persona');
  bind('role-objectives', 'objectives');
  bind('role-constraints', 'constraints');

  // Tone select
  container.querySelectorAll('.skill-card[data-tone]').forEach(card => {
    card.addEventListener('click', () => {
      r.tone = card.dataset.tone;
      renderRoleTab(container, state);
      window.dispatchStateChange();
    });
  });
}
