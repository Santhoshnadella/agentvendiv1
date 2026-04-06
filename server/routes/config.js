// ============================================================
// Config Routes — Public/User-accessible platform config
// ============================================================

import { Router } from 'express';
import { getDB } from '../db.js';

const router = Router();

router.get('/enterprise', (req, res) => {
  try {
    const db = getDB();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('enterprise_config');
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
