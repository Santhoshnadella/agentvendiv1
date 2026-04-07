import { Router } from 'express';
import { getDB, query, querySingle } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { mcpManager } from '../lib/mcp/manager.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Add new MCP server
router.post('/servers', authenticateToken, requireRole('admin'), async (req, res) => {
    const { name, transport_type, connection_string } = req.body;
    
    if (!name || !transport_type || !connection_string) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const id = uuidv4();
        await query(`
            INSERT INTO mcp_servers (id, name, transport_type, connection_string, status)
            VALUES (?, ?, ?, ?, 'offline')
        `, [id, name, transport_type, connection_string]);

        const server = await querySingle('SELECT * FROM mcp_servers WHERE id = ?', [id]);
        
        // Connect asynchronously
        mcpManager.connectToServer(server).catch(console.error);

        res.json({ message: 'Server added and connecting', server });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List all MCP servers and their tools
router.get('/servers', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const servers = await query('SELECT * FROM mcp_servers ORDER BY created_at DESC', []);
        const tools = await query('SELECT * FROM mcp_tools', []);

        const serverMap = servers.map(s => {
            return {
                ...s,
                tools: tools.filter(t => t.server_id === s.id)
            };
        });

        res.json({ servers: serverMap });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove MCP server
router.delete('/servers/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await mcpManager.removeServer(req.params.id);
        res.json({ message: 'Server removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sync/Reconnect server
router.post('/servers/:id/sync', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const server = await querySingle('SELECT * FROM mcp_servers WHERE id = ?', [req.params.id]);
        if (!server) return res.status(404).json({ error: 'Server not found' });

        await mcpManager.connectToServer(server);
        res.json({ message: 'Server reconnected and tools synced' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
