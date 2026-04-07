// ============================================================
// Admin Routes — Platform management
// ============================================================

import { Router } from 'express';
import { getDB, query, querySingle } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Admin middleware
async function requireAdmin(req, res, next) {
  const db = getDB();
  const user = (await querySingle('SELECT role FROM users WHERE id = ?', [req.user.id]));
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Platform stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const totalUsers = (await querySingle('SELECT COUNT(*) as c FROM users', [])).c;
    const totalAgents = (await querySingle('SELECT COUNT(*) as c FROM agents', [])).c;
    const marketplaceListings = (await querySingle('SELECT COUNT(*) as c FROM marketplace', [])).c;
    const totalClones = (await querySingle('SELECT COALESCE(SUM(clones),0) as c FROM marketplace', [])).c;
    const totalTeams = (await querySingle('SELECT COUNT(*) as c FROM teams', [])).c;
    const pendingModeration = (await querySingle("SELECT COUNT(*) as c FROM marketplace WHERE status = 'pending'", [])).c;

    const topAgents = (await query(`
      SELECT m.name, m.clones FROM marketplace m ORDER BY m.clones DESC LIMIT 8
    `, []));

    const recentActivity = (await query(`
      SELECT al.*, u.username FROM activity_log al 
      LEFT JOIN users u ON al.user_id = u.id 
      ORDER BY al.created_at DESC LIMIT 10
    `, []));

    res.json({ stats: { totalUsers, totalAgents, marketplaceListings, totalClones, totalTeams, pendingModeration }, topAgents, recentActivity });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// List users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const users = (await query(`
      SELECT u.id, u.username, u.email, u.role, u.status, u.created_at,
        (SELECT COUNT(*) FROM agents WHERE user_id = u.id) as agentCount
      FROM users u ORDER BY u.created_at DESC
    `, []));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Promote user to admin
router.post('/users/:id/promote', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    (await query("UPDATE users SET role = 'admin' WHERE id = ?", [req.params.id]));
    logActivity(db, req.user.id, 'promoted user', req.params.id);
    res.json({ message: 'User promoted to admin' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Ban/unban user
router.post('/users/:id/ban', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const user = (await querySingle('SELECT status FROM users WHERE id = ?', [req.params.id]));
    const newStatus = user?.status === 'banned' ? 'active' : 'banned';
    (await query("UPDATE users SET status = ? WHERE id = ?", [newStatus, req.params.id]));
    logActivity(db, req.user.id, `${newStatus === 'banned' ? 'banned' : 'unbanned'} user`, req.params.id);
    res.json({ message: `User ${newStatus}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// List all agents
router.get('/agents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const agents = (await query(`
      SELECT a.*, u.username FROM agents a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC
    `, []));
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

// Marketplace admin
router.get('/marketplace', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const listings = (await query(`
      SELECT m.*, u.username as author FROM marketplace m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
    `, []));
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list marketplace' });
  }
});

// Remove marketplace listing
router.post('/marketplace/:id/remove', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    (await query('DELETE FROM marketplace WHERE id = ?', [req.params.id]));
    logActivity(db, req.user.id, 'removed listing', req.params.id);
    res.json({ message: 'Listing removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove listing' });
  }
});

// Moderation queue
router.get('/moderation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const pending = (await query(`
      SELECT m.*, u.username FROM marketplace m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.status = 'pending'
      ORDER BY m.created_at ASC
    `, []));
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
});

// Approve agent
router.post('/agents/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    (await query("UPDATE marketplace SET status = 'approved' WHERE id = ?", [req.params.id]));
    logActivity(db, req.user.id, 'approved agent', req.params.id);
    res.json({ message: 'Agent approved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve' });
  }
});

// Reject agent
router.post('/agents/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    (await query("UPDATE marketplace SET status = 'rejected' WHERE id = ?", [req.params.id]));
    logActivity(db, req.user.id, 'rejected agent', req.params.id);
    res.json({ message: 'Agent rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject' });
  }
});

// Activity log
router.get('/activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const logs = (await query(`
      SELECT al.*, u.username FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC LIMIT 100
    `, []));
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Enterprise settings
router.get('/enterprise', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const configRow = (await querySingle('SELECT value FROM settings WHERE key = ?', ['enterprise_config']));
    const config = configRow ? JSON.parse(configRow.value) : {};
    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enterprise config' });
  }
});

router.post('/enterprise', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const { config } = req.body;
    (await query(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['enterprise_config', JSON.stringify(config)]
    ));
    logActivity(db, req.user.id, 'updated enterprise config', 'system');
    res.json({ message: 'Enterprise config updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update enterprise config' });
  }
});

async function logActivity(db, userId, action, target) {
  try {
    (await query(
      'INSERT INTO activity_log (user_id, action, target, created_at) VALUES (?, ?, ?, datetime("now"))',
      [userId, action, target || '']
    ));
  } catch (e) {}
}

export default router;
