// ============================================================
// Tab 1 — Agent Selection (with Templates)
// ============================================================

import { TEMPLATES, getAllCategories } from '../templates/library.js';

export function renderSelectionTab(container, state) {
  container.innerHTML = `
    <div class="tab-section-title">🎯 Pick Your Agent</div>
    <div class="tab-section-desc">Start from a template or build from scratch. Choose single agent or a multi-agent crew.</div>

    <div class="form-group">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
         <label class="form-label" style="margin-bottom: 0;">Quick Start Templates</label>
         <button class="btn btn-outline btn-sm" id="import-script-btn">📥 Import Vendi Script</button>
      </div>
      <div id="flow-canvas-container" style="margin-bottom: 20px; ${state.mode === 'multi' ? '' : 'display: none;'}">
         <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;">Architecture Visualizer</div>
         <div id="flow-canvas" class="card" style="height: 150px; background: rgba(0,0,0,0.2); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-around;">
            ${renderFlowCanvas(state)}
         </div>
      </div>
      <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
        <button class="tag active" data-cat="all">All</button>
        ${getAllCategories().map(c => `<button class="tag" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="skill-grid" id="template-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));">
        ${TEMPLATES.map(t => `
          <div class="skill-card template-card" data-template="${t.id}" data-category="${t.category}">
            <div class="skill-icon">${t.emoji}</div>
            <div class="skill-name">${t.name}</div>
            <div class="skill-desc">${t.description.substring(0, 60)}...</div>
            ${t.config.mode === 'multi' ? '<div style="margin-top: 4px;"><span class="tag active" style="font-size: 0.65rem; padding: 2px 6px;">Multi-Agent</span></div>' : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <div style="position: relative; text-align: center; margin: 20px 0;">
      <hr style="border: none; border-top: 1px solid var(--glass-border);" />
      <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--bg-panel); padding: 0 16px; color: var(--text-muted); font-size: 0.82rem;">or configure manually</span>
    </div>

    <div class="form-group">
      <label class="form-label">Agent Mode</label>
      <div class="toggle-group">
        <button class="toggle-option ${state.mode === 'single' ? 'active' : ''}" data-mode="single">
          ⚡ Single Agent
        </button>
        <button class="toggle-option ${state.mode === 'multi' ? 'active' : ''}" data-mode="multi">
          👥 Multi-Agent Crew
        </button>
      </div>
    </div>

    <div id="agents-list" class="form-group">
      ${renderAgentsList(state)}
    </div>

    <button id="add-agent-btn" class="btn btn-outline btn-sm ${state.mode === 'single' ? 'hidden' : ''}" style="margin-top: 8px;">
      ➕ Add Another Agent
    </button>
  `;

  // Import script
  container.querySelector('#import-script-btn')?.addEventListener('click', () => {
    const script = prompt('Paste your AgentVendi Script (JSON) here:');
    if (script) {
      try {
        const parsed = JSON.parse(script);
        Object.assign(state, parsed);
        window.showToast?.('✅ Script imported successfully!', 'success');
        renderSelectionTab(container, state);
        window.dispatchStateChange();
      } catch (e) {
        window.showToast?.('❌ Invalid script format.', 'error');
      }
    }
  });

  // Template category filter
  container.querySelectorAll('.tag[data-cat]').forEach(tag => {
    tag.addEventListener('click', () => {
      container.querySelectorAll('.tag[data-cat]').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      const cat = tag.dataset.cat;
      container.querySelectorAll('.template-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
      });
    });
  });

  // Template selection
  container.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const template = TEMPLATES.find(t => t.id === card.dataset.template);
      if (template) {
        Object.assign(state, JSON.parse(JSON.stringify(template.config)));
        state.completedTabs = ['selection', 'behavior', 'knowledge', 'role', 'guardrails', 'skills'];
        window.showToast?.(`🎯 Loaded "${template.name}" template!`, 'success');
        renderSelectionTab(container, state);
        window.dispatchStateChange();
      }
    });
  });

  // Toggle mode
  container.querySelectorAll('.toggle-option').forEach(btn => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      if (state.mode === 'single' && state.agents.length > 1) {
        state.agents = [state.agents[0]];
      }
      renderSelectionTab(container, state);
      window.dispatchStateChange();
    });
  });

  // Add agent
  container.querySelector('#add-agent-btn')?.addEventListener('click', () => {
    state.agents.push({
      name: `Agent ${state.agents.length + 1}`,
      id: crypto.randomUUID?.() || Date.now().toString(),
    });
    renderSelectionTab(container, state);
    window.dispatchStateChange();
  });

  // Agent name editing
  container.querySelectorAll('.agent-name-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const agent = state.agents.find(a => a.id === e.target.dataset.id);
      if (agent) agent.name = e.target.value;
      window.dispatchStateChange();
    });
  });

  // Agent role editing
  container.querySelectorAll('.agent-role-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const agent = state.agents.find(a => a.id === e.target.dataset.id);
      if (agent) agent.role = e.target.value;
      window.dispatchStateChange();
    });
  });

  // Agent handoff editing
  container.querySelectorAll('.agent-handoff-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const agent = state.agents.find(a => a.id === e.target.dataset.id);
      if (agent) agent.handoff = e.target.value;
      window.dispatchStateChange();
    });
  });

  // Remove agent
  container.querySelectorAll('.remove-agent-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.agents = state.agents.filter(a => a.id !== btn.dataset.id);
      renderSelectionTab(container, state);
      window.dispatchStateChange();
    });
  });
}

