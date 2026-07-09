@echo off
setlocal
cd /d "%~dp0frontend"
if not exist node_modules (
  echo [1/2] Installing frontend dependencies...
  call npm.cmd install
)
echo [2/2] Starting Vite dev server: http://localhost:5173
call npm.cmd run dev
pause
