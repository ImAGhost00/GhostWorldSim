"""
Docker container inspector with mock mode support.
Maps ghostworld Docker stack containers to thematic spaceship modules.
"""

import os
import json
from typing import List, Dict, Any
from datetime import datetime

try:
    import docker
    DOCKER_AVAILABLE = True
except ImportError:
    DOCKER_AVAILABLE = False


class DockerAgent:
    """Inspects Docker containers and their metrics, with optional mock mode."""
    
    # Thematic module mapping for ghostworld containers
    MODULE_CATALOG = {
        "ollama": {
            "module_type": "command_deck",
            "name": "Command Core",
            "description": "AI Core & LLM Engine",
            "x": 5, "y": 5,
            "color": "#ff6b9d"
        },
        "open-webui": {
            "module_type": "command_deck",
            "name": "WebUI Terminal",
            "description": "AI Interface",
            "x": 6, "y": 5,
            "color": "#c44569"
        },
        "authentik-server": {
            "module_type": "security_bay",
            "name": "Auth Server",
            "description": "Identity & Access Control",
            "x": 2, "y": 2,
            "color": "#4ecdc4"
        },
        "authentik-worker": {
            "module_type": "security_bay",
            "name": "Auth Worker",
            "description": "Background Tasks",
            "x": 3, "y": 2,
            "color": "#44a08d"
        },
        "authentik-postgresql": {
            "module_type": "security_bay",
            "name": "Auth Database",
            "description": "Credential Storage",
            "x": 2, "y": 3,
            "color": "#095e70"
        },
        "authentik-redis": {
            "module_type": "security_bay",
            "name": "Auth Cache",
            "description": "Session Storage",
            "x": 3, "y": 3,
            "color": "#1a535c"
        },
        "wizarr": {
            "module_type": "ingress_bay",
            "name": "Wizarr Portal",
            "description": "User Onboarding",
            "x": 1, "y": 2,
            "color": "#6c5ce7"
        },
        "homarr": {
            "module_type": "ingress_bay",
            "name": "Homarr Dashboard",
            "description": "System Dashboard",
            "x": 1, "y": 3,
            "color": "#a29bfe"
        },
        "gluetun": {
            "module_type": "network_gateway",
            "name": "VPN Gateway",
            "description": "Network Tunnel Engine",
            "x": 0, "y": 5,
            "color": "#00b894"
        },
        "byparr": {
            "module_type": "network_gateway",
            "name": "Bypass Router",
            "description": "Routing Controller",
            "x": 1, "y": 5,
            "color": "#00cec9"
        },
        "qbittorrent": {
            "module_type": "docking_bay",
            "name": "Docking Bay",
            "description": "Torrent Hub & Downloads",
            "x": 8, "y": 2,
            "color": "#ff7675"
        },
        "unpackerr": {
            "module_type": "docking_bay",
            "name": "Extraction Bay",
            "description": "Archive Unpacker",
            "x": 8, "y": 3,
            "color": "#d63031"
        },
        "sonarr": {
            "module_type": "automation_hub",
            "name": "Sonarr Indexer",
            "description": "TV Series Automation",
            "x": 6, "y": 1,
            "color": "#0984e3"
        },
        "radarr": {
            "module_type": "automation_hub",
            "name": "Radarr Indexer",
            "description": "Movie Automation",
            "x": 7, "y": 1,
            "color": "#6c5ce7"
        },
        "bazarr": {
            "module_type": "automation_hub",
            "name": "Bazarr Indexer",
            "description": "Subtitle Automation",
            "x": 8, "y": 1,
            "color": "#fdcb6e"
        },
        "prowlarr": {
            "module_type": "automation_hub",
            "name": "Prowlarr Coordinator",
            "description": "Search Index Manager",
            "x": 6, "y": 2,
            "color": "#e17055"
        },
        "seerr": {
            "module_type": "automation_hub",
            "name": "Seerr Requests",
            "description": "User Request Portal",
            "x": 7, "y": 2,
            "color": "#00b894"
        },
        "recyclarr": {
            "module_type": "automation_hub",
            "name": "Recyclarr Config",
            "description": "Configuration Syncer",
            "x": 9, "y": 2,
            "color": "#00cec9"
        },
        "jellyfin": {
            "module_type": "media_archive",
            "name": "Jellyfin Archive",
            "description": "Media Server (GPU)",
            "x": 4, "y": 7,
            "color": "#00b4d8"
        },
        "komga": {
            "module_type": "media_archive",
            "name": "Komga Library",
            "description": "Comic/Manga Server",
            "x": 5, "y": 7,
            "color": "#0096c7"
        },
        "calibre-web-automated": {
            "module_type": "media_archive",
            "name": "CWA E-Book Store",
            "description": "Book Management",
            "x": 6, "y": 7,
            "color": "#00b4d8"
        },
        "shelfmark": {
            "module_type": "media_archive",
            "name": "Shelfmark Catalog",
            "description": "Book Metadata",
            "x": 7, "y": 7,
            "color": "#0077b6"
        },
        "romm": {
            "module_type": "arcade_deck",
            "name": "ROMM Arcade",
            "description": "ROM Manager",
            "x": 3, "y": 9,
            "color": "#f72585"
        },
        "romm-db": {
            "module_type": "arcade_deck",
            "name": "Arcade Database",
            "description": "ROM Storage",
            "x": 4, "y": 9,
            "color": "#b5179e"
        },
        "gameyfin": {
            "module_type": "arcade_deck",
            "name": "Gameyfin Platform",
            "description": "Game Launcher",
            "x": 5, "y": 9,
            "color": "#7209b7"
        },
        "dashdot": {
            "module_type": "engineering_bay",
            "name": "System Diagnostics",
            "description": "Metrics & GPU Monitoring",
            "x": 9, "y": 0,
            "color": "#f0ad4e"
        },
        "watchtower": {
            "module_type": "engineering_bay",
            "name": "Watchtower Monitor",
            "description": "Container Update Watcher",
            "x": 10, "y": 0,
            "color": "#ec971f"
        },
    }

    def __init__(self, mock_mode: bool = True):
        """Initialize Docker agent with optional mock mode."""
        self.mock_mode = mock_mode
        self.client = None
        
        if not mock_mode and DOCKER_AVAILABLE:
            try:
                self.client = docker.from_env()
            except Exception as e:
                print(f"Failed to connect to Docker daemon: {e}")
                self.mock_mode = True
    
    def _get_mock_containers(self) -> List[Dict[str, Any]]:
        """Return mock container data matching ghostworld stack."""
        return [
            {
                "id": "ollama_mock_001",
                "name": "ollama",
                "status": "running",
                "state": "running",
                "cpu_percent": 45.2,
                "memory_usage": 2048,
                "memory_limit": 4096,
                "network_in": 1024000,
                "network_out": 2048000,
                "uptime": 86400,
            },
            {
                "id": "jellyfin_mock_002",
                "name": "jellyfin",
                "status": "running",
                "state": "running",
                "cpu_percent": 35.8,
                "memory_usage": 1500,
                "memory_limit": 3072,
                "network_in": 5120000,
                "network_out": 10240000,
                "uptime": 172800,
            },
            {
                "id": "qbittorrent_mock_003",
                "name": "qbittorrent",
                "status": "running",
                "state": "running",
                "cpu_percent": 12.5,
                "memory_usage": 512,
                "memory_limit": 1024,
                "network_in": 25600000,
                "network_out": 15360000,
                "uptime": 345600,
            },
            {
                "id": "komga_mock_004",
                "name": "komga",
                "status": "running",
                "state": "running",
                "cpu_percent": 8.3,
                "memory_usage": 768,
                "memory_limit": 2048,
                "network_in": 2048000,
                "network_out": 3072000,
                "uptime": 259200,
            },
            {
                "id": "romm_mock_005",
                "name": "romm",
                "status": "running",
                "state": "running",
                "cpu_percent": 5.1,
                "memory_usage": 256,
                "memory_limit": 512,
                "network_in": 1024000,
                "network_out": 512000,
                "uptime": 172800,
            },
            {
                "id": "authentik_server_mock_006",
                "name": "authentik-server",
                "status": "running",
                "state": "running",
                "cpu_percent": 18.7,
                "memory_usage": 384,
                "memory_limit": 1024,
                "network_in": 512000,
                "network_out": 768000,
                "uptime": 432000,
            },
            {
                "id": "gluetun_mock_007",
                "name": "gluetun",
                "status": "running",
                "state": "running",
                "cpu_percent": 2.3,
                "memory_usage": 192,
                "memory_limit": 512,
                "network_in": 30720000,
                "network_out": 20480000,
                "uptime": 604800,
            },
            {
                "id": "sonarr_mock_008",
                "name": "sonarr",
                "status": "running",
                "state": "running",
                "cpu_percent": 6.9,
                "memory_usage": 320,
                "memory_limit": 1024,
                "network_in": 768000,
                "network_out": 1024000,
                "uptime": 345600,
            },
            {
                "id": "dashdot_mock_009",
                "name": "dashdot",
                "status": "running",
                "state": "running",
                "cpu_percent": 3.2,
                "memory_usage": 128,
                "memory_limit": 256,
                "network_in": 256000,
                "network_out": 384000,
                "uptime": 259200,
            },
        ]
    
    def _get_live_containers(self) -> List[Dict[str, Any]]:
        """Fetch live container data from Docker daemon."""
        if not self.client:
            return []
        
        containers = []
        try:
            for container in self.client.containers.list(all=True):
                try:
                    stats = container.stats(stream=False)
                    cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                                stats["precpu_stats"]["cpu_usage"]["total_usage"]
                    system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                                   stats["precpu_stats"]["system_cpu_usage"]
                    cpu_percent = (cpu_delta / system_delta * 100.0) if system_delta > 0 else 0
                    
                    mem_usage = stats["memory_stats"].get("usage", 0)
                    mem_limit = stats["memory_stats"].get("limit", 0)
                    
                    containers.append({
                        "id": container.id,
                        "name": container.name,
                        "status": container.status,
                        "state": container.attrs["State"]["Status"],
                        "cpu_percent": cpu_percent,
                        "memory_usage": mem_usage / (1024 * 1024),  # MB
                        "memory_limit": mem_limit / (1024 * 1024),  # MB
                        "network_in": 0,
                        "network_out": 0,
                        "uptime": int((datetime.now() - 
                                      datetime.fromisoformat(
                                          container.attrs["State"]["StartedAt"].replace("Z", "+00:00")
                                      )).total_seconds()),
                    })
                except Exception as e:
                    print(f"Error collecting stats for {container.name}: {e}")
        except Exception as e:
            print(f"Error listing containers: {e}")
        
        return containers
    
    def get_containers(self) -> List[Dict[str, Any]]:
        """Get container data with enriched module metadata."""
        if self.mock_mode:
            raw_containers = self._get_mock_containers()
        else:
            raw_containers = self._get_live_containers()
        
        # Enrich with module metadata
        enriched = []
        for container in raw_containers:
            container_name = container.get("name", "").lstrip("/")
            module_meta = self.MODULE_CATALOG.get(
                container_name,
                {
                    "module_type": "generic",
                    "name": container_name.replace("-", " ").title(),
                    "description": "Unknown Service",
                    "x": len(enriched) % 10,
                    "y": len(enriched) // 10,
                    "color": "#95a5a6",
                }
            )
            
            container.update(module_meta)
            enriched.append(container)
        
        return enriched
    
    def get_container_logs(self, container_name: str, tail: int = 50) -> str:
        """Fetch recent logs from a container."""
        if self.mock_mode:
            return f"[MOCK] Logs for {container_name}:\n" + "\n".join(
                [f"[INFO] Mock log entry {i}" for i in range(tail)]
            )
        
        if not self.client:
            return "Docker client not available"
        
        try:
            container = self.client.containers.get(container_name)
            logs = container.logs(tail=tail, timestamps=True).decode('utf-8')
            return logs
        except Exception as e:
            return f"Error fetching logs: {e}"
    
    def restart_container(self, container_name: str) -> bool:
        """Attempt to restart a container."""
        if self.mock_mode:
            print(f"[MOCK] Would restart container: {container_name}")
            return True
        
        if not self.client:
            return False
        
        try:
            container = self.client.containers.get(container_name)
            container.restart()
            return True
        except Exception as e:
            print(f"Error restarting container {container_name}: {e}")
            return False
