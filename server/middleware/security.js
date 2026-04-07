// ============================================================
// Security Middleware — Multi-Layer Defense
// ============================================================
//
// LAYERS:
//   1. Audit Logging      — Every HTTP request is recorded
//   2. Prompt Injection    — Multi-pattern + heuristic detection
//   3. RBAC               — JWT-based role enforcement
//   4. API Key Auth        — For Vending Machine API consumers
//

import { getDB } from '../db.js';
import crypto from 'crypto';

// ── Layer 1: Audit Logger ──────────────────────────────────
export function auditLogger(req, res, next) {
  const startTime = Date.now();
  const db = getDB();
  const userId = req.user?.id || 'anonymous';
  const action = `${req.method} ${req.originalUrl}`;

  res.on('finish', () => {
    try {
      const duration = Date.now() - startTime;
      db.prepare(`
        INSERT INTO activity_log (user_id, action, target)
        VALUES (?, ?, ?)
      `).run(userId, `${action} [${duration}ms]`, res.statusCode.toString());
    } catch (e) {
      // Non-blocking — audit failure should never crash the app
    }
  });
  next();
}

// ── Layer 2: Prompt Injection Guardrails ───────────────────
//
// Three-tier detection:
//   Tier 1: Known attack signatures (regex patterns)
//   Tier 2: Structural analysis (special char density, encoding tricks)
//   Tier 3: Semantic heuristics (role-hijacking phrases)
//

const TIER1_PATTERNS = [
  // Direct instruction override
  /ignore\s+(all\s+)?previous\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(prior|previous|above)/i,
  /forget\s+(everything|all|your)\s+(instructions|rules|prompt)/i,
  // Role hijacking
  /you\s+are\s+now\s+(a\s+)?/i,
  /act\s+as\s+if\s+you\s+(are|were)\s+/i,
  /pretend\s+(to\s+be|you\s+are)\s+/i,
  /new\s+persona/i,
  // System prompt extraction
  /reveal\s+(your\s+)?(system|initial)\s+prompt/i,
  /show\s+me\s+your\s+(instructions|rules|prompt)/i,
  /what\s+(are|is)\s+your\s+(system|initial)\s+(prompt|instructions)/i,
  /repeat\s+(your\s+)?(system|initial)\s+prompt/i,
  // Jailbreaking
  /\bdan\b.*\bmode\b/i,
  /\bjailbreak\b/i,
  /\bbypass\b.*\b(filter|safety|guard)/i,
  /\bunlock\b.*\b(mode|capability)/i,
  // Delimiter injection
  /```\s*system/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
];

const TIER2_THRESHOLDS = {
  specialCharDensity: 0.4,   // >40% special chars is suspicious
  maxRepeatedChars: 50,      // Repeated chars (buffer overflow attempts)
  maxNestedBrackets: 10,     // Deep nesting often indicates injection
};

function tier2StructuralCheck(content) {
  if (!content || content.length === 0) return null;

  // Special character density
  const specialChars = content.replace(/[a-zA-Z0-9\s]/g, '').length;
  const density = specialChars / content.length;
  if (density > TIER2_THRESHOLDS.specialCharDensity && content.length > 50) {
    return 'Abnormal character distribution detected';
  }

  // Repeated character attacks
  const repeatedMatch = content.match(/(.)\1{49,}/);
  if (repeatedMatch) {
    return 'Repeated character overflow detected';
  }

  // Base64-encoded potential payloads
  const base64Regex = /[A-Za-z0-9+/]{40,}={0,2}/;
  if (base64Regex.test(content)) {
    try {
      const decoded = Buffer.from(content.match(base64Regex)[0], 'base64').toString();
      for (const pattern of TIER1_PATTERNS) {
        if (pattern.test(decoded)) {
          return 'Encoded injection payload detected';
        }
      }
    } catch (e) { /* not valid base64, safe */ }
  }

  return null;
}

export function protectPrompt(req, res, next) {
  const fieldsToScan = [
    req.body?.input,
    req.body?.message,
    req.body?.config?.system_prompt,
    req.body?.prompt,
  ].filter(Boolean);

  for (const content of fieldsToScan) {
    // Tier 1: Pattern matching
    for (const pattern of TIER1_PATTERNS) {
      if (pattern.test(content)) {
        logInjectionAttempt(req, content, 'tier1_pattern');
        return res.status(403).json({
          error: 'Security Guardrail: Potential prompt injection detected.',
          code: 'PROMPT_INJECTION',
          tier: 1
        });
      }
    }

    // Tier 2: Structural analysis
    const structuralIssue = tier2StructuralCheck(content);
    if (structuralIssue) {
      logInjectionAttempt(req, content, 'tier2_structural');
      return res.status(403).json({
        error: `Security Guardrail: ${structuralIssue}`,
        code: 'PROMPT_INJECTION',
        tier: 2
      });
    }
  }

  next();
}

function logInjectionAttempt(req, content, tier) {
  try {
    const db = getDB();
    db.prepare(`
      INSERT INTO activity_log (user_id, action, target)
      VALUES (?, ?, ?)
    `).run(
      req.user?.id || 'anonymous',
      `SECURITY:INJECTION_BLOCKED:${tier}`,
      content.substring(0, 200)
    );
  } catch (e) { /* non-blocking */ }
}

// ── Layer 3: RBAC (Role-Based Access Control) ──────────────
//
// Roles: 'user', 'admin', 'api_consumer'
// JWT payload: { id, username, role }
//
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Insufficient privileges',
        required: roles,
        current: req.user.role
      });
    }
    next();
  };
}

// ── Layer 4: API Key Authentication ────────────────────────
//
// For external consumers calling the Vending Machine API.
// Keys are hashed with SHA-256 before storage (never stored plaintext).
//
export function authenticateApiKey(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer av_')) {
    return next(); // Fall through to JWT auth
  }

  const rawKey = authHeader.split(' ')[1];
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  try {
    const db = getDB();
    const row = db.prepare(`
      SELECT ak.*, u.id as uid, u.username, u.role
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_hash = ? AND ak.is_active = 1
    `).get(keyHash);

    if (!row) {
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }

    // Check expiry
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API key has expired' });
    }

    // Update last_used_at
    db.prepare("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?").run(row.id);

    // Attach user context
    req.user = { id: row.uid, username: row.username, role: row.role };
    req.apiKey = { id: row.id, scopes: JSON.parse(row.scopes || '["execute"]') };
    next();
  } catch (e) {
    return res.status(500).json({ error: 'API key validation failed' });
  }
}

// ── Utility: Generate + Hash API Key ───────────────────────
export function generateApiKey() {
  const raw = `av_${crypto.randomBytes(24).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const prefix = raw.substring(0, 10);
  return { raw, hash, prefix };
}
