// ============================================================
// My Agents View — Dashboard
// ============================================================

import { api } from '../lib/api.js';
import { getUser } from './auth.js';

export async function renderMyAgents(container) {
  const user = getUser();

  if (!user) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
        <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 8px;">Sign in to view your agents</h2>
        <p class="form-hint" style="margin-bottom: 24px;">Create an account to save, manage, and publish your agents.</p>
        <button class="btn btn-glow" onclick="document.getElementById('login-btn')?.click()">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800;">📦 My Agents</h2>
        <p class="form-hint">Manage your created agents</p>
      </div>
      <button class="btn btn-glow" id="import-agent-btn">📥 Import Agent</button>
    </div>

    <div id="my-agents-list">
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        Loading your agents...
      </div>
    </div>

    <!-- Import Modal -->
    <div id="import-modal" class="modal hidden">
      <div class="modal-backdrop"></div>
      <div class="modal-content glass-panel" style="max-width: 560px;">
        <button class="auth-close" id="close-import">✕</button>
        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 16px;">📥 Import Agent File</h3>
        <div class="drop-zone" id="drop-zone">
          <div class="drop-zone-icon">📄</div>
          <div class="drop-zone-text">
            Drop a <code>.cursorrules</code>, <code>.windsurfrules</code>, or <code>CLAUDE.md</code> file here
          </div>
          <div class="form-hint" style="margin-top: 8px;">or click to browse</div>
          <input type="file" id="import-file" accept=".cursorrules,.windsurfrules,.md,.json,.yml,.yaml" style="display: none;" />
        </div>
        <div id="import-preview" style="margin-top: 16px; display: none;">
          <pre class="preview-code" style="max-height: 200px; border-radius: var(--radius-md); background: var(--bg-input);"></pre>
          <button class="btn btn-glow" id="confirm-import" style="width: 100%; margin-top: 12px;">✅ Import This Agent</button>
        </div>
      </div>
    </div>
    
    <div class="card" id="api-keys-section" style="margin-top: 32px;">
       <div style="padding: 16px; border-bottom: var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 700;">🎰 Vending Machine API</div>
          <button class="btn btn-outline btn-sm" id="generate-key-btn">🔑 Generate New Key</button>
       </div>
       <div style="padding: 24px;">
          <p class="form-hint">Use these keys to call your agents from any application. <strong>Note: Your current agents are eligible for "vending-mode" calls.</strong></p>
          <div id="api-keys-list" style="margin-bottom: 20px;">
             <div style="color: var(--text-muted); font-size: 0.85rem;">No API keys yet.</div>
          </div>

          <div class="code-block" style="background: rgba(0,0,0,0.4); padding: 16px; border-radius: 8px;">
             <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">CURL Example (Vending Machine API)</div>
             <pre style="font-size: 0.75rem; color: var(--neon-cyan); margin: 0; white-space: pre-wrap;">
curl -X POST http://localhost:3001/api/v1/execute/YOUR_AGENT_ID \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"input": "Update my database logic", "hitl": true}'
             </pre>
          </div>
       </div>
    </div>
  `;

  // Import button
  container.querySelector('#import-agent-btn')?.addEventListener('click', () => {
    container.querySelector('#import-modal').classList.remove('hidden');
  });

  // Key generation logic (mock for demo)
  container.querySelector('#generate-key-btn')?.addEventListener('click', () => {
     const key = `av_${Math.random().toString(36).substring(2, 30)}`;
     const keyList = container.querySelector('#api-keys-list');
     keyList.innerHTML = `
        <div class="card" style="padding: 12px; margin-bottom: 8px; border-color: var(--neon-cyan); display: flex; justify-content: space-between; align-items: center;">
           <code style="color: var(--neon-cyan); font-weight: 700;">${key}</code>
           <span style="font-size: 0.65rem; color: var(--text-muted);">Active · Created Today</span>
        </div>
     `;
     window.showToast?.('Key generated! Save it securely. 🛡️', 'success');
  });

  container.querySelector('#close-import')?.addEventListener('click', () => {
    container.querySelector('#import-modal').classList.add('hidden');
  });

  container.querySelector('#import-modal .modal-backdrop')?.addEventListener('click', () => {
    container.querySelector('#import-modal').classList.add('hidden');
  });

  // Drop zone
  const dropZone = container.querySelector('#drop-zone');
  const fileInput = container.querySelector('#import-file');

  dropZone?.addEventListener('click', () => fileInput?.click());
  dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleImportFile(file, container);
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files[0]) handleImportFile(e.target.files[0], container);
  });

  // Load agents from API
  try {
    const data = await api.listAgents();
    renderAgentDashboard(container.querySelector('#my-agents-list'), data.agents || []);
  } catch (e) {
    container.querySelector('#my-agents-list').innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🤖</div>
        <h3 style="color: var(--text-secondary);">No agents yet</h3>
        <p class="form-hint">Go to the Create tab to build your first agent!</p>
      </div>
    `;
  }
}

function handleImportFile(file, container) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const preview = container.querySelector('#import-preview');
    const pre = preview?.querySelector('pre');
    if (pre) pre.textContent = content.substring(0, 2000) + (content.length > 2000 ? '\n...' : '');
    if (preview) preview.style.display = 'block';

    container.querySelector('#confirm-import')?.addEventListener('click', async () => {
      try {
        await api.createAgent({
          name: file.name.replace(/\.(cursorrules|windsurfrules|md|json)$/, ''),
          rawConfig: content,
          sourceFormat: file.name.split('.').pop(),
        });
        container.querySelector('#import-modal').classList.add('hidden');
        window.showToast?.('Agent imported successfully! 🎉', 'success');
        renderMyAgents(container);
      } catch (err) {
        window.showToast?.(err.message, 'error');
      }
    });
  };
  reader.readAsText(file);
}

function renderAgentDashboard(container, agents) {
  if (!container) return;
  if (!agents.length) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🤖</div>
        <h3 style="color: var(--text-secondary);">No agents yet</h3>
        <p class="form-hint">Go to the Create tab to build your first agent!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = agents.map(a => `
    <div class="agent-list-item">
      <div class="agent-avatar" style="background: linear-gradient(135deg, hsl(${hashColor(a.name)}, 80%, 55%), hsl(${hashColor(a.name) + 40}, 80%, 45%));">
        🤖
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 600;">${a.name}</div>
        <div class="form-hint">${a.role || 'No role defined'} · v${a.version || 1}</div>
      </div>
      <div class="agent-list-actions">
        <button class="btn btn-outline btn-sm" data-action="history" data-id="${a.id}" title="Version History">🕰️ History</button>
        <button class="btn btn-outline btn-sm" data-action="export" data-id="${a.id}" title="Export">📥 Export</button>
        <button class="btn btn-outline btn-sm" data-action="publish" data-id="${a.id}" title="Publish">🌐 Publish</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${a.id}" title="Delete">✕</button>
      </div>
    </div>
  `).join('');

  // Action handlers
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'delete') {
      if (confirm('Delete this agent?')) {
        try {
          await api.deleteAgent(id);
          window.showToast?.('Agent deleted', 'info');
          btn.closest('.agent-list-item')?.remove();
        } catch (err) {
          window.showToast?.(err.message, 'error');
        }
      }
    } else if (action === 'history') {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content glass-panel" style="max-width: 900px; width: 95%;">
           <button class="auth-close" onclick="this.closest('.modal').remove()">✕</button>
           <div id="diff-container">Loading version history...</div>
        </div>
      `;
      document.body.appendChild(modal);
      const { renderVersionDiff } = await import('./version-diff.js');
      // For demo, we diff v1 and latest (v${btn.dataset.version})
      const agent = agents.find(ag => ag.id === id);
      renderVersionDiff(modal.querySelector('#diff-container'), id, 1, agent.version || 1);
    } else if (action === 'publish') {
      try {
        await api.publishAgent(id);
        window.showToast?.('Agent published to marketplace! 🌐', 'success');
      } catch (err) {
        window.showToast?.(err.message, 'error');
      }
    } else if (action === 'export') {
      window.showToast?.('Generating export bundle...', 'info');
      // Trigger download via backend
      try {
        const blob = await fetch(`/api/export/${id}`).then(r => r.blob());
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-${id}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast?.('Agent exported! 📦', 'success');
      } catch (err) {
        window.showToast?.(err.message, 'error');
      }
    }
  });
}

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < (str?.length || 0); i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
