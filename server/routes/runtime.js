import { Router } from 'express';
import { AgentRuntime } from '../lib/runtime.js';
import { getDB } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/execute/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const { input, config } = req.body;
  const userId = req.user?.id || 'anonymous'; // If authentication is used

  try {
    const runtime = new AgentRuntime(agentId, userId);
    const result = await runtime.start(input, config);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/runs/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const db = getDB();
  
  let runs;
  if (agentId === 'current') {
    runs = db.prepare('SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 50').all();
  } else {
    runs = db.prepare('SELECT * FROM agent_runs WHERE agent_id = ? ORDER BY created_at DESC').all(agentId);
  }
    
  res.json({ runs });
});

router.get('/run-logs/:runId', async (req, res) => {
  const { runId } = req.params;
  const db = getDB();
  
  const logs = db.prepare('SELECT * FROM agent_run_logs WHERE run_id = ? ORDER BY created_at ASC')
    .all(runId);
    
  res.json({ logs });
});

export default router;
