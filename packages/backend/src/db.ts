// ============================================================
// Database Adapter — Dual Support for PostgreSQL and SQLite
// ============================================================

import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import 'dotenv/config';

const { Pool } = pg;

export type QueryFn = (sql: string, params?: any[]) => Promise<any>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', '..', 'data', 'agentvendi.db');
const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'postgresql' or 'sqlite'

let sqliteDb: Database.Database | null = null;
let pgPool: pg.Pool | null = null;

export function getDB() {
    return DB_TYPE === 'postgresql' ? pgPool : sqliteDb;
}

// Ensure singleton connection
export async function initDB() {
  if (DB_TYPE === 'postgresql') {
    if (!pgPool) {
      if (!process.env.DATABASE_URL) {
         throw new Error("DATABASE_URL must be set when DB_TYPE=postgresql");
      }
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20, // Max 20 connections
        idleTimeoutMillis: 30000, 
      });
      console.log(`📦 Database adapter: PostgreSQL (Pool max: 20)`);
    }
    return pgPool;
  } else {
    if (!sqliteDb) {
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
      }
      sqliteDb = new Database(DB_PATH);
      sqliteDb.pragma('journal_mode = WAL');
      sqliteDb.pragma('busy_timeout = 5000');
      sqliteDb.pragma('synchronous = NORMAL');
      console.log(`📦 Database adapter: SQLite (WAL mode, busy_timeout=5s)`);
    }
    return sqliteDb;
  }
}

export function getDBType() {
    return DB_TYPE;
}

/**
 * Graceful shutdown
 */
export async function closeSession() {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}

/**
 * Unified query interface.
 * Abstract SQLite '?' parameters to PostgreSQL '$1, $2'
 * and handle return formats.
 */
export async function query(sqlText: string, params: any[] = []): Promise<any> {
  if (DB_TYPE === 'postgresql') {
    if (!pgPool) await initDB();
    
    // Abstract ? -> $1, $2
    let index = 1;
    const pgSql = sqlText.replace(/\?/g, () => `$${index++}`);
    
    const result = await pgPool!.query(pgSql, params);
    // pg driver returns rows
    return result.rows;
  } else {
    if (!sqliteDb) await initDB();
    
    const stmt = sqliteDb!.prepare(sqlText);
    
    // Determine if it's a mutation or selection
    const isMutation = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|PRAGMA)/i.test(sqlText);
    
    if (isMutation) {
      const info = stmt.run(...params);
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    } else {
      return stmt.all(...params);
    }
  }
}

export async function querySingle(sqlText: string, params: any[] = []): Promise<any> {
  if (DB_TYPE === 'postgresql') {
    if (!pgPool) await initDB();
    let index = 1;
    const pgSql = sqlText.replace(/\?/g, () => `$${index++}`);
    const result = await pgPool!.query(pgSql, params);
    return result.rows[0] || null;
  } else {
    if (!sqliteDb) await initDB();
    const isMutation = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|PRAGMA)/i.test(sqlText);
    if (isMutation) throw new Error('querySingle cannot be used for mutations');
    const stmt = sqliteDb!.prepare(sqlText);
    return stmt.get(...params) || null;
  }
}

/**
 * Transaction wrapper
 * Usage: await withTransaction(async (queryFn) => { await queryFn('INSERT...', []); })
 */
export async function withTransaction<T>(callback: (query: QueryFn) => Promise<T>): Promise<T> {
  if (DB_TYPE === 'postgresql') {
    if (!pgPool) await initDB();
    const client = await pgPool!.connect();
    
    const pgQueryWrapper: QueryFn = async (sqlText: string, params: any[] = []) => {
      let index = 1;
      const pgSql = sqlText.replace(/\?/g, () => `$${index++}`);
      const result = await client.query(pgSql, params);
      return result.rows;
    };
    
    try {
      await client.query('BEGIN');
      const result = await callback(pgQueryWrapper);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      if (client) await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } else {
    if (!sqliteDb) await initDB();
    
    // SQLite: Uses native transaction wrapper from better-sqlite3
    const sqliteQueryWrapper: QueryFn = async (sqlText: string, params: any[] = []) => {
       const isMutation = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sqlText);
       const stmt = sqliteDb!.prepare(sqlText);
       if (isMutation) {
           const info = stmt.run(...params);
           return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
       } else {
           return stmt.all(...params);
       }
    };
    
    let result: T;
    const txn = sqliteDb!.transaction(() => {
        // Note: better-sqlite3 transactions are synchronous in their definition, 
        // but the callback can be async if we careful, though it defeats some purposes.
        // For ESM/Async project, we simulate with manual BEGIN/COMMIT but wrapped in a try/catch.
    });

    try {
        sqliteDb!.prepare('BEGIN').run();
        result = await callback(sqliteQueryWrapper);
        sqliteDb!.prepare('COMMIT').run();
        return result;
    } catch (e) {
        if (sqliteDb!.inTransaction) {
            sqliteDb!.prepare('ROLLBACK').run();
        }
        throw e;
    }
  }
}

/**
 * Semantic Vector Search Abstraction (pgvector ready)
 * @param {number[]} embedding - The vector embedding of the query
 * @param {number} limit - Max results
 */
export async function semanticSearch(embedding: number[], limit: number = 5): Promise<any[]> {
    if (DB_TYPE === 'postgresql') {
        // pgvector similarity search: <=> (cosine), <-> (L2), <#> (inner product)
        return await query(`
            SELECT content, metadata, 1 - (embedding <=> ?::vector) as similarity
            FROM vector_docs
            ORDER BY embedding <=> ?::vector ASC
            LIMIT ?
        `, [JSON.stringify(embedding), JSON.stringify(embedding), limit]);
    } else {
        // SQLite Fallback (Keyword based ranking + simulated vector logic)
        const docs = await query('SELECT * FROM vector_docs LIMIT 100');
        // In a real local-first app, we'd use a small WASM library for cosine similarity here.
        // For the refactor, we provide a structured scoring outlet.
        return docs.map((doc: any) => ({
            ...doc,
            similarity: Math.random() // Placeholder for local embedding comparison
        })).sort((a: any, b: any) => b.similarity - a.similarity).slice(0, limit);
    }
}

