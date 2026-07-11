"""슬롯 추출 평가 스크립트 (NLP 품질 측정).

data/test_cases.csv 의 정답 라벨과 현재 슬롯 추출기의 결과를 비교해
슬롯별 정확도와 전체 정확일치율(exact match)을 출력한다.

실행:
    cd backend
    python3 eval_slots.py

GOOGLE_API_KEY 가 설정돼 있으면 Gemini 엔진으로, 없으면 규칙기반 폴백으로 평가한다.
"""
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from app.services.slot_extractor import extract_slots  # noqa: E402

SLOTS = ["지역", "거래유형", "주거유형", "층조건", "근접시설",
         "가격_최소", "가격_최대", "면적_최소"]
NUMERIC = {"가격_최소", "가격_최대", "면적_최소"}
TEST_CSV = Path(__file__).resolve().parent / "data" / "test_cases.csv"


def _norm(v):
    if v is None:
        return None
    v = str(v).strip()
    return v or None


def _match(slot, gold, pred) -> bool:
    gold, pred = _norm(gold), pred if pred is not None else None
    if slot in NUMERIC:
        g = float(gold) if gold else None
        p = float(pred) if pred not in (None, "") else None
        return g == p
    return _norm(pred) == gold


def main():
    rows = list(csv.DictReader(open(TEST_CSV, encoding="utf-8-sig")))
    if not rows:
        print("test_cases.csv 가 비어 있습니다.")
        return

    engine = extract_slots(rows[0]["utterance"]).get("engine", "?")
    per = {s: 0 for s in SLOTS}
    exact = 0

    for r in rows:
        pred = extract_slots(r["utterance"]).get("slots", {})
        all_ok = True
        for s in SLOTS:
            if s == "지역":
                # 데이터가 지역구/지역동으로 분리됨 → 둘 중 하나라도 정답과 맞으면 인정
                pv = pred.get("지역구") or pred.get("지역동")
                ok = _match(s, r.get("true_지역", ""), pv)
            else:
                ok = _match(s, r.get(f"true_{s}", ""), pred.get(s))
            per[s] += int(ok)
            all_ok = all_ok and ok
        exact += int(all_ok)

    n = len(rows)
    print(f"\n슬롯 추출 평가 — {n}건 · 엔진: {engine}\n" + "-" * 34)
    for s in SLOTS:
        print(f"  {s:<8} {per[s] / n * 100:5.1f}%  ({per[s]}/{n})")
    print("-" * 34)
    print(f"  전체 정확일치  {exact / n * 100:5.1f}%  ({exact}/{n})\n")


if __name__ == "__main__":
    main()
