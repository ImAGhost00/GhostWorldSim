/**
 * Spaceship Station Visualizer - Main Client
 * Handles WebSocket connection, Phaser game initialization, and metrics updates
 */

let game = null;
let scene = null;
let ws = null;
let wsUrl = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('🚀 Initializing Spaceship Station Visualizer');
    
    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('WebSocket URL:', wsUrl);
    
    // Initialize Phaser game
    initializePhaser();
    
    // Connect to WebSocket
    connectWebSocket();
    
    // Setup UI event listeners
    setupUIListeners();
}

/**
 * Initialize Phaser 3 game
 */
function initializePhaser() {
    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth - 320, // Account for sidebar
        height: window.innerHeight - 80, // Account for header
        parent: 'gameContainer',
        render: {
            pixelArt: false,
            antialias: true,
            antialiasGL: true,
        },
        scene: BaseScene,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false,
            },
        },
    };
    
    game = new Phaser.Game(config);
    game.events.on('ready', () => {
        scene = game.scene.getScene('BaseScene');
        console.log('✓ Phaser scene ready');
    });
}

/**
 * Connect to WebSocket server
 */
function connectWebSocket() {
    if (!wsUrl) return;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('✓ WebSocket connected');
            reconnectAttempts = 0;
            updateConnectionStatus(true);
            
            // Send initial ping
            ws.send(JSON.stringify({ type: 'ping' }));
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus(false);
        };
        
        ws.onclose = () => {
            console.log('WebSocket closed');
            updateConnectionStatus(false);
            
            // Attempt reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                console.log(`Reconnecting in ${reconnectDelay}ms... (attempt ${reconnectAttempts})`);
                setTimeout(connectWebSocket, reconnectDelay);
            }
        };
    } catch (e) {
        console.error('Failed to create WebSocket:', e);
        updateConnectionStatus(false);
    }
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(message) {
    const type = message.type;
    
    switch (type) {
        case 'metrics_update':
            handleMetricsUpdate(message);
            break;
        case 'pong':
            console.log('Received pong');
            break;
        case 'container_restart_result':
            handleContainerRestartResult(message);
            break;
        default:
            console.log('Unknown message type:', type);
    }
}

/**
 * Handle metrics update from server
 */
function handleMetricsUpdate(message) {
    const containers = message.containers || [];
    const system = message.system || {};
    const torrents = message.torrents || {};
    
    // Update system metrics in sidebar
    updateSystemMetrics(system);
    
    // Update container modules in scene
    if (scene) {
        containers.forEach(container => {
            scene.updateModuleMetrics(container.name, {
                cpu_percent: container.cpu_percent,
                memory_usage: container.memory_usage,
                state: container.state,
                color: container.color,
            });
        });
    }
    
    // Update containers list
    updateContainersList(containers);
    
    // Update torrent stats
    updateTorrentStats(torrents);
}

/**
 * Update system metrics display in sidebar
 */
function updateSystemMetrics(metrics) {
    if (!metrics) return;
    
    const cpu = metrics.cpu || {};
    const memory = metrics.memory || {};
    const disk = metrics.disk || {};
    const network = metrics.network || {};
    
    // CPU
    const cpuPercent = Math.round(cpu.usage_percent || 0);
    document.getElementById('cpuPercent').textContent = cpuPercent + '%';
    document.getElementById('cpuBar').style.width = cpuPercent + '%';
    
    // RAM
    const ramPercent = Math.round(memory.percent || 0);
    document.getElementById('ramPercent').textContent = ramPercent + '%';
    document.getElementById('ramBar').style.width = ramPercent + '%';
    
    // Disk
    const diskPercent = Math.round(disk.percent || 0);
    document.getElementById('diskPercent').textContent = diskPercent + '%';
    document.getElementById('diskBar').style.width = diskPercent + '%';
    
    // Network
    const netDownMbps = (network.bytes_recv_delta || 0) / (1024 * 1024);
    const netUpMbps = (network.bytes_sent_delta || 0) / (1024 * 1024);
    document.getElementById('netDown').textContent = netDownMbps.toFixed(1) + ' MB/s';
    document.getElementById('netUp').textContent = netUpMbps.toFixed(1) + ' MB/s';
}

