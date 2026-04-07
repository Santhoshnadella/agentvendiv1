# API Changes

## Phase 1
- `GET /health/db` - Returns DB health check and connected database type.

## Phase 2 (MCP)
- `POST /api/mcp/servers` - Adds an MCP server and triggers tool sync.
- `GET /api/mcp/servers` - Returns active servers and available MCP tools.
- `DELETE /api/mcp/servers/:id` - Disconnects and removes an MCP server.
- `POST /api/mcp/servers/:id/sync` - Reconnects and syncs tools.

## Phase 3 (A2A)
- `GET /.well-known/agent.json` - Exposes A2A AgentCard.
- `POST /a2a/tasks/send` - Remote agent ingestion point.
- `POST /a2a/tasks/get` - Fetch result for remote tasks.
- `POST /a2a/tasks/cancel` - Terminate remote task.

## Phase 4 (Time-Travel)
- `GET /api/runtime/runs/:id/timeline` - Get steps array for visualization.
- `POST /api/runtime/runs/:id/fork` - Edit step and resume a new run path.
- `GET /api/runtime/runs/:id/state-at/:step` - Look at full state dumped to `agent_snapshots` table.
- `POST /api/runtime/runs/compare` - Compare diff between two execution states.

## Phase 5 (WebSocket)
- Upgrade `ws://localhost:3001/ws?token=JWT` for connection.
- Message Format: `{ action: 'subscribe'|'hitl_response', room: 'run_id', payload: {} }`

## Phase 6 (Plugins)
- `GET /api/plugins` - List VM2-sandboxed NPM plugins.
- `POST /api/plugins/install` - Installs a standard `agentvendi-plugin-*`

## Phase 7 (Enterprise)
- `GET /api/billing/reports` - Fetch total monthly burn cost split by user and agent.
- `GET /api/billing/export.csv` - Export raw run list and token consumption.
