import { v4 as uuidv4 } from 'uuid';
import { initDB, query, closeSession } from '../server/db.js';

async function runSeed() {
    console.log('🌱 Starting DB seeding...');
    await initDB();

    try {
        const userId = uuidv4();
        await query(`
            INSERT INTO users (id, username, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, 'testadmin', 'admin@example.com', 'hashed_pw_placeholder', 'admin']);
        
        const agentId = uuidv4();
        await query(`
            INSERT INTO agents (id, user_id, name, config, version, is_published)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            agentId, 
            userId, 
            'DevOps Assistant', 
            JSON.stringify({ 
                system_prompt: 'You are a devops expert.', 
                provider: 'ollama' 
            }), 
            1, 
            1
        ]);

        console.log(`✅ Seeded test user (id: ${userId}) and agent (id: ${agentId})`);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        await closeSession();
    }
}

runSeed();
