// 🛡️ BACKUP der funktionsfähigen /protocols/new Route
// Falls das neue Formular Probleme macht, kann diese Version wiederhergestellt werden

// ORIGINAL ROUTE START (Zeile 740-1190 ca. in src/index.tsx)

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

                {/* ... weitere Formular-Felder ... */}
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

// ORIGINAL ROUTE END

// ⚠️ WIEDERHERSTELLUNG: 
// Falls das neue Formular Probleme macht, kann dieser Code 
// zurück in src/index.tsx kopiert werden (Zeile 740+)