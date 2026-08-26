# 🔬 Research Room - New Features

The Research Room is a new exploration panel in Spaceship Station Visualizer that provides deep insights into media pools and torrent activity.

## Overview

Access the Research Room from the main header by clicking the **🔬 RESEARCH** button. This opens a new drawer panel with two tabs:

### Tab 1: 📁 Media Pool

Browse and explore your media library with real-time statistics:

#### Media Pool Selection
- **Media** (450.5 GB, 1,250 files) - Main media collection
- **Downloads** (75.2 GB, 230 files) - Download staging area
- **Torrents** (320.8 GB, 890 files) - Torrent active directory

Each pool shows:
- Total size in gigabytes
- Total file count
- Quick access buttons

#### Directory Navigation
- Click any folder to browse its contents
- Breadcrumb trail shows current path
- Automatic navigation back to parent folders
- Recursive folder item counting

#### File Details Display
- **Folders**: Show sub-item count
- **Files**: Display with file type icons and size
- **File Icons**: 
  - 🎬 Video files (.mkv, .mp4, etc.)
  - 🎵 Audio files (.mp3, .flac, etc.)
  - 🖼️ Image files (.jpg, .png, etc.)
  - 📝 Text files (.txt, .md, etc.)
  - 📦 Archive files (.zip, .rar, .7z)
  - 📕 Documents (.pdf, .doc, .docx)

#### File Search
- Real-time search across entire pool
- Query by filename (case-insensitive)
- Search results show file type and size
- Maximum 50 results (truncation indicator if exceeded)
- Example queries:
  - "Inception" → Find movie
  - ".mkv" → Find all video files
  - "ubuntu" → Find Linux ISOs

#### Media Type Breakdown
- Automatic file type analysis
- Bar chart showing distribution by:
  - Extension type (.mkv, .mp3, .jpg, etc.)
  - File count per type
  - Storage per type (GB)
  - Percentage of pool

Example breakdown for Media pool:
- .mkv: 245 files, 320.5 GB (71.2%)
- .mp3: 450 files, 75.3 GB (16.7%)
- .jpg: 230 files, 25.2 GB (5.6%)
- .pdf: 120 files, 15.5 GB (3.4%)
- .zip: 45 files, 14.0 GB (3.1%)

---

### Tab 2: 📥 Torrents

Monitor and inspect all active torrents with detailed metadata:

#### Torrent Statistics Dashboard
- **Active Downloads** - Count of downloading torrents
- **Seeding Torrents** - Count of completed/seeding torrents
- **Total Torrents** - Overall torrent count
- **Global Download Speed** - Sum of all DL speeds
- **Global Upload Speed** - Sum of all UP speeds

#### Torrent Categories
Torrents are automatically grouped by type:

- **TV** - Television episodes and series
- **Movies** - Film collections
- **Linux** - Operating system distributions
- **Games** - Video game archives
- **Other** - Miscellaneous content

#### Per-Torrent Details
Each torrent in the list shows real-time metrics:

**Visual Progress Bar** (Color-coded):
- Blue bar showing completion percentage
- 0-100% progress indicator

**Key Metrics Display**:
- ↓ **Download Speed** (MB/s) - Only for downloading torrents
- ↑ **Upload Speed** (MB/s) - Active for all torrents
- ⬇️ **Progress** (%) - Completion percentage
- 📊 **Ratio** - Upload/Download ratio (higher = better seeding)

**Status Indicators**:
- 🟠 DOWNLOADING (orange) - Active download in progress
- 🟢 SEEDING (green) - Upload-only mode

#### Detailed Torrent Viewer
Click any torrent to view comprehensive information:

**Basic Info**:
- Full torrent name
- Hash identifier

**Progress Tracking**:
- Large progress bar with percentage
- Visual completion indication

**Core Metrics** (4-column grid):
- **Status** - Downloading/Seeding state
- **Ratio** - Upload/download ratio
- **Download Speed** - MB/s (0 if seeding)
- **Upload Speed** - MB/s
- **Seeds** - Number of seeders
- **Peers** - Number of peers
- **Size** - Total torrent size (GB)
- **Downloaded** - Amount downloaded (GB)
- **Uploaded** - Amount shared (GB)
- **ETA** - Time to completion (downloading only)

#### Torrent Monitoring Features

**Real-Time Updates**:
- Click "🔄 Refresh Torrents" to update all metrics
- Speed, progress, and peer counts update on demand

**Performance Insights**:
- Compare speed and efficiency across torrents
- Monitor seeding health (ratio > 3.0 is excellent)
- Track network utilization per torrent

**Categorized View**:
- Filter torrents by category/type
- See total stats per category:
  - File count
  - Total size (GB)
  - Upload volume (GB)

---

## API Endpoints (Backend)

All Research Room features are backed by robust REST APIs:

### Media Pool Endpoints
```
GET /api/media/pools
  → List all media pools with statistics

GET /api/media/browse?pool={pool}&path={path}
  → Browse directory with breadcrumb navigation

GET /api/media/file-info?pool={pool}&path={path}
  → Get detailed file metadata

GET /api/media/search?pool={pool}&query={query}&max_results=50
  → Search files by filename

GET /api/media/types?pool={pool}
  → Get file type breakdown and distribution
```

