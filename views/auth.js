// ============================================================
// Auth View — Login / Register
// ============================================================

import { api } from '../lib/api.js';

let currentUser = null;

export function initAuth() {
  const token = localStorage.getItem('av-token');
  const userData = localStorage.getItem('av-user');
  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
    } catch (e) {
      localStorage.removeItem('av-token');
      localStorage.removeItem('av-user');
    }
  }
}

export function getUser() {
  return currentUser;
}

export function logout() {
  currentUser = null;
  localStorage.removeItem('av-token');
  localStorage.removeItem('av-user');
}

export function renderAuth(mode = 'login') {
  const container = document.getElementById('auth-form-container');
  if (!container) return;

  const isLogin = mode === 'login';

  container.innerHTML = `
    <button class="auth-close" id="close-auth">✕</button>
    <div class="auth-title">${isLogin ? 'Welcome Back' : 'Join AgentVendi'}</div>
    <div class="auth-subtitle">${isLogin ? 'Sign in to your account' : 'Create your free account'}</div>

    <form id="auth-form">
      ${!isLogin ? `
        <div class="form-group">
          <label class="form-label">Username</label>
          <input class="form-input" id="auth-username" placeholder="cooldev42" required />
        </div>
      ` : ''}

      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="auth-email" type="email" placeholder="you@example.com" required />
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" id="auth-password" type="password" placeholder="••••••••" required minlength="6" />
      </div>

      <div id="auth-error" style="color: var(--neon-magenta); font-size: 0.85rem; margin-bottom: 12px; display: none;"></div>

      <button type="submit" class="btn btn-glow" style="width: 100%;">
        ${isLogin ? '🔓 Sign In' : '🚀 Create Account'}
      </button>
    </form>

    <div class="auth-toggle">
      ${isLogin
        ? 'Don\'t have an account? <a id="switch-auth">Sign up</a>'
        : 'Already have an account? <a id="switch-auth">Sign in</a>'}
    </div>
  `;

  // Close modal
  container.querySelector('#close-auth')?.addEventListener('click', () => {
    document.getElementById('auth-modal').classList.add('hidden');
  });

  // Switch between login/register
  container.querySelector('#switch-auth')?.addEventListener('click', () => {
    renderAuth(isLogin ? 'register' : 'login');
  });

  // Form submit
  container.querySelector('#auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = container.querySelector('#auth-error');
    errorEl.style.display = 'none';

    const email = container.querySelector('#auth-email').value;
    const password = container.querySelector('#auth-password').value;
    const username = container.querySelector('#auth-username')?.value;

    try {
      let result;
      if (isLogin) {
        result = await api.login({ email, password });
      } else {
        result = await api.register({ username, email, password });
      }

      currentUser = result.user;
      localStorage.setItem('av-token', result.token);
      localStorage.setItem('av-user', JSON.stringify(result.user));

      document.getElementById('auth-modal').classList.add('hidden');
      window.updateAuthUI?.();
      window.showToast?.(`Welcome${isLogin ? ' back' : ''}, ${currentUser.username}! 🎉`, 'success');
    } catch (err) {
      errorEl.textContent = err.message || 'Something went wrong';
      errorEl.style.display = 'block';
    }
  });
}
