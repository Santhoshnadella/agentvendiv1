import { api } from '../lib/api.js';

export async function renderDashboard(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.5rem; font-weight: 800;">📊 Agent Observability</h2>
      <p class="form-hint">Monitor your agents' performance, logs, and activity.</p>
    </div>

    <div class="stats-overview" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px;">
       <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Total Runs</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--neon-cyan);">24</div>
       </div>
       <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Avg. Success</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--neon-pink);">92%</div>
       </div>
       <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Total Cost</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--neon-purple);">$0.12</div>
       </div>
       <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Avg. Latency</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--neon-blue);">2.4s</div>
       </div>
    </div>

    <div class="card" style="overflow: hidden;">
       <div style="padding: 16px; border-bottom: var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 700;">Recent Agent Executions</div>
          <button class="btn btn-outline btn-sm" id="refresh-dashboard">🔄 Refresh</button>
       </div>
       <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
             <thead style="background: var(--bg-input); text-align: left;">
                <tr>
                   <th style="padding: 12px 16px;">Agent</th>
                   <th style="padding: 12px 16px;">Date</th>
                   <th style="padding: 12px 16px;">Status</th>
                   <th style="padding: 12px 16px;">Tokens</th>
                   <th style="padding: 12px 16px;">Actions</th>
                </tr>
             </thead>
             <tbody id="runs-table-body">
                <tr>
                   <td colspan="5" style="padding: 40px; text-align: center; color: var(--text-muted);">
                      Loading recent runs...
                   </td>
                </tr>
             </tbody>
          </table>
       </div>
    </div>

    <!-- Log Viewer Modal -->
    <div id="log-viewer-modal" class="modal hidden">
       <div class="modal-backdrop"></div>
       <div class="modal-content glass-panel" style="max-width: 800px; width: 90%; max-height: 80vh; display: flex; flex-direction: column;">
          <button class="auth-close" id="close-log-viewer">✕</button>
          <div class="auth-title">Run Logs</div>
          <div id="log-content" style="flex: 1; overflow-y: auto; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 0.85rem;">
          </div>
       </div>
    </div>
  `;

  const tableBody = container.querySelector('#runs-table-body');
  
  const loadRuns = async () => {
    try {
      // In a real app, we'd fetch from /api/runtime/runs
      const res = await fetch('/api/runtime/runs/current'); // 'current' is a placeholder or fetch all
      let runs = [];
      if (res.ok) {
        const data = await res.json();
        runs = data.runs || [];
      }

      if (runs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="padding: 40px; text-align: center; color: var(--text-muted);">No runs found yet. Start an agent in the Sandbox!</td></tr>`;
        return;
      }

      tableBody.innerHTML = runs.map(run => `
        <tr style="border-bottom: var(--border-subtle);">
           <td style="padding: 12px 16px; font-weight: 600;">${run.agent_id || 'Unknown Agent'}</td>
           <td style="padding: 12px 16px; color: var(--text-secondary);">${new Date(run.created_at).toLocaleString()}</td>
           <td style="padding: 12px 16px;">
              <span class="tag ${run.status === 'completed' ? 'active' : 'danger'}" style="font-size: 0.7rem;">
                 ${run.status}
              </span>
           </td>
           <td style="padding: 12px 16px;">${run.duration || 0}ms</td>
           <td style="padding: 12px 16px;">
              <button class="btn btn-outline btn-sm view-logs-btn" data-id="${run.id}">View Logs</button>
           </td>
        </tr>
      `).join('');

      container.querySelectorAll('.view-logs-btn').forEach(btn => {
         btn.addEventListener('click', () => showLogs(btn.dataset.id));
      });
    } catch (e) {
      tableBody.innerHTML = `<tr><td colspan="5" style="padding: 40px; text-align: center; color: var(--neon-pink);">Error loading runs.</td></tr>`;
    }
  };

  const showLogs = async (runId) => {
    const modal = container.querySelector('#log-viewer-modal');
    const content = container.querySelector('#log-content');
    modal.classList.remove('hidden');
    content.innerHTML = 'Loading logs...';
    
    try {
      const res = await fetch(`/api/runtime/run-logs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        const logs = data.logs || [];
        content.innerHTML = logs.map(log => `
          <div style="margin-bottom: 12px; border-left: 2px solid ${getRoleColor(log.role)}; padding-left: 12px;">
             <div style="font-weight: 800; font-size: 0.7rem; text-transform: uppercase; color: ${getRoleColor(log.role)}; margin-bottom: 4px;">${log.role}</div>
             <div style="color: var(--text-primary); line-height: 1.4;">${escapeHtml(log.content)}</div>
             ${log.tool_name ? `<div style="font-size: 0.7rem; color: var(--neon-cyan); margin-top: 4px;">🛠️ Tool: ${log.tool_name}</div>` : ''}
          </div>
        `).join('');
      }
    } catch (e) {
      content.innerHTML = 'Error loading logs.';
    }
  };

  const getRoleColor = (role) => {
    if (role === 'system') return 'var(--text-muted)';
    if (role === 'user') return 'var(--neon-blue)';
    if (role === 'assistant') return 'var(--neon-pink)';
    if (role === 'tool') return 'var(--neon-cyan)';
    return 'white';
  };

  const escapeHtml = (str) => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  container.querySelector('#close-log-viewer')?.addEventListener('click', () => {
     container.querySelector('#log-viewer-modal').classList.add('hidden');
  });

  loadRuns();
}
