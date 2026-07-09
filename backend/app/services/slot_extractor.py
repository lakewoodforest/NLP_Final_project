"""자연어 발화 → 슬롯 추출.
GOOGLE_API_KEY + google-genai 가 있으면 원본 프로젝트 ①과 동일하게 Gemini
function calling 방식(engine="gemini")을 쓰고, 없으면 규칙 기반(engine="rule-based")
폴백으로 동작한다. 응답 스키마는 slot_schema.json(8개 슬롯)과 동일."""
import json
import os
import re

from app.core.config import CATEGORICAL_SLOTS, DATA_DIR

_FACILITY_ALIASES = {
    "역세권": "역세권", "지하철": "역세권",
    "대학": "대학가 인근", "학교": "학교 근처",
    "마트": "마트 도보 5분", "버스": "버스정류장 인접",
}


def _rule_based(utterance: str) -> dict:
    s: dict = {}
    for r in CATEGORICAL_SLOTS["지역"]:
        if r in utterance or r.replace("구", "") in utterance:
            s["지역"] = r
    if "전세" in utterance:
        s["거래유형"] = "전세"
    elif "월세" in utterance:
        s["거래유형"] = "월세"
    for h in CATEGORICAL_SLOTS["주거유형"]:
        if h in utterance:
            s["주거유형"] = h
    for f in CATEGORICAL_SLOTS["층조건"]:
        if f in utterance:
            s["층조건"] = f
    for k, v in _FACILITY_ALIASES.items():
        if k in utterance:
            s["근접시설"] = v
            break
    if m := re.search(r"(\d+)\s*만\s*원?\s*(?:이하|아래|밑|까지)", utterance):
        s["가격_최대"] = int(m.group(1))
    if m := re.search(r"(\d+)\s*만\s*원?\s*이상", utterance):
        s["가격_최소"] = int(m.group(1))
    if m := re.search(r"(\d+(?:\.\d+)?)\s*평\s*(?:이상)?", utterance):
        s["면적_최소"] = float(m.group(1))
    return s


def _gemini(utterance: str) -> dict | None:
    """원본과 동일 컨셉의 Gemini 구조화 추출. 실패 시 None → 폴백."""
    try:
        from google import genai  # type: ignore

        schema = json.loads((DATA_DIR / "slot_schema.json").read_text(encoding="utf-8"))
        client = genai.Client()
        prompt = (
            "다음 부동산 검색 발화에서 슬롯을 JSON으로 추출하라. "
            "언급되지 않은 슬롯은 생략. 스키마: "
            + json.dumps(schema, ensure_ascii=False)
            + "\n발화: " + utterance + "\nJSON만 출력:"
        )
        resp = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        text = re.sub(r"```json|```", "", resp.text).strip()
        return json.loads(text)
    except Exception:
        return None


def extract_slots(utterance: str) -> dict:
    if os.getenv("GOOGLE_API_KEY"):
        got = _gemini(utterance)
        if got is not None:
            return {"slots": got, "engine": "gemini"}
    return {"slots": _rule_based(utterance), "engine": "rule-based"}
