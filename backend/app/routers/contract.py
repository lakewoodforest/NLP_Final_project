import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
import pandas as pd

from app.core.config import DATA_DIR
from app.services import clause_classifier, clause_explainer, law_retriever
from app.services.pdf_clauses import extract_text_from_pdf, split_clauses

router = APIRouter(prefix="/api/contract", tags=["contract"])


@router.get("/clauses")
def clauses(label: int | None = Query(None, ge=0, le=2), q: str | None = None,
            offset: int = 0, limit: int = 30):
    df = pd.read_csv(DATA_DIR / "clauses.csv")
    if label is not None:
        df = df[df["label"] == label]
    if q:
        df = df[df["clause"].str.contains(q, regex=False)]
    total = int(len(df))
    items = [{"text": r["clause"], "label_id": int(r["label"])}
             for _, r in df.iloc[offset:offset + limit].iterrows()]
    return {"total": total, "items": items}


@router.get("/laws")
def laws():
    return law_retriever.load_articles()


class JudgeBody(BaseModel):
    text: str
    with_evidence: bool = True


@router.post("/judge")
def judge(body: JudgeBody):
    res = clause_classifier.classify(body.text)
    if body.with_evidence and res["label_id"] >= 1:
        ev = law_retriever.retrieve(body.text)
        res["evidence"] = ev
        exp = clause_explainer.explain(body.text, res["label"], ev.get("results", []))
        res["explanation"] = exp["text"]
        res["explanation_engine"] = exp["engine"]
    return res


def _analyze_pdf(path: str) -> dict:
    text = extract_text_from_pdf(path)
    clauses = split_clauses(text)
    out = []
    for c in clauses:
        r = clause_classifier.classify(c["text"])
        item = {"source": c["source"], "text": c["text"], **r}
        if r["label_id"] >= 1:
            ev = law_retriever.retrieve(c["text"])
            item["evidence"] = ev
            exp = clause_explainer.explain(c["text"], r["label"], ev.get("results", []))
            item["explanation"] = exp["text"]
        item.pop("neighbors", None)  # 분석 응답은 근거 조문 중심으로 슬림하게
        out.append(item)
    counts = {l: sum(1 for x in out if x["label_id"] == l) for l in (0, 1, 2)}
    return {"n_clauses": len(out), "counts": counts, "clauses": out,
            "engines": {"classifier": clause_classifier.engine_name(),
                        "retriever": law_retriever.engine_name(),
                        "explainer": clause_explainer.engine_name()}}


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "PDF 파일만 업로드할 수 있습니다.")
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        return _analyze_pdf(tmp_path)
    except ImportError as e:
        raise HTTPException(503, str(e))
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@router.post("/analyze-sample")
def analyze_sample():
    sample = DATA_DIR / "sample_contract.pdf"
    if not sample.exists():
        raise HTTPException(404, "sample_contract.pdf가 없습니다.")
    try:
        return _analyze_pdf(str(sample))
    except ImportError as e:
        raise HTTPException(503, str(e))
