-- 🍄 Mushroom Manager - Complete Protocol Database Schema
-- Based on user's detailed protocol screenshots

-- Haupttabelle für Zuchtprotokolle
CREATE TABLE IF NOT EXISTS protocols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- z.B. "BP03", "SH01"
  title TEXT NOT NULL,
  
  -- Substratblock Bezeichnung
  species_id INTEGER NOT NULL,
  strain TEXT, -- z.B. "Black Pearl"
  origin TEXT, -- Herkunft
  breeder TEXT, -- Züchter/Händler
  genetic_age INTEGER, -- Alter der Vorkultur in Generationen
  
  -- Status und Zeiten
  status TEXT NOT NULL DEFAULT 'Vorbereitung',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Benutzer-Informationen
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  
  FOREIGN KEY (species_id) REFERENCES species(id)
);

-- Pilzarten-Tabelle (konfigurierbar)
CREATE TABLE IF NOT EXISTS species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scientific_name TEXT UNIQUE NOT NULL, -- z.B. "Pleurotus ostreatus"
  common_name TEXT, -- z.B. "Austernpilz"
  category TEXT, -- z.B. "Pleurotus", "Lentinula"
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Wachstumsphasen (Timeline)
CREATE TABLE IF NOT EXISTS protocol_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  phase_type TEXT NOT NULL, -- 'agar', 'liquid_culture', 'grain_spawn', 'substrate', 'fruiting'
  phase_name TEXT NOT NULL, -- z.B. "Myzel Wachstumsphase"
  
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  
  -- Umgebungsbedingungen
  temperature_min REAL,
  temperature_max REAL,
  humidity_min REAL, 
  humidity_max REAL,
  co2_ppm INTEGER,
  light_hours INTEGER,
  air_exchange TEXT, -- z.B. "8x die Stunde"
  
  -- Spezifische Parameter je Phase
  substrate_composition TEXT,
  substrate_weight_g INTEGER,
  inoculation_method TEXT,
  inoculation_amount TEXT,
  container_type TEXT,
  
  -- Status
  status TEXT DEFAULT 'planned', -- 'planned', 'active', 'completed', 'contaminated'
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE
);

-- Fotos/Dokumentation 
CREATE TABLE IF NOT EXISTS protocol_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  phase_id INTEGER,
  
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  taken_date DATETIME,
  
  -- Foto-Metadaten
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id) REFERENCES protocol_phases(id) ON DELETE SET NULL
);

-- Erträge (Flushes)
CREATE TABLE IF NOT EXISTS protocol_harvests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  flush_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  
  harvest_date DATE NOT NULL,
  weight_fresh_g REAL,
  weight_dry_g REAL,
  biological_efficiency REAL, -- BE% = (Fresh weight / Dry substrate weight) * 100
  
  -- Qualität
  quality_rating INTEGER, -- 1-5 Sterne
  notes TEXT,
  
  -- Dauer dieser Flush
  days_to_harvest INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE
);

-- Konfigurierbare Dropdown-Optionen
CREATE TABLE IF NOT EXISTS dropdown_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL, -- 'substrate_types', 'inoculation_methods', 'container_types', etc.
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(category, value)
);

-- Protokoll-Ereignisse (Timeline-Einträge)
CREATE TABLE IF NOT EXISTS protocol_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  phase_id INTEGER,
  
  event_date DATETIME NOT NULL,
  event_type TEXT NOT NULL, -- 'observation', 'action', 'contamination', 'milestone'
  title TEXT NOT NULL,
  description TEXT,
  
  -- Messwerte
  temperature REAL,
  humidity REAL,
  ph_value REAL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id) REFERENCES protocol_phases(id) ON DELETE SET NULL
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_protocols_species ON protocols(species_id);
CREATE INDEX IF NOT EXISTS idx_protocols_status ON protocols(status);
CREATE INDEX IF NOT EXISTS idx_protocol_phases_protocol ON protocol_phases(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_phases_type ON protocol_phases(phase_type);
CREATE INDEX IF NOT EXISTS idx_protocol_photos_protocol ON protocol_photos(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_harvests_protocol ON protocol_harvests(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_events_protocol ON protocol_events(protocol_id);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_category ON dropdown_options(category);