// Tab 6 — Skills Configuration
// ============================================================

import { suggestSkills } from '../lib/suggestions.js';

const SKILL_LIBRARY = [
  { id: 'code-review', icon: '🔍', name: 'Code Review', desc: 'Analyze code for bugs, style, and best practices' },
  { id: 'testing', icon: '🧪', name: 'Testing', desc: 'Write unit, integration, and e2e tests' },
  { id: 'debugging', icon: '🐛', name: 'Debugging', desc: 'Identify and fix bugs systematically' },
  { id: 'documentation', icon: '📚', name: 'Documentation', desc: 'Write clear docs, READMEs, and API specs' },
  { id: 'refactoring', icon: '♻️', name: 'Refactoring', desc: 'Restructure code without changing behavior' },
  { id: 'performance', icon: '⚡', name: 'Performance', desc: 'Optimize for speed and efficiency' },
  { id: 'security', icon: '🔒', name: 'Security', desc: 'Audit for vulnerabilities and fix them' },
  { id: 'api-design', icon: '🔗', name: 'API Design', desc: 'Design clean, RESTful, and documented APIs' },
  { id: 'database', icon: '🗄️', name: 'Database', desc: 'Schema design, queries, and migrations' },
  { id: 'devops', icon: '🚀', name: 'DevOps', desc: 'CI/CD, infrastructure, deployments' },
  { id: 'architecture', icon: '🏗️', name: 'Architecture', desc: 'System design and architectural decisions' },
  { id: 'frontend', icon: '🎨', name: 'Frontend', desc: 'Build responsive, accessible UIs' },
  { id: 'data-analysis', icon: '📊', name: 'Data Analysis', desc: 'Analyze datasets and extract insights' },
  { id: 'ml-engineering', icon: '🤖', name: 'ML Engineering', desc: 'Build and deploy ML models' },
  { id: 'project-mgmt', icon: '📋', name: 'Project Mgmt', desc: 'Plan sprints, track tasks, manage scope' },
];

export function renderSkillsTab(container, state) {
  const s = state.skills;

  container.innerHTML = `
    <div class="tab-section-title">🛠️ Load Skills</div>
    <div class="tab-section-desc">Select from the skill library or define custom skills for your agent.</div>

    <div style="margin-bottom: 20px;">
      <button class="btn btn-glow btn-sm" id="btn-ai-suggest-skills">
        🧠 AI Suggest Skills
      </button>
      <span id="ai-loading-skills" class="form-hint hidden" style="margin-left: 10px;">⚡ Analyzing agent role...</span>
    </div>

    <div class="form-group">
      <label class="form-label">Skill Library <span style="color: var(--text-muted);">(${s.selected.length} selected)</span></label>
      <div class="skill-grid">
        ${SKILL_LIBRARY.map(sk => `
          <div class="skill-card ${s.selected.includes(sk.id) ? 'selected' : ''}" data-skill="${sk.id}">
            <div class="skill-icon">${sk.icon}</div>
            <div class="skill-name">${sk.name}</div>
            <div class="skill-desc">${sk.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="form-group" style="margin-top: 24px;">
      <label class="form-label">Custom Skills</label>
      <div id="custom-skills-list">
        ${s.custom.map((cs, i) => `
          <div class="card" style="margin-bottom: 8px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px;">
              <div style="flex: 1;">
                <input class="form-input custom-skill-name" data-index="${i}"
                  value="${cs.name}" placeholder="Skill name" style="margin-bottom: 6px; font-weight: 600;" />
                <textarea class="form-textarea custom-skill-desc" data-index="${i}"
                  placeholder="What does this skill do?"
                  rows="2" style="min-height: 52px;">${cs.desc}</textarea>
              </div>
              <button class="btn btn-danger btn-sm remove-custom-skill" data-index="${i}">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-outline btn-sm" id="add-custom-skill" style="margin-top: 8px;">
        ➕ Add Custom Skill
      </button>
    </div>
  `;

  // Skill card toggle
  container.querySelectorAll('.skill-card[data-skill]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.skill;
      if (s.selected.includes(id)) {
        s.selected = s.selected.filter(x => x !== id);
      } else {
        s.selected.push(id);
      }
      card.classList.toggle('selected');
      // Update count label
      const label = container.querySelector('.form-label span');
      if (label) label.textContent = `(${s.selected.length} selected)`;
      window.dispatchStateChange();
    });
  });

  // AI Suggest
  container.querySelector('#btn-ai-suggest-skills')?.addEventListener('click', async () => {
    const loader = container.querySelector('#ai-loading-skills');
    loader?.classList.remove('hidden');
    
    // Use persona and objectives for better semantic match
    const description = `${state.role.title} ${state.role.persona} ${state.role.objectives}`;
    
    try {
      const suggestions = await suggestSkills(description, SKILL_LIBRARY);
      s.selected = [...new Set([...s.selected, ...suggestions.map(s => s.id)])];
      renderSkillsTab(container, state);
      window.showToast(`AI suggested ${suggestions.length} relevant skills! 🧠`, 'success');
    } catch (e) {
      window.showToast('AI suggestions currently unavailable', 'error');
    } finally {
      loader?.classList.add('hidden');
    }
  });

  // Add custom skill
  container.querySelector('#add-custom-skill')?.addEventListener('click', () => {
    s.custom.push({ name: '', desc: '' });
    renderSkillsTab(container, state);
    window.dispatchStateChange();
  });

  // Edit custom skill name
  container.querySelectorAll('.custom-skill-name').forEach(input => {
    input.addEventListener('input', (e) => {
      s.custom[parseInt(e.target.dataset.index)].name = e.target.value;
      window.dispatchStateChange();
    });
  });

  // Edit custom skill desc
  container.querySelectorAll('.custom-skill-desc').forEach(textarea => {
    textarea.addEventListener('input', (e) => {
      s.custom[parseInt(e.target.dataset.index)].desc = e.target.value;
      window.dispatchStateChange();
    });
  });

  // Remove custom skill
  container.querySelectorAll('.remove-custom-skill').forEach(btn => {
    btn.addEventListener('click', () => {
      s.custom.splice(parseInt(btn.dataset.index), 1);
      renderSkillsTab(container, state);
      window.dispatchStateChange();
    });
  });
}
