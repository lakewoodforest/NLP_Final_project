# 부동산 AI 통합 프로젝트 (real-estate-ai)

두 프로젝트를 **프론트엔드(React + Vite) / 백엔드(FastAPI)** 로 나눈 하나의 프로젝트로 병합했습니다.

- **프로젝트 ① `real_estate_slot`** — 자연어 슬롯 필링 기반 매물 검색 챗봇
- **프로젝트 ② `NLP_final_real_estate`** — 임대차 계약서 특약사항 검토 AI (분류기 + RAG)

사용자 여정은 하나로 이어집니다: **자연어로 매물 탐색(①) → 계약서 PDF 업로드해 특약 위험 검토(②)**.

---

## 빠른 시작

> 요구사항: Python 3.10+ · Node.js 18+

### 방법 A — 한 번에 실행 (권장, 서버 1개)

프론트를 빌드해 FastAPI가 UI와 API를 **같은 포트(8000) 하나로** 서빙합니다.

```bash
# Windows: run_all.bat 더블클릭 (또는 터미널에서 .\run_all.bat)
# macOS/Linux:
./run_all.sh
```

→ 브라우저에서 http://localhost:8000 접속 (Windows는 자동으로 열립니다)

### 방법 B — 개발 모드 (서버 2개, 핫리로드)

코드를 고치면서 바로 반영되는 게 필요할 때 사용합니다.

**터미널 1 — 백엔드 (포트 8000)**

```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
# API 문서: http://localhost:8000/docs
```

**터미널 2 — 프론트엔드 (포트 5173)**

```bash
cd frontend
npm install
npm run dev
# 대시보드: http://localhost:5173  (/api 요청은 8000으로 프록시됨)
```

루트의 `run_backend.sh` / `run_frontend.sh` (macOS·Linux) 또는 `run_backend.bat` / `run_frontend.bat` (Windows) 로도 실행할 수 있습니다.

### Windows / VS Code에서 실행

1. 이 폴더(`real-estate-ai`)를 VS Code로 열기 (파일 → 폴더 열기)
2. 터미널 2개 열기 (메뉴 `터미널 → 새 터미널`, 분할은 Ctrl+Shift+5)
3. 각 터미널에서 실행 (또는 탐색기에서 `run_backend.bat` / `run_frontend.bat` 더블클릭):

```powershell
# 터미널 1 — 백엔드
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# 터미널 2 — 프론트엔드
cd frontend
npm install
npm run dev
```

4. 브라우저에서 http://localhost:5173 접속

> Windows에서는 `python3` 대신 `python`을 사용합니다. `python --version`(3.10+),
> `node -v`(18+)로 버전을 먼저 확인하세요.


---

## 폴더 구조

```
real-estate-ai/
├── backend/                       # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py                # 앱 엔트리 (+CORS, 라우터 등록)
│   │   ├── core/config.py         # 경로 · 라벨 · 슬롯 정의
│   │   ├── routers/               # HTTP 계층
│   │   │   ├── listings.py        #   /api/listings/*  (① 매물 검색)
│   │   │   ├── slots.py           #   /api/slots/extract (① 슬롯 추출)
│   │   │   ├── contract.py        #   /api/contract/*  (② 분류·RAG·PDF 분석)
│   │   │   └── stats.py           #   /api/stats, /api/eval/* (지표)
│   │   └── services/              # 도메인 로직 계층
│   │       ├── listing_search.py  #   ① search_listings 포팅 (pandas, 결정론적)
│   │       ├── slot_extractor.py  #   ① 규칙 기반 폴백 + Gemini 자동 승격
│   │       ├── pdf_clauses.py     #   ② pdf_utils 포팅 (제n조/특약 분리)
│   │       ├── clause_classifier.py # ② RoBERTa 승격 / 2-gram kNN 폴백
│   │       ├── law_retriever.py   #   ② KoE5 승격 / 어휘 중첩 폴백
│   │       └── eval_loader.py     #   ① 평가 산출물 파싱
│   ├── data/                      # 두 프로젝트의 데이터 병합
│   │   ├── synthetic_listings.csv · test_cases.csv · slot_schema.json   (①)
│   │   ├── eval_summary.csv · eval_results.csv                          (①)
│   │   └── clauses.csv · law_articles.json · sample_contract.pdf        (②)
│   └── requirements.txt
├── frontend/                      # React + Vite 프론트엔드
│   ├── vite.config.js             # /api → localhost:8000 프록시
│   └── src/
│       ├── App.jsx                # 사이드바 셸 + 탭 라우팅
│       ├── api.js                 # API 클라이언트 · 엔진 라벨
│       ├── styles.css             # 디자인 토큰 (계약 문서 × 도장 모티프)
│       ├── components/ui.jsx      # Stamp / Chip / Stat / Card / Head
│       └── pages/
│           ├── Overview.jsx       # 통합 개요 · 지표 · 파이프라인 · 차트
│           ├── Search.jsx         # ① 발화→슬롯→검색 라이브 데모
│           ├── Eval.jsx           # ① 슬롯 평가 지표 · 건별 결과
│           └── Contract.jsx       # ② PDF 분석 · 간이 판정 · 조항/법령 탐색
├── run_backend.sh · run_frontend.sh
└── README.md
```

