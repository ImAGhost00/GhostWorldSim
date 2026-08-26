# 🎯 Quick Reference - Research Room Integration

## What's New? 🚀

### 1. **Media Pool Browser**
- Browse `/media`, `/downloads`, `/torrents` folders
- Navigate hierarchically with breadcrumbs
- See file types with icons
- Check file sizes and counts

### 2. **File Search**
- Search by filename across any pool
- Returns up to 50 results
- Shows file type and size

### 3. **File Analytics**
- View file distribution by type
- See size breakdown (GB)
- Understand pool composition

### 4. **Torrent Explorer**
- Browse all active torrents
- Group by category (TV, Movies, Games, Linux, Other)
- Sort by speed, progress, ratio
- Click for detailed information

### 5. **Torrent Details**
- Download/upload speeds
- Progress with visual bar
- Seed/peer counts
- Upload ratio
- ETA for downloads
- Total transferred amounts

---

## How to Access? 🎮

```
1. Open Spaceship Station
2. Click [🔬 RESEARCH] button in header
3. Choose tab:
   - Media Pool  → File browsing
   - Torrents    → Torrent monitoring
4. Explore!
5. Close with ✕ button or click overlay
```

---

## API Endpoints 🔌

### Media Pools
| Endpoint | Purpose |
|----------|---------|
| `GET /api/media/pools` | List all pools + stats |
| `GET /api/media/browse?pool=X&path=Y` | Browse folder |
| `GET /api/media/search?pool=X&query=Y` | Search files |
| `GET /api/media/types?pool=X` | File breakdown |

### Torrents
| Endpoint | Purpose |
|----------|---------|
| `GET /api/torrents/detailed` | All torrents by category |
| `GET /api/torrents/{hash}` | Single torrent details |

---

## Example Requests 📋

### Get all pools
```bash
curl http://localhost:8000/api/media/pools
```

### Browse media folder
```bash
curl "http://localhost:8000/api/media/browse?pool=media&path=Movies"
```

### Search for files
```bash
curl "http://localhost:8000/api/media/search?pool=media&query=Breaking&max_results=50"
```

### Get torrents by category
```bash
curl http://localhost:8000/api/torrents/detailed
```

### Get specific torrent
```bash
curl http://localhost:8000/api/torrents/mock_torrent_001
```

---

## File Structure 📁

```
spaceship-station/
├── backend/
│   ├── main.py                  # 7 new endpoints
│   ├── collectors/
│   │   ├── torrent_agent.py     # Enhanced (5 torrents)
│   │   ├── file_browser.py      # With mock mode
│   │   └── ...
│   └── verify_syntax.py         # NEW - Check code
│
├── frontend/
│   ├── index.html               # RESEARCH button + drawer
│   ├── src/
│   │   ├── main.js              # showResearchTab() added
│   │   ├── ui/
│   │   │   └── research-room.js # NEW - 450+ lines
│   │   ├── scenes/
│   │   └── ...
│   └── ...
│
├── RESEARCH_ROOM_FEATURES.md    # NEW - Feature guide
├── DEPLOYMENT_CHECKLIST.md      # NEW - Testing guide
├── INTEGRATION_SUMMARY.md       # NEW - Complete summary
└── ...
```

---

## Testing in 3 Minutes ⏱️

### Step 1: Check Syntax (30 seconds)
```bash
cd spaceship-station
python verify_syntax.py
# Should see: "All syntax checks passed!"
```

### Step 2: Start Backend (30 seconds)
```bash
cd backend
set MOCK_MODE=true
python main.py
# Wait for: "Uvicorn running on http://127.0.0.1:8000"
```

### Step 3: Open Frontend (2 minutes)
```
1. Open frontend/index.html in browser
2. Click [🔬 RESEARCH] button
3. Test each feature:
   - Click "MEDIA" pool
   - Click "Movies" folder
   - Type "Breaking" in search
   - Switch to Torrents tab
   - Click Refresh button
   - Click a torrent for details
```

**Result**: Everything should work smoothly! ✅

---

## Feature Highlights 💡

### Media Pool Tab
- ✅ 3 pools with realistic stats
- ✅ Hierarchical folder navigation
- ✅ Real-time file listing
- ✅ File type icons (🎬 🎵 🖼️ 📝 📦)
- ✅ Search across entire pool
- ✅ Distribution analysis chart
- ✅ Breadcrumb trail

### Torrents Tab
- ✅ 5 mock torrents (3 downloading, 2 seeding)
- ✅ Category grouping
- ✅ Speed/progress display
- ✅ Seed/peer counts
- ✅ Ratio tracking
- ✅ Detailed view per torrent
- ✅ Real-time metric updates

---

## Mock Mode Data 📊

### Pools
```
media/      450.5 GB    1,250 files
downloads/   75.2 GB      230 files
torrents/   320.8 GB      890 files
```

