# ── 1단계: 프론트엔드 빌드 (Node) ──
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

# ── 2단계: 백엔드 실행 (Python) + 빌드된 프론트 서빙 ──
FROM python:3.11-slim
WORKDIR /app

# 백엔드 의존성 (기본 requirements = 폴백 엔진으로 전체 동작, 메모리 가벼움)
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# 백엔드 소스 + 데이터
COPY backend/ backend/

# 1단계에서 만든 프론트 빌드 결과물을 main.py 가 찾는 위치로 복사
COPY --from=frontend /app/frontend/dist frontend/dist

WORKDIR /app/backend
ENV PORT=8000
EXPOSE 8000
# Render 는 $PORT 를 주입한다. 없으면 8000.
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
