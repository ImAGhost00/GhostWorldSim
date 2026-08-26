/**
 * Settings Panel - User Preferences & Display Options
 */

class SettingsPanel {
    constructor() {
        this.config = null;
        this.init();
    }

    async init() {
        await this.loadConfig();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config/get');
            this.config = await response.json();
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    render() {
        const settings = this.config?.settings || {};
        
        return `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-lg font-bold text-cyan-400">⚙️ USER SETTINGS</h2>
                    <button onclick="closeSettingsPanel()" class="text-slate-400 hover:text-slate-200">✕</button>
                </div>

                <div class="space-y-6">
                    <!-- Display Settings -->
                    <div>
                        <h3 class="text-sm font-bold text-cyan-400 mb-4">🖥️ DISPLAY</h3>
                        
                        <div class="space-y-3">
                            <div class="flex items-center justify-between p-2 bg-slate-800 rounded">
                                <label class="text-xs text-slate-300">Grid Labels</label>
                                <input type="checkbox" id="gridLabelsToggle" 
                                    ${settings.show_grid_labels ? 'checked' : ''}
                                    onchange="settingsPanel.saveSetting('show_grid_labels', this.checked)"
                                    class="w-4 h-4 cursor-pointer">
                            </div>

                            <div class="flex items-center justify-between p-2 bg-slate-800 rounded">
                                <label class="text-xs text-slate-300">Real-time Animations</label>
                                <input type="checkbox" id="animationsToggle" checked
                                    onchange="settingsPanel.saveSetting('animations', this.checked)"
                                    class="w-4 h-4 cursor-pointer">
                            </div>

                            <div class="flex items-center justify-between p-2 bg-slate-800 rounded">
                                <label class="text-xs text-slate-300">Show Module Tooltips</label>
                                <input type="checkbox" id="tooltipsToggle" checked
                                    onchange="settingsPanel.saveSetting('tooltips', this.checked)"
                                    class="w-4 h-4 cursor-pointer">
                            </div>
                        </div>
                    </div>

                    <!-- Notification Settings -->
                    <div>
                        <h3 class="text-sm font-bold text-cyan-400 mb-4">🔔 NOTIFICATIONS</h3>
                        
                        <div class="space-y-2">
                            <label class="text-xs text-slate-300">Alert Level</label>
                            <select id="notificationLevel" 
                                onchange="settingsPanel.saveSetting('notification_level', this.value)"
                                class="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-sky-300">
                                <option value="all" ${settings.notification_level === 'all' ? 'selected' : ''}>All Events</option>
                                <option value="warnings" ${settings.notification_level === 'warnings' ? 'selected' : ''}>Warnings & Errors</option>
                                <option value="errors" ${settings.notification_level === 'errors' ? 'selected' : ''}>Errors Only</option>
                                <option value="none" ${settings.notification_level === 'none' ? 'selected' : ''}>Silent</option>
                            </select>
                        </div>

                        <div class="mt-3 space-y-2">
                            <div class="flex items-center gap-2 p-2 bg-slate-800 rounded">
                                <input type="checkbox" id="soundToggle" checked class="w-4 h-4 cursor-pointer"
                                    onchange="settingsPanel.saveSetting('notification_sound', this.checked)">
                                <label class="text-xs text-slate-300">Sound Alerts</label>
                            </div>

                            <div class="flex items-center gap-2 p-2 bg-slate-800 rounded">
                                <input type="checkbox" id="discordNotifyToggle" checked class="w-4 h-4 cursor-pointer"
                                    onchange="settingsPanel.saveSetting('discord_notifications', this.checked)">
                                <label class="text-xs text-slate-300">Discord Notifications</label>
                            </div>
                        </div>
                    </div>

                    <!-- Module Display -->
                    <div>
                        <h3 class="text-sm font-bold text-cyan-400 mb-4">📦 MODULES</h3>
                        
                        <div class="space-y-2">
                            <label class="text-xs text-slate-300">Module Size</label>
                            <select id="moduleSize" 
                                onchange="settingsPanel.saveSetting('module_size', this.value)"
                                class="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-sky-300">
                                <option value="small">Small (Compact View)</option>
                                <option value="medium" selected>Medium (Standard)</option>
                                <option value="large">Large (Detailed)</option>
                            </select>
                        </div>

                        <div class="mt-3 flex items-center justify-between p-2 bg-slate-800 rounded">
                            <label class="text-xs text-slate-300">Show Resource Bars</label>
                            <input type="checkbox" id="resourceBarsToggle" checked class="w-4 h-4 cursor-pointer"
                                onchange="settingsPanel.saveSetting('show_resource_bars', this.checked)">
                        </div>
                    </div>

                    <!-- Advanced -->
                    <div>
                        <h3 class="text-sm font-bold text-cyan-400 mb-4">⚡ ADVANCED</h3>
                        
                        <div class="space-y-2">
                            <label class="text-xs text-slate-300">Update Interval (seconds)</label>
                            <input type="range" id="updateInterval" 
                                min="0.5" max="10" step="0.5" value="${settings.update_interval}"
                                onchange="settingsPanel.saveSetting('update_interval', parseFloat(this.value))"
                                class="w-full">
                            <span class="text-xs text-slate-400" id="intervalDisplay">${settings.update_interval}s</span>
                        </div>

                        <div class="mt-3 flex items-center justify-between p-2 bg-slate-800 rounded">
                            <label class="text-xs text-slate-300">Debug Mode</label>
                            <input type="checkbox" id="debugToggle" class="w-4 h-4 cursor-pointer"
                                onchange="settingsPanel.saveSetting('debug_mode', this.checked)">
                        </div>
                    </div>

                    <!-- Quick Links -->
                    <div>
                        <h3 class="text-sm font-bold text-cyan-400 mb-4">🔗 QUICK LINKS</h3>
                        
                        <div class="grid grid-cols-2 gap-2">
                            <a href="/api/health" target="_blank" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-sky-400 text-center">API Health</a>
                            <a href="/api/status" target="_blank" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-sky-400 text-center">System Status</a>
                            <a href="/api/containers" target="_blank" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-sky-400 text-center">All Containers</a>
                            <a href="/api/system" target="_blank" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-sky-400 text-center">Metrics</a>
                        </div>
                    </div>

                    <!-- Media Pool Browser -->
                    <div>
                        <h3 class="text-sm font-bold text-cyan-400 mb-4">📁 MEDIA POOL BROWSER</h3>
                        
                        <div id="fileBrowser" class="bg-slate-800 rounded border border-slate-700 p-3 space-y-2">
                            <div class="text-xs text-slate-400 mb-2">
                                <div id="currentPath" class="font-mono text-sky-300 mb-2">/media/MediaPool</div>
                                <button onclick="settingsPanel.browsePath('/media/MediaPool')" class="w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs mb-2">
                                    🔄 Refresh
                                </button>
                            </div>
                            <div id="fileList" class="max-h-64 overflow-y-auto space-y-1">
                                <div class="text-slate-400 text-xs">Loading...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Storage Info -->
                    <div class="p-3 bg-slate-800 rounded border border-slate-700 text-xs text-slate-400">
                        <p>💾 Settings are stored locally in configuration</p>
                        <p>🔄 Changes apply immediately</p>
                        <p>🔐 No personal data is collected</p>
                    </div>
                </div>
            </div>
        `;
    }

    async saveSetting(key, value) {
        try {
            await fetch('/api/config/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    section: 'settings', 
                    key: key, 
                    value: value 
                })
            });
        } catch (error) {
            console.error(`Error saving setting ${key}:`, error);
        }
    }

    async browsePath(path) {
        try {
            const response = await fetch(`/api/files/browse?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (response.ok) {
                this.renderFileBrowser(data);
            } else {
                console.error('Browse error:', data.error);
                document.getElementById('fileList').innerHTML = `<div class="text-red-400 text-xs">${data.error}</div>`;
            }
        } catch (error) {
            console.error('Failed to browse path:', error);
            document.getElementById('fileList').innerHTML = `<div class="text-red-400 text-xs">Error: ${error.message}</div>`;
        }
    }

    renderFileBrowser(data) {
        const currentPath = document.getElementById('currentPath');
        const fileList = document.getElementById('fileList');
        
        currentPath.textContent = data.current_path;
        
        let html = '';
        
        // Parent directory link
        if (data.parent_path) {
            html += `
                <div class="p-2 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer" 
                    onclick="settingsPanel.browsePath('${data.parent_path}')">
                    <span class="text-sky-400 text-xs">📁 ..</span>
                </div>
            `;
        }
        
        // List directories first, then files
        for (const item of data.items) {
            if (item.type === 'directory') {
                html += `
                    <div class="p-2 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer" 
                        onclick="settingsPanel.browsePath('${item.path}')">
                        <div class="flex items-center justify-between">
                            <span class="text-sky-400 text-xs">📁 ${item.name}</span>
                            <span class="text-slate-500 text-xs">${item.file_count} items</span>
                        </div>
                    </div>
                `;
            }
        }
        
        // Then files
        for (const item of data.items) {
            if (item.type === 'file') {
                const sizeKB = (item.size / 1024).toFixed(1);
                html += `
                    <div class="p-2 bg-slate-700 rounded">
                        <div class="flex items-center justify-between">
                            <span class="text-slate-300 text-xs">📄 ${item.name}</span>
                            <span class="text-slate-500 text-xs">${sizeKB} KB</span>
                        </div>
                    </div>
                `;
            }
        }
        
        if (html === '') {
            html = '<div class="text-slate-400 text-xs">No items found</div>';
        }
        
        fileList.innerHTML = html;
    }
}

// Global instance
let settingsPanel = null;

function openSettingsPanel() {
    const overlay = document.getElementById('settingsOverlay');
    const panel = document.getElementById('settingsPanel');
    
    if (!settingsPanel) {
        settingsPanel = new SettingsPanel();
    }

    const panelContent = panel?.querySelector('div');
    if (panelContent) {
        panelContent.innerHTML = settingsPanel.render();
        
        // Attach event listener to update interval range slider
        const slider = panelContent.querySelector('#updateInterval');
        if (slider) {
            slider.addEventListener('input', (e) => {
                document.getElementById('intervalDisplay').textContent = e.target.value + 's';
            });
        }

        // Initialize file browser
        setTimeout(() => {
            settingsPanel.browsePath('/media/MediaPool');
        }, 100);
    }

    if (overlay) overlay.classList.add('visible');
    if (panel) panel.classList.add('open');
}

function closeSettingsPanel() {
    const overlay = document.getElementById('settingsOverlay');
    const panel = document.getElementById('settingsPanel');
    if (overlay) overlay.classList.remove('visible');
    if (panel) panel.classList.remove('open');
}
