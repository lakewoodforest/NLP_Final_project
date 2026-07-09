"""부동산 AI 통합 백엔드 — 프로젝트 ①(매물 검색 챗봇) + ②(계약서 특약 검토) 병합 API.
실행: uvicorn app.main:app --reload --port 8000  ·  문서: http://localhost:8000/docs"""
# .env 가 있으면 자동 로드 (GOOGLE_API_KEY 등). python-dotenv 없으면 조용히 무시.
try:
    from pathlib import Path as _Path
    from dotenv import load_dotenv as _load_dotenv
    _load_dotenv(_Path(__file__).resolve().parent.parent / ".env")
except Exception:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import contract, listings, slots, stats

app = FastAPI(title="부동산 AI 통합 API",
              description="매물 검색(슬롯 필링) × 계약서 특약 검토(분류+RAG) 통합 백엔드")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(stats.router)
app.include_router(listings.router)
app.include_router(slots.router)
app.include_router(contract.router)


@app.get("/api/health")
def health():
    return {"ok": True}


# ── 통합 서버 모드: frontend/dist 가 있으면 같은 포트(8000)에서 UI도 서빙 ──
# (개발 중 핫리로드가 필요하면 기존처럼 vite dev(5173)를 따로 띄우면 된다)
from pathlib import Path
from fastapi.staticfiles import StaticFiles

_FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if _FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(_FRONTEND_DIST), html=True), name="frontend")
