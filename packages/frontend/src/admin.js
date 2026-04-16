// ============================================================
// Admin Portal — Client-side Logic
// ============================================================

const API = '/api/admin';
let token = localStorage.getItem('av-token');

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
  });
  if (res.status === 401 || res.status === 403) {
    alert('Admin access required. Please sign in with an admin account.');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  // Check admin access
  try {
    const data = await apiFetch('/stats');
    document.getElementById('admin-user').textContent = '👤 Admin';
    renderOverview(data);
  } catch (e) {
    document.getElementById('admin-content').innerHTML = `
      <div style="text-align:center; padding: 80px;">
        <div style="font-size: 3rem;">🔐</div>
        <h2 style="margin-top: 16px;">Admin Access Required</h2>
        <p style="color: var(--text-muted); margin-top: 8px;">Sign in with an admin account to access this portal.</p>
        <a href="/" class="btn btn-glow" style="margin-top: 24px; display: inline-block;">← Return to App</a>
      </div>
    `;
    return;
  }

  // Sidebar nav
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchSection(btn.dataset.section);
    });
  });

  // Logout
  document.getElementById('admin-logout')?.addEventListener('click', () => {
    localStorage.removeItem('av-token');
    localStorage.removeItem('av-user');
    window.location.href = '/';
  });
});

async function switchSection(section) {
  const container = document.getElementById('admin-content');
  container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading...</div>';

  try {
    switch (section) {
      case 'overview': {
        const data = await apiFetch('/stats');
        renderOverview(data);
        break;
      }
      case 'users': {
        const data = await apiFetch('/users');
        renderUsers(data);
        break;
      }
      case 'agents': {
        const data = await apiFetch('/agents');
        renderAgents(data);
        break;
      }
      case 'marketplace': {
        const data = await apiFetch('/marketplace');
        renderMarketplaceAdmin(data);
        break;
      }
      case 'moderation': {
        const data = await apiFetch('/moderation');
        renderModeration(data);
        break;
      }
      case 'activity': {
        const data = await apiFetch('/activity');
        renderActivity(data);
        break;
      }
      case 'enterprise': {
        renderEnterprise();
        loadEnterpriseSettings();
        break;
      }
      case 'settings': {
        renderSettings();
        break;
      }
    }
  } catch (e) {
    container.innerHTML = `<div style="color: var(--neon-magenta); padding: 40px;">Error: ${e.message}</div>`;
  }
}

// ---- Overview ----
function renderOverview(data) {
  const container = document.getElementById('admin-content');
  const stats = data.stats || {};
  container.innerHTML = `
    <div class="admin-section-title">📊 Platform Overview</div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value" style="color: var(--neon-cyan);">${stats.totalUsers || 0}</div>
        <div class="stat-label">Total Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🤖</div>
        <div class="stat-value" style="color: var(--neon-green);">${stats.totalAgents || 0}</div>
        <div class="stat-label">Total Agents</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-value" style="color: var(--neon-magenta);">${stats.marketplaceListings || 0}</div>
        <div class="stat-label">Marketplace Listings</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📥</div>
        <div class="stat-value" style="color: var(--neon-amber);">${stats.totalClones || 0}</div>
        <div class="stat-label">Total Clones</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value" style="color: var(--neon-cyan);">${stats.totalTeams || 0}</div>
        <div class="stat-label">Teams</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🛡️</div>
        <div class="stat-value" style="color: var(--neon-amber);">${stats.pendingModeration || 0}</div>
        <div class="stat-label">Pending Review</div>
      </div>
    </div>

    <!-- Top Agents Chart -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background: var(--bg-panel); border: var(--border-subtle); border-radius: var(--radius-lg); padding: 20px;">
        <div class="admin-section-title" style="font-size: 0.95rem;">🔥 Top Agents by Clones</div>
        ${(data.topAgents || []).map(a => `
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="min-width: 100px; font-size: 0.82rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${a.name}</span>
            <div style="flex: 1; height: 18px; background: var(--bg-input); border-radius: var(--radius-sm); overflow: hidden;">
              <div class="chart-bar" style="width: ${Math.min(100, (a.clones || 0) * 5)}%; background: linear-gradient(90deg, var(--neon-cyan), var(--neon-green));"></div>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted); min-width: 40px; text-align: right;">${a.clones}</span>
          </div>
        `).join('') || '<div style="color: var(--text-muted); font-size: 0.85rem;">No data yet</div>'}
      </div>

      <div style="background: var(--bg-panel); border: var(--border-subtle); border-radius: var(--radius-lg); padding: 20px;">
        <div class="admin-section-title" style="font-size: 0.95rem;">📋 Recent Activity</div>
        ${(data.recentActivity || []).slice(0, 6).map(a => `
          <div class="activity-item" style="padding: 6px 0;">
            <div class="activity-dot" style="background: var(--neon-cyan);"></div>
            <div style="flex: 1;">
              <div style="font-size: 0.82rem;"><strong>${a.username || 'user'}</strong> ${a.action || 'created agent'} <em>${a.target || ''}</em></div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${a.created_at ? new Date(a.created_at).toLocaleString() : 'recently'}</div>
            </div>
          </div>
        `).join('') || '<div style="color: var(--text-muted); font-size: 0.85rem;">No activity yet</div>'}
      </div>
    </div>
  `;
}

