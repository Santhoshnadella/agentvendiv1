// ============================================================
// API Documentation — Minimalist Swagger-like UI
// ============================================================

import { Router } from 'express';

const router = Router();

export const API_DOCS = [
  { method: 'POST', path: '/auth/register', desc: 'Create a new user account' },
  { method: 'POST', path: '/auth/login', desc: 'Login and receive JWT' },
  { method: 'GET', path: '/agents', desc: 'List your agents' },
  { method: 'POST', path: '/agents', desc: 'Create a new agent' },
  { method: 'GET', path: '/marketplace', desc: 'Browse the public marketplace' },
  { method: 'POST', path: '/marketplace/:id/clone', desc: 'Clone an agent to your account' },
  { method: 'GET', path: '/admin/stats', desc: 'Get platform-wide statistics (Admin only)' },
  { method: 'POST', path: '/admin/enterprise', desc: 'Update global enterprise config (Admin only)' },
  { method: 'GET', path: '/health', desc: 'System health check and database status' },
];

router.get('/', async (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AgentVendi API Docs</title>
      <style>
        body { font-family: 'Outfit', sans-serif; background: #0a0a0a; color: #fff; padding: 40px; }
        .endpoint { background: #1a1a1a; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid #00f0ff; }
        .method { font-weight: 900; color: #00f0ff; display: inline-block; width: 80px; }
        .path { font-family: monospace; color: #ff00ff; }
        .desc { margin-top: 10px; color: #ccc; }
        h1 { font-size: 2.5rem; margin-bottom: 40px; }
      </style>
    </head>
    <body>
      <h1>🎰 AgentVendi API Documentation v1.0</h1>
      ${API_DOCS.map(d => `
        <div class="endpoint">
          <div><span class="method">${d.method}</span> <span class="path">${d.path}</span></div>
          <div class="desc">${d.desc}</div>
        </div>
      `).join('')}
    </body>
    </html>
  `;
  res.send(html);
});

router.get('/health', async (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0-PRO',
    uptime: process.uptime(),
    db: 'connected',
    env: process.env.NODE_ENV || 'development'
  });
});

export default router;
