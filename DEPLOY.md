# 배포 가이드 — GitHub + Render (무료)

이 앱은 FastAPI 백엔드가 빌드된 프론트엔드(UI)까지 함께 서빙하는 **단일 서비스**입니다.
따라서 Render에 **웹 서비스 하나**만 올리면 됩니다.

---

## 1. GitHub에 올리기

로컬에서 이미 git 커밋까지 되어 있습니다. GitHub에 빈 저장소를 만든 뒤 연결·푸시만 하면 됩니다.

1. https://github.com/new 에서 새 저장소 생성 (예: `real-estate-ai`). README/gitignore는 추가하지 마세요(이미 있음).
2. 터미널에서:

```bash
cd ~/Desktop/real-estate-ai
git branch -M main
git remote add origin https://github.com/<본인아이디>/real-estate-ai.git
git push -u origin main
```

> 푸시할 때 GitHub 로그인(사용자명 + Personal Access Token)이 필요합니다.
> 토큰 발급: GitHub → Settings → Developer settings → Personal access tokens.

---

## 2. Render에 배포하기

방법 A — Blueprint (자동, 추천). 저장소에 `render.yaml`이 있어 클릭 몇 번이면 됩니다.

1. https://render.com 가입 후 GitHub 계정 연결.
2. 대시보드 → **New +** → **Blueprint** → 방금 올린 저장소 선택.
3. Render가 `render.yaml`을 읽어 Docker로 자동 구성 → **Apply / Deploy**.
4. 첫 빌드는 몇 분 걸립니다. 완료되면 `https://hanip-budongsan.onrender.com` 같은 주소가 생깁니다.

방법 B — 수동 설정 (Blueprint 대신 직접):

1. **New +** → **Web Service** → 저장소 선택.
2. Runtime: **Docker** (Dockerfile 자동 감지), Plan: **Free**.
3. Health Check Path: `/api/health`.
4. **Create Web Service**.

---

## 참고

- **환경변수(선택):** Gemini 설명/슬롯추출을 켜려면 Render 서비스 → Environment 에 `GOOGLE_API_KEY` 추가. 없으면 규칙기반/템플릿 폴백으로 정상 동작합니다.
- **무료 플랜 특성:** 일정 시간 요청이 없으면 서버가 잠들고, 다음 접속 시 다시 깨어나며 30초~1분 지연이 있을 수 있습니다.
- **가벼운 구성:** 기본 배포는 torch/transformers 없이 폴백 엔진으로 동작해 무료 플랜(512MB) 메모리에 맞습니다. 실제 모델(KLUE-RoBERTa 등)은 무료 플랜 메모리를 초과하므로 로컬 실행용으로 권장합니다.
