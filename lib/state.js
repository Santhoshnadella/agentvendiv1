// ============================================================
// AgentVendi — Global State Manager
// ============================================================

const STATE_KEY = 'agentvendi-state';

export const state = {
  // Meta
  completedTabs: [],

  // Tab 1: Selection
  mode: 'single', // 'single' | 'multi'
  agents: [{ name: 'My Agent', id: crypto.randomUUID?.() || Date.now().toString() }],

  // Tab 2: Behavior
  behavior: {
    responseStyle: 'detailed',
    autonomy: 50,
    toolUse: true,
    errorHandling: 'explain',
    creativity: 50,
    verbosity: 'balanced',
  },

  // Tab 3: Knowledge
  knowledge: {
    domains: [],
    customText: '',
    urls: [],
    fileRefs: [],
  },

  // Tab 4: Role
  role: {
    title: '',
    persona: '',
    tone: 'professional',
    objectives: '',
    constraints: '',
  },

  // Tab 5: Guardrails
  guardrails: {
    safetyRules: [],
    contentPolicies: [],
    outputFormat: '',
    prohibitedTopics: '',
    qualityThreshold: 'high',
    customRules: '',
  },

  // Tab 6: Skills
  skills: {
    selected: [],
    custom: [],
  },

  // Tab 7: Cognitive
  cognitive: {
    answers: {},
    chatHistory: [],
    profile: null,
  },
};

export function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}

export function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    }
  } catch (e) {
    console.warn('Failed to load state', e);
  }
}

export function resetState() {
  localStorage.removeItem(STATE_KEY);
  Object.assign(state, {
    completedTabs: [],
    mode: 'single',
    agents: [{ name: 'My Agent', id: Date.now().toString() }],
    behavior: { responseStyle: 'detailed', autonomy: 50, toolUse: true, errorHandling: 'explain', creativity: 50, verbosity: 'balanced' },
    knowledge: { domains: [], customText: '', urls: [], fileRefs: [] },
    role: { title: '', persona: '', tone: 'professional', objectives: '', constraints: '' },
    guardrails: { safetyRules: [], contentPolicies: [], outputFormat: '', prohibitedTopics: '', qualityThreshold: 'high', customRules: '' },
    skills: { selected: [], custom: [] },
    cognitive: { answers: {}, chatHistory: [], profile: null },
  });
}
