"""국토교통부 오피스텔 전월세 실거래가 → 우리 스키마(synthetic_listings.csv) 변환기.

공공데이터포털 오픈API(국토교통부_오피스텔 전월세 실거래가, data.go.kr/data/15126475)를
직접 호출해서 '진짜' 보증금·월세·전용면적을 받아 우리 앱이 읽는 12컬럼 스키마로 변환한다.
→ 보증금이 월세의 20배로 고정되는 인위적 패턴 없이, 실제 체결 금액이 들어간다.

■ 준비
  1) data.go.kr 에서 "국토교통부_오피스텔 전월세 실거래가 자료" 활용신청 → 일반 인증키(Decoding) 발급
  2) 발급받은 키를 환경변수로 지정:  export MOLIT_API_KEY="발급받은_디코딩_키"
  3) requests 설치:  pip3 install requests

■ 실행 (backend 폴더에서)
     python3 fetch_molit_data.py                 # 최근 12개월, 6개 구
     python3 fetch_molit_data.py --months 24     # 최근 24개월
     python3 fetch_molit_data.py --out data/real_listings.csv   # 다른 파일로

  기본 출력: data/synthetic_listings.csv  (기존 파일을 덮어씀 → 코드 수정 불필요)

■ 스키마 매핑
  지역구   ← 조회한 구 (LAWD_CD)
  지역동   ← umdNm(법정동)                    [실제 값]
  거래유형 ← 월세금액 0이면 전세, 아니면 월세   [실제 값]
  보증금   ← deposit (만원)                    [실제 값]
  월세     ← monthlyRent (만원)               [실제 값]
  평수     ← 전용면적(㎡) ÷ 3.3058             [실제 값 환산]
  층조건   ← floor → 반지하/1층/저층/중층/고층  [실제 층에서 파생]
  주거유형 ← 전용면적으로 원룸/투룸/오피스텔 파생 (실거래가엔 없는 정보)
  근접시설·설명·반려동물가능·주차가능 ← 실거래가에 없어 자동 생성(데모용 부가필드)
"""
import argparse
import csv
import os
import random
import sys
import time
from datetime import date
from xml.etree import ElementTree as ET

try:
    import requests
except ImportError:
    sys.exit("requests 가 필요합니다:  pip3 install requests")

API_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent"

# 서울 6개 구 ↔ 법정동코드 앞5자리(시군구)
GU_CODES = {
    "강남구": "11680", "성동구": "11200", "마포구": "11440",
    "관악구": "11620", "노원구": "11350", "송파구": "11710",
    "성북구": "11290", "서대문구": "11410", "동작구": "11590", "광진구": "11215",
}

# 실거래가에 없는 부가필드 — 데모용 자동 생성
FACILITIES = ["역세권", "대학가 인근", "학교 근처", "마트 도보 5분", "버스정류장 인접"]
FIELDNAMES = ["지역구", "지역동", "거래유형", "주거유형", "층조건", "근접시설",
              "보증금", "월세", "평수", "설명", "반려동물가능", "주차가능"]

random.seed(42)  # 부가필드 재현성


# ── 파싱/매핑 (네트워크 없이 단위테스트 가능) ─────────────────────────
def _text(item: ET.Element, tag: str) -> str:
    el = item.find(tag)
    return (el.text or "").strip() if el is not None and el.text else ""


def _int(s: str) -> int | None:
    s = (s or "").replace(",", "").strip()
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return None


def _floor_band(floor: int | None) -> str:
    if floor is None:
        return "중층"
    if floor <= 0:
        return "반지하"
    if floor == 1:
        return "1층"
    if floor <= 3:
        return "저층"
    if floor <= 7:
        return "중층"
    return "고층"


def _house_type(pyeong: float) -> str:
    # 오피스텔 실거래가엔 원룸/투룸 구분이 없어 전용면적으로 파생
    if pyeong < 8:
        return "원룸"
    if pyeong < 13:
        return "투룸"
    return "오피스텔"


def _describe(gu, dong, htype, facility, pet, park, deal) -> str:
    parts = [f"{facility} 위치입니다."]
    if pet:
        parts.append("반려동물과 함께 지내실 수 있습니다")
    else:
        parts.append("반려동물 사육은 어려운 점 참고 부탁드립니다")
    parts.append("전용 주차가 가능합니다" if park else "별도 주차 공간은 없습니다")
    parts.append(f"{gu} {dong}의 {htype} {deal} 매물입니다")
    return " ".join(parts)


