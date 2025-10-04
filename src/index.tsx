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

export default app
