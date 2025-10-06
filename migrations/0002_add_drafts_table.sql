-- Add drafts table for protocol drafts
CREATE TABLE IF NOT EXISTS protocol_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  title TEXT,
  draft_data TEXT NOT NULL, -- JSON data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_protocol_drafts_code ON protocol_drafts(code);
CREATE INDEX IF NOT EXISTS idx_protocol_drafts_created ON protocol_drafts(created_at);