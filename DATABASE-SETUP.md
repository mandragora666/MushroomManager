# 🗄️ D1 Database Setup für Mushroom Manager

## 🚀 Schnell-Setup (Local Development)

### **1. D1 Database erstellen:**
```bash
# Falls noch nicht geschehen, erstelle die Produktions-Database
npm run db:create

# Kopiere die database_id aus der Ausgabe und trage sie in wrangler.toml ein
```

### **2. Migrations ausführen:**
```bash
# Lokale Entwicklungs-Database erstellen und Tabellen anlegen
npm run db:migrate:local

# Seed-Daten laden (Dropdown-Optionen, Pilzarten, etc.)
npm run db:seed:local
```

### **3. Development Server mit D1 starten:**
```bash
# Sandbox Development mit lokaler D1
npm run build
npm run dev:d1

# Oder mit PM2:
pm2 delete all || true
pm2 start ecosystem.config.cjs
```

### **4. Database testen:**
```bash
# Direkt auf lokale Database zugreifen
npm run db:console:local

# Beispiel-Queries:
# SELECT * FROM species;
# SELECT * FROM dropdown_options WHERE category = 'substrate_types';
# SELECT * FROM protocols;
```

---

## 📊 Database Schema Übersicht

### **Haupt-Tabellen:**
- **`protocols`** - Zuchtprotokolle (BP03, SH01, etc.)
- **`species`** - Pilzarten (Pleurotus, Shiitake, etc.)
- **`protocol_phases`** - Wachstumsphasen (Agar → Körnerbrut → Substrat → Fruchtung)
- **`protocol_harvests`** - Erträge pro Flush
- **`protocol_photos`** - Foto-Dokumentation
- **`dropdown_options`** - Konfigurierbare Auswahlfelder

### **Konfigurierbare Dropdown-Kategorien:**
- `substrate_types` - Masters Mix, Stroh, Laubholz, etc.
- `inoculation_methods` - Flüssigkultur, Körnerbrut, Agar, etc.
- `container_types` - Grow Bag, Monotub, Mason Jar, etc.
- `phase_types` - Agar, Liquid Culture, Grain Spawn, etc.
- `protocol_status` - Vorbereitung, Inokulation, Durchwachsung, etc.
- `event_types` - Beobachtung, Kontamination, Meilenstein, etc.

---

## 🎯 API-Endpunkte (bereits implementiert)

### **Protokolle:**
- `GET /api/protocols` - Alle Protokolle
- `GET /api/protocols/:id` - Einzelnes Protokoll mit Phasen & Ernten
- `POST /api/protocols` - Neues Protokoll erstellen

### **Dropdown-Optionen:**
- `GET /api/dropdown/:category` - Optionen für Kategorie laden
- `POST /api/dropdown/:category` - Neue Option hinzufügen
- `DELETE /api/dropdown/:category/:id` - Option löschen

### **Pilzarten:**
- `GET /api/species` - Alle verfügbaren Pilzarten

### **Statistiken:**
- `GET /api/stats` - Dashboard-Statistiken

---

## 🔄 Fallback-System

**Das System funktioniert sowohl mit als auch ohne Database:**

### **Mit D1 Database:**
- Vollständige Funktionalität
- Persistente Datenspeicherung
- Konfigurierbare Dropdown-Felder
- Timeline und Foto-Dokumentation

### **Ohne Database (Fallback):**
- Mock-Daten für Entwicklung
- Alle UI-Funktionen verfügbar
- Keine persistente Speicherung
- Vordefinierte Dropdown-Optionen

---

## 🛠️ Produktions-Deployment

### **Für Live-Deployment:**
```bash
# 1. Produktions-Database erstellen (falls nicht vorhanden)
npx wrangler d1 create mushroom-manager-production

# 2. Database-ID in wrangler.toml eintragen
# 3. Migrations in Produktion ausführen
npm run db:migrate:prod

# 4. Seed-Daten in Produktion laden
npm run db:seed:prod

# 5. Normale Deployment-Pipeline
git add . && git commit -m "Add D1 database integration"
git push origin main
```

### **Cloudflare Pages Environment:**
- Database wird automatisch gebunden über `wrangler.toml`
- Keine weiteren Konfigurationen nötig
- Auto-Deploy funktioniert mit D1

---

## ✅ Nächste Schritte

Nach Database-Setup:
1. **Test der APIs** - Alle Endpunkte funktionsfähig
2. **Neues Protokoll-Formular** - Basierend auf Screenshots umbauen
3. **Phasen-Timeline** - Wachstumsdokumentation
4. **Foto-Upload** - R2 Integration
5. **Dropdown-Management** - Admin-Interface

**Das Database-System ist jetzt production-ready! 🚀**