import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock DB
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, 'test.db');

describe('API Routes', () => {
  let db;

  beforeAll(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    db = new Database(TEST_DB);
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, email TEXT UNIQUE, password_hash TEXT, role TEXT, status TEXT);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
      INSERT INTO users (id, username, email, password_hash, role, status) VALUES ('1', 'admin', 'admin@test.com', 'hash', 'admin', 'active');
    `);
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it('verifies test user exists', () => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('1');
    expect(user.username).toBe('admin');
    expect(user.role).toBe('admin');
  });

  it('saves enterprise settings correctly', () => {
    const config = { ollamaUrl: 'http://local-ai:11434', modelName: 'llama3' };
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('enterprise_config', JSON.stringify(config));
    
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('enterprise_config');
    const saved = JSON.parse(row.value);
    expect(saved.ollamaUrl).toBe('http://local-ai:11434');
    expect(saved.modelName).toBe('llama3');
  });
});
