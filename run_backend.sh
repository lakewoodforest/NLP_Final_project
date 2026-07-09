#!/usr/bin/env bash
# 백엔드 실행 (포트 8000) — 먼저: cd backend && pip install -r requirements.txt
cd "$(dirname "$0")/backend"
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
