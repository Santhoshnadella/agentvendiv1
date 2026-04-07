import { query } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const SIEM_WEBHOOK_URL = process.env.SIEM_WEBHOOK_URL || null;

export async function logAudit(userId, action, resourceType, resourceId, details) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    // 1. Immutable DB Log
    try {
        await query(`
            INSERT INTO audit_logs (id, timestamp, user_id, action, resource_type, resource_id, details)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [id, timestamp, userId, action, resourceType, resourceId, JSON.stringify(details)]);
    } catch (e) {
        console.error('Failed to write to audit log:', e.message);
    }

    // 2. Export to SIEM
    if (SIEM_WEBHOOK_URL) {
        try {
            await fetch(SIEM_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, timestamp, userId, action, resourceType, resourceId, details })
            });
        } catch (e) {
            console.error('Failed to export audit log to SIEM:', e.message);
        }
    }
}