def map_item(item: ET.Element, gu: str) -> dict | None:
    """API item(XML) → 스키마 dict. 필수값 없으면 None."""
    deposit = _int(_text(item, "deposit"))
    rent = _int(_text(item, "monthlyRent"))
    area = None
    try:
        area = float(_text(item, "excluUseAr"))
    except ValueError:
        pass
    dong = _text(item, "umdNm")
    if deposit is None or area is None or not dong:
        return None

    rent = rent or 0
    deal = "전세" if rent == 0 else "월세"
    pyeong = round(area / 3.3058, 1)
    htype = _house_type(pyeong)
    floor = _int(_text(item, "floor"))
    facility = random.choice(FACILITIES)
    pet = random.random() < 0.5
    park = random.random() < 0.4

    return {
        "지역구": gu,
        "지역동": dong,
        "거래유형": deal,
        "주거유형": htype,
        "층조건": _floor_band(floor),
        "근접시설": facility,
        "보증금": deposit,
        "월세": rent,
        "평수": pyeong,
        "설명": _describe(gu, dong, htype, facility, pet, park, deal),
        "반려동물가능": pet,
        "주차가능": park,
    }


# ── API 호출 ─────────────────────────────────────────────
def recent_months(n: int) -> list[str]:
    y, m = date.today().year, date.today().month
    out = []
    for _ in range(n):
        out.append(f"{y}{m:02d}")
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return out


def fetch(key: str, lawd: str, ymd: str) -> list[ET.Element]:
    items, page = [], 1
    while True:
        params = {"serviceKey": key, "LAWD_CD": lawd, "DEAL_YMD": ymd,
                  "numOfRows": 1000, "pageNo": page}
        r = requests.get(API_URL, params=params, timeout=20)
        r.raise_for_status()
        root = ET.fromstring(r.content)
        code = root.findtext(".//resultCode") or root.findtext(".//returnReasonCode") or ""
        if code and code not in ("00", "000"):
            msg = root.findtext(".//resultMsg") or root.findtext(".//returnAuthMsg") or "?"
            raise RuntimeError(f"API 오류 {code}: {msg} (인증키/트래픽 확인)")
        page_items = root.findall(".//item")
        items.extend(page_items)
        total = _int(root.findtext(".//totalCount") or "0") or 0
        if page * 1000 >= total or not page_items:
            break
        page += 1
        time.sleep(0.2)
    return items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--months", type=int, default=12, help="최근 N개월 (기본 12)")
    ap.add_argument("--out", default="data/synthetic_listings.csv", help="출력 CSV 경로")
    ap.add_argument("--key", default=os.getenv("MOLIT_API_KEY"), help="인증키(Decoding). 미지정 시 MOLIT_API_KEY 환경변수")
    args = ap.parse_args()

    if not args.key:
        sys.exit("인증키가 없습니다.  export MOLIT_API_KEY=\"...\"  또는  --key 사용")

    months = recent_months(args.months)
    rows, seen = [], set()
    print(f"[수집] {len(GU_CODES)}개 구 × {len(months)}개월 = {len(GU_CODES)*len(months)}회 호출")
    for gu, lawd in GU_CODES.items():
        got = 0
        for ymd in months:
            try:
                for it in fetch(args.key, lawd, ymd):
                    row = map_item(it, gu)
                    if not row:
                        continue
                    dedup = (row["지역구"], row["지역동"], row["보증금"], row["월세"],
                             row["평수"], row["층조건"], row["거래유형"])
                    if dedup in seen:
                        continue
                    seen.add(dedup)
                    rows.append(row)
                    got += 1
            except Exception as e:
                print(f"  ! {gu} {ymd} 실패: {e}")
            time.sleep(0.1)
        print(f"  {gu}: {got}건")

    if not rows:
        sys.exit("수집된 데이터가 없습니다. 인증키/기간을 확인하세요.")

    with open(args.out, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES)
        w.writeheader()
        w.writerows(rows)
    print(f"\n[완료] {len(rows):,}건 → {args.out}")
    print("백엔드 재시작 후 검색하면 실제 시세가 반영됩니다.")


if __name__ == "__main__":
    main()
