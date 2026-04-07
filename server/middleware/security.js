import { getDB } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Audit Log Middleware
 */
export function auditLogger(req, res, next) {
  const db = getDB();
  const userId = req.user?.id || 'anonymous';
  const action = `${req.method} ${req.originalUrl}`;
  
  res.on('finish', () => {
    try {
      db.prepare(`
        INSERT INTO activity_log (user_id, action, target)
        VALUES (?, ?, ?)
      `).run(userId, action, res.statusCode.toString());
    } catch (e) {
      console.warn('Audit logging failed', e);
    }
  });
  next();
}

/**
 * Basic Prompt Injection Guardrail
 */
export function protectPrompt(req, res, next) {
  const { input, message } = req.body;
  const content = input || message || '';
  
  const badPatterns = [
    /ignore previous instructions/i,
    /system prompt/i,
    /you are now/i,
    /bypass/i,
    /jailbreak/i
  ];

  for (const pattern of badPatterns) {
    if (pattern.test(content)) {
      return res.status(403).json({ 
        error: 'Security Guardrail: Potential prompt injection detected.',
        code: 'PROMPT_INJECTION'
      });
    }
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Simple Implementation
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}
