import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// We import the db module dynamically so we can mock environment variables
// before it loads for different tests.

const dataDir = path.join(process.cwd(), 'data');

describe('Database Abstraction Layer', () => {

    beforeEach(() => {
        vi.resetModules();
        if(!fs.existsSync(dataDir)) {
           fs.mkdirSync(dataDir, { recursive: true });
        }
    });

    afterEach(async () => {
        const db = await import('../server/db.js');
        await db.closeSession();
    });

    describe('SQLite Adapter', () => {
        it('should initialize sqlite connection and execute queries', async () => {
            process.env.DB_TYPE = 'sqlite';
            const dbPath = path.join(dataDir, 'test.db');
            process.env.SQLITE_DB_PATH = dbPath;

            const db = await import('../server/db.js');
            await db.initDB();
            expect(db.getDBType()).toBe('sqlite');

            // Quick table creation via query
            await db.query('CREATE TABLE IF NOT EXISTS test_table (id TEXT PRIMARY KEY, val TEXT)');
            await db.query('DELETE FROM test_table');
            
            // Param translation validation
            const id = uuidv4();
            await db.query('INSERT INTO test_table (id, val) VALUES (?, ?)', [id, 'hello']);
            
            const row = await db.querySingle('SELECT * FROM test_table WHERE id = ?', [id]);
            expect(row).toBeDefined();
            expect(row.val).toBe('hello');
        });

        it('should execute transactions correctly', async () => {
            process.env.DB_TYPE = 'sqlite';
            const db = await import('../server/db.js');
            
            await db.withTransaction(async (q) => {
                await q('INSERT INTO test_table (id, val) VALUES (?, ?)', [uuidv4(), 'tx1']);
                await q('INSERT INTO test_table (id, val) VALUES (?, ?)', [uuidv4(), 'tx2']);
            });

            const rows = await db.query('SELECT * FROM test_table');
            expect(rows.length >= 2).toBe(true);
        });
    });

    describe('PostgreSQL Adapter', () => {
        it('should translate parameters correctly for PostgreSQL', async () => {
            process.env.DB_TYPE = 'postgresql';
            process.env.DATABASE_URL = 'postgres://fake:fake@localhost:5432/fake';

            // Mock 'pg' before importing db.js
            vi.mock('pg', () => {
                return {
                    default: {
                        Pool: vi.fn().mockImplementation(() => {
                            return {
                                query: vi.fn().mockImplementation((pgSql, params) => {
                                    // Make sure it translated ? -> $1, $2
                                    if (pgSql.includes('VALUES ($1, $2)')) {
                                        return Promise.resolve({ rows: [] });
                                    }
                                    if (pgSql.includes('SELECT')) {
                                        return Promise.resolve({ rows: [{ id: '1', val: 'hello' }] });
                                    }
                                    return Promise.resolve({ rows: [] });
                                }),
                                end: vi.fn().mockResolvedValue(),
                                connect: vi.fn().mockResolvedValue({
                                    query: vi.fn().mockResolvedValue({ rows: [] }),
                                    release: vi.fn()
                                })
                            };
                        })
                    }
                };
            });

            const db = await import('../server/db.js');
            await db.initDB();
            expect(db.getDBType()).toBe('postgresql');

            const id = uuidv4();
            // This should trigger the mockup and pass
            await db.query('INSERT INTO test_table (id, val) VALUES (?, ?)', [id, 'hello']);
            
            const row = await db.querySingle('SELECT * FROM test_table WHERE id = ?', [id]);
            expect(row).toBeDefined();
            expect(row.val).toBe('hello');
        });
    });
});