### File Breakdown
```
.mkv  (71.2%)  320.5 GB   245 files  ← Largest
.mp3  (16.7%)   75.3 GB   450 files
.jpg  ( 5.6%)   25.2 GB   230 files
.pdf  ( 3.4%)   15.5 GB   120 files
.zip  ( 3.1%)   14.0 GB    45 files
```

### Torrents
```
1. Breaking.Bad.S05E16        65% downloading   5 MB/s down
2. Movie.Collection.BluRay    32% downloading   3 MB/s down
3. Comic.Archive.Complete     88% downloading   2 MB/s down
4. Linux.Distro.ISO          100% seeding      1.5 MB/s up  [5.24 ratio]
5. RetroGames.Collection     100% seeding      2 MB/s up   [5.24 ratio]
```

---

## Common Tasks 🛠️

### Find a specific movie
1. Open Research Room
2. Click "MEDIA" pool
3. Click "Movies" folder
4. Look through file list
   OR search for partial name

### Monitor download speed
1. Open Research Room
2. Switch to "Torrents" tab
3. Click "🔄 Refresh Torrents"
4. Check "↓" column for speeds
5. Click torrent for details

### Analyze storage usage
1. Open Research Room
2. Click any pool (e.g., "MEDIA")
3. Scroll to "File Distribution"
4. See size breakdown by type
5. Identify what's using most space

### Find slow torrents
1. Open Research Room
2. Switch to "Torrents" tab
3. Refresh torrents
4. Look for low speeds
5. Click to check peer count

---

## Environment Variables 🔧

### Set Before Running
```bash
# Windows (PowerShell)
$env:MOCK_MODE = "true"
$env:QB_HOST = "localhost"
$env:QB_PORT = "8080"

# Windows (CMD)
set MOCK_MODE=true
set QB_HOST=localhost
set QB_PORT=8080

# Linux/Mac
export MOCK_MODE=true
export QB_HOST=localhost
export QB_PORT=8080
```

### What They Do
| Variable | Default | Purpose |
|----------|---------|---------|
| `MOCK_MODE` | `true` | Use mock data (set to `false` for real) |
| `QB_HOST` | `localhost` | qBittorrent server address |
| `QB_PORT` | `8080` | qBittorrent API port |
| `DEBUG` | `false` | Enable debug logging |

---

## Performance Tips ⚡

### For Fast Browsing
- Keep pool sizes under 500 GB
- Use search instead of browsing large folders
- Limit results to 50 items

### For Responsive UI
- Refresh torrents every 30-60 seconds
- Avoid very deep folder navigation
- Clear browser cache if slow

### For Server
- Mock mode uses minimal resources
- Real mode depends on file system
- Keep API response times <1 second

---

## Troubleshooting 🔧

### Research button doesn't appear
```
✓ Check: research-room.js script tag in HTML
✓ Check: Browser console for errors (F12)
✓ Fix: Clear cache (Ctrl+Shift+Delete)
```

### Media pool shows empty
```
✓ Check: MOCK_MODE=true environment variable
✓ Check: Backend server is running
✓ Check: /api/media/pools endpoint works
✓ Fix: Restart backend server
```

### Torrents not showing
```
✓ Check: Backend logs for errors
✓ Check: /api/torrents/detailed endpoint
✓ Check: Click Refresh button
✓ Fix: Verify qBittorrent is accessible
```

### UI looks broken
```
✓ Check: Tailwind CSS loaded (check Network tab)
✓ Fix: Hard refresh (Ctrl+Shift+R)
✓ Fix: Clear browser cache
✓ Fix: Try different browser
```

---

## Keyboard Navigation 🎮

| Key | Action |
|-----|--------|
| `Tab` | Move between elements |
| `Enter` | Click focused button |
| `Esc` | Close Research Room |
| `Space` | Click focused button |

---

## File Size Conversions 📏

```
1 MB = 1,024 KB
1 GB = 1,024 MB
1 TB = 1,024 GB

Examples:
4500.5 MB = 4.39 GB
2500 MB = 2.44 GB
```

---

## Next Steps 📋

1. ✅ Code integration complete
2. 🔄 **Run tests** (see "Testing in 3 Minutes")
3. 📝 Document results
4. 🐳 Setup Docker deployment
5. 🚀 Deploy to Portainer

---

## Quick Links 🔗

- **Full Features**: See [RESEARCH_ROOM_FEATURES.md](./RESEARCH_ROOM_FEATURES.md)
- **Deployment**: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Complete Summary**: See [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
- **Main Docs**: See [README.md](./README.md)
- **Quick Start**: See [QUICKSTART.md](./QUICKSTART.md)

---

## Support 💬

**Issue**: Something's not working?
1. Check troubleshooting section above
2. Check browser console (F12 → Console tab)
3. Check backend logs
4. Review the full documentation files

**Want more details?**
- See [RESEARCH_ROOM_FEATURES.md](./RESEARCH_ROOM_FEATURES.md) for complete feature guide
- See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for testing procedures

---

**Status**: ✅ Ready to Test
**Last Updated**: 2024
**Next**: Run `python verify_syntax.py` to begin!