function renderFlowCanvas(state) {
  if (state.mode !== 'multi') return '';
  const agents = state.agents;
  return agents.map((a, i) => `
    <div class="flow-node" style="text-align: center; z-index: 2;">
       <div class="agent-avatar" style="margin: 0 auto 8px; width: 40px; height: 40px; font-size: 1rem; background: linear-gradient(135deg, hsl(${i * 60 + 280}, 80%, 55%), hsl(${i * 60 + 320}, 80%, 45%));">🤖</div>
       <div style="font-size: 0.65rem; font-weight: 700; max-width: 60px; overflow: hidden; text-overflow: ellipsis;">${a.name}</div>
    </div>
    ${i < agents.length - 1 ? `
       <div style="color: var(--neon-cyan); opacity: 0.5;">
          <svg width="40" height="20" viewBox="0 0 40 20">
             <path d="M0 10 L30 10 M25 5 L30 10 L25 15" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
       </div>
    ` : ''}
  `).join('');
}

function renderAgentsList(state) {
  return state.agents.map((agent, i) => `
    <div class="agent-list-item card" style="animation-delay: ${i * 0.05}s; display: block; margin-bottom: 16px; padding: 16px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div class="agent-avatar" style="background: linear-gradient(135deg, hsl(${i * 60 + 280}, 80%, 55%), hsl(${i * 60 + 320}, 80%, 45%));">
          🤖
        </div>
        <div style="flex: 1;">
          <input class="form-input agent-name-input"
            value="${agent.name}"
            data-id="${agent.id}"
            placeholder="Agent name..."
            style="font-weight: 600;" />
        </div>
        ${state.agents.length > 1 ? `
          <button class="btn btn-danger btn-sm remove-agent-btn" data-id="${agent.id}">✕</button>
        ` : ''}
      </div>

      ${state.mode === 'multi' ? `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
           <div class="form-group">
              <label class="form-label" style="font-size: 0.75rem;">Role / Specialization</label>
              <input class="form-input agent-role-input" 
                value="${agent.role || ''}" 
                data-id="${agent.id}"
                placeholder="e.g. Research, Logic, Coding" />
           </div>
           <div class="form-group">
              <label class="form-label" style="font-size: 0.75rem;">Handoff Permission</label>
              <select class="form-input agent-handoff-select" data-id="${agent.id}">
                 <option value="none" ${agent.handoff === 'none' ? 'selected' : ''}>No Handoff</option>
                 <option value="automatic" ${agent.handoff === 'automatic' ? 'selected' : ''}>Automatic</option>
                 <option value="ask" ${agent.handoff === 'ask' ? 'selected' : ''}>Ask User</option>
              </select>
           </div>
        </div>
      ` : ''}
    </div>
  `).join('');
}
