// ============================================================
// Admin Routes — Platform management
// ============================================================

import { Router } from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Admin middleware
function requireAdmin(req, res, next) {
  const db = getDB();
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Platform stats
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const totalAgents = db.prepare('SELECT COUNT(*) as c FROM agents').get().c;
    const marketplaceListings = db.prepare('SELECT COUNT(*) as c FROM marketplace').get().c;
    const totalClones = db.prepare('SELECT COALESCE(SUM(clones),0) as c FROM marketplace').get().c;
    const totalTeams = db.prepare('SELECT COUNT(*) as c FROM teams').get().c;
    const pendingModeration = db.prepare("SELECT COUNT(*) as c FROM marketplace WHERE status = 'pending'").get().c;

    const topAgents = db.prepare(`
      SELECT m.name, m.clones FROM marketplace m ORDER BY m.clones DESC LIMIT 8
    `).all();

    const recentActivity = db.prepare(`
      SELECT al.*, u.username FROM activity_log al 
      LEFT JOIN users u ON al.user_id = u.id 
      ORDER BY al.created_at DESC LIMIT 10
    `).all();

    res.json({ stats: { totalUsers, totalAgents, marketplaceListings, totalClones, totalTeams, pendingModeration }, topAgents, recentActivity });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// List users
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const users = db.prepare(`
      SELECT u.id, u.username, u.email, u.role, u.status, u.created_at,
        (SELECT COUNT(*) FROM agents WHERE user_id = u.id) as agentCount
      FROM users u ORDER BY u.created_at DESC
    `).all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Promote user to admin
router.post('/users/:id/promote', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(req.params.id);
    logActivity(db, req.user.id, 'promoted user', req.params.id);
    res.json({ message: 'User promoted to admin' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Ban/unban user
router.post('/users/:id/ban', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const user = db.prepare('SELECT status FROM users WHERE id = ?').get(req.params.id);
    const newStatus = user?.status === 'banned' ? 'active' : 'banned';
    db.prepare("UPDATE users SET status = ? WHERE id = ?").run(newStatus, req.params.id);
    logActivity(db, req.user.id, `${newStatus === 'banned' ? 'banned' : 'unbanned'} user`, req.params.id);
    res.json({ message: `User ${newStatus}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// List all agents
router.get('/agents', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const agents = db.prepare(`
      SELECT a.*, u.username FROM agents a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC
    `).all();
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

// Marketplace admin
router.get('/marketplace', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const listings = db.prepare(`
      SELECT m.*, u.username as author FROM marketplace m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
    `).all();
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list marketplace' });
  }
});

// Remove marketplace listing
router.post('/marketplace/:id/remove', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    db.prepare('DELETE FROM marketplace WHERE id = ?').run(req.params.id);
    logActivity(db, req.user.id, 'removed listing', req.params.id);
    res.json({ message: 'Listing removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove listing' });
  }
});

// Moderation queue
router.get('/moderation', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const pending = db.prepare(`
      SELECT m.*, u.username FROM marketplace m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.status = 'pending'
      ORDER BY m.created_at ASC
    `).all();
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
});

// Approve agent
router.post('/agents/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    db.prepare("UPDATE marketplace SET status = 'approved' WHERE id = ?").run(req.params.id);
    logActivity(db, req.user.id, 'approved agent', req.params.id);
    res.json({ message: 'Agent approved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve' });
  }
});

// Reject agent
router.post('/agents/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    db.prepare("UPDATE marketplace SET status = 'rejected' WHERE id = ?").run(req.params.id);
    logActivity(db, req.user.id, 'rejected agent', req.params.id);
    res.json({ message: 'Agent rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject' });
  }
});

// Activity log
router.get('/activity', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const logs = db.prepare(`
      SELECT al.*, u.username FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC LIMIT 100
    `).all();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Enterprise settings
router.get('/enterprise', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const configRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('enterprise_config');
    const config = configRow ? JSON.parse(configRow.value) : {};
    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enterprise config' });
  }
});

router.post('/enterprise', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const { config } = req.body;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('enterprise_config', JSON.stringify(config));
    logActivity(db, req.user.id, 'updated enterprise config', 'system');
    res.json({ message: 'Enterprise config updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update enterprise config' });
  }
});

function logActivity(db, userId, action, target) {
  try {
    db.prepare('INSERT INTO activity_log (user_id, action, target, created_at) VALUES (?, ?, ?, datetime("now"))').run(userId, action, target || '');
  } catch (e) {}
}

export default router;
