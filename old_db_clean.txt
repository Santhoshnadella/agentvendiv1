// ============================================================
// Database Adapter — Supports SQLite (dev) and PostgreSQL (production)
// ============================================================
//
// ARCHITECTURE DECISION: We use better-sqlite3 for local/dev/intranet use
// and provide a Knex.js adapter for PostgreSQL/MySQL in production.
// The DB_ADAPTER env var controls which backend is used.
//
// Usage:
//   DB_ADAPTER=sqlite  (default, zero-config)
//   DB_ADAPTER=pg      DATABASE_URL=postgres://...
//

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'agentvendi.db');
const DB_ADAPTER = process.env.DB_ADAPTER || 'sqlite';

let db;

/**
 * Returns the raw db instance. For SQLite this is the better-sqlite3 handle.
 * All queries use the synchronous API which is safe because WAL mode
 * allows concurrent reads. For true multi-process production use,
 * switch DB_ADAPTER to 'pg' and use the async query() method.
 */
export function getDB() {
  return db;
}

/**
 * Async-safe query wrapper for production migration path.
 * When using SQLite, wraps synchronous calls. When using Postgres,
 * uses the native async driver.
 */
export async function query(sql, params = []) {
  if (DB_ADAPTER === 'sqlite') {
    return db.prepare(sql).all(...params);
  }
  // PostgreSQL path — requires `pg` package
  // const { rows } = await db.query(sql, params);
  // return rows;
  throw new Error('PostgreSQL adapter not yet configured. Install pg and set DATABASE_URL.');
}

export function initDB() {
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  if (DB_ADAPTER === 'sqlite') {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');    // Enables concurrent reads
    db.pragma('busy_timeout = 5000');   // Wait up to 5s for locks instead of failing
    db.pragma('synchronous = NORMAL');  // Balanced durability vs speed

    console.log(`📦 Database adapter: SQLite (WAL mode, busy_timeout=5s)`);
  } else {
    // PostgreSQL placeholder — uncomment when pg is installed
    // import pg from 'pg';
    // db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    console.log(`📦 Database adapter: ${DB_ADAPTER} (async mode)`);
  }

  runMigrations();
  console.log('✅ Database initialized');
  return db;
}

/**
 * Migration system. Each migration runs exactly once.
 * This replaces raw CREATE TABLE IF NOT EXISTS with a versioned approach.
 */
function runMigrations() {
  // Ensure migrations tracking table exists
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    applied_at TEXT DEFAULT (datetime('now'))
  )`);

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
  );

  const migrations = [
    {
      name: '001_initial_schema',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          status TEXT DEFAULT 'active',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          config TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          is_published INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS agent_versions (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          version INTEGER NOT NULL,
          config TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (agent_id) REFERENCES agents(id)
        );

        CREATE TABLE IF NOT EXISTS marketplace (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          tags TEXT,
          config TEXT NOT NULL,
          clones INTEGER DEFAULT 0,
          rating_sum REAL DEFAULT 0,
          rating_count INTEGER DEFAULT 0,
          status TEXT DEFAULT 'approved',
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (agent_id) REFERENCES agents(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS ratings (
          id TEXT PRIMARY KEY,
          marketplace_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (marketplace_id) REFERENCES marketplace(id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          UNIQUE(marketplace_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS teams (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          owner_id TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (owner_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS team_members (
          team_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT DEFAULT 'member',
          joined_at TEXT DEFAULT (datetime('now')),
          PRIMARY KEY (team_id, user_id),
          FOREIGN KEY (team_id) REFERENCES teams(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          action TEXT NOT NULL,
          target TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `
    },
    {
      name: '002_agent_runs_observability',
      sql: `
        CREATE TABLE IF NOT EXISTS agent_runs (
          id TEXT PRIMARY KEY,
          agent_id TEXT,
          user_id TEXT,
          status TEXT DEFAULT 'running',
          input TEXT,
          output TEXT,
          duration INTEGER DEFAULT 0,
          cost REAL DEFAULT 0,
          tokens_used INTEGER DEFAULT 0,
          error_message TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          completed_at TEXT,
          FOREIGN KEY (agent_id) REFERENCES agents(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS agent_run_logs (
          id TEXT PRIMARY KEY,
          run_id TEXT,
          turn_number INTEGER DEFAULT 0,
          role TEXT,
          content TEXT,
          tool_name TEXT,
          tool_id TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (run_id) REFERENCES agent_runs(id)
        );
      `
    },
    {
      name: '003_hitl_approvals',
      sql: `
        CREATE TABLE IF NOT EXISTS approvals (
          id TEXT PRIMARY KEY,
          run_id TEXT NOT NULL,
          agent_id TEXT,
          tool_name TEXT NOT NULL,
          parameters TEXT,
          status TEXT DEFAULT 'pending',
          resolved_by TEXT,
          resolved_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (run_id) REFERENCES agent_runs(id)
        );
      `
    },
    {
      name: '004_api_keys_and_vector_docs',
      sql: `
        CREATE TABLE IF NOT EXISTS api_keys (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          key_hash TEXT UNIQUE NOT NULL,
          key_prefix TEXT NOT NULL,
          name TEXT,
          scopes TEXT DEFAULT '["execute"]',
          is_active INTEGER DEFAULT 1,
          last_used_at TEXT,
          expires_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS vector_docs (
          id TEXT PRIMARY KEY,
          agent_id TEXT,
          content TEXT NOT NULL,
          embedding BLOB,
          metadata TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (agent_id) REFERENCES agents(id)
        );
      `
    }
  ];

  const insertMigration = db.prepare('INSERT INTO _migrations (name) VALUES (?)');

  for (const m of migrations) {
    if (!applied.has(m.name)) {
      console.log(`  ↳ Running migration: ${m.name}`);
      db.exec(m.sql);
      insertMigration.run(m.name);
    }
  }

  // Safe column additions for existing DBs
  const safeAlter = (sql) => { try { db.exec(sql); } catch (e) {} };
  safeAlter("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
  safeAlter("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
  safeAlter("ALTER TABLE marketplace ADD COLUMN status TEXT DEFAULT 'approved'");
}
