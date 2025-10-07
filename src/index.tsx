import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import { DatabaseService } from './database'
import type { Env } from './types'

// CACHE-FIX-2024-10-06: Force Cloudflare rebuild with new version
// UI FIXES: Protocol labels now show "Art:", "Phase:", "Temperatur:", "Start:" 
const CACHE_BUSTER_VERSION = "1.0.1-cache-fix"

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
    
    // Also get drafts
    const draftsResult = await c.env.DB.prepare(`
      SELECT id, code, title, created_at, updated_at,
             'draft' as status, 'Entwurf' as species_name
      FROM protocol_drafts 
      WHERE is_active = 1
      ORDER BY updated_at DESC
    `).all();
    
    const drafts = draftsResult.results.map(draft => ({
      ...draft,
      isDraft: true,
      scientific_name: '',
      created_at: draft.created_at,
      updated_at: draft.updated_at
    }));
    
    // Combine protocols and drafts
    const allItems = [...protocols, ...drafts].sort((a, b) => 
      new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
    );
    
    return c.json({
      success: true,
      protocols: allItems,
      count: allItems.length,
      drafts_count: drafts.length,
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
    const requiredFields = ['code', 'title'];
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        return c.json({
          success: false,
          error: `Pflichtfeld '${field}' fehlt oder ist leer`,
          field
        }, 400);
      }
    }
    
    // species_id validation (optional for mock mode)
    if (data.species_id && (isNaN(parseInt(data.species_id)) || parseInt(data.species_id) <= 0)) {
      return c.json({
        success: false,
        error: 'Bitte wählen Sie eine gültige Pilzart aus',
        field: 'species_id'
      }, 400);
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
      // Use shared mock storage
      return c.json({
        success: true,
        options: mockDropdownStorage[category] || [],
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

// Mock storage for dropdown options (development mode)
const mockDropdownStorage = {
  species: [
    { id: 1, value: 'pleurotus_ostreatus', label: 'Pleurotus ostreatus (Austernpilz)' },
    { id: 2, value: 'lentinula_edodes', label: 'Lentinula edodes (Shiitake)' },
    { id: 3, value: 'hericium_erinaceus', label: 'Hericium erinaceus (Igelstachelbart)' }
  ],
  substrate_types: [
    { id: 1, value: 'masters_mix', label: 'Masters Mix' },
    { id: 2, value: 'straw', label: 'Stroh' },
    { id: 3, value: 'hardwood_sawdust', label: 'Laubholzsägemehl' }
  ],
  inoculation_methods: [
    { id: 1, value: 'liquid_culture', label: 'Flüssigkultur' },
    { id: 2, value: 'grain_spawn', label: 'Kornbrut' },
    { id: 3, value: 'agar', label: 'Agar-Kultur' }
  ],
  sterilization_methods: [
    { id: 1, value: 'pressure_cooker', label: 'Dampfdruckkochtopf' },
    { id: 2, value: 'steam', label: 'Dampf-Sterilisation' },
    { id: 3, value: 'boiling', label: 'Abkochen' }
  ],
  container_types: [
    { id: 1, value: 'grow_bag', label: 'Grow Bag (Zuchtbeutel)' },
    { id: 2, value: 'monotub', label: 'Monotub (große Box)' },
    { id: 3, value: 'mason_jar', label: 'Mason Jar (Einmachglas)' }
  ],
  fruiting_triggers: [
    { id: 1, value: 'temperature_shock', label: 'Temperaturschock' },
    { id: 2, value: 'humidity_increase', label: 'Luftfeuchtigkeit erhöhen' },
    { id: 3, value: 'light_exposure', label: 'Lichtexposition' }
  ]
};

app.post('/api/dropdown/:category', async (c) => {
  try {
    const category = c.req.param('category');
    const data = await c.req.json();
    
    // Validation
    if (!data.label || !data.value) {
      return c.json({
        success: false,
        error: 'Label und Value sind erforderlich'
      }, 400);
    }
    
    if (!c.env?.DB) {
      // Mock mode - add to mock storage
      if (!mockDropdownStorage[category]) {
        mockDropdownStorage[category] = [];
      }
      
      // Check for duplicate value
      const exists = mockDropdownStorage[category].find(item => item.value === data.value);
      if (exists) {
        return c.json({
          success: false,
          error: 'Dieser Wert existiert bereits'
        }, 400);
      }
      
      const newId = Math.max(0, ...mockDropdownStorage[category].map(item => item.id)) + 1;
      const newOption = {
        id: newId,
        value: data.value.trim(),
        label: data.label.trim()
      };
      
      mockDropdownStorage[category].push(newOption);
      
      return c.json({
        success: true,
        id: newId,
        message: 'Option erfolgreich hinzugefügt (Mock-Modus)',
        option: newOption
      }, 201);
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
    
    const newOption = {
      id: optionId,
      value: data.value.trim(),
      label: data.label.trim()
    };
    
    return c.json({
      success: true,
      id: optionId,
      message: 'Option erfolgreich hinzugefügt',
      option: newOption
    }, 201);
  } catch (error) {
    console.error('Create dropdown option error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
})

app.delete('/api/dropdown/:category/:id', async (c) => {
  try {
    const category = c.req.param('category');
    const id = parseInt(c.req.param('id'));
    
    if (!c.env?.DB) {
      // Mock mode - remove from mock storage
      if (!mockDropdownStorage[category]) {
        return c.json({
          success: false,
          error: 'Kategorie nicht gefunden'
        }, 404);
      }
      
      const index = mockDropdownStorage[category].findIndex(item => item.id === id);
      if (index === -1) {
        return c.json({
          success: false,
          error: 'Option nicht gefunden'
        }, 404);
      }
      
      mockDropdownStorage[category].splice(index, 1);
      
      return c.json({
        success: true,
        message: 'Option erfolgreich gelöscht (Mock-Modus)'
      });
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

// Draft API - Entwurf speichern
app.post('/api/protocols/draft', async (c) => {
  try {
    const data = await c.req.json();
    
    if (!c.env?.DB) {
      // Fallback: Store draft in mock storage
      const draft = {
        id: 'draft_' + Date.now(),
        timestamp: new Date().toISOString(),
        data: data
      };
      
      return c.json({
        success: true,
        draft,
        message: 'Entwurf lokal gespeichert! (Mock-Modus)',
        source: 'mock'
      }, 201);
    }

    // Real D1 database storage
    const db = c.env.DB;
    
    // Generate or use existing code
    const code = data.code || `DRAFT_${Date.now()}`;
    const title = data.title || 'Unbenannter Entwurf';
    
    // Check if draft with this code already exists
    const existingDraft = await db.prepare(`
      SELECT id FROM protocol_drafts 
      WHERE code = ? AND is_active = 1
    `).bind(code).first();
    
    let draftId;
    
    if (existingDraft) {
      // Update existing draft
      await db.prepare(`
        UPDATE protocol_drafts 
        SET title = ?, draft_data = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(title, JSON.stringify(data), existingDraft.id).run();
      
      draftId = existingDraft.id;
    } else {
      // Create new draft
      const result = await db.prepare(`
        INSERT INTO protocol_drafts (code, title, draft_data, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `).bind(code, title, JSON.stringify(data)).run();
      
      draftId = result.meta.last_row_id;
    }
    
    return c.json({
      success: true,
      draft: {
        id: draftId,
        code,
        title,
        timestamp: new Date().toISOString()
      },
      message: '💾 Entwurf gespeichert!',
      source: 'database'
    }, 201);
    
  } catch (error) {
    console.error('Draft save error:', error);
    return c.json({
      success: false,
      error: 'Fehler beim Speichern des Entwurfs'
    }, 500);
  }
})

// Get all drafts
app.get('/api/drafts', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({
        success: true,
        drafts: [],
        message: 'Keine Entwürfe im Mock-Modus',
        source: 'mock'
      });
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT id, code, title, created_at, updated_at
      FROM protocol_drafts 
      WHERE is_active = 1
      ORDER BY updated_at DESC
    `).all();
    
    return c.json({
      success: true,
      drafts: result.results,
      source: 'database'
    });
    
  } catch (error) {
    console.error('Get drafts error:', error);
    return c.json({
      success: false,
      error: 'Fehler beim Laden der Entwürfe'
    }, 500);
  }
})

// Get specific draft
app.get('/api/drafts/:id', async (c) => {
  try {
    const draftId = parseInt(c.req.param('id'));
    
    if (!c.env?.DB) {
      return c.json({
        success: false,
        error: 'Entwurf nicht verfügbar im Mock-Modus'
      }, 404);
    }

    const db = c.env.DB;
    const draft = await db.prepare(`
      SELECT id, code, title, draft_data, created_at, updated_at
      FROM protocol_drafts 
      WHERE id = ? AND is_active = 1
    `).bind(draftId).first();
    
    if (!draft) {
      return c.json({
        success: false,
        error: 'Entwurf nicht gefunden'
      }, 404);
    }
    
    return c.json({
      success: true,
      draft: {
        ...draft,
        data: JSON.parse(draft.draft_data)
      },
      source: 'database'
    });
    
  } catch (error) {
    console.error('Get draft error:', error);
    return c.json({
      success: false,
      error: 'Fehler beim Laden des Entwurfs'
    }, 500);
  }
})

// Delete draft
app.delete('/api/drafts/:id', async (c) => {
  try {
    const draftId = parseInt(c.req.param('id'));
    
    if (!c.env?.DB) {
      return c.json({
        success: false,
        error: 'Löschen nicht verfügbar im Mock-Modus'
      }, 400);
    }

    const db = c.env.DB;
    await db.prepare(`
      UPDATE protocol_drafts 
      SET is_active = 0 
      WHERE id = ?
    `).bind(draftId).run();
    
    return c.json({
      success: true,
      message: 'Entwurf gelöscht'
    });
    
  } catch (error) {
    console.error('Delete draft error:', error);
    return c.json({
      success: false,
      error: 'Fehler beim Löschen des Entwurfs'
    }, 500);
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
                      <span className="protocol-meta-label">Art:</span>
                      <span className="protocol-meta-value"> {protocol.species}</span>
                    </div>
                    <div className="protocol-meta-item">
                      <span className="protocol-meta-label">Phase:</span>
                      <span className="protocol-meta-value"> {protocol.phase}</span>
                    </div>
                    <div className="protocol-meta-item">
                      <span className="protocol-meta-label">Temperatur:</span>
                      <span className="protocol-meta-value"> {protocol.temperature}</span>
                    </div>
                    <div className="protocol-meta-item">
                      <span className="protocol-meta-label">Start:</span>
                      <span className="protocol-meta-value"> {protocol.startDate}</span>
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
          {/* Loading State */}
          <div id="protocols-loading" className="text-center py-8">
            <div className="loading-spinner">⏳ Protokolle werden geladen...</div>
          </div>
          
          {/* Protocols Container - populated by JavaScript */}
          <div id="protocols-container" className="protocol-grid" style="display: none;">
            {/* JavaScript will populate this */}
          </div>
          
          {/* Empty State */}
          <div id="protocols-empty" className="text-center py-8" style="display: none;">
            <div className="empty-state">
              <h3>Keine Protokolle gefunden</h3>
              <p>Erstellen Sie Ihr erstes Zuchtprotokoll!</p>
              <a href="/protocols/new" className="btn btn-primary mt-4">
                + Erstes Protokoll erstellen
              </a>
            </div>
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

// Neues Protokoll erstellen - Vollständige Formular-Struktur basierend auf Screenshots
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
            
            {/* 1. SUBSTRATBLOCK-BEZEICHNUNG */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                🏷️ Substratblock-Bezeichnung
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="protocol_code" className="form-label required">
                    Protokoll-Code
                  </label>
                  <input
                    type="text"
                    id="protocol_code"
                    name="code"
                    className="form-input"
                    placeholder="z.B. BP03, SH01, HE02"
                    required
                  />
                  <p className="form-help">
                    Eindeutige Kurz-Bezeichnung für diesen Block
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="protocol_title" className="form-label required">
                    Titel/Bezeichnung
                  </label>
                  <input
                    type="text"
                    id="protocol_title"
                    name="title"
                    className="form-input"
                    placeholder="z.B. Black Pearl Austernpilz Winterzucht"
                    required
                  />
                  <p className="form-help">
                    Vollständiger Name des Zuchtprojekts
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="species_select" className="form-label required">
                    Pilzart
                  </label>
                  <div className="dropdown-with-manage">
                    <select id="species_select" name="species_id" className="form-input" required>
                      <option value="">Pilzart auswählen...</option>
                      <option value="1">Pleurotus ostreatus (Austernpilz)</option>
                      <option value="2">Lentinula edodes (Shiitake)</option>
                      <option value="3">Hericium erinaceus (Igelstachelbart)</option>
                    </select>
                    <button type="button" onclick="manageDropdown('species')" className="manage-btn">
                      ⚙️ Verwalten
                    </button>
                  </div>
                  <p className="form-help">
                    Wissenschaftliche Art und Sorte des Pilzes
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="strain" className="form-label">
                    Stamm/Variante
                  </label>
                  <input
                    type="text"
                    id="strain"
                    name="strain"
                    className="form-input"
                    placeholder="z.B. Black Pearl, Blue Oyster, 3782"
                  />
                  <p className="form-help">
                    Spezifische Stamm-Bezeichnung oder Sorte
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="origin" className="form-label">
                    Herkunft/Quelle
                  </label>
                  <input
                    type="text"
                    id="origin"
                    name="origin"
                    className="form-input"
                    placeholder="z.B. Hawlik, Pilzmännchen, Eigenkultur"
                  />
                  <p className="form-help">
                    Woher stammt das Myzel/die Kultur?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="breeder" className="form-label">
                    Züchter/Lieferant
                  </label>
                  <input
                    type="text"
                    id="breeder"
                    name="breeder"
                    className="form-input"
                    placeholder="z.B. Pilzshop XY, Private Züchtung"
                  />
                  <p className="form-help">
                    Wer hat diesen Stamm gezüchtet/geliefert?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="genetic_age" className="form-label">
                    Genetisches Alter (Generationen)
                  </label>
                  <input
                    type="number"
                    id="genetic_age"
                    name="genetic_age"
                    className="form-input"
                    placeholder="z.B. 3"
                    min="0"
                  />
                  <p className="form-help">
                    Anzahl der Übertragungen seit Wildstamm
                  </p>
                </div>

                <div className="form-group form-group--full">
                  <label htmlFor="notes_substrate" className="form-label">
                    Zusätzliche Notizen
                  </label>
                  <textarea
                    id="notes_substrate"
                    name="notes"
                    className="form-input"
                    rows="2"
                    placeholder="Besondere Eigenschaften, Erwartungen, Experimente..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* 2. MYZEL WACHSTUMSPHASE */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                🧬 Myzel Wachstumsphase
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="mycel_start_date" className="form-label required">
                    Startdatum Inokulation
                  </label>
                  <input
                    type="date"
                    id="mycel_start_date"
                    name="mycel_start_date"
                    className="form-input"
                    required
                  />
                  <p className="form-help">
                    Wann wurde das Substrat beimpft?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="inoculation_method" className="form-label required">
                    Inokulations-Methode
                  </label>
                  <div className="dropdown-with-manage">
                    <select id="inoculation_method" name="inoculation_method" className="form-input" required>
                      <option value="">Methode auswählen...</option>
                    </select>
                    <button type="button" onclick="manageDropdown('inoculation_method')" className="manage-btn">
                      ⚙️ Verwalten
                    </button>
                  </div>
                  <p className="form-help">
                    Wie wurde das Myzel eingebracht?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="inoculation_amount" className="form-label">
                    Inokulations-Menge
                  </label>
                  <input
                    type="text"
                    id="inoculation_amount"
                    name="inoculation_amount"
                    className="form-input"
                    placeholder="z.B. 10ml, 50g, 5 Dübel"
                  />
                  <p className="form-help">
                    Menge des verwendeten Inokulums
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="incubation_temp_min" className="form-label">
                    Inkubations-Temperatur Min. (°C)
                  </label>
                  <input
                    type="number"
                    id="incubation_temp_min"
                    name="incubation_temp_min"
                    className="form-input"
                    placeholder="20"
                    step="0.5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="incubation_temp_max" className="form-label">
                    Inkubations-Temperatur Max. (°C)
                  </label>
                  <input
                    type="number"
                    id="incubation_temp_max"
                    name="incubation_temp_max"
                    className="form-input"
                    placeholder="25"
                    step="0.5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="incubation_humidity" className="form-label">
                    Inkubations-Luftfeuchtigkeit (%)
                  </label>
                  <input
                    type="number"
                    id="incubation_humidity"
                    name="incubation_humidity"
                    className="form-input"
                    placeholder="70"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="colonization_duration" className="form-label">
                    Durchwachsungszeit (Tage)
                  </label>
                  <input
                    type="number"
                    id="colonization_duration"
                    name="colonization_duration"
                    className="form-input"
                    placeholder="14"
                    min="1"
                  />
                  <p className="form-help">
                    Geschätzte oder tatsächliche Zeit bis vollständiger Durchwachsung
                  </p>
                </div>

                <div className="form-group form-group--full">
                  <label htmlFor="mycel_observations" className="form-label">
                    Beobachtungen Myzel-Wachstum
                  </label>
                  <textarea
                    id="mycel_observations"
                    name="mycel_observations"
                    className="form-input"
                    rows="3"
                    placeholder="Wachstumsgeschwindigkeit, Farbe, Dichte, Besonderheiten..."
                  ></textarea>
                </div>

                {/* Flexibles Foto-Upload für Myzel-Phase */}
                <div className="form-group form-group--full">
                  <label className="form-label">
                    📸 Fotos - Myzel Wachstumsphase
                  </label>
                  <div className="flexible-photo-upload" data-phase="mycel">
                    <div className="photo-upload-grid" id="mycel-photos">
                      {/* Dynamically added photo slots will go here */}
                    </div>
                    <button type="button" onclick="addPhotoSlot('mycel', 'Myzel-Phase')" className="btn btn-glass add-photo-btn">
                      📷 Foto hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SUBSTRAT WACHSTUMSPHASE */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                🌾 Substrat Wachstumsphase
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="substrate_type" className="form-label required">
                    Substrat-Typ
                  </label>
                  <div className="dropdown-with-manage">
                    <select id="substrate_type" name="substrate_type" className="form-input" required>
                      <option value="">Substrat-Typ auswählen...</option>
                      <option value="masters_mix">Masters Mix</option>
                      <option value="straw">Stroh</option>
                      <option value="hardwood_sawdust">Laubholzsägemehl</option>
                      <option value="coffee_grounds">Kaffeesatz</option>
                      <option value="cardboard">Karton</option>
                      <option value="logs">Holzstämme</option>
                    </select>
                    <button type="button" onclick="manageDropdown('substrate_types')" className="manage-btn">
                      ⚙️ Verwalten
                    </button>
                  </div>
                  <p className="form-help">
                    Hauptbestandteil des Substrats
                  </p>
                </div>

                <div className="form-group form-group--full">
                  <label htmlFor="substrate_composition" className="form-label required">
                    Substrat-Zusammensetzung
                  </label>
                  <textarea
                    id="substrate_composition"
                    name="substrate_composition"
                    className="form-input"
                    rows="3"
                    placeholder="z.B. Masters Mix: 500g Sojabohnen + 500g Buchensägemehl + 20g Gips + 1L Wasser"
                    required
                  ></textarea>
                  <p className="form-help">
                    Detaillierte Rezeptur mit Gewichtsangaben
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="substrate_weight" className="form-label required">
                    Substratgewicht Nass (g)
                  </label>
                  <input
                    type="number"
                    id="substrate_weight"
                    name="substrate_weight_g"
                    className="form-input"
                    placeholder="1000"
                    min="1"
                    required
                  />
                  <p className="form-help">
                    Gesamtgewicht des fertigen Substrats
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="substrate_moisture" className="form-label">
                    Feuchtigkeit (%)
                  </label>
                  <input
                    type="number"
                    id="substrate_moisture"
                    name="substrate_moisture"
                    className="form-input"
                    placeholder="65"
                    min="0"
                    max="100"
                  />
                  <p className="form-help">
                    Feuchtigkeitsgehalt des Substrats
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="ph_value" className="form-label">
                    pH-Wert
                  </label>
                  <input
                    type="number"
                    id="ph_value"
                    name="ph_value"
                    className="form-input"
                    placeholder="6.5"
                    min="0"
                    max="14"
                    step="0.1"
                  />
                  <p className="form-help">
                    pH-Wert des Substrats (optional)
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="sterilization_method" className="form-label">
                    Sterilisations-Methode
                  </label>
                  <div className="dropdown-with-manage">
                    <select id="sterilization_method" name="sterilization_method" className="form-input">
                      <option value="">Methode auswählen...</option>
                      <option value="pressure_cooker">Dampfdruckkochtopf</option>
                      <option value="steam">Dampf-Sterilisation</option>
                      <option value="boiling">Abkochen</option>
                      <option value="lime">Kalkmilch</option>
                      <option value="none">Keine Sterilisation</option>
                    </select>
                    <button type="button" onclick="manageDropdown('sterilization_methods')" className="manage-btn">
                      ⚙️ Verwalten
                    </button>
                  </div>
                  <p className="form-help">
                    Wie wurde das Substrat sterilisiert?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="container_type" className="form-label">
                    Container-Typ
                  </label>
                  <div className="dropdown-with-manage">
                    <select id="container_type" name="container_type" className="form-input">
                      <option value="">Container auswählen...</option>
                      <option value="grow_bag">Grow Bag (Zuchtbeutel)</option>
                      <option value="monotub">Monotub (große Box)</option>
                      <option value="mason_jar">Mason Jar (Einmachglas)</option>
                      <option value="tupperware">Tupperware</option>
                      <option value="bucket">Eimer</option>
                      <option value="bag">Plastikbeutel</option>
                    </select>
                    <button type="button" onclick="manageDropdown('container_types')" className="manage-btn">
                      ⚙️ Verwalten
                    </button>
                  </div>
                  <p className="form-help">
                    In welchem Behälter wird kultiviert?
                  </p>
                </div>

                <div className="form-group form-group--full">
                  <label htmlFor="substrate_notes" className="form-label">
                    Substrat-Notizen
                  </label>
                  <textarea
                    id="substrate_notes"
                    name="substrate_notes"
                    className="form-input"
                    rows="2"
                    placeholder="Besonderheiten bei der Zubereitung, Sterilisation, Beobachtungen..."
                  ></textarea>
                </div>

                {/* Flexibles Foto-Upload für Substrat-Phase */}
                <div className="form-group form-group--full">
                  <label className="form-label">
                    📸 Fotos - Substrat Wachstumsphase
                  </label>
                  <div className="flexible-photo-upload" data-phase="substrate">
                    <div className="photo-upload-grid" id="substrate-photos">
                      {/* Dynamically added photo slots will go here */}
                    </div>
                    <button type="button" onclick="addPhotoSlot('substrate', 'Substrat-Phase')" className="btn btn-glass add-photo-btn">
                      📷 Foto hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. FRUCHTUNGSPHASE */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                🍄 Fruchtungsphase
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="fruiting_start_date" className="form-label">
                    Fruchtungs-Startdatum
                  </label>
                  <input
                    type="date"
                    id="fruiting_start_date"
                    name="fruiting_start_date"
                    className="form-input"
                  />
                  <p className="form-help">
                    Wann wurde die Fruchtungsphase eingeleitet?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="fruiting_trigger" className="form-label">
                    Fruchtungs-Auslöser
                  </label>
                  <div className="dropdown-with-manage">
                    <select id="fruiting_trigger" name="fruiting_trigger" className="form-input">
                      <option value="">Auslöser auswählen...</option>
                      <option value="temperature_shock">Temperaturschock</option>
                      <option value="humidity_increase">Luftfeuchtigkeit erhöhen</option>
                      <option value="light_exposure">Lichtexposition</option>
                      <option value="air_exchange">Luftaustausch</option>
                      <option value="cold_water">Kaltes Wasser</option>
                      <option value="scratching">Anritzen</option>
                    </select>
                    <button type="button" onclick="manageDropdown('fruiting_triggers')" className="manage-btn">
                      ⚙️ Verwalten
                    </button>
                  </div>
                  <p className="form-help">
                    Womit wurde die Fruchtung ausgelöst?
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="fruiting_temp_min" className="form-label">
                    Fruchtungs-Temperatur Min. (°C)
                  </label>
                  <input
                    type="number"
                    id="fruiting_temp_min"
                    name="fruiting_temp_min"
                    className="form-input"
                    placeholder="15"
                    step="0.5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fruiting_temp_max" className="form-label">
                    Fruchtungs-Temperatur Max. (°C)
                  </label>
                  <input
                    type="number"
                    id="fruiting_temp_max"
                    name="fruiting_temp_max"
                    className="form-input"
                    placeholder="20"
                    step="0.5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fruiting_humidity_min" className="form-label">
                    Luftfeuchtigkeit Min. (%)
                  </label>
                  <input
                    type="number"
                    id="fruiting_humidity_min"
                    name="fruiting_humidity_min"
                    className="form-input"
                    placeholder="85"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fruiting_humidity_max" className="form-label">
                    Luftfeuchtigkeit Max. (%)
                  </label>
                  <input
                    type="number"
                    id="fruiting_humidity_max"
                    name="fruiting_humidity_max"
                    className="form-input"
                    placeholder="95"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="light_hours" className="form-label">
                    Belichtungszeit (h/Tag)
                  </label>
                  <input
                    type="number"
                    id="light_hours"
                    name="light_hours"
                    className="form-input"
                    placeholder="12"
                    min="0"
                    max="24"
                  />
                  <p className="form-help">
                    Stunden Licht pro Tag während Fruchtung
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="air_exchange_rate" className="form-label">
                    Luftaustausch-Rate
                  </label>
                  <select id="air_exchange_rate" name="air_exchange_rate" className="form-input">
                    <option value="">Rate auswählen...</option>
                    <option value="low">Niedrig (1-2x/Tag)</option>
                    <option value="medium">Mittel (3-4x/Tag)</option>
                    <option value="high">Hoch (5+x/Tag)</option>
                    <option value="continuous">Kontinuierlich</option>
                  </select>
                  <p className="form-help">
                    Wie oft wird die Luft ausgetauscht?
                  </p>
                </div>

                <div className="form-group form-group--full">
                  <label htmlFor="fruiting_observations" className="form-label">
                    Beobachtungen Fruchtungsphase
                  </label>
                  <textarea
                    id="fruiting_observations"
                    name="fruiting_observations"
                    className="form-input"
                    rows="3"
                    placeholder="Pinning, Entwicklung der Fruchtkörper, Besonderheiten, Probleme..."
                  ></textarea>
                </div>

                {/* Flexibles Foto-Upload für Fruchtungs-Phase */}
                <div className="form-group form-group--full">
                  <label className="form-label">
                    📸 Fotos - Fruchtungsphase
                  </label>
                  <div className="flexible-photo-upload" data-phase="fruiting">
                    <div className="photo-upload-grid" id="fruiting-photos">
                      {/* Dynamically added photo slots will go here */}
                    </div>
                    <button type="button" onclick="addPhotoSlot('fruiting', 'Fruchtungs-Phase')" className="btn btn-glass add-photo-btn">
                      📷 Foto hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. ERTRÄGE */}
            <div className="glass-card">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                ⚖️ Erträge & Harvest-Tracking
              </h2>
              
              <div className="harvest-tracker">
                <div className="harvest-summary mb-4">
                  <div className="summary-grid">
                    <div className="summary-item">
                      <label>Gesamtertrag:</label>
                      <span id="total_yield" className="yield-value">0 g</span>
                    </div>
                    <div className="summary-item">
                      <label>Anzahl Ernten:</label>
                      <span id="harvest_count" className="yield-value">0</span>
                    </div>
                    <div className="summary-item">
                      <label>Biological Efficiency (BE%):</label>
                      <span id="biological_efficiency" className="yield-value">0%</span>
                    </div>
                    <div className="summary-item">
                      <label>Ø Ertrag pro Ernte:</label>
                      <span id="average_harvest" className="yield-value">0 g</span>
                    </div>
                  </div>
                </div>

                <div className="harvest-entries">
                  <h3 className="text-md font-semibold mb-3">Einzelne Ernten:</h3>
                  
                  {/* Erste Ernte (Template) */}
                  <div className="harvest-entry" id="harvest_1">
                    <div className="harvest-header">
                      <h4>🍄 1. Ernte (Erste Flush)</h4>
                      <button type="button" onclick="removeHarvest(1)" className="remove-harvest">✕</button>
                    </div>
                    
                    <div className="harvest-fields">
                      <div className="form-group">
                        <label htmlFor="harvest_1_date" className="form-label">
                          Erntedatum
                        </label>
                        <input
                          type="date"
                          id="harvest_1_date"
                          name="harvests[0][date]"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="harvest_1_weight" className="form-label">
                          Gewicht (g)
                        </label>
                        <input
                          type="number"
                          id="harvest_1_weight"
                          name="harvests[0][weight_g]"
                          className="form-input harvest-weight"
                          placeholder="0"
                          min="0"
                          step="0.1"
                          onchange="calculateYield()"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="harvest_1_quality" className="form-label">
                          Qualität
                        </label>
                        <select id="harvest_1_quality" name="harvests[0][quality]" className="form-input">
                          <option value="">Bewertung...</option>
                          <option value="excellent">Exzellent</option>
                          <option value="good">Gut</option>
                          <option value="average">Durchschnitt</option>
                          <option value="poor">Schwach</option>
                        </select>
                      </div>

                      <div className="form-group form-group--full">
                        <label htmlFor="harvest_1_notes" className="form-label">
                          Notizen zur Ernte
                        </label>
                        <textarea
                          id="harvest_1_notes"
                          name="harvests[0][notes]"
                          className="form-input"
                          rows="2"
                          placeholder="Größe, Form, Farbe, Besonderheiten..."
                        ></textarea>
                      </div>

                      <div className="form-group form-group--full">
                        <label className="form-label">
                          📸 Fotos - Ernte
                        </label>
                        <div className="flexible-photo-upload" data-phase="harvest">
                          <div className="photo-upload-grid" id="harvest-1-photos">
                            {/* Dynamically added photo slots will go here */}
                          </div>
                          <button type="button" onclick="addPhotoSlot('harvest-1', 'Erste Ernte')" className="btn btn-glass add-photo-btn">
                            📷 Foto hinzufügen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="add-harvest-section">
                    <button type="button" onclick="addHarvest()" className="btn btn-glass w-full">
                      ➕ Weitere Ernte hinzufügen
                    </button>
                  </div>
                </div>

                <div className="expected-yield mt-4">
                  <div className="form-group">
                    <label htmlFor="expected_total_yield" className="form-label">
                      Erwarteter Gesamtertrag (g)
                    </label>
                    <input
                      type="number"
                      id="expected_total_yield"
                      name="expected_total_yield"
                      className="form-input"
                      placeholder="300"
                      min="0"
                    />
                    <p className="form-help">
                      Geschätzte Gesamtmenge für alle Ernten
                    </p>
                  </div>
                </div>
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
