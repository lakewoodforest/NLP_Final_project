from fastapi import APIRouter
from pydantic import BaseModel

from app.services.slot_extractor import extract_slots

router = APIRouter(prefix="/api/slots", tags=["slots"])


class UtteranceBody(BaseModel):
    utterance: str


@router.post("/extract")
def extract(body: UtteranceBody):
    return extract_slots(body.utterance)
