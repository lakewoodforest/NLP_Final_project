@echo off
setlocal
cd /d "%~dp0backend"
echo [1/2] Installing backend dependencies...
python -m pip install -r requirements.txt
echo [2/2] Starting FastAPI server: http://localhost:8000/docs
python -m uvicorn app.main:app --reload --port 8000
pause
