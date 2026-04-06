// ============================================================
// Web AI — Browser-based AI for cognitive chat
// ============================================================

// Uses the /api/ai/cognitive-chat endpoint which handles:
// 1. Ollama (if available locally)
// 2. Rule-based fallback (always available)
//
// For fully web-friendly operation, we use the server-side fallback
// system which works without any local AI installation.

const AI_ENDPOINT = '/api/ai/cognitive-chat';

export async function chatWithAI(message, history = [], phase = 0) {
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, phase }),
    });

    if (res.ok) {
      const data = await res.json();
      return { response: data.response, source: data.source || 'server' };
    }
  } catch (e) {
    // Server unavailable
  }

  // Client-side fallback if server is down
  return { response: generateLocalResponse(message, phase), source: 'local' };
}

export async function checkAIStatus() {
  try {
    const res = await fetch('/api/ai/status');
    if (res.ok) return await res.json();
  } catch (e) {}
  return { ollama: false, models: [], webai: true };
}

function generateLocalResponse(message, phase) {
  const responses = [
    "That's really insightful! I can see you have a clear vision for your work. What tools and technologies do you rely on most?",
    "Great detail — understanding your tech stack helps me configure the perfect assistant. What frustrates you most about current AI tools?",
    "I appreciate you sharing that. These pain points are exactly what we'll address. What does your ideal coding workflow look like?",
    "Fascinating! This gives me a clear picture of your preferences. What kind of feedback style do you prefer from an assistant?",
    "Thank you for being so thorough. One last question — how do you approach debugging when you get stuck?",
    "Perfect! I now have a comprehensive understanding of your working style. Generating your cognitive profile now... 🧬",
  ];
  return responses[Math.min(phase, responses.length - 1)];
}
