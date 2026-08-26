"""
Spaceship Station Visualizer Backend
FastAPI server with WebSocket streaming for real-time metrics and container status.
"""

import requests
import asyncio
import os
import json
from typing import Set, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from collectors.docker_agent import DockerAgent
from collectors.system import SystemCollector
from collectors.torrent_agent import TorrentAgent
from collectors.file_browser import FileBrowserAgent

# Optional AI import (graceful degradation if not available)
try:
    from ai_core.agent_gateway import AIAgentGateway
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    AIAgentGateway = None

# Discord integration
from discord_integration import DiscordBotManager


# ============================================================================
# Configuration & Initialization
# ============================================================================

# System Environment
PUID = os.getenv("PUID", "1000")
PGID = os.getenv("PGID", "1000")
TZ = os.getenv("TZ", "UTC")
MEDIA_DIRECTORY = os.getenv("MEDIA_DIRECTORY", "/media")
INSTALL_DIRECTORY = os.getenv("INSTALL_DIRECTORY", "/app")
MEDIA_SERVICE = os.getenv("MEDIA_SERVICE", "jellyfin")

# App Configuration
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
ENABLE_AI = os.getenv("ENABLE_AI", "false").lower() == "true"
BROADCAST_INTERVAL = float(os.getenv("BROADCAST_INTERVAL", "2.0"))

docker_agent = DockerAgent(mock_mode=MOCK_MODE)
system_collector = SystemCollector()
torrent_agent = TorrentAgent(mock_mode=MOCK_MODE)
file_browser = FileBrowserAgent(mock_mode=MOCK_MODE, media_dir=MEDIA_DIRECTORY, install_dir=INSTALL_DIRECTORY)
ai_gateway = AIAgentGateway() if (AI_AVAILABLE and ENABLE_AI) else None
discord_bot = DiscordBotManager()

# Track active WebSocket connections for broadcasting
active_connections: Set[WebSocket] = set()


async def broadcast_metrics():
    """Continuously broadcast metrics to all connected clients."""
    while True:
        try:
            await asyncio.sleep(BROADCAST_INTERVAL)
            
            # Collect all metrics
            containers = docker_agent.get_containers()
            system_metrics = system_collector.get_all_metrics()
            torrent_stats = torrent_agent.get_transfer_stats()
            
            # Build payload
            ai_status = {
                "model": ai_gateway.model if ai_gateway else None,
                "tools_available": ai_gateway.get_tool_status() if ai_gateway else [],
                "enabled": ai_gateway is not None,
            }
            payload = {
                "type": "metrics_update",
                "timestamp": datetime.now().isoformat(),
                "containers": containers,
                "system": system_metrics,
                "torrents": torrent_stats,
                "ai_status": ai_status,
            }
            
            # Broadcast to all connected clients
            disconnected = set()
            for connection in active_connections:
                try:
                    await connection.send_json(payload)
                except Exception as e:
                    print(f"Error broadcasting to client: {e}")
                    disconnected.add(connection)
            
            # Clean up disconnected clients
            for connection in disconnected:
                active_connections.discard(connection)
        
        except Exception as e:
            print(f"Broadcast error: {e}")


async def start_background_tasks():
    """Start background task for metric broadcasting."""
    asyncio.create_task(broadcast_metrics())


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for app startup/shutdown."""
    print(f"Starting Spaceship Station Visualizer (MOCK_MODE={MOCK_MODE})")
    await start_background_tasks()
    yield
    print("Shutting down Spaceship Station Visualizer")
    active_connections.clear()


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="Spaceship Station Visualizer",
    description="Real-time homelab monitoring as an isometric spaceship",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REST API Endpoints
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "online",
        "mock_mode": MOCK_MODE,
        "ai_enabled": ENABLE_AI and AI_AVAILABLE,
        "discord_enabled": discord_bot.enabled,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/system/environment")
async def get_environment():
    """Get system environment configuration."""
    return {
        "system": {
            "puid": PUID,
            "pgid": PGID,
            "timezone": TZ,
        },
        "paths": {
            "media_directory": MEDIA_DIRECTORY,
            "install_directory": INSTALL_DIRECTORY,
        },
        "services": {
            "media_service": MEDIA_SERVICE,
        },
        "runtime": {
            "mock_mode": MOCK_MODE,
            "ai_enabled": ENABLE_AI and AI_AVAILABLE,
        },
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/status")
async def system_status():
    """Get detailed system status including features."""
    return {
        "status": "online",
        "features": {
            "monitoring": True,
            "container_management": True,
            "torrent_tracking": True,
            "ai_core": ENABLE_AI and AI_AVAILABLE,
            "discord_integration": discord_bot.enabled,
            "file_browsing": True,
            "research_room": True,
        },
        "environment": {
            "system": {
                "puid": PUID,
                "pgid": PGID,
                "timezone": TZ,
            },
            "paths": {
                "media_directory": MEDIA_DIRECTORY,
                "install_directory": INSTALL_DIRECTORY,
            },
            "media_service": MEDIA_SERVICE,
        },
        "discord": discord_bot.get_status(),
        "hardware": {
            "mock_mode": MOCK_MODE,
            "note": "Running in MOCK_MODE - set MOCK_MODE=false to connect to live Docker"
        },
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/control/request")
async def request_system_control(request_body: Dict[str, Any]):
    """Request approval for system control action via Discord."""
    action = request_body.get("action", "unknown")
    details = request_body.get("details", "")
    request_id = request_body.get("request_id", "manual")
    
    if not discord_bot.enabled:
        # In mock mode or without Discord, auto-approve
        return {
            "request_id": request_id,
            "status": "approved",
            "method": "auto_approved",
            "reason": "Discord not configured - auto-approving",
            "timestamp": datetime.now().isoformat(),
        }
    
    # Request approval from Discord
    approval_message = f"**{action}**\n{details}\n\nUse `!station approve {request_id}` to approve"
    
    return {
        "request_id": request_id,
        "status": "pending",
        "method": "discord_approval",
        "message": approval_message,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/discord/status")
async def discord_status():
    """Get Discord bot connection status."""
    return discord_bot.get_status()


@app.get("/api/containers")
async def get_containers():
    """Get current container status and metrics."""
    return {
        "containers": docker_agent.get_containers(),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/containers/{container_name}/logs")
async def get_container_logs(container_name: str, tail: int = 50):
    """Get recent logs from a container."""
    logs = docker_agent.get_container_logs(container_name, tail=tail)
    return {
        "container": container_name,
        "logs": logs,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/containers/{container_name}/restart")
async def restart_container(container_name: str):
    """Request container restart."""
    success = docker_agent.restart_container(container_name)
    return {
        "container": container_name,
        "action": "restart",
        "success": success,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/system")
async def get_system_metrics():
    """Get current system-wide metrics."""
    return {
        "metrics": system_collector.get_all_metrics(),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/torrents")
async def get_torrents():
    """Get active torrent status."""
    return {
        "torrents": torrent_agent.get_transfer_stats(),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/torrents/detailed")
async def get_torrents_detailed():
    """Get detailed torrent information by category."""
    return {
        "detail": torrent_agent.get_torrents_by_category(),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/torrents/{torrent_hash}")
async def get_torrent_details(torrent_hash: str):
    """Get detailed information about a specific torrent."""
    result = torrent_agent.get_torrent_details(torrent_hash)
    return {
        "result": result,
        "timestamp": datetime.now().isoformat(),
    }


# ============================================================================
# File Browser Endpoints (Media Pool & Downloads)
# ============================================================================

@app.get("/api/media/pools")
async def get_media_pools():
    """Get available media pools and their statistics."""
    return {
        "pools": file_browser.get_pools(),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/media/browse")
async def browse_media(pool: str, path: str = ""):
    """Browse a directory in a media pool."""
    result = file_browser.browse_directory(pool, path)
    return {
        "result": result,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/media/file-info")
async def get_file_info(pool: str, path: str):
    """Get detailed information about a file."""
    result = file_browser.get_file_info(pool, path)
    return {
        "result": result,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/media/search")
async def search_media(pool: str, query: str, max_results: int = 50):
    """Search for files in a pool."""
    result = file_browser.search_files(pool, query, max_results)
    return {
        "result": result,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/media/types")
async def get_media_types(pool: str):
    """Get breakdown of file types in a pool."""
    result = file_browser.get_media_types(pool)
    return {
        "result": result,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/ai/query")
async def query_ai(request: Dict[str, Any]):
    """Query the AI agent with optional context."""
    if not ai_gateway:
        return {
            "error": "AI is currently disabled. Set ENABLE_AI=true to use this feature.",
            "hardware_note": "AI features require significant GPU/RAM. Current system may not support real-time inference.",
            "alternative": "Use Discord bot for server commands instead.",
        }, 503
    
    prompt = request.get("prompt", "Status report")
    include_context = request.get("include_context", False)
    
    context = None
    if include_context:
        context = {
            "containers": [{"name": c["name"], "state": c["state"]} 
                          for c in docker_agent.get_containers()],
            "system": system_collector.get_all_metrics(),
        }
    
    response = ai_gateway.query_agent(prompt, context)
    return {
        "prompt": prompt,
        "response": response,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/ai/models")
async def get_ai_models():
    """List available AI models."""
    if not ai_gateway:
        return {
            "status": "disabled",
            "reason": "AI features are disabled (ENABLE_AI=false)",
            "available_models": [],
            "current_model": None,
        }
    
    return {
        "status": "enabled",
        "available_models": ai_gateway.list_available_models(),
        "current_model": ai_gateway.model,
    }


@app.post("/api/ai/tool/generate")
async def generate_ai_tool(request: Dict[str, Any]):
    """Generate a new AI tool."""
    if not ai_gateway:
        return {
            "error": "AI is disabled",
            "success": False,
            "timestamp": datetime.now().isoformat(),
        }, 503
    
    tool_spec = request.get("tool_spec", {})
    success = ai_gateway.generate_tool(tool_spec)
    return {
        "tool_name": tool_spec.get("name", "unknown"),
        "success": success,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/ai/tools")
async def get_ai_tools():
    """Get status of all AI tools."""
    if not ai_gateway:
        return {
            "status": "disabled",
            "tools": [],
            "message": "AI features are currently disabled",
        }
    
    return ai_gateway.get_tool_status()


@app.post("/api/ai/tool/{tool_name}/execute")
async def execute_ai_tool(tool_name: str, request: Dict[str, Any]):
    """Execute a generated AI tool."""
    if not ai_gateway:
        return {
            "error": "AI is disabled",
            "tool_name": tool_name,
            "timestamp": datetime.now().isoformat(),
        }, 503
    
    args = request.get("args", {})
    result = ai_gateway.execute_tool(tool_name, args)
    return {
        "tool_name": tool_name,
        "result": result,
        "timestamp": datetime.now().isoformat(),
    }


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time metrics streaming."""
    await websocket.accept()
    active_connections.add(websocket)
    
    print(f"Client connected. Total connections: {len(active_connections)}")
    
    try:
        # Keep connection alive
        while True:
            # Wait for client messages (optional keepalive, close commands, etc.)
            data = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
            
            # Handle commands from client
            try:
                message = json.loads(data)
                command = message.get("type")
                
                if command == "ping":
                    await websocket.send_json({"type": "pong"})
                elif command == "restart_container":
                    container_name = message.get("container")
                    success = docker_agent.restart_container(container_name)
                    await websocket.send_json({
                        "type": "container_restart_result",
                        "container": container_name,
                        "success": success,
                    })
            except json.JSONDecodeError:
                pass
    
    except asyncio.TimeoutError:
        print("WebSocket timeout (client inactive)")
    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        active_connections.discard(websocket)
        print(f"Client removed. Total connections: {len(active_connections)}")


