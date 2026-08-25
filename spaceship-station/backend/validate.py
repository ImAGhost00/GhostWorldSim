#!/usr/bin/env python3
"""
Quick validation script to check that all imports work correctly.
Run this before starting the server to catch any configuration issues.
"""

import sys
from pathlib import Path

def check_imports():
    """Validate all imports."""
    print("🔍 Validating Spaceship Station Visualizer Setup...\n")
    
    errors = []
    
    # Check Python version
    if sys.version_info < (3, 10):
        errors.append(f"❌ Python 3.10+ required (you have {sys.version_info.major}.{sys.version_info.minor})")
    else:
        print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor}")
    
    # Check FastAPI
    try:
        import fastapi
        print(f"✓ FastAPI {fastapi.__version__}")
    except ImportError as e:
        errors.append(f"❌ FastAPI: {e}")
    
    # Check Uvicorn
    try:
        import uvicorn
        print(f"✓ Uvicorn {uvicorn.__version__}")
    except ImportError as e:
        errors.append(f"❌ Uvicorn: {e}")
    
    # Check Pydantic
    try:
        import pydantic
        print(f"✓ Pydantic {pydantic.__version__}")
    except ImportError as e:
        errors.append(f"❌ Pydantic: {e}")
    
    # Check psutil
    try:
        import psutil
        print(f"✓ psutil {psutil.__version__}")
    except ImportError as e:
        errors.append(f"❌ psutil: {e}")
    
    # Check requests
    try:
        import requests
        print(f"✓ requests {requests.__version__}")
    except ImportError as e:
        errors.append(f"❌ requests: {e}")
    
    # Check WebSockets
    try:
        import websockets
        print(f"✓ websockets {websockets.__version__}")
    except ImportError as e:
        errors.append(f"❌ websockets: {e}")
    
    # Optional: Docker
    try:
        import docker
        print(f"✓ docker {docker.__version__} (optional)")
    except ImportError:
        print("⚠  docker not available (install for live monitoring)")
    
    # Optional: Ollama
    try:
        import ollama
        print(f"✓ ollama available (optional)")
    except ImportError:
        print("⚠  ollama not available (install for AI features)")
    
    print()
    
    if errors:
        print("❌ VALIDATION FAILED\n")
        for error in errors:
            print(f"  {error}")
        print("\nRun: pip install -r requirements.txt")
        return False
    else:
        print("✅ ALL CHECKS PASSED\n")
        print("You can now run: python main.py")
        return True

if __name__ == "__main__":
    success = check_imports()
    sys.exit(0 if success else 1)
