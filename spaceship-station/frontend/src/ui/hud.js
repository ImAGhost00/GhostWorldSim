/**
 * Spaceship Station - HUD Module
 * Handles UI overlays for logs, container inspection, and terminal controls
 */

// This module is loaded after main.js and provides additional UI utilities

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in seconds to human-readable format
 */
function formatDuration(seconds) {
    if (seconds <= 0) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

/**
 * Create a metric gauge element
 */
function createMetricGauge(label, value, max = 100, unit = '') {
    const percent = Math.min(100, (value / max) * 100);
    let color = '#10b981'; // Green
    
    if (percent > 75) {
        color = '#ef4444'; // Red
    } else if (percent > 50) {
        color = '#f59e0b'; // Amber
    }
    
    return `
        <div class="mb-3">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-semibold text-slate-300">${label}</span>
                <span class="text-xs text-slate-400">${value.toFixed(1)}${unit}</span>
            </div>
            <div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" 
                     style="width: ${percent}%; background-color: ${color}; opacity: 0.8;"></div>
            </div>
        </div>
    `;
}

/**
 * Create a status badge
 */
function createStatusBadge(status) {
    const badges = {
        running: { color: '#10b981', text: '● Running', class: 'status-running' },
        stopped: { color: '#ef4444', text: '○ Stopped', class: 'status-stopped' },
        unhealthy: { color: '#f59e0b', text: '⚠ Unhealthy', class: 'status-warning' },
        unknown: { color: '#94a3b8', text: '? Unknown', class: 'status-badge' },
    };
    
    const badge = badges[status] || badges.unknown;
    return `<span class="status-badge ${badge.class}">${badge.text}</span>`;
}

/**
 * Fetch and display container details in the inspector drawer
 */
async function displayContainerDetails(containerName) {
    try {
        const logsResponse = await fetch(`/api/containers/${containerName}/logs?tail=50`);
        const logsData = await logsResponse.json();
        
        const containerResponse = await fetch(`/api/containers`);
        const containerData = await containerResponse.json();
        
        const container = containerData.containers.find(c => c.name === containerName);
        
        if (!container) {
            document.getElementById('drawerContent').innerHTML = 
                '<div class="text-red-400">Container not found</div>';
            return;
        }
        
        // Build detailed UI
        let html = `
            <div class="space-y-6">
                <div>
                    <div class="text-lg font-bold text-sky-400 mb-2">${container.name}</div>
                    <div class="text-sm text-slate-400 mb-3">${container.module_type || 'Unknown Module'}</div>
                    ${createStatusBadge(container.state)}
                </div>
                
                <div class="border-t border-slate-700 pt-4">
                    <h3 class="text-sm font-bold text-sky-400 mb-3">Performance Metrics</h3>
                    ${createMetricGauge('CPU Usage', container.cpu_percent, 100, '%')}
                    ${createMetricGauge('Memory', container.memory_usage, container.memory_limit, ' MB')}
                    <div class="text-xs text-slate-500 mt-3">
                        <div>Uptime: ${formatDuration(container.uptime)}</div>
                        <div>Network In: ${formatBytes(container.network_in)}</div>
                        <div>Network Out: ${formatBytes(container.network_out)}</div>
                    </div>
                </div>
                
                <div class="border-t border-slate-700 pt-4">
                    <h3 class="text-sm font-bold text-sky-400 mb-3">Recent Logs</h3>
                    <div class="bg-slate-950 p-3 rounded text-xs max-h-64 overflow-y-auto font-mono">
        `;
        
        const logs = logsData.logs.split('\n').slice(-20);
        logs.forEach(line => {
            if (!line.trim()) return;
            
            let logClass = 'log-entry';
            if (line.includes('ERROR') || line.includes('error')) {
                logClass += ' error';
            } else if (line.includes('WARN') || line.includes('warning')) {
                logClass += ' warning';
            } else if (line.includes('INFO') || line.includes('info')) {
                logClass += ' info';
            }
            
            html += `<div class="${logClass}">${escapeHtml(line)}</div>`;
        });
        
        html += `
                    </div>
                </div>
                
                <div class="flex gap-2 pt-4 border-t border-slate-700">
                    <button onclick="restartContainer('${containerName}')" 
                            class="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm font-semibold">
                        🔄 Restart
                    </button>
                    <button onclick="copyToClipboard('${containerName}')" 
                            class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-semibold">
                        📋 Copy ID
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('drawerContent').innerHTML = html;
    } catch (error) {
        console.error('Error displaying container details:', error);
        document.getElementById('drawerContent').innerHTML = 
            `<div class="text-red-400">Error: ${error.message}</div>`;
    }
}

/**
 * Copy container ID to clipboard
 */
function copyToClipboard(containerName) {
    navigator.clipboard.writeText(containerName).then(() => {
        alert(`Copied: ${containerName}`);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Display AI tool management interface
 */
async function displayAIToolManager() {
    try {
        const response = await fetch('/api/ai/tools');
        const toolsData = await response.json();
        
        let html = `
            <div class="space-y-4">
                <div>
                    <h3 class="text-sm font-bold text-purple-400 mb-3">Generated Tools (${toolsData.count})</h3>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
        `;
        
        if (toolsData.tools && toolsData.tools.length > 0) {
            toolsData.tools.forEach(tool => {
                html += `
                    <div class="p-2 bg-slate-800 rounded text-xs">
                        <div class="font-semibold text-sky-300">${tool.name}</div>
                        <div class="text-slate-500">${formatBytes(tool.size_bytes)}</div>
                    </div>
                `;
            });
        } else {
            html += '<div class="text-slate-500 text-xs">No tools generated yet</div>';
        }
        
        html += `
                    </div>
                </div>
                
                <div class="border-t border-slate-700 pt-4">
                    <h3 class="text-sm font-bold text-purple-400 mb-2">Tool Generator</h3>
                    <textarea id="toolCodeInput" placeholder="Enter Python tool code..." 
                             class="w-full h-32 p-2 bg-slate-800 border border-slate-700 rounded text-xs text-sky-300 font-mono"></textarea>
                    <button onclick="generateNewTool()" 
                            class="w-full mt-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-semibold">
                        ⚙️ Generate Tool
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('aiChatContent').innerHTML = html;
    } catch (error) {
        console.error('Error loading tools:', error);
        document.getElementById('aiChatContent').innerHTML = 
            `<div class="text-red-400">Error: ${error.message}</div>`;
    }
}

/**
 * Generate a new AI tool
 */
async function generateNewTool() {
    const code = document.getElementById('toolCodeInput').value.trim();
    if (!code) {
        alert('Enter tool code first');
        return;
    }
    
    const toolName = prompt('Tool name (no spaces):', 'custom_tool');
    if (!toolName) return;
    
    try {
        const response = await fetch('/api/ai/tool/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool_spec: {
                    name: toolName,
                    code: code,
                },
            }),
        });
        
        const result = await response.json();
        if (result.success) {
            alert(`✓ Tool '${toolName}' generated successfully`);
            document.getElementById('toolCodeInput').value = '';
            displayAIToolManager();
        } else {
            alert(`✗ Failed to generate tool`);
        }
    } catch (error) {
        console.error('Error generating tool:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Initialize HUD on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // HUD module ready
    console.log('✓ HUD module initialized');
});
