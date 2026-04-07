// ============================================================
// Agent Routes — CRUD + Versioning + Publishing
// ============================================================

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// List user's agents
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDB();
    const agents = db.prepare('SELECT id, name, config, version, is_published, created_at, updated_at FROM agents WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
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
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDB();
    const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    agent.config = JSON.parse(agent.config || '{}');
    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

// Create agent
router.post('/', authenticateToken, (req, res) => {
  try {
    const db = getDB();
    const id = uuid();
    const { name, config, rawConfig, sourceFormat } = req.body;

    const configStr = rawConfig ? JSON.stringify({ imported: true, rawConfig, sourceFormat }) : JSON.stringify(config || {});

    db.prepare('INSERT INTO agents (id, user_id, name, config) VALUES (?, ?, ?, ?)').run(id, req.user.id, name || 'Untitled Agent', configStr);

    // Save version
    db.prepare('INSERT INTO agent_versions (id, agent_id, version, config) VALUES (?, ?, 1, ?)').run(uuid(), id, configStr);

    res.json({ id, message: 'Agent created' });
  } catch (err) {
    console.error('Create agent error:', err);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDB();
    const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const newVersion = agent.version + 1;
    const configStr = JSON.stringify(req.body.config || {});
    const name = req.body.name || agent.name;

    db.prepare("UPDATE agents SET name = ?, config = ?, version = ?, updated_at = datetime('now') WHERE id = ?").run(name, configStr, newVersion, agent.id);

    // Save version history
    db.prepare('INSERT INTO agent_versions (id, agent_id, version, config) VALUES (?, ?, ?, ?)').run(uuid(), agent.id, newVersion, configStr);

    res.json({ message: 'Agent updated', version: newVersion });
  } catch (err) {
    console.error('Update agent error:', err);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDB();
    const result = db.prepare('DELETE FROM agents WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Agent not found' });
    res.json({ message: 'Agent deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Publish to marketplace
router.post('/:id/publish', authenticateToken, (req, res) => {
  try {
    const db = getDB();
    const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const config = JSON.parse(agent.config || '{}');
    const id = uuid();

    db.prepare('INSERT INTO marketplace (id, agent_id, user_id, name, description, tags, config) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, agent.id, req.user.id, agent.name,
      config.role?.persona || '',
      JSON.stringify(config.skills?.selected || []),
      agent.config,
    );

    db.prepare('UPDATE agents SET is_published = 1 WHERE id = ?').run(agent.id);

    res.json({ message: 'Published to marketplace', marketplaceId: id });
  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ error: 'Failed to publish' });
  }
});

// Clone from marketplace
router.post('/:id/clone', authenticateToken, (req, res) => {
  try {
    const db = getDB();
    const listing = db.prepare('SELECT * FROM marketplace WHERE id = ?').get(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Marketplace listing not found' });

    const id = uuid();
    db.prepare('INSERT INTO agents (id, user_id, name, config) VALUES (?, ?, ?, ?)').run(id, req.user.id, listing.name + ' (cloned)', listing.config);

    // Increment clone count
    db.prepare('UPDATE marketplace SET clones = clones + 1 WHERE id = ?').run(listing.id);

    res.json({ message: 'Agent cloned', agentId: id });
  } catch (err) {
    console.error('Clone error:', err);
    res.status(500).json({ error: 'Failed to clone' });
  }
});

// Get version history
router.get('/:id/versions', authenticateToken, (req, res) => {
  try {
    const db = getDB();
    const versions = db.prepare('SELECT id, version, created_at FROM agent_versions WHERE agent_id = ? ORDER BY version DESC').all(req.params.id);
    res.json({ versions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get versions' });
  }
});

// Compare two versions
router.get('/:id/compare', authenticateToken, (req, res) => {
  try {
    const { v1, v2 } = req.query;
    const db = getDB();
    const ver1 = db.prepare('SELECT config FROM agent_versions WHERE agent_id = ? AND version = ?').get(req.params.id, v1);
    const ver2 = db.prepare('SELECT config FROM agent_versions WHERE agent_id = ? AND version = ?').get(req.params.id, v2);
    
    if (!ver1 || !ver2) return res.status(404).json({ error: 'Versions not found' });
    res.json({ v1: JSON.parse(ver1.config), v2: JSON.parse(ver2.config) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compare versions' });
  }
});

export default router;
