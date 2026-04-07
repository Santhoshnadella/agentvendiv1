CREATE TABLE IF NOT EXISTS a2a_tasks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  run_id TEXT, -- nullable until run starts
  client_id TEXT NOT NULL,
  status TEXT DEFAULT 'submitted', -- submitted, working, input-required, completed, failed, canceled
  payload JSON,
  artifact_data JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (run_id) REFERENCES agent_runs(id)
);
