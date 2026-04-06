// ============================================================
// AgentVendi — Main Application
// ============================================================

import { renderSelectionTab } from './tabs/selection.js';
import { renderBehaviorTab } from './tabs/behavior.js';
import { renderKnowledgeTab } from './tabs/knowledge.js';
import { renderRoleTab } from './tabs/role.js';
import { renderGuardrailsTab } from './tabs/guardrails.js';
import { renderSkillsTab } from './tabs/skills.js';
import { renderCognitiveTab } from './tabs/cognitive.js';
import { renderMarketplace } from './views/marketplace.js';
import { renderHome } from './views/home.js';
import { renderMasterclass } from './views/masterclass.js';
import { renderMyAgents } from './views/my-agents.js';
import { renderTeams } from './views/teams.js';
import { renderAnalytics } from './views/analytics.js';
import { renderSandbox } from './views/sandbox.js';
import { renderAuth, initAuth, getUser, logout } from './views/auth.js';
import { generatePreview } from './export/generator.js';
import { downloadBundle } from './export/bundler.js';
import { state, saveState, loadState } from './lib/state.js';

// ---- Tab registry ----
const TABS = [
  { id: 'selection', render: renderSelectionTab },
  { id: 'behavior', render: renderBehaviorTab },
  { id: 'knowledge', render: renderKnowledgeTab },
  { id: 'role', render: renderRoleTab },
  { id: 'guardrails', render: renderGuardrailsTab },
  { id: 'skills', render: renderSkillsTab },
  { id: 'cognitive', render: renderCognitiveTab },
];

let currentTab = 0;
let currentView = 'home';
let enterpriseConfig = null;

async function initConfig() {
  try {
    const res = await fetch('/api/config/enterprise');
    if (res.ok) {
      const data = await res.json();
      enterpriseConfig = data;
    }
  } catch (e) {
    console.warn('Enterprise config fetch failed', e);
  }
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initAuth();
  initTheme();
  initNavigation();
  initConfig();
  initHome();
  initTabs();
  initFooter();
  initAccessibility();
  renderCurrentTab();
  updateProgress();
  updateAuthUI();
});

// ---- Theme ----
function initTheme() {
  const saved = localStorage.getItem('av-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-toggle');
  btn.textContent = saved === 'dark' ? '🌙' : '☀️';
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('av-theme', next);
    btn.textContent = next === 'dark' ? '🌙' : '☀️';
    showToast(`Switched to ${next} mode`, 'info');
  });
}

// ---- Top Nav ----
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });

  // Auth buttons
  document.getElementById('login-btn')?.addEventListener('click', () => {
    renderAuth('login');
    document.getElementById('auth-modal').classList.remove('hidden');
  });

  document.getElementById('user-menu-btn')?.addEventListener('click', () => {
    document.getElementById('user-dropdown').classList.toggle('hidden');
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
      document.getElementById('user-dropdown')?.classList.add('hidden');
    }
  });

  // Dropdown actions
  document.getElementById('user-dropdown')?.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'logout') {
      logout();
      updateAuthUI();
      showToast('Logged out successfully', 'info');
    }
  });

  // Modal backdrop close
  document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
    document.getElementById('auth-modal').classList.add('hidden');
  });
}