---

## 엔진 폴백 / 자동 승격

무거운 의존성 없이 **기본 설치만으로 전체 기능이 동작**하도록 각 AI 단계에 폴백 엔진을
두었고, 선택 의존성이 준비되면 원본 프로젝트의 실제 모델로 **자동 승격**됩니다.
현재 활성 엔진은 대시보드 개요 탭과 `GET /api/stats` 의 `engines` 필드에서 확인할 수 있습니다.

| 단계 | 폴백 (기본) | 승격 조건 | 승격 시 엔진 |
|---|---|---|---|
| 슬롯 추출 | 규칙 기반 (`rule-based`) | `pip install google-genai` + 환경변수 `GOOGLE_API_KEY` | Gemini function calling (`gemini`) |
| 조항 분류 | 학습 데이터 2-gram kNN (`knn-fallback`) | `pip install torch transformers` + `backend/model/clause_classifier/` 에 파인튜닝 가중치 배치 | KLUE-RoBERTa (`klue-roberta`, acc 0.980) |
| 법률 근거 검색 | 문자 2-gram 어휘 중첩 (`lexical-fallback`, min_score 0.18) | `pip install sentence-transformers` (최초 1회 모델 다운로드) | nlpai-lab/KoE5 임베딩 (`koe5`, min_score 0.45, query:/passage: 컨벤션) |

> 원본 ②의 파인튜닝 가중치(`model/clause_classifier/`)는 업로드된 저장소에 포함되어 있지
> 않아, 원본 저장소의 `contract_classifier/train.py` 로 재학습해 위 경로에 두면 승격됩니다.

---

## 주요 API

| 메서드 · 경로 | 설명 |
|---|---|
| `GET /api/stats` | 통합 지표 + 활성 엔진 |
| `GET /api/listings/meta` | 범주형 슬롯 값 목록 |
| `POST /api/listings/search` | 슬롯 조건으로 매물 검색 (원본 필터 로직 그대로: 가격은 월세 기준) |
| `POST /api/slots/extract` | 발화 → 슬롯 JSON |
| `GET /api/eval/summary` · `/api/eval/results` | 슬롯 평가 요약 / 건별 결과 |
| `POST /api/contract/judge` | 조항 1건 분류 (+주의·위험이면 법 조문 근거) |
| `POST /api/contract/analyze` | 계약서 PDF 업로드 → 조항 분리·분류·근거 |
| `POST /api/contract/analyze-sample` | 내장 `sample_contract.pdf` 분석 |
| `GET /api/contract/clauses` | 학습 조항 검색 (label / q / offset / limit) |
| `GET /api/contract/laws` | 법률 지식베이스 45건 |

---

## 원본 → 통합 매핑

| 원본 파일 | 통합 위치 |
|---|---|
| ① `langchain_pipeline.py` 의 `search_listings()` | `backend/app/services/listing_search.py` (로직 동일 포팅) |
| ① 슬롯 추출 (Gemini FC) | `backend/app/services/slot_extractor.py` (규칙 폴백 + Gemini 훅) |
| ① `synthetic_listings.csv` · `slot_schema.json` · `result/*.csv` | `backend/data/` |
| ② `pdf_utils.py` | `backend/app/services/pdf_clauses.py` (정규식·분리 규칙 동일) |
| ② `contract_classifier/predict.py` | `backend/app/services/clause_classifier.py` (RoBERTa 경로 유지 + kNN 폴백) |
| ② `rag/retriever.py` | `backend/app/services/law_retriever.py` (KoE5 경로 유지 + 어휘 폴백) |
| ② `data/clauses.csv` · `data/law_articles.json` · `sample_contract.pdf` | `backend/data/` |
| ② `app.py` (Streamlit 데모) | `frontend/` 전체 (React 대시보드로 대체) |

## 주의사항

- 텍스트 추출이 가능한 전자계약 PDF를 가정합니다 (스캔본은 별도 OCR 필요).
- 분석 결과는 참고용이며 법적 자문을 대체하지 않습니다.
