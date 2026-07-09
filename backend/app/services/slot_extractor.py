"""자연어 발화 → (의도 분류 + 슬롯 추출).

GOOGLE_API_KEY + google-genai 가 있으면 원본 프로젝트 ①과 동일하게 Gemini 를 쓰고,
없으면 규칙 기반 폴백으로 동작한다.

반환: {"intent": "매물검색"|"잡담", "slots": {...}, "engine": "gemini"|"rule-based"}
"""
import json
import os
import re

from app.core.config import CATEGORICAL_SLOTS, DATA_DIR

_FACILITY_ALIASES = {
    "역세권": "역세권", "지하철": "역세권", "역 근처": "역세권", "역세": "역세권",
    "대학": "대학가 인근", "학교": "학교 근처",
    "마트": "마트 도보 5분", "버스": "버스정류장 인접",
}

# 랜드마크/동 이름 → 6개 지원 구 매핑
_REGION_ALIASES = {
    "홍대": "마포구", "합정": "마포구", "연남": "마포구", "망원": "마포구",
    "성수": "성동구", "왕십리": "성동구", "서울숲": "성동구",
    "잠실": "송파구", "석촌": "송파구", "가락": "송파구",
    "신림": "관악구", "봉천": "관악구", "서울대": "관악구", "샤로수길": "관악구",
    "상계": "노원구", "공릉": "노원구", "중계": "노원구",
    "역삼": "강남구", "삼성": "강남구", "논현": "강남구", "대치": "강남구",
}

# 부정 표현 (예: "반지하 말고")
_NEG_WORDS = ("말고", "말구", "빼고", "제외", "싫", "아닌", "아니", "없")


def _negated(u: str, term: str) -> bool:
    i = u.find(term)
    if i < 0:
        return False
    window = u[i + len(term): i + len(term) + 6]
    return any(n in window for n in _NEG_WORDS)

# 자유조건(기타) 키워드 → 설명 유사도 검색용 표준 문구
_ETC_RULES = [
    (["반려동물", "강아지", "고양이", "펫", "댕댕이", "냥이", "애완"], "반려동물 가능"),
    (["주차"], "주차 가능"),
    (["조용"], "조용한 동네"),
    (["즉시 입주", "즉시입주", "바로 입주", "바로입주", "즉시"], "즉시 입주"),
    (["채광", "햇빛", "볕", "밝"], "채광 좋은"),
    (["신축", "깨끗", "리모델링", "새 건물"], "신축 깨끗한"),
    (["보안", "치안", "안전"], "치안 좋은"),
]

# 의도 판별용 부동산 관련 힌트
_INTENT_HINTS = (
    list(CATEGORICAL_SLOTS["지역"])
    + list(CATEGORICAL_SLOTS["주거유형"])
    + ["전세", "월세", "보증금", "방", "집", "매물", "평", "역세권", "자취",
       "이사", "입주", "원룸", "투룸", "오피스텔", "전월세", "구해", "찾"]
)

_MAX_SUFFIX = r"(?:이하|이내|까지|밑|아래|미만|안쪽|넘지\s*않)"
_MIN_SUFFIX = r"(?:이상|초과|넘게|넘어)"


def _val(num: str, unit: str | None) -> int:
    n = int(num.replace(",", ""))
    if unit and "억" in unit:
        return n * 10000
    if unit and "천" in unit:
        return n * 1000
    return n  # 만원 단위(기본)


def _find_amount(u: str, keyword: str | None, suffix: str) -> int | None:
    """keyword(보증금/월세) 뒤에 오는 금액+접미사(이하/이상)를 찾는다.
    keyword 가 None 이면 문장 전체에서 첫 금액을 찾는다."""
    amount = r"(\d[\d,]*)\s*(억|천만?|만)?\s*원?\s*"
    pat = (re.escape(keyword) + r"[^\d]{0,6}" if keyword else "") + amount + suffix
    m = re.search(pat, u)
    return _val(m.group(1), m.group(2)) if m else None


def _rule_based(utterance: str) -> dict:
    u = utterance
    s: dict = {}

    for r in CATEGORICAL_SLOTS["지역"]:
        if r in u or r.replace("구", "") in u:
            s["지역"] = r
            break
    else:
        for alias, region in _REGION_ALIASES.items():
            if alias in u:
                s["지역"] = region
                break
    if "전세" in u:
        s["거래유형"] = "전세"
    elif "월세" in u:
        s["거래유형"] = "월세"
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

    # ── 금액: 보증금 / 월세 구분 ──
    v = _find_amount(u, "보증금", _MAX_SUFFIX)
    if v is not None:
        s["보증금_최대"] = v
    v = _find_amount(u, "월세", _MAX_SUFFIX)
    if v is not None:
        s["가격_최대"] = v
    v = _find_amount(u, "월세", _MIN_SUFFIX)
    if v is not None:
        s["가격_최소"] = v
    # 보증금/월세 키워드 없이 그냥 "N 이하" → 전세거나 금액이 크면(≥300만원) 보증금,
    # 아니면 월세로 해석 (월세가 300만원 이상인 경우는 드물다는 휴리스틱)
    if "보증금_최대" not in s and "가격_최대" not in s:
        v = _find_amount(u, None, _MAX_SUFFIX)
        if v is not None:
            if "전세" in u or v >= 300:
                s["보증금_최대"] = v
            else:
                s["가격_최대"] = v

    # "최대 N" / "최소 N" 표현 (접미사 이하/이상 없이)
    m = re.search(r"(보증금|월세)?\s*최대\s*(\d[\d,]*)\s*(억|천만?|만)?", u)
    if m:
        v = _val(m.group(2), m.group(3))
        if m.group(1) == "보증금" or (m.group(1) is None and ("전세" in u or v >= 300)):
            s.setdefault("보증금_최대", v)
        else:
            s.setdefault("가격_최대", v)
    m = re.search(r"(?:월세)?\s*최소\s*(\d[\d,]*)\s*(억|천만?|만)?", u)
    if m:
        s.setdefault("가격_최소", _val(m.group(1), m.group(2)))

    m = re.search(r"(\d+(?:\.\d+)?)\s*평\s*(?:이상|넘)", u)
    if m:
        s["면적_최소"] = float(m.group(1))

    etc = [phrase for kws, phrase in _ETC_RULES if any(k in u for k in kws)]
    if etc:
        s["기타"] = ", ".join(dict.fromkeys(etc))

    return s


def _rule_intent(utterance: str) -> str:
    return "매물검색" if any(h in utterance for h in _INTENT_HINTS) else "잡담"


# ── Gemini 경로 ──────────────────────────────────────────────
def _gemini_client():
    from google import genai  # type: ignore
    return genai.Client()


def _gemini_slots(utterance: str) -> dict | None:
    try:
        schema = json.loads((DATA_DIR / "slot_schema.json").read_text(encoding="utf-8"))
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
        prompt = ("다음 발화가 '매물검색'(집/방을 찾는 요청)인지 '잡담'인지 한 단어로만 답하라.\n"
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
