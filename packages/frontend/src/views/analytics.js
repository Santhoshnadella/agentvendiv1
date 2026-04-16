// ============================================================
// Analytics View — Marketplace Stats Dashboard
// ============================================================

import { api } from '../lib/api.js';
import { getUser } from './auth.js';

export async function renderAnalytics(container) {
  const user = getUser();

  if (!user) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">📊</div>
        <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 8px;">Sign in to view analytics</h2>
        <p class="form-hint">See how your agents perform in the marketplace.</p>
        <button class="btn btn-glow" onclick="document.getElementById('login-btn')?.click()">Sign In</button>
      </div>
    `;
    return;
  }

  // Fetch agent data
  let agents = [];
  try {
    const data = await api.listAgents();
    agents = data.agents || [];
  } catch (e) {}

  const totalClones = agents.reduce((sum, a) => sum + (a.clones || 0), 0);
  const published = agents.filter(a => a.is_published).length;
  const avgRating = agents.length ? (agents.reduce((sum, a) => sum + (a.rating || 0), 0) / agents.length).toFixed(1) : '0.0';

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.5rem; font-weight: 800;">📊 Analytics Dashboard</h2>
      <p class="form-hint">Performance overview of your published agents</p>
    </div>

    <!-- Stats Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
      <div class="card" style="text-align: center; padding: 24px;">
        <div style="font-size: 2rem; margin-bottom: 4px;">🤖</div>
        <div style="font-size: 2rem; font-weight: 800; color: var(--neon-cyan);">${agents.length}</div>
        <div class="form-hint">Total Agents</div>
      </div>
      <div class="card" style="text-align: center; padding: 24px;">
        <div style="font-size: 2rem; margin-bottom: 4px;">🌐</div>
        <div style="font-size: 2rem; font-weight: 800; color: var(--neon-green);">${published}</div>
        <div class="form-hint">Published</div>
      </div>
      <div class="card" style="text-align: center; padding: 24px;">
        <div style="font-size: 2rem; margin-bottom: 4px;">📥</div>
        <div style="font-size: 2rem; font-weight: 800; color: var(--neon-magenta);">${totalClones}</div>
        <div class="form-hint">Total Clones</div>
      </div>
      <div class="card" style="text-align: center; padding: 24px;">
        <div style="font-size: 2rem; margin-bottom: 4px;">⭐</div>
        <div style="font-size: 2rem; font-weight: 800; color: var(--neon-amber);">${avgRating}</div>
        <div class="form-hint">Avg Rating</div>
      </div>
    </div>

    <!-- Activity Chart (CSS-based bar chart) -->
    <div class="card" style="padding: 24px; margin-bottom: 24px;">
      <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px;">📈 Agent Performance</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${agents.length ? agents.map(a => `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="min-width: 120px; font-size: 0.85rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${a.name}</span>
            <div style="flex: 1; height: 24px; background: var(--bg-input); border-radius: var(--radius-sm); overflow: hidden; position: relative;">
              <div style="height: 100%; width: ${Math.min(100, (a.clones || 0) * 2)}%; background: linear-gradient(90deg, var(--neon-cyan), var(--neon-green)); border-radius: var(--radius-sm); transition: width 0.6s ease;"></div>
            </div>
            <span style="min-width: 50px; text-align: right; font-size: 0.8rem; color: var(--text-muted);">${a.clones || 0} 📥</span>
          </div>
        `).join('') : '<div class="form-hint" style="text-align: center; padding: 20px;">No agents to show. Create and publish agents to see stats!</div>'}
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card" style="padding: 24px;">
      <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px;">🕐 Recent Activity</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${agents.slice(0, 5).map(a => `
          <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--radius-sm);">
            <span style="color: var(--neon-cyan);">🤖</span>
            <span style="flex: 1; font-size: 0.85rem;"><strong>${a.name}</strong> — v${a.version || 1}</span>
            <span class="form-hint">${a.updated_at ? new Date(a.updated_at).toLocaleDateString() : 'recently'}</span>
          </div>
        `).join('') || '<div class="form-hint" style="text-align: center; padding: 20px;">No activity yet.</div>'}
      </div>
    </div>
  `;
}
