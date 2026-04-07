// ============================================================
// Agent Routes — CRUD + Versioning + Publishing
// ============================================================

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB, query, querySingle } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// List user's agents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const agents = (await query(
      'SELECT id, name, config, version, is_published, created_at, updated_at FROM agents WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    ));
    const parsed = agents.map(a => ({
      ...a,
      config: JSON.parse(a.config || '{}'),
      role: JSON.parse(a.config || '{}').role?.title || '',
    }));
    res.json({ agents: parsed });
  } catch (err) {
    console.error('List agents error:', err);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

// Get single agent
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const agent = (await querySingle(
      'SELECT * FROM agents WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    ));
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    agent.config = JSON.parse(agent.config || '{}');
    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

// Create agent
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const id = uuid();
    const { name, config, rawConfig, sourceFormat } = req.body;

    const configStr = rawConfig ? JSON.stringify({ imported: true, rawConfig, sourceFormat }) : JSON.stringify(config || {});

    (await query(
      'INSERT INTO agents (id, user_id, name, config) VALUES (?, ?, ?, ?)',
      [id, req.user.id, name || 'Untitled Agent', configStr]
    ));

    // Save version
    (await query(
      'INSERT INTO agent_versions (id, agent_id, version, config) VALUES (?, ?, 1, ?)',
      [uuid(), id, configStr]
    ));

    res.json({ id, message: 'Agent created' });
  } catch (err) {
    console.error('Create agent error:', err);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const agent = (await querySingle(
      'SELECT * FROM agents WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    ));
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const newVersion = agent.version + 1;
    const configStr = JSON.stringify(req.body.config || {});
    const name = req.body.name || agent.name;

    (await query(
      "UPDATE agents SET name = ?, config = ?, version = ?, updated_at = datetime('now') WHERE id = ?",
      [name, configStr, newVersion, agent.id]
    ));

    // Save version history
    (await query(
      'INSERT INTO agent_versions (id, agent_id, version, config) VALUES (?, ?, ?, ?)',
      [uuid(), agent.id, newVersion, configStr]
    ));

    res.json({ message: 'Agent updated', version: newVersion });
  } catch (err) {
    console.error('Update agent error:', err);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const result = (await query(
      'DELETE FROM agents WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    ));
    if (result.changes === 0) return res.status(404).json({ error: 'Agent not found' });
    res.json({ message: 'Agent deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Publish to marketplace
router.post('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const agent = (await querySingle(
      'SELECT * FROM agents WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    ));
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const config = JSON.parse(agent.config || '{}');
    const id = uuid();

    (await query(
      'INSERT INTO marketplace (id, agent_id, user_id, name, description, tags, config) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        agent.id,
        req.user.id,
        agent.name,
        config.role?.persona || '',
        JSON.stringify(config.skills?.selected || []),
        agent.config
      ]
    ));

    (await query('UPDATE agents SET is_published = 1 WHERE id = ?', [agent.id]));

    res.json({ message: 'Published to marketplace', marketplaceId: id });
  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ error: 'Failed to publish' });
  }
});

// Clone from marketplace
router.post('/:id/clone', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const listing = (await querySingle('SELECT * FROM marketplace WHERE id = ?', [req.params.id]));
    if (!listing) return res.status(404).json({ error: 'Marketplace listing not found' });

    const id = uuid();
    (await query(
      'INSERT INTO agents (id, user_id, name, config) VALUES (?, ?, ?, ?)',
      [id, req.user.id, listing.name + ' (cloned)', listing.config]
    ));

    // Increment clone count
    (await query('UPDATE marketplace SET clones = clones + 1 WHERE id = ?', [listing.id]));

    res.json({ message: 'Agent cloned', agentId: id });
  } catch (err) {
    console.error('Clone error:', err);
    res.status(500).json({ error: 'Failed to clone' });
  }
});

// Get version history
router.get('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const versions = (await query(
      'SELECT id, version, created_at FROM agent_versions WHERE agent_id = ? ORDER BY version DESC',
      [req.params.id]
    ));
    res.json({ versions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get versions' });
  }
});

// Compare two versions
router.get('/:id/compare', authenticateToken, async (req, res) => {
  try {
    const { v1, v2 } = req.query;
    const db = getDB();
    const ver1 = (await querySingle(
      'SELECT config FROM agent_versions WHERE agent_id = ? AND version = ?',
      [req.params.id, v1]
    ));
    const ver2 = (await querySingle(
      'SELECT config FROM agent_versions WHERE agent_id = ? AND version = ?',
      [req.params.id, v2]
    ));
    
    if (!ver1 || !ver2) return res.status(404).json({ error: 'Versions not found' });
    res.json({ v1: JSON.parse(ver1.config), v2: JSON.parse(ver2.config) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compare versions' });
  }
});

export default router;
