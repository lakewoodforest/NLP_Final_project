from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import CATEGORICAL_SLOTS
from app.services.listing_search import search_response

router = APIRouter(prefix="/api/listings", tags=["listings"])


class SearchBody(BaseModel):
    지역구: str | None = None
    지역동: str | None = None
    거래유형: str | None = None
    주거유형: str | None = None
    층조건: str | None = None
    근접시설: str | None = None
    가격_최소: float | None = None
    가격_최대: float | None = None
    면적_최소: float | None = None
    보증금_최대: float | None = None
    기타: str | None = None
    top_n: int = 12
    sort: str | None = None


@router.get("/meta")
def meta():
    return {"categorical": CATEGORICAL_SLOTS}


@router.post("/search")
def search(body: SearchBody):
    slots = body.model_dump(exclude={"top_n", "sort"}, exclude_none=True)
    slots = {k: (v if v != "" else None) for k, v in slots.items()}
    return search_response(slots, top_n=body.top_n, sort=body.sort)