# ============================================================================
# Static Files
# ============================================================================

# Serve frontend assets
frontend_path = os.path.join(os.path.dirname(__file__), "frontend")
assets_path = os.path.join(frontend_path, "assets")

# Create assets directory if it doesn't exist
if not os.path.exists(assets_path):
    os.makedirs(assets_path, exist_ok=True)

if os.path.exists(assets_path):
    app.mount("/static", StaticFiles(directory=assets_path), name="static")


@app.get("/")
async def root():
    """Serve main HTML file."""
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        return {"message": "Spaceship Station Visualizer API is running"}


# ============================================================================
# Configuration Management
# ============================================================================

CONFIG = {
    "services": {
        "jellyfin": {"api_key": "", "url": "", "enabled": False},
        "sonarr": {"api_key": "", "url": "", "enabled": False},
        "radarr": {"api_key": "", "url": "", "enabled": False},
        "prowlarr": {"api_key": "", "url": "", "enabled": False},
        "qbittorrent": {"username": "", "password": "", "url": "", "enabled": False},
        "discord": {"bot_token": "", "enabled": False},
        "ollama": {"url": "", "model": "", "enabled": False},
    },
    "settings": {
        "theme": "dark",
        "grid_size": "12x12",
        "update_interval": 2.0,
        "show_grid_labels": True,
        "notification_level": "warnings",
    }
}


