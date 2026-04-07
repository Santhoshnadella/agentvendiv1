// ============================================================
// Runtime API Routes — Agent Execution + HITL + Time-Travel
// ============================================================

import { Router } from 'express';
import { AgentRuntime, retryFromCheckpoint } from '../lib/runtime.js';
import { getDB, query, querySingle } from '../db.js';
import { protectPrompt, authenticateApiKey } from '../middleware/security.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// ── Execute Agent ──────────────────────────────────────────
// Supports both JWT auth and API Key auth
router.post('/execute/:agentId', optionalAuth, authenticateApiKey, protectPrompt, async (req, res) => {
  const { agentId } = req.params;
  const { input, config } = req.body;
  const userId = req.user?.id || 'anonymous';

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return res.status(400).json({ error: 'Input is required and must be a non-empty string.' });
  }

  try {
    const runtime = new AgentRuntime(agentId, userId);
    const result = await runtime.start(input.trim(), config || {});
    res.json({
      result,
      runId: runtime.runId,
      tokens: runtime.totalTokens,
      turns: runtime.turnNumber,
      duration: Date.now() - runtime.startTime,
    });
  } catch (err) {
    console.error(`Runtime error [${agentId}]:`, err.message);
    res.status(500).json({ error: err.message, code: 'RUNTIME_ERROR' });
  }
});

