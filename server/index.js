// ============================================================
// AgentVendi — Express Backend Server
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import { auditLogger } from './middleware/security.js';

import fs from 'fs';
import { getDB, initDB, closeSession, querySingle, getDBType } from './db.js';
import authRoutes from './routes/auth.js';
import agentRoutes from './routes/agents.js';
import marketplaceRoutes from './routes/marketplace.js';
import teamRoutes from './routes/teams.js';
import exportRoutes from './routes/export.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import docsRoutes from './routes/docs.js';
import configRoutes from './routes/config.js';
import runtimeRoutes from './routes/runtime.js';
import vendingRoutes from './routes/vending.js';
import mcpRoutes from './routes/mcp.js';
import a2aRoutes from './routes/a2a.js';
import pluginRoutes from './routes/plugins.js';
import billingRoutes from './routes/billing.js';
import { mcpManager } from './lib/mcp/manager.js';
import { wsManager } from './lib/websocket.js';
import { pluginManager } from './lib/plugins/manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '5mb' }));
app.use(auditLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: 'Too many requests, try again later.' },
});
app.use('/api/', limiter);

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api-docs', docsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/runtime', runtimeRoutes);
app.use('/api/v1', vendingRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/plugins', pluginRoutes);
app.use('/api/billing', billingRoutes);

app.use('/', a2aRoutes); // Contains /.well-known and /a2a/ methods

app.get('/health/db', async (req, res) => {
  try {
    const result = await querySingle('SELECT 1 as ok');
    if (result && result.ok === 1) {
      res.json({ status: 'ok', database: getDBType() });
    } else {
      res.status(500).json({ status: 'error', message: 'Database query failed' });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Serve frontend in production ──
const distPath = path.join(__dirname, '..', 'dist');
const rootPath = path.join(__dirname, '..');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/admin', async (req, res) => {
    res.sendFile(path.join(rootPath, 'admin.html'));
  });
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.use(express.static(rootPath));
  app.get('/admin', async (req, res) => {
    res.sendFile(path.join(rootPath, 'admin.html'));
  });
  app.get('*', (req, res) => {
    res.sendFile(path.join(rootPath, 'index.html'));
  });
}

// ── Error handler ──
app.use(async (err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──
await initDB();
await mcpManager.init(); // Initialize MCP clients
pluginManager.init(); // Initialize plugins

const server = app.listen(PORT, () => {
  console.log(`🎰 AgentVendi server running on http://localhost:${PORT}`);
});

wsManager.init(server); // Initialize WebSocket server

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  server.close(async () => {
    await closeSession();
    console.log('Database connections closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
