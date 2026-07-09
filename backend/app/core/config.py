"""전역 설정: 데이터 경로 · 라벨 · 슬롯 정의."""
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"
MODEL_DIR = BACKEND_DIR / "model" / "clause_classifier"  # (선택) 파인튜닝 가중치 위치

LABELS = {0: "정상", 1: "주의", 2: "위험"}

CATEGORICAL_SLOTS = {
    "지역": ["강남구", "성동구", "마포구", "관악구", "노원구", "송파구"],
    "거래유형": ["전세", "월세"],
    "주거유형": ["원룸", "투룸", "오피스텔"],
    "층조건": ["반지하", "1층", "저층", "중층", "고층"],
    "근접시설": ["역세권", "대학가 인근", "학교 근처", "마트 도보 5분", "버스정류장 인접"],
}
SLOT_NAMES = ["지역", "거래유형", "주거유형", "층조건", "근접시설", "가격_최소", "가격_최대", "면적_최소"]
