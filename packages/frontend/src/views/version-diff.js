export async function renderVersionDiff(container, agentId, v1Num, v2Num) {
  container.innerHTML = `
    <div style="margin-bottom: 24px; padding: 20px;">
      <h2 style="font-size: 1.5rem; font-weight: 800;">🔄 Version Comparison</h2>
      <p class="form-hint">Diffing Agent Version ${v1Num} vs ${v2Num}</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 20px;">
       <div class="card" style="padding: 20px;">
          <div style="font-weight: 700; color: var(--text-secondary); margin-bottom: 12px;">Version ${v1Num}</div>
          <div id="v1-content" style="font-size: 0.85rem; line-height: 1.6;">Loading...</div>
       </div>
       <div class="card" style="padding: 20px;">
          <div style="font-weight: 700; color: var(--neon-cyan); margin-bottom: 12px;">Version ${v2Num} (Latest)</div>
          <div id="v2-content" style="font-size: 0.85rem; line-height: 1.6;">Loading...</div>
       </div>
    </div>
  `;

  try {
     const res = await fetch(`/api/agents/${agentId}/compare?v1=${v1Num}&v2=${v2Num}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('av-token')}` }
     });
     if (res.ok) {
        const data = await res.json();
        renderDiffDetails(container.querySelector('#v1-content'), data.v1, data.v2, false);
        renderDiffDetails(container.querySelector('#v2-content'), data.v2, data.v1, true);
     }
  } catch (err) {
     console.error('Diff failed', err);
  }
}

function renderDiffDetails(container, config, otherConfig, isNew) {
  const sections = [
    { label: 'Role Title', path: 'role.title' },
    { label: 'Persona', path: 'role.persona' },
    { label: 'Tone', path: 'role.tone' },
    { label: 'Guardrails', path: 'guardrails.safetyRules' },
    { label: 'Skills', path: 'skills.selected' }
  ];

  container.innerHTML = sections.map(s => {
     const val = getPath(config, s.path);
     const otherVal = getPath(otherConfig, s.path);
     const changed = JSON.stringify(val) !== JSON.stringify(otherVal);
     
     return `
       <div style="margin-bottom: 16px; padding: 8px; background: ${changed ? (isNew ? 'rgba(0,255,242,0.1)' : 'rgba(255,45,149,0.1)') : 'transparent'}; border-radius: 4px;">
          <div style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">${s.label}</div>
          <div style="margin-top: 4px;">${formatVal(val)}</div>
       </div>
     `;
  }).join('');
}

function getPath(obj, path) {
   return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function formatVal(val) {
   if (Array.isArray(val)) return val.join(', ') || 'None';
   return val || 'Not set';
}
