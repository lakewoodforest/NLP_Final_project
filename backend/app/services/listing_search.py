"""매물 검색 서비스 — search_listings() + extract_slots() 수정본.

지역 칼럼이 '지역 구' / '지역 동'으로 분리된 CSV 구조에 대응.
주거유형은 평수 기반 자동 분류(원룸/투룸/오피스텔)로 처리.
"""
import json
import os
import re
from functools import lru_cache

import pandas as pd

# ── 설정 (config에서 가져오는 대신 여기서 직접 정의) ─────────────
# 이걸로 바꾸기
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data")

CATEGORICAL_SLOTS = {
    "지역구": ["강남구", "성동구", "마포구", "관악구", "노원구", "송파구"],
    "거래유형": ["전세", "월세"],
    "주거유형": ["원룸", "투룸", "오피스텔"],
    "층조건": ["반지하", "1층", "저층", "중층", "고층"],
    "근접시설": ["역세권", "대학가 인근", "학교 근처", "마트 도보 5분", "버스정류장 인접"],
}

_EMBED_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_MODEL_LOCAL_PATH = os.path.join(_BASE_DIR, "models_cache",
                                  _EMBED_MODEL_NAME.replace("/", "_"))


# ══════════════════════════════════════════════════════════════════
# 검색 서비스
# ══════════════════════════════════════════════════════════════════

@lru_cache(maxsize=1)
def load_listings() -> pd.DataFrame:
    path = os.path.join(DATA_DIR, "synthetic_listings.csv")
    return pd.read_csv(path)


@lru_cache(maxsize=1)
def _load_embedder():
    try:
        from sentence_transformers import SentenceTransformer
        if os.path.exists(_MODEL_LOCAL_PATH):
            os.environ["HF_HUB_OFFLINE"] = "1"
            return SentenceTransformer(_MODEL_LOCAL_PATH)
        model = SentenceTransformer(_EMBED_MODEL_NAME)
        os.makedirs(os.path.dirname(_MODEL_LOCAL_PATH), exist_ok=True)
        model.save(_MODEL_LOCAL_PATH)
        return model
    except Exception:
        return None


def _grams(t: str) -> set:
    s = "".join(str(t).split())
    return {s[i:i+2] for i in range(len(s)-1)}


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


def _region_match(listing_val: str, query: str) -> bool:
    """
    CSV의 '지역 구' 또는 '지역 동' 중 하나라도 query를 포함하면 일치.
    query가 '강남구'처럼 구 이름이면 '지역 구'와 비교,
    '수서동'처럼 동 이름이면 '지역 동'과 비교.
    """
    q = query.replace("서울", "").strip()
    v = str(listing_val).replace("서울", "").strip()
    return q in v or v in q


# search_listings 함수 — 지역 필터 부분
def search_listings(slots: dict) -> tuple[pd.DataFrame, str]:
    df = load_listings().copy()

    지역구 = slots.get("지역구")
    지역동 = slots.get("지역동")

    if 지역구:
        df = df[df["지역구"].astype(str) == 지역구]
    if 지역동:
        q = 지역동.replace("서울", "").strip()
        df = df[df["지역동"].astype(str).apply(
            lambda v: q in v.replace("서울", "").strip()
        )]

    for key in ("거래유형", "주거유형", "층조건", "근접시설"):
        if slots.get(key):
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
    "deposit": ("보증금", True),
    "rent":    ("월세",   True),
    "area":    ("평수",   False),
}


def search_response(slots: dict, top_n: int = 12, sort: str | None = None) -> dict:
    df, rank_engine = search_listings(slots)
    if sort in _SORTS and not df.empty:
        col, asc = _SORTS[sort]
        df = df.sort_values(col, ascending=asc)
    items = json.loads(df.head(top_n).to_json(orient="records", force_ascii=False))
    # search_response — region_counts 부분
    region_counts = [
        {"name": r, "count": int((df["지역구"] == r).sum())}
        for r in CATEGORICAL_SLOTS["지역구"]
    ] if "지역구" in df.columns else []
    return {
        "total": int(len(df)),
        "items": items,
        "region_counts": region_counts,
        "rank_engine": rank_engine,
    }


# ══════════════════════════════════════════════════════════════════
# 슬롯 추출
# ══════════════════════════════════════════════════════════════════

_FACILITY_ALIASES = {
    "역세권": "역세권", "지하철": "역세권", "역 근처": "역세권", "역세": "역세권",
    "대학": "대학가 인근", "학교": "학교 근처",
    "마트": "마트 도보 5분", "버스": "버스정류장 인접",
}

# 지역 별칭 (랜드마크/동 이름 → 구 이름)
_REGION_ALIASES = {
    "홍대": "마포구", "합정": "마포구", "연남": "마포구", "망원": "마포구",
    "성수": "성동구", "왕십리": "성동구", "서울숲": "성동구",
    "잠실": "송파구", "석촌": "송파구", "가락": "송파구",
    "신림": "관악구", "봉천": "관악구", "서울대": "관악구",
    "상계": "노원구", "공릉": "노원구", "중계": "노원구",
    "역삼": "강남구", "삼성": "강남구", "논현": "강남구", "대치": "강남구",
}

_NEG_WORDS = ("말고", "말구", "빼고", "제외", "싫", "아닌", "아니", "없")

_ETC_RULES = [
    (["반려동물", "강아지", "고양이", "펫", "댕댕이", "냥이", "애완"], "반려동물 가능"),
    (["주차"], "주차 가능"),
    (["조용"], "조용한 동네"),
    (["즉시 입주", "즉시입주", "바로 입주", "바로입주", "즉시"], "즉시 입주"),
    (["채광", "햇빛", "볕", "밝"], "채광 좋은"),
    (["신축", "깨끗", "리모델링", "새 건물"], "신축 깨끗한"),
    (["보안", "치안", "안전"], "치안 좋은"),
]

_INTENT_HINTS = (
    list(CATEGORICAL_SLOTS["지역구"])
    + list(CATEGORICAL_SLOTS["주거유형"])
    + ["전세", "월세", "보증금", "방", "집", "매물", "평", "역세권", "자취",
       "이사", "입주", "원룸", "투룸", "오피스텔", "전월세", "구해", "찾"]
)

_MAX_SUFFIX = r"(?:이하|이내|까지|밑|아래|미만|안쪽|넘지\s*않)"
_MIN_SUFFIX = r"(?:이상|초과|넘게|넘어)"


def _negated(u: str, term: str) -> bool:
    i = u.find(term)
    if i < 0:
        return False
    window = u[i+len(term):i+len(term)+6]
    return any(n in window for n in _NEG_WORDS)


def _val(num: str, unit: str | None) -> int:
    n = int(num.replace(",", ""))
    if unit and "억" in unit:  return n * 10000
    if unit and "천" in unit:  return n * 1000
    return n


def _find_amount(u: str, keyword: str | None, suffix: str) -> int | None:
    amount = r"(\d[\d,]*)\s*(억|천만?|만)?\s*원?\s*"
    pat = (re.escape(keyword) + r"[^\d]{0,6}" if keyword else "") + amount + suffix
    m = re.search(pat, u)
    return _val(m.group(1), m.group(2)) if m else None


def _rule_based(utterance: str) -> dict:
    u = utterance
    s: dict = {}

        # _rule_based — 지역 추출 부분
    for r in CATEGORICAL_SLOTS["지역구"]:
        if r in u or r.replace("구", "") in u:
            s["지역구"] = r
            break
    else:
        for alias, region in _REGION_ALIASES.items():
            if alias in u:
                s["지역구"] = region
                break
        else:
            m = re.search(r"([가-힣]+동)", u)
            if m:
                s["지역동"] = m.group(1)  # 동 이름은 지역동 슬롯으로

    if "전세" in u:    s["거래유형"] = "전세"
    elif "월세" in u:  s["거래유형"] = "월세"

    for h in CATEGORICAL_SLOTS["주거유형"]:
        if h in u:
            s["주거유형"] = h
            break
    for f in CATEGORICAL_SLOTS["층조건"]:
        if f in u and not _negated(u, f):
            s["층조건"] = f
            break
    for k, v in _FACILITY_ALIASES.items():
        if k in u:
            s["근접시설"] = v
            break

    v = _find_amount(u, "보증금", _MAX_SUFFIX)
    if v is not None:   s["보증금_최대"] = v
    v = _find_amount(u, "월세", _MAX_SUFFIX)
    if v is not None:   s["가격_최대"] = v
    v = _find_amount(u, "월세", _MIN_SUFFIX)
    if v is not None:   s["가격_최소"] = v

    if "보증금_최대" not in s and "가격_최대" not in s:
        v = _find_amount(u, None, _MAX_SUFFIX)
        if v is not None:
            if "전세" in u or v >= 300:
                s["보증금_최대"] = v
            else:
                s["가격_최대"] = v

    m = re.search(r"(\d+(?:\.\d+)?)\s*평\s*(?:이상|넘)", u)
    if m:
        s["면적_최소"] = float(m.group(1))

    etc = [phrase for kws, phrase in _ETC_RULES if any(k in u for k in kws)]
    if etc:
        s["기타"] = ", ".join(dict.fromkeys(etc))

    return s


def _rule_intent(utterance: str) -> str:
    return "매물검색" if any(h in utterance for h in _INTENT_HINTS) else "잡담"


def _gemini_client():
    from google import genai
    return genai.Client()


def _gemini_slots(utterance: str) -> dict | None:
    try:
        schema_path = os.path.join(DATA_DIR, "slot_schema.json")
        schema = json.loads(open(schema_path, encoding="utf-8").read())
        prompt = (
            "다음 부동산 검색 발화에서 슬롯을 JSON으로 추출하라. 언급되지 않은 슬롯은 생략. "
            "가격은 만원 단위 정수. '보증금 N 이하'는 보증금_최대, '월세 N 이하'는 가격_최대로 구분하라. "
            "반려동물/주차/조용함 등 자유조건은 '기타'에 짧게 요약하라. 스키마: "
            + json.dumps(schema, ensure_ascii=False)
            + "\n발화: " + utterance + "\nJSON만 출력:"
        )
        resp = _gemini_client().models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), contents=prompt)
        return json.loads(re.sub(r"```json|```", "", resp.text).strip())
    except Exception:
        return None


def _gemini_intent(utterance: str) -> str | None:
    try:
        prompt = ("다음 발화가 '매물검색'인지 '잡담'인지 한 단어로만 답하라.\n"
                  f"발화: {utterance}\n답(매물검색 또는 잡담):")
        resp = _gemini_client().models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), contents=prompt)
        return "잡담" if "잡담" in resp.text else "매물검색"
    except Exception:
        return None


def extract_slots(utterance: str) -> dict:
    use_gemini = bool(os.getenv("GOOGLE_API_KEY"))
    intent = (_gemini_intent(utterance) if use_gemini else None) or _rule_intent(utterance)

    if intent == "잡담":
        return {"intent": "잡담", "slots": {}, "engine": "gemini" if use_gemini else "rule-based"}

    if use_gemini:
        got = _gemini_slots(utterance)
        if got is not None:
            return {"intent": "매물검색", "slots": got, "engine": "gemini"}

    return {"intent": "매물검색", "slots": _rule_based(utterance), "engine": "rule-based"}