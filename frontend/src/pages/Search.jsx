import { useState, useEffect } from "react";
import { api } from "../api.js";
import { Card, Chip, Head, Star, fmt } from "../components/ui.jsx";

const EXAMPLES = [
  "마포구 원룸 월세 60만원 이하 역세권으로 찾아줘",
  "관악구에 보증금 1000만원 이하 방 구해줘",
  "송파구 투룸 전세 있나요",
  "강남구 오피스텔 반려동물 키울 수 있는 곳",
];
const HOME_EMOJI = { 원룸: "🛏️", 투룸: "🛋️", 오피스텔: "🏢" };

const SLOT_LABEL = {
  지역: "지역", 거래유형: "거래유형", 주거유형: "주거유형", 층조건: "층조건",
  근접시설: "근접시설", 가격_최소: "월세 최소", 가격_최대: "월세 최대",
  보증금_최대: "보증금 최대", 면적_최소: "면적 최소", 기타: "기타",
};

function buildBody(slots) {
  const body = {};
  for (const k of ["지역", "거래유형", "주거유형", "층조건", "근접시설", "기타"])
    if (slots[k]) body[k] = slots[k];
  for (const k of ["가격_최소", "가격_최대", "보증금_최대", "면적_최소"])
    if (slots[k] != null && slots[k] !== "") body[k] = Number(slots[k]);
  return body;
}

export default function Search({ initialQuery = "", isFav = () => false, toggleFav = () => {} }) {
  const [utter, setUtter] = useState("");
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState(null);
  const [slots, setSlots] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState("");

  const doSearch = async (slotsObj, sortVal) => {
    const body = buildBody(slotsObj);
    if (sortVal) body.sort = sortVal;
    const r = await api.post("/listings/search", body);
    setRes(r);
  };

  const run = async (text) => {
    const t = (text ?? utter).trim();
    if (!t) return;
    setUtter(t);
    setLoading(true); setErr(""); setRes(null); setSlots(null); setIntent(null);
    try {
      const ex = await api.post("/slots/extract", { utterance: t });
      setIntent(ex.intent);
      setSlots(ex.slots || {});
      if (ex.intent !== "잡담") await doSearch(ex.slots || {}, sort);
    } catch (e) {
      setErr(String(e.message));
    }
    setLoading(false);
  };

  const changeSort = async (e) => {
    const v = e.target.value;
    setSort(v);
    if (slots && intent !== "잡담") {
      try { await doSearch(slots, v); } catch (er) { setErr(String(er.message)); }
    }
  };

  useEffect(() => {
    if (initialQuery) run(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const slotEntries = slots ? Object.entries(slots).filter(([, v]) => v !== null && v !== "") : [];

  return (
    <section className="tool-page search-page">
      <Head
        eyebrow="매물 검색"
        title="어떤 방을 찾고 계세요?"
        lead="원하는 조건을 문장으로 입력하면 AI가 이해해서 조건에 맞는 매물을 찾아드려요."
      />

      <div className="searchbar mb">
        <input
          type="text" value={utter} autoFocus
          onChange={(e) => setUtter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="예: 관악구에 보증금 1000만원 이하로 방 구해줘"
        />
        <button className="btn" onClick={() => run()} disabled={loading}>
          {loading ? "찾는 중…" : "검색"}
        </button>
      </div>
      <div className="wrap mb">
        {EXAMPLES.map((e) => (
          <button key={e} className="btn ghost sm" onClick={() => run(e)} disabled={loading}>{e}</button>
        ))}
      </div>

      {err && <p className="note mb">검색 중 문제가 발생했어요: {err}</p>}

      {loading && <p className="spin">AI가 조건을 이해하는 중…</p>}

      {/* 의도가 잡담인 경우 */}
      {!loading && intent === "잡담" && (
        <Card className="empty" style={{ textAlign: "left" }}>
          부동산 매물 검색을 도와드릴게요. 지역·가격·유형 같은 조건을 문장으로 말씀해 주세요.<br />
          <span className="muted">예: "관악구 원룸 월세 50만원 이하로 찾아줘"</span>
        </Card>
      )}

      {/* 이해한 조건 */}
      {!loading && intent === "매물검색" && slots && (
        <Card className="mb search-insight" style={{ padding: "12px 16px" }}>
          <span style={{ fontSize: 13.5 }}>
            {slotEntries.length
              ? <>이해한 조건 {slotEntries.map(([k, v]) => (
                  <Chip key={k} label={SLOT_LABEL[k] || k} value={String(v)} />
                ))}</>
              : <span className="muted">특정 조건 없이 전체 매물을 보여드릴게요.</span>}
          </span>
        </Card>
      )}

      {/* 결과 */}
      {!loading && res && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
            <p style={{ margin: 0 }}>
              <span className="result-cnt">{fmt(res.total)}</span>{" "}
              <span className="muted">건이 조건에 맞아요 · 상위 {res.items.length}건 표시</span>
            </p>
            {res.items.length > 1 && (
              <select value={sort} onChange={changeSort}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "#fff", fontSize: 13 }}>
                <option value="">추천순</option>
                <option value="deposit">보증금 낮은순</option>
                <option value="rent">월세 낮은순</option>
                <option value="area">면적 넓은순</option>
              </select>
            )}
          </div>
          {res.items.length === 0 ? (
            <div className="empty">조건에 맞는 매물이 없어요. 조건을 조금 완화해 보세요.</div>
          ) : (
            <div className="listings-grid">
              {res.items.map((x, i) => (
                <div key={i} className="listing" style={{ position: "relative" }}>
                  <button className="fav-star" aria-label="찜하기"
                    onClick={() => toggleFav({
                      id: `${x.지역}-${x.주거유형}-${x.보증금}-${x.월세}-${x.평수}`,
                      title: `${x.지역} ${x.주거유형}`,
                      sub: x.거래유형 === "전세" ? `전세 ${fmt(x.보증금)}만원` : `월세 ${x.월세}만 · 보증금 ${fmt(x.보증금)}만원`,
                      chips: [x.층조건, x.근접시설].filter(Boolean),
                      emoji: HOME_EMOJI[x.주거유형] || "🏠",
                    })}>
                    <Star on={isFav(`${x.지역}-${x.주거유형}-${x.보증금}-${x.월세}-${x.평수}`)} size={18} />
                  </button>
                  <div className="thumb">{HOME_EMOJI[x.주거유형] || "🏠"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="price">
                      {x.거래유형 === "전세" ? `전세 ${fmt(x.보증금)}` : `월세 ${x.월세}`}
                      {x.거래유형 === "월세" && <small>보증금 {fmt(x.보증금)}</small>}
                    </p>
                    <p className="where">{x.지역} {x.주거유형} · {x.평수}평</p>
                    <div className="wrap">
                      <span className="badge">{x.층조건}</span>
                      {x.근접시설 && <span className="badge">{x.근접시설}</span>}
                    </div>
                    {slots?.기타 && x.설명 && (
                      <p className="muted" style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5 }}>{x.설명}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {res.total > res.items.length && (
            <p className="muted" style={{ textAlign: "center", marginTop: 12 }}>
              외 {fmt(res.total - res.items.length)}건 — 조건을 더 구체적으로 말해보세요
            </p>
          )}
        </>
      )}
    </section>
  );
}
