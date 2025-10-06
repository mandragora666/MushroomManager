import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import { DatabaseService } from './database'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

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

// API Routes - Zuchtprotokolle (with D1 Database)
app.get('/api/protocols', async (c) => {
  try {
    // Fallback to mock data if no database
    if (!c.env?.DB) {
      return c.json({
        success: true,
        protocols: mockProtocols,
        count: mockProtocols.length,
        source: 'mock'
      });
    }

    const db = new DatabaseService(c.env.DB);
    const protocols = await db.getAllProtocols();
    
    return c.json({
      success: true,
      protocols,
      count: protocols.length,
      source: 'database'
    });
  } catch (error) {
    console.error('Database error:', error);
    // Fallback to mock data on error
    return c.json({
      success: true,
      protocols: mockProtocols,
      count: mockProtocols.length,
      source: 'mock_fallback'
    });
  }
})

app.get('/api/protocols/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    // Fallback to mock data if no database
    if (!c.env?.DB) {
      const protocol = mockProtocols.find(p => p.id === id);
      if (!protocol) {
        return c.json({ success: false, error: 'Protokoll nicht gefunden' }, 404);
      }
      return c.json({ success: true, protocol, source: 'mock' });
    }

    const db = new DatabaseService(c.env.DB);
    const protocol = await db.getProtocolById(id);
    
    if (!protocol) {
      return c.json({ success: false, error: 'Protokoll nicht gefunden' }, 404);
    }
    
    // Load additional data
    const phases = await db.getProtocolPhases(id);
    const harvests = await db.getProtocolHarvests(id);
    
    return c.json({ 
      success: true, 
      protocol: {
        ...protocol,
        phases,
        harvests
      },
      source: 'database'
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
})

// Neues Protokoll erstellen (API Endpoint with D1)
app.post('/api/protocols', async (c) => {
  try {
    const data = await c.req.json();
    
    // Validierung der Pflichtfelder
    const requiredFields = ['code', 'title', 'species_id'];
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        return c.json({
          success: false,
          error: `Pflichtfeld '${field}' fehlt oder ist leer`,
          field
        }, 400);
      }
    }
    
    // Fallback to mock if no database
    if (!c.env?.DB) {
      const newProtocol = {
        id: mockProtocols.length + 1,
        title: data.title.trim(),
        species: data.species || 'Unknown',
        substrate: data.substrate || '',
        inoculation: data.inoculation || '',
        status: data.status || 'preparation',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        phase: data.status || 'preparation',
        temperature: data.temperature || '',
        humidity: data.humidity || '',
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockProtocols.push(newProtocol);
      return c.json({
        success: true,
        protocol: newProtocol,
        message: 'Protokoll erfolgreich erstellt! (Mock-Modus)',
        source: 'mock'
      }, 201);
    }

    const db = new DatabaseService(c.env.DB);
    
    // Check if code is unique
    const isUnique = await db.isProtocolCodeUnique(data.code);
    if (!isUnique) {
      return c.json({
        success: false,
        error: `Protokoll-Code '${data.code}' ist bereits vergeben`,
        field: 'code'
      }, 400);
    }
    
    // Create protocol
    const protocolId = await db.createProtocol({
      code: data.code.trim(),
      title: data.title.trim(),
      species_id: parseInt(data.species_id),
      strain: data.strain?.trim(),
      origin: data.origin?.trim(),
      breeder: data.breeder?.trim(),
      genetic_age: data.genetic_age ? parseInt(data.genetic_age) : undefined,
      notes: data.notes?.trim()
    });

    // Create initial phase if provided
    if (data.initial_phase) {
      await db.createPhase({
        protocol_id: protocolId,
        phase_type: data.initial_phase.type || 'preparation',
        phase_name: data.initial_phase.name || 'Vorbereitung',
        start_date: data.initial_phase.start_date,
        substrate_composition: data.initial_phase.substrate_composition,
        substrate_weight_g: data.initial_phase.substrate_weight_g,
        inoculation_method: data.initial_phase.inoculation_method,
        container_type: data.initial_phase.container_type,
        temperature_min: data.initial_phase.temperature_min,
        temperature_max: data.initial_phase.temperature_max,
        humidity_min: data.initial_phase.humidity_min,
        humidity_max: data.initial_phase.humidity_max,
        notes: data.initial_phase.notes
      });
    }
    
    // Get created protocol
    const protocol = await db.getProtocolById(protocolId);
    
    return c.json({
      success: true,
      protocol,
      message: 'Protokoll erfolgreich erstellt!',
      source: 'database'
    }, 201);
    
  } catch (error) {
    console.error('Fehler beim Erstellen des Protokolls:', error);
    return c.json({
      success: false,
      error: 'Server-Fehler beim Speichern des Protokolls'
    }, 500);
  }
})

// Dropdown Options API
app.get('/api/dropdown/:category', async (c) => {
  try {
    const category = c.req.param('category');
    
    if (!c.env?.DB) {
      // Mock dropdown data
      const mockOptions = {
        species: [
          { id: 1, value: 'pleurotus_ostreatus', label: 'Austernpilz (Pleurotus ostreatus)' },
          { id: 2, value: 'lentinula_edodes', label: 'Shiitake (Lentinula edodes)' },
          { id: 3, value: 'hericium_erinaceus', label: 'Igelstachelbart (Hericium erinaceus)' }
        ],
        substrate_types: [
          { id: 1, value: 'masters_mix', label: 'Masters Mix' },
          { id: 2, value: 'straw', label: 'Stroh' },
          { id: 3, value: 'hardwood_sawdust', label: 'Laubholzsägemehl' }
        ]
      };
      
      return c.json({
        success: true,
        options: mockOptions[category] || [],
        source: 'mock'
      });
    }

    const db = new DatabaseService(c.env.DB);
    const options = await db.getDropdownOptions(category);
    
    return c.json({
      success: true,
      options,
      source: 'database'
    });
  } catch (error) {
    console.error('Dropdown options error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
})

app.get('/api/species', async (c) => {
  try {
    if (!c.env?.DB) {
      const mockSpecies = [
        { id: 1, scientific_name: 'Pleurotus ostreatus', common_name: 'Austernpilz', category: 'Pleurotus' },
        { id: 2, scientific_name: 'Lentinula edodes', common_name: 'Shiitake', category: 'Lentinula' },
        { id: 3, scientific_name: 'Hericium erinaceus', common_name: 'Igelstachelbart', category: 'Hericium' }
      ];
      
      return c.json({
        success: true,
        species: mockSpecies,
        source: 'mock'
      });
    }

    const db = new DatabaseService(c.env.DB);
    const species = await db.getAllSpecies();
    
    return c.json({
      success: true,
      species,
      source: 'database'
    });
  } catch (error) {
    console.error('Species API error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
})

app.post('/api/dropdown/:category', async (c) => {
  try {
    const category = c.req.param('category');
    const data = await c.req.json();
    
    if (!c.env?.DB) {
      return c.json({
        success: false,
        error: 'Database not available in development mode'
      }, 503);
    }

    const db = new DatabaseService(c.env.DB);
    const optionId = await db.createDropdownOption({
      category,
      value: data.value,
      label: data.label,
      description: data.description,
      sort_order: data.sort_order || 0,
      is_active: true
    });
    
    return c.json({
      success: true,
      id: optionId,
      message: 'Option erfolgreich hinzugefügt'
    }, 201);
  } catch (error) {
    console.error('Create dropdown option error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
})

app.delete('/api/dropdown/:category/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (!c.env?.DB) {
      return c.json({
        success: false,
        error: 'Database not available in development mode'
      }, 503);
    }

    const db = new DatabaseService(c.env.DB);
    await db.deleteDropdownOption(id);
    
    return c.json({
      success: true,
      message: 'Option erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Delete dropdown option error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
})

// Statistics API
app.get('/api/stats', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({
        success: true,
        stats: {
          total_protocols: mockProtocols.length,
          active_protocols: mockProtocols.filter(p => ['fruiting', 'colonization'].includes(p.status)).length,
          completed_protocols: mockProtocols.filter(p => p.status === 'completed').length,
          total_harvests: 0,
          total_yield_kg: 0
        },
        source: 'mock'
      });
    }

    const db = new DatabaseService(c.env.DB);
    const stats = await db.getProtocolStats();
    
    return c.json({
      success: true,
      stats,
      source: 'database'
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
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
                <p data-stat="protocols" data-api="/api/stats" data-field="active_protocols">{mockProtocols.length}</p>
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
