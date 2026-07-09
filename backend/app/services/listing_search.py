"""매물 검색 서비스 — 원본 real_estate_slot/langchain_pipeline.py 의
search_listings() 로직 포팅 (결정론적 코드, LLM 아님).

- 정형 필터(지역·거래유형·주거유형·층조건·근접시설·가격·면적·보증금)는 하드 필터.
- '기타' 자유조건(예: 반려동물 가능, 조용한 동네)이 들어오면 원본과 동일하게
  '설명' 컬럼과의 유사도로 결과를 재정렬한다.
    · sentence-transformers 설치 시 임베딩 코사인 유사도(engine="embed")
    · 미설치 시 문자 2-gram 자카드 유사도 폴백(engine="lexical")
"""
import json
from functools import lru_cache

import pandas as pd

from app.core.config import DATA_DIR, CATEGORICAL_SLOTS

_EMBED_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"


@lru_cache(maxsize=1)
def load_listings() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "synthetic_listings.csv")


def has_description() -> bool:
    return "설명" in load_listings().columns


# ── '기타' 유사도 랭킹 ────────────────────────────────────────────
def _grams(t: str) -> set:
    s = "".join(str(t).split())
    return {s[i:i + 2] for i in range(len(s) - 1)}


@lru_cache(maxsize=1)
def _load_embedder():
    """설치돼 있으면 임베딩 모델, 아니면 None → 어휘 폴백."""
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer(_EMBED_MODEL_NAME)
    except Exception:
        return None


def _rank_by_etc(df: pd.DataFrame, etc: str) -> tuple[pd.DataFrame, str]:
    if df.empty or "설명" not in df.columns:
        return df, "none"
    descs = df["설명"].fillna("").tolist()
    model = _load_embedder()
    if model is not None:
        import numpy as np
        qv = model.encode([etc], normalize_embeddings=True)[0]
        dv = model.encode(descs, normalize_embeddings=True)
        sims = np.asarray(dv) @ qv
        engine = "embed"
    else:
        q = _grams(etc)
        sims = [len(q & _grams(d)) / (len(q | _grams(d)) or 1) for d in descs]
        engine = "lexical"
    out = df.copy()
    out["_sim"] = sims
    out = out.sort_values("_sim", ascending=False).drop(columns=["_sim"])
    return out, engine


def search_listings(slots: dict) -> tuple[pd.DataFrame, str]:
    result = load_listings().copy()

    지역 = slots.get("지역")
    if 지역:
        query = str(지역).replace("서울", "").strip()
        result = result[result["지역"].astype(str).apply(
            lambda v: query in v.replace("서울", "").strip()
            or v.replace("서울", "").strip() in query
        )]
    for key in ("거래유형", "주거유형", "층조건", "근접시설"):
        if slots.get(key):
            result = result[result[key] == slots[key]]
    if slots.get("가격_최대") is not None:
        result = result[result["월세"] <= slots["가격_최대"]]
    if slots.get("가격_최소") is not None:
        result = result[result["월세"] >= slots["가격_최소"]]
    if slots.get("면적_최소") is not None:
        result = result[result["평수"] >= slots["면적_최소"]]
    if slots.get("보증금_최대") is not None:
        result = result[result["보증금"] <= slots["보증금_최대"]]

    # '기타' 자유조건: 필터 통과 후보 안에서 설명 유사도로 재정렬 (원본 로직)
    rank_engine = "none"
    etc = (slots.get("기타") or "").strip()
    if etc:
        result, rank_engine = _rank_by_etc(result, etc)
    return result, rank_engine


_SORTS = {
    "deposit": ("보증금", True),   # 보증금 낮은순
    "rent": ("월세", True),        # 월세 낮은순
    "area": ("평수", False),       # 면적 넓은순
}


def search_response(slots: dict, top_n: int = 12, sort: str | None = None) -> dict:
    df, rank_engine = search_listings(slots)
    if sort in _SORTS and not df.empty:
        col, asc = _SORTS[sort]
        df = df.sort_values(col, ascending=asc)
    items = json.loads(df.head(top_n).to_json(orient="records", force_ascii=False))
    region_counts = [
        {"name": r, "count": int((df["지역"] == r).sum())}
        for r in CATEGORICAL_SLOTS["지역"]
    ]
    return {
        "total": int(len(df)),
        "items": items,
        "region_counts": region_counts,
        "rank_engine": rank_engine,
    }
