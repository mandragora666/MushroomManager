-- 🍄 Mushroom Manager - Seed Data für Dropdown-Optionen
-- Basierend auf Screenshots und Standard-Pilzzucht

-- Pilzarten
INSERT OR IGNORE INTO species (scientific_name, common_name, category) VALUES
  ('Pleurotus ostreatus', 'Austernpilz', 'Pleurotus'),
  ('Pleurotus ostreatus - Black Pearl', 'Black Pearl Austernpilz', 'Pleurotus'),
  ('Lentinula edodes', 'Shiitake', 'Lentinula'),
  ('Hericium erinaceus', 'Igelstachelbart', 'Hericium'),
  ('Ganoderma lucidum', 'Glänzender Lackporling', 'Ganoderma'),
  ('Agaricus bisporus', 'Champignon', 'Agaricus'),
  ('Trametes versicolor', 'Schmetterlingstramete', 'Trametes');

-- Substrat-Typen
INSERT OR IGNORE INTO dropdown_options (category, value, label, description, sort_order) VALUES
  ('substrate_types', 'masters_mix', 'Masters Mix', 'Sojabohnen + Buchensägemehl + Gips', 1),
  ('substrate_types', 'straw', 'Stroh', 'Weizenstroh oder Gerstenstroh', 2),
  ('substrate_types', 'hardwood_sawdust', 'Laubholzsägemehl', 'Buche, Eiche oder Birke', 3),
  ('substrate_types', 'coffee_grounds', 'Kaffeesatz', 'Gebrauchter Kaffeesatz', 4),
  ('substrate_types', 'cardboard', 'Wellpappe', 'Unbehandelte Wellpappe', 5),
  ('substrate_types', 'cotton_hulls', 'Baumwollsamenschalen', 'Supplemented cotton hulls', 6);

-- Inokulations-Methoden
INSERT OR IGNORE INTO dropdown_options (category, value, label, description, sort_order) VALUES
  ('inoculation_methods', 'liquid_culture', 'Flüssigkultur', 'Sterile Pilzmyzel-Suspension', 1),
  ('inoculation_methods', 'grain_spawn', 'Körnerbrut', 'Bewachsene Getreidekörner', 2),
  ('inoculation_methods', 'agar_wedge', 'Agar-Keil', 'Myzel von Petrischale', 3),
  ('inoculation_methods', 'dowels', 'Dübel', 'Impfdübel für Holz', 4),
  ('inoculation_methods', 'spore_print', 'Sporenabdruck', 'Direkte Sporenaussaat', 5);

-- Container-Typen
INSERT OR IGNORE INTO dropdown_options (category, value, label, description, sort_order) VALUES
  ('container_types', 'grow_bag', 'Grow Bag', 'Zuchtbeutel mit Filter', 1),
  ('container_types', 'monotub', 'Monotub', 'Große Plastikbox', 2),
  ('container_types', 'mason_jar', 'Einmachglas', 'Weithals-Einmachglas', 3),
  ('container_types', 'shotgun_chamber', 'Shotgun Fruiting Chamber', 'SGFC mit Löchern', 4),
  ('container_types', 'martha_tent', 'Martha Tent', 'Gewächshaus-Zelt', 5),
  ('container_types', 'log', 'Holzstamm', 'Natürlicher Holzstamm', 6);

-- Phasen-Typen
INSERT OR IGNORE INTO dropdown_options (category, value, label, description, sort_order) VALUES
  ('phase_types', 'agar', 'Agar-Kultur', 'Wachstum auf Nährboden', 1),
  ('phase_types', 'liquid_culture', 'Flüssigkultur', 'Vermehrung in Nährlösung', 2),
  ('phase_types', 'grain_spawn', 'Körnerbrut', 'Bewachsung der Getreidekörner', 3),
  ('phase_types', 'substrate_colonization', 'Substrat-Durchwachsung', 'Myzel durchzieht Substrat', 4),
  ('phase_types', 'fruiting', 'Fruchtung', 'Pilzbildung und Ernte', 5);

-- Qualitäts-Bewertungen
INSERT OR IGNORE INTO dropdown_options (category, value, label, description, sort_order) VALUES
  ('quality_ratings', '1', '★☆☆☆☆ Schlecht', 'Viele Probleme, niedrige Qualität', 1),
  ('quality_ratings', '2', '★★☆☆☆ Mäßig', 'Einige Probleme, akzeptable Qualität', 2),
  ('quality_ratings', '3', '★★★☆☆ Gut', 'Standard-Qualität, wenige Probleme', 3),
  ('quality_ratings', '4', '★★★★☆ Sehr gut', 'Hohe Qualität, sehr zufrieden', 4),
  ('quality_ratings', '5', '★★★★★ Exzellent', 'Perfekte Qualität, außergewöhnlich', 5);

-- Event-Typen für Timeline
INSERT OR IGNORE INTO dropdown_options (category, value, label, description, sort_order) VALUES
  ('event_types', 'inoculation', 'Inokulation', 'Beimpfung des Substrats', 1),
  ('event_types', 'contamination', 'Kontamination', 'Schimmel oder Bakterien entdeckt', 2),
  ('event_types', 'milestone', 'Meilenstein', 'Wichtiger Fortschritt', 3),
  ('event_types', 'observation', 'Beobachtung', 'Regelmäßige Dokumentation', 4),
  ('event_types', 'action', 'Maßnahme', 'Aktive Änderung durchgeführt', 5),
  ('event_types', 'harvest', 'Ernte', 'Pilze geerntet', 6);

-- Status-Optionen
INSERT OR IGNORE INTO dropdown_options (category, value, label, description, sort_order) VALUES
  ('protocol_status', 'preparation', 'Vorbereitung', 'Planung und Material-Beschaffung', 1),
  ('protocol_status', 'sterilization', 'Sterilisation', 'Substrat wird sterilisiert', 2),
  ('protocol_status', 'inoculation', 'Inokulation', 'Substrat wird beimpft', 3),
  ('protocol_status', 'colonization', 'Durchwachsung', 'Myzel wächst durch Substrat', 4),
  ('protocol_status', 'fruiting', 'Fruchtung', 'Pilze werden gebildet', 5),
  ('protocol_status', 'harvesting', 'Ernte', 'Pilze werden geerntet', 6),
  ('protocol_status', 'completed', 'Abgeschlossen', 'Projekt erfolgreich beendet', 7),
  ('protocol_status', 'contaminated', 'Kontaminiert', 'Projekt durch Schimmel beendet', 8),
  ('protocol_status', 'paused', 'Pausiert', 'Temporär unterbrochen', 9);