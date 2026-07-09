#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 한입 부동산 — 원클릭 통합 실행 (터미널 1개 · 포트 1개)
# 프론트엔드를 빌드해서 백엔드(8000)가 UI + API 를 함께 서빙합니다.
# 실행:  bash run_all.sh   →  브라우저에서 http://localhost:8000
# ─────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")"

echo "[1/3] 백엔드 의존성 설치…"
pip3 install -q -r backend/requirements.txt

echo "[2/3] 프론트엔드 빌드… (코드 변경분을 여기서 반영)"
cd frontend
[ -d node_modules ] || npm install
npm run build
cd ..

echo ""
echo "=================================================="
echo "  ✅ 준비 완료!  브라우저에서 아래 주소를 여세요:"
echo "       →  http://localhost:8000"
echo "  (종료하려면 이 터미널에서 Ctrl + C)"
echo "=================================================="
echo ""

cd backend
exec python3 -m uvicorn app.main:app --port 8000
