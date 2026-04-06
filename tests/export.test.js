import { describe, it, expect } from 'vitest';
import { generatePreview } from '../export/generator.js';

describe('Export Generator', () => {
  const mockState = {
    agents: [{ name: 'Test Agent' }],
    mode: 'single',
    behavior: { responseStyle: 'concise', autonomy: 80, toolUse: true, errorHandling: 'explain' },
    knowledge: { domains: ['React', 'Node.js'], customText: '', urls: [], fileRefs: [] },
    role: { title: 'Senior Engineer', persona: 'Helpful and direct', tone: 'professional', objectives: 'Code review', constraints: '' },
    guardrails: { safetyRules: ['no-secrets'], contentPolicies: ['test-first'], outputFormat: 'Markdown', prohibitedTopics: '', qualityThreshold: 'high', customRules: '' },
    skills: { selected: ['testing', 'debugging'], custom: [{ name: 'Custom Skill', desc: 'Custom Desc' }] },
    cognitive: { profile: { Thinking: 'Abstract', Decisions: 'Rapid', Learning: 'Visual', Priority: 'Speed', Feedback: 'Constructive', Style: 'Fast' } },
  };

  it('generates cursorrules correctly', () => {
    const output = generatePreview(mockState, 'cursorrules');
    expect(output).toContain('# Role');
    expect(output).toContain('You are a Senior Engineer.');
    expect(output).toContain('Helpful and direct');
    expect(output).toContain('# Behavior');
    expect(output).toContain('Act autonomously');
    expect(output).toContain('# Knowledge');
    expect(output).toContain('Domain expertise: React, Node.js');
    expect(output).toContain('# Skills');
    expect(output).toContain('Testing & QA');
    expect(output).toContain('Custom Skill: Custom Desc');
    expect(output).toContain('# Guardrails');
    expect(output).toContain('Never expose secrets');
    expect(output).toContain('Write tests before implementation');
    expect(output).toContain('# Working Style');
    expect(output).toContain('Thinking: Abstract');
  });

  it('generates agent.json correctly', () => {
    const output = generatePreview(mockState, 'json');
    const json = JSON.parse(output);
    expect(json.name).toBe('Test Agent');
    expect(json.role.title).toBe('Senior Engineer');
    expect(json.skills.selected).toContain('testing');
    expect(json.cognitive.Thinking).toBe('Abstract');
  });

  it('generates aider config correctly', () => {
    const output = generatePreview(mockState, 'aider');
    expect(output).toContain('system-prompt: |');
    expect(output).toContain('  # Role');
    expect(output).toContain('  You are a Senior Engineer.');
  });
});
