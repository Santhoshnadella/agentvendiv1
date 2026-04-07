// ============================================================
// Export Routes — Generate & Download Agent Bundle
// ============================================================

import { Router } from 'express';
import { getDB, query, querySingle } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Export agent as JSON (the frontend handles ZIP bundling)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const agent = (await querySingle(
      'SELECT * FROM agents WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    ));
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const config = JSON.parse(agent.config || '{}');
    res.json({ agent: { ...agent, config } });
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
