// ============================================================
// Version Diff Viewer
// ============================================================

import { api } from '../lib/api.js';

export async function renderVersionDiff(container, agentId) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.5rem; font-weight: 800;">📜 Version History</h2>
      <p class="form-hint">Compare changes between agent versions</p>
    </div>
    <div id="version-list" style="margin-bottom: 24px;">Loading versions...</div>
    <div id="diff-display" style="display: none;">
      <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
        <select class="form-select" id="diff-from" style="width: auto;"></select>
        <span style="color: var(--text-muted);">→</span>
        <select class="form-select" id="diff-to" style="width: auto;"></select>
        <button class="btn btn-outline btn-sm" id="compare-btn">Compare</button>
      </div>
      <div id="diff-output" class="diff-viewer" style="min-height: 200px;"></div>
    </div>
  `;

  try {
    const data = await api.getVersions(agentId);
    const versions = data.versions || [];

    if (!versions.length) {
      container.querySelector('#version-list').innerHTML = `
        <div class="form-hint" style="text-align: center; padding: 40px;">No version history available</div>
      `;
      return;
    }

    container.querySelector('#version-list').innerHTML = versions.map(v => `
      <div class="agent-list-item" style="margin-bottom: 4px;">
        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg-input); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; color: var(--neon-cyan);">
          v${v.version}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 0.9rem;">Version ${v.version}</div>
          <div class="form-hint">${new Date(v.created_at).toLocaleString()}</div>
        </div>
        <button class="btn btn-outline btn-sm restore-btn" data-version="${v.version}">Restore</button>
      </div>
    `).join('');

    // Show diff controls
    const diffDisplay = container.querySelector('#diff-display');
    if (versions.length >= 2) {
      diffDisplay.style.display = 'block';
      const fromSelect = container.querySelector('#diff-from');
      const toSelect = container.querySelector('#diff-to');

      versions.forEach(v => {
        fromSelect.innerHTML += `<option value="${v.version}">v${v.version}</option>`;
        toSelect.innerHTML += `<option value="${v.version}">v${v.version}</option>`;
      });

      fromSelect.value = versions[1]?.version;
      toSelect.value = versions[0]?.version;

      container.querySelector('#compare-btn')?.addEventListener('click', () => {
        const from = parseInt(fromSelect.value);
        const to = parseInt(toSelect.value);
        showDiff(container, versions, from, to);
      });
    }
  } catch (e) {
    container.querySelector('#version-list').innerHTML = `
      <div class="form-hint" style="text-align: center; padding: 40px;">Could not load version history</div>
    `;
  }
}

function showDiff(container, versions, fromVer, toVer) {
  const output = container.querySelector('#diff-output');
  if (!output) return;

  // Simple text-based diff for configs
  const fromConfig = versions.find(v => v.version === fromVer)?.config;
  const toConfig = versions.find(v => v.version === toVer)?.config;

  if (!fromConfig || !toConfig) {
    output.innerHTML = '<span class="form-hint">Select two different versions to compare</span>';
    return;
  }

  try {
    const fromObj = JSON.parse(fromConfig);
    const toObj = JSON.parse(toConfig);
    const diffLines = generateObjectDiff(fromObj, toObj, '');

    output.innerHTML = diffLines.length
      ? diffLines.join('\n')
      : '<span class="form-hint">No differences found</span>';
  } catch (e) {
    output.innerHTML = `<span class="diff-remove">Error parsing configs</span>`;
  }
}

function generateObjectDiff(from, to, prefix) {
  const lines = [];
  const allKeys = new Set([...Object.keys(from || {}), ...Object.keys(to || {})]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const fromVal = from?.[key];
    const toVal = to?.[key];

    if (JSON.stringify(fromVal) === JSON.stringify(toVal)) continue;

    if (fromVal === undefined) {
      lines.push(`<span class="diff-add">+ ${path}: ${JSON.stringify(toVal)}</span>`);
    } else if (toVal === undefined) {
      lines.push(`<span class="diff-remove">- ${path}: ${JSON.stringify(fromVal)}</span>`);
    } else if (typeof fromVal === 'object' && typeof toVal === 'object' && !Array.isArray(fromVal)) {
      lines.push(...generateObjectDiff(fromVal, toVal, path));
    } else {
      lines.push(`<span class="diff-remove">- ${path}: ${JSON.stringify(fromVal)}</span>`);
      lines.push(`<span class="diff-add">+ ${path}: ${JSON.stringify(toVal)}</span>`);
    }
  }

  return lines;
}
