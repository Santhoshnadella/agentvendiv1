// ============================================================
// Config Routes — Public/User-accessible platform config
// ============================================================

import { Router } from 'express';
import { getDB, query, querySingle } from '../db.js';

const router = Router();

router.get('/enterprise', async (req, res) => {
  try {
    const db = getDB();
    const row = (await querySingle('SELECT value FROM settings WHERE key = ?', ['enterprise_config']));
    const config = row ? JSON.parse(row.value) : {};
    
    // Only return non-sensitive fields to the frontend
    res.json({
      globalGuards: config.globalGuards || '',
      modelName: config.modelName || 'llama3.2'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

export default router;
