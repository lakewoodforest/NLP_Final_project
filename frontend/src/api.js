// 백엔드 API 클라이언트 (vite dev 프록시: /api → http://localhost:8000)
const handle = async (r) => {
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || `HTTP ${r.status}`);
  return r.json();
};

export const api = {
  get: (path) => fetch(`/api${path}`).then(handle),
  post: (path, body) =>
    fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),
  upload: (path, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`/api${path}`, { method: "POST", body: fd }).then(handle);
  },
};

export const ENGINE_LABEL = {
  "rule-based": "규칙 기반 (폴백)",
  gemini: "Gemini Function Calling",
  "knn-fallback": "2-gram kNN (폴백)",
  "klue-roberta": "KLUE-RoBERTa 분류기",
  "lexical-fallback": "어휘 중첩 검색 (폴백)",
  koe5: "KoE5 임베딩 RAG",
  template: "템플릿 설명 (폴백)",
};
