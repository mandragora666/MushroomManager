CREATE TABLE IF NOT EXISTS protocols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  species_id INTEGER NOT NULL,
  strain TEXT,
  origin TEXT,
  breeder TEXT,
  genetic_age INTEGER,
  status TEXT NOT NULL DEFAULT 'Vorbereitung',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (species_id) REFERENCES species(id)
);

CREATE TABLE IF NOT EXISTS species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scientific_name TEXT UNIQUE NOT NULL,
  common_name TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS protocol_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  phase_type TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  temperature_min REAL,
  temperature_max REAL,
  humidity_min REAL, 
  humidity_max REAL,
  co2_ppm INTEGER,
  light_hours INTEGER,
  air_exchange TEXT,
  substrate_composition TEXT,
  substrate_weight_g INTEGER,
  inoculation_method TEXT,
  inoculation_amount TEXT,
  container_type TEXT,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS protocol_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  phase_id INTEGER,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  taken_date DATETIME,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id) REFERENCES protocol_phases(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS protocol_harvests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  flush_number INTEGER NOT NULL,
  harvest_date DATE NOT NULL,
  weight_fresh_g REAL,
  weight_dry_g REAL,
  biological_efficiency REAL,
  quality_rating INTEGER,
  notes TEXT,
  days_to_harvest INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dropdown_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, value)
);

CREATE TABLE IF NOT EXISTS protocol_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  phase_id INTEGER,
  event_date DATETIME NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  temperature REAL,
  humidity REAL,
  ph_value REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id) REFERENCES protocol_phases(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS protocol_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  title TEXT,
  draft_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_protocols_species ON protocols(species_id);
CREATE INDEX IF NOT EXISTS idx_protocols_status ON protocols(status);
CREATE INDEX IF NOT EXISTS idx_protocol_phases_protocol ON protocol_phases(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_phases_type ON protocol_phases(phase_type);
CREATE INDEX IF NOT EXISTS idx_protocol_photos_protocol ON protocol_photos(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_harvests_protocol ON protocol_harvests(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_events_protocol ON protocol_events(protocol_id);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_category ON dropdown_options(category);
CREATE INDEX IF NOT EXISTS idx_protocol_drafts_code ON protocol_drafts(code);
CREATE INDEX IF NOT EXISTS idx_protocol_drafts_created ON protocol_drafts(created_at);