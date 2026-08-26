# 🚀 Spaceship Station Visualizer

**Real-time homelab server monitoring as an isometric 2D spaceship with Docker container visualization, torrent tracking, and file exploration.**

> An interactive web dashboard that visualizes your infrastructure as a spaceship station with isometric 2D graphics, real-time metrics streaming via WebSocket, and intuitive container management.

---

## ⚡ Quick Start

```bash
# 1. Navigate to project directory
cd spaceship-station

# 2. Install Python dependencies
cd backend
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env - set MOCK_MODE=true for testing

# 4. Start the backend server
python main.py

# 5. Open frontend in browser
# Navigate to http://localhost:4420
```

**Status**: `MOCK_MODE=true` ready for testing, no Docker required.

---

## 🎯 Features

### 🖼️ Isometric Station Visualization
- Real-time Docker container visualization as "spaceship modules"
- Color-coded health indicators (green → yellow → red)
- Worker sprite animations on high load
- Click modules to inspect details

### 📊 Real-Time Metrics
- CPU, memory, disk, and network monitoring via WebSocket
- System-wide and per-container breakdown
- 2-second metric update cycle
- Live performance graphs

### 🔬 Research Room (Media & Torrent Explorer)
- Browse media pools (`/media`, `/downloads`, `/torrents`)
- Search files across pools
- File type distribution analysis
- Torrent monitoring with speed/ratio tracking
- Categorized torrent grouping

### 🐳 Container Management
- View container logs in real-time
- Monitor resource usage per container
- One-click container restart
- Container status tracking

### 📥 Torrent Monitoring
- Track active downloads and seeding
- Monitor upload/download speeds
- Seed/peer counts
- Per-torrent ETA calculations
- Category-based organization

### 💬 Discord Integration (New!)
- Control server via Discord bot
- Approval system for actions
- Real-time notifications
- `!station` command interface

### 🧪 Mock Mode Testing
- Full-featured testing without Docker
- Realistic mock data included
- Zero infrastructure requirements
- Perfect for UI development

---

## 🛠️ System Requirements

### Minimum (Mock Mode)
- Python 3.8+
- 100 MB disk space
- Modern web browser

### Recommended (Real Mode)
- Python 3.10+
- Docker & Docker daemon running
- 2GB RAM minimum
- 500 GB storage for media pools

### Current Hardware (Verified)
- **CPU**: Ryzen 7 3700X ✅
- **GPU**: GTX 1070 (4GB) ✅
- **RAM**: 46 GB ✅
- **Status**: Running MOCK_MODE=true successfully

---

## 🚀 Running the Application

### Backend Server

```bash
cd spaceship-station/backend

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env

# Run in mock mode (recommended for testing)
MOCK_MODE=true python main.py

# Or run in production mode (requires Docker)
MOCK_MODE=false python main.py
```

**Server starts on**: `http://localhost:8000`

### Frontend

The frontend is automatically served by the FastAPI backend. Simply open your browser:

```
http://localhost:8000
```

All UI files are in `spaceship-station/frontend/`.

---

## 📁 Project Structure

```
spaceship-station/
├── backend/                     # FastAPI server
│   ├── main.py                 # Server + WebSocket broadcaster
│   ├── discord_integration.py  # Discord bot handler
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment template
│   ├── collectors/
│   │   ├── docker_agent.py     # Container monitoring
│   │   ├── system.py           # System metrics (psutil)
│   │   ├── torrent_agent.py    # qBittorrent API client
│   │   └── file_browser.py     # Media file exploration
│   ├── ai_core/
│   │   ├── agent_gateway.py    # Ollama integration (DISABLED)
│   │   └── tools/              # AI tool generators
│   └── validate.py             # Dependency checker
│
├── frontend/                    # Phaser 3 + Tailwind CSS UI
│   ├── index.html              # Main app shell
│   ├── src/
│   │   ├── main.js             # WebSocket client
│   │   ├── scenes/
│   │   │   └── BaseScene.js    # Isometric grid rendering
│   │   └── ui/
│   │       ├── hud.js          # HUD utilities
│   │       └── research-room.js # Media explorer
│   └── assets/                 # (Generated at runtime)
│
├── docker-compose.yml          # Complete stack definition
├── Dockerfile                  # Production Docker image
├── README.md                   # Project documentation
├── QUICKSTART.md               # 5-minute setup guide
├── MANIFEST.md                 # Feature checklist
├── DEPLOYMENT_CHECKLIST.md     # Testing procedures
├── INTEGRATION_SUMMARY.md      # Technical details
├── RESEARCH_ROOM_FEATURES.md   # Media explorer guide
└── QUICK_REFERENCE.md          # Quick command reference
```

---

## 🔧 Configuration

Create a `backend/.env` file with:

```bash
# Core
MOCK_MODE=true                    # Set false for real Docker monitoring
ENABLE_AI=false                   # AI disabled (insufficient VRAM)
DEBUG=false

# Discord (optional)
DISCORD_BOT_TOKEN=               # Leave empty to disable

# Services (when MOCK_MODE=false)
QBITTORRENT_HOST=localhost:8080
OLLAMA_HOST=http://localhost:11434

# Performance
LOG_LEVEL=info
BROADCAST_INTERVAL=2
```

**See `backend/.env.example` for all options.**

---

## 📡 API Endpoints

### System Status
```
GET /api/health              # Health check
GET /api/status              # Detailed system status
GET /api/discord/status      # Discord bot connection
```

### Container Management
```
GET /api/containers                           # List all containers
GET /api/containers/{name}/logs               # Container logs
POST /api/containers/{name}/restart           # Restart container
```

### System Metrics
```
GET /api/system                   # CPU, memory, disk, network
GET /api/torrents                 # Torrent transfer stats
GET /api/torrents/detailed        # Torrents by category
GET /api/torrents/{hash}          # Specific torrent details
```

### Media & File Browsing
```
GET /api/media/pools              # Available media pools
GET /api/media/browse             # Browse directories
GET /api/media/search             # Search files
GET /api/media/types              # File type breakdown
GET /api/media/file-info          # File metadata
```

### System Control
```
POST /api/control/request         # Request action approval (Discord)
```

### WebSocket
```
WS /ws                            # Real-time metrics stream
```

---

## 🎮 Usage Examples

### 1. Monitor Container Health

1. Open http://localhost:8000
2. View isometric grid with modules
3. Click any module to see:
   - Container name
   - CPU/Memory usage
   - Container status
   - Recent logs

### 2. Explore Media Files

1. Click 🔬 **RESEARCH** button
2. Select **Media Pool** tab
3. Browse folders or search
4. View file distribution chart

### 3. Monitor Torrents

1. Click 🔬 **RESEARCH** button
2. Select **Torrents** tab
3. Click torrent for detailed stats:
   - Download/upload speeds
   - Seed/peer counts
   - Progress bar
   - ETA to completion

### 4. Control via Discord (New!)

```bash
# In Discord channel:
!station status        # Get server status
!station containers    # List containers
!station approve ID    # Approve action
!station help          # Show available commands
```

---

## 🐳 Docker Deployment

### Quick Deploy

```bash
cd spaceship-station

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Configuration

Edit `docker-compose.yml` to set:
- Volume mounts: `/media`, `/downloads`, `/torrents`
- Environment variables
- Network settings

---

## 🤖 AI Core (Optional)

**Status**: Currently DISABLED due to hardware constraints.

The AI core requires:
- 8GB+ VRAM for real-time inference
- Current system: GTX 1070 (4GB) - insufficient

To enable (if you upgrade hardware):

```bash
# Edit backend/.env
ENABLE_AI=true

# Ensure Ollama is running
ollama serve

