"""계약서 PDF 전처리 — 원본 NLP_final_real_estate/pdf_utils.py 포팅.
표준 조항('제n조')과 특약사항(번호 매김 항목)을 분리해 섹션 태깅한다."""
import re

try:
    import fitz  # pymupdf
except ImportError:  # pragma: no cover
    fitz = None

STANDARD_CLAUSE_SPLIT = re.compile(r"\n\s*(?=제\s*\d+\s*조)")
SPECIAL_SECTION_HEADER = re.compile(r"특\s*약\s*사\s*항")
NUMBERED_ITEM_SPLIT = re.compile(r"\n\s*(?=(?:\d{1,2}\s*[.\)]|[가-힣]\s*[.\)])\s*\S)")
SIGNATURE_BLOCK_START = re.compile(r"\n\s*(?:임대인|임차인|계약자)\s*(?:\(인\)|서명|:)")
MIN_CLAUSE_LEN = 10
_STARTS_WITH_JOHANG = re.compile(r"^제\s*\d+\s*조")


def extract_text_from_pdf(pdf_path: str) -> str:
    if fitz is None:
        raise ImportError("pymupdf가 설치되어 있지 않습니다. `pip install pymupdf`")
    parts = []
    with fitz.open(pdf_path) as doc:
        for page in doc:
            parts.append(page.get_text())
    return "\n".join(parts)


def split_standard_clauses(text: str) -> list[str]:
    special = SPECIAL_SECTION_HEADER.search(text)
    body = text[: special.start()] if special else text
    parts = STANDARD_CLAUSE_SPLIT.split(body)
    return [p.strip() for p in parts
            if len(p.strip()) > MIN_CLAUSE_LEN and _STARTS_WITH_JOHANG.match(p.strip())]


def split_special_clauses(text: str) -> list[str]:
    match = SPECIAL_SECTION_HEADER.search(text)
    if not match:
        return []
    section = text[match.end():]
    if sig := SIGNATURE_BLOCK_START.search(section):
        section = section[: sig.start()]
    items = NUMBERED_ITEM_SPLIT.split(section)
    return [i.strip() for i in items if len(i.strip()) > MIN_CLAUSE_LEN]


def split_clauses(text: str) -> list[dict]:
    results = [{"text": c, "source": "표준조항"} for c in split_standard_clauses(text)]
    results += [{"text": c, "source": "특약사항"} for c in split_special_clauses(text)]
    if not results:  # 자유 양식 fallback
        results = [{"text": line.strip(), "source": "미분류"}
                   for line in re.split(r"\n{1,}", text)
                   if len(line.strip()) > MIN_CLAUSE_LEN]
    return results
