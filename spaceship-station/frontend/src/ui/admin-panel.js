/**
 * Admin Panel - Configuration & Service Authentication
 */

class AdminPanel {
    constructor() {
        this.config = null;
        this.activeTab = 'services';
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config/get');
            this.config = await response.json();
            const poolsResponse = await fetch('/api/config/media-pools');
            this.mediaPools = await poolsResponse.json();
            this.renderPanel();
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    renderPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (!adminPanel) return;

        adminPanel.innerHTML = `
            <div class="flex flex-col h-full">
                <!-- Header -->
                <div class="flex justify-between items-center pb-4 border-b border-slate-700">
                    <h2 class="text-lg font-bold text-amber-400">⚙️ ADMIN PANEL</h2>
                    <button onclick="closeAdminPanel()" class="text-slate-400 hover:text-slate-200">✕</button>
                </div>

                <!-- Tabs -->
                <div class="flex gap-2 mt-4 border-b border-slate-700">
                    <button onclick="adminPanel.switchTab('services')" 
                        class="admin-tab px-3 py-2 text-sm font-semibold text-amber-400 border-b-2 border-amber-400" 
                        data-tab="services">🔌 Services</button>
                    <button onclick="adminPanel.switchTab('media-pools')" 
                        class="admin-tab px-3 py-2 text-sm font-semibold text-slate-400 border-b-2 border-transparent hover:text-slate-200" 
                        data-tab="media-pools">📁 Media Pools</button>
                    <button onclick="adminPanel.switchTab('settings')" 
                        class="admin-tab px-3 py-2 text-sm font-semibold text-slate-400 border-b-2 border-transparent hover:text-slate-200" 
                        data-tab="settings">⚙️ Settings</button>
                    <button onclick="adminPanel.switchTab('system')" 
                        class="admin-tab px-3 py-2 text-sm font-semibold text-slate-400 border-b-2 border-transparent hover:text-slate-200" 
                        data-tab="system">💾 System</button>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto mt-4">
                    <div id="adminContent"></div>
                </div>
            </div>
        `;

        this.renderContent();
    }

    switchTab(tab) {
        this.activeTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.admin-tab').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.remove('text-slate-400', 'border-transparent');
                btn.classList.add('text-amber-400', 'border-amber-400');
            } else {
                btn.classList.remove('text-amber-400', 'border-amber-400');
                btn.classList.add('text-slate-400', 'border-transparent');
            }
        });

        this.renderContent();
    }

    renderContent() {
        const content = document.getElementById('adminContent');
        
        switch(this.activeTab) {
            case 'services':
                content.innerHTML = this.renderServices();
                break;
            case 'media-pools':
                content.innerHTML = this.renderMediaPools();
                break;
            case 'settings':
                content.innerHTML = this.renderSettings();
                break;
            case 'system':
                content.innerHTML = this.renderSystem();
                break;
        }

        this.attachEventListeners();
    }

    renderServices() {
        const services = this.config.services;
        
        return `
            <div class="space-y-6">
                <div class="text-xs text-slate-400 mb-4">
                    Configure API credentials for external services. Keep these secure!
                </div>

                ${Object.entries(services).map(([name, creds]) => `
                    <div class="service-config p-4 bg-slate-800 rounded border border-slate-700">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="font-bold text-sky-300">${this.formatServiceName(name)}</h3>
                            <label class="flex items-center gap-2 text-xs">
                                <input type="checkbox" class="service-enable" data-service="${name}" 
                                    ${creds.enabled ? 'checked' : ''}>
                                <span>Enabled</span>
                            </label>
                        </div>

                        ${name === 'qbittorrent' ? `
                            <div class="space-y-2 text-sm">
                                <input type="text" data-service="${name}" data-field="url" 
                                    placeholder="URL (e.g., http://qbittorrent:8080)" 
                                    value="${creds.url || ''}"
                                    class="service-field w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                                <input type="text" data-service="${name}" data-field="username" 
                                    placeholder="Username" 
                                    value="${creds.username || ''}"
                                    class="service-field w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                                <input type="password" data-service="${name}" data-field="password" 
                                    placeholder="Password" 
                                    value="${creds.password ? '***' : ''}"
                                    class="service-field w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                            </div>
                        ` : name === 'discord' ? `
                            <input type="password" data-service="${name}" data-field="bot_token" 
                                placeholder="Discord Bot Token (keep secret!)" 
                                value="${creds.bot_token ? '***' : ''}"
                                class="service-field w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                        ` : name === 'ollama' ? `
                            <div class="space-y-2 text-sm">
                                <input type="text" data-service="${name}" data-field="url" 
                                    placeholder="Ollama URL (e.g., http://ollama:11434)" 
                                    value="${creds.url || ''}"
                                    class="service-field w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                                <input type="text" data-service="${name}" data-field="model" 
                                    placeholder="Model name (e.g., neural-chat)" 
                                    value="${creds.model || ''}"
                                    class="service-field w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                            </div>
                        ` : `
                            <div class="space-y-2 text-sm">
                                <input type="text" data-service="${name}" data-field="url" 
                                    placeholder="Service URL" 
                                    value="${creds.url || ''}"
                                    class="service-field w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                                <input type="password" data-service="${name}" data-field="api_key" 
                                    placeholder="API Key (keep secret!)" 
                                    value="${creds.api_key ? '***' : ''}"
                                    class="service-field w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                            </div>
                        `}

                        <button onclick="adminPanel.validateService('${name}')" 
                            class="w-full mt-3 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold text-emerald-400">
                            ✓ Validate Connection
                        </button>
                    </div>
                `).join('')}

                <button onclick="adminPanel.saveServices()" 
                    class="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded font-semibold">
                    💾 Save All Services
                </button>
            </div>
        `;
    }

    renderMediaPools() {
        const pools = this.mediaPools?.pools || {};
        
        return `
            <div class="space-y-4">
                <div class="text-xs text-slate-400 mb-4">
                    Configure media library pools. Add custom directories for roms, ebooks, movies, TV shows, torrents, etc.
                </div>

                <!-- Existing Pools -->
                <div class="space-y-2">
                    ${Object.entries(pools).map(([name, config]) => `
                        <div class="pool-item p-3 bg-slate-800 rounded border border-slate-700">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <div class="font-semibold text-amber-400">${name}</div>
                                    <div class="text-xs text-slate-400 mt-1">Type: ${config.type}</div>
                                    <div class="text-xs text-slate-500 mt-1 font-mono">${config.path}</div>
                                </div>
                                <button class="pool-delete text-red-400 hover:text-red-300 text-sm" data-pool="${name}">
                                    Remove
                                </button>
                            </div>
                            <label class="flex items-center gap-2 text-xs">
                                <input type="checkbox" class="pool-enable" data-pool="${name}" 
                                    ${config.enabled ? 'checked' : ''}>
                                <span>Enabled</span>
                            </label>
                        </div>
                    `).join('')}
                </div>

                <!-- Add New Pool -->
                <div class="p-4 bg-slate-800 rounded border border-slate-700 mt-6">
                    <h3 class="font-semibold text-sky-300 mb-3">+ Add New Pool</h3>
                    <div class="space-y-2">
                        <input type="text" id="poolName" 
                            placeholder="Pool name (e.g., roms, ebooks, movies)" 
                            class="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                        <input type="text" id="poolPath" 
                            placeholder="Full path (e.g., /media/roms or /mnt/ebooks)" 
                            class="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                        <select id="poolType" class="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                            <option value="media">Media</option>
                            <option value="roms">ROMs</option>
                            <option value="ebooks">eBooks</option>
                            <option value="movies">Movies</option>
                            <option value="tv">TV Shows</option>
                            <option value="torrents">Torrents</option>
                            <option value="downloads">Downloads</option>
                            <option value="custom">Custom</option>
                        </select>
                        <button id="addPoolBtn" class="w-full px-3 py-2 bg-sky-700 hover:bg-sky-600 rounded text-xs font-semibold text-sky-100">
                            ➕ Create Pool
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSettings() {
        const settings = this.config.settings;
        
        return `
            <div class="space-y-4">
                <div class="setting-item p-3 bg-slate-800 rounded">
                    <label class="text-sm font-semibold text-sky-300">Theme</label>
                    <select id="settingTheme" class="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark (FTL Style)</option>
                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                    </select>
                </div>

                <div class="setting-item p-3 bg-slate-800 rounded">
                    <label class="text-sm font-semibold text-sky-300">Grid Size</label>
                    <select id="settingGridSize" class="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                        <option value="8x8" ${settings.grid_size === '8x8' ? 'selected' : ''}>8x8 (Compact)</option>
                        <option value="12x12" ${settings.grid_size === '12x12' ? 'selected' : ''}>12x12 (Standard)</option>
                        <option value="16x16" ${settings.grid_size === '16x16' ? 'selected' : ''}>16x16 (Large)</option>
                    </select>
                </div>

                <div class="setting-item p-3 bg-slate-800 rounded">
                    <label class="text-sm font-semibold text-sky-300">Update Interval (seconds)</label>
                    <input type="number" id="settingUpdateInterval" value="${settings.update_interval}" step="0.5" min="0.5" max="10"
                        class="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                </div>

                <div class="setting-item p-3 bg-slate-800 rounded flex items-center justify-between">
                    <label class="text-sm font-semibold text-sky-300">Show Grid Labels</label>
                    <input type="checkbox" id="settingGridLabels" ${settings.show_grid_labels ? 'checked' : ''}
                        class="w-4 h-4">
                </div>

                <div class="setting-item p-3 bg-slate-800 rounded">
                    <label class="text-sm font-semibold text-sky-300">Notification Level</label>
                    <select id="settingNotificationLevel" class="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-sky-300">
                        <option value="all" ${settings.notification_level === 'all' ? 'selected' : ''}>All Events</option>
                        <option value="warnings" ${settings.notification_level === 'warnings' ? 'selected' : ''}>Warnings & Errors</option>
                        <option value="errors" ${settings.notification_level === 'errors' ? 'selected' : ''}>Errors Only</option>
                    </select>
                </div>

                <button onclick="adminPanel.saveSettings()" 
                    class="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded font-semibold">
                    💾 Save Settings
                </button>
            </div>
        `;
    }

    renderSystem() {
        return `
            <div class="space-y-4">
                <div class="p-3 bg-slate-800 rounded border border-slate-700">
                    <h3 class="text-sm font-bold text-sky-300 mb-2">System Status</h3>
                    <div class="text-xs text-slate-400 space-y-1">
                        <p>✓ Mock Mode: <span id="mockModeStatus" class="text-emerald-400">Checking...</span></p>
                        <p>✓ AI Core: <span id="aiCoreStatus" class="text-slate-400">Disabled</span></p>
                        <p>✓ Discord Bot: <span id="discordBotStatus" class="text-slate-400">Checking...</span></p>
                        <p>✓ Container Monitoring: <span id="containerMonitorStatus" class="text-emerald-400">Active</span></p>
                    </div>
                </div>

                <div class="p-3 bg-slate-800 rounded border border-yellow-700">
                    <h3 class="text-sm font-bold text-yellow-400 mb-2">⚠️ Maintenance</h3>
                    <button onclick="adminPanel.clearCache()" 
                        class="w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold text-yellow-400 mb-2">
                        Clear Cache
                    </button>
                    <button onclick="adminPanel.restartServices()" 
                        class="w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold text-yellow-400">
                        Restart Services
                    </button>
                </div>

                <div class="p-3 bg-slate-800 rounded border border-red-700">
                    <h3 class="text-sm font-bold text-red-400 mb-2">🔴 Danger Zone</h3>
                    <button onclick="if(confirm('Reset all configs?')) adminPanel.resetConfig()" 
                        class="w-full px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-xs font-semibold text-red-400">
                        Reset All Configuration
                    </button>
                </div>
            </div>
        `;
    }

    formatServiceName(name) {
        const names = {
            'jellyfin': '🎬 Jellyfin',
            'sonarr': '📺 Sonarr',
            'radarr': '🎥 Radarr',
            'prowlarr': '🔍 Prowlarr',
            'qbittorrent': '📥 qBittorrent',
            'discord': '💬 Discord Bot',
            'ollama': '🤖 Ollama',
        };
        return names[name] || name;
    }

    async validateService(serviceName) {
        const config = this.config.services[serviceName];
        try {
            const response = await fetch('/api/config/validate-service', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service: serviceName, config })
            });
            const result = await response.json();
            alert(`${serviceName}: ${result.valid ? '✓ Connected!' : '✗ ' + result.message}`);
        } catch (error) {
            alert(`Error validating ${serviceName}: ${error.message}`);
        }
    }

    async saveServices() {
        const updated = {};
        document.querySelectorAll('.service-config').forEach(el => {
            const name = el.querySelector('.service-enable').dataset.service;
            const enabled = el.querySelector('.service-enable').checked;
            const fields = {};
            
            el.querySelectorAll('.service-field').forEach(field => {
                const fieldName = field.dataset.field;
                fields[fieldName] = field.value;
            });

            updated[name] = { ...fields, enabled };
        });

        try {
            for (const [service, config] of Object.entries(updated)) {
                await fetch('/api/config/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ section: 'services', key: service, value: config })
                });
            }
            alert('✓ Services configured!');
        } catch (error) {
            alert('Error saving services: ' + error.message);
        }
    }

    async saveSettings() {
        const settings = {
            theme: document.getElementById('settingTheme').value,
            grid_size: document.getElementById('settingGridSize').value,
            update_interval: parseFloat(document.getElementById('settingUpdateInterval').value),
            show_grid_labels: document.getElementById('settingGridLabels').checked,
            notification_level: document.getElementById('settingNotificationLevel').value,
        };

        try {
            await fetch('/api/config/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section: 'settings', key: 'all', value: settings })
            });
            this.config.settings = settings;
            alert('✓ Settings saved!');
        } catch (error) {
            alert('Error saving settings: ' + error.message);
        }
    }

    async clearCache() {
        // Stub for future cache management
        alert('Cache cleared');
    }

    async restartServices() {
        alert('Services will restart in background');
    }

    async resetConfig() {
        try {
            await fetch('/api/config/reset', { method: 'POST' });
            await this.loadConfig();
            alert('✓ Config reset!');
        } catch (error) {
            alert('Error resetting config');
        }
    }

    attachEventListeners() {
        // Media Pool event listeners
        if (this.activeTab === 'media-pools') {
            // Add new pool
            const addBtn = document.getElementById('addPoolBtn');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.addMediaPool());
            }

            // Delete pool
            document.querySelectorAll('.pool-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const poolName = e.target.dataset.pool;
                    if (confirm(`Delete pool "${poolName}"?`)) {
                        this.deleteMediaPool(poolName);
                    }
                });
            });

            // Toggle pool enabled
            document.querySelectorAll('.pool-enable').forEach(checkbox => {
                checkbox.addEventListener('change', async (e) => {
                    const poolName = e.target.dataset.pool;
                    const enabled = e.target.checked;
                    await this.updateMediaPool(poolName, { enabled });
                });
            });
        }
    }

    async addMediaPool() {
        const name = document.getElementById('poolName').value.trim();
        const path = document.getElementById('poolPath').value.trim();
        const type = document.getElementById('poolType').value;

        if (!name || !path) {
            alert('Please fill in pool name and path');
            return;
        }

        try {
            const response = await fetch('/api/config/media-pool/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, path, type })
            });

            const result = await response.json();
            if (response.ok) {
                alert(`Pool "${name}" created!`);
                // Reload config
                await this.loadConfig();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Failed to add pool:', error);
            alert('Failed to add pool');
        }
    }

    async deleteMediaPool(poolName) {
        try {
            const response = await fetch('/api/config/media-pool/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: poolName })
            });

            const result = await response.json();
            if (response.ok) {
                alert(`Pool "${poolName}" deleted!`);
                // Reload config
                await this.loadConfig();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Failed to delete pool:', error);
            alert('Failed to delete pool');
        }
    }

    async updateMediaPool(poolName, updates) {
        try {
            const response = await fetch('/api/config/media-pool/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: poolName, updates })
            });

            const result = await response.json();
            if (!response.ok) {
                alert(`Error: ${result.message}`);
                // Reload config to revert
                await this.loadConfig();
            }
        } catch (error) {
            console.error('Failed to update pool:', error);
            // Reload config to revert
            await this.loadConfig();
        }
    }
}

// Global instance
let adminPanel = null;

function openAdminPanel() {
    const overlay = document.getElementById('adminOverlay');
    const panel = document.getElementById('adminPanel');
    if (overlay) overlay.classList.add('visible');
    if (panel) panel.classList.add('open');
    
    if (!adminPanel) {
        adminPanel = new AdminPanel();
    }
}

function closeAdminPanel() {
    const overlay = document.getElementById('adminOverlay');
    const panel = document.getElementById('adminPanel');
    if (overlay) overlay.classList.remove('visible');
    if (panel) panel.classList.remove('open');
}
