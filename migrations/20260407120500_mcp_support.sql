CREATE TABLE IF NOT EXISTS mcp_servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  transport_type TEXT NOT NULL, -- 'stdio' or 'sse'
  connection_string TEXT NOT NULL, -- Command line for stdio, URL for sse
  status TEXT DEFAULT 'offline',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mcp_tools (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  schema JSON NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE
);
