// ============================================================
// AgentVendi Parser — Script-to-Agent Intelligence
// ============================================================

export function parseAgentScript(text) {
  const state = {
    agents: [{ name: 'Imported Agent', id: crypto.randomUUID?.() || Date.now().toString() }],
    role: { title: '', persona: '', tone: 'professional', objectives: '', constraints: '' },
    behavior: { responseStyle: 'detailed', autonomy: 50, toolUse: true, errorHandling: 'explain', creativity: 50, verbosity: 'balanced' },
    knowledge: { domains: [], customText: '', urls: [], fileRefs: [] },
    guardrails: { safetyRules: [], contentPolicies: [], outputFormat: '', prohibitedTopics: '', qualityThreshold: 'high', customRules: '' },
    skills: { selected: [], custom: [] },
  };

  // Vendi Script Parser (Python-like syntax)
  if (text.includes('AGENT_CONFIG') || text.includes('SYSTEM_PROMPT')) {
    // Extract Agent Config
    const nameMatchVendi = text.match(/"name":\s*"([^"]+)"/);
    const roleMatchVendi = text.match(/"role":\s*"([^"]+)"/);
    const sandboxMatch = text.match(/"sandbox":\s*"([^"]+)"/);
    const limitMatch = text.match(/"loop_limit":\s*(\d+)/);

    if (nameMatchVendi) state.agents[0].name = nameMatchVendi[1];
    if (roleMatchVendi) state.role.title = roleMatchVendi[1];
    if (sandboxMatch && sandboxMatch[1] === 'enabled') state.guardrails.safetyRules.push('no-prod');
    if (limitMatch) state.behavior.autonomy = Math.min(parseInt(limitMatch[1]) * 10, 100);

    // Extract Capabilities (Skills)
    const capMatch = text.match(/"capabilities":\s*\[([^\]]+)\]/);
    if (capMatch) {
      const caps = capMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
      if (caps.includes('Self-Correction')) state.skills.selected.push('debugging');
      if (caps.includes('Test-Driven Development')) state.skills.selected.push('testing');
      if (caps.includes('Code Optimization')) state.skills.selected.push('architecture');
    }

    // Extract System Prompt
    const promptMatch = text.match(/SYSTEM_PROMPT\s*=\s*"""([\s\S]+?)"""/);
    if (promptMatch) {
      state.role.persona = promptMatch[1].trim().split('\n')[0]; // First line as persona
      state.role.objectives = promptMatch[1].trim(); // Full text as objectives
    }
    
    return state;
  }

  // Legacy/Natural Language Parser logic...
  if (text.includes('Python agent')) {
    state.role.title = 'Python Developer';
    state.knowledge.domains.push('Python');
  }

  // Extract Name/Title
  const nameMatch = text.match(/Example:\s*["“'‘]([^"“”'’]+)["”'’]/i);
  if (nameMatch) state.agents[0].name = nameMatch[1];

  // Extract Objectives
  if (text.includes('Debug code')) state.role.objectives += 'Debug code. ';
  if (text.includes('Generate code')) state.role.objectives += 'Generate code from specs. ';
  if (text.includes('Refactor')) state.role.objectives += 'Refactor and optimize code. ';

  // Extract Tools
  if (text.includes('File reader/writer')) state.skills.selected.push('database'); // Mapping to closest lib
  if (text.includes('Test runner')) state.skills.selected.push('testing');
  if (text.includes('Code search')) state.skills.selected.push('architecture');

  // Extract Safety
  if (text.includes('prevent destructive')) state.guardrails.safetyRules.push('no-delete');
  if (text.includes('sandbox')) state.guardrails.safetyRules.push('no-prod');

  // Logic: "Agent Loop"
  if (text.includes('Reasoning Loop') || text.includes('ReAct')) {
    state.behavior.autonomy = 80;
    state.behavior.responseStyle = 'detailed';
  }

  return state;
}
