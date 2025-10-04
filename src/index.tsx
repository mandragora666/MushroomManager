import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

app.use(renderer)

// Mock Data für Development (später durch D1 Database ersetzt)
const mockProtocols = [
  {
    id: 1,
    title: "BP03 - Black Pearl Austernpilz",
    species: "Pleurotus ostreatus - Hybrid",
    substrate: "Masters Mix (500g Soja + 500g Buche)",
    inoculation: "Flüssigkultur",
    status: "Fruchtung",
    startDate: "2024-09-15",
    phase: "Erste Pins sichtbar",
    temperature: "17-20°C",
    humidity: "80-90%",
    photos: []
  },
  {
    id: 2,
    title: "SH01 - Shiitake Zucht",
    species: "Lentinula edodes",
    substrate: "Laubholzspäne mit Kleie",
    inoculation: "Kornbrut",
    status: "Durchwachsung",
    startDate: "2024-09-20",
    phase: "Substrat durchwachsen",
    temperature: "22-25°C",
    humidity: "70-80%",
    photos: []
  }
];

// API Routes
app.get('/api/hello', (c) => {
  return c.json({ 
    message: 'Willkommen beim Mushroom Manager!',
    version: '1.0.0-protocol-focus',
    features: ['Zuchtprotokolle', 'Mobile-First Design', 'Glassmorphism'],
    status: 'online'
  })
})

// API Routes - Zuchtprotokolle
app.get('/api/protocols', (c) => {
  return c.json({
    success: true,
    protocols: mockProtocols,
    count: mockProtocols.length
  })
})

app.get('/api/protocols/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const protocol = mockProtocols.find(p => p.id === id);
  
  if (!protocol) {
    return c.json({ success: false, error: 'Protokoll nicht gefunden' }, 404);
  }
  
  return c.json({ success: true, protocol });
})

// Neues Protokoll erstellen (API Endpoint)
app.post('/api/protocols', async (c) => {
  try {
    const data = await c.req.json();
    
    // Validierung der Pflichtfelder
    const requiredFields = ['title', 'species', 'startDate', 'status', 'substrate', 'inoculation', 'temperature', 'humidity'];
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === '') {
        return c.json({
          success: false,
          error: `Pflichtfeld '${field}' fehlt oder ist leer`,
          field
        }, 400);
      }
    }
    
    // Neues Protokoll erstellen
    const newProtocol = {
      id: mockProtocols.length + 1,
      title: data.title.trim(),
      species: data.species.trim(),
      substrate: data.substrate.trim(),
      inoculation: data.inoculation.trim(),
      status: data.status.trim(),
      startDate: data.startDate,
      phase: data.status.trim(), // Setze Phase initial auf Status
      temperature: data.temperature.trim(),
      humidity: data.humidity.trim(),
      // Optional fields
      substrateWeight: data.substrateWeight ? parseInt(data.substrateWeight) : null,
      inoculationAmount: data.inoculationAmount?.trim() || '',
      airflow: data.airflow?.trim() || '',
      lighting: data.lighting?.trim() || '',
      container: data.container?.trim() || '',
      containerSize: data.containerSize?.trim() || '',
      location: data.location?.trim() || '',
      expectedYield: data.expectedYield ? parseInt(data.expectedYield) : null,
      notes: data.notes?.trim() || '',
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Zu Mock-Daten hinzufügen (später: zu D1 Database speichern)
    mockProtocols.push(newProtocol);
    
    return c.json({
      success: true,
      protocol: newProtocol,
      message: 'Protokoll erfolgreich erstellt!'
    }, 201);
    
  } catch (error) {
    console.error('Fehler beim Erstellen des Protokolls:', error);
    return c.json({
      success: false,
      error: 'Server-Fehler beim Speichern des Protokolls'
    }, 500);
  }
})

