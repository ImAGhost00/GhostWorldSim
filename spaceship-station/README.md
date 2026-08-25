# 🚀 Spaceship Station Visualizer

**Real-time homelab server monitoring as an isometric 2D spaceship with self-evolving AI core integration.**

A full-stack web application that visualizes your Docker containers, system metrics, and torrent transfers as thematic "modules" on an isometric station grid. Includes a foundation for AI-driven automation via local Ollama integration.

---

## 🎯 Features

- **Isometric Station Visualization** – Phaser 3-based canvas rendering of Docker containers as spaceship modules
- **Real-time Metrics Streaming** – WebSocket-driven system CPU, memory, disk, and network metrics
- **Container Management HUD** – Click modules to inspect logs, CPU/RAM usage, and restart containers
- **Torrent Monitoring** – Track qBittorrent active transfers and download speeds
- **AI Command Core** – Sandboxed Ollama integration for system queries and tool generation
- **Mock Mode Support** – Test UI without running Docker or live services
- **Responsive Dashboard** – Tailwind CSS overlay panels for logs, metrics, and AI chat

---

## 🏗️ Architecture

```
spaceship-station/
├── backend/
│   ├── main.py                      # FastAPI server + WebSocket broadcaster
│   ├── collectors/
│   │   ├── docker_agent.py          # Container inspector (live + mock mode)
│   │   ├── system.py                # Host metrics collector (psutil)
│   │   └── torrent_agent.py         # qBittorrent API client
│   ├── ai_core/
│   │   ├── agent_gateway.py         # Ollama integration + tool execution
│   │   └── tools/                   # Dynamically generated AI tools
│   └── requirements.txt
├── frontend/
│   ├── index.html                   # Main UI + Tailwind styling
│   ├── src/
│   │   ├── main.js                  # WebSocket client + Phaser init
│   │   ├── scenes/
│   │   │   └── BaseScene.js         # Isometric grid + module rendering
│   │   └── ui/
│   │       └── hud.js               # HUD utilities + log formatting
│   └── assets/                      # (Generated sprites at runtime)
└── README.md
```

---

## 🔧 Installation

### Prerequisites

- **Python 3.10+**
- **Node.js / Browser** (for frontend)
- **Docker** (optional; app works in mock mode without it)
- **Ollama** (optional; required for AI features)

### Backend Setup

1. **Create a Python virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables** (create `.env` file in backend/):
   ```bash
   MOCK_MODE=true              # Set to 'false' to connect to live Docker
   OLLAMA_HOST=http://localhost:11434
   QBITTORRENT_HOST=http://localhost:8080
   ```

### Frontend Setup

The frontend is entirely static (HTML/JS/CSS) and is served by the FastAPI backend. No build step required.

- Phaser 3 is loaded via CDN
- Tailwind CSS is loaded via CDN
- All JavaScript modules load client-side

---

## 🚀 Running the Application

### 1. Start the Backend Server

```bash
cd backend
python main.py
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Starting Spaceship Station Visualizer (MOCK_MODE=true)
```

### 2. Open the Web UI

Navigate to: **http://localhost:8000**

You should see:
- Isometric grid with container modules
- Real-time system metrics in the right sidebar
- Animated worker sprites on high-load modules

---

## 📋 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MOCK_MODE` | `true` | Use mock data instead of live Docker API |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL for AI features |
| `QBITTORRENT_HOST` | `http://localhost:8080` | qBittorrent WebUI URL |

### Docker Container Mapping

The app automatically maps your ghostworld containers to thematic modules:

| Container | Module Type | Location | Color |
|-----------|------------|----------|-------|
| `ollama` | Command Deck | (5,5) | #ff6b9d |
| `jellyfin` | Media Archive | (4,7) | #00b4d8 |
| `qbittorrent` | Docking Bay | (8,2) | #ff7675 |
| `authentik-*` | Security Bay | (2-3,2-3) | #4ecdc4 |
| `gluetun` | Network Gateway | (0,5) | #00b894 |
| `sonarr` / `radarr` | Automation Hub | (6-7,1-2) | Various |