function initHome() {
  renderHome();
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${view}`);
  if (target) {
    target.classList.add('active');
    if (view === 'home') renderHome(target);
    else if (view === 'masterclass') renderMasterclass(target);
    else if (view === 'marketplace') renderMarketplace(target);
    else if (view === 'my-agents') renderMyAgents(target);
    else if (view === 'teams') renderTeams(target);
    else if (view === 'analytics') renderAnalytics(target);
    else if (view === 'sandbox') renderSandbox(target, state);
    else if (view === 'vending') renderCurrentTab();
  }
}

window.switchView = switchView;

// ---- Tab System ----
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      // Only allow navigating to completed tabs or the next one
      if (index <= currentTab || state.completedTabs?.includes(TABS[index]?.id) || index === currentTab + 1) {
        currentTab = index;
        renderCurrentTab();
        updateTabUI();
        updateProgress();
        updateFooterButtons();
      } else {
        showToast('Complete the current tab first! ⚠️', 'error');
        btn.style.animation = 'shake 0.4s ease';
        setTimeout(() => btn.style.animation = '', 400);
      }
    });
  });
}

function renderCurrentTab() {
  const container = document.getElementById('tab-content');
  if (!container) return;
  container.innerHTML = '';
  const tab = TABS[currentTab];
  if (tab) {
    tab.render(container, state);
    container.style.animation = 'none';
    container.offsetHeight; // trigger reflow
    container.style.animation = 'tabFadeIn 0.3s var(--ease-out)';
  }
  updateTabUI();
  updatePreview();
}

function updateTabUI() {
  document.querySelectorAll('.tab-btn').forEach((btn, index) => {
    btn.classList.toggle('active', index === currentTab);
    const tabId = TABS[index]?.id;
    const isCompleted = state.completedTabs?.includes(tabId);
    btn.classList.toggle('completed', !!isCompleted);
  });
}

function updateProgress() {
  const fill = document.getElementById('progress-fill');
  if (fill) {
    const completed = state.completedTabs?.length || 0;
    const pct = (completed / TABS.length) * 100;
    fill.style.width = pct + '%';
  }
}

// ---- Preview ----
function updatePreview() {
  const code = document.getElementById('preview-code');
  const format = document.getElementById('preview-format');
  if (code && format) {
    const preview = generatePreview(state, format.value, enterpriseConfig || {});
    code.textContent = preview;
  }
}

// Listen for format change
document.getElementById('preview-format')?.addEventListener('change', updatePreview);

// Listen for state changes
window.addEventListener('agent-state-change', () => {
  updatePreview();
  saveState();
});

// ---- Footer Buttons ----
function initFooter() {
  document.getElementById('btn-prev')?.addEventListener('click', () => {
    if (currentTab > 0) {
      currentTab--;
      renderCurrentTab();
      updateProgress();
      updateFooterButtons();
    }
  });

  document.getElementById('btn-next')?.addEventListener('click', () => {
    const tabId = TABS[currentTab]?.id;
    const errors = validateTab(tabId, state);

    if (errors.length > 0) {
      showToast(`⚠️ ${errors[0]}`, 'error');
      const content = document.getElementById('tab-content');
      content.style.animation = 'shake 0.4s ease';
      setTimeout(() => content.style.animation = '', 400);
      return;
    }

    // Mark current tab as completed
    if (tabId && !state.completedTabs.includes(tabId)) {
      state.completedTabs.push(tabId);
    }
    if (currentTab < TABS.length - 1) {
      currentTab++;
      renderCurrentTab();
      updateProgress();
      updateFooterButtons();
    }
    saveState();
    window.dispatchEvent(new Event('agent-state-change'));
  });

  document.getElementById('btn-dispense')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-dispense');
    const textEl = btn.querySelector('.dispense-text');
    const loadEl = btn.querySelector('.dispense-loading');
    textEl.classList.add('hidden');
    loadEl.classList.remove('hidden');
    btn.disabled = true;

    try {
      // Save to backend if logged in
      const user = getUser();
      if (user) {
        try {
          const { api } = await import('./lib/api.js');
          await api.createAgent({
            name: state.agents[0]?.name || 'My Agent',
            config: state,
          });
        } catch (e) {
          // Continue even if save fails
        }
      }
      
      const { downloadBundle } = await import('./export/bundler.js');
      await downloadBundle(state, enterpriseConfig || {});
      showToast('🎰 Agent dispensed! Check your downloads.', 'success');
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    } finally {
      textEl.classList.remove('hidden');
      loadEl.classList.add('hidden');
      btn.disabled = false;
    }
  });

  updateFooterButtons();
}

function updateFooterButtons() {
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  const dispense = document.getElementById('btn-dispense');

  if (prev) prev.disabled = currentTab === 0;

  if (currentTab === TABS.length - 1) {
    next?.classList.add('hidden');
    dispense?.classList.remove('hidden');
  } else {
    next?.classList.remove('hidden');
    dispense?.classList.add('hidden');
  }
}

// ---- Accessibility ----
function initAccessibility() {
  // Keyboard navigation for tabs
  document.addEventListener('keydown', (e) => {
    // Alt+1-7 for tabs
    if (e.altKey && e.key >= '1' && e.key <= '7') {
      e.preventDefault();
      currentTab = parseInt(e.key) - 1;
      renderCurrentTab();
      updateProgress();
      updateFooterButtons();
    }

    // Ctrl+Left/Right for tab navigation
    if (e.ctrlKey && e.key === 'ArrowRight' && currentTab < TABS.length - 1) {
      e.preventDefault();
      currentTab++;
      renderCurrentTab();
      updateProgress();
      updateFooterButtons();
    }
    if (e.ctrlKey && e.key === 'ArrowLeft' && currentTab > 0) {
      e.preventDefault();
      currentTab--;
      renderCurrentTab();
      updateProgress();
      updateFooterButtons();
    }

    // Escape closes modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
      document.getElementById('user-dropdown')?.classList.add('hidden');
    }

    // Ctrl+Enter to dispense
    if (e.ctrlKey && e.key === 'Enter' && currentTab === TABS.length - 1) {
      e.preventDefault();
      document.getElementById('btn-dispense')?.click();
    }
  });

  // Add ARIA labels to interactive elements
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', `Step ${i + 1}: ${TABS[i]?.id}`);
    btn.setAttribute('aria-selected', i === currentTab ? 'true' : 'false');
    btn.setAttribute('tabindex', i === currentTab ? '0' : '-1');
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', `Navigate to ${btn.dataset.view}`);
  });

  // Focus management
  document.getElementById('tab-content')?.setAttribute('role', 'tabpanel');
  document.querySelector('.tab-rail')?.setAttribute('role', 'tablist');
  document.querySelector('.top-bar-nav')?.setAttribute('role', 'navigation');

  // Skip link
  const skipLink = document.createElement('a');
  skipLink.href = '#tab-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to content';
  skipLink.style.cssText = 'position: absolute; top: -100px; left: 0; background: var(--neon-cyan); color: black; padding: 8px 16px; z-index: 999; transition: top 0.2s;';
  skipLink.addEventListener('focus', () => { skipLink.style.top = '0'; });
  skipLink.addEventListener('blur', () => { skipLink.style.top = '-100px'; });
  document.body.prepend(skipLink);
}

// ---- Auth UI sync ----
export function updateAuthUI() {
  const user = getUser();
  const loginBtn = document.getElementById('login-btn');
  const userMenu = document.getElementById('user-menu');

  if (user) {
    loginBtn?.classList.add('hidden');
    userMenu?.classList.remove('hidden');
  } else {
    loginBtn?.classList.remove('hidden');
    userMenu?.classList.add('hidden');
  }
}

// ---- Toast ----
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---- Tab Validation ----
function validateTab(tabId, state) {
  const errors = [];
  switch (tabId) {
    case 'selection':
      if (!state.agents?.length) errors.push('Add at least one agent');
      if (state.agents?.some(a => !a.name?.trim())) errors.push('Give each agent a name');
      break;
    case 'behavior':
      if (!state.behavior.responseStyle) errors.push('Select a response style');
      break;
    case 'knowledge':
      if (!state.knowledge.domains.length && !state.knowledge.customText?.trim()) {
        errors.push('Add at least one knowledge domain or custom knowledge');
      }
      break;
    case 'role':
      if (!state.role.title?.trim()) errors.push('Enter a role title for your agent');
      break;
    case 'guardrails':
      if (!state.guardrails.safetyRules.length && !state.guardrails.contentPolicies.length) {
        errors.push('Select at least one safety rule or coding standard');
      }
      break;
    case 'skills':
      if (!state.skills.selected.length && !state.skills.custom.some(s => s.name)) {
        errors.push('Select at least one skill');
      }
      break;
    case 'cognitive':
      const answered = Object.keys(state.cognitive.answers || {}).length;
      if (answered < 3) errors.push(`Answer at least 3 questionnaire items (${answered}/3 done)`);
      break;
  }
  return errors;
}

// Expose globally for sub-modules
window.showToast = showToast;
window.updateAuthUI = updateAuthUI;
window.switchView = switchView;
window.renderCurrentTab = renderCurrentTab;
window.dispatchStateChange = () => window.dispatchEvent(new Event('agent-state-change'));

