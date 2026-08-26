# GhostWorld Services & Automation Guide

## 📋 Complete Service Inventory

Your GhostWorld stack runs **28 containerized services** organized into 6 functional categories. Spaceship Station monitors and can automate all of them.

---

## 🎯 Service Categories

### 🎬 Media & Entertainment (8 services)

| Service | Purpose | Port | Access |
|---------|---------|------|--------|
| **Jellyfin** | Media server (Movies/TV/Music) | 8096 | `http://localhost:8096` |
| **Seerr** | Media request portal | 5055 | `http://localhost:5055` |
| **Komga** | Comics & Manga server | 8080 | `http://localhost:8080` |
| **Calibre-Web-Auto (CWA)** | E-book management | 8083 | `http://localhost:8083` |
| **Shelfmark** | Book downloader/metadata | 3000 | `http://localhost:3000` |
| **GameyFin** | PC game library manager | 5000 | `http://localhost:5000` |
| **RoMM** | Retro ROM manager | 7878 | `http://localhost:7878` |
| **RoMM-DB** | RoMM database backend | Internal | - |

**Use Cases**:
- Stream media with Jellyfin
- Request movies/shows via Seerr
- Browse comics on Komga
- Manage ebooks with CWA
- Track and download books with Shelfmark

---

### 📥 Downloading & Indexing - "Arr Stack" (7 services)

| Service | Purpose | Port | Access |
|---------|---------|------|--------|
| **Sonarr** | TV series automation | 8989 | `http://localhost:8989` |
| **Radarr** | Movie automation | 7878 | `http://localhost:7878` |
| **Bazarr** | Subtitle automation | 6767 | `http://localhost:6767` |
| **Prowlarr** | Indexer manager (connects to search providers) | 9696 | `http://localhost:9696` |
| **qBittorrent** | Torrent client (routed through Gluetun VPN) | 8080 | `http://localhost:8080` |
| **Unpackerr** | Auto-extracts archives | Internal | - |
| **Recyclarr** | Auto-syncs Arr configs | Internal | - |

**Workflow**:
1. Seerr → User requests movie
2. Radarr → Searches via Prowlarr indexes
3. qBittorrent → Downloads via Gluetun (VPN)
4. Unpackerr → Auto-extracts archive
5. Jellyfin → Scans and displays to user

---

### 🖥️ Dashboards & Monitoring (4 services)

| Service | Purpose | Port | Access |
|---------|---------|------|--------|
| **Homarr** | Homepage/dashboard | 7575 | `http://localhost:7575` |
| **Dashdot** | System metrics dashboard | 3001 | `http://localhost:3001` |
| **Wizarr** | User invites & onboarding | 5690 | `http://localhost:5690` |
| **Spaceship Station** | Docker visualization & automation | 4420 | `http://localhost:4420` |

---

### 🔐 Authentication & Security (5 services)

| Service | Purpose | Port | Notes |
|---------|---------|------|-------|
| **Authentik Server** | Identity provider (OAuth2/SAML) | 9000 | `http://localhost:9000` |
| **Authentik Worker** | Background jobs | Internal | - |
| **Authentik PostgreSQL** | User database | 5432 | Internal |
| **Authentik Redis** | Session cache & message broker | 6379 | Internal |
| **AdGuard Home** | Network-wide DNS ad-blocking | 3000 | `http://localhost:3000` |

**Use Cases**:
- Single sign-on for all services
- Block ads network-wide
- Centralized user management
- Session management via Redis

---

### 🌐 Networking & Gateway (3 services)

| Service | Purpose | Notes |
|---------|---------|-------|
| **Gluetun** | VPN gateway for qBittorrent | Routes torrent traffic through VPN |
| **Byparr** | Proxy/routing controller | Load balancing & bypass routing |
| **AdGuard** | DNS filtering | (Listed in both Security & Networking) |

---

### ⚙️ System Management (2 services)

| Service | Purpose | Port | Access |
|---------|---------|------|--------|
| **Portainer** | Docker UI (containers, images, volumes) | 9000 | `http://localhost:9000` |
| **Watchtower** | Auto-updates Docker containers | Internal | - |

---

## 🚀 Automation via Spaceship Station

### Web UI Controls
Access the **isometric dashboard** at `http://localhost:4420`:
- **View** real-time container stats
- **Click** any service module for details
- **Restart** containers with one click
- **Browse** logs
- **Monitor** resource usage

### Discord Bot Commands

Use `!station` prefix in any Discord channel:

```
!station status              # Full system status
!station containers         # List all running services
!station logs [service]     # Show recent logs (e.g., !station logs jellyfin)
!station restart [service]  # Restart a service (e.g., !station restart sonarr)
!station help              # Show all commands
```

**Approval Workflow**:
- Request via Discord: `!station restart qbittorrent`
- Bot asks for approval via reaction
- You approve/deny
- Action executes automatically

---

### REST API Endpoints

All services controllable via HTTP API:

