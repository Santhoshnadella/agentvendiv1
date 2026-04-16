// ============================================================
// Tab 7 — Cognitive Calibration
// ============================================================

const QUESTIONS = [
  {
    id: 'thinking-style',
    text: 'How do you approach problem-solving?',
    options: [
      { value: 'analytical', label: '🔬 Analytical — Break it into pieces, examine each part' },
      { value: 'intuitive', label: '💡 Intuitive — Go with gut feeling, iterate fast' },
      { value: 'systematic', label: '📋 Systematic — Follow a defined process step by step' },
      { value: 'creative', label: '🎨 Creative — Explore unconventional solutions first' },
    ],
  },
  {
    id: 'decision-making',
    text: 'How do you prefer to make decisions?',
    options: [
      { value: 'data-driven', label: '📊 Data-driven — Show me the numbers' },
      { value: 'consensus', label: '🤝 Consensus — Discuss with the team' },
      { value: 'rapid', label: '⚡ Rapid — Decide fast, correct later' },
      { value: 'cautious', label: '🛡️ Cautious — Consider all risks first' },
    ],
  },
  {
    id: 'learning-style',
    text: 'How do you learn best?',
    options: [
      { value: 'docs', label: '📚 Reading docs and guides' },
      { value: 'examples', label: '💻 Looking at code examples' },
      { value: 'trial', label: '🧪 Trial and error' },
      { value: 'discussion', label: '💬 Discussing with others' },
    ],
  },
  {
    id: 'priority',
    text: 'What matters most in your code?',
    options: [
      { value: 'speed', label: '🚀 Speed — Ship fast, iterate' },
      { value: 'quality', label: '💎 Quality — Clean, tested, documented' },
      { value: 'simplicity', label: '🧘 Simplicity — KISS, minimal complexity' },
      { value: 'scalability', label: '📈 Scalability — Built for growth' },
    ],
  },
  {
    id: 'feedback',
    text: 'How do you want your agent to give feedback?',
    options: [
      { value: 'gentle', label: '🌸 Gentle — Suggest improvements kindly' },
      { value: 'direct', label: '🎯 Direct — Tell me what\'s wrong immediately' },
      { value: 'educational', label: '🎓 Educational — Explain why, teach me' },
      { value: 'silent', label: '🤐 Silent — Just fix it, don\'t explain' },
    ],
  },
];

const CHAT_PROMPTS = [
  "Tell me about a project you're working on right now.",
  "What's the biggest technical challenge you face daily?",
  "What tools and technologies do you use most?",
  "Describe your ideal coding workflow.",
  "What makes you frustrated when working with AI tools?",
  "What would a perfect AI coding assistant do for you?",
];

let chatPhase = 0;

export function renderCognitiveTab(container, state) {
  const c = state.cognitive;
  const allAnswered = QUESTIONS.every(q => c.answers[q.id]);

  container.innerHTML = `
    <div class="tab-section-title">🧬 Cognitive Calibration</div>
    <div class="tab-section-desc">Help us understand how you think so we can calibrate your agent to match your workflow.</div>

    ${!allAnswered ? renderQuestionnaire(c) : renderChatPhase(c)}
  `;

  if (!allAnswered) {
    // Questionnaire handlers
    container.querySelectorAll('.question-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const qId = opt.dataset.question;
        c.answers[qId] = opt.dataset.value;

        // Update UI
        container.querySelectorAll(`.question-option[data-question="${qId}"]`).forEach(o => {
          o.classList.remove('selected');
        });
        opt.classList.add('selected');
        window.dispatchStateChange();

        // Auto-advance when all answered
        if (QUESTIONS.every(q => c.answers[q.id])) {
          chatPhase = 0;
          setTimeout(() => renderCognitiveTab(container, state), 500);
        }
      });
    });
  } else {
    // Chat handlers
    const input = container.querySelector('#chat-input');
    const sendBtn = container.querySelector('#chat-send');
    const chatContainer = container.querySelector('.chat-container');

    const sendMessage = async () => {
      const msg = input?.value?.trim();
      if (!msg) return;

      // Add user message
      c.chatHistory.push({ role: 'user', text: msg });
      input.value = '';

      // Re-render chat
      renderChatMessages(chatContainer, c);

      // Generate bot response
      try {
        const response = await getChatResponse(msg, c, chatPhase);
        c.chatHistory.push({ role: 'bot', text: response });
        chatPhase++;
      } catch (e) {
        c.chatHistory.push({ role: 'bot', text: getLocalResponse(chatPhase) });
        chatPhase++;
      }

      renderChatMessages(chatContainer, c);
      window.dispatchStateChange();

      // Generate profile after enough chat
      if (chatPhase >= CHAT_PROMPTS.length) {
        c.profile = generateCognitiveProfile(c);
        setTimeout(() => renderCognitiveTab(container, state), 1000);
      }
    };

    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Start chat if empty
    if (c.chatHistory.length === 0) {
      c.chatHistory.push({
        role: 'bot',
        text: "Hey! 👋 I'd love to learn more about how you work. " + CHAT_PROMPTS[0],
      });
      renderChatMessages(chatContainer, c);
      window.dispatchStateChange();
    }
  }
}

