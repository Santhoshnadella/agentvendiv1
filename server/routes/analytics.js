// ============================================================
// Analytics Routes — Agent performance stats
// ============================================================

import { Router } from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get user's analytics overview
router.get('/overview', authenticateToken, (req, res) => {
  try {
    const db = getDB();

    const totalAgents = db.prepare('SELECT COUNT(*) as count FROM agents WHERE user_id = ?').get(req.user.id).count;
    const publishedAgents = db.prepare('SELECT COUNT(*) as count FROM agents WHERE user_id = ? AND is_published = 1').get(req.user.id).count;

    const marketplaceStats = db.prepare(`
      SELECT 
        COALESCE(SUM(clones), 0) as totalClones,
        COALESCE(ROUND(AVG(CASE WHEN rating_count > 0 THEN rating_sum / rating_count END), 1), 0) as avgRating,
        COALESCE(SUM(rating_count), 0) as totalRatings
      FROM marketplace WHERE user_id = ?
    `).get(req.user.id);

    const topAgents = db.prepare(`
      SELECT m.name, m.clones, 
        CASE WHEN m.rating_count > 0 THEN ROUND(m.rating_sum / m.rating_count, 1) ELSE 0 END as rating,
        m.rating_count, m.created_at
      FROM marketplace m 
      WHERE m.user_id = ?
      ORDER BY m.clones DESC
      LIMIT 10
    `).all(req.user.id);

    const recentActivity = db.prepare(`
      SELECT name, version, updated_at 
      FROM agents 
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 10
    `).all(req.user.id);

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
router.get('/trending', (req, res) => {
  try {
    const db = getDB();

    const trending = db.prepare(`
      SELECT m.name, m.clones, u.username as author,
        CASE WHEN m.rating_count > 0 THEN ROUND(m.rating_sum / m.rating_count, 1) ELSE 0 END as rating
      FROM marketplace m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.clones DESC
      LIMIT 10
    `).all();

    const totalAgents = db.prepare('SELECT COUNT(*) as count FROM marketplace').get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({ trending, totalAgents, totalUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

export default router;
