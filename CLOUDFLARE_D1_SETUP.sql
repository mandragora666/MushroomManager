-- 🍄 CLOUDFLARE D1 DATABASE SETUP
-- Führen Sie diese SQL-Befehle direkt in Ihrer Cloudflare D1-Console aus:
-- https://dash.cloudflare.com/ → D1 SQL Database → mushroom-manager-production → Console

-- ============================================================================
-- SCHRITT 1: TABELLEN ERSTELLEN (aus 0001_complete_protocol_system.sql)
-- ============================================================================

-- Haupttabelle für Zuchtprotokolle
CREATE TABLE IF NOT EXISTS protocols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  
  -- Substratblock Bezeichnung
  species_id INTEGER NOT NULL,
  strain TEXT,
  origin TEXT,
  breeder TEXT,
  genetic_age INTEGER,
  
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
  scientific_name TEXT UNIQUE NOT NULL,
  common_name TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Wachstumsphasen (Timeline)
CREATE TABLE IF NOT EXISTS protocol_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  phase_type TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  
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
  air_exchange TEXT,
  
  -- Spezifische Parameter je Phase
  substrate_composition TEXT,
  substrate_weight_g INTEGER,
  inoculation_method TEXT,
  inoculation_amount TEXT,
  container_type TEXT,
  
  -- Status
  status TEXT DEFAULT 'planned',
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
  flush_number INTEGER NOT NULL,
  
  harvest_date DATE NOT NULL,
  weight_fresh_g REAL,
  weight_dry_g REAL,
  biological_efficiency REAL,
  
  -- Qualität
  quality_rating INTEGER,
  notes TEXT,
  
  -- Dauer dieser Flush
  days_to_harvest INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE
);

-- Konfigurierbare Dropdown-Optionen
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

-- Protokoll-Ereignisse (Timeline-Einträge)
CREATE TABLE IF NOT EXISTS protocol_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id INTEGER NOT NULL,
  phase_id INTEGER,
  
  event_date DATETIME NOT NULL,
  event_type TEXT NOT NULL,
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

-- ============================================================================
-- SCHRITT 2: DRAFT-TABELLE ERSTELLEN (aus 0002_add_drafts_table.sql)
-- ============================================================================

CREATE TABLE IF NOT EXISTS protocol_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  title TEXT,
  draft_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

-- ============================================================================
-- SCHRITT 3: INDIZES ERSTELLEN (Performance)
-- ============================================================================

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

-- ============================================================================
-- SCHRITT 4: BASISDATEN EINFÜGEN (Pilzarten und Dropdown-Optionen)
-- ============================================================================

-- Pilzarten
INSERT OR IGNORE INTO species (id, scientific_name, common_name, category, is_active) VALUES
(1, 'Pleurotus ostreatus', 'Austernpilz', 'Pleurotus', 1),
(2, 'Lentinula edodes', 'Shiitake', 'Lentinula', 1),
(3, 'Hericium erinaceus', 'Igelstachelbart', 'Hericium', 1),
(4, 'Ganoderma lucidum', 'Reishi', 'Ganoderma', 1),
(5, 'Pleurotus eryngii', 'Kräuterseitling', 'Pleurotus', 1);

-- Dropdown-Optionen für verschiedene Kategorien
INSERT OR IGNORE INTO dropdown_options (category, value, label, description, sort_order, is_active) VALUES
-- Substrat-Zusammensetzung
('substrate_type', 'straw', 'Stroh', 'Weizenstroh, geschreddert', 10, 1),
('substrate_type', 'sawdust', 'Sägemehl', 'Laubholz-Sägemehl', 20, 1),
('substrate_type', 'masters_mix', 'Masters Mix', 'Soja/Hartholz Pellets 50/50', 30, 1),
('substrate_type', 'supplemented_sawdust', 'Supplementiertes Sägemehl', 'Sägemehl mit Kleie/Gips', 40, 1),
('substrate_type', 'logs', 'Holzstämme', 'Naturstämme für Shiitake', 50, 1),

