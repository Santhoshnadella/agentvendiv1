// ============================================================
// Auth Routes — Register / Login / Profile
// ============================================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { getDB, query, querySingle } from '../db.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDB();
    const existing = (await querySingle('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]));
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const id = uuid();
    const password_hash = bcrypt.hashSync(password, 10);
    (await query(
      'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [id, username, email, password_hash]
    ));

    const token = jwt.sign({ id, username, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id, username, email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = getDB();
    const user = (await querySingle('SELECT * FROM users WHERE email = ?', [email]));
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
