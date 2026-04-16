// ============================================================
// Marketplace View
// ============================================================

import { api } from '../lib/api.js';

export async function renderMarketplace(container) {
  container.innerHTML = `
    <div class="marketplace-header">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800;">🏪 Agent Marketplace</h2>
        <p class="form-hint">Discover and clone agents built by the community</p>
      </div>
      <div class="search-bar">
        <input class="form-input" id="marketplace-search" placeholder="Search agents..." />
      </div>
    </div>

    <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
      <button class="tag active" data-filter="all">All</button>
      <button class="tag" data-filter="trending">🔥 Trending</button>
      <button class="tag" data-filter="new">✨ New</button>
      <button class="tag" data-filter="top-rated">⭐ Top Rated</button>
      <button class="tag" data-filter="code-review">Code Review</button>
      <button class="tag" data-filter="devops">DevOps</button>
      <button class="tag" data-filter="security">Security</button>
      <button class="tag" data-filter="frontend">Frontend</button>
    </div>

    <div class="marketplace-grid" id="marketplace-list">
      ${renderPlaceholderAgents()}
    </div>
  `;

  // Search handler
  let searchTimeout;
  container.querySelector('#marketplace-search')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchAgents(e.target.value, container), 300);
  });

  // Filter handlers
  container.querySelectorAll('.tag[data-filter]').forEach(tag => {
    tag.addEventListener('click', () => {
      container.querySelectorAll('.tag[data-filter]').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      filterAgents(tag.dataset.filter, container);
    });
  });

  // Clone button handlers
  container.addEventListener('click', async (e) => {
    const cloneBtn = e.target.closest('.clone-btn');
    if (cloneBtn) {
      try {
        await api.cloneAgent(cloneBtn.dataset.id);
        window.showToast?.('Agent cloned to your collection! 🎉', 'success');
      } catch (err) {
        window.showToast?.(err.message || 'Please sign in to clone agents', 'error');
      }
    }
  });

  // Try to load from API
  try {
    const data = await api.browseMarketplace();
    if (data.agents?.length) {
      renderAgentCards(container.querySelector('#marketplace-list'), data.agents);
    }
  } catch (e) {
    // Use placeholder data
  }
}

async function searchAgents(query, container) {
  if (!query.trim()) {
    try {
      const data = await api.browseMarketplace();
      renderAgentCards(container.querySelector('#marketplace-list'), data.agents || []);
    } catch (e) {}
    return;
  }
  try {
    const data = await api.searchMarketplace(query);
    renderAgentCards(container.querySelector('#marketplace-list'), data.agents || []);
  } catch (e) {
    // keep existing
  }
}

function filterAgents(filter, container) {
  // Client-side filtering for demo
  const cards = container.querySelectorAll('.agent-card');
  cards.forEach(card => {
    if (filter === 'all') {
      card.style.display = '';
    } else {
      const tags = card.dataset.tags || '';
      card.style.display = tags.includes(filter) ? '' : 'none';
    }
  });
}

function renderAgentCards(container, agents) {
  if (!container) return;
  container.innerHTML = agents.map(a => `
    <div class="agent-card" data-tags="${a.tags || ''}">
      <div class="agent-card-header">
        <div class="agent-avatar" style="background: linear-gradient(135deg, ${a.color1 || '#ff2d95'}, ${a.color2 || '#b44dff'});">
          ${a.emoji || '🤖'}
        </div>
        <div>
          <div class="agent-card-title">${a.name}</div>
          <div class="agent-card-author">by ${a.author || 'anonymous'}</div>
        </div>
      </div>
      <div class="agent-card-desc">${a.description || 'No description'}</div>
      <div class="agent-card-footer">
        <div class="star-rating">${renderStars(a.rating || 0)}</div>
        <div class="agent-stats">
          <span>📥 ${a.clones || 0}</span>
          <span>⭐ ${a.rating?.toFixed(1) || '0.0'}</span>
        </div>
      </div>
      <button class="btn btn-outline btn-sm clone-btn" data-id="${a.id}" style="width: 100%; margin-top: 12px;">
        📋 Clone to My Agents
      </button>
    </div>
  `).join('');
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    i < Math.round(rating) ? '★' : '☆'
  ).join('');
}

function renderPlaceholderAgents() {
  const placeholders = [
    { name: 'Code Sentinel', emoji: '🛡️', desc: 'Strict code reviewer focused on security, performance, and clean code standards.', rating: 4.8, clones: 342, tags: 'code-review,security,top-rated,trending', color1: '#ff2d95', color2: '#b44dff' },
    { name: 'DocBot Pro', emoji: '📝', desc: 'Generates comprehensive documentation, READMEs, and API specs automatically.', rating: 4.6, clones: 256, tags: 'trending,top-rated', color1: '#00f0ff', color2: '#4d7aff' },
    { name: 'DevOps Oracle', emoji: '🚀', desc: 'Kubernetes, Docker, CI/CD pipelines — deploy with confidence.', rating: 4.5, clones: 189, tags: 'devops,top-rated', color1: '#39ff14', color2: '#00f0ff' },
    { name: 'React Wizard', emoji: '⚛️', desc: 'Expert React developer with hooks, patterns, and performance optimization.', rating: 4.7, clones: 412, tags: 'frontend,trending,top-rated', color1: '#4d7aff', color2: '#b44dff' },
    { name: 'SQL Surgeon', emoji: '🗄️', desc: 'Database schema design, query optimization, and migration expert.', rating: 4.3, clones: 128, tags: 'new', color1: '#ffb800', color2: '#ff2d95' },
    { name: 'Bug Hunter', emoji: '🐛', desc: 'Systematic debugger that traces issues from symptoms to root cause.', rating: 4.4, clones: 231, tags: 'trending', color1: '#ff2d95', color2: '#ffb800' },
  ];

  return placeholders.map(a => `
    <div class="agent-card" data-tags="${a.tags}">
      <div class="agent-card-header">
        <div class="agent-avatar" style="background: linear-gradient(135deg, ${a.color1}, ${a.color2});">
          ${a.emoji}
        </div>
        <div>
          <div class="agent-card-title">${a.name}</div>
          <div class="agent-card-author">by community</div>
        </div>
      </div>
      <div class="agent-card-desc">${a.desc}</div>
      <div class="agent-card-footer">
        <div class="star-rating">${renderStars(a.rating)}</div>
        <div class="agent-stats">
          <span>📥 ${a.clones}</span>
          <span>⭐ ${a.rating}</span>
        </div>
      </div>
      <button class="btn btn-outline btn-sm clone-btn" data-id="placeholder" style="width: 100%; margin-top: 12px;">
        📋 Clone to My Agents
      </button>
    </div>
  `).join('');
}
