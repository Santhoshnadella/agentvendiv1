# Architecture Decision Records
## 1. Dual-Database Layer
Unified the sqlite vs postgres adapter to support WAL reads locally, but standard parameterized connection pool handling via pg module in production. All DB transactions wrapped in custom handler to accommodate both sync/async sqlite discrepancies.

## 2. Model Context Protocol Integration 
Delegating external tools using actual JSON-RPC via `@modelcontextprotocol/sdk`. `AgentRuntime` intercepts missing local tools and queries `mcp_tools` mapping requests via the single active WS transport to Stdio/SSE binaries dynamically.

## 3. Remote A2A 
AgentCard exposes capabilities dynamically via REST API. Client implementations fetch endpoint config asynchronously ensuring forward compatibility with A2A protocol shifts. Subprocesses execute remote task payloads natively against the host LLM without exposing execution details natively holding isolation limits intact.

## 4. Time Travel Mutability
State tree is strictly append only. `agent_snapshots` logs the diff output before the `callLLM()` logic to ensure 100% accurate context re-hydration. Edits spawn new branches via `parent_run_id` simulating deterministic git-style timeline branches rather than unpredictable in-place manipulations.

## 5. WebSockets
Leveraged event emitters passing messages from `wsManager` to the background `AgentRuntime` instances safely allowing zero-latency Human In The Loop approval gating bypassing standard REST polling loop checks.

## 6. VM2 Plugins
Isolating random node tools from breaking the core node loop. Exposes isolated standard ES modules via dynamic string conversion inside the `vm2` sandbox to restrict I/O filesystem damage or unauthorized credential access beyond the approved `agentvendi-plugin-*` prefix scopes.

## 7. Audit & Billing Features
Tracking tokens continuously to `agent_runs` directly appended per run finish block. External aggregation mapped dynamically upon request querying `activity_log` grouping directly to enforce multi-tenant enterprise isolation without inflating run times.
