// ============================================================
// AgentVendi — API Client
// ============================================================

const BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('av-token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(method, path, body) {
  const opts = { method, headers: getHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  me: () => request('GET', '/auth/me'),

  // Agents
  listAgents: () => request('GET', '/agents'),
  getAgent: (id) => request('GET', `/agents/${id}`),
  createAgent: (data) => request('POST', '/agents', data),
  updateAgent: (id, data) => request('PUT', `/agents/${id}`, data),
  deleteAgent: (id) => request('DELETE', `/agents/${id}`),
  publishAgent: (id) => request('POST', `/agents/${id}/publish`),
  cloneAgent: (id) => request('POST', `/agents/${id}/clone`),
  getVersions: (id) => request('GET', `/agents/${id}/versions`),

  // Marketplace
  browseMarketplace: (params = '') => request('GET', `/marketplace?${params}`),
  searchMarketplace: (q) => request('GET', `/marketplace/search?q=${encodeURIComponent(q)}`),
  rateAgent: (id, rating) => request('POST', `/marketplace/${id}/rate`, { rating }),

  // Teams
  listTeams: () => request('GET', '/teams'),
  createTeam: (data) => request('POST', '/teams', data),
  inviteMember: (teamId, data) => request('POST', `/teams/${teamId}/invite`, data),

  // Export
  exportAgent: (id, format) => request('GET', `/export/${id}?format=${format}`),

  // AI
  cognitiveChat: (message, history) => request('POST', '/ai/cognitive-chat', { message, history }),
};