@app.get("/api/config/get")
async def get_config():
    """Get current configuration (excluding sensitive values for non-admin)."""
    return {
        "services": {
            k: {**v, "api_key": "***" if v.get("api_key") else "", "bot_token": "***" if v.get("bot_token") else "", "password": "***" if v.get("password") else ""}
            for k, v in CONFIG["services"].items()
        },
        "settings": CONFIG["settings"],
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/config/update")
async def update_config(request: Dict[str, Any]):
    """Update configuration (requires validation)."""
    section = request.get("section", "")  # "services" or "settings"
    key = request.get("key", "")
    value = request.get("value", None)
    
    if section == "settings" and key in CONFIG["settings"]:
        CONFIG["settings"][key] = value
        return {
            "status": "updated",
            "section": "settings",
            "key": key,
            "timestamp": datetime.now().isoformat(),
        }
    
    elif section == "services" and key in CONFIG["services"]:
        CONFIG["services"][key].update(value)
        return {
            "status": "updated",
            "section": "services",
            "service": key,
            "timestamp": datetime.now().isoformat(),
        }
    
    return {"status": "error", "message": "Invalid config path"}, 400


@app.post("/api/config/validate-service")
async def validate_service(request: Dict[str, Any]):
    """Validate service connectivity by testing actual connection."""
    service_name = request.get("service", "")
    config = request.get("config", {})
    
    if not config:
        return {"service": service_name, "valid": False, "message": "No configuration provided"}
    
    try:
        # Service-specific validation
        if service_name == "jellyfin":
            if not config.get("url"):
                return {"service": service_name, "valid": False, "message": "URL required"}
            url = f"{config['url'].rstrip('/')}/api/system/info"
            headers = {"X-MediaBrowser-Token": config.get("api_key", "")} if config.get("api_key") else {}
            response = requests.get(url, headers=headers, timeout=5)
            return {
                "service": service_name,
                "valid": response.status_code in [200, 401],  # 401 means auth needed but server exists
                "message": "Connected!" if response.status_code == 200 else "Server found (auth required)",
                "status_code": response.status_code,
            }
        
        elif service_name == "sonarr" or service_name == "radarr":
            if not config.get("url") or not config.get("api_key"):
                return {"service": service_name, "valid": False, "message": "URL and API key required"}
            url = f"{config['url'].rstrip('/')}/api/v3/system/status"
            headers = {"X-Api-Key": config.get("api_key", "")}
            response = requests.get(url, headers=headers, timeout=5)
            return {
                "service": service_name,
                "valid": response.status_code == 200,
                "message": "Connected!" if response.status_code == 200 else f"Failed: {response.status_code}",
                "status_code": response.status_code,
            }
        
        elif service_name == "prowlarr":
            if not config.get("url") or not config.get("api_key"):
                return {"service": service_name, "valid": False, "message": "URL and API key required"}
            url = f"{config['url'].rstrip('/')}/api/v1/health"
            headers = {"X-Api-Key": config.get("api_key", "")}
            response = requests.get(url, headers=headers, timeout=5)
            return {
                "service": service_name,
                "valid": response.status_code == 200,
                "message": "Connected!" if response.status_code == 200 else f"Failed: {response.status_code}",
                "status_code": response.status_code,
            }
        
        elif service_name == "qbittorrent":
            if not config.get("url"):
                return {"service": service_name, "valid": False, "message": "URL required"}
            # Try to login and get app version
            session = requests.Session()
            login_url = f"{config['url'].rstrip('/')}/api/v2/auth/login"
            username = config.get("username", "")
            password = config.get("password", "")
            login_data = {"username": username, "password": password}
            response = session.post(login_url, data=login_data, timeout=5)
            return {
                "service": service_name,
                "valid": response.status_code in [200, 403],  # 403 means server up but wrong creds
                "message": "Connected!" if response.status_code == 200 else "Server found (auth required)",
                "status_code": response.status_code,
            }
        
        elif service_name == "discord":
            if not config.get("bot_token"):
                return {"service": service_name, "valid": False, "message": "Bot token required"}
            # Just check token format (can't validate without making Discord API call)
            token = config.get("bot_token", "")
            if len(token) > 20 and "." in token:
                return {
                    "service": service_name,
                    "valid": True,
                    "message": "Token format valid (full test requires network call)",
                }
            return {"service": service_name, "valid": False, "message": "Invalid token format"}
        
        elif service_name == "ollama":
            if not config.get("url"):
                return {"service": service_name, "valid": False, "message": "URL required"}
            url = f"{config['url'].rstrip('/')}/api/tags"
            response = requests.get(url, timeout=5)
            return {
                "service": service_name,
                "valid": response.status_code == 200,
                "message": "Connected!" if response.status_code == 200 else f"Failed: {response.status_code}",
                "status_code": response.status_code,
            }
        
        else:
            # Generic validation for unknown services
            has_required = bool(config.get("url") or config.get("api_key"))
            return {
                "service": service_name,
                "valid": has_required,
                "message": "Configuration looks valid" if has_required else "Missing required fields",
            }
    
    except requests.Timeout:
        return {
            "service": service_name,
            "valid": False,
            "message": "Connection timeout - service may be unreachable",
        }
    except requests.ConnectionError as e:
        return {
            "service": service_name,
            "valid": False,
            "message": f"Connection failed: {str(e)[:50]}",
        }
    except Exception as e:
        return {
            "service": service_name,
            "valid": False,
            "message": f"Error: {str(e)[:100]}",
        }


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )
