#!/usr/bin/env bash
# 프론트엔드 실행 (포트 5173, /api → 8000 프록시) — 먼저: cd frontend && npm install
cd "$(dirname "$0")/frontend"
npm run dev -- --host
