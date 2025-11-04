@echo off
setlocal enableextensions

REM JurixPrev - Dev launcher for backend and frontend
REM Usage: double-click this file or run from a terminal

title JurixPrev Dev Launcher
echo Starting JurixPrev backend and frontend...

REM Change directory to repository root (this script's location)
cd /d "%~dp0"

REM Start backend (Uvicorn) in a new window
echo [1/3] Starting backend (Uvicorn) on http://localhost:8000
start "Backend (Uvicorn)" cmd /c "python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000"

REM Start frontend (Angular dev server) in a new window
echo [2/3] Starting frontend (Angular) on http://localhost:4200
start "Frontend (Angular)" cmd /c "cd /d frontend && npm start -- --port 4200"



echo Done. Two windows were opened for backend and frontend.
echo To stop, close each window or press CTRL+C inside them.

endlocal