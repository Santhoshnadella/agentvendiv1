// ============================================================
// Teams View
// ============================================================

import { api } from '../lib/api.js';
import { getUser } from './auth.js';

export async function renderTeams(container) {
  const user = getUser();

  if (!user) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">👥</div>
        <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 8px;">Sign in to access teams</h2>
        <p class="form-hint">Teams let you share agents with your organization.</p>
        <button class="btn btn-glow" onclick="document.getElementById('login-btn')?.click()">Sign In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800;">👥 Teams</h2>
        <p class="form-hint">Collaborate on agents with your team</p>
      </div>
      <button class="btn btn-glow" id="create-team-btn">➕ Create Team</button>
    </div>

    <div id="teams-list">
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🏢</div>
        <h3 style="color: var(--text-secondary);">No teams yet</h3>
        <p class="form-hint">Create a team to share agents with colleagues.</p>
      </div>
    </div>

    <!-- Create Team Modal -->
    <div id="create-team-modal" class="modal hidden">
      <div class="modal-backdrop"></div>
      <div class="modal-content glass-panel">
        <button class="auth-close" id="close-create-team">✕</button>
        <div class="auth-title">Create Team</div>
        <div class="auth-subtitle">Set up a workspace for your team</div>
        <form id="create-team-form">
          <div class="form-group">
            <label class="form-label">Team Name</label>
            <input class="form-input" id="team-name" placeholder="My Awesome Team" required />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" id="team-desc" placeholder="What does your team work on?" rows="3"></textarea>
          </div>
          <button type="submit" class="btn btn-glow" style="width: 100%;">🚀 Create Team</button>
        </form>
      </div>
    </div>
  `;

  // Create team modal
  container.querySelector('#create-team-btn')?.addEventListener('click', () => {
    container.querySelector('#create-team-modal').classList.remove('hidden');
  });

  container.querySelector('#close-create-team')?.addEventListener('click', () => {
    container.querySelector('#create-team-modal').classList.add('hidden');
  });

  container.querySelector('#create-team-modal .modal-backdrop')?.addEventListener('click', () => {
    container.querySelector('#create-team-modal').classList.add('hidden');
  });

  container.querySelector('#create-team-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#team-name').value;
    const description = container.querySelector('#team-desc').value;
    try {
      await api.createTeam({ name, description });
      container.querySelector('#create-team-modal').classList.add('hidden');
      window.showToast?.('Team created! 🎉', 'success');
      renderTeams(container);
    } catch (err) {
      window.showToast?.(err.message, 'error');
    }
  });

  // Load teams
  try {
    const data = await api.listTeams();
    if (data.teams?.length) {
      renderTeamsList(container.querySelector('#teams-list'), data.teams);
    }
  } catch (e) {
    // Keep placeholder
  }
}

function renderTeamsList(container, teams) {
  if (!container) return;
  container.innerHTML = teams.map(t => `
    <div class="card" style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700; font-size: 1rem;">${t.name}</div>
          <div class="form-hint">${t.memberCount || 1} members · ${t.agentCount || 0} agents</div>
        </div>
        <button class="btn btn-outline btn-sm">Manage</button>
      </div>
      ${t.members?.length ? `
        <div style="display: flex; gap: -4px; margin-top: 12px;">
          ${t.members.slice(0, 5).map(m => `
            <div class="member-avatar" title="${m.username}">${m.username[0].toUpperCase()}</div>
          `).join('')}
          ${t.members.length > 5 ? `<div class="member-avatar" style="background: var(--bg-input);">+${t.members.length - 5}</div>` : ''}
        </div>
      ` : ''}
    </div>
  `).join('');
}
