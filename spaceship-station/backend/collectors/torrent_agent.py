"""
Torrent agent for monitoring qBittorrent activity.
Tracks active transfers and download speeds.
"""

import os
from typing import List, Dict, Any


class TorrentAgent:
    """Monitors torrent client (qBittorrent) via REST API."""
    
    def __init__(self, qb_host: str = "http://localhost:8080", mock_mode: bool = True):
        """Initialize torrent agent."""
        self.qb_host = qb_host
        self.mock_mode = mock_mode
        self.session = None
        self.last_stats = {}
        
        if not mock_mode:
            try:
                import requests
                self.session = requests.Session()
            except ImportError:
                self.mock_mode = True
    
    def _get_mock_torrents(self) -> List[Dict[str, Any]]:
        """Return mock torrent data."""
        return [
            {
                "hash": "mock_torrent_001",
                "name": "Breaking.Bad.S05E16.1080p",
                "state": "downloading",
                "category": "tv",
                "progress": 0.65,
                "dl_speed": 5242880,  # 5 MB/s
                "up_speed": 1048576,  # 1 MB/s
                "eta_seconds": 3600,
                "size": 2500000000,  # 2.5 GB
                "downloaded": 1625000000,
                "uploaded": 1048576000,
                "ratio": 0.65,
                "seeds": 42,
                "peers": 8,
                "added_on": 1724055600,
                "completion_on": 0,
                "last_seen": 1724092800,
            },
            {
                "hash": "mock_torrent_002",
                "name": "Movie.Collection.BluRay",
                "state": "downloading",
                "category": "movies",
                "progress": 0.32,
                "dl_speed": 3145728,  # 3 MB/s
                "up_speed": 524288,   # 0.5 MB/s
                "eta_seconds": 7200,
                "size": 5000000000,  # 5 GB
                "downloaded": 1600000000,
                "uploaded": 524288000,
                "ratio": 0.32,
                "seeds": 18,
                "peers": 5,
                "added_on": 1724022000,
                "completion_on": 0,
                "last_seen": 1724092800,
            },
            {
                "hash": "mock_torrent_003",
                "name": "Comic.Archive.Complete",
                "state": "downloading",
                "category": "other",
                "progress": 0.88,
                "dl_speed": 2097152,  # 2 MB/s
                "up_speed": 262144,   # 0.25 MB/s
                "eta_seconds": 1800,
                "size": 1500000000,  # 1.5 GB
                "downloaded": 1320000000,
                "uploaded": 262144000,
                "ratio": 0.88,
                "seeds": 12,
                "peers": 3,
                "added_on": 1724001600,
                "completion_on": 0,
                "last_seen": 1724092800,
            },
            {
                "hash": "mock_torrent_004",
                "name": "Linux.Distro.ISO",
                "state": "seeding",
                "category": "linux",
                "progress": 1.0,
                "dl_speed": 0,
                "up_speed": 1572864,  # 1.5 MB/s seeding
                "eta_seconds": -1,
                "size": 3000000000,  # 3 GB
                "downloaded": 3000000000,
                "uploaded": 15728640000,
                "ratio": 5.24,
                "seeds": 156,
                "peers": 45,
                "added_on": 1723200000,
                "completion_on": 1723900000,
                "last_seen": 1724092800,
            },
            {
                "hash": "mock_torrent_005",
                "name": "RetroGames.Collection",
                "state": "seeding",
                "category": "games",
                "progress": 1.0,
                "dl_speed": 0,
                "up_speed": 2097152,  # 2 MB/s seeding
                "eta_seconds": -1,
                "size": 800000000,  # 800 MB
                "downloaded": 800000000,
                "uploaded": 4194304000,
                "ratio": 5.24,
                "seeds": 89,
                "peers": 22,
                "added_on": 1722000000,
                "completion_on": 1722600000,
                "last_seen": 1724092800,
            },
        ]
    
    def _get_live_torrents(self) -> List[Dict[str, Any]]:
        """Fetch live torrent data from qBittorrent API."""
        if not self.session:
            return []
        
        torrents = []
        try:
            # qBittorrent API endpoint
            url = f"{self.qb_host}/api/v2/torrents/info"
            response = self.session.get(url, timeout=5)
            
            if response.status_code == 200:
                for torrent in response.json():
                    torrents.append({
                        "hash": torrent.get("hash", ""),
                        "name": torrent.get("name", ""),
                        "state": torrent.get("state", "unknown"),
                        "progress": torrent.get("progress", 0),
                        "dl_speed": torrent.get("dl_speed", 0),
                        "up_speed": torrent.get("up_speed", 0),
                        "eta_seconds": torrent.get("eta", -1),
                        "size": torrent.get("size", 0),
                    })
        except Exception as e:
            print(f"Error fetching torrents from qBittorrent: {e}")
        
        return torrents
    
    def get_torrents(self) -> List[Dict[str, Any]]:
        """Get all active torrents with metadata."""
        if self.mock_mode:
            return self._get_mock_torrents()
        else:
            return self._get_live_torrents()
    
    def get_transfer_stats(self) -> Dict[str, Any]:
        """Get aggregate transfer statistics."""
        torrents = self.get_torrents()
        
        total_dl_speed = sum(t.get("dl_speed", 0) for t in torrents)
        total_up_speed = sum(t.get("up_speed", 0) for t in torrents)
        active_count = len([t for t in torrents if t.get("state") == "downloading"])
        seeding_count = len([t for t in torrents if t.get("state") == "seeding"])
        
        return {
            "active_torrents": active_count,
            "seeding_torrents": seeding_count,
            "total_torrents": len(torrents),
            "total_dl_speed_mbps": total_dl_speed / (1024 ** 2),
            "total_up_speed_mbps": total_up_speed / (1024 ** 2),
            "torrents": torrents,
        }
    
    def get_torrent_details(self, torrent_hash: str) -> Dict[str, Any]:
        """Get detailed information about a specific torrent."""
        torrents = self.get_torrents()
        
        for torrent in torrents:
            if torrent.get("hash") == torrent_hash:
                return {
                    "success": True,
                    "torrent": torrent,
                }
        
        return {
            "success": False,
            "error": f"Torrent not found: {torrent_hash}",
        }
    
    def get_torrents_by_category(self) -> Dict[str, Any]:
        """Get torrents grouped by category."""
        torrents = self.get_torrents()
        
        categories = {}
        for torrent in torrents:
            category = torrent.get("category", "uncategorized")
            if category not in categories:
                categories[category] = []
            categories[category].append(torrent)
        
        return {
            "categories": {
                cat: {
                    "count": len(torrents),
                    "torrents": torrents,
                    "total_size_gb": sum(t.get("size", 0) for t in torrents) / (1024 ** 3),
                    "total_uploaded_gb": sum(t.get("uploaded", 0) for t in torrents) / (1024 ** 3),
                }
                for cat, torrents in categories.items()
            }
        }
