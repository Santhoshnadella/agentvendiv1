CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSON
);

ALTER TABLE users ADD COLUMN permissions JSON;
