import { v4 as uuidv4 } from 'uuid';
import { query, querySingle } from '../db.js';
import { wsManager } from './websocket.js';
import { logger } from './logger.js';

export class TimeTravelEngine {
    /**
     * Snapshots the current state of an agent run.
     */
    static async captureSnapshot(runId, turnNumber, messages, currentState) {
        const snapshot = {
            turn: turnNumber,
            messages: [...messages], // Clone
            memory: currentState.memory || {},
            variables: currentState.variables || {},
            timestamp: new Date().toISOString()
        };

        const id = uuidv4();
        await query(`
            INSERT INTO agent_snapshots (id, run_id, step_number, state)
            VALUES (?, ?, ?, ?)
        `, [id, runId, turnNumber, JSON.stringify(snapshot)]);

        // Notify subscribers
        wsManager.broadcast(`run:${runId}`, 'snapshot_created', {
            run_id: runId,
            step_number: turnNumber,
            snapshot_id: id
        });

        return id;
    }

    /**
     * Reconstitutes an agent runtime from a specific snapshot.
     */
    static async forkRun(originalRunId, fromStep, editedContext = null) {
        const snapshotRaw = await querySingle(
            'SELECT state FROM agent_snapshots WHERE run_id = ? AND step_number = ?',
            [originalRunId, fromStep]
        );

        if (!snapshotRaw) throw new Error(`Snapshot for run ${originalRunId} at step ${fromStep} not found.`);
        
        const state = JSON.parse(snapshotRaw.state);
        
        // Create new Run entry
        const originalRun = await querySingle('SELECT * FROM agent_runs WHERE id = ?', [originalRunId]);
        const newRunId = uuidv4();
        
        await query(`
            INSERT INTO agent_runs (id, agent_id, user_id, status, input, parent_run_id, forked_from_step)
            VALUES (?, ?, ?, 'running', ?, ?, ?)
        `, [newRunId, originalRun.agent_id, originalRun.user_id, originalRun.input, originalRunId, fromStep]);

        logger.info(`Forked run ${originalRunId} -> ${newRunId} at step ${fromStep}`);
        
        // Broadcast discovery of the new branch to watchers of the parent
        wsManager.broadcast(`run:${originalRunId}`, 'run_forked', {
            parent_run_id: originalRunId,
            new_run_id: newRunId,
            forked_at_step: fromStep
        });

        return {
            newRunId,
            agentId: originalRun.agent_id,
            userId: originalRun.user_id,
            reconstitutedMessages: editedContext ? [...state.messages, { role: 'user', content: editedContext }] : state.messages,
            input: originalRun.input
        };
    }
}
