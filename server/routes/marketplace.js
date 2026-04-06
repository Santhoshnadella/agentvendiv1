// ============================================================
// Marketplace Routes
// ============================================================

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Browse marketplace
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'recent';

    let orderBy = 'created_at DESC';
    if (sort === 'rating') orderBy = 'CASE WHEN rating_count > 0 THEN rating_sum / rating_count ELSE 0 END DESC';
    if (sort === 'popular') orderBy = 'clones DESC';

    const agents = db.prepare(`
      SELECT m.*, u.username as author
      FROM marketplace m
      JOIN users u ON m.user_id = u.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const parsed = agents.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      tags: a.tags,
      author: a.author,
      clones: a.clones,
      rating: a.rating_count > 0 ? a.rating_sum / a.rating_count : 0,
      ratingCount: a.rating_count,
      created_at: a.created_at,
    }));

    res.json({ agents: parsed, page, limit });
  } catch (err) {
    console.error('Browse marketplace error:', err);
    res.status(500).json({ error: 'Failed to browse marketplace' });
  }
});

// Search marketplace
router.get('/search', (req, res) => {
  try {
    const db = getDB();
    const q = req.query.q || '';
    const agents = db.prepare(`
      SELECT m.*, u.username as author
      FROM marketplace m
      JOIN users u ON m.user_id = u.id
      WHERE m.name LIKE ? OR m.description LIKE ? OR m.tags LIKE ?
      ORDER BY clones DESC
      LIMIT 50
    `).all(`%${q}%`, `%${q}%`, `%${q}%`);

    const parsed = agents.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      tags: a.tags,
      author: a.author,
      clones: a.clones,
      rating: a.rating_count > 0 ? a.rating_sum / a.rating_count : 0,
    }));

    res.json({ agents: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get single listing
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const listing = db.prepare(`
      SELECT m.*, u.username as author
      FROM marketplace m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(req.params.id);

    if (!listing) return res.status(404).json({ error: 'Not found' });

    listing.config = JSON.parse(listing.config || '{}');
    listing.rating = listing.rating_count > 0 ? listing.rating_sum / listing.rating_count : 0;

    res.json({ listing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get listing' });
  }
});

// Rate an agent
router.post('/:id/rate', authenticateToken, (req, res) => {
  try {
    const db = getDB();
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }

    const listing = db.prepare('SELECT * FROM marketplace WHERE id = ?').get(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Not found' });

    // Upsert rating
    const existing = db.prepare('SELECT * FROM ratings WHERE marketplace_id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (existing) {
      const diff = rating - existing.rating;
      db.prepare('UPDATE ratings SET rating = ? WHERE id = ?').run(rating, existing.id);
      db.prepare('UPDATE marketplace SET rating_sum = rating_sum + ? WHERE id = ?').run(diff, req.params.id);
    } else {
      db.prepare('INSERT INTO ratings (id, marketplace_id, user_id, rating) VALUES (?, ?, ?, ?)').run(uuid(), req.params.id, req.user.id, rating);
      db.prepare('UPDATE marketplace SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE id = ?').run(rating, req.params.id);
    }

    res.json({ message: 'Rating saved' });
  } catch (err) {
    console.error('Rate error:', err);
    res.status(500).json({ error: 'Failed to rate' });
  }
});

export default router;
