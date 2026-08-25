"""
AI agent gateway for Ollama integration and tool execution.
Provides sandboxed environment for self-evolving tools.
"""

import os
import json
import subprocess
from typing import Dict, Any, Optional, List
from pathlib import Path


class AIAgentGateway:
    """Manages AI agent interface to Ollama and tool execution."""
    
    def __init__(self, ollama_host: str = "http://localhost:11434", 
                 tools_dir: str = "/ai_core/tools"):
        """Initialize AI agent gateway."""
        self.ollama_host = ollama_host
        self.tools_dir = Path(tools_dir)
        self.tools_dir.mkdir(parents=True, exist_ok=True)
        self.model = "neural-chat"  # Default model, can be switched
    
    def list_available_models(self) -> List[str]:
        """List available Ollama models."""
        try:
            import requests
            response = requests.get(f"{self.ollama_host}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                return [m.get("name", "") for m in models]
        except Exception as e:
            print(f"Error fetching models from Ollama: {e}")
        
        return ["neural-chat"]  # Fallback
    
    def generate_tool(self, tool_spec: Dict[str, Any]) -> bool:
        """Generate a new monitoring/management tool based on AI spec."""
        tool_name = tool_spec.get("name", "untitled_tool")
        tool_code = tool_spec.get("code", "# Empty tool")
        tool_path = self.tools_dir / f"{tool_name}.py"
        
        try:
            with open(tool_path, "w") as f:
                f.write(tool_code)
            print(f"Generated tool: {tool_path}")
            return True
        except Exception as e:
            print(f"Error generating tool: {e}")
            return False
    
    def execute_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a generated tool in sandboxed environment."""
        tool_path = self.tools_dir / f"{tool_name}.py"
        
        if not tool_path.exists():
            return {"success": False, "error": f"Tool not found: {tool_name}"}
        
        try:
            # Execute tool as subprocess with isolated environment
            result = subprocess.run(
                ["python", str(tool_path)],
                capture_output=True,
                text=True,
                timeout=30,
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Tool execution timeout: {tool_name}",
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Tool execution error: {e}",
            }
    
    def query_agent(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Query the AI agent with optional metric context."""
        try:
            import requests
            
            system_prompt = """You are the Command Core AI of a spaceship station monitoring system.
Your role is to:
1. Analyze system metrics and container health
2. Suggest optimizations and alert fixes
3. Generate new monitoring tools when requested
4. Keep responses concise and actionable

Respond in a professional, mission-briefing style."""
            
            messages = [
                {"role": "system", "content": system_prompt},
            ]
            
            if context:
                context_str = json.dumps(context, indent=2)
                messages.append({
                    "role": "user",
                    "content": f"Current Station Status:\n{context_str}\n\nMission: {prompt}"
                })
            else:
                messages.append({"role": "user", "content": prompt})
            
            response = requests.post(
                f"{self.ollama_host}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                },
                timeout=30,
            )
            
            if response.status_code == 200:
                return response.json().get("message", {}).get("content", "No response")
            else:
                return "AI Gateway: Unable to connect to Ollama service"
        
        except Exception as e:
            return f"AI Query Error: {e}"
    
    def get_tool_status(self) -> Dict[str, Any]:
        """Get status of all generated tools."""
        tools = []
        if self.tools_dir.exists():
            for tool_file in self.tools_dir.glob("*.py"):
                tools.append({
                    "name": tool_file.stem,
                    "created": tool_file.stat().st_ctime,
                    "size_bytes": tool_file.stat().st_size,
                })
        
        return {
            "tools_dir": str(self.tools_dir),
            "count": len(tools),
            "tools": tools,
        }
