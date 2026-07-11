import { useState, useEffect, useRef } from "react";
import { api } from "../api.js";
import { Card, Chip, Head, Star, fmt } from "../components/ui.jsx";

const EXAMPLES = [
  "성북구 원룸 월세 60만원 이하 역세권으로 찾아줘",
  "관악구에 보증금 1000만원 이하 방 구해줘",
  "송파구 투룸 전세 있나요",
  "성북구 오피스텔 반려동물 키울 수 있는 곳",
];

const PAGE = 12; // 한 번에 더 불러오는 매물 수

const SLOT_LABEL = {
  지역구: "지역", 지역동: "동", 거래유형: "거래유형", 주거유형: "주거유형", 층조건: "층조건",
  근접시설: "근접시설", 가격_최소: "월세 최소", 가격_최대: "월세 최대",
  보증금_최대: "보증금 최대", 면적_최소: "면적 최소", 기타: "기타",
};

const SORTS = [
  { value: "", label: "추천순" },
  { value: "deposit_asc", label: "보증금 낮은순" },
  { value: "deposit_desc", label: "보증금 높은순" },
  { value: "rent_asc", label: "월세 낮은순" },
  { value: "rent_desc", label: "월세 높은순" },
  { value: "area_desc", label: "면적 넓은순" },
  { value: "area_asc", label: "면적 좁은순" },
];

function buildBody(slots) {
  const body = {};
  for (const k of ["지역구", "지역동", "거래유형", "주거유형", "층조건", "근접시설", "기타"])
    if (slots[k]) body[k] = slots[k];
  for (const k of ["가격_최소", "가격_최대", "보증금_최대", "면적_최소"])
    if (slots[k] != null && slots[k] !== "") body[k] = Number(slots[k]);
  return body;
}

// ── 매물 유형별 일러스트(유리패널 안에 표시) ──────────────────────
function HomeArt({ type }) {
  if (type === "오피스텔") {
    return (
      <svg viewBox="0 0 64 64" className="home-art" aria-hidden="true">
        <rect x="19" y="10" width="26" height="42" rx="3.5" fill="#fff" stroke="#2b6ff3" strokeWidth="2.4" />
        {[15, 24, 33, 42].map((y) =>
          [24, 32].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="6" height="5" rx="1" fill="#9cc0ff" />)
        )}
        <rect x="28" y="46" width="8" height="6" rx="1" fill="#c9defb" />
      </svg>
    );
  }
  if (type === "투룸") {
    return (
      <svg viewBox="0 0 64 64" className="home-art" aria-hidden="true">
        <path d="M10 28 L32 13 L54 28" fill="none" stroke="#2b6ff3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="15" y="27" width="34" height="24" rx="3" fill="#fff" stroke="#2b6ff3" strokeWidth="2.4" />
        <rect x="20" y="32" width="8" height="8" rx="1.5" fill="#9cc0ff" />
        <rect x="36" y="32" width="8" height="8" rx="1.5" fill="#9cc0ff" />
        <rect x="28" y="42" width="8" height="9" rx="1.2" fill="#c9defb" />
      </svg>
    );
  }
  return ( // 원룸(기본)
    <svg viewBox="0 0 64 64" className="home-art" aria-hidden="true">
      <path d="M14 28 L32 14 L50 28" fill="none" stroke="#2b6ff3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="19" y="27" width="26" height="24" rx="3" fill="#fff" stroke="#2b6ff3" strokeWidth="2.4" />
      <rect x="24" y="32" width="9" height="9" rx="1.5" fill="#9cc0ff" />
      <rect x="35" y="39" width="7" height="12" rx="1.2" fill="#c9defb" />
    </svg>
  );
}

