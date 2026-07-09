from fastapi import APIRouter
import pandas as pd

from app.core.config import DATA_DIR
from app.services import clause_classifier, law_retriever
from app.services.listing_search import load_listings
import os

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats")
def stats():
    clauses = pd.read_csv(DATA_DIR / "clauses.csv")
    laws = law_retriever.load_articles()
    return {
        "listings": int(len(load_listings())),
        "slots": 8,
        "clauses": int(len(clauses)),
        "label_counts": {str(k): int(v) for k, v in clauses["label"].value_counts().items()},
        "laws": len(laws),
        "classifier_reported": {"accuracy": 0.980, "macro_f1": 0.980},
        "rag_min_score": 0.45,
        "engines": {
            "slot_extractor": "gemini" if os.getenv("GOOGLE_API_KEY") else "rule-based",
            "clause_classifier": clause_classifier.engine_name(),
            "law_retriever": law_retriever.engine_name(),
        },
    }
