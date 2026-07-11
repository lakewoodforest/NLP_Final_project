"""매물 검색 서비스 (결정론적 코드, LLM 아님).

실제 데이터가 '지역구' / '지역동' 두 컬럼으로 분리돼 있어 지역 필터도 두 슬롯으로 처리.
- 정형 필터(지역구·지역동·거래유형·주거유형·층조건·근접시설·가격·면적·보증금)는 하드 필터.
- '기타' 자유조건(반려동물·조용함 등)은 '설명' 컬럼과의 유사도로 결과를 재정렬한다.
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


def _contains(series: pd.Series, query: str) -> pd.Series:
    q = str(query).replace("서울", "").strip()
    return series.astype(str).apply(
        lambda v: q in v.replace("서울", "").strip() or v.replace("서울", "").strip() in q
    )


def search_listings(slots: dict) -> tuple[pd.DataFrame, str]:
    df = load_listings().copy()

    # 지역: 지역구(정확) / 지역동(포함). 하나라도 없으면 그 조건은 건너뜀.
    지역구 = slots.get("지역구")
    지역동 = slots.get("지역동")
    if 지역구 and "지역구" in df.columns:
        df = df[_contains(df["지역구"], 지역구)]
    if 지역동 and "지역동" in df.columns:
        df = df[_contains(df["지역동"], 지역동)]

    for key in ("거래유형", "주거유형", "층조건", "근접시설"):
        if slots.get(key) and key in df.columns:
            df = df[df[key] == slots[key]]

    if slots.get("가격_최대") is not None:
        df = df[df["월세"] <= slots["가격_최대"]]
    if slots.get("가격_최소") is not None:
        df = df[df["월세"] >= slots["가격_최소"]]
    if slots.get("면적_최소") is not None:
        df = df[df["평수"] >= slots["면적_최소"]]
    if slots.get("보증금_최대") is not None:
        df = df[df["보증금"] <= slots["보증금_최대"]]

    rank_engine = "none"
    etc = (slots.get("기타") or "").strip()
    if etc:
        df, rank_engine = _rank_by_etc(df, etc)
    return df, rank_engine


_SORTS = {
    "deposit": ("보증금", True), "deposit_asc": ("보증금", True), "deposit_desc": ("보증금", False),
    "rent": ("월세", True), "rent_asc": ("월세", True), "rent_desc": ("월세", False),
    "area": ("평수", False), "area_desc": ("평수", False), "area_asc": ("평수", True),
}


def search_response(slots: dict, top_n: int = 12, sort: str | None = None) -> dict:
    df, rank_engine = search_listings(slots)
    if sort in _SORTS and not df.empty and _SORTS[sort][0] in df.columns:
        col, asc = _SORTS[sort]
        df = df.sort_values(col, ascending=asc)
    items = json.loads(df.head(top_n).to_json(orient="records", force_ascii=False))
    region_counts = (
        [{"name": r, "count": int((df["지역구"] == r).sum())} for r in CATEGORICAL_SLOTS["지역구"]]
        if "지역구" in df.columns else []
    )
    return {
        "total": int(len(df)),
        "items": items,
        "region_counts": region_counts,
        "rank_engine": rank_engine,
    }
