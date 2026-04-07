export async function renderEvaluator(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.5rem; font-weight: 800;">⚖️ Evaluation & Benchmarks</h2>
      <p class="form-hint">Run your agent against standardized test cases to measure performance.</p>
    </div>

    <div style="display: grid; grid-template-columns: 350px 1fr; gap: 24px; height: calc(100vh - 250px);">
       <!-- Test Case Sidebar -->
       <div class="card" style="display: flex; flex-direction: column; overflow: hidden;">
          <div style="padding: 16px; border-bottom: var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
             <div style="font-weight: 700;">Benchmark Suite</div>
             <button class="btn btn-outline btn-sm">➕ Add Case</button>
          </div>
          <div style="flex: 1; overflow-y: auto; padding: 12px;">
             <div class="case-item active" style="padding: 12px; border-radius: 8px; background: var(--bg-input); margin-bottom: 8px; cursor: pointer;">
                <div style="font-weight: 600; font-size: 0.85rem;">Login Bug Fix</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Type: Debugging · Expected: 0 error</div>
             </div>
             <div class="case-item" style="padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 8px; cursor: pointer;">
                <div style="font-weight: 600; font-size: 0.85rem;">SQL Schema Generation</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Type: Architecture · Expected: Normalization</div>
             </div>
             <div class="case-item" style="padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 8px; cursor: pointer;">
                <div style="font-weight: 600; font-size: 0.85rem;">Security Audit (Injection)</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Type: Security · Expected: Detect vuln</div>
             </div>
          </div>
          <div style="padding: 16px; border-top: var(--border-subtle);">
             <button class="btn btn-glow" style="width: 100%;" id="run-benchmark">🚀 Run All Tests</button>
          </div>
       </div>

       <!-- Test Results -->
       <div class="card" style="display: flex; flex-direction: column; overflow: hidden;">
          <div style="padding: 16px; border-bottom: var(--border-subtle);">
             <div style="font-weight: 700;">Live Execution Result</div>
          </div>
          <div id="benchmark-results" style="flex: 1; overflow-y: auto; padding: 24px; text-align: center;">
             <div style="margin-top: 100px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">⏱️</div>
                <h3 style="color: var(--text-secondary);">Select a case or run all to see results</h3>
                <p class="form-hint">Average score will be calculated based on agent output vs ground truth.</p>
             </div>
          </div>
       </div>
    </div>
  `;

  const resultsArea = container.querySelector('#benchmark-results');
  const runBtn = container.querySelector('#run-benchmark');

  runBtn?.addEventListener('click', async () => {
     runBtn.disabled = true;
     runBtn.textContent = '⌛ Running...';
     resultsArea.innerHTML = `
        <div style="margin-top: 100px;">
           <div class="loader" style="margin: 0 auto 20px auto;"></div>
           <h3>Evaluating Agent Performance</h3>
           <p class="form-hint">Testing consistency, accuracy, and tool-use efficiency.</p>
        </div>
     `;

     // Simulate running tests
     await new Promise(r => setTimeout(r, 2000));

     resultsArea.innerHTML = `
        <div style="text-align: left;">
           <div style="display: flex; justify-content: space-between; align-items: end; margin-bottom: 32px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
              <div>
                 <div style="font-size: 0.8rem; color: var(--text-secondary);">OVERALL SCORE</div>
                 <div style="font-size: 3rem; font-weight: 900; color: var(--neon-cyan);">8.4<span style="font-size: 0.4em; color: var(--text-muted);">/10</span></div>
              </div>
              <div style="text-align: right;">
                 <div style="font-size: 0.8rem; color: var(--text-secondary);">TESTS PASSED</div>
                 <div style="font-size: 1.5rem; font-weight: 700;">12 / 15</div>
              </div>
           </div>

           <h4 style="margin-bottom: 16px;">Detailed Breakdown</h4>
           <div class="card" style="padding: 16px; margin-bottom: 12px; background: rgba(0,255,242,0.05); border-color: var(--neon-cyan);">
              <div style="display: flex; justify-content: space-between;">
                 <div style="font-weight: 700;">Accuracy</div>
                 <div style="color: var(--neon-cyan);">90%</div>
              </div>
              <div class="progress-bar" style="margin-top: 8px; height: 6px;"><div class="progress-fill" style="width: 90%; background: var(--neon-cyan);"></div></div>
           </div>

           <div class="card" style="padding: 16px; margin-bottom: 12px; background: rgba(255,0,217,0.05); border-color: var(--neon-pink);">
              <div style="display: flex; justify-content: space-between;">
                 <div style="font-weight: 700;">Hiring Potential</div>
                 <div style="color: var(--neon-pink);">Premium</div>
              </div>
              <div class="progress-bar" style="margin-top: 8px; height: 6px;"><div class="progress-fill" style="width: 85%; background: var(--neon-pink);"></div></div>
           </div>
           
           <div class="card" style="padding: 16px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between;">
                 <div style="font-weight: 700;">Tool Reliability</div>
                 <div>72%</div>
              </div>
              <div class="progress-bar" style="margin-top: 8px; height: 6px;"><div class="progress-fill" style="width: 72%;"></div></div>
           </div>
        </div>
     `;
     runBtn.disabled = false;
     runBtn.textContent = '🚀 Run All Tests';
  });
}
