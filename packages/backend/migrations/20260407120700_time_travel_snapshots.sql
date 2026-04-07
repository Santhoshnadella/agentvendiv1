CREATE TABLE IF NOT EXISTS agent_snapshots (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  state JSON NOT NULL,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
);

ALTER TABLE agent_runs ADD COLUMN parent_run_id TEXT REFERENCES agent_runs(id);

ALTER TABLE agent_runs ADD COLUMN forked_from_step INTEGER;
