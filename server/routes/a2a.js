import { Router } from 'express';
import { query, querySingle } from '../db.js';
import { authenticateApiKey } from '../middleware/security.js';
import { AgentRuntime } from '../lib/runtime.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// AgentCard
router.get('/.well-known/agent.json', (req, res) => {
    res.json({
        name: "AgentVendi Vending Machine",
        description: "AgentVendi A2A compatibility layer",
        version: "1.0.0",
        capabilities: ["streaming", "stateTransitioning"],
        authentication: {
            type: "bearer",
            description: "API Key required"
        },
        endpoints: {
            send: "/a2a/tasks/send",
            sendSubscribe: "/a2a/tasks/sendSubscribe",
            get: "/a2a/tasks/get",
            cancel: "/a2a/tasks/cancel"
        }
    });
});

// A2A Send
router.post('/a2a/tasks/send', authenticateApiKey, async (req, res) => {
    const { agent_id, payload } = req.body;
    if (!agent_id || !payload) return res.status(400).json({ error: 'Missing agent_id or payload' });

    try {
        const taskId = uuidv4();
        await query(`
            INSERT INTO a2a_tasks (id, agent_id, client_id, status, payload)
            VALUES (?, ?, ?, 'submitted', ?)
        `, [taskId, agent_id, req.apiKey.id, JSON.stringify(payload)]);

        // Async execution
        const runAgentTask = async () => {
            try {
                await query("UPDATE a2a_tasks SET status = 'working' WHERE id = ?", [taskId]);
                
                const runtime = new AgentRuntime(agent_id, req.user.id);
                // Extract input text from payload (assuming payload.task is text)
                const inputTask = payload.task || 'Please process this task.';
                const result = await runtime.start(inputTask, payload.config || {});
                
                await query(`
                    UPDATE a2a_tasks SET status = 'completed', run_id = ?, artifact_data = ? WHERE id = ?
                `, [runtime.runId, JSON.stringify({ result }), taskId]);
            } catch (err) {
                await query("UPDATE a2a_tasks SET status = 'failed', artifact_data = ? WHERE id = ?", [JSON.stringify({ error: err.message }), taskId]);
            }
        };

        runAgentTask(); // Run in background

        res.json({ task_id: taskId, status: 'submitted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// A2A Get
router.post('/a2a/tasks/get', authenticateApiKey, async (req, res) => {
    const { task_id } = req.body;
    if (!task_id) return res.status(400).json({ error: 'Missing task_id' });

    try {
        const task = await querySingle('SELECT * FROM a2a_tasks WHERE id = ? AND client_id = ?', [task_id, req.apiKey.id]);
        if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });

        res.json({
            task_id: task.id,
            status: task.status,
            artifact: task.artifact_data ? JSON.parse(task.artifact_data) : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// A2A Cancel
router.post('/a2a/tasks/cancel', authenticateApiKey, async (req, res) => {
    const { task_id } = req.body;
    if (!task_id) return res.status(400).json({ error: 'Missing task_id' });

    try {
        const task = await querySingle('SELECT * FROM a2a_tasks WHERE id = ? AND client_id = ?', [task_id, req.apiKey.id]);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        
        // Mark as canceled. 
        // Note: The actual background AgentRuntime execution isn't easily aborted in Node 
        // unless we pass an AbortSignal down, but we record the cancellation status.
        await query("UPDATE a2a_tasks SET status = 'canceled' WHERE id = ? AND status IN ('submitted', 'working')", [task_id]);
        
        res.json({ status: 'canceled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
