@echo off
setlocal
cd /d "%~dp0"

echo [1/3] Installing backend dependencies...
python -m pip install -q -r backend\requirements.txt

echo [2/3] Building frontend...
cd /d "%~dp0frontend"
if not exist node_modules call npm.cmd install
call npm.cmd run build

echo [3/3] Starting unified server: http://localhost:8000
start "" /min cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:8000"
cd /d "%~dp0backend"
python -m uvicorn app.main:app --port 8000
pause
