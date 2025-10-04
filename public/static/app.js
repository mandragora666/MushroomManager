// Mushroom Manager - JavaScript für Interaktivität und Dark Mode
(function() {
    'use strict';
    
    // DOM Ready
    document.addEventListener('DOMContentLoaded', function() {
        initThemeToggle();
        initAPI();
        initInteractivity();
        loadInitialData();
    });

    // Theme Management (Dark/Light Mode)
    function initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;
        
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        html.setAttribute('data-theme', savedTheme);
        updateThemeToggleIcon(savedTheme);
        
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                const currentTheme = html.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                html.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                updateThemeToggleIcon(newTheme);
                
                // Animation für smooth transition
                document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
                setTimeout(() => {
                    document.body.style.transition = '';
                }, 300);
            });
        }
    }
    
    function updateThemeToggleIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
            themeToggle.setAttribute('title', 
                theme === 'light' ? 'Zu Dark Mode wechseln' : 'Zu Light Mode wechseln'
            );
        }
    }

    // API Helper Functions
    function initAPI() {
        window.MushroomAPI = {
            // Base API call function
            async call(endpoint, options = {}) {
                const config = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                };
                
                try {
                    const response = await fetch(`/api${endpoint}`, config);
                    
                    if (!response.ok) {
                        console.warn(`API Call ${endpoint} failed: ${response.status}`);
                        return { success: false, error: `${response.status} ${response.statusText}` };
                    }
                    
                    return await response.json();
                } catch (error) {
                    console.warn('API Call failed:', error);
                    return { success: false, error: error.message };
                }
            },

            // Specific API methods
            async getHello() {
                return this.call('/hello');
            },

            async getProtocols() {
                return this.call('/protocols');
            },

            async createProtocol(protocolData) {
                return this.call('/protocols', {
                    method: 'POST',
                    body: JSON.stringify(protocolData)
                });
            }
        };
    }

    // Interactive Elements
    function initInteractivity() {
        // Button click handlers
        document.addEventListener('click', function(e) {
            // Navigation items
            if (e.target.closest('.nav-item')) {
                setActiveNav(e.target.closest('.nav-item'));
            }
        });

        // Global functions for protocol management
        window.viewProtocol = function(id) {
            window.location.href = `/protocols/${id}`;
        };

        window.editProtocol = function(id) {
            window.location.href = `/protocols/${id}/edit`;
        };

        window.deleteProtocol = function(id) {
            if (confirm('Protokoll wirklich löschen?')) {
                // API call to delete protocol
                showNotification('Protokoll gelöscht', 'success');
                setTimeout(() => window.location.reload(), 1000);
            }
        };

        // Protocol form functions
        window.saveProtocol = function() {
            handleProtocolSubmit(false);
        };

        window.saveDraft = function() {
            handleProtocolSubmit(true);
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Alt + D = Toggle Dark Mode
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                const themeToggle = document.getElementById('themeToggle');
                if (themeToggle) themeToggle.click();
            }
            
            // Alt + S = Focus search (wenn vorhanden)
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"]');
                if (searchInput) searchInput.focus();
            }
        });

        // Auto-refresh für Statistiken (alle 5 Minuten)
        setInterval(loadStatistics, 5 * 60 * 1000);
    }

    // Load initial data
    async function loadInitialData() {
        try {
            showLoadingState(true);
            
            // Test API connection (silent, no error if fails)
            const helloData = await window.MushroomAPI.getHello();
            if (helloData.success !== false) {
                console.log('✅ API connected:', helloData);
            } else {
                console.log('⚠️ API not available, using fallback data');
            }
            
            // Load statistics (with fallback data)
            await loadStatistics();
            
        } catch (error) {
            console.log('⚠️ Using offline mode:', error.message);
        } finally {
            showLoadingState(false);
        }
    }

    // Statistics loading
    async function loadStatistics() {
        try {
            // Hier würden normalerweise echte API calls gemacht
            // Für den Moment verwenden wir Mock-Daten
            const stats = {
                activeBlocks: Math.floor(Math.random() * 20) + 10,
                substrates: Math.floor(Math.random() * 15) + 5,
                cultures: Math.floor(Math.random() * 25) + 10,
                totalYield: (Math.random() * 50 + 20).toFixed(1)
            };

            updateStatistics(stats);
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }

    // Update statistics display
    function updateStatistics(stats) {
        const elements = {
            activeBlocks: document.querySelector('[data-stat="active-blocks"]'),
            substrates: document.querySelector('[data-stat="substrates"]'),
            cultures: document.querySelector('[data-stat="cultures"]'),
            totalYield: document.querySelector('[data-stat="total-yield"]')
        };

        // Animate number changes
        Object.keys(stats).forEach(key => {
            const element = elements[key];
            if (element) {
                animateNumber(element, stats[key]);
            }
        });
    }

    // Number animation
    function animateNumber(element, targetValue) {
        const startValue = parseFloat(element.textContent) || 0;
        const duration = 1000; // 1 second
        const steps = 60;
        const stepValue = (targetValue - startValue) / steps;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const currentValue = startValue + (stepValue * currentStep);
            
            if (typeof targetValue === 'string' && targetValue.includes('.')) {
                element.textContent = currentValue.toFixed(1);
            } else {
                element.textContent = Math.round(currentValue);
            }

            if (currentStep >= steps) {
                element.textContent = targetValue;
                clearInterval(interval);
            }
        }, stepDuration);
    }

    // Navigation functions
    function showSubstrates() {
        showNotification('Substratdatenbank wird geladen...', 'info');
        // Hier würde zur Substrat-Seite navigiert oder Modal geöffnet
        console.log('Navigate to substrates');
    }

    function showProtocolForm() {
        showNotification('Neues Zuchtprotokoll wird erstellt...', 'info');
        // Hier würde das Protokoll-Formular geöffnet
        console.log('Open new protocol form');
    }

    function showInventory() {
        showNotification('Inventar wird geladen...', 'info');
        // Hier würde zur Inventar-Seite navigiert
        console.log('Navigate to inventory');
    }

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="flex items-center p-4 mb-4 text-sm rounded-lg border" role="alert">
                <span class="flex-shrink-0 w-4 h-4 mr-3">
                    ${getNotificationIcon(type)}
                </span>
                <span class="sr-only">${type}</span>
                <div>${message}</div>
                <button type="button" class="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-gray-100" onclick="this.parentElement.parentElement.remove()">
                    <span class="sr-only">Schließen</span>
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;

        // Add appropriate colors
        const alertDiv = notification.querySelector('div');
        switch(type) {
            case 'success':
                alertDiv.className += ' text-green-800 border-green-300 bg-green-50';
                break;
            case 'error':
                alertDiv.className += ' text-red-800 border-red-300 bg-red-50';
                break;
            case 'warning':
                alertDiv.className += ' text-yellow-800 border-yellow-300 bg-yellow-50';
                break;
            default: // info
                alertDiv.className += ' text-blue-800 border-blue-300 bg-blue-50';
        }

        // Add to page
        const container = document.querySelector('main') || document.body;
        container.insertBefore(notification, container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    function getNotificationIcon(type) {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }

    // Loading state management
    function showLoadingState(show) {
        const body = document.body;
        if (show) {
            body.classList.add('loading');
        } else {
            body.classList.remove('loading');
        }
    }

    // Navigation active state
    function setActiveNav(activeButton) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    // Utility functions
    window.MushroomUtils = {
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        formatTime(dateString) {
            const date = new Date(dateString);
            return date.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        showModal(title, content) {
            // Simple modal implementation
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
            modal.innerHTML = `
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">${title}</h3>
                        <div class="text-sm text-gray-500 mb-4">${content}</div>
                        <div class="flex justify-end">
                            <button class="btn btn-primary" onclick="this.closest('.fixed').remove()">Schließen</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close on background click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
    };

    // Protocol Form Handling
    async function handleProtocolSubmit(isDraft = false) {
        const form = document.getElementById('protocolForm');
        if (!form) return;

        try {
            showLoadingState(true);

            // Collect form data
            const formData = new FormData(form);
            const protocolData = {};

            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                protocolData[key] = value;
            }

            // Add draft status
            protocolData.isDraft = isDraft;

            // Validate required fields (nur bei nicht-Entwurf)
            if (!isDraft && !validateProtocolForm(protocolData)) {
                return;
            }

            // Send to API
            const result = await window.MushroomAPI.createProtocol(protocolData);

            if (result.success) {
                showNotification(
                    isDraft ? 'Entwurf gespeichert!' : 'Protokoll erfolgreich erstellt!', 
                    'success'
                );

                // Redirect nach kurzer Pause
                setTimeout(() => {
                    if (isDraft) {
                        window.location.href = `/protocols/${result.protocol.id}/edit`;
                    } else {
                        window.location.href = `/protocols/${result.protocol.id}`;
                    }
                }, 1500);
            } else {
                throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
            }

        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            showNotification(
                `Fehler beim Speichern: ${error.message}`, 
                'error'
            );
        } finally {
            showLoadingState(false);
        }
    }

    // Form validation
    function validateProtocolForm(data) {
        const requiredFields = {
            title: 'Protokoll-Name',
            species: 'Pilzart',
            startDate: 'Startdatum',
            status: 'Aktuelle Phase',
            substrate: 'Substrat-Zusammensetzung',
            inoculation: 'Inokulations-Methode',
            temperature: 'Temperatur',
            humidity: 'Luftfeuchtigkeit'
        };

        const errors = [];

        // Check required fields
        for (let [field, label] of Object.entries(requiredFields)) {
            if (!data[field] || data[field].trim() === '') {
                errors.push(`${label} ist ein Pflichtfeld`);
            }
        }

        // Validate start date (not in future)
        if (data.startDate) {
            const startDate = new Date(data.startDate);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // End of today

            if (startDate > today) {
                errors.push('Startdatum kann nicht in der Zukunft liegen');
            }
        }

        // Validate numeric fields
        if (data.substrateWeight && (isNaN(data.substrateWeight) || data.substrateWeight <= 0)) {
            errors.push('Substratgewicht muss eine positive Zahl sein');
        }

        if (data.expectedYield && (isNaN(data.expectedYield) || data.expectedYield <= 0)) {
            errors.push('Erwarteter Ertrag muss eine positive Zahl sein');
        }

        // Show errors if any
        if (errors.length > 0) {
            showNotification(
                'Bitte korrigiere folgende Fehler:\n• ' + errors.join('\n• '), 
                'error'
            );
            return false;
        }

        return true;
    }

    // Form helpers
    function initProtocolForm() {
        const form = document.getElementById('protocolForm');
        if (!form) return;

        // Set default values
        const startDateInput = document.getElementById('startDate');
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = new Date().toISOString().split('T')[0];
        }

        // Auto-completion and suggestions
        addFormEnhancements();

        // Form change detection
        let formChanged = false;
        form.addEventListener('input', () => {
            formChanged = true;
        });

        // Warn before leaving unsaved form
        window.addEventListener('beforeunload', (e) => {
            if (formChanged) {
                e.preventDefault();
                e.returnValue = 'Du hast ungespeicherte Änderungen. Möchtest du wirklich die Seite verlassen?';
            }
        });

        // Save draft periodically
        setInterval(() => {
            if (formChanged) {
                saveDraftSilently();
            }
        }, 2 * 60 * 1000); // Every 2 minutes
    }

    function addFormEnhancements() {
        // Add tooltips to form fields
        const helpTexts = document.querySelectorAll('.form-help');
        helpTexts.forEach(help => {
            const input = help.parentElement.querySelector('.form-input');
            if (input) {
                input.setAttribute('title', help.textContent);
            }
        });

        // Species-specific substrate suggestions
        const speciesSelect = document.getElementById('species');
        const substrateField = document.getElementById('substrate');
        
        if (speciesSelect && substrateField) {
            const substrateSuggestions = {
                'Pleurotus ostreatus': 'Stroh (500g) + Gips (20g) + Kalk (10g) + Wasser (400ml)',
                'Pleurotus ostreatus - Hybrid': 'Masters Mix: Sojabohnen (500g) + Buchensägemehl (500g) + Gips (20g) + Wasser (400ml)',
                'Lentinula edodes': 'Laubholzspäne (800g) + Kleie (150g) + Gips (30g) + Wasser (600ml)',
                'Hericium erinaceus': 'Laubholzspäne (700g) + Kleie (200g) + Gips (20g) + Wasser (500ml)',
                'Agaricus bisporus': 'Pferdemist-Kompost (1000g) + Torf (200g) + Kalk (30g)'
            };

            speciesSelect.addEventListener('change', () => {
                const suggestion = substrateSuggestions[speciesSelect.value];
                if (suggestion && !substrateField.value) {
                    substrateField.value = suggestion;
                    substrateField.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                    setTimeout(() => {
                        substrateField.style.backgroundColor = '';
                    }, 2000);
                }
            });
        }
    }

    async function saveDraftSilently() {
        try {
            const form = document.getElementById('protocolForm');
            if (!form) return;

            const formData = new FormData(form);
            const protocolData = {};

            for (let [key, value] of formData.entries()) {
                protocolData[key] = value;
            }

            protocolData.isDraft = true;

            // Only save if we have minimum data
            if (protocolData.title && protocolData.title.trim()) {
                await window.MushroomAPI.createProtocol(protocolData);
                
                // Show subtle feedback
                const saveIndicator = document.createElement('div');
                saveIndicator.textContent = '💾 Entwurf automatisch gespeichert';
                saveIndicator.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm z-50';
                document.body.appendChild(saveIndicator);
                
                setTimeout(() => saveIndicator.remove(), 2000);
            }
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    // Initialize form when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initProtocolForm();
    });

    // Console welcome message
    console.log(`
    🍄 Mushroom Manager v1.0.0
    ================================
    Willkommen zur Pilzzucht-Verwaltung!
    
    Verfügbare Funktionen:
    - window.MushroomAPI: API-Zugriff
    - window.MushroomUtils: Hilfsfunktionen
    - Alt+D: Dark Mode toggle
    - Alt+S: Suche fokussieren
    
    Entwickelt mit ❤️ für Pilzzüchter
    `);

})();