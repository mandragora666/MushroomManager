# 🍄 Mushroom Manager - Zuchtprotokoll Focus

## Projekt Übersicht
- **Name**: Mushroom Manager (Neue Version)
- **Ziel**: Fokussierte Pilzzucht-Protokoll Verwaltung
- **Current Focus**: NUR Zuchtprotokoll-System (Phase 1)

## URLs
- **Entwicklung (Sandbox)**: https://3000-ii3xs4tz50s9at8onnhm2-6532622b.e2b.dev
- **GitHub Repository**: https://github.com/mandragora666/MushroomManager
- **Produktion**: Wird nach Cloudflare Deployment verfügbar

## Aktuell implementierte Features ✅

### Dashboard & Navigation
- ✅ **Mobile-First Design** mit Glassmorphism-Effekten (übernommen vom alten Projekt)
- ✅ **Bottom Navigation** für optimale mobile Bedienung
- ✅ **Responsive Dashboard** mit Protokoll-Statistiken
- ✅ **Dark/Light Mode** Toggle
- ✅ **Sticky Header** mit Theme-Switch

### Zuchtprotokoll-System (Kern-Feature)
- ✅ **Protokoll-Dashboard** mit aktiven Zuchtprojekten
- ✅ **Protokoll-Liste** mit Status-Anzeige und Filterung
- ✅ **Mock-Daten** für 2 Beispiel-Protokolle:
  - BP03 - Black Pearl Austernpilz (Fruchtung)  
  - SH01 - Shiitake Zucht (Durchwachsung)
- ✅ **Status-System** (Durchwachsung, Fruchtung, etc.)
- ✅ **Mobile-optimierte Protokoll-Cards**

### API-Struktur (bereit für D1 Database)
- ✅ **GET /api/protocols** - Alle Protokolle abrufen
- ✅ **GET /api/protocols/:id** - Einzelnes Protokoll abrufen
- ⏳ **POST /api/protocols** - Neues Protokoll erstellen (in Entwicklung)
- ⏳ **PUT /api/protocols/:id** - Protokoll bearbeiten (in Entwicklung)
- ⏳ **DELETE /api/protocols/:id** - Protokoll löschen (in Entwicklung)

## Nächste Entwicklungsschritte (Phase 1 Fortsetzung)

### 🚧 Aktuell in Arbeit
1. **Cloudflare Pages Deployment** - Live-Version bereitstellen
2. **GitHub Integration** - Code auf neues Repository pushen
3. **Protokoll-Formular** - Neues Zuchtprotokoll erstellen
4. **D1 Database Setup** - Mock-Daten durch echte Datenbank ersetzen

### 📋 Noch zu implementieren (Zuchtprotokoll-Focus)
- **Protokoll-Erstellung**: Vollständiges Formular (Pilzart, Substrat, Inokulation)
- **Protokoll-Bearbeitung**: Bestehende Protokolle editieren
- **Timeline-System**: Wachstumsphasen und Einträge dokumentieren  
- **Foto-Upload**: Bis zu 10 Bilder pro Protokoll
- **Flexible Datenstrukturen**: Pilzarten, Substratrezepte, Inokulationsmethoden
- **Wachstumsphasen-Tracking**: Detaillierte Bedingungen (Temp/Feuchtigkeit)

## Datenmodell (Vorbereitet für D1 Database)

### Haupt-Entitäten
```sql
-- Protokolle (Haupttabelle)
protocols (id, title, species_id, substrate_recipe_id, inoculation_method_id, 
          start_date, status, current_phase, notes, photos, created_at)

-- Protokoll-Einträge (Timeline)  
protocol_entries (id, protocol_id, timestamp, entry_type, phase_id, 
                 temperature, humidity, notes, photos)

-- Pilzarten (flexibel erweiterbar)
mushroom_species (id, name, scientific_name, difficulty, temp_min, temp_max, 
                 humidity_min, humidity_max, notes)

-- Substratrezepte
substrate_recipes (id, name, total_weight, sterilization_method, notes)
substrate_ingredients (id, recipe_id, ingredient_name, amount, unit, ratio)

-- Inokulationsmethoden  
inoculation_methods (id, name, steps, notes, recommended_conditions)

-- Wachstumsphasen
growth_phases (id, name, temp_min, temp_max, humidity_min, humidity_max, 
              duration_days, description)
```

## Tech Stack

### Backend
- **Framework**: Hono 4.x (Edge-optimiert für Cloudflare Workers)
- **Runtime**: Cloudflare Workers (Edge Computing)
- **Database**: Cloudflare D1 (SQLite, global distributed)
- **File Storage**: Supabase Storage (für Foto-Upload)

### Frontend  
- **Styling**: Tailwind CSS + Custom Glassmorphism Design
- **JavaScript**: Vanilla JS mit API-Integration
- **Design**: Mobile-First, Bottom Navigation
- **Theme**: Dark/Light Mode mit localStorage

### Development & Deployment
- **Development**: Wrangler + PM2 (Sandbox)
- **Build**: Vite für optimierte Bundles
- **Deployment**: Cloudflare Pages
- **Versionskontrolle**: Git + GitHub

## Development Commands

### Lokale Entwicklung (Sandbox)
```bash
# Build erstellen
npm run build

# Development Server starten (PM2)
pm2 start ecosystem.config.cjs

# Status prüfen
pm2 logs mushroom-manager --nostream

# Service testen
curl http://localhost:3000
```

### GitHub & Deployment
```bash
# Änderungen committen
git add . && git commit -m "Feature description"

# Zu GitHub pushen (nach Setup)
git push origin main

# Cloudflare Pages deployen
npm run deploy:prod
```

## Mobile-First Design Prinzipien

### Navigation
- **Bottom Navigation Bar** - Hauptnavigation am unteren Bildschirmrand
- **Sticky Header** - Titel und Theme-Toggle immer sichtbar
- **Touch-friendly** - Große Buttons, ausreichend Abstände

### Glassmorphism Design
- **Transparente Cards** mit Backdrop-Filter
- **Weiche Schatten** und abgerundete Ecken
- **Gradient Hintergründe** für visuellen Tiefeneffekt
- **Hover-Effekte** mit sanften Übergängen

### Responsive Breakpoints
- **Mobile (< 768px)**: Bottom Navigation, einspaltig
- **Tablet (768px - 1024px)**: Erweiterte Card-Layouts  
- **Desktop (> 1024px)**: Sidebar-Navigation (geplant für Phase 2)

## Benutzerhandbuch

### Dashboard verwenden
1. **Startseite** zeigt aktuelle Protokoll-Statistiken
2. **"+ Neues Zuchtprotokoll"** Button für neue Projekte
3. **Protokoll-Cards** zeigen Status, Phase, Bedingungen
4. **"Details →"** Button für vollständige Protokoll-Ansicht

### Navigation
- **🏠 Dashboard** - Übersicht und Statistiken
- **📋 Protokolle** - Alle Zuchtprojekte anzeigen
- **➕ Neu** - Neues Protokoll erstellen
- **📚 Wiki** - Pilz-Wissensdatenbank (Phase 2)

### Theme wechseln
- **🌙/☀️ Button** oben rechts für Dark/Light Mode
- **Automatische Speicherung** in localStorage
- **Sanfte Übergänge** zwischen Modi

## Deployment Status

### Cloudflare Integration
- ✅ **Wrangler CLI** konfiguriert und authentifiziert
- ✅ **API-Tokens** funktionsfähig
- ✅ **Build-Pipeline** bereit für Deployment
- ⏳ **Pages-Projekt** wird erstellt (nächster Schritt)

### GitHub Repository
- ✅ **Repository erstellt**: mandragora666/MushroomManager
- ✅ **Lokaler Git** initialisiert mit Commits
- ⏳ **Push zu GitHub** (nächster Schritt)

## Phase 2 - Geplante Erweiterungen

**NUR nach erfolgreichem Abschluss von Phase 1:**
- Inventarverwaltung (Materialien, Kulturen)
- Wiki-System (Pilzsorten, Anleitungen)
- Substrat- und Tinkturberechner
- Benutzerauthentifizierung
- QR-Code System für Zuchtbeutel
- Erweiterte Statistiken und Reports

---

**Entwicklungsphilosophie**: Ein Feature nach dem anderen, vollständig funktionsfähig, bevor das nächste beginnt.

**Letzte Aktualisierung**: 2025-10-04  
**Version**: 1.0.0-protocol-focus  
**Status**: ✅ Zuchtprotokoll-Basis läuft, bereit für Cloudflare Deployment