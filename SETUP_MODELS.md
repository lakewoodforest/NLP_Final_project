# 실제 모델로 승격시키기 (폴백 → 원본 모델)

기본 상태에서는 무거운 라이브러리·API 키 없이도 전체 대시보드가 **폴백 엔진**으로 동작합니다.
아래를 설정하면 각 기능이 원본 프로젝트의 **실제 모델**로 자동 승격됩니다. (서버 코드 수정 불필요 — 재시작만 하면 됨)

| 기능 | 폴백(기본) | 승격 후 | 승격 방법 |
|---|---|---|---|
| 계약서 조항 분류 | 2-gram kNN | KLUE-RoBERTa (acc≈0.98) | 아래 ① 학습 |
| 법률 근거 검색(RAG) | 어휘 중첩 검색 | KoE5 임베딩 | 아래 ② 설치 |
| 슬롯 추출 · 계약서 설명 | 규칙기반 · 템플릿 | Gemini | 아래 ③ 키 설정 |

먼저 고급 의존성을 설치하세요 (한 번만):

```bash
cd backend
pip install -r requirements-full.txt
```

---

## ① 계약서 분류기 — KLUE-RoBERTa 학습

가중치는 저장소에 없어서 한 번 학습해야 합니다. iMac(Apple Silicon)은 MPS 가속으로 수 분이면 끝납니다.

```bash
cd backend
python3 train_classifier.py
```

- 학습 데이터: `backend/data/clauses.csv` (762건)
- 저장 위치: `backend/model/clause_classifier/`
- 서버 재시작 → 분류기가 `knn-fallback` → `klue-roberta` 로 자동 승격.

## ② 법률 RAG — KoE5 임베딩

별도 학습 없이 `sentence-transformers` 설치만으로 승격됩니다 (첫 실행 시 KoE5 모델 자동 다운로드).
`requirements-full.txt` 를 설치했다면 이미 준비된 상태이며, 서버 재시작 시 `lexical-fallback` → `koe5` 로 승격됩니다.

## ③ Gemini — 슬롯 추출 & 계약서 설명 생성

무료 API 키를 발급받아 `.env` 에 넣으세요.

```bash
cd backend
cp .env.example .env
# .env 파일을 열어 GOOGLE_API_KEY=발급받은키  입력
```

- 키 발급: https://aistudio.google.com/app/apikey
- 서버 재시작 → 슬롯 추출이 `rule-based` → `gemini`, 계약서 설명이 `template` → `gemini` 로 승격.

---

## 승격 확인

서버 실행 후 홈(대시보드) 상단의 **"현재 활성 엔진"** 배지, 또는:

```bash
curl -s http://localhost:8000/api/stats | python3 -m json.tool
```

`engines` 항목이 `klue-roberta` / `koe5` / `gemini` 로 바뀌었으면 승격 완료입니다.
