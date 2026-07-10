#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 한입 부동산 — 개발용 원클릭 실행 (한 명령으로 백엔드 + 프론트 동시 실행)
#   · 백엔드(FastAPI)  → http://localhost:8000
#   · 프론트(Vite dev) → http://localhost:5173   ← 이 주소로 접속하세요
#   · 코드 수정 시 자동 반영(라이브 리로드), Ctrl+C 로 둘 다 종료
#
# 실행:  bash dev.sh
# ─────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")"

# 종료 시 백엔드/프론트 프로세스 그룹 전체 정리
cleanup() { kill 0 2>/dev/null; }
trap cleanup EXIT INT TERM

# 최초 1회 의존성 설치
echo "[준비] 의존성 확인…"
pip3 install -q -r backend/requirements.txt 2>/dev/null || true
[ -d frontend/node_modules ] || ( cd frontend && npm install )

echo "[백엔드] http://localhost:8000 시작…"
( cd backend && python3 -m uvicorn app.main:app --reload --port 8000 ) &

sleep 1
echo ""
echo "=================================================="
echo "  ✅ 접속 주소:  http://localhost:5173"
echo "  (백엔드 API는 8000, 프론트가 자동 연동)"
echo "  종료: 이 터미널에서 Ctrl + C"
echo "=================================================="
echo ""

# 프론트(포그라운드) — 이게 종료되면 trap 이 백엔드도 정리
cd frontend && npm run dev
