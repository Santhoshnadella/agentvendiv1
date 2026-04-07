// ============================================================
// Agent Sandbox — Test your agent before exporting
// ============================================================

import { generatePreview } from '../export/generator.js';

export function renderSandbox(container, agentState) {
  const chatHistory = [];
  const systemPrompt = generatePreview(agentState, 'cursorrules');

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.5rem; font-weight: 800;">🧪 Agent Sandbox</h2>
      <p class="form-hint">Test-drive your agent before exporting. See how it would respond.</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: calc(100vh - 200px); max-height: 600px;">
      <!-- System Prompt Preview -->
      <div class="card" style="display: flex; flex-direction: column; overflow: hidden;">
        <div style="padding: 12px 16px; border-bottom: var(--border-subtle); font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">
          📋 Agent System Prompt
        </div>
        <pre class="preview-code" style="flex: 1; overflow: auto; padding: 16px; margin: 0; font-size: 0.75rem;">${escapeHtml(systemPrompt)}</pre>
      </div>

      <!-- Chat Simulator -->
      <div class="card" style="display: flex; flex-direction: column; overflow: hidden;">
        <div style="padding: 12px 16px; border-bottom: var(--border-subtle); font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">
          💬 Chat Simulator
        </div>

        <div class="chat-container" id="sandbox-chat" style="flex: 1; padding: 16px; overflow-y: auto;">
          <div class="chat-bubble bot">
            👋 I'm your configured agent! Try asking me something to see how I'd respond based on your settings.
            <br><br>
            <em style="font-size: 0.8rem; opacity: 0.7;">Note: This is a simulated preview based on your config. Connect Ollama for AI-powered responses.</em>
          </div>
        </div>

        <div class="chat-input-bar" style="padding: 12px 16px; border-top: var(--border-subtle);">
          <input class="form-input" id="sandbox-input" placeholder="Test a message..." />
          <button class="btn btn-glow btn-sm" id="sandbox-send">Send</button>
        </div>
      </div>
    </div>
  `;

  const chatContainer = container.querySelector('#sandbox-chat');
  const input = container.querySelector('#sandbox-input');
  const sendBtn = container.querySelector('#sandbox-send');

  const sendMessage = async () => {
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    // User bubble
    chatContainer.innerHTML += `<div class="chat-bubble user">${escapeHtml(msg)}</div>`;

    // Try Ollama
    // Use real runtime
    try {
      const res = await fetch(`/api/runtime/execute/${agentState.agents[0]?.id || 'preview'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: msg,
          config: {
             system_prompt: systemPrompt,
             mode: agentState.mode
          }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        chatHistory.push({ role: 'user', text: msg });
        chatHistory.push({ role: 'bot', text: data.result });
        chatContainer.innerHTML += `<div class="chat-bubble bot">${escapeHtml(data.result)}</div>`;
      } else {
        throw new Error('Runtime failed');
      }
    } catch (e) {
      // Simulated response based on agent config
      const response = generateSimulatedResponse(agentState, msg);
      chatContainer.innerHTML += `<div class="chat-bubble bot">${escapeHtml(response)}</div>`;
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  sendBtn?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
  });
}

function generateSimulatedResponse(state, msg) {
  const role = state.role.title || 'AI Assistant';
  const tone = state.role.tone || 'professional';
  const style = state.behavior.responseStyle || 'balanced';

  const toneMap = {
    professional: `As your ${role}, I would approach this systematically.`,
    friendly: `Great question! As your ${role}, here's my take:`,
    technical: `From a ${role} perspective, the analysis shows:`,
    mentor: `Let me explain this step by step as your ${role}:`,
    direct: `Here's the answer:`,
    creative: `Interesting challenge! As your ${role}, I see some creative possibilities:`,
  };

  const intro = toneMap[tone] || toneMap.professional;
  const domains = state.knowledge.domains.join(', ') || 'general knowledge';
  const skills = state.skills.selected.join(', ') || 'various skills';

  if (style === 'concise') {
    return `${intro} Based on my expertise in ${domains}, I'd recommend focusing on the core issue first. [This is a simulated response — connect Ollama for real AI]`;
  } else if (style === 'detailed') {
    return `${intro}\n\nBased on my expertise in ${domains} and skills in ${skills}:\n\n1. First, I'd analyze the problem scope\n2. Then evaluate possible approaches\n3. Finally, implement the best solution\n\n[Simulated preview — connect Ollama for AI-powered responses]`;
  }

  return `${intro} I'd leverage my knowledge in ${domains} to help with this. [Simulated preview — connect Ollama for AI-powered responses]`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
