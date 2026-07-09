"""조항 위험도 분류.
backend/model/clause_classifier/ 에 파인튜닝 가중치가 있고 torch+transformers가
설치돼 있으면 원본과 동일한 KLUE-RoBERTa 분류기(engine="klue-roberta")를 쓰고,
아니면 학습 데이터(clauses.csv) 대비 문자 2-gram 최근접 이웃 폴백
(engine="knn-fallback")으로 동작한다. 응답 스키마는 두 엔진이 동일."""
from functools import lru_cache

import pandas as pd

from app.core.config import DATA_DIR, MODEL_DIR, LABELS


def _grams(t: str) -> set:
    s = "".join(t.split())
    return {s[i:i + 2] for i in range(len(s) - 1)}


@lru_cache(maxsize=1)
def _knn_corpus():
    df = pd.read_csv(DATA_DIR / "clauses.csv")
    return [(_grams(r["clause"]), int(r["label"]), r["clause"]) for _, r in df.iterrows()]


@lru_cache(maxsize=1)
def _load_roberta():
    """가중치·라이브러리가 준비된 경우에만 (tokenizer, model) 반환, 아니면 None."""
    if not MODEL_DIR.exists():
        return None
    try:
        import torch  # noqa: F401
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
        tok = AutoTokenizer.from_pretrained(str(MODEL_DIR))
        model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_DIR))
        model.eval()
        return tok, model
    except Exception:
        return None


def _classify_roberta(text: str, bundle) -> dict:
    import torch
    tok, model = bundle
    inputs = tok(text, return_tensors="pt", padding=True, truncation=True, max_length=128)
    with torch.no_grad():
        probs = torch.softmax(model(**inputs).logits, dim=-1).squeeze()
    label_id = int(torch.argmax(probs).item())
    return {"label_id": label_id, "label": LABELS[label_id],
            "confidence": round(float(probs[label_id]), 4),
            "engine": "klue-roberta", "neighbors": []}


def _classify_knn(text: str, k: int = 3) -> dict:
    q = _grams(text)
    scored = []
    for g, label, clause in _knn_corpus():
        inter = len(q & g)
        score = inter / (len(q) + len(g) - inter or 1)  # Jaccard
        scored.append((score, label, clause))
    scored.sort(key=lambda x: -x[0])
    top = scored[:k]
    vote: dict[int, float] = {}
    for s, l, _ in top:
        vote[l] = vote.get(l, 0.0) + s
    label_id = max(vote, key=vote.get)
    conf = round(vote[label_id] / (sum(vote.values()) or 1), 4)
    return {"label_id": label_id, "label": LABELS[label_id], "confidence": conf,
            "engine": "knn-fallback",
            "neighbors": [{"score": round(s, 4), "label_id": l, "label": LABELS[l], "text": c}
                          for s, l, c in top]}


def classify(text: str) -> dict:
    bundle = _load_roberta()
    if bundle is not None:
        return _classify_roberta(text, bundle)
    return _classify_knn(text)


def engine_name() -> str:
    return "klue-roberta" if _load_roberta() is not None else "knn-fallback"
