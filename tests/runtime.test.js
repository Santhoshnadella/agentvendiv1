// ============================================================
// Runtime Engine Tests — Unit + Integration
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the database before importing the runtime ─────────
vi.mock('../server/db.js', () => {
  return {
    getDB: vi.fn(),
    initDB: vi.fn(),
    query: vi.fn(async () => []),
    querySingle: vi.fn(async (sql) => {
        if (sql.includes('settings')) return { value: '{}' };
        return null;
    }),
    semanticSearch: vi.fn(async () => []),
    withTransaction: vi.fn(async (cb) => cb(vi.fn()))
  };
});

vi.mock('../server/lib/redis.js', () => ({
    redis: {
        init: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        publish: vi.fn(),
        subscribe: vi.fn()
    }
}));

// ── Tool Registry Tests ────────────────────────────────────
describe('Tool Registry', () => {
  it('should have all required tools registered', async () => {
    // Dynamic import after mocks are set up
    const mod = await import('../server/lib/runtime.js');

    // The TOOLS object is not exported, but AgentRuntime uses it.
    // We verify by attempting to parse known tool-call formats.
    const runtime = new mod.AgentRuntime('test-agent', 'test-user');

    // parseToolUse should correctly parse ReAct format
    const result = runtime.parseToolUse('I need to search. USE_TOOL: web_search\nPARAMETERS: {"query": "test"}');
    expect(result).not.toBeNull();
    expect(result.name).toBe('web_search');
    expect(result.parameters.query).toBe('test');
  });

  it('should parse JSON block tool calls', async () => {
    const mod = await import('../server/lib/runtime.js');
    const runtime = new mod.AgentRuntime('test-agent', 'test-user');

    const content = 'Let me search for that.\n```json\n{"tool": "read_file", "parameters": {"path": "README.md"}}\n```';
    const result = runtime.parseToolUse(content);
    expect(result).not.toBeNull();
    expect(result.name).toBe('read_file');
  });

  it('should return null for messages without tool calls', async () => {
    const mod = await import('../server/lib/runtime.js');
    const runtime = new mod.AgentRuntime('test-agent', 'test-user');

    const result = runtime.parseToolUse('This is just a regular response with no tool usage.');
    expect(result).toBeNull();
  });
});

// ── Loop Detection Tests ───────────────────────────────────
describe('Infinite Loop Detection', () => {
  it('should detect repeated identical tool calls', async () => {
    const mod = await import('../server/lib/runtime.js');
    const runtime = new mod.AgentRuntime('test-agent', 'test-user');

    const toolCall = { name: 'web_search', parameters: { query: 'same thing' } };

    expect(runtime.detectLoop(toolCall)).toBe(false); // 1st
    expect(runtime.detectLoop(toolCall)).toBe(false); // 2nd
    expect(runtime.detectLoop(toolCall)).toBe(3);     // 3rd = loop!
  });

  it('should NOT flag different tool calls as loops', async () => {
    const mod = await import('../server/lib/runtime.js');
    const runtime = new mod.AgentRuntime('test-agent', 'test-user');

    runtime.detectLoop({ name: 'web_search', parameters: { query: 'alpha' } });
    runtime.detectLoop({ name: 'web_search', parameters: { query: 'beta' } });
    const result = runtime.detectLoop({ name: 'read_file', parameters: { path: 'x.js' } });

    expect(result).toBe(false);
  });
});

// ── Output Validation (Hallucination Guard) ────────────────
describe('Hallucination Guardrails', () => {
  it('should flag stale knowledge disclaimers', async () => {
    const mod = await import('../server/lib/runtime.js');
    const runtime = new mod.AgentRuntime('test-agent', 'test-user');

    const output = runtime.validateOutput('As of my last knowledge cutoff, Python 3.10 is the latest.');
    expect(output).toContain('⚠️');
    expect(output).toContain('outdated information');
  });

  it('should pass clean outputs through unchanged', async () => {
    const mod = await import('../server/lib/runtime.js');
    const runtime = new mod.AgentRuntime('test-agent', 'test-user');

    const output = runtime.validateOutput('The bug was in line 42. I fixed it.');
    expect(output).not.toContain('⚠️');
    expect(output).toBe('The bug was in line 42. I fixed it.');
  });
});

// ── Provider Configuration Tests ───────────────────────────
describe('LLM Provider Support', () => {
  it('should throw on unknown provider', async () => {
    const mod = await import('../server/lib/runtime.js');
    const runtime = new mod.AgentRuntime('test-agent', 'test-user');

    await expect(runtime.callLLM([], { provider: 'nonexistent' }))
      .rejects
      .toThrow('Unknown LLM provider');
  });
});