// ---- Users ----
function renderUsers(data) {
  const container = document.getElementById('admin-content');
  const users = data.users || [];
  container.innerHTML = `
    <div class="admin-section-title">👥 User Management <span style="font-weight: 400; font-size: 0.85rem; color: var(--text-muted);">(${users.length} users)</span></div>
    <table class="admin-table">
      <thead>
        <tr><th>User</th><th>Email</th><th>Role</th><th>Agents</th><th>Joined</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr data-uid="${u.id}">
            <td><strong>${u.username}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-approved' : 'badge-active'}">${u.role || 'user'}</span></td>
            <td>${u.agentCount || 0}</td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
            <td>
              ${u.role !== 'admin' ? `
                <button class="action-btn promote" data-action="promote" data-id="${u.id}">⬆ Promote</button>
                <button class="action-btn ban" data-action="ban" data-id="${u.id}">${u.status === 'banned' ? '✅ Unban' : '🚫 Ban'}</button>
              ` : '<span style="color: var(--text-muted); font-size: 0.75rem;">Owner</span>'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    try {
      if (action === 'promote') {
        await apiFetch(`/users/${id}/promote`, { method: 'POST' });
        switchSection('users');
      } else if (action === 'ban') {
        await apiFetch(`/users/${id}/ban`, { method: 'POST' });
        switchSection('users');
      }
    } catch (e) { alert(e.message); }
  });
}

// ---- Agents ----
function renderAgents(data) {
  const container = document.getElementById('admin-content');
  const agents = data.agents || [];
  container.innerHTML = `
    <div class="admin-section-title">🤖 All Agents <span style="font-weight: 400; font-size: 0.85rem; color: var(--text-muted);">(${agents.length})</span></div>
    <table class="admin-table">
      <thead>
        <tr><th>Name</th><th>Owner</th><th>Version</th><th>Published</th><th>Created</th></tr>
      </thead>
      <tbody>
        ${agents.map(a => `
          <tr>
            <td><strong>${a.name}</strong></td>
            <td>${a.username || 'unknown'}</td>
            <td>v${a.version || 1}</td>
            <td><span class="badge ${a.is_published ? 'badge-approved' : 'badge-pending'}">${a.is_published ? 'Published' : 'Draft'}</span></td>
            <td>${new Date(a.created_at).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ---- Marketplace Admin ----
function renderMarketplaceAdmin(data) {
  const container = document.getElementById('admin-content');
  const listings = data.listings || [];
  container.innerHTML = `
    <div class="admin-section-title">🏪 Marketplace Listings <span style="font-weight: 400; font-size: 0.85rem; color: var(--text-muted);">(${listings.length})</span></div>
    <table class="admin-table">
      <thead>
        <tr><th>Agent</th><th>Author</th><th>Clones</th><th>Rating</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${listings.map(l => `
          <tr>
            <td><strong>${l.name}</strong></td>
            <td>${l.author || 'unknown'}</td>
            <td>${l.clones || 0}</td>
            <td>${l.rating_count > 0 ? (l.rating_sum / l.rating_count).toFixed(1) : 'N/A'} (${l.rating_count})</td>
            <td><span class="badge badge-${l.status || 'approved'}">${l.status || 'approved'}</span></td>
            <td>
              <button class="action-btn reject" data-action="remove-listing" data-id="${l.id}">✕ Remove</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    if (btn.dataset.action === 'remove-listing') {
      if (confirm('Remove this listing from marketplace?')) {
        try {
          await apiFetch(`/marketplace/${btn.dataset.id}/remove`, { method: 'POST' });
          switchSection('marketplace');
        } catch (e) { alert(e.message); }
      }
    }
  });
}

// ---- Moderation ----
function renderModeration(data) {
  const container = document.getElementById('admin-content');
  const pending = data.pending || [];
  container.innerHTML = `
    <div class="admin-section-title">🛡️ Moderation Queue <span style="font-weight: 400; font-size: 0.85rem; color: var(--text-muted);">(${pending.length} pending)</span></div>
    ${pending.length === 0 ? '<div style="text-align: center; padding: 60px; color: var(--text-muted);"><div style="font-size: 2.5rem; margin-bottom: 12px;">✅</div><h3>All clear!</h3><p>No agents pending review.</p></div>' : ''}
    ${pending.map(a => `
      <div style="background: var(--bg-panel); border: var(--border-subtle); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${a.name}</strong>
            <span style="color: var(--text-muted); font-size: 0.82rem;"> by ${a.username || 'unknown'}</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="action-btn approve" data-action="approve" data-id="${a.id}">✅ Approve</button>
            <button class="action-btn reject" data-action="reject" data-id="${a.id}">❌ Reject</button>
          </div>
        </div>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 6px;">${a.description || 'No description'}</div>
      </div>
    `).join('')}
  `;

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    try {
      await apiFetch(`/agents/${btn.dataset.id}/${btn.dataset.action}`, { method: 'POST' });
      switchSection('moderation');
    } catch (e) { alert(e.message); }
  });
}

// ---- Activity Log ----
function renderActivity(data) {
  const container = document.getElementById('admin-content');
  const logs = data.logs || [];
  container.innerHTML = `
    <div class="admin-section-title">📋 Activity Log</div>
    <div style="max-height: 70vh; overflow-y: auto;">
      ${logs.length === 0 ? '<div style="text-align: center; padding: 60px; color: var(--text-muted);">No activity recorded yet.</div>' : ''}
      ${logs.map(l => `
        <div class="activity-item">
          <div class="activity-dot" style="background: ${getActivityColor(l.action)};"></div>
          <div style="flex: 1;">
            <div style="font-size: 0.85rem;">
              <strong>${l.username || 'system'}</strong>
              <span style="color: var(--text-muted);">${l.action}</span>
              ${l.target ? `<em>${l.target}</em>` : ''}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${new Date(l.created_at).toLocaleString()}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getActivityColor(action) {
  if (action?.includes('register')) return 'var(--neon-green)';
  if (action?.includes('publish')) return 'var(--neon-cyan)';
  if (action?.includes('ban')) return 'var(--neon-magenta)';
  if (action?.includes('delete')) return 'var(--neon-magenta)';
  return 'var(--neon-amber)';
}

// ---- Enterprise Settings ----
function renderEnterprise() {
  document.getElementById('admin-content').innerHTML = `
    <div class="admin-section-title">🏢 Enterprise Settings</div>
    <div style="display: grid; gap: 16px; max-width: 600px; background: var(--bg-panel); padding: 24px; border-radius: var(--radius-lg); border: var(--border-subtle);">
      <div class="form-group">
        <label class="form-label">Internal Ollama Endpoint</label>
        <input type="text" id="ent-ollama-url" class="form-input" placeholder="http://internal-ai.company.com:11434" />
      </div>
      <div class="form-group">
        <label class="form-label">Default Model</label>
        <input type="text" id="ent-model-name" class="form-input" placeholder="llama3.2" />
      </div>
      <div class="form-group">
        <label class="form-label">Global Mandatory Guardrails</label>
        <textarea id="ent-global-guards" class="form-input" rows="4" placeholder="Always check for sensitive company data..."></textarea>
      </div>
      <button id="save-enterprise" class="btn btn-glow">Update Enterprise Config</button>
    </div>
  `;

  document.getElementById('save-enterprise')?.addEventListener('click', async () => {
    const config = {
      ollamaUrl: document.getElementById('ent-ollama-url').value,
      modelName: document.getElementById('ent-model-name').value,
      globalGuards: document.getElementById('ent-global-guards').value,
    };
    try {
      await apiFetch('/enterprise', { method: 'POST', body: JSON.stringify({ config }) });
      alert('Enterprise config updated 🚀');
    } catch (e) {
      alert('Failed to update config: ' + e.message);
    }
  });
}

async function loadEnterpriseSettings() {
  const data = await apiFetch('/enterprise');
  document.getElementById('ent-ollama-url').value = data.config.ollamaUrl || '';
  document.getElementById('ent-model-name').value = data.config.modelName || '';
  document.getElementById('ent-global-guards').value = data.config.globalGuards || '';
}

// ---- Settings ----
function renderSettings() {
  const container = document.getElementById('admin-content');
  container.innerHTML = `
    <div class="admin-section-title">⚙️ Platform Settings</div>
    <div style="display: grid; gap: 16px; max-width: 600px;">
      <div style="background: var(--bg-panel); border: var(--border-subtle); border-radius: var(--radius-md); padding: 20px;">
        <label style="font-weight: 600; font-size: 0.88rem;">Marketplace Auto-Approve</label>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 10px;">Automatically approve agents published to marketplace</p>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" id="auto-approve" checked /> Enabled
        </label>
      </div>
      <div style="background: var(--bg-panel); border: var(--border-subtle); border-radius: var(--radius-md); padding: 20px;">
        <label style="font-weight: 600; font-size: 0.88rem;">Platform Registration</label>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 10px;">Allow new user registrations</p>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" id="allow-reg" checked /> Open
        </label>
      </div>
      <div style="background: var(--bg-panel); border: var(--border-subtle); border-radius: var(--radius-md); padding: 20px;">
        <label style="font-weight: 600; font-size: 0.88rem;">Max Agents per User</label>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 10px;">Limit number of agents each user can create</p>
        <input type="number" value="50" min="1" max="500" style="width: 100px; background: var(--bg-input); border: var(--border-subtle); border-radius: var(--radius-sm); padding: 6px 10px; color: var(--text-primary);" />
      </div>
    </div>
  `;
}
