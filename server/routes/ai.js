// ============================================================
// AI Routes — Ollama-powered Cognitive Chat
// ============================================================

import { getDB } from '../db.js';

const router = Router();

const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function getEnterpriseConfig() {
  const db = getDB();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('enterprise_config');
  return row ? JSON.parse(row.value) : {};
}

const SYSTEM_PROMPT = `You are a friendly cognitive calibration assistant for AgentVendi, an AI agent creation platform. 
You're having a therapy-style conversation to understand the user's working style, preferences, and needs.
Keep responses brief (2-3 sentences), warm, and insightful. Ask follow-up questions to dig deeper.
Focus on understanding: what they build, how they think, what tools they use, what frustrates them, and what their ideal AI assistant would do.`;

const CHAT_PROMPTS = [
  "Tell me about a project you're working on right now.",
  "What's the biggest technical challenge you face daily?",
  "What tools and technologies do you use most?",
  "Describe your ideal coding workflow.",
  "What frustrates you when working with AI tools?",
  "What would a perfect AI coding assistant do for you?",
];

// Cognitive chat endpoint
router.post('/cognitive-chat', async (req, res) => {
  const { message, history, phase } = req.body;
  const config = await getEnterpriseConfig();
  const url = config.ollamaUrl || DEFAULT_OLLAMA_URL;
  const model = config.modelName || DEFAULT_MODEL;

  // Try Ollama first
  try {
    const ollamaResponse = await callOllama(url, model, message, history || []);
    if (ollamaResponse) {
      return res.json({ response: ollamaResponse, source: 'ollama' });
    }
  } catch (e) {
    // Ollama not available, use fallback
  }

  // Fallback: rule-based response
  const nextPrompt = CHAT_PROMPTS[Math.min((phase || 0) + 1, CHAT_PROMPTS.length - 1)];
  const fallbackResponses = [
    `That's really insightful! I can see you have a clear approach to your work. ${nextPrompt}`,
    `Great detail — that tells me a lot about your workflow preferences. ${nextPrompt}`,
    `I appreciate you sharing that. It helps me calibrate the agent to your style. ${nextPrompt}`,
    `Fascinating! This aligns with the patterns I'm seeing in your responses. ${nextPrompt}`,
    `Thank you for being so thorough. We're almost done! ${nextPrompt}`,
    "Perfect! I now have a comprehensive understanding of your working style. I'm generating your cognitive profile now... 🧬",
  ];

  const idx = Math.min(phase || 0, fallbackResponses.length - 1);
  res.json({ response: fallbackResponses[idx], source: 'fallback' });
});

async function callOllama(url, model, message, history) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(h => ({ role: h.role === 'bot' ? 'assistant' : 'user', content: h.text })),
    { role: 'user', content: message },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    return data.message?.content || null;
  } catch (e) {
    clearTimeout(timeout);
    return null;
  }
}

// Check Ollama status
router.get('/status', async (req, res) => {
  try {
    const config = await getEnterpriseConfig();
    const url = config.ollamaUrl || DEFAULT_OLLAMA_URL;
    const response = await fetch(`${url}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      res.json({ ollama: true, models: data.models?.map(m => m.name) || [], webai: false });
    } else {
      res.json({ ollama: false });
    }
  } catch (e) {
    res.json({ ollama: false });
  }
});

export default router;