/**
 * Update containers list in sidebar
 */
function updateContainersList(containers) {
    const listEl = document.getElementById('containersList');
    
    if (!containers || containers.length === 0) {
        listEl.innerHTML = '<div class="text-slate-500">No containers loaded</div>';
        return;
    }
    
    let html = '';
    containers.forEach(container => {
        const statusClass = container.state === 'running' ? 'status-running' : 'status-stopped';
        const statusText = container.state === 'running' ? '●' : '○';
        
        html += `
            <div class="flex items-center justify-between p-2 rounded hover:bg-slate-800 cursor-pointer" 
                 onclick="inspectContainer('${container.name}')">
                <div class="flex-1">
                    <div class="text-xs font-semibold">${container.name}</div>
                    <div class="text-xs text-slate-500">${container.module_type || 'generic'}</div>
                </div>
                <div class="text-right">
                    <span class="status-badge ${statusClass}">${statusText} ${container.state}</span>
                    <div class="text-xs text-slate-500 mt-1">${container.cpu_percent.toFixed(1)}% CPU</div>
                </div>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
}

/**
 * Update torrent statistics display
 */
function updateTorrentStats(torrents) {
    if (!torrents) return;
    
    const activeCount = torrents.active_torrents || 0;
    const dlSpeed = torrents.total_dl_speed_mbps || 0;
    const upSpeed = torrents.total_up_speed_mbps || 0;
    
    document.getElementById('torrentCount').textContent = activeCount;
    document.getElementById('torrentDown').textContent = dlSpeed.toFixed(1) + ' MB/s';
    document.getElementById('torrentUp').textContent = upSpeed.toFixed(1) + ' MB/s';
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(connected) {
    const statusEl = document.querySelector('[id="stationStatus"]');
    if (!statusEl) return;
    
    if (connected) {
        statusEl.innerHTML = '<span class="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>ONLINE';
        statusEl.className = 'text-lg font-bold text-emerald-400';
    } else {
        statusEl.innerHTML = '<span class="inline-block w-2 h-2 bg-red-400 rounded-full mr-2"></span>OFFLINE';
        statusEl.className = 'text-lg font-bold text-red-400';
    }
}

/**
 * Setup UI event listeners
 */
function setupUIListeners() {
    const aiBtn = document.getElementById('aiChatBtn');
    
    // Check if AI is available
    fetch('/api/status')
        .then(r => r.json())
        .then(data => {
            if (data.features.ai_core) {
                aiBtn.addEventListener('click', openAIChat);
            } else {
                // Disable AI button if AI is not enabled
                aiBtn.disabled = true;
                aiBtn.title = 'AI Core disabled (insufficient VRAM). Use Discord for server control.';
                aiBtn.style.opacity = '0.5';
                aiBtn.style.cursor = 'not-allowed';
                
                // Replace click handler with info message
                aiBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('AI Core is currently disabled.\n\nUse Discord integration for server control:\n!station status\n!station containers\n!station help');
                });
            }
            
            // Show Discord status if enabled
            if (data.features.discord_integration) {
                console.log('Discord integration available');
            }
        })
        .catch(e => console.error('Error checking system status:', e));
}

/**
 * Inspect a container - open drawer with details
 */
function inspectContainer(containerName) {
    // Fetch detailed info
    fetch(`/api/containers/${containerName}/logs?tail=30`)
        .then(r => r.json())
        .then(data => {
            const containerData = {
                name: containerName,
                logs: data.logs,
            };
            window.updateInspector(containerData);
            openInspector();
        })
        .catch(e => console.error('Error fetching logs:', e));
}

/**
 * Send WebSocket command to restart container
 */
function restartContainer(containerName) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Not connected to server');
        return;
    }
    
    if (confirm(`Restart ${containerName}?`)) {
        ws.send(JSON.stringify({
            type: 'restart_container',
            container: containerName,
        }));
    }
}

/**
 * Handle container restart result
 */
function handleContainerRestartResult(message) {
    const { container, success } = message;
    const status = success ? '✓ Success' : '✗ Failed';
    alert(`${status}: ${container} restart`);
}

/**
 * Send AI query
 */
function sendAIQuery() {
    const input = document.getElementById('aiPromptInput');
    const prompt = input.value.trim();
    
    if (!prompt) return;
    
    input.value = '';
    
    const contentEl = document.getElementById('aiChatContent');
    contentEl.innerHTML += `
        <div class="ai-chat-bubble text-right text-sky-300">
            <strong>You:</strong> ${prompt}
        </div>
    `;
    
    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    contentEl.innerHTML += `<div id="${loadingId}" class="ai-chat-bubble"><span class="spinner"></span> Thinking...</div>`;
    contentEl.scrollTop = contentEl.scrollHeight;
    
    // Query AI API
    fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: prompt,
            include_context: true,
        }),
    })
    .then(r => r.json())
    .then(data => {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        
        contentEl.innerHTML += `
            <div class="ai-chat-bubble text-purple-300">
                <strong>Command Core:</strong> ${data.response}
            </div>
        `;
        contentEl.scrollTop = contentEl.scrollHeight;
    })
    .catch(e => {
        console.error('AI query error:', e);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.innerHTML = '<span class="text-red-400">Error: Unable to reach AI core</span>';
        }
    });
}

/**
 * UI Helper Functions
 */

function openInspector() {
    document.getElementById('inspectorDrawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('visible');
}

function closeInspector() {
    document.getElementById('inspectorDrawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('visible');
}

function openAIChat() {
    document.getElementById('aiChatDrawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('visible');
    document.getElementById('aiPromptInput').focus();
}

function closeAIChat() {
    document.getElementById('aiChatDrawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('visible');
}

function showResearchTab(tab) {
    // Hide all tabs
    document.getElementById('mediaPoolTab').classList.add('hidden');
    document.getElementById('torrentsTab').classList.add('hidden');
    
    // Show selected tab
    if (tab === 'media') {
        document.getElementById('mediaPoolTab').classList.remove('hidden');
    } else if (tab === 'torrents') {
        document.getElementById('torrentsTab').classList.remove('hidden');
    }
    
    // Update tab buttons
    document.querySelectorAll('#researchRoomDrawer .border-b-2').forEach(btn => {
        btn.classList.remove('text-indigo-400', 'border-indigo-400');
        btn.classList.add('text-slate-400', 'border-transparent');
    });
    
    // Activate selected tab button
    event.target.classList.add('text-indigo-400', 'border-indigo-400');
    event.target.classList.remove('text-slate-400', 'border-transparent');
}

// Close drawer when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('drawerOverlay').addEventListener('click', () => {
        closeInspector();
        closeAIChat();
    });
    
    // Allow Enter key to send AI query
    document.getElementById('aiPromptInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendAIQuery();
        }
    });
});

/**
 * Global function for HUD module
 */
window.updateInspector = function(containerData) {
    const title = document.getElementById('drawerTitle');
    const content = document.getElementById('drawerContent');
    
    title.textContent = `📦 ${containerData.name || 'Unknown'}`;
    
    let html = `
        <div class="space-y-4">
            <div>
                <h3 class="text-sm font-bold text-sky-400 mb-2">Container Logs</h3>
                <div class="bg-slate-950 p-3 rounded text-xs max-h-96 overflow-y-auto">
    `;
    
    if (containerData.logs) {
        const logLines = containerData.logs.split('\n').slice(-30); // Last 30 lines
        logLines.forEach(line => {
            html += `<div class="log-entry">${line}</div>`;
        });
    } else {
        html += '<div class="log-entry text-slate-600">[No logs available]</div>';
    }
    
    html += `
                </div>
            </div>
            <button onclick="restartContainer('${containerData.name}')" 
                    class="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold">
                🔄 Restart Container
            </button>
        </div>
    `;
    
    content.innerHTML = html;
};

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