// Main Dashboard
app.get('/', (c) => {
  return c.render(
    <div className="app-layout">
      {/* Desktop Sidebar Navigation */}
      <aside className="desktop-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            🍄 Mushroom Manager
          </h1>
          <button id="themeToggle" className="theme-toggle">
            🌙
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <a href="/" className="sidebar-nav-item active">
            <span className="icon">🏠</span>
            <span>Dashboard</span>
          </a>
          <a href="/protocols" className="sidebar-nav-item">
            <span className="icon">📋</span>
            <span>Protokolle</span>
          </a>
          <a href="/analytics" className="sidebar-nav-item">
            <span className="icon">📊</span>
            <span>Statistiken</span>
          </a>
          <a href="/wiki" className="sidebar-nav-item">
            <span className="icon">📚</span>
            <span>Pilz-Wiki</span>
          </a>
          <a href="/settings" className="sidebar-nav-item">
            <span className="icon">⚙️</span>
            <span>Einstellungen</span>
          </a>
        </nav>
        
        <div className="sidebar-footer">
          <button 
            onclick="window.location.href = '/protocols/new'"
            className="btn btn-gradient sidebar-action"
          >
            <span>➕</span>
            <span>Neues Protokoll</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">
            🍄 Mushroom Manager
          </h1>
          <button id="themeToggle" className="theme-toggle">
            🌙
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="site-container">
        <div className="pb-6">
          {/* Statistics Cards */}
          <div className="stats-grid mb-6">
            <div className="stat-card">
              <div className="stat-info">
                <h3>Aktive Protokolle</h3>
                <p data-stat="protocols">{mockProtocols.length}</p>
              </div>
              <div className="stat-icon stat-icon--green">
                📋
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <h3>In Fruchtung</h3>
                <p>1</p>
              </div>
              <div className="stat-icon stat-icon--purple">
                🍄
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-info">
                <h3>Abgeschlossen</h3>
                <p>5</p>
              </div>
              <div className="stat-icon stat-icon--blue">
                ✅
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-info">
                <h3>Ertrag (kg)</h3>
                <p>2.4</p>
              </div>
              <div className="stat-icon stat-icon--orange">
                ⚖️
              </div>
            </div>
          </div>

          {/* Quick Action - Neues Protokoll (Mobile only) */}
          <div className="mb-6 block">
            <button 
              onclick="window.location.href = '/protocols/new'"
              className="btn btn-gradient w-full"
              style="display: block;"
            >
              <span className="text-lg">➕</span>
              <span>Neues Zuchtprotokoll</span>
            </button>
          </div>

          {/* Aktuelle Protokolle */}
          <div className="glass-card glass-card--lg">
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
              📋 Aktuelle Protokolle
            </h2>
            
            <div className="protocol-grid">
              {mockProtocols.map(protocol => (
                <div key={protocol.id} className="protocol-card">
                  <div className="protocol-header">
                    <h3 className="protocol-title">{protocol.title}</h3>
                    <span className={`protocol-status ${
                      protocol.status === 'Fruchtung' ? 'status-fruchtung' :
                      protocol.status === 'Durchwachsung' ? 'status-durchwachsung' :
                      'status-other'
                    }`}>
                      {protocol.status}
                    </span>
                  </div>
                  
                  <div className="protocol-meta">
                    <div className="protocol-meta-item">
                      <span className="protocol-meta-label">Art</span>
                      <span className="protocol-meta-value">{protocol.species}</span>
                    </div>
                    <div className="protocol-meta-item">
                      <span className="protocol-meta-label">Phase</span>
                      <span className="protocol-meta-value">{protocol.phase}</span>
                    </div>
                    <div className="protocol-meta-item">
                      <span className="protocol-meta-label">Temperatur</span>
                      <span className="protocol-meta-value">{protocol.temperature}</span>
                    </div>
                    <div className="protocol-meta-item">
                      <span className="protocol-meta-label">Start</span>
                      <span className="protocol-meta-value">{protocol.startDate}</span>
                    </div>
                  </div>
                  
                  <div className="protocol-actions">
                    <button 
                      onclick={`viewProtocol(${protocol.id})`}
                      className="btn btn-primary flex-1"
                    >
                      Details
                    </button>
                    <button 
                      onclick={`editProtocol(${protocol.id})`}
                      className="btn btn-glass"
                    >
                      Bearbeiten
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <a href="/" className="nav-item active">
          <span className="icon">🏠</span>
          <span>Dashboard</span>
        </a>
        <a href="/protocols" className="nav-item">
          <span className="icon">📋</span>
          <span>Protokolle</span>
        </a>
        <a href="/protocols/new" className="nav-item nav-action">
          <span className="icon">➕</span>
        </a>
        <a href="/wiki" className="nav-item">
          <span className="icon">📚</span>
          <span>Wiki</span>
        </a>
      </nav>
    </div>
  )
})

// Protokoll-Liste Seite
app.get('/protocols', (c) => {
  return c.render(
    <div className="app-layout">
      {/* Desktop Sidebar Navigation */}
      <aside className="desktop-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            🍄 Mushroom Manager
          </h1>
          <button id="themeToggle" className="theme-toggle">
            🌙
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <a href="/" className="sidebar-nav-item">
            <span className="icon">🏠</span>
            <span>Dashboard</span>
          </a>
          <a href="/protocols" className="sidebar-nav-item active">
            <span className="icon">📋</span>
            <span>Protokolle</span>
          </a>
          <a href="/analytics" className="sidebar-nav-item">
            <span className="icon">📊</span>
            <span>Statistiken</span>
          </a>
          <a href="/wiki" className="sidebar-nav-item">
            <span className="icon">📚</span>
            <span>Pilz-Wiki</span>
          </a>
          <a href="/settings" className="sidebar-nav-item">
            <span className="icon">⚙️</span>
            <span>Einstellungen</span>
          </a>
        </nav>
        
        <div className="sidebar-footer">
          <button 
            onclick="window.location.href = '/protocols/new'"
            className="btn btn-gradient sidebar-action"
          >
            <span>➕</span>
            <span>Neues Protokoll</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button onclick="history.back()" className="p-2 hover:bg-gray-100 rounded-lg">
              ←
            </button>
            <h1 className="header-title">Zuchtprotokolle</h1>
          </div>
          <button onclick="window.location.href = '/protocols/new'" className="btn btn-primary text-sm">
            + Neu
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="site-container">
        <div className="pb-6">
          <div className="protocol-grid">
            {mockProtocols.map(protocol => (
              <div key={protocol.id} className="protocol-card">
                <div className="protocol-header">
                  <h3 className="protocol-title">{protocol.title}</h3>
                  <span className={`protocol-status ${
                    protocol.status === 'Fruchtung' ? 'status-fruchtung' :
                    protocol.status === 'Durchwachsung' ? 'status-durchwachsung' :
                    'status-other'
                  }`}>
                    {protocol.status}
                  </span>
                </div>
                
                <div className="protocol-meta">
                  <div className="protocol-meta-item">
                    <span className="protocol-meta-label">Art</span>
                    <span className="protocol-meta-value">{protocol.species}</span>
                  </div>
                  <div className="protocol-meta-item">
                    <span className="protocol-meta-label">Substrat</span>
                    <span className="protocol-meta-value">{protocol.substrate}</span>
                  </div>
                  <div className="protocol-meta-item">
                    <span className="protocol-meta-label">Start</span>
                    <span className="protocol-meta-value">{protocol.startDate}</span>
                  </div>
                  <div className="protocol-meta-item">
                    <span className="protocol-meta-label">Phase</span>
                    <span className="protocol-meta-value">{protocol.phase}</span>
                  </div>
                </div>
                
                <div className="protocol-actions">
                  <button 
                    onclick={`viewProtocol(${protocol.id})`}
                    className="btn btn-primary flex-1"
                  >
                    Details
                  </button>
                  <button 
                    onclick={`editProtocol(${protocol.id})`}
                    className="btn btn-glass"
                  >
                    Bearbeiten
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <a href="/" className="nav-item">
          <span className="icon">🏠</span>
          <span>Dashboard</span>
        </a>
        <a href="/protocols" className="nav-item active">
          <span className="icon">📋</span>
          <span>Protokolle</span>
        </a>
        <a href="/protocols/new" className="nav-item nav-action">
          <span className="icon">➕</span>
        </a>
        <a href="/wiki" className="nav-item">
          <span className="icon">📚</span>
          <span>Wiki</span>
        </a>
      </nav>
    </div>
  )
})

// Neues Protokoll erstellen
app.get('/protocols/new', (c) => {
  return c.render(
    <div className="app-layout">
      {/* Desktop Sidebar Navigation */}
      <aside className="desktop-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            🍄 Mushroom Manager
          </h1>
          <button id="themeToggle" className="theme-toggle">
            🌙
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <a href="/" className="sidebar-nav-item">
            <span className="icon">🏠</span>
            <span>Dashboard</span>
          </a>
          <a href="/protocols" className="sidebar-nav-item">
            <span className="icon">📋</span>
            <span>Protokolle</span>
          </a>
          <a href="/analytics" className="sidebar-nav-item">
            <span className="icon">📊</span>
            <span>Statistiken</span>
          </a>
          <a href="/wiki" className="sidebar-nav-item">
            <span className="icon">📚</span>
            <span>Pilz-Wiki</span>
          </a>
          <a href="/settings" className="sidebar-nav-item">
            <span className="icon">⚙️</span>
            <span>Einstellungen</span>
          </a>
        </nav>
        
        <div className="sidebar-footer">
          <button 
            onclick="window.location.href = '/protocols/new'"
            className="btn btn-gradient sidebar-action active"
          >
            <span>➕</span>
            <span>Neues Protokoll</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button onclick="history.back()" className="p-2 hover:bg-gray-100 rounded-lg">
              ←
            </button>
            <h1 className="header-title">Neues Protokoll</h1>
          </div>
          <button onclick="saveProtocol()" className="btn btn-primary text-sm">
            💾 Speichern
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="site-container">
        <div className="max-w-4xl mx-auto pb-6">
          <form id="protocolForm" className="space-y-6">
            
            {/* Grunddaten */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                🍄 Grunddaten
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="title" className="form-label required">
                    Protokoll-Name
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-input"
                    placeholder="z.B. SH02 - Shiitake Winterzucht"
                    required
                  />
                  <p className="form-help">
                    Eindeutiger Name für dein Zuchtprotokoll
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="species" className="form-label required">
                    Pilzart
                  </label>
                  <select id="species" name="species" className="form-input" required>
                    <option value="">Pilzart auswählen</option>
                    <option value="Pleurotus ostreatus">Austernpilz (Pleurotus ostreatus)</option>
                    <option value="Pleurotus ostreatus - Hybrid">Austernpilz - Hybrid (Black Pearl)</option>
                    <option value="Lentinula edodes">Shiitake (Lentinula edodes)</option>
                    <option value="Hericium erinaceus">Igelstachelbart (Hericium erinaceus)</option>
                    <option value="Ganoderma lucidum">Glänzender Lackporling (Ganoderma lucidum)</option>
                    <option value="Agaricus bisporus">Champignon (Agaricus bisporus)</option>
                    <option value="Trametes versicolor">Schmetterlingstramete (Trametes versicolor)</option>
                    <option value="Andere">Andere (bitte im Substrat-Feld angeben)</option>
                  </select>
                  <p className="form-help">
                    Die Art des Pilzes, den du züchten möchtest
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="startDate" className="form-label required">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    className="form-input"
                    required
                  />
                  <p className="form-help">
                    Datum der Inokulation/Beimpfung
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label required">
                    Aktuelle Phase
                  </label>
                  <select id="status" name="status" className="form-input" required>
                    <option value="">Phase auswählen</option>
                    <option value="Vorbereitung">Vorbereitung</option>
                    <option value="Sterilisation">Sterilisation</option>
                    <option value="Inokulation">Inokulation</option>
                    <option value="Durchwachsung">Durchwachsung</option>
                    <option value="Fruchtung">Fruchtung</option>
                    <option value="Ernte">Ernte</option>
                    <option value="Abgeschlossen">Abgeschlossen</option>
                  </select>
                  <p className="form-help">
                    In welcher Phase befindet sich dein Projekt gerade?
                  </p>
                </div>
              </div>
            </div>

            {/* Substrat & Inokulation */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                🌾 Substrat & Inokulation
              </h2>
              
              <div className="form-grid">
                <div className="form-group form-group--full">
                  <label htmlFor="substrate" className="form-label required">
                    Substrat-Zusammensetzung
                  </label>
                  <textarea
                    id="substrate"
                    name="substrate"
                    className="form-input"
                    rows="3"
                    placeholder="z.B. Masters Mix: 500g Sojabohnen + 500g Buchensägemehl + 20g Gips + 1L Wasser"
                    required
                  ></textarea>
                  <p className="form-help">
                    Detaillierte Beschreibung der Substrat-Mischung
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="substrateWeight" className="form-label">
                    Substratgewicht (g)
                  </label>
                  <input
                    type="number"
                    id="substrateWeight"
                    name="substrateWeight"
                    className="form-input"
                    placeholder="1000"
                    min="1"
                  />
                  <p className="form-help">
                    Gesamtgewicht des Substrats in Gramm
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="inoculation" className="form-label required">
                    Inokulations-Methode
                  </label>
                  <select id="inoculation" name="inoculation" className="form-input" required>
                    <option value="">Methode auswählen</option>
                    <option value="Flüssigkultur">Flüssigkultur</option>
                    <option value="Kornbrut">Kornbrut</option>
                    <option value="Agar-Kultur">Agar-Kultur</option>
                    <option value="Dübel">Dübel/Holzstäbchen</option>
                    <option value="Sporen">Sporenabdruck</option>
                  </select>
                  <p className="form-help">
                    Wie wurde das Substrat beimpft?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="inoculationAmount" className="form-label">
                    Inokulations-Menge
                  </label>
                  <input
                    type="text"
                    id="inoculationAmount"
                    name="inoculationAmount"
                    className="form-input"
                    placeholder="z.B. 10ml, 50g, 5 Dübel"
                  />
                  <p className="form-help">
                    Menge des verwendeten Inokulums
                  </p>
                </div>
              </div>
            </div>

            {/* Umgebungsbedingungen */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                🌡️ Umgebungsbedingungen
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="temperature" className="form-label required">
                    Temperatur
                  </label>
                  <input
                    type="text"
                    id="temperature"
                    name="temperature"
                    className="form-input"
                    placeholder="z.B. 18-22°C"
                    required
                  />
                  <p className="form-help">
                    Temperaturbereich für diese Phase
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="humidity" className="form-label required">
                    Luftfeuchtigkeit
                  </label>
                  <input
                    type="text"
                    id="humidity"
                    name="humidity"
                    className="form-input"
                    placeholder="z.B. 80-90%"
                    required
                  />
                  <p className="form-help">
                    Gewünschte Luftfeuchtigkeit
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="airflow" className="form-label">
                    Belüftung
                  </label>
                  <select id="airflow" name="airflow" className="form-input">
                    <option value="">Belüftung auswählen</option>
                    <option value="Keine">Keine Belüftung</option>
                    <option value="Passiv">Passive Belüftung</option>
                    <option value="Aktiv-niedrig">Aktive Belüftung (niedrig)</option>
                    <option value="Aktiv-hoch">Aktive Belüftung (hoch)</option>
                  </select>
                  <p className="form-help">
                    Art und Stärke der Belüftung
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="lighting" className="form-label">
                    Beleuchtung
                  </label>
                  <select id="lighting" name="lighting" className="form-input">
                    <option value="">Beleuchtung auswählen</option>
                    <option value="Dunkel">Dunkel</option>
                    <option value="Indirektes Tageslicht">Indirektes Tageslicht</option>
                    <option value="LED-Licht">LED-Licht</option>
                    <option value="Neonröhre">Neonröhre</option>
                  </select>
                  <p className="form-help">
                    Art der Beleuchtung
                  </p>
                </div>
              </div>
            </div>

            {/* Container & Setup */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                📦 Container & Setup
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="container" className="form-label">
                    Container-Typ
                  </label>
                  <select id="container" name="container" className="form-input">
                    <option value="">Container auswählen</option>
                    <option value="Monotub">Monotub (große Plastikbox)</option>
                    <option value="Shotgun Fruiting Chamber">Shotgun Fruiting Chamber</option>
                    <option value="Grow Bag">Grow Bag (Zuchtbeutel)</option>
                    <option value="Mason Jar">Mason Jar (Einmachglas)</option>
                    <option value="Tupperware">Tupperware</option>
                    <option value="Umluftbox">Umluftbox</option>
                    <option value="Andere">Andere</option>
                  </select>
                  <p className="form-help">
                    Welchen Container verwendest du?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="containerSize" className="form-label">
                    Container-Größe
                  </label>
                  <input
                    type="text"
                    id="containerSize"
                    name="containerSize"
                    className="form-input"
                    placeholder="z.B. 32L Box, 45x30x24cm"
                  />
                  <p className="form-help">
                    Größe/Volumen des Containers
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="location" className="form-label">
                    Standort
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="form-input"
                    placeholder="z.B. Keller, Schlafzimmer, Gewächshaus"
                  />
                  <p className="form-help">
                    Wo steht dein Setup?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="expectedYield" className="form-label">
                    Erwarteter Ertrag (g)
                  </label>
                  <input
                    type="number"
                    id="expectedYield"
                    name="expectedYield"
                    className="form-input"
                    placeholder="200"
                    min="1"
                  />
                  <p className="form-help">
                    Geschätzter Gesamtertrag in Gramm
                  </p>
                </div>
              </div>
            </div>

            {/* Notizen */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                📝 Notizen & Ziele
              </h2>
              
              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  Zusätzliche Notizen
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-input"
                  rows="4"
                  placeholder="Besondere Beobachtungen, Experimente, Ziele oder andere wichtige Informationen..."
                ></textarea>
                <p className="form-help">
                  Platz für deine persönlichen Notizen und Beobachtungen
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button 
                type="button"
                onclick="saveProtocol()"
                className="btn btn-gradient flex-1 text-lg"
              >
                <span>💾</span>
                <span>Protokoll speichern</span>
              </button>
              
              <button 
                type="button"
                onclick="saveDraft()"
                className="btn btn-glass flex-1"
              >
                <span>📋</span>
                <span>Als Entwurf speichern</span>
              </button>
              
              <button 
                type="button"
                onclick="history.back()"
                className="btn btn-secondary"
              >
                <span>❌</span>
                <span>Abbrechen</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <a href="/" className="nav-item">
          <span className="icon">🏠</span>
          <span>Dashboard</span>
        </a>
        <a href="/protocols" className="nav-item">
          <span className="icon">📋</span>
          <span>Protokolle</span>
        </a>
        <a href="/protocols/new" className="nav-item nav-action active">
          <span className="icon">➕</span>
        </a>
        <a href="/wiki" className="nav-item">
          <span className="icon">📚</span>
          <span>Wiki</span>
        </a>
      </nav>
    </div>
  )
})

export default app