# The app will auto-detect and activate AI features
```

### Recommended Alternative

Use **Discord integration** for system control instead:
- No VRAM requirements
- Natural language commands
- Approval workflow
- Real-time notifications

---

## 💬 Discord Integration (Recommended for Your Hardware)

### Setup

1. **Create Discord Application**
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Go to "Bot" section and click "Add Bot"
   - Copy the bot token

2. **Configure Environment**
   ```bash
   # In backend/.env
   DISCORD_BOT_TOKEN=your_token_here
   ```

3. **Add Bot to Server**
   - OAuth2 URL: `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=68608&scope=bot`
   - Click link to invite bot to your server

4. **Use Commands**
   ```
   !station status        - Server status
   !station containers    - Container list
   !station help          - Help menu
   ```

---

## 🔍 Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.8+

# Verify dependencies
python -m py_compile backend/main.py

# Check .env file exists
ls -la backend/.env
```

### Research Room empty

```bash
# Verify MOCK_MODE in .env
MOCK_MODE=true

# Restart backend
pkill -f "python main.py"
MOCK_MODE=true python backend/main.py
```

### Discord bot not responding

```bash
# Verify token is set
grep DISCORD_BOT_TOKEN backend/.env

# Check backend logs for connection errors
# Look for "Discord bot connected" message
```

### Performance issues

- Ensure `MOCK_MODE=true` for testing
- Reduce `FILE_BROWSER_MAX_RESULTS` in .env
- Check system resources: `top` or Task Manager

---

## 📚 Documentation

- **[QUICKSTART.md](./spaceship-station/QUICKSTART.md)** - 5-minute setup
- **[RESEARCH_ROOM_FEATURES.md](./spaceship-station/RESEARCH_ROOM_FEATURES.md)** - Media explorer guide
- **[DEPLOYMENT_CHECKLIST.md](./spaceship-station/DEPLOYMENT_CHECKLIST.md)** - Testing procedures
- **[QUICK_REFERENCE.md](./spaceship-station/QUICK_REFERENCE.md)** - Command reference
- **[README.md](./spaceship-station/README.md)** - Detailed project documentation

---

## 🛣️ Roadmap

### Current (Working)
- ✅ Isometric visualization
- ✅ Real-time metrics
- ✅ Container management
- ✅ Torrent monitoring
- ✅ Research Room (file browser)
- ✅ Discord integration
- ✅ Mock mode testing

### Near Term
- [ ] Thumbnail previews for media
- [ ] File type filtering
- [ ] Advanced torrent control (pause/resume)
- [ ] Notification system

### Future
- [ ] Multiple homelab monitoring
- [ ] Historical metrics storage
- [ ] Advanced filtering and search
- [ ] Custom dashboard layouts
- [ ] Mobile app companion

---

## 💡 Hardware Notes

**Your System**:
- CPU: Ryzen 7 3700X ✅ (8 cores, good for Docker)
- GPU: GTX 1070 (4GB) ✅ (suitable for rendering, not AI inference)
- RAM: 46 GB ✅ (plenty for containers and monitoring)

**Recommendations**:
1. ✅ Keep `MOCK_MODE=true` for testing
2. ✅ Use Discord for control (better than AI)
3. ✅ Monitor resource usage during large transfers
4. ⏰ Consider GPU upgrade if you want real-time AI inference in the future

---

## 🤝 Contributing

Found an issue? Have suggestions?

1. Check [DEPLOYMENT_CHECKLIST.md](./spaceship-station/DEPLOYMENT_CHECKLIST.md) for known issues
2. File an issue with:
   - What you were doing
   - What went wrong
   - System specs
   - Logs (if available)

---

## 📄 License

MIT License - Feel free to use for your homelab monitoring!

---

## 🙋 Support

### Quick Help

```bash
# Check server is running
curl http://localhost:8000/api/health

# Test media endpoints
curl http://localhost:8000/api/media/pools

# View Discord status
curl http://localhost:8000/api/discord/status
```

### Getting Help

1. Check logs: `docker-compose logs app`
2. Review documentation in `spaceship-station/`
3. Verify `.env` configuration
4. Test with `MOCK_MODE=true`

---

**Ready to monitor your homelab? Start with** `MOCK_MODE=true` **and** `ENABLE_AI=false` **for your hardware!** 🚀

Last Updated: 2024  
Status: Production Ready
