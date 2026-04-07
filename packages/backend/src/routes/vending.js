// ============================================================
// Vending Machine API — Public agent execution endpoint
// ============================================================
//
// This allows external consumers to call configured agents
// using API keys. It's the "Agent-as-a-Service" layer.
//

import { Router } from 'express';
import { AgentRuntime } from '../lib/runtime.js';
import { getDB, query, querySingle } from '../db.js';
import { authenticateApiKey, generateApiKey, protectPrompt } from '../middleware/security.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// ── Execute agent via API Key ──────────────────────────────
router.post('/execute/:agentId', authenticateApiKey, protectPrompt, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Pass your API key as: Authorization: Bearer av_...',
      docs: '/api-docs'
    });
  }

  const { agentId } = req.params;
  const { input, config, hitl } = req.body;

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return res.status(400).json({ error: 'input is required (string)' });
  }

  try {
    const runtime = new AgentRuntime(agentId, req.user.id);
    const result = await runtime.start(input.trim(), config || {});

    res.json({
      success: true,
      result,
      metadata: {
        runId: runtime.runId,
        agentId,
        tokens: runtime.totalTokens,
        turns: runtime.turnNumber,
        durationMs: Date.now() - runtime.startTime,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Generate API Key ───────────────────────────────────────
router.post('/keys', authenticateToken, async (req, res) => {
  const { name, expiresInDays } = req.body;

  try {
    const { raw, hash, prefix } = generateApiKey();
    const db = getDB();

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null;

    const id = crypto.randomUUID();
    (await query(`
      INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, req.user.id, hash, prefix, name || 'Unnamed Key', expiresAt]));

    // IMPORTANT: The raw key is only returned ONCE. It's never stored.
    res.json({
      message: 'API key generated. Save this — it will not be shown again.',
      key: raw,
      prefix,
      expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate key' });
  }
});

// ── List API Keys ──────────────────────────────────────────
router.get('/keys', authenticateToken, async (req, res) => {
  const db = getDB();
  try {
    const keys = (await query(
      'SELECT id, key_prefix, name, is_active, last_used_at, expires_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    ));
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list keys' });
  }
});

// ── Revoke API Key ─────────────────────────────────────────
router.delete('/keys/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  try {
    const result = (await query(
      'UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    ));

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Key not found' });
    }
    res.json({ message: 'Key revoked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke key' });
  }
});

export default router;
