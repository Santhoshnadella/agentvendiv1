// ============================================================
// Tab 3 — Knowledge Base
// ============================================================

const DOMAIN_PRESETS = [
  'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C#',
  'React', 'Vue', 'Angular', 'Node.js', 'Django', 'FastAPI',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
  'Machine Learning', 'Data Science', 'DevOps', 'Security',
  'Mobile Dev', 'iOS', 'Android', 'Flutter', 'React Native',
];

export function renderKnowledgeTab(container, state) {
  const k = state.knowledge;

  container.innerHTML = `
    <div class="tab-section-title">🧠 Feed the Brain</div>
    <div class="tab-section-desc">Define what your agent knows — domains, documentation, and reference materials.</div>

    <div class="form-group">
      <label class="form-label">Domain Expertise</label>
      <div class="form-hint">Select areas your agent should specialize in:</div>
      <div class="tag-list" id="domain-tags">
        ${DOMAIN_PRESETS.map(d => `
          <span class="tag ${k.domains.includes(d) ? 'active' : ''}" data-domain="${d}">${d}</span>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Custom Knowledge</label>
      <textarea class="form-textarea" id="custom-knowledge"
        placeholder="Paste any additional context, documentation, or instructions your agent should know..."
        rows="6">${k.customText}</textarea>
      <div class="form-hint">This text will be injected directly into your agent's system prompt.</div>
    </div>

    <div class="form-group">
      <label class="form-label">Reference URLs</label>
      <div id="url-list">
        ${k.urls.map((url, i) => `
          <div class="agent-list-item" style="margin-bottom: 4px; padding: 8px 12px;">
            <span style="flex: 1; font-family: var(--font-mono); font-size: 0.82rem; color: var(--neon-cyan);">${url}</span>
            <button class="btn btn-danger btn-sm remove-url" data-index="${i}">✕</button>
          </div>
        `).join('')}
      </div>
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <input class="form-input" id="new-url" placeholder="https://docs.example.com/api" style="flex: 1;" />
        <button class="btn btn-outline btn-sm" id="add-url">+ Add</button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">File References</label>
      <div id="file-list">
        ${k.fileRefs.map((f, i) => `
          <div class="agent-list-item" style="margin-bottom: 4px; padding: 8px 12px;">
            <span>📄</span>
            <span style="flex: 1; font-size: 0.85rem;">${f}</span>
            <button class="btn btn-danger btn-sm remove-file" data-index="${i}">✕</button>
          </div>
        `).join('')}
      </div>
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <input class="form-input" id="new-file" placeholder="src/**/*.ts, docs/*.md" style="flex: 1;" />
        <button class="btn btn-outline btn-sm" id="add-file">+ Add</button>
      </div>
    </div>
  `;

  // Domain tag click
  container.querySelectorAll('#domain-tags .tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const domain = tag.dataset.domain;
      if (k.domains.includes(domain)) {
        k.domains = k.domains.filter(d => d !== domain);
      } else {
        k.domains.push(domain);
      }
      tag.classList.toggle('active');
      window.dispatchStateChange();
    });
  });

  // Custom text
  container.querySelector('#custom-knowledge')?.addEventListener('input', (e) => {
    k.customText = e.target.value;
    window.dispatchStateChange();
  });

  // Add URL
  container.querySelector('#add-url')?.addEventListener('click', () => {
    const input = container.querySelector('#new-url');
    if (input.value.trim()) {
      k.urls.push(input.value.trim());
      renderKnowledgeTab(container, state);
      window.dispatchStateChange();
    }
  });

  // Remove URL
  container.querySelectorAll('.remove-url').forEach(btn => {
    btn.addEventListener('click', () => {
      k.urls.splice(parseInt(btn.dataset.index), 1);
      renderKnowledgeTab(container, state);
      window.dispatchStateChange();
    });
  });

  // Add file ref
  container.querySelector('#add-file')?.addEventListener('click', () => {
    const input = container.querySelector('#new-file');
    if (input.value.trim()) {
      k.fileRefs.push(input.value.trim());
      renderKnowledgeTab(container, state);
      window.dispatchStateChange();
    }
  });

  // Remove file ref
  container.querySelectorAll('.remove-file').forEach(btn => {
    btn.addEventListener('click', () => {
      k.fileRefs.splice(parseInt(btn.dataset.index), 1);
      renderKnowledgeTab(container, state);
      window.dispatchStateChange();
    });
  });
}