(Full mapping defined in [docker_agent.py](backend/collectors/docker_agent.py#L20))

---

## 🎮 Usage Guide

### Inspecting Containers

1. **Click a module** on the isometric grid
2. The inspector drawer slides in from the right
3. View:
   - Container status badge
   - CPU/RAM metrics
   - Recent log entries
   - Restart button

### System Metrics (Right Sidebar)

- **CPU Usage** – Real-time host CPU percentage
- **Memory Usage** – Total RAM consumption
- **Disk Usage** – Root partition utilization
- **Network Throughput** – Live download/upload speeds
- **Docking Bay** – Active torrent counts and speeds

### AI Command Core Chat

1. Click **🤖 AI CORE** button in header
2. Type a command or query (e.g., "What containers are using the most CPU?")
3. AI responds with analysis and suggestions
4. Optional: Toggle **Include Station Context** to send live metrics with query

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main HTML page |
| `/api/health` | GET | Health check |
| `/api/containers` | GET | List all containers + metrics |
| `/api/containers/{name}/logs` | GET | Get container logs (tail param supported) |
| `/api/containers/{name}/restart` | POST | Restart container |
| `/api/system` | GET | Host system metrics |
| `/api/torrents` | GET | Active torrent stats |
| `/api/ai/query` | POST | Query AI agent |
| `/api/ai/models` | GET | List available Ollama models |
| `/api/ai/tools` | GET | List generated tools |
| `/ws` | WebSocket | Real-time metrics stream |

---

## 🤖 AI Core & Tool Generation

### Querying the AI

**POST** `/api/ai/query`

```json
{
  "prompt": "What containers need optimization?",
  "include_context": true
}
```

**Response:**
```json
{
  "prompt": "What containers need optimization?",
  "response": "Command Core Analysis: Your qBittorrent and Jellyfin are operating within normal parameters...",
  "timestamp": "2024-08-25T12:34:56.789Z"
}
```

### Generating Tools

Tools are Python scripts that can be auto-generated by the AI and executed in a sandboxed environment:

**POST** `/api/ai/tool/generate`

```json
{
  "tool_spec": {
    "name": "memory_optimizer",
    "code": "#!/usr/bin/env python3\nimport psutil\nprint(f'Memory: {psutil.virtual_memory().percent}%')"
  }
}
```

Tools are stored in `backend/ai_core/tools/` and can be executed via:

**POST** `/api/ai/tool/{tool_name}/execute`

```json
{
  "args": {}
}
```

---

## 🧪 Testing

### Test WebSocket Connection

```bash
# In browser console:
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({type: 'ping'}));
```

### Test REST Endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# Get containers
curl http://localhost:8000/api/containers

# Get system metrics
curl http://localhost:8000/api/system

# Query AI
curl -X POST http://localhost:8000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Status report","include_context":true}'
```

---

## 🔌 Connecting to Live Docker

To switch from mock mode to live container monitoring:

1. **Stop the server** (Ctrl+C)
2. **Set environment variable:**
   ```bash
   # Windows CMD:
   set MOCK_MODE=false
   
   # Windows PowerShell:
   $env:MOCK_MODE="false"
   
   # macOS/Linux:
   export MOCK_MODE=false
   ```
3. **Ensure Docker daemon is running** and accessible
4. **Restart server:**
   ```bash
   python main.py
   ```

The app will auto-detect your running containers and render them on the grid.

---

## 🔌 Connecting to Ollama (AI Features)

1. **Install Ollama** from https://ollama.ai
2. **Pull a model:**
   ```bash
   ollama pull neural-chat
   ```
3. **Start Ollama** (runs on http://localhost:11434 by default):
   ```bash
   ollama serve
   ```
4. **Verify connection:**
   ```bash
   curl http://localhost:11434/api/tags
   ```
5. **Use AI features in the app** – Click 🤖 AI CORE to start querying

---

## 📊 Performance Metrics Explained

### CPU Usage Color Coding
- **Green** – 0-50%
- **Amber** – 50-75%
- **Red** – 75-100%

### Visual Indicators
- **Module Color Shift** – Reflects CPU load in real-time
- **Worker Sprites** – Spawn on modules with >20% CPU, animate with activity
- **Status Badges** – Running (●), Stopped (○), Unhealthy (⚠)

---

## 🛠️ Development & Extension

### Adding New Metrics

1. **Extend `SystemCollector`** in `backend/collectors/system.py`
2. **Emit via WebSocket** in `broadcast_metrics()` function
3. **Handle in client** `handleMetricsUpdate()` in `frontend/src/main.js`

### Adding New Modules

The `MODULE_CATALOG` in `docker_agent.py` defines the visual properties of each container. Add entries like:

```python
"myservice": {
    "module_type": "custom_bay",
    "name": "My Service",
    "description": "Custom description",
    "x": 10, "y": 8,
    "color": "#ffffff",
},
```

### Customizing the Isometric Grid

Edit `BaseScene.js`:
- `gridWidth` / `gridHeight` – Grid dimensions
- `tileWidth` / `tileHeight` – Tile size
- `drawIsometricGrid()` – Grid rendering logic

---

## 🐛 Troubleshooting

### WebSocket Connection Fails
- Check server is running: `http://localhost:8000/api/health`
- Browser console should show connection attempts
- Verify firewall isn't blocking port 8000

### Containers Not Appearing
- Set `MOCK_MODE=true` to test with mock data first
- If using live mode, verify Docker daemon is running: `docker ps`
- Check backend logs for Docker connection errors

### AI Core Returns "Unable to Connect"
- Verify Ollama is running: `ollama serve`
- Check OLLAMA_HOST environment variable
- Test connection: `curl http://localhost:11434/api/tags`

### High CPU on Worker Sprites
- Reduce `BROADCAST_INTERVAL` in `backend/main.py` (currently 2.0s)
- Limit number of active workers in `BaseScene.js`

---

## 📝 Future Roadmap

- [ ] **Persistent Tool Storage** – Save AI-generated tools to database
- [ ] **Metrics History** – Store and chart CPU/memory trends over time
- [ ] **Alert System** – Notifications when containers go down or metrics spike
- [ ] **Docker Compose Integration** – Auto-layout modules by service dependency
- [ ] **3D Rendering** – Optional Babylon.js 3D isometric view
- [ ] **Mobile UI** – Responsive design for mobile monitoring
- [ ] **Prometheus Integration** – Replace psutil with Prometheus scraping
- [ ] **GPU Monitoring** – NVIDIA GPU metrics alongside CPU/RAM

---

## 📄 License

This project is provided as-is for personal homelab use.

---

## 🤝 Contributing

Feel free to extend, customize, and adapt the architecture for your own infrastructure. Key areas for enhancement:

- Additional metric collectors (GPU, temperature, network per-interface)
- More sophisticated AI prompting and tool generation
- Visual customization (themes, grid sizes, module appearances)
- Integration with other monitoring stacks (Grafana, InfluxDB, etc.)

---

**Built with ❤️ for homelab enthusiasts and systems thinkers.**

*Spaceship Station Visualizer v0.1.0*
