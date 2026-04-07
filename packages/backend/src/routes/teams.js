// ============================================================
// Team Routes
// ============================================================

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB, query, querySingle } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// List teams
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const teams = (await query(`
      SELECT t.*, COUNT(tm.user_id) as memberCount
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.owner_id = ? OR tm.user_id = ?
      GROUP BY t.id
    `, [req.user.id, req.user.id]));
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list teams' });
  }
});

// Create team
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name required' });

    const id = uuid();
    (await query(
      'INSERT INTO teams (id, name, description, owner_id) VALUES (?, ?, ?, ?)',
      [id, name, description || '', req.user.id]
    ));
    (await query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
      [id, req.user.id, 'owner']
    ));

    res.json({ id, message: 'Team created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Invite member
router.post('/:id/invite', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { email } = req.body;
    const user = (await querySingle('SELECT id FROM users WHERE email = ?', [email]));
    if (!user) return res.status(404).json({ error: 'User not found' });

    (await query(
      'INSERT OR IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)',
      [req.params.id, user.id]
    ));
    res.json({ message: 'Member invited' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to invite' });
  }
});

export default router;
