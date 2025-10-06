# 🍄 CLOUDFLARE D1 MANUAL DATABASE SETUP

## 📋 SCHRITT-FÜR-SCHRITT ANLEITUNG

### **Voraussetzungen ✅**
- Du hast bereits eine **D1 Database** namens `mushroom-manager-production`
- Database ID: `5a556772-0b5e-4e70-82dd-ed2cc6f6232f`
- Cloudflare Pages ist bereits über GitHub verbunden

---

## **🎯 SCHRITT 1: CLOUDFLARE D1 DASHBOARD ÖFFNEN**

1. Gehe zu: **https://dash.cloudflare.com/d1**
2. Klicke auf deine Database: **`mushroom-manager-production`**
3. Wähle den Tab: **"Console"** (SQL Console)

---

## **🎯 SCHRITT 2: DATABASE SCHEMA ERSTELLEN**

Kopiere das **komplette Schema** aus dieser Datei und füge es in die **SQL Console** ein:

### **Schema-SQL (Alles auf einmal einfügen):**

```sql
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

-- Indizes für Performance
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
```

### **Ausführung:**
1. **Alles markieren** (Strg+A)
2. **Einfügen** in die SQL Console
3. **"Execute"** Button klicken
4. ✅ Du solltest sehen: **"8 tables created successfully"**

---

## **🎯 SCHRITT 3: TEST-DATEN EINFÜGEN**

Nach dem Schema, füge die **Seed-Daten** ein:

```sql
-- 🍄 Mushroom Manager - Seed Data
-- Basis-Daten für Entwicklung und Tests

-- Species (Pilzarten) - passt zum aktuellen Schema
INSERT OR IGNORE INTO species (id, scientific_name, common_name, category, is_active) VALUES
(1, 'Pleurotus ostreatus', 'Austernpilz', 'Pleurotus', 1),
(2, 'Lentinula edodes', 'Shiitake', 'Lentinula', 1),
(3, 'Hericium erinaceus', 'Igelstachelbart', 'Hericium', 1),
(4, 'Ganoderma lucidum', 'Reishi', 'Ganoderma', 1),
(5, 'Pleurotus eryngii', 'Kräuterseitling', 'Pleurotus', 1);

-- Dropdown Options für verschiedene Kategorien
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

-- Test-Protokolle
INSERT OR IGNORE INTO protocols (id, code, title, species_id, strain, origin, breeder, genetic_age, status, notes, created_at, updated_at, is_active) VALUES
(1, 'BP03', 'Black Pearl Austernpilz Test', 1, 'Black Pearl', 'Polen', 'Fungi Perfecti', 3, 'active', 'Test-Protokoll für dunkle Austernpilze', datetime('now'), datetime('now'), 1),
(2, 'SH01', 'Shiitake Erstzucht', 2, 'L54', 'Japan', 'Hokto Kinoko', 2, 'preparation', 'Erste Shiitake-Zucht im neuen Setup', datetime('now'), datetime('now'), 1);

-- Test-Phasen
INSERT OR IGNORE INTO protocol_phases (protocol_id, phase_type, phase_name, start_date, substrate_composition, substrate_weight_g, inoculation_method, container_type, temperature_min, temperature_max, humidity_min, humidity_max, notes, created_at) VALUES
(1, 'colonization', 'Durchwachsungsphase', date('now', '-14 days'), 'Masters Mix (50% Soja, 50% Buche)', 1000, 'liquid_culture', 'plastic_bag', 18, 22, 80, 90, 'Schnelle Durchwachsung erwartet', datetime('now')),
(1, 'fruiting', 'Erste Fruchtung', date('now', '-7 days'), NULL, NULL, NULL, 'grow_box', 15, 18, 85, 95, 'Erste Pins sichtbar', datetime('now'));

-- Test-Ernten
INSERT OR IGNORE INTO protocol_harvests (protocol_id, flush_number, harvest_date, weight_fresh_g, weight_dry_g, biological_efficiency, quality_rating, notes, days_to_harvest, created_at) VALUES
(1, 1, date('now', '-2 days'), 450, 45, 22.5, 4, 'Sehr gute erste Ernte mit schönen Clustern', 21, datetime('now'));
```

### **Ausführung:**
1. **Markieren & einfügen** in SQL Console
2. **"Execute"** Button klicken  
3. ✅ Du solltest sehen: **"XX rows inserted successfully"**

---

## **🎯 SCHRITT 4: DATEN VERIFIZIEREN**

Teste ob alles funktioniert:

```sql
-- Tabellen prüfen
SELECT name FROM sqlite_master WHERE type='table';

-- Daten prüfen
SELECT COUNT(*) as total_species FROM species;
SELECT COUNT(*) as total_protocols FROM protocols;
SELECT COUNT(*) as total_options FROM dropdown_options;
SELECT COUNT(*) as total_harvests FROM protocol_harvests;

-- Live-Statistiken wie in der App
SELECT 
  (SELECT COUNT(*) FROM protocols) as total_protocols,
  (SELECT COUNT(*) FROM protocols WHERE status = 'active') as active_protocols,
  (SELECT COUNT(*) FROM protocols WHERE status = 'completed') as completed_protocols,
  (SELECT COUNT(*) FROM protocol_harvests) as total_harvests,
  (SELECT COALESCE(SUM(weight_fresh_g)/1000, 0) FROM protocol_harvests) as total_yield_kg;
```

### **Erwartete Ergebnisse:**
- **8 Tabellen** erstellt
- **5 Species** (Pilzarten)
- **2 Protokolle** (BP03, SH01) 
- **40+ Dropdown Optionen**
- **1 Test-Ernte** (450g)

---

## **🎯 SCHRITT 5: LIVE-TEST**

Nach dem Setup gehe zu: **https://mushroom-manager.pages.dev**

**Das sollte funktionieren:**
- ✅ Dashboard lädt mit **Live-Statistiken aus D1**
- ✅ "Neues Protokoll" zeigt **Dropdown-Optionen aus D1**
- ✅ Protokoll-Liste zeigt **BP03 und SH01**
- ✅ BE%-Berechnungen funktionieren

---

## **🚨 TROUBLESHOOTING**

### **Problem: "Database not found"**
```sql
-- Prüfe Database-Bindung in wrangler.jsonc:
"d1_databases": [{
  "binding": "DB",
  "database_name": "mushroom-manager-production", 
  "database_id": "5a556772-0b5e-4e70-82dd-ed2cc6f6232f"
}]
```

### **Problem: "Tables empty"**
- SQL nochmal mit **REPLACE** statt **INSERT OR IGNORE**
- Oder einzeln testen mit: `SELECT * FROM species LIMIT 5;`

### **Problem: "API Errors"**  
- GitHub Pages Deploy kann 5-10 Minuten dauern
- Hard-Refresh: **Strg+F5** im Browser

---

## **✅ SUCCESS CHECKLIST**

- [ ] **8 Tabellen** erstellt (protocols, species, etc.)
- [ ] **5 Pilzarten** eingefügt  
- [ ] **40+ Dropdown-Optionen** verfügbar
- [ ] **2 Test-Protokolle** vorhanden
- [ ] **Website lädt** mit Live-Daten
- [ ] **Neues Protokoll** funktioniert
- [ ] **Statistiken** werden angezeigt

**Nach dem Setup hast du ein vollständig funktionales Mushroom Manager System! 🎉**