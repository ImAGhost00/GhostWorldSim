"""
File browser agent for exploring media pools and downloads.
Scans mounted directories and provides hierarchical file browsing.
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import mimetypes


class FileBrowserAgent:
    """Browse and monitor media pool directories."""
    
    def __init__(self, mock_mode: bool = False, media_dir: str = "/media", install_dir: str = "/app"):
        """Initialize file browser with configurable paths."""
        self.mock_mode = mock_mode
        # Map friendly names to actual mount paths (configurable)
        self.pools = {
            "media": media_dir,
            "downloads": f"{install_dir}/downloads",
            "torrents": f"{install_dir}/torrents",
        }
    
    def get_pools(self) -> Dict[str, Dict[str, Any]]:
        """Get available media pools and their stats."""
        if self.mock_mode:
            return self._get_mock_pools()
            
        pools_info = {}
        
        for pool_name, pool_path in self.pools.items():
            pool_path_obj = Path(pool_path)
            
            if pool_path_obj.exists():
                try:
                    # Get directory stats
                    total_size = sum(
                        f.stat().st_size 
                        for f in pool_path_obj.rglob('*') 
                        if f.is_file()
                    )
                    file_count = len(list(pool_path_obj.rglob('*')))
                    
                    pools_info[pool_name] = {
                        "path": str(pool_path),
                        "available": True,
                        "total_size_gb": round(total_size / (1024 ** 3), 2),
                        "file_count": file_count,
                    }
                except Exception as e:
                    pools_info[pool_name] = {
                        "path": str(pool_path),
                        "available": False,
                        "error": str(e),
                    }
            else:
                pools_info[pool_name] = {
                    "path": str(pool_path),
                    "available": False,
                    "error": "Path not found",
                }
        
        return pools_info
    
    def browse_directory(self, pool: str, path: str = "") -> Dict[str, Any]:
        """Browse a directory within a pool."""
        # Validate pool
        if pool not in self.pools:
            return {"error": f"Unknown pool: {pool}", "success": False}
        
        # Use mock data if in mock mode
        if self.mock_mode:
            mock_result = self._get_mock_directory(pool, path)
            return {
                "success": True,
                "pool": pool,
                "path": path,
                **mock_result
            }
        
        pool_path = Path(self.pools[pool])
        if not pool_path.exists():
            return {"error": f"Pool not available: {pool}", "success": False}
        
        # Construct full path (prevent directory traversal)
        target_path = pool_path / path
        target_path = target_path.resolve()
        
        # Security check: ensure path is within pool
        try:
            target_path.relative_to(pool_path)
        except ValueError:
            return {"error": "Access denied: path outside pool", "success": False}
        
        if not target_path.exists():
            return {"error": "Path not found", "success": False}
        
        if not target_path.is_dir():
            return {"error": "Path is not a directory", "success": False}
        
        # List directory contents
        items = []
        try:
            for item in sorted(target_path.iterdir()):
                rel_path = str(item.relative_to(pool_path))
                
                if item.is_dir():
                    try:
                        subitem_count = len(list(item.iterdir()))
                    except PermissionError:
                        subitem_count = 0
                    
                    items.append({
                        "name": item.name,
                        "type": "folder",
                        "path": rel_path,
                        "size_bytes": 0,
                        "item_count": subitem_count,
                    })
                else:
                    try:
                        size = item.stat().st_size
                        mime_type, _ = mimetypes.guess_type(item.name)
                    except:
                        size = 0
                        mime_type = None
                    
                    items.append({
                        "name": item.name,
                        "type": "file",
                        "path": rel_path,
                        "size_bytes": size,
                        "size_mb": round(size / (1024 ** 2), 2),
                        "mime_type": mime_type,
                    })
        except PermissionError:
            return {"error": "Permission denied", "success": False}
        
        return {
            "success": True,
            "pool": pool,
            "current_path": path,
            "breadcrumb": self._build_breadcrumb(path),
            "items": items,
            "total_items": len(items),
        }
    
    def get_file_info(self, pool: str, path: str) -> Dict[str, Any]:
        """Get detailed information about a file."""
        if pool not in self.pools:
            return {"error": f"Unknown pool: {pool}", "success": False}
        
        pool_path = Path(self.pools[pool])
        file_path = pool_path / path
        file_path = file_path.resolve()
        
        # Security check
        try:
            file_path.relative_to(pool_path)
        except ValueError:
            return {"error": "Access denied", "success": False}
        
        if not file_path.exists():
            return {"error": "File not found", "success": False}
        
        try:
            stat = file_path.stat()
            mime_type, _ = mimetypes.guess_type(file_path)
            
            return {
                "success": True,
                "name": file_path.name,
                "path": str(file_path.relative_to(pool_path)),
                "size_bytes": stat.st_size,
                "size_mb": round(stat.st_size / (1024 ** 2), 2),
                "mime_type": mime_type,
                "created": stat.st_ctime,
                "modified": stat.st_mtime,
                "is_file": file_path.is_file(),
                "is_dir": file_path.is_dir(),
            }
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def search_files(self, pool: str, query: str, max_results: int = 50) -> Dict[str, Any]:
        """Search for files in a pool by name."""
        if pool not in self.pools:
            return {"error": f"Unknown pool: {pool}", "success": False}
        
        if self.mock_mode:
            return self._get_mock_search_results(pool, query, max_results)
        
        pool_path = Path(self.pools[pool])
        if not pool_path.exists():
            return {"error": f"Pool not available: {pool}", "success": False}
        
        results = []
        query_lower = query.lower()
        
        try:
            for file_path in pool_path.rglob('*'):
                if len(results) >= max_results:
                    break
                
                if query_lower in file_path.name.lower():
                    try:
                        rel_path = str(file_path.relative_to(pool_path))
                        
                        if file_path.is_file():
                            size = file_path.stat().st_size
                            results.append({
                                "name": file_path.name,
                                "path": rel_path,
                                "type": "file",
                                "size_mb": round(size / (1024 ** 2), 2),
                            })
                        elif file_path.is_dir():
                            results.append({
                                "name": file_path.name,
                                "path": rel_path,
                                "type": "folder",
                            })
                    except:
                        pass
        except Exception as e:
            return {"error": str(e), "success": False}
        
        return {
            "success": True,
            "pool": pool,
            "query": query,
            "results": results,
            "result_count": len(results),
            "truncated": len(results) >= max_results,
        }
    
    def _build_breadcrumb(self, path: str) -> List[Dict[str, str]]:
        """Build breadcrumb navigation for current path."""
        breadcrumb = [{"name": "Root", "path": ""}]
        
        if not path or path == ".":
            return breadcrumb
        
        parts = Path(path).parts
        current = ""
        for part in parts:
            current = str(Path(current) / part) if current else part
            breadcrumb.append({"name": part, "path": current})
        
        return breadcrumb
    
    def get_media_types(self, pool: str) -> Dict[str, Any]:
        """Get breakdown of file types in a pool."""
        if pool not in self.pools:
            return {"error": f"Unknown pool: {pool}", "success": False}
        
        if self.mock_mode:
            return self._get_mock_media_types(pool)
        
        pool_path = Path(self.pools[pool])
        if not pool_path.exists():
            return {"error": f"Pool not available", "success": False}
        
        file_types = {}
        total_size = 0
        
        try:
            for file_path in pool_path.rglob('*'):
                if file_path.is_file():
                    _, ext = mimetypes.guess_type(file_path)
                    ext = ext or Path(file_path).suffix or "unknown"
                    
                    if ext not in file_types:
                        file_types[ext] = {"count": 0, "total_size": 0}
                    
                    try:
                        size = file_path.stat().st_size
                        file_types[ext]["count"] += 1
                        file_types[ext]["total_size"] += size
                        total_size += size
                    except:
                        pass
        except Exception as e:
            return {"error": str(e), "success": False}
        
        # Convert sizes and sort
        summary = []
        for ext, info in sorted(
            file_types.items(),
            key=lambda x: x[1]["total_size"],
            reverse=True
        ):
            summary.append({
                "extension": ext,
                "file_count": info["count"],
                "total_size_gb": round(info["total_size"] / (1024 ** 3), 2),
                "percent": round((info["total_size"] / total_size * 100) if total_size > 0 else 0, 1),
            })
        
        return {
            "success": True,
            "pool": pool,
            "file_types": summary,
            "total_size_gb": round(total_size / (1024 ** 3), 2),
            "total_files": sum(f["file_count"] for f in summary),
        }
    
    def _get_mock_pools(self) -> Dict[str, Dict[str, Any]]:
        """Return mock pool data for testing."""
        return {
            "media": {
                "path": "/media",
                "available": True,
                "total_size_gb": 450.5,
                "file_count": 1250,
            },
            "downloads": {
                "path": "/downloads",
                "available": True,
                "total_size_gb": 75.2,
                "file_count": 230,
            },
            "torrents": {
                "path": "/torrents",
                "available": True,
                "total_size_gb": 320.8,
                "file_count": 890,
            },
        }
    
    def _get_mock_directory(self, pool: str, path: str) -> Dict[str, Any]:
        """Return mock directory browsing data."""
        mock_structure = {
            "media": {
                "": {
                    "breadcrumb": [{"name": "Root", "path": ""}],
                    "items": [
                        {"type": "folder", "name": "Movies", "path": "Movies", "item_count": 120},
                        {"type": "folder", "name": "TV Shows", "path": "TV Shows", "item_count": 245},
                        {"type": "folder", "name": "Music", "path": "Music", "item_count": 450},
                        {"type": "folder", "name": "Comics", "path": "Comics", "item_count": 230},
                    ]
                },
                "Movies": {
                    "breadcrumb": [{"name": "Root", "path": ""}, {"name": "Movies", "path": "Movies"}],
                    "items": [
                        {"type": "file", "name": "Inception.2010.1080p.BluRay.mkv", "path": "Movies/Inception.2010.1080p.BluRay.mkv", "size_mb": 4500.5, "mime_type": "video/x-matroska"},
                        {"type": "file", "name": "Interstellar.2014.1080p.BluRay.mkv", "path": "Movies/Interstellar.2014.1080p.BluRay.mkv", "size_mb": 5200.3, "mime_type": "video/x-matroska"},
                        {"type": "file", "name": "Matrix.1999.1080p.BluRay.mkv", "path": "Movies/Matrix.1999.1080p.BluRay.mkv", "size_mb": 3800.0, "mime_type": "video/x-matroska"},
                    ]
                },
            },
            "downloads": {
                "": {
                    "breadcrumb": [{"name": "Root", "path": ""}],
                    "items": [
                        {"type": "file", "name": "ubuntu-22.04-LTS.iso", "path": "ubuntu-22.04-LTS.iso", "size_mb": 3500.0, "mime_type": "application/x-iso9660-image"},
                        {"type": "file", "name": "debian-bookworm.iso", "path": "debian-bookworm.iso", "size_mb": 2900.0, "mime_type": "application/x-iso9660-image"},
                        {"type": "folder", "name": "software", "path": "software", "item_count": 45},
                    ]
                },
            },
            "torrents": {
                "": {
                    "breadcrumb": [{"name": "Root", "path": ""}],
                    "items": [
                        {"type": "folder", "name": "Breaking.Bad.Complete", "path": "Breaking.Bad.Complete", "item_count": 62},
                        {"type": "folder", "name": "Game.of.Thrones.Complete", "path": "Game.of.Thrones.Complete", "item_count": 73},
                        {"type": "folder", "name": "RetroGames", "path": "RetroGames", "item_count": 234},
                    ]
                },
            },
        }
        
        if pool in mock_structure and path in mock_structure[pool]:
            return mock_structure[pool][path]
        
        return {
            "breadcrumb": [{"name": "Root", "path": ""}],
            "items": []
        }
    
    def _get_mock_media_types(self, pool: str) -> Dict[str, Any]:
        """Return mock media type breakdown."""
        mock_types = {
            "media": [
                {"extension": ".mkv", "file_count": 245, "total_size_gb": 320.5, "percent": 71.2},
                {"extension": ".mp3", "file_count": 450, "total_size_gb": 75.3, "percent": 16.7},
                {"extension": ".jpg", "file_count": 230, "total_size_gb": 25.2, "percent": 5.6},
                {"extension": ".pdf", "file_count": 120, "total_size_gb": 15.5, "percent": 3.4},
                {"extension": ".zip", "file_count": 45, "total_size_gb": 14.0, "percent": 3.1},
            ],
            "downloads": [
                {"extension": ".iso", "file_count": 8, "total_size_gb": 45.2, "percent": 60.1},
                {"extension": ".exe", "file_count": 23, "total_size_gb": 18.5, "percent": 24.6},
                {"extension": ".zip", "file_count": 15, "total_size_gb": 11.5, "percent": 15.3},
            ],
            "torrents": [
                {"extension": ".mkv", "file_count": 320, "total_size_gb": 245.3, "percent": 76.5},
                {"extension": ".mp4", "file_count": 156, "total_size_gb": 65.2, "percent": 20.3},
                {"extension": ".srt", "file_count": 234, "total_size_gb": 0.15, "percent": 0.05},
                {"extension": ".nfo", "file_count": 89, "total_size_gb": 0.05, "percent": 0.02},
                {"extension": ".txt", "file_count": 45, "total_size_gb": 0.15, "percent": 0.05},
            ],
        }
        
        if pool in mock_types:
            summary = mock_types[pool]
            total_size = sum(ft["total_size_gb"] for ft in summary)
            total_files = sum(ft["file_count"] for ft in summary)
            
            return {
                "success": True,
                "pool": pool,
                "file_types": summary,
                "total_size_gb": round(total_size, 2),
                "total_files": total_files,
            }
        
        return {
            "success": False,
            "error": f"Unknown pool: {pool}",
        }
    
    def _get_mock_search_results(self, pool: str, query: str, max_results: int = 50) -> Dict[str, Any]:
        """Return mock search results."""
        # All available files across pools
        all_files = {
            "media": [
                {"name": "Inception.2010.1080p.BluRay.mkv", "type": "file", "size_mb": 4500.5},
                {"name": "Interstellar.2014.1080p.BluRay.mkv", "type": "file", "size_mb": 5200.3},
                {"name": "Matrix.1999.1080p.BluRay.mkv", "type": "file", "size_mb": 3800.0},
                {"name": "Breaking.Bad.Complete", "type": "folder"},
                {"name": "Game.of.Thrones.Complete", "type": "folder"},
            ],
            "downloads": [
                {"name": "ubuntu-22.04-LTS.iso", "type": "file", "size_mb": 3500.0},
                {"name": "debian-bookworm.iso", "type": "file", "size_mb": 2900.0},
                {"name": "software", "type": "folder"},
            ],
            "torrents": [
                {"name": "Breaking.Bad.Complete", "type": "folder"},
                {"name": "Game.of.Thrones.Complete", "type": "folder"},
                {"name": "RetroGames", "type": "folder"},
            ],
        }
        
        if pool not in all_files:
            return {"success": False, "error": f"Unknown pool: {pool}"}
        
        query_lower = query.lower()
        results = [
            f for f in all_files[pool]
            if query_lower in f["name"].lower()
        ][:max_results]
        
        return {
            "success": True,
            "pool": pool,
            "query": query,
            "results": results,
            "result_count": len(results),
            "truncated": len(results) >= max_results,
        }
