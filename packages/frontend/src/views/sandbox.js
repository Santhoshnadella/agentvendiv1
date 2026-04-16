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

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: calc(100vh - 250px); max-height: 800px;">
      <!-- Execution Context & Brain -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card" style="flex: 0.4; display: flex; flex-direction: column; overflow: hidden;">
          <div style="padding: 12px 16px; border-bottom: var(--border-subtle); font-weight: 600; font-size: 0.85rem; color: var(--neon-cyan); display: flex; justify-content: space-between; align-items: center;">
             <span>🧠 Agent Brain (Current Context)</span>
             <button class="btn btn-outline btn-xs" id="sandbox-voice-toggle">🎙️ Voice: Off</button>
          </div>
          <div id="agent-brain-panel" style="flex: 1; overflow: auto; padding: 16px; font-size: 0.75rem; font-family: 'Fira Code', monospace; background: rgba(0,255,242,0.03);">
             <div style="color: var(--text-muted); text-align: center; margin-top: 20px;">Agent is idle. Awaiting user input to populate cognitive state...</div>
          </div>
        </div>
        
        <div class="card" style="flex: 0.6; display: flex; flex-direction: column; overflow: hidden;">
          <div style="padding: 12px 16px; border-bottom: var(--border-subtle); font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">
            📋 System Prompt
          </div>
          <pre class="preview-code" style="flex: 1; overflow: auto; padding: 16px; margin: 0; font-size: 0.7rem;">${escapeHtml(systemPrompt)}</pre>
        </div>
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
  const brainPanel = container.querySelector('#agent-brain-panel');
  const voiceBtn = container.querySelector('#sandbox-voice-toggle');

  let voiceEnabled = false;
  const sessionStart = Date.now();

  // ── Voice (TTS) Setup ──
  // Uses the Web Speech API (SpeechSynthesis interface)
  // https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
  voiceBtn?.addEventListener('click', () => {
     voiceEnabled = !voiceEnabled;
     voiceBtn.textContent = `🎙️ Voice: ${voiceEnabled ? 'On' : 'Off'}`;
     voiceBtn.classList.toggle('active', voiceEnabled);
     if (voiceEnabled) {
        // Test TTS availability
        if (!('speechSynthesis' in window)) {
           window.showToast?.('Text-to-Speech not supported in this browser.', 'error');
           voiceEnabled = false;
           voiceBtn.textContent = '🎙️ Voice: Off';
           return;
        }
        window.showToast?.('Voice enabled. Agent will speak responses aloud.', 'success');
     }
  });

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
        
        // Update Brain
        updateBrain(brainPanel, data.result, agentState, sessionStart);

        // Voice Interaction — Web Speech API
        // Uses SpeechSynthesisUtterance for text-to-speech output.
        // Selects a natural-sounding voice when available.
        if (voiceEnabled && 'speechSynthesis' in window) {
           try {
              speechSynthesis.cancel(); // Cancel any ongoing speech
              const utterance = new SpeechSynthesisUtterance(data.result);
              utterance.rate = 1.0;
              utterance.pitch = 1.0;
              // Pick a natural voice if available
              const voices = speechSynthesis.getVoices();
              const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
              if (preferred) utterance.voice = preferred;
              speechSynthesis.speak(utterance);
           } catch (ttsErr) {
              console.warn('TTS failed:', ttsErr);
           }
        }
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

function updateBrain(panel, lastResponse, state, sessionStart) {
  const uptimeMs = Date.now() - (sessionStart || Date.now());
  const upMinutes = Math.floor(uptimeMs / 60000);
  const upSeconds = Math.floor((uptimeMs % 60000) / 1000);

  panel.innerHTML = `
    <div style="margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
       <div style="font-weight: 700; color: var(--neon-pink); margin-bottom: 4px;">🎯 ACTIVE OBJECTIVES</div>
       <div style="color: var(--text-primary); white-space: pre-wrap; font-size: 0.7rem;">${state.role?.objectives || 'None defined'}</div>
    </div>
    <div style="margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
       <div style="font-weight: 700; color: var(--neon-cyan); margin-bottom: 4px;">🧠 CONTEXT WINDOW</div>
       <div style="color: var(--text-primary); opacity: 0.8; font-size: 0.7rem;">Last output: "${lastResponse.substring(0, 80)}..."</div>
       <div style="color: var(--text-muted); font-size: 0.65rem; margin-top: 4px;">Domains: ${(state.knowledge?.domains || []).join(', ') || 'none'}</div>
    </div>
    <div style="margin-bottom: 12px;">
       <div style="font-weight: 700; color: var(--neon-purple); margin-bottom: 4px;">🛠️ TOOL DISPATCHER</div>
       <div style="color: var(--text-primary); font-family: monospace; font-size: 0.7rem;">Available: [${state.behavior?.toolUse ? 'web_search, read_file, write_file, query_knowledge_base, browser_action, handoff, delete_file' : 'none'}]</div>
    </div>
    <div style="margin-bottom: 12px;">
       <div style="font-weight: 700; color: var(--neon-blue); margin-bottom: 4px;">📡 PROVIDER</div>
       <div style="color: var(--text-primary); font-size: 0.7rem;">Ollama (local) | OpenAI | Anthropic — configurable via Enterprise Settings</div>
    </div>
    <div style="font-size: 0.65rem; color: var(--text-muted); text-align: center; margin-top: 12px; opacity: 0.5;">
       ${state.agents?.[0]?.name || 'agent'} · Uptime: ${upMinutes}m ${upSeconds}s
    </div>
  `;
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
