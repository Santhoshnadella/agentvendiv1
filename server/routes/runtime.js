// ============================================================
// Runtime API Routes — Agent Execution + HITL + Time-Travel
// ============================================================

import { Router } from 'express';
import { AgentRuntime, retryFromCheckpoint } from '../lib/runtime.js';
import { getDB } from '../db.js';
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
router.get('/runs/:agentId', (req, res) => {
  const { agentId } = req.params;
  const db = getDB();

  try {
    let runs;
    if (agentId === 'current' || agentId === 'all') {
      runs = db.prepare('SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 100').all();
    } else {
      runs = db.prepare('SELECT * FROM agent_runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT 50').all(agentId);
    }
    res.json({ runs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch runs' });
  }
});

// ── Get Run Logs ───────────────────────────────────────────
router.get('/run-logs/:runId', (req, res) => {
  const { runId } = req.params;
  const db = getDB();

  try {
    const logs = db.prepare(
      'SELECT * FROM agent_run_logs WHERE run_id = ? ORDER BY turn_number ASC, created_at ASC'
    ).all(runId);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ── HITL: List Pending Approvals ───────────────────────────
router.get('/approvals', (req, res) => {
  const db = getDB();
  try {
    const approvals = db.prepare(
      "SELECT * FROM approvals WHERE status = 'pending' ORDER BY created_at DESC"
    ).all();
    res.json({ approvals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// ── HITL: Resolve Approval ─────────────────────────────────
router.post('/approvals/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'deny'

  if (!['approve', 'deny'].includes(action)) {
    return res.status(400).json({ error: 'Action must be "approve" or "deny"' });
  }

  const db = getDB();
  try {
    const status = action === 'approve' ? 'approved' : 'denied';
    const result = db.prepare(
      "UPDATE approvals SET status = ?, resolved_by = ?, resolved_at = datetime('now') WHERE id = ? AND status = 'pending'"
    ).run(status, req.user?.id || 'anonymous', id);

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

// ── Stats Summary ──────────────────────────────────────────
router.get('/stats', (req, res) => {
  const db = getDB();
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM agent_runs').get();
    const completed = db.prepare("SELECT COUNT(*) as count FROM agent_runs WHERE status = 'completed'").get();
    const totalCost = db.prepare('SELECT COALESCE(SUM(cost), 0) as total FROM agent_runs').get();
    const avgDuration = db.prepare('SELECT COALESCE(AVG(duration), 0) as avg FROM agent_runs').get();
    const totalTokens = db.prepare('SELECT COALESCE(SUM(tokens_used), 0) as total FROM agent_runs').get();
    const errors = db.prepare("SELECT COUNT(*) as count FROM agent_runs WHERE status IN ('error', 'loop_detected', 'timeout')").get();

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
