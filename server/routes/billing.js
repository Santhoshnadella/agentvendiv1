import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/reports', authenticateToken, requireRole('admin', 'developer'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        // Basic Monthly Cost aggregation
        const runs = await query(`
            SELECT user_id, agent_id, SUM(cost) as total_cost, SUM(tokens_used) as total_tokens, COUNT(*) as run_count
            FROM agent_runs
            WHERE created_at >= COALESCE(?, datetime('now', '-30 days'))
              AND created_at <= COALESCE(?, datetime('now'))
            GROUP BY user_id, agent_id
        `, [start_date || null, end_date || null]);

        res.json({ data: runs });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/export.csv', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const runs = await query(`
            SELECT id, user_id, agent_id, status, duration, cost, tokens_used, created_at
            FROM agent_runs
            ORDER BY created_at DESC
        `, []);

        const csv = [
            'id,user_id,agent_id,status,duration,cost,tokens_used,created_at',
            ...runs.map(r => `${r.id},${r.user_id},${r.agent_id},${r.status},${r.duration},${r.cost},${r.tokens_used},${r.created_at}`)
        ].join('\n');

        res.header('Content-Type', 'text/csv');
        res.attachment('billing_report.csv');
        res.send(csv);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