// ── 유리 드롭다운 ────────────────────────────────────────────
function GlassSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const cur = options.find((o) => o.value === value) || options[0];
  return (
    <div className={"gsel" + (open ? " open" : "")} ref={ref}>
      <button type="button" className="gsel-btn" onClick={() => setOpen((o) => !o)}>
        <span>{cur.label}</span>
        <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="gsel-menu" role="listbox">
          {options.map((o) => (
            <button key={o.value} type="button" role="option" aria-selected={o.value === value}
              className={"gsel-opt" + (o.value === value ? " on" : "")}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.label}
              {o.value === value && <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M5 10l3.5 3.5L15 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Search({ initialQuery = "", isFav = () => false, toggleFav = () => {} }) {
  const [utter, setUtter] = useState("");
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [intent, setIntent] = useState(null);
  const [slots, setSlots] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const doSearch = async (slotsObj, sortVal, lim) => {
    const body = buildBody(slotsObj);
    if (sortVal) body.sort = sortVal;
    body.top_n = lim;
    const r = await api.post("/listings/search", body);
    setRes(r);
  };

  const run = async (text) => {
    const t = (text ?? utter).trim();
    if (!t) return;
    setUtter(t);
    setLoading(true); setErr(""); setRes(null); setSlots(null); setIntent(null);
    setLimit(PAGE);
    try {
      const ex = await api.post("/slots/extract", { utterance: t });
      setIntent(ex.intent);
      setSlots(ex.slots || {});
      if (ex.intent !== "잡담") await doSearch(ex.slots || {}, sort, PAGE);
    } catch (e) {
      setErr(String(e.message));
    }
    setLoading(false);
  };

  const changeSort = async (v) => {
    setSort(v);
    if (slots && intent !== "잡담") {
      try { await doSearch(slots, v, limit); } catch (er) { setErr(String(er.message)); }
    }
  };

  const loadMore = async () => {
    if (!slots) return;
    const next = limit + PAGE;
    setLimit(next);
    setMoreLoading(true);
    try { await doSearch(slots, sort, next); } catch (er) { setErr(String(er.message)); }
    setMoreLoading(false);
  };

  useEffect(() => {
    if (initialQuery) run(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const slotEntries = slots ? Object.entries(slots).filter(([, v]) => v !== null && v !== "") : [];
  const hasMore = res && res.total > res.items.length;

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
          <div className="result-head">
            <p style={{ margin: 0 }}>
              <span className="result-cnt">{fmt(res.total)}</span>{" "}
              <span className="muted">건이 조건에 맞아요 · {res.items.length}건 표시 중</span>
            </p>
            {res.items.length > 1 && (
              <GlassSelect value={sort} onChange={changeSort} options={SORTS} />
            )}
          </div>
          {res.items.length === 0 ? (
            <div className="empty">조건에 맞는 매물이 없어요. 조건을 조금 완화해 보세요.</div>
          ) : (
            <div className="listings-grid">
              {res.items.map((x, i) => {
                const favId = `${x.지역구}-${x.지역동}-${x.주거유형}-${x.보증금}-${x.월세}-${x.평수}`;
                return (
                  <div key={i} className="listing" style={{ position: "relative" }}>
                    <button className="fav-star" aria-label="찜하기"
                      onClick={() => toggleFav({
                        id: favId,
                        title: `${[x.지역구, x.지역동].filter(Boolean).join(" ")} ${x.주거유형}`,
                        sub: x.거래유형 === "전세" ? `전세 ${fmt(x.보증금)}만원` : `월세 ${x.월세}만 · 보증금 ${fmt(x.보증금)}만원`,
                        chips: [x.층조건, x.근접시설].filter(Boolean),
                        emoji: "🏠",
                      })}>
                      <Star on={isFav(favId)} size={18} />
                    </button>
                    <div className="thumb"><HomeArt type={x.주거유형} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="price">
                        {x.거래유형 === "전세" ? `전세 ${fmt(x.보증금)}` : `월세 ${x.월세}`}
                        {x.거래유형 === "월세" && <small>보증금 {fmt(x.보증금)}</small>}
                      </p>
                      <p className="where">{[x.지역구, x.지역동].filter(Boolean).join(" ")} {x.주거유형} · {x.평수}평</p>
                      <div className="wrap">
                        <span className="badge">{x.층조건}</span>
                        {x.근접시설 && <span className="badge">{x.근접시설}</span>}
                      </div>
                      {slots?.기타 && x.설명 && (
                        <p className="muted" style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5 }}>{x.설명}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 더 보기 (유리패널 · 방향 표시) */}
          {hasMore && (
            <button className="load-more" onClick={loadMore} disabled={moreLoading}>
              <span>{moreLoading ? "불러오는 중…" : `매물 더 보기`}</span>
              {!moreLoading && (
                <>
                  <span className="lm-count">남은 {fmt(res.total - res.items.length)}건</span>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </>
              )}
            </button>
          )}
        </>
      )}
    </section>
  );
}