### Torrent Endpoints
```
GET /api/torrents
  → Get all torrents with transfer statistics

GET /api/torrents/detailed
  → Get torrents grouped by category

GET /api/torrents/{hash}
  → Get detailed information for specific torrent
```

---

## Performance Considerations

### File Browsing
- **Mock Mode**: Instant response (<10ms) - no disk I/O
- **Real Mode**: Depends on pool size and disk speed
  - Small pools (<100GB): <500ms
  - Large pools (>500GB): 1-5 seconds
- **Search**: Linear scan, capped at 50 results for performance

### Torrent Monitoring
- **Retrieval**: Via qBittorrent API (or mock)
- **Update Frequency**: On-demand (click refresh)
- **Bandwidth**: Minimal (metadata only, no payload transfer)
- **Accuracy**: Real-time from qBittorrent daemon

### Recommended Usage
- **Pooling**: Refresh pools once on load
- **Browsing**: Cache directory contents as user navigates
- **Torrents**: Refresh every 30-60 seconds for live monitoring
- **Search**: Limit per-query results to 50 items

---

## Mock Mode vs Real Mode

### Mock Mode (MOCK_MODE=true)
**Use For:**
- Testing without Docker volumes
- Demo/presentation scenarios
- Development without local /media setup

**Example Data:**
- 3 realistic media pools
- ~1,250 media files with realistic names
- 5 active torrents (3 downloading, 2 seeding)
- File type distribution matching real-world patterns

### Real Mode (MOCK_MODE=false)
**Use For:**
- Production deployment
- Actual Docker Compose setup
- Real homelab monitoring

**Requirements:**
- Docker volumes mounted:
  - `/media` - Main media library
  - `/downloads` - Download staging
  - `/torrents` - Torrent working directory
- qBittorrent API accessible
- Sufficient disk read permissions

---

## Example Workflows

### Workflow 1: Find Missing Movies
1. Open Research Room → Media Pool tab
2. Click **Movies** folder
3. Use search for partial name: "2020"
4. Review results for movies added in 2020
5. Identify missing films to torrent search

### Workflow 2: Monitor Seeding Performance
1. Open Research Room → Torrents tab
2. Click "🔄 Refresh Torrents"
3. Sort by Ratio (highest first)
4. Click high-ratio torrents for details
5. Verify upload contribution to swarm

### Workflow 3: Storage Analysis
1. Open Research Room → Media Pool tab
2. Select pool to analyze
3. View "File Distribution" chart
4. Identify largest file types
5. Consider compression/cleanup if needed

### Workflow 4: Download Queue Management
1. Open Research Room → Torrents tab
2. View torrents by category
3. Sort by Download Speed
4. Check peers/seeds for slow torrents
5. Prioritize based on health metrics

---

## Keyboard Shortcuts (Future Enhancement)
- `R` - Toggle Research Room
- `Tab` - Switch between Media/Torrents tabs
- `Esc` - Close Research Room
- `/` - Focus search box

---

## UI Themes & Color Coding

### Status Colors
- 🟠 **Orange** (`text-orange-400`) - Downloading/Active
- 🟢 **Green** (`text-green-400`) - Seeding/Complete
- 🔵 **Blue** (`text-sky-400`) - Pool/Navigation
- 🟣 **Purple** (`text-purple-400`) - Headers/Titles
- ⚫ **Slate** (various) - Background/inactive

### Component Styling
- **Buttons**: Hover effect with darker shade
- **Inputs**: Slate background with sky text
- **Progress Bars**: Blue gradient (downloading) or green (seeding)
- **Cards**: Slate-800 background with subtle borders
- **Text**: High contrast for readability

---

## Troubleshooting

### Empty Pools
**Issue**: Media pool shows no files
**Solutions**:
- Verify MOCK_MODE setting in `.env`
- Check Docker volume mounts (real mode)
- Confirm pool paths exist and are readable

### Slow Search
**Issue**: Search takes >2 seconds
**Solutions**:
- Reduce pool size or clear stale files
- Filter by extension (.mkv instead of broad query)
- Reduce max_results parameter

### Torrents Not Showing
**Issue**: No torrents in list
**Solutions**:
- Verify qBittorrent is running and accessible
- Check connection to qBittorrent REST API
- Ensure API port (default 8080) is reachable

### UI Not Responsive
**Issue**: Clicking buttons doesn't work
**Solutions**:
- Refresh browser page
- Check browser console for JavaScript errors
- Verify WebSocket connection is active

---

## Future Enhancements

Potential additions to Research Room:

- **Thumbnail Previews** - Show image/video thumbnails
- **File Operations** - Move, copy, delete files
- **Torrent Control** - Pause, resume, remove torrents
- **Streaming Preview** - Play media directly from pool
- **Storage Alerts** - Warn when pool reaches capacity
- **Statistics Export** - Save reports as CSV/JSON
- **Automated Cleanup** - Remove old/stale files
- **Sync Management** - Mirror pools across locations

---

Generated: 2024
Part of: Spaceship Station Visualizer
Status: Production Ready
