"""위험/주의 조항 자연어 설명 생성 — 원본 NLP_final_real_estate/generation/explainer.py 포팅.

- GOOGLE_API_KEY + google-genai 가 있으면 Gemini 설명(engine="gemini").
- 없으면 검색된 법 조문 근거를 엮어 만드는 결정론적 템플릿 설명(engine="template").
- 외부 API로 보내기 전, 조항 텍스트의 개인정보(연락처/주민번호/이메일)를 마스킹한다.
"""
import os
import re

SYSTEM_PROMPT = """당신은 대한민국 주택임대차 법률에 정통한 상담 전문가입니다.
사용자가 제공한 계약 조항, AI 분류 결과, 관련 법 조문을 바탕으로
왜 이 조항이 문제인지(또는 주의가 필요한지) 설명합니다.

반드시 지켜야 할 규칙:
1. 아래 제공된 '관련 법 조문' 범위 안에서만 근거를 제시하세요. 조문에 없는 내용을 지어내지 마세요.
2. 어떤 법률의 몇 조 때문에 문제가 되는지 명시하세요.
3. 전체 3~5문장, 임차인이 이해하기 쉬운 평이한 문장으로 설명하세요.
4. 마지막 문장은 임차인이 취할 수 있는 실질적인 행동을 한 가지 제안하세요.
5. 과장하지 말고, 근거가 부족하면 "단정하기 어렵다"고 솔직히 말하세요."""

_PII_PATTERNS = [
    (re.compile(r"\d{2,3}-\d{3,4}-\d{4}"), "[연락처 비공개]"),
    (re.compile(r"\d{6}\s*-\s*\d{7}"), "[주민등록번호 비공개]"),
    (re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"), "[이메일 비공개]"),
]


def mask_pii(text: str) -> str:
    for pattern, replacement in _PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def _build_user_prompt(clause: str, label: str, references: list[dict]) -> str:
    if references:
        ref_lines = "\n".join(f"- {r.get('title','')}: {r.get('text','')}" for r in references)
    else:
        ref_lines = "(검색된 관련 조문 없음 - 일반적인 계약 공정성 관점에서만 신중하게 코멘트하세요)"
    return (f"[계약 조항]\n{clause}\n\n[AI 분류 결과]\n{label}\n\n"
            f"[관련 법 조문]\n{ref_lines}\n\n위 정보를 바탕으로 이 조항에 대해 설명해 주세요.")


def _gemini(clause: str, label: str, references: list[dict]) -> str | None:
    try:
        from google import genai  # type: ignore
        client = genai.Client()
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=_build_user_prompt(clause, label, references),
            config={"system_instruction": SYSTEM_PROMPT, "temperature": 0.3},
        )
        return (resp.text or "").strip() or None
    except Exception:
        return None


def _template(clause: str, label: str, references: list[dict]) -> str:
    if references:
        titles = ", ".join(r.get("title", "") for r in references[:2])
        first = references[0]
        snippet = (first.get("text", "") or "")[:70]
        return (
            f"이 조항은 AI 분류상 '{label}' 조항입니다. 관련 법 조문({titles})에 비추어 "
            f"임차인에게 불리하게 작용할 소지가 있습니다. 예를 들어 {first.get('title','해당 조문')}은(는) "
            f"\"{snippet}…\"라고 규정합니다. 다만 개별 사정에 따라 달라질 수 있어 단정하긴 어렵습니다. "
            f"계약 전 해당 조항의 수정·삭제를 임대인과 협의하거나 전문가 상담을 받아보시길 권합니다."
        )
    return (
        f"이 조항은 AI 분류상 '{label}' 조항입니다. 검색된 관련 법 조문이 없어 단정하긴 어렵지만, "
        f"계약 공정성 관점에서 임차인에게 불리한 부분이 없는지 한 번 더 확인해보시길 권합니다. "
        f"애매하다면 서명 전 전문가(공인중개사·법률 상담)의 검토를 받아보세요."
    )


def explain(clause: str, label: str, references: list[dict] | None = None) -> dict:
    references = references or []
    safe = mask_pii(clause)
    if os.getenv("GOOGLE_API_KEY"):
        got = _gemini(safe, label, references)
        if got:
            return {"text": got, "engine": "gemini"}
    return {"text": _template(safe, label, references), "engine": "template"}


def engine_name() -> str:
    return "gemini" if os.getenv("GOOGLE_API_KEY") else "template"
