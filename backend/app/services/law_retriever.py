"""법률 근거 검색(RAG) — 원본 NLP_final_real_estate/rag/retriever.py 구조 유지.
sentence-transformers 설치 시 nlpai-lab/KoE5 임베딩(engine="koe5", E5의
query:/passage: 접두사 컨벤션, min_score 0.45)으로, 미설치 시 문자 2-gram
포함도 기반 어휘 검색(engine="lexical-fallback", min_score 0.18)으로 동작."""
import json
from functools import lru_cache

from app.core.config import DATA_DIR

KOE5_MIN_SCORE = 0.45
LEXICAL_MIN_SCORE = 0.18


@lru_cache(maxsize=1)
def load_articles() -> list[dict]:
    with open(DATA_DIR / "law_articles.json", encoding="utf-8") as f:
        return json.load(f)


def _grams(t: str) -> set:
    s = "".join(t.split())
    return {s[i:i + 2] for i in range(len(s) - 1)}


@lru_cache(maxsize=1)
def _article_grams():
    return [_grams(a["title"] + " " + a["text"]) for a in load_articles()]


@lru_cache(maxsize=1)
def _load_koe5():
    """KoE5 임베딩 준비. 실패(미설치/오프라인) 시 None → 어휘 폴백."""
    try:
        import numpy as np
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("nlpai-lab/KoE5")
        corpus = [f"passage: {a['title']} {a['text']}" for a in load_articles()]
        emb = np.asarray(model.encode(corpus, normalize_embeddings=True, show_progress_bar=False))
        return model, emb
    except Exception:
        return None


def retrieve(query: str, top_k: int = 3, min_score: float | None = None) -> dict:
    articles = load_articles()
    bundle = _load_koe5()

    if bundle is not None:
        import numpy as np
        model, emb = bundle
        threshold = KOE5_MIN_SCORE if min_score is None else min_score
        q = model.encode([f"query: {query}"], normalize_embeddings=True, show_progress_bar=False)[0]
        sims = emb @ q
        order = np.argsort(-sims)[:top_k]
        hits = [{**articles[i], "score": round(float(sims[i]), 4)}
                for i in order if float(sims[i]) >= threshold]
        return {"engine": "koe5", "min_score": threshold, "results": hits}

    threshold = LEXICAL_MIN_SCORE if min_score is None else min_score
    q = _grams(query)
    scored = []
    for art, g in zip(articles, _article_grams()):
        score = len(q & g) / (len(q) or 1)  # 조항 그램의 조문 포함도
        scored.append((score, art))
    scored.sort(key=lambda x: -x[0])
    hits = [{**a, "score": round(s, 4)} for s, a in scored[:top_k] if s >= threshold]
    return {"engine": "lexical-fallback", "min_score": threshold, "results": hits}


def engine_name() -> str:
    return "koe5" if _load_koe5() is not None else "lexical-fallback"
