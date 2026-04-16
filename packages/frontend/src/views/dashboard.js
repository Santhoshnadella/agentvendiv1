// ============================================================
// Observability Dashboard — Real-time Agent Monitoring
// ============================================================

import { api } from '../lib/api.js';

export async function renderDashboard(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.5rem; font-weight: 800;">📊 Agent Observability</h2>
      <p class="form-hint">Monitor your agents' performance, logs, and activity.</p>
    </div>

    <div class="stats-overview" id="stats-summary" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px;">
       <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Total Runs</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--neon-cyan);" id="stat-total-runs">—</div>
       </div>
       <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Success Rate</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--neon-pink);" id="stat-success-rate">—</div>
       </div>
       <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Total Cost</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--neon-purple);" id="stat-total-cost">—</div>
       </div>
       <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Avg. Latency</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--neon-blue);" id="stat-avg-latency">—</div>
       </div>
    </div>

    <!-- HITL Approvals Panel -->
    <div class="card" id="hitl-panel" style="margin-bottom: 24px; display: none;">
       <div style="padding: 16px; border-bottom: var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 700; color: var(--neon-pink);">🚨 Pending Approvals (HITL)</div>
       </div>
       <div id="approvals-list" style="padding: 16px;"></div>
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
                   <th style="padding: 12px 16px;">Duration</th>
                   <th style="padding: 12px 16px;">Tokens</th>
                   <th style="padding: 12px 16px;">Cost</th>
                   <th style="padding: 12px 16px;">Actions</th>
                </tr>
             </thead>
             <tbody id="runs-table-body">
                <tr>
                   <td colspan="7" style="padding: 40px; text-align: center; color: var(--text-muted);">
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
          <div class="auth-title">Run Logs — Time-Travel Debugger</div>
          <div id="log-content" style="flex: 1; overflow-y: auto; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 0.85rem;">
          </div>
       </div>
    </div>
  `;

  const tableBody = container.querySelector('#runs-table-body');

  // ── Load Stats ───────────────────────────────────────────
  const loadStats = async () => {
    try {
      const res = await fetch('/api/runtime/stats');
      if (res.ok) {
        const s = await res.json();
        document.getElementById('stat-total-runs').textContent = s.totalRuns;
        document.getElementById('stat-success-rate').textContent = s.successRate + '%';
        document.getElementById('stat-total-cost').textContent = '$' + s.totalCost.toFixed(4);
        document.getElementById('stat-avg-latency').textContent = s.avgDuration + 'ms';
      }
    } catch (e) {
      // Stats endpoint unavailable — set defaults
      document.getElementById('stat-total-runs').textContent = '0';
      document.getElementById('stat-success-rate').textContent = '0%';
      document.getElementById('stat-total-cost').textContent = '$0.00';
      document.getElementById('stat-avg-latency').textContent = '0ms';
    }
  };

  // ── Load HITL Approvals ──────────────────────────────────
  const loadApprovals = async () => {
    try {
      const res = await fetch('/api/runtime/approvals');
      if (res.ok) {
        const data = await res.json();
        const approvals = data.approvals || [];
        const panel = container.querySelector('#hitl-panel');
        const list = container.querySelector('#approvals-list');

        if (approvals.length > 0) {
          panel.style.display = 'block';
          list.innerHTML = approvals.map(a => `
            <div class="card" style="padding: 16px; margin-bottom: 12px; border-left: 3px solid var(--neon-pink);">
               <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                     <div style="font-weight: 700;">Tool: <code>${escapeHtml(a.tool_name)}</code></div>
                     <div class="form-hint" style="margin-top: 4px;">Params: ${escapeHtml((a.parameters || '').substring(0, 100))}</div>
                     <div class="form-hint">Run: ${a.run_id.substring(0, 8)}… · ${new Date(a.created_at).toLocaleString()}</div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                     <button class="btn btn-glow btn-sm approve-btn" data-id="${a.id}">✅ Approve</button>
                     <button class="btn btn-danger btn-sm deny-btn" data-id="${a.id}">❌ Deny</button>
                  </div>
               </div>
            </div>
          `).join('');

          list.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => resolveApproval(btn.dataset.id, 'approve'));
          });
          list.querySelectorAll('.deny-btn').forEach(btn => {
            btn.addEventListener('click', () => resolveApproval(btn.dataset.id, 'deny'));
          });
        } else {
          panel.style.display = 'none';
        }
      }
    } catch (e) { /* approvals endpoint unavailable */ }
  };

  const resolveApproval = async (id, action) => {
    try {
      await fetch(`/api/runtime/approvals/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      window.showToast?.(`Approval ${action === 'approve' ? 'granted ✅' : 'denied ❌'}`, action === 'approve' ? 'success' : 'info');
      loadApprovals();
    } catch (e) {
      window.showToast?.('Failed to resolve approval', 'error');
    }
  };

  // ── Load Runs ────────────────────────────────────────────
  const loadRuns = async () => {
    try {
      const res = await fetch('/api/runtime/runs/current');
      let runs = [];
      if (res.ok) {
        const data = await res.json();
        runs = data.runs || [];
      }

      if (runs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="padding: 40px; text-align: center; color: var(--text-muted);">No runs found yet. Start an agent in the Sandbox!</td></tr>`;
        return;
      }

      const statusColors = {
        completed: 'active',
        running: '',
        error: 'danger',
        timeout: 'danger',
        loop_detected: 'danger',
        max_turns: 'danger',
        time_travel: '',
      };

      tableBody.innerHTML = runs.map(run => `
        <tr style="border-bottom: var(--border-subtle);">
           <td style="padding: 12px 16px; font-weight: 600;">${escapeHtml(run.agent_id || 'preview')}</td>
           <td style="padding: 12px 16px; color: var(--text-secondary); font-size: 0.85rem;">${new Date(run.created_at).toLocaleString()}</td>
           <td style="padding: 12px 16px;">
              <span class="tag ${statusColors[run.status] || ''}" style="font-size: 0.7rem;">
                 ${run.status}
              </span>
           </td>
           <td style="padding: 12px 16px;">${run.duration || 0}ms</td>
           <td style="padding: 12px 16px;">${run.tokens_used || 0}</td>
           <td style="padding: 12px 16px; color: var(--neon-purple);">$${(run.cost || 0).toFixed(4)}</td>
           <td style="padding: 12px 16px;">
              <button class="btn btn-outline btn-sm view-logs-btn" data-id="${run.id}">View Logs</button>
           </td>
        </tr>
      `).join('');

      container.querySelectorAll('.view-logs-btn').forEach(btn => {
         btn.addEventListener('click', () => showLogs(btn.dataset.id));
      });
    } catch (e) {
      tableBody.innerHTML = `<tr><td colspan="7" style="padding: 40px; text-align: center; color: var(--neon-pink);">Error loading runs.</td></tr>`;
    }
  };

  // ── Show Logs + Time-Travel ──────────────────────────────
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

        if (logs.length === 0) {
          content.innerHTML = '<div style="color: var(--text-muted); text-align: center;">No logs for this run.</div>';
          return;
        }

        content.innerHTML = logs.map(log => `
          <div class="log-item" style="margin-bottom: 12px; border-left: 2px solid ${getRoleColor(log.role)}; padding-left: 12px; position: relative;">
             <div style="display: flex; justify-content: space-between; align-items: center;">
               <div style="font-weight: 800; font-size: 0.7rem; text-transform: uppercase; color: ${getRoleColor(log.role)};">
                 ${log.role} ${log.turn_number ? `· Turn ${log.turn_number}` : ''}
               </div>
               ${log.role === 'assistant' ? `
                  <button class="btn btn-outline btn-xs retry-from-btn"
                    data-run-id="${runId}"
                    data-log-id="${log.id}"
                    style="font-size: 0.6rem;">
                    ⏪ Retry from here
                  </button>
               ` : ''}
             </div>
             <div style="color: var(--text-primary); line-height: 1.4; margin-top: 4px;"
                  class="log-text"
                  ${log.role === 'assistant' ? 'contenteditable="true"' : ''}>
               ${escapeHtml(log.content)}
             </div>
             ${log.tool_name ? `<div style="font-size: 0.7rem; color: var(--neon-cyan); margin-top: 4px;">🛠️ Tool: ${log.tool_name}</div>` : ''}
          </div>
        `).join('');

        content.querySelectorAll('.retry-from-btn').forEach(btn => {
           btn.addEventListener('click', async () => {
             const logItem = btn.closest('.log-item');
             const editedText = logItem.querySelector('.log-text').textContent.trim();
             await retryRun(btn.dataset.runId, btn.dataset.logId, editedText);
           });
        });
      }
    } catch (e) {
      content.innerHTML = 'Error loading logs.';
    }
  };

  const retryRun = async (runId, logId, editedContent) => {
    window.showToast?.('Time-travel initiated... Rewriting history. 🕰️', 'info');
    try {
      const res = await fetch(`/api/runtime/retry/${runId}/${logId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedContent })
      });
      if (res.ok) {
        const data = await res.json();
        window.showToast?.(`Agent restarted! New run: ${data.newRunId.substring(0, 8)}…`, 'success');
        loadRuns();
        loadStats();
      } else {
        throw new Error('Retry failed');
      }
    } catch (e) {
      window.showToast?.('Time-travel failed: ' + e.message, 'error');
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
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  container.querySelector('#close-log-viewer')?.addEventListener('click', () => {
     container.querySelector('#log-viewer-modal').classList.add('hidden');
  });

  container.querySelector('#refresh-dashboard')?.addEventListener('click', () => {
    loadStats();
    loadRuns();
    loadApprovals();
  });

  // Initial load
  loadStats();
  loadRuns();
  loadApprovals();

  // Auto-refresh approvals every 5 seconds (for HITL responsiveness)
  const approvalInterval = setInterval(loadApprovals, 5000);

  // Cleanup on navigation (avoid memory leaks)
  const observer = new MutationObserver(() => {
    if (!document.contains(container)) {
      clearInterval(approvalInterval);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
