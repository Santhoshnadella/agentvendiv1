import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, query, getDBType, closeSession } from '../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function setupMigrationTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS _schema_versions (
            id ${getDBType() === 'postgresql' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            version TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function getAppliedMigrations() {
    const rows = await query('SELECT version FROM _schema_versions ORDER BY id ASC');
    return new Set(rows.map(r => r.version));
}

async function runMigrateUp() {
    await initDB();
    await setupMigrationTable();
    
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.log('No migrations folder found.');
        await closeSession();
        return;
    }

    const applied = await getAppliedMigrations();
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Run in alphabetical (timestamp) order

    let runCount = 0;
    for (const file of files) {
        if (!applied.has(file)) {
            console.log(`Applying migration: ${file}`);
            let sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
            
            // Dialect Translation
            if (getDBType() === 'postgresql') {
                sql = sql.replace(/AUTOINCREMENT/gi, ''); // SERIAL is used below
                sql = sql.replace(/INTEGER PRIMARY KEY/gi, 'SERIAL PRIMARY KEY');
                sql = sql.replace(/BLOB/gi, 'BYTEA');
                // Postgres requires datetime('now') -> NOW() or CURRENT_TIMESTAMP
                sql = sql.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
            } else {
                // SQLite specific tweaks if needed
            }
            
            try {
                // Execute migration SQL and record it
                const queries = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
                for (const q of queries) {
                    await query(q);
                }
                
                await query('INSERT INTO _schema_versions (version) VALUES (?)', [file]);
                console.log(`✅ ${file} applied successfully.`);
                runCount++;
            } catch (err) {
                console.error(`❌ Migration failed at ${file}:`, err.message);
                await closeSession();
                process.exit(1);
            }
        }
    }

    if (runCount === 0) {
        console.log('Already up to date.');
    } else {
        console.log(`Successfully applied ${runCount} migrations.`);
    }
    await closeSession();
}

async function runMigrateRollback() {
    await initDB();
    await setupMigrationTable();

    const rows = await query('SELECT version FROM _schema_versions ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
        console.log('No migrations to rollback.');
        await closeSession();
        return;
    }

    const lastMigration = rows[0].version;
    const rollbackFile = lastMigration.replace('.sql', '.down.sql');
    
    // Check if down script exists
    const downPath = path.join(MIGRATIONS_DIR, rollbackFile);
    if (!fs.existsSync(downPath)) {
         console.warn(`⚠️ Rollback file not found: ${rollbackFile}`);
         // We still remove the record to allow retrying
    } else {
        console.log(`Rolling back migration: ${lastMigration}`);
        const sql = fs.readFileSync(downPath, 'utf8');
        try {
            const queries = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
            for (const q of queries) {
                await query(q);
            }
        } catch (err) {
            console.error(`❌ Rollback failed for ${lastMigration}:`, err.message);
            await closeSession();
            process.exit(1);
        }
    }

    await query('DELETE FROM _schema_versions WHERE version = ?', [lastMigration]);
    console.log(`✅ ${lastMigration} rolled back successfully.`);
    await closeSession();
}

// Check args
const action = process.argv[2] || 'up';
if (action === 'up') {
    runMigrateUp();
} else if (action === 'rollback') {
    runMigrateRollback();
} else {
    console.error('Unknown action:', action);
    process.exit(1);
}