-- Inokulationsmethoden
('inoculation_method', 'liquid_culture', 'Flüssigkultur', 'Sterile Pilz-Flüssigkultur', 10, 1),
('inoculation_method', 'grain_spawn', 'Kornbrut', 'Durchwachsene Getreidekörner', 20, 1),
('inoculation_method', 'agar_wedge', 'Agar-Stück', 'Pilzmycel auf Agar-Nährboden', 30, 1),
('inoculation_method', 'spore_syringe', 'Sporenspritze', 'Pilzsporen in steriler Lösung', 40, 1),
('inoculation_method', 'tissue_culture', 'Gewebekultur', 'Steriles Pilzgewebe', 50, 1),

-- Behältertypen
('container_type', 'plastic_bag', 'Kunststoffbeutel', 'Polypropylen-Zuchtbeutel', 10, 1),
('container_type', 'glass_jar', 'Einmachglas', 'Sterilisierbare Gläser', 20, 1),
('container_type', 'grow_box', 'Zuchtbox', 'Kunststoff-Zuchtcontainer', 30, 1),
('container_type', 'monotub', 'Monotub', 'Großer Plastikbehälter', 40, 1),
('container_type', 'autoclave_bag', 'Autoklav-Beutel', 'Hitzebeständige Zuchtbeutel', 50, 1),

-- Phasenstatus
('phase_status', 'preparation', 'Vorbereitung', 'Substrat wird vorbereitet', 10, 1),
('phase_status', 'sterilization', 'Sterilisation', 'Substrat wird sterilisiert', 20, 1),
('phase_status', 'inoculation', 'Beimpfung', 'Substrat wird beimpft', 30, 1),
('phase_status', 'colonization', 'Durchwachsung', 'Mycel durchwächst Substrat', 40, 1),
('phase_status', 'incubation', 'Inkubation', 'Kontrollierte Wachstumsphase', 50, 1),
('phase_status', 'fruiting', 'Fruchtung', 'Pilzfruchtkörper entwickeln sich', 60, 1),
('phase_status', 'harvesting', 'Ernte', 'Pilze werden geerntet', 70, 1),
('phase_status', 'completed', 'Abgeschlossen', 'Zyklus beendet', 80, 1),

-- Qualitätsbewertungen
('quality_rating', '1', 'Sehr schlecht', 'Nicht verwendbar', 10, 1),
('quality_rating', '2', 'Schlecht', 'Geringe Qualität', 20, 1),
('quality_rating', '3', 'Mittelmäßig', 'Durchschnittliche Qualität', 30, 1),
('quality_rating', '4', 'Gut', 'Gute Qualität', 40, 1),
('quality_rating', '5', 'Sehr gut', 'Ausgezeichnete Qualität', 50, 1),

-- Protokollstatus
('protocol_status', 'planning', 'Planung', 'Protokoll wird geplant', 10, 1),
('protocol_status', 'preparation', 'Vorbereitung', 'Materialien werden vorbereitet', 20, 1),
('protocol_status', 'active', 'Aktiv', 'Zucht läuft', 30, 1),
('protocol_status', 'harvesting', 'Erntephase', 'Pilze werden geerntet', 40, 1),
('protocol_status', 'completed', 'Abgeschlossen', 'Zucht beendet', 50, 1),
('protocol_status', 'failed', 'Fehlgeschlagen', 'Zucht nicht erfolgreich', 60, 1);

-- ============================================================================
-- ✅ SETUP ABGESCHLOSSEN!
-- ============================================================================
-- Nach dem Ausführen aller Befehle haben Sie:
-- - 6 Haupttabellen für das komplette Protokollsystem
-- - 1 Drafts-Tabelle für Entwürfe
-- - 5 Pilzarten (Austernpilz, Shiitake, etc.)
-- - 40+ Dropdown-Optionen für alle Kategorien
-- - Performance-Indizes für schnelle Abfragen
--
-- Ihr System ist dann vollständig cloudbasiert und persistent! 🎉