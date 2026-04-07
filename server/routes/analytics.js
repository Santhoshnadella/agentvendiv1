// ============================================================
// Analytics Routes — Agent performance stats
// ============================================================

import { Router } from 'express';
import { getDB, query, querySingle } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get user's analytics overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const db = getDB();

    const totalAgents = (await querySingle('SELECT COUNT(*) as count FROM agents WHERE user_id = ?', [req.user.id])).count;
    const publishedAgents = (await querySingle(
      'SELECT COUNT(*) as count FROM agents WHERE user_id = ? AND is_published = 1',
      [req.user.id]
    )).count;

    const marketplaceStats = (await querySingle(`
      SELECT 
        COALESCE(SUM(clones), 0) as totalClones,
        COALESCE(ROUND(AVG(CASE WHEN rating_count > 0 THEN rating_sum / rating_count END), 1), 0) as avgRating,
        COALESCE(SUM(rating_count), 0) as totalRatings
      FROM marketplace WHERE user_id = ?
    `, [req.user.id]));

    const topAgents = (await query(`
      SELECT m.name, m.clones, 
        CASE WHEN m.rating_count > 0 THEN ROUND(m.rating_sum / m.rating_count, 1) ELSE 0 END as rating,
        m.rating_count, m.created_at
      FROM marketplace m 
      WHERE m.user_id = ?
      ORDER BY m.clones DESC
      LIMIT 10
    `, [req.user.id]));

    const recentActivity = (await query(`
      SELECT name, version, updated_at 
      FROM agents 
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 10
    `, [req.user.id]));

    res.json({
      totalAgents,
      publishedAgents,
      totalClones: marketplaceStats.totalClones,
      avgRating: marketplaceStats.avgRating,
      totalRatings: marketplaceStats.totalRatings,
      topAgents,
      recentActivity,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get marketplace-wide trending stats
router.get('/trending', async (req, res) => {
  try {
    const db = getDB();

    const trending = (await query(`
      SELECT m.name, m.clones, u.username as author,
        CASE WHEN m.rating_count > 0 THEN ROUND(m.rating_sum / m.rating_count, 1) ELSE 0 END as rating
      FROM marketplace m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.clones DESC
      LIMIT 10
    `, []));

    const totalAgents = (await querySingle('SELECT COUNT(*) as count FROM marketplace', [])).count;
    const totalUsers = (await querySingle('SELECT COUNT(*) as count FROM users', [])).count;

    res.json({ trending, totalAgents, totalUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

export default router;
