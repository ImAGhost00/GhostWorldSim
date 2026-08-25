/**
 * Spaceship Station - Research Room
 * File browser and torrent detail exploration interface
 */

let researchRoomState = {
    currentPool: 'media',
    currentPath: '',
    currentTorrent: null,
    breadcrumb: [],
};

/**
 * Initialize Research Room
 */
async function initializeResearchRoom() {
    const btn = document.getElementById('researchRoomBtn');
    if (btn) {
        btn.addEventListener('click', openResearchRoom);
    }
}

/**
 * Open Research Room drawer
 */
function openResearchRoom() {
    document.getElementById('researchRoomDrawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('visible');
    loadMediaPools();
}

/**
 * Close Research Room drawer
 */
function closeResearchRoom() {
    document.getElementById('researchRoomDrawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('visible');
}

/**
 * Load available media pools
 */
async function loadMediaPools() {
    try {
        const response = await fetch('/api/media/pools');
        const data = await response.json();
        const poolsContainer = document.getElementById('mediaPools');
        
        let html = '<div class="space-y-2">';
        
        for (const [poolName, poolInfo] of Object.entries(data.pools)) {
            if (poolInfo.available) {
                html += `
                    <button onclick="browseMedPool('${poolName}')" 
                            class="w-full text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700">
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="font-semibold text-sky-300">${poolName.toUpperCase()}</div>
                                <div class="text-xs text-slate-500">${poolInfo.path}</div>
                            </div>
                            <div class="text-right text-xs text-slate-400">
                                <div>${poolInfo.total_size_gb} GB</div>
                                <div>${poolInfo.file_count} files</div>
                            </div>
                        </div>
                    </button>
                `;
            }
        }
        
        html += '</div>';
        poolsContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading pools:', error);
    }
}

/**
 * Browse media pool
 */
async function browseMedPool(poolName, path = '') {
    researchRoomState.currentPool = poolName;
    researchRoomState.currentPath = path;
    
    try {
        const response = await fetch(
            `/api/media/browse?pool=${poolName}&path=${encodeURIComponent(path)}`
        );
        const data = await response.json();
        const result = data.result;
        
        if (!result.success) {
            alert(`Error: ${result.error}`);
            return;
        }
        
        // Update breadcrumb
        researchRoomState.breadcrumb = result.breadcrumb;
        updateBreadcrumb(result.breadcrumb, poolName);
        
        // Display items
        const itemsContainer = document.getElementById('mediaItems');
        let html = '';
        
        if (result.items.length === 0) {
            html = '<div class="text-slate-500 text-sm text-center py-8">Empty directory</div>';
        } else {
            html = '<div class="space-y-1">';
            
            result.items.forEach(item => {
                if (item.type === 'folder') {
                    html += `
                        <button onclick="browseMedPool('${poolName}', '${item.path}')"
                                class="w-full text-left p-2 rounded hover:bg-slate-800 flex items-center gap-2 text-sm">
                            <span class="text-yellow-400">📁</span>
                            <span class="flex-1">${item.name}</span>
                            <span class="text-xs text-slate-500">${item.item_count} items</span>
                        </button>
                    `;
                } else {
                    const icon = getFileIcon(item.mime_type || item.name);
                    html += `
                        <div class="p-2 rounded hover:bg-slate-800 flex items-center gap-2 text-sm group">
                            <span>${icon}</span>
                            <span class="flex-1">${item.name}</span>
                            <span class="text-xs text-slate-500">${item.size_mb} MB</span>
                        </div>
                    `;
                }
            });
            
            html += '</div>';
        }
        
        itemsContainer.innerHTML = html;
        
        // Show media type breakdown if in media pool
        if (poolName === 'media') {
            loadMediaTypeBreakdown(poolName);
        }
    } catch (error) {
        console.error('Error browsing media:', error);
        alert('Error browsing directory');
    }
}

/**
 * Update breadcrumb navigation
 */
function updateBreadcrumb(breadcrumb, poolName) {
    const breadcrumbEl = document.getElementById('breadcrumbNav');
    let html = `<button onclick="browseMedPool('${poolName}', '')" class="text-sky-400 hover:text-sky-300">⚓ ${poolName.toUpperCase()}</button>`;
    
    breadcrumb.slice(1).forEach(crumb => {
        html += ` > <button onclick="browseMedPool('${poolName}', '${crumb.path}')" class="text-sky-400 hover:text-sky-300">${crumb.name}</button>`;
    });
    
    breadcrumbEl.innerHTML = html;
}

/**
 * Load media type breakdown
 */
async function loadMediaTypeBreakdown(pool) {
    try {
        const response = await fetch(`/api/media/types?pool=${pool}`);
        const data = await response.json();
        const result = data.result;
        
        if (!result.success) return;
        
        const chartsContainer = document.getElementById('mediaTypeChart');
        let html = `
            <div class="space-y-2 max-h-48 overflow-y-auto">
                <div class="text-sm text-slate-400">File Distribution: ${result.total_files} files</div>
        `;
        
        result.file_types.forEach(ft => {
            const width = Math.min(100, ft.percent);
            html += `
                <div class="space-y-1">
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-300">${ft.extension}</span>
                        <span class="text-slate-500">${ft.file_count} files • ${ft.total_size_gb}GB</span>
                    </div>
                    <div class="w-full h-2 bg-slate-700 rounded overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded" 
                             style="width: ${width}%; opacity: 0.7;"></div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        chartsContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading media types:', error);
    }
}

/**
 * Load detailed torrent information
 */
async function loadDetailedTorrents() {
    try {
        const response = await fetch('/api/torrents/detailed');
        const data = await response.json();
        const categories = data.detail.categories;
        
        const torrentsContainer = document.getElementById('torrentsResearch');
        let html = '<div class="space-y-4">';
        
        for (const [category, catData] of Object.entries(categories)) {
            html += `
                <div class="border-b border-slate-700 pb-3">
                    <h4 class="text-sm font-bold text-purple-400 mb-2">
                        ${category.toUpperCase()} (${catData.count})
                    </h4>
                    <div class="space-y-2 text-xs">
            `;
            
            catData.torrents.forEach(torrent => {
                const statusColor = torrent.state === 'downloading' ? 'text-orange-400' : 'text-green-400';
                const progressPercent = Math.round(torrent.progress * 100);
                
                html += `
                    <div class="p-2 bg-slate-800 rounded cursor-pointer hover:bg-slate-700"
                         onclick="viewTorrentDetail('${torrent.hash}')">
                        <div class="flex justify-between items-start mb-1">
                            <span class="flex-1 text-slate-300">${torrent.name}</span>
                            <span class="${statusColor} font-bold">${torrent.state}</span>
                        </div>
                        <div class="w-full h-1 bg-slate-700 rounded overflow-hidden mb-1">
                            <div class="h-full bg-blue-500" style="width: ${progressPercent}%;"></div>
                        </div>
                        <div class="grid grid-cols-4 gap-2 text-slate-500 text-xs">
                            <div>↓ ${(torrent.dl_speed / (1024 * 1024)).toFixed(1)}MB/s</div>
                            <div>↑ ${(torrent.up_speed / (1024 * 1024)).toFixed(1)}MB/s</div>
                            <div>⬇️${progressPercent}%</div>
                            <div>📊${torrent.ratio.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        html += '</div>';
        torrentsContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading torrents:', error);
    }
}

/**
 * View detailed torrent information
 */
async function viewTorrentDetail(torrentHash) {
    try {
        const response = await fetch(`/api/torrents/${torrentHash}`);
        const data = await response.json();
        const result = data.result.torrent;
        
        let html = `
            <div class="space-y-4">
                <div class="border-b border-slate-700 pb-3">
                    <h3 class="text-lg font-bold text-purple-400">${result.name}</h3>
                    <div class="text-sm text-slate-400 mt-1">${result.hash.substring(0, 16)}...</div>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="text-sm text-slate-300">Progress</span>
                            <span class="text-sm font-bold text-sky-400">${Math.round(result.progress * 100)}%</span>
                        </div>
                        <div class="w-full h-3 bg-slate-700 rounded overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-sky-500 to-sky-400" 
                                 style="width: ${result.progress * 100}%;"></div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">Status</div>
                            <div class="font-bold capitalize" style="color: ${result.state === 'downloading' ? '#f97316' : '#10b981'};">
                                ${result.state}
                            </div>
                        </div>
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">Ratio</div>
                            <div class="font-bold text-orange-400">${result.ratio.toFixed(2)}</div>
                        </div>
                        
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">Download Speed</div>
                            <div class="font-bold text-green-400">${(result.dl_speed / (1024 * 1024)).toFixed(2)} MB/s</div>
                        </div>
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">Upload Speed</div>
                            <div class="font-bold text-orange-400">${(result.up_speed / (1024 * 1024)).toFixed(2)} MB/s</div>
                        </div>
                        
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">Seeds</div>
                            <div class="font-bold text-sky-400">${result.seeds}</div>
                        </div>
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">Peers</div>
                            <div class="font-bold text-purple-400">${result.peers}</div>
                        </div>
                        
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">Size</div>
                            <div class="font-bold text-slate-200">${(result.size / (1024 ** 3)).toFixed(2)} GB</div>
                        </div>
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">Downloaded</div>
                            <div class="font-bold text-slate-200">${(result.downloaded / (1024 ** 3)).toFixed(2)} GB</div>
                        </div>
                        
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">Uploaded</div>
                            <div class="font-bold text-slate-200">${(result.uploaded / (1024 ** 3)).toFixed(2)} GB</div>
                        </div>
                        <div class="bg-slate-800 p-2 rounded">
                            <div class="text-slate-400">ETA</div>
                            <div class="font-bold text-slate-200">
                                ${result.eta_seconds > 0 ? formatDuration(result.eta_seconds) : '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('torrentsResearch').innerHTML = html;
    } catch (error) {
        console.error('Error viewing torrent details:', error);
    }
}

/**
 * Get file icon by MIME type
 */
function getFileIcon(mimeType, filename = '') {
    if (!mimeType && !filename) return '📄';
    
    const type = mimeType?.split('/')[0] || '';
    
    if (type === 'video') return '🎬';
    if (type === 'audio') return '🎵';
    if (type === 'image') return '🖼️';
    if (type === 'text') return '📝';
    
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    const iconMap = {
        'zip': '📦',
        'rar': '📦',
        '7z': '📦',
        'tar': '📦',
        'gz': '📦',
        'pdf': '📕',
        'doc': '📄',
        'docx': '📄',
        'xls': '📊',
        'xlsx': '📊',
    };
    
    return iconMap[ext] || '📄';
}

/**
 * Search files in media pool
 */
async function searchMedia() {
    const query = document.getElementById('mediaSearchInput').value.trim();
    if (!query) {
        alert('Enter a search query');
        return;
    }
    
    try {
        const response = await fetch(
            `/api/media/search?pool=${researchRoomState.currentPool}&query=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        const result = data.result;
        
        const itemsContainer = document.getElementById('mediaItems');
        let html = `<div class="text-sm text-slate-400 mb-3">Found ${result.result_count} results</div><div class="space-y-1">`;
        
        if (result.results.length === 0) {
            html = '<div class="text-slate-500 text-center py-8">No results found</div>';
        } else {
            result.results.forEach(item => {
                const icon = item.type === 'folder' ? '📁' : getFileIcon(null, item.name);
                const size = item.type === 'file' ? ` • ${item.size_mb}MB` : '';
                html += `
                    <div class="p-2 rounded bg-slate-800 flex items-center gap-2 text-sm">
                        <span>${icon}</span>
                        <span class="flex-1">${item.name}${size}</span>
                    </div>
                `;
            });
            
            if (result.truncated) {
                html += '<div class="text-yellow-500 text-xs text-center py-2">Results truncated (max 50)</div>';
            }
        }
        
        html += '</div>';
        itemsContainer.innerHTML = html;
    } catch (error) {
        console.error('Error searching media:', error);
        alert('Search error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeResearchRoom();
});
