@echo off
REM Spaceship Station Visualizer - Startup Script (Windows)
REM This script sets up the Python environment and runs the backend server

setlocal enabledelayedexpansion

echo.
echo ============================================
echo  SPACESHIP STATION VISUALIZER v0.1.0
echo  Real-Time Homelab Monitoring System
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10+ from https://www.python.org
    pause
    exit /b 1
)

REM Navigate to backend directory
cd backend

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

REM Set mock mode (change to 'false' for live Docker connection)
set MOCK_MODE=true

REM Start the server
echo.
echo ============================================
echo  Starting Spaceship Station Server...
echo ============================================
echo.
echo Mock Mode: !MOCK_MODE!
echo WebUI: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py

pause
