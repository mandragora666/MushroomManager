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