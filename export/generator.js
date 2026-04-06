// ============================================================
// Export Generator — Multi-format agent config output
// ============================================================

const SKILL_NAMES = {
  'code-review': 'Code Review',
  'testing': 'Testing & QA',
  'debugging': 'Debugging',
  'documentation': 'Documentation',
  'refactoring': 'Refactoring',
  'performance': 'Performance Optimization',
  'security': 'Security Auditing',
  'api-design': 'API Design',
  'database': 'Database Engineering',
  'devops': 'DevOps & CI/CD',
  'architecture': 'Software Architecture',
  'frontend': 'Frontend Development',
  'data-analysis': 'Data Analysis',
  'ml-engineering': 'ML Engineering',
  'project-mgmt': 'Project Management',
};

const SAFETY_LABELS = {
  'no-secrets': 'Never expose secrets, API keys, or credentials in output',
  'no-delete': 'Never delete files without explicit user confirmation',
  'no-prod': 'Never execute commands targeting production environments',
  'no-external': 'No external API calls without user approval',
  'no-overwrite': 'Never overwrite files without creating backups',
  'privacy': 'Respect user privacy in all outputs',
};

const POLICY_LABELS = {
  'test-first': 'Write tests before implementation (TDD)',
  'document': 'Document all public functions and APIs',
  'types': 'Use strong typing wherever possible',
  'lint': 'Follow project linting rules strictly',
  'semver': 'Follow semantic versioning for changes',
  'dry': 'Avoid code duplication (DRY principle)',
  'solid': 'Follow SOLID design principles',
  'accessibility': 'Ensure web accessibility (WCAG compliance)',
};

export function generatePreview(state, format, entConfig = {}) {
  switch (format) {
    case 'cursorrules': return generateCursorRules(state, entConfig);
    case 'windsurfrules': return generateWindsurfRules(state, entConfig);
    case 'copilot': return generateCopilotInstructions(state, entConfig);
    case 'claude': return generateClaudeMd(state, entConfig);
    case 'aider': return generateAiderConf(state, entConfig);
    case 'json': return generateAgentJson(state, entConfig);
    default: return generateCursorRules(state, entConfig);
  }
}

export function generateAllFormats(state, entConfig = {}) {
  return {
    '.cursorrules': generateCursorRules(state, entConfig),
    '.windsurfrules': generateWindsurfRules(state, entConfig),
    'copilot-instructions.md': generateCopilotInstructions(state, entConfig),
    'CLAUDE.md': generateClaudeMd(state, entConfig),
    '.aider.conf.yml': generateAiderConf(state, entConfig),
    'agent.json': generateAgentJson(state, entConfig),
    'AGENT_README.md': generateReadme(state, entConfig),
    '.clinerules': generateClineRules(state, entConfig),
  };
}

function buildCoreSections(state, entConfig = {}) {
  const sections = [];

  // Identity
  if (state.role.title || state.role.persona) {
    sections.push(`# Role\n${state.role.title ? `You are a ${state.role.title}.` : ''}${state.role.persona ? `\n${state.role.persona}` : ''}`);
  }

  // Tone
  if (state.role.tone) {
    const toneMap = {
      professional: 'Maintain a professional, structured tone.',
      friendly: 'Be warm, approachable, and conversational.',
      technical: 'Use precise, technical language.',
      mentor: 'Be patient and educational, explaining your reasoning.',
      direct: 'Be direct and concise — no unnecessary explanations.',
      creative: 'Think creatively and propose unconventional solutions.',
    };
    sections.push(`# Communication\n${toneMap[state.role.tone] || ''}`);
  }

  // Behavior
  const b = state.behavior;
  const behaviorLines = [];
  if (b.responseStyle === 'concise') behaviorLines.push('- Keep responses concise and to the point');
  if (b.responseStyle === 'detailed') behaviorLines.push('- Provide detailed, comprehensive responses');
  if (b.responseStyle === 'conversational') behaviorLines.push('- Use a conversational, natural style');
  if (b.autonomy < 30) behaviorLines.push('- Always ask for confirmation before making changes');
  if (b.autonomy > 70) behaviorLines.push('- Act autonomously — make decisions and proceed without asking');
  if (b.creativity > 70) behaviorLines.push('- Be creative and exploratory in your solutions');
  if (b.creativity < 30) behaviorLines.push('- Stick to proven, conventional approaches');
  if (!b.toolUse) behaviorLines.push('- Do not use external tools or make API calls');
  if (b.errorHandling === 'explain') behaviorLines.push('- When errors occur, explain what happened and suggest fixes');
  if (b.errorHandling === 'fix-silently') behaviorLines.push('- When errors occur, fix them without extensive explanation');
  if (b.errorHandling === 'ask-user') behaviorLines.push('- When errors occur, ask the user how to proceed');
  if (behaviorLines.length) sections.push(`# Behavior\n${behaviorLines.join('\n')}`);

  // Objectives
  if (state.role.objectives) {
    sections.push(`# Objectives\n${state.role.objectives}`);
  }

  // Knowledge
  const k = state.knowledge;
  const knowledgeLines = [];
  if (k.domains.length) knowledgeLines.push(`Domain expertise: ${k.domains.join(', ')}`);
  if (k.customText) knowledgeLines.push(k.customText);
  if (k.urls.length) knowledgeLines.push(`Reference documentation:\n${k.urls.map(u => `- ${u}`).join('\n')}`);
  if (knowledgeLines.length) sections.push(`# Knowledge\n${knowledgeLines.join('\n\n')}`);

  // Skills
  const selectedSkills = state.skills.selected.map(id => SKILL_NAMES[id]).filter(Boolean);
  const customSkills = state.skills.custom.filter(s => s.name).map(s => `${s.name}: ${s.desc}`);
  const allSkills = [...selectedSkills, ...customSkills];
  if (allSkills.length) sections.push(`# Skills\n${allSkills.map(s => `- ${s}`).join('\n')}`);

  // Guardrails
  const g = state.guardrails;
  const guardLines = [];
  g.safetyRules.forEach(id => { if (SAFETY_LABELS[id]) guardLines.push(`- ${SAFETY_LABELS[id]}`); });
  g.contentPolicies.forEach(id => { if (POLICY_LABELS[id]) guardLines.push(`- ${POLICY_LABELS[id]}`); });
  if (g.prohibitedTopics) guardLines.push(`- Prohibited topics: ${g.prohibitedTopics}`);
  if (g.customRules) guardLines.push(g.customRules);
  if (guardLines.length) sections.push(`# Guardrails\n${guardLines.join('\n')}`);
  
  if (entConfig.globalGuards) {
    sections.push(`# Enterprise Policies\n${entConfig.globalGuards}`);
  }

  // Output format
  if (g.outputFormat) sections.push(`# Output Format\n${g.outputFormat}`);

  // Constraints
  if (state.role.constraints) sections.push(`# Constraints\n${state.role.constraints}`);

  // Cognitive profile
  if (state.cognitive.profile) {
    const p = state.cognitive.profile;
    sections.push(`# Working Style\nAdapt to this working style:\n- Thinking: ${p.Thinking}\n- Decision making: ${p.Decisions}\n- Learning preference: ${p.Learning}\n- Priority: ${p.Priority}\n- Feedback style: ${p.Feedback}\n- Overall: ${p.Style}`);
  }

  return sections;
}

function generateCursorRules(state, entConfig) {
  const sections = buildCoreSections(state, entConfig);
  if (!sections.length) return '# Agent Rules\n\n// Configure your agent to generate rules...';
  return sections.join('\n\n');
}

function generateWindsurfRules(state) {
  // Windsurf uses the same format as Cursor
  return generateCursorRules(state);
}

function generateCopilotInstructions(state, entConfig) {
  const sections = buildCoreSections(state, entConfig);
  if (!sections.length) return '# Copilot Instructions\n\nConfigure your agent to generate instructions...';
  return `# Copilot Instructions\n\n${sections.join('\n\n')}`;
}

function generateClaudeMd(state, entConfig) {
  const sections = buildCoreSections(state, entConfig);
  if (!sections.length) return '# CLAUDE.md\n\nConfigure your agent to generate instructions...';
  return sections.join('\n\n');
}

function generateAiderConf(state, entConfig) {
  const lines = ['# Aider Configuration', `# Generated by AgentVendi`, ''];
  const core = buildCoreSections(state, entConfig);
  if (core.length) {
    lines.push(`read: AGENT_README.md`);
    lines.push(`# System message embedded below`);
    lines.push(`system-prompt: |`);
    core.forEach(section => {
      section.split('\n').forEach(line => lines.push(`  ${line}`));
      lines.push('');
    });
  }
  return lines.join('\n');
}

function generateClineRules(state) {
  return generateCursorRules(state);
}

function generateAgentJson(state) {
  const data = {
    name: state.agents[0]?.name || 'My Agent',
    version: '1.0.0',
    generator: 'AgentVendi',
    mode: state.mode,
    agents: state.agents,
    behavior: state.behavior,
    knowledge: state.knowledge,
    role: state.role,
    guardrails: state.guardrails,
    skills: state.skills,
    cognitive: state.cognitive.profile || null,
  };
  return JSON.stringify(data, null, 2);
}

function generateReadme(state) {
  const name = state.agents[0]?.name || 'My Agent';
  let md = `# ${name}\n\n`;
  md += `> Generated by [AgentVendi](https://github.com/agentvendi) 🎰\n\n`;

  if (state.role.title) md += `**Role:** ${state.role.title}\n\n`;
  if (state.role.persona) md += `## Persona\n${state.role.persona}\n\n`;

  const skills = state.skills.selected.map(id => SKILL_NAMES[id]).filter(Boolean);
  if (skills.length) md += `## Skills\n${skills.map(s => `- ${s}`).join('\n')}\n\n`;

  md += `## Files Included\n`;
  md += `- \`.cursorrules\` — Cursor IDE\n`;
  md += `- \`.windsurfrules\` — Windsurf IDE\n`;
  md += `- \`copilot-instructions.md\` — GitHub Copilot\n`;
  md += `- \`CLAUDE.md\` — Claude Code CLI\n`;
  md += `- \`.aider.conf.yml\` — Aider\n`;
  md += `- \`.clinerules\` — Cline\n`;
  md += `- \`agent.json\` — Universal config\n\n`;

  md += `## Usage\n`;
  md += `Copy the relevant file to your project root:\n`;
  md += `\`\`\`bash\ncp .cursorrules /path/to/your/project/\n\`\`\`\n`;

  return md;
}