#### System Status
```bash
# Server health
curl http://localhost:4420/api/health

# Detailed system status with all features
curl http://localhost:4420/api/status

# Discord bot status
curl http://localhost:4420/api/discord/status
```

#### Container Management
```bash
# List all containers
curl http://localhost:4420/api/containers

# Get specific container logs
curl http://localhost:4420/api/containers/jellyfin/logs?tail=50

# Restart a container (requires Discord approval)
curl -X POST http://localhost:4420/api/containers/sonarr/restart

# Request approval for an action
curl -X POST http://localhost:4420/api/control/request \
  -H "Content-Type: application/json" \
  -d '{
    "action": "restart",
    "container": "radarr",
    "reason": "Check for stuck processes"
  }'
```

#### System Metrics
```bash
# Real-time CPU, memory, disk, network
curl http://localhost:4420/api/system

# Per-container resource usage
curl http://localhost:4420/api/containers/qbittorrent

# Torrent transfer stats
curl http://localhost:4420/api/torrents

# Detailed torrent breakdown by category
curl http://localhost:4420/api/torrents/detailed
```

#### File Browser (Media Pools)
```bash
# List available media pools
curl http://localhost:4420/api/media/pools

# Browse a pool directory
curl "http://localhost:4420/api/media/browse?pool=media&path=/movies"

# Search files
curl "http://localhost:4420/api/media/search?pool=downloads&query=Game.of.Thrones"

# File type distribution
curl http://localhost:4420/api/media/types?pool=media
```

---

## 🤖 Common Automation Scenarios

### Scenario 1: Monitor Downloads
```bash
# Check current torrent activity
curl http://localhost:4420/api/torrents

# If stuck, request restart
curl -X POST http://localhost:4420/api/control/request \
  -d '{"action": "restart_qbittorrent", "reason": "Downloads stalled"}'
```

### Scenario 2: Update Configuration
```bash
# Check Sonarr/Radarr status
curl http://localhost:4420/api/containers/sonarr

# Restart to apply new config
curl -X POST http://localhost:4420/api/containers/sonarr/restart
```

### Scenario 3: Emergency Restart All
```bash
# Restart critical services
for service in sonarr radarr bazarr prowlarr qbittorrent; do
  curl -X POST http://localhost:4420/api/containers/$service/restart
done
```

### Scenario 4: Monitor System Health
```bash
# Set up periodic health checks
watch -n 30 'curl -s http://localhost:4420/api/system | jq ".cpu_percent, .memory_percent"'
```

---

## 📊 Service Dependencies

```
Seerr (User Requests)
    ↓
Radarr/Sonarr (Automation)
    ↓
Prowlarr (Search Indexes)
    ↓
qBittorrent (Download via Gluetun/VPN)
    ↓
Unpackerr (Extract Archives)
    ↓
Jellyfin (Stream to Users)
    ↓
Authentik (Authentication)
    ↓
AdGuard (DNS/Ad Blocking)
```

---

## 🔧 Configuration Tips

### Accessing Individual Service UIs
Even though Spaceship Station monitors everything, you can access each service directly:

**Media Stack**:
- Jellyfin: `http://localhost:8096`
- Seerr: `http://localhost:5055`
- Komga: `http://localhost:8080`

**Arr Stack**:
- Sonarr: `http://localhost:8989`
- Radarr: `http://localhost:7878`
- Bazarr: `http://localhost:6767`
- Prowlarr: `http://localhost:9696`

**Authentication**:
- Authentik: `http://localhost:9000`

**Management**:
- Portainer: `http://localhost:9000`
- Homarr: `http://localhost:7575`

### Environment Variables in Spaceship Station
```bash
# .env configuration
MOCK_MODE=false             # Connect to real Docker
ENABLE_AI=false             # AI disabled (hardware)
QBITTORRENT_HOST=http://qbittorrent:8080
DISCORD_BOT_TOKEN=your_token  # For Discord automation
```

---

## 🚨 Troubleshooting

### Service Not Appearing
1. Check if container is running: `docker ps`
2. Verify it's on `ghost_network`: `docker inspect [container]`
3. Confirm name matches MODULE_CATALOG in docker_agent.py

### Can't Connect via API
1. Verify port mapping: `docker-compose ps`
2. Check health: `curl http://localhost:4420/api/health`
3. View logs: `docker logs spaceship-station`

### Discord Bot Not Responding
1. Verify token: `echo $DISCORD_BOT_TOKEN`
2. Check bot permissions in Discord server
3. Ensure bot is in channel
4. View logs for connection errors

---

## 🎯 Next Steps

1. **Access Dashboard**: `http://localhost:4420`
2. **Set Up Discord Bot**: Get token, add `DISCORD_BOT_TOKEN` to `.env`
3. **Monitor Services**: Click modules to inspect
4. **Create Automations**: Build scripts using REST API
5. **Configure Webhooks**: Set up alerts for failures

---

**All 28 services monitored and controllable from one dashboard!** 🚀
