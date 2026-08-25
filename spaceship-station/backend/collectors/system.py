"""
System metrics collector using psutil.
Monitors host hardware: CPU, RAM, disk, and network throughput.
"""

import psutil
from typing import Dict, Any
from datetime import datetime


class SystemCollector:
    """Collects host-level system metrics."""
    
    def __init__(self):
        """Initialize system collector."""
        self.last_net_io = None
    
    def get_cpu_info(self) -> Dict[str, Any]:
        """Get current CPU metrics."""
        return {
            "usage_percent": psutil.cpu_percent(interval=0.1),
            "count_logical": psutil.cpu_count(logical=True),
            "count_physical": psutil.cpu_count(logical=False),
            "freq_current_mhz": psutil.cpu_freq().current if psutil.cpu_freq() else 0,
        }
    
    def get_memory_info(self) -> Dict[str, Any]:
        """Get current RAM metrics."""
        mem = psutil.virtual_memory()
        return {
            "total_mb": mem.total / (1024 ** 2),
            "available_mb": mem.available / (1024 ** 2),
            "used_mb": mem.used / (1024 ** 2),
            "percent": mem.percent,
        }
    
    def get_disk_info(self) -> Dict[str, Any]:
        """Get disk space metrics for root partition."""
        disk = psutil.disk_usage('/')
        return {
            "total_gb": disk.total / (1024 ** 3),
            "used_gb": disk.used / (1024 ** 3),
            "free_gb": disk.free / (1024 ** 3),
            "percent": disk.percent,
        }
    
    def get_network_info(self) -> Dict[str, Any]:
        """Get network throughput metrics."""
        net_io = psutil.net_io_counters()
        
        bytes_in = net_io.bytes_recv
        bytes_out = net_io.bytes_sent
        
        # Calculate delta from last measurement
        if self.last_net_io:
            delta_in = bytes_in - self.last_net_io["bytes_in"]
            delta_out = bytes_out - self.last_net_io["bytes_out"]
        else:
            delta_in = 0
            delta_out = 0
        
        self.last_net_io = {
            "bytes_in": bytes_in,
            "bytes_out": bytes_out,
            "timestamp": datetime.now(),
        }
        
        return {
            "bytes_recv_total": bytes_in,
            "bytes_sent_total": bytes_out,
            "bytes_recv_delta": delta_in,
            "bytes_sent_delta": delta_out,
            "packets_recv": net_io.packets_recv,
            "packets_sent": net_io.packets_sent,
        }
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all system metrics in one call."""
        return {
            "timestamp": datetime.now().isoformat(),
            "cpu": self.get_cpu_info(),
            "memory": self.get_memory_info(),
            "disk": self.get_disk_info(),
            "network": self.get_network_info(),
        }
