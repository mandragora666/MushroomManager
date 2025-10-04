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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              🍄 Mushroom Manager
            </h1>
            <button id="themeToggle" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              🌙
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {/* Statistics Cards */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktive Protokolle</p>
                  <p className="text-2xl font-bold text-gray-900" data-stat="protocols">${mockProtocols.length}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-lg">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Fruchtung</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-lg">🍄</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action - Neues Protokoll */}
          <div className="mb-6">
            <button 
              onclick="window.location.href = '/protocols/new'"
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span className="text-lg">➕</span>
              <span>Neues Zuchtprotokoll</span>
            </button>
          </div>

          {/* Aktuelle Protokolle */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              📋 Aktuelle Protokolle
            </h2>
            
            <div id="protocols-list" className="space-y-3">
              {mockProtocols.map(protocol => (
                <div key={protocol.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{protocol.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      protocol.status === 'Fruchtung' ? 'bg-green-100 text-green-800' :
                      protocol.status === 'Durchwachsung' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {protocol.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Art:</span> {protocol.species}</p>
                    <p><span className="font-medium">Phase:</span> {protocol.phase}</p>
                    <p><span className="font-medium">Temp:</span> {protocol.temperature}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Start: {protocol.startDate}</span>
                    <button 
                      onclick={`viewProtocol(${protocol.id})`}
                      className="text-blue-600 text-sm font-medium hover:text-blue-800"
                    >
                      Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around items-center">
          <button className="nav-item active flex flex-col items-center py-2 px-3">
            <span className="text-lg mb-1">🏠</span>
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button className="nav-item flex flex-col items-center py-2 px-3" onclick="window.location.href = '/protocols'">
            <span className="text-lg mb-1">📋</span>
            <span className="text-xs">Protokolle</span>
          </button>
          <button className="nav-item flex flex-col items-center py-2 px-3" onclick="window.location.href = '/protocols/new'">
            <span className="text-lg mb-1">➕</span>
            <span className="text-xs">Neu</span>
          </button>
          <button className="nav-item flex flex-col items-center py-2 px-3" onclick="window.location.href = '/wiki'">
            <span className="text-lg mb-1">📚</span>
            <span className="text-xs">Wiki</span>
          </button>
        </div>
      </nav>
    </div>
  )
})

// Protokoll-Liste Seite
app.get('/protocols', (c) => {
  return c.render(
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onclick="history.back()" className="p-2 hover:bg-gray-100 rounded-lg">
              ←
            </button>
            <h1 className="text-lg font-semibold">Zuchtprotokolle</h1>
          </div>
          <button onclick="window.location.href = '/protocols/new'" className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm">
            + Neu
          </button>
        </div>
      </header>

      <main className="px-4 py-6 pb-20">
        <div className="space-y-4">
          {mockProtocols.map(protocol => (
            <div key={protocol.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{protocol.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  protocol.status === 'Fruchtung' ? 'bg-green-100 text-green-800' :
                  protocol.status === 'Durchwachsung' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {protocol.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Pilzart</p>
                  <p className="font-medium">{protocol.species}</p>
                </div>
                <div>
                  <p className="text-gray-600">Substrat</p>
                  <p className="font-medium">{protocol.substrate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Start</p>
                  <p className="font-medium">{protocol.startDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phase</p>
                  <p className="font-medium">{protocol.phase}</p>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <button 
                  onclick={`viewProtocol(${protocol.id})`}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Details
                </button>
                <button 
                  onclick={`editProtocol(${protocol.id})`}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium"
                >
                  Bearbeiten
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <button className="nav-item flex flex-col items-center py-2 px-3" onclick="window.location.href = '/'">
            <span className="text-lg mb-1">🏠</span>
            <span className="text-xs">Dashboard</span>
          </button>
          <button className="nav-item active flex flex-col items-center py-2 px-3">
            <span className="text-lg mb-1">📋</span>
            <span className="text-xs font-medium">Protokolle</span>
          </button>
          <button className="nav-item flex flex-col items-center py-2 px-3" onclick="window.location.href = '/protocols/new'">
            <span className="text-lg mb-1">➕</span>
            <span className="text-xs">Neu</span>
          </button>
          <button className="nav-item flex flex-col items-center py-2 px-3">
            <span className="text-lg mb-1">📚</span>
            <span className="text-xs">Wiki</span>
          </button>
        </div>
      </nav>
    </div>
  )
})

export default app