// ── List Runs ──────────────────────────────────────────────
router.get('/runs/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const db = getDB();

  try {
    let runs;
    if (agentId === 'current' || agentId === 'all') {
      runs = (await query('SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 100', []));
    } else {
      runs = (await query(
        'SELECT * FROM agent_runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT 50',
        [agentId]
      ));
    }
    res.json({ runs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch runs' });
  }
});

// ── Get Run Logs ───────────────────────────────────────────
router.get('/run-logs/:runId', async (req, res) => {
  const { runId } = req.params;
  const db = getDB();

  try {
    const logs = (await query(
      'SELECT * FROM agent_run_logs WHERE run_id = ? ORDER BY turn_number ASC, created_at ASC',
      [runId]
    ));
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ── HITL: List Pending Approvals ───────────────────────────
router.get('/approvals', async (req, res) => {
  const db = getDB();
  try {
    const approvals = (await query(
      "SELECT * FROM approvals WHERE status = 'pending' ORDER BY created_at DESC",
      []
    ));
    res.json({ approvals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// ── HITL: Resolve Approval ─────────────────────────────────
router.post('/approvals/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'deny'

  if (!['approve', 'deny'].includes(action)) {
    return res.status(400).json({ error: 'Action must be "approve" or "deny"' });
  }

  const db = getDB();
  try {
    const status = action === 'approve' ? 'approved' : 'denied';
    const result = (await query(
      "UPDATE approvals SET status = ?, resolved_by = ?, resolved_at = datetime('now') WHERE id = ? AND status = 'pending'",
      [status, req.user?.id || 'anonymous', id]
    ));

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Approval not found or already resolved' });
    }
    res.json({ message: `Approval ${status}`, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve approval' });
  }
});

// ── Time-Travel: Retry from Checkpoint ─────────────────────
router.post('/retry/:runId/:logId', async (req, res) => {
  const { runId, logId } = req.params;
  const { editedContent, config } = req.body;

  if (!editedContent) {
    return res.status(400).json({ error: 'editedContent is required' });
  }

  try {
    const result = await retryFromCheckpoint(runId, logId, editedContent, config || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Time-Travel: Timeline Visualization ────────────────────
router.get('/runs/:id/timeline', async (req, res) => {
  const { id } = req.params;
  try {
    const snapshots = await query('SELECT step_number, timestamp, state FROM agent_snapshots WHERE run_id = ? ORDER BY step_number ASC', [id]);
    
    const timeline = snapshots.map(s => {
       const state = JSON.parse(s.state);
       return {
           step_number: s.step_number,
           timestamp: s.timestamp,
           action_type: state.action_type || 'think',
           thought_summary: state.thought ? state.thought.substring(0, 100) + '...' : '',
           tool_name: state.tool_name,
           tool_input: state.tool_input,
           tool_output_preview: state.tool_output ? state.tool_output.substring(0, 100) + '...' : ''
       };
    });

    res.json({ timeline });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Time-Travel: Edit & Replay (Fork) ──────────────────────
router.post('/runs/:id/fork', authenticateApiKey, async (req, res) => {
  const { id } = req.params;
  const { from_step, edited_thought, edited_context, config } = req.body;
  
  if (from_step === undefined) return res.status(400).json({ error: 'from_step required' });

  try {
    // Branch creation logic
    const originalRun = await querySingle('SELECT * FROM agent_runs WHERE id = ?', [id]);
    if (!originalRun) return res.status(404).json({ error: 'Run not found' });

    // Enforce limits (max 10 forks per run)
    const forks = await querySingle('SELECT COUNT(*) as count FROM agent_runs WHERE parent_run_id = ?', [id]);
    if (forks && forks.count >= 10) return res.status(403).json({ error: 'Max 10 forks reached for this run.' });

    const newRunId = uuidv4();
    await query(`
        INSERT INTO agent_runs (id, agent_id, user_id, status, input, parent_run_id, forked_from_step)
        VALUES (?, ?, ?, 'running', ?, ?, ?)
    `, [newRunId, originalRun.agent_id, originalRun.user_id, originalRun.input, id, from_step]);

    // Async replay logic
    const runtime = new AgentRuntime(originalRun.agent_id, originalRun.user_id);
    runtime.runId = newRunId; // override run ID
    
    // Pass edited state inside config for the runtime to pick up (deterministic replay)
    const runConfig = config || {};
    runConfig.fork_from = { step: from_step, thought: edited_thought, context: edited_context };
    
    const result = await runtime.start(originalRun.input, runConfig);
    
    res.json({ new_run_id: newRunId, status: 'forked', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Time-Travel: State At Step ─────────────────────────────
router.get('/runs/:id/state-at/:step', async (req, res) => {
  try {
     const snapshot = await querySingle('SELECT * FROM agent_snapshots WHERE run_id = ? AND step_number = ?', [req.params.id, req.params.step]);
     if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
     res.json({ state: JSON.parse(snapshot.state), timestamp: snapshot.timestamp });
  } catch(e) {
     res.status(500).json({ error: e.message });
  }
});

// ── Time-Travel: Compare Runs ──────────────────────────────
router.post('/runs/compare', async (req, res) => {
  const { run_id_1, run_id_2, step } = req.body;
  try {
     const snap1 = await querySingle('SELECT state FROM agent_snapshots WHERE run_id = ? AND step_number = ?', [run_id_1, step]);
     const snap2 = await querySingle('SELECT state FROM agent_snapshots WHERE run_id = ? AND step_number = ?', [run_id_2, step]);
     
     res.json({
         diff: {
             run1: snap1 ? JSON.parse(snap1.state) : null,
             run2: snap2 ? JSON.parse(snap2.state) : null
         }
     });
  } catch (e) {
     res.status(500).json({ error: e.message });
  }
});

// ── Stats Summary ──────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const db = getDB();
  try {
    const total = (await querySingle('SELECT COUNT(*) as count FROM agent_runs', []));
    const completed = (await querySingle("SELECT COUNT(*) as count FROM agent_runs WHERE status = 'completed'", []));
    const totalCost = (await querySingle('SELECT COALESCE(SUM(cost), 0) as total FROM agent_runs', []));
    const avgDuration = (await querySingle('SELECT COALESCE(AVG(duration), 0) as avg FROM agent_runs', []));
    const totalTokens = (await querySingle('SELECT COALESCE(SUM(tokens_used), 0) as total FROM agent_runs', []));
    const errors = (await querySingle(
      "SELECT COUNT(*) as count FROM agent_runs WHERE status IN ('error', 'loop_detected', 'timeout')",
      []
    ));

    res.json({
      totalRuns: total.count,
      completedRuns: completed.count,
      successRate: total.count > 0 ? Math.round((completed.count / total.count) * 100) : 0,
      totalCost: totalCost.total,
      avgDuration: Math.round(avgDuration.avg),
      totalTokens: totalTokens.total,
      errorCount: errors.count,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

export default router;
