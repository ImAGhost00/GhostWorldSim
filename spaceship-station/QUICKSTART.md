# Spaceship Station Visualizer - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Python Dependencies

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**macOS/Linux:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Validate Setup (Optional)

```bash
python validate.py
```

Should output:
```
✅ ALL CHECKS PASSED

You can now run: python main.py
```

### Step 3: Start the Server

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:0420
INFO:     Starting Spaceship Station Visualizer (MOCK_MODE=true)
```

### Step 4: Open Web UI

Navigate to: **http://localhost:0420**

You should see:
- ⚓ Header with "SPACESHIP STATION VISUALIZER"
- Isometric grid with container modules (using mock data)
- System metrics sidebar on the right
- 🤖 AI CORE button in header

---

## 🎮 First Time Usage

1. **Explore the Grid**
   - You should see 8-10 container modules (komga, jellyfin, qbittorrent, etc.)
   - They have different colors representing different module types

2. **Click a Module**
   - Click on any colored box on the grid
   - Right sidebar slides in with logs and metrics
   - Click "🔄 Restart" to test the interaction (uses mock mode)

3. **Watch System Metrics**
   - Right sidebar shows live CPU, memory, disk usage
   - Metric bars update in real-time via WebSocket
   - Check "DOCKING BAY" for torrent speeds

4. **Try AI Chat**
   - Click "🤖 AI CORE" button (won't work without Ollama, but UI is functional)
   - Type a command like "Status report"
   - See how the interface handles responses

---

## 🔧 Configuration

### Using Live Docker (Instead of Mock Mode)

1. **Stop the server** (Ctrl+C)
2. **Edit or create `backend/.env`:**
   ```bash
   MOCK_MODE=false
   ```
3. **Ensure Docker daemon is running:**
   ```bash
   docker ps
   ```
4. **Restart server:**
   ```bash
   python main.py
   ```

The app will now connect to your actual Docker daemon and display real containers.

### Using AI Features (Requires Ollama)

1. **Install Ollama** from https://ollama.ai
2. **Start Ollama:**
   ```bash
   ollama serve
   ```
3. **Pull a model:**
   ```bash
   ollama pull neural-chat
   ```
4. **Test connection:**
   ```bash
   curl http://localhost:11434/api/tags
   ```
5. **Click 🤖 AI CORE in the app** to use AI chat

---

## 📋 Project Structure

```
spaceship-station/
├── backend/
│   ├── main.py                    # ← START HERE (FastAPI server)
│   ├── validate.py                # ← Run this to check setup
│   ├── requirements.txt           # ← Python dependencies
│   ├── .env.example               # ← Config template
│   ├── collectors/
│   │   ├── docker_agent.py        # Container monitoring
│   │   ├── system.py              # CPU/memory/disk metrics
│   │   └── torrent_agent.py       # Torrent tracking
│   └── ai_core/
│       ├── agent_gateway.py       # Ollama integration
│       └── tools/                 # AI-generated scripts go here
├── frontend/
│   ├── index.html                 # Main UI
│   ├── src/
│   │   ├── main.js                # WebSocket + Phaser init
│   │   ├── scenes/
│   │   │   └── BaseScene.js       # Isometric rendering
│   │   └── ui/
│   │       └── hud.js             # UI utilities
│   └── assets/                    # (Sprites generated at runtime)
├── README.md                      # Full documentation
├── start.bat                      # Windows startup script
└── QUICKSTART.md                  # ← You are here
```

---

## 🧪 Testing Endpoints

### Test Health Check
```bash
curl http://localhost:0420/api/health
```

**Response:**
```json
{
  "status": "online",
  "mock_mode": true,
  "timestamp": "2024-08-25T12:34:56.789Z"
}
```

### Test Container Listing
```bash
curl http://localhost:0420/api/containers
```

### Test System Metrics
```bash
curl http://localhost:0420/api/system
```

### Test WebSocket in Browser Console
```javascript
const ws = new WebSocket('ws://localhost:0420/ws');
ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log(data.type, '- Containers:', data.containers.length);
};
```

---

## 🐛 Common Issues

### "ModuleNotFoundError: No module named 'fastapi'"
**Solution:** Run `pip install -r requirements.txt` in the backend directory after activating venv

### "Address already in use: ('0.0.0.0', 8000)"
**Solution:** Either:
- Close other app using port 8000
- Change port in `main.py` line: `uvicorn.run(app, port=8001, ...)`

### "Failed to connect to Docker daemon"
**Solution:** Either:
- Enable Docker Desktop / ensure Docker is running
- Use `MOCK_MODE=true` to test without Docker

### WebSocket shows "OFFLINE"
**Solution:** 
- Verify server is running: `http://localhost:0420/api/health`
- Check browser console for errors (F12)
- Verify firewall isn't blocking port 8000

### AI Chat says "Unable to connect"
**Solution:** Ollama is optional
- Install Ollama if you want AI features
- Mock mode works fine without it
- App still functions for monitoring

---

## 🎯 Next Steps

### To Learn More:
- Read **README.md** for full documentation
- Check **docker_agent.py** to customize container mappings
- Edit **BaseScene.js** to customize isometric rendering
- Explore AI tool generation in **agent_gateway.py**

### To Extend:
- Add new metrics collectors in `collectors/`
- Create new API endpoints in `main.py`
- Customize module colors and layouts in `MODULE_CATALOG`
- Generate AI tools via `/api/ai/tool/generate` endpoint

### To Deploy:
- Use Docker Compose for production setup
- Configure nginx reverse proxy for HTTPS
- Use systemd service for Linux auto-start
- Set `MOCK_MODE=false` and configure live Docker/Ollama

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for JavaScript errors
2. Check terminal for Python errors
3. Run `validate.py` to verify dependencies
4. Review logs in `/api/containers/{name}/logs` endpoint

---

**Happy monitoring! 🚀**

*Spaceship Station v0.1.0*
