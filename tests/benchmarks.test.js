import { describe, it, expect, vi } from 'vitest';
import { AgentRuntime } from '../server/lib/runtime.js';

// Mock DB to avoid foreign key errors in CI/Dev env
vi.mock('../server/db.js', () => ({
    query: vi.fn().mockResolvedValue([]),
    querySingle: vi.fn().mockResolvedValue({}),
    getDB: vi.fn().mockReturnValue({}),
    getDBType: vi.fn().mockReturnValue('sqlite'),
    initDB: vi.fn().mockResolvedValue({}),
    closeSession: vi.fn().mockResolvedValue({})
}));

describe('Benchmarking Suite', () => {
    it('should evaluate reasoning and capability of the agent', async () => {
        // We evaluate an in-memory test configuration
        const config = {
            system_prompt: "You are a calculator. Reply only with numbers.",
            provider: "ollama"
        };
        
        // Setup a mock runtime or test runtime
        const runtime = new AgentRuntime('test-agent-123', 'test-user-123');
        runtime.callLLM = async (messages) => {
            // Mock LLM resolving benchmark task
            return { content: "10" };
        };

        const result = await runtime.start("What is 5 + 5?", config);
        
        expect(result).toBeDefined();
        expect(result).toBe("10");
        expect(runtime.turnNumber).toBeGreaterThan(0);
        expect(runtime.status).not.toBe('error');
    });
});
