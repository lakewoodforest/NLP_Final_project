# 한입 부동산 (real-estate-ai)

자연어로 매물을 찾고, 임대차 계약서의 위험 조항을 법 조문 근거와 함께 짚어주는 **부동산 AI 통합 웹앱**입니다.
NLP 기술을 실제 서비스 형태로 결합한 프로젝트로, 두 개의 NLP 파이프라인을 하나의 앱으로 병합했습니다.

- **① 매물 검색** — 자연어 발화에서 의도를 분류하고 검색 조건(슬롯)을 추출해 매물을 찾아줍니다.
- **② 계약서 검토** — 계약서 PDF의 조항을 정상·주의·위험으로 분류하고, 관련 법 조문을 검색(RAG)해 쉬운 설명을 생성합니다.

배포 예시: `https://hanip-budongsan.onrender.com`

---

## 기술 스택

- **프론트엔드**: React + Vite (단일 페이지, 탭 전환형 대시보드)
- **백엔드**: FastAPI (Python) — 하나의 서버가 API와 빌드된 UI를 함께 서빙
- **NLP 엔진**: 아래 "엔진과 폴백" 참고

## 주요 기능

### 매물 검색 (프롬프트 중심)
- 문장 입력 → **의도 분류**(매물검색/잡담) → **슬롯 추출**(지역·거래유형·주거유형·층조건·근접시설·가격·면적·자유조건) → 검색
- "보증금 1000만원 이하"와 "월세 60만원 이하"를 구분해서 인식
- "반려동물 가능", "조용한 동네" 같은 자유조건은 매물 설명과의 유사도로 재정렬
- 결과 정렬(보증금/월세 낮은순, 면적 넓은순)

### 계약서 검토
- PDF 업로드 → 조항 분리(제n조 / 특약사항) → 정상·주의·위험 분류
- 주의·위험 조항에 관련 법 조문 근거(RAG) + 자연어 설명(+개인정보 마스킹) 부착
- 위험도순 정렬 및 요약 배너

## 엔진과 폴백 (핵심 설계)

무거운 라이브러리·API 키 없이도 전체가 **폴백 엔진**으로 동작하고, 의존성을 갖추면 실제 모델로 자동 승격됩니다.

| 기능 | 폴백(기본) | 승격 후 |
|---|---|---|
| 의도 분류·슬롯 추출 | 규칙 기반 | Gemini |
| 조항 분류 | 문자 2-gram kNN | KLUE-RoBERTa (파인튜닝) |
| 법률 근거 검색(RAG) | 어휘 중첩 | KoE5 임베딩 |
| 계약서 설명 생성 | 템플릿 | Gemini |

승격 방법은 [`SETUP_MODELS.md`](./SETUP_MODELS.md) 참고.

---

## 로컬 실행

### 방법 A — 통합 실행 (터미널 1개, 추천)
```bash
bash run_all.sh
```
→ 브라우저에서 `http://localhost:8000`

### 방법 B — 개발 모드 (수정 즉시 반영)
```bash
# 터미널 ① 백엔드
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 터미널 ② 프론트엔드
cd frontend && npm install && npm run dev
```
→ 브라우저에서 `http://localhost:5173`

---

## 배포 (Render, 무료)

`Dockerfile`과 `render.yaml`이 포함되어 있어 Render에 웹 서비스 하나로 배포됩니다.
자세한 절차는 [`DEPLOY.md`](./DEPLOY.md) 참고. `main` 브랜치에 push하면 자동 재배포됩니다.

---

## 프로젝트 구조

```
backend/
  app/
    main.py                 # FastAPI 진입점 (+ 프론트 dist 서빙)
    routers/                # stats · listings · slots · contract API
    services/               # 슬롯추출 · 매물검색 · 조항분류 · 법률검색(RAG) · 설명생성
    core/config.py          # 데이터 경로 · 라벨 · 슬롯 정의
  data/                     # synthetic_listings.csv · clauses.csv · law_articles.json 등
  train_classifier.py       # (선택) KLUE-RoBERTa 학습 스크립트
  eval_slots.py             # 슬롯 추출 평가 스크립트
frontend/
  src/pages/                # Landing · Overview · Search · Contract
  src/components/ui.jsx
Dockerfile · render.yaml    # 배포
run_all.sh                  # 통합 실행
```

> ⚠️ 계약서 분석 결과는 참고용이며 법적 자문을 대체하지 않습니다. 매물 데이터는 현재 합성(synthetic) 데이터이며, 실제 매물 연동은 추후 예정입니다.