function renderQuestionnaire(c) {
  return QUESTIONS.map(q => `
    <div class="question-card">
      <div class="question-text">${q.text}</div>
      <div class="question-options">
        ${q.options.map(opt => `
          <button class="question-option ${c.answers[q.id] === opt.value ? 'selected' : ''}"
            data-question="${q.id}" data-value="${opt.value}">
            ${opt.label}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderChatPhase(c) {
  if (c.profile) {
    return `
      <div class="card" style="margin-bottom: 16px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🧬</div>
          <div style="font-size: 1.1rem; font-weight: 700;">Your Cognitive Profile</div>
          <div class="form-hint">Based on your questionnaire and conversation</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
          ${Object.entries(c.profile).map(([key, val]) => `
            <div class="card" style="padding: 12px; text-align: center;">
              <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">${key}</div>
              <div style="font-size: 0.95rem; font-weight: 600; color: var(--neon-cyan); margin-top: 4px;">${val}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <button class="btn btn-outline btn-sm" id="reset-cognitive" style="width: 100%;">🔄 Retake Assessment</button>
    `;
  }

  return `
    <div class="card" style="margin-bottom: 16px; padding: 8px 16px;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--text-muted);">
        <span>💬</span>
        <span>Therapy session — ${Math.min(chatPhase + 1, CHAT_PROMPTS.length)}/${CHAT_PROMPTS.length} topics explored</span>
      </div>
    </div>
    <div class="chat-container" id="chat-area"></div>
    <div class="chat-input-bar">
      <input class="form-input" id="chat-input" placeholder="Share your thoughts..." autofocus />
      <button class="btn btn-glow btn-sm" id="chat-send">Send</button>
    </div>
  `;
}

function renderChatMessages(container, c) {
  if (!container) return;
  container.innerHTML = c.chatHistory.map(msg => `
    <div class="chat-bubble ${msg.role === 'user' ? 'user' : 'bot'}">
      ${msg.text}
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

async function getChatResponse(userMessage, c, phase) {
  try {
    const res = await fetch('/api/ai/cognitive-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history: c.chatHistory,
        phase,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.response;
    }
  } catch (e) {
    // fallback to local
  }
  return getLocalResponse(phase);
}

function getLocalResponse(phase) {
  const nextPrompt = CHAT_PROMPTS[Math.min(phase + 1, CHAT_PROMPTS.length - 1)];
  const responses = [
    `That's really interesting! I can see you have a clear approach. ${nextPrompt}`,
    `Great insight. That tells me a lot about your workflow preferences. ${nextPrompt}`,
    `I appreciate you sharing that. It helps me understand your thinking style. ${nextPrompt}`,
    `Fascinating! This aligns well with the patterns I'm seeing. ${nextPrompt}`,
    `Thank you for being so detailed. Almost there! ${nextPrompt}`,
    "Perfect! I now have a great understanding of your working style. I'm generating your cognitive profile now... 🧬",
  ];
  return responses[Math.min(phase, responses.length - 1)];
}

function generateCognitiveProfile(c) {
  const a = c.answers;
  return {
    'Thinking': a['thinking-style'] || 'Analytical',
    'Decisions': a['decision-making'] || 'Data-driven',
    'Learning': a['learning-style'] || 'Examples',
    'Priority': a['priority'] || 'Quality',
    'Feedback': a['feedback'] || 'Direct',
    'Style': inferOverallStyle(a),
  };
}

function inferOverallStyle(answers) {
  const styles = Object.values(answers);
  if (styles.includes('analytical') && styles.includes('quality')) return 'Methodical Builder';
  if (styles.includes('creative') && styles.includes('speed')) return 'Rapid Innovator';
  if (styles.includes('systematic') && styles.includes('scalability')) return 'Systems Architect';
  if (styles.includes('intuitive') && styles.includes('simplicity')) return 'Elegant Simplifier';
  return 'Balanced Craftsman';
}
