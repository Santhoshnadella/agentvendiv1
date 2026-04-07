import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { pluginManager } from '../lib/plugins/manager.js';

const router = Router();

router.get('/', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const plugins = pluginManager.getPlugins();
        res.json({ plugins });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/install', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { packageName } = req.body;
        if (!packageName) return res.status(400).json({ error: 'Missing packageName' });
        
        const result = pluginManager.installPlugin(packageName);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
