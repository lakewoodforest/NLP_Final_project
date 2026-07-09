import { useCallback, useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api } from "../api.js";
import { Card, Chip, Head, fmt, tipStyle } from "../components/ui.jsx";

const EMPTY = {
  지역: "", 거래유형: "", 주거유형: "", 층조건: "", 근접시설: "",
  가격_최소: "", 가격_최대: "", 보증금_최대: "", 면적_최소: "", 기타: "",
};
const EXAMPLES = [
  "마포구 원룸 월세 60만원 이하 역세권으로 찾아줘",
  "송파구 투룸 전세 있나요",
  "관악구 대학가 인근 원룸 10평 이상",
  "노원구 버스정류장 인접 오피스텔 월세 40만원 이하",
];
const HOME_EMOJI = { 원룸: "🛏️", 투룸: "🛋️", 오피스텔: "🏢" };

export default function Search() {
  const [meta, setMeta] = useState(null);
  const [f, setF] = useState(EMPTY);
  const [utter, setUtter] = useState("");
  const [extracted, setExtracted] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");

  const [metaErr, setMetaErr] = useState("");
  useEffect(() => {
    api.get("/listings/meta").then(setMeta).catch((e) => setMetaErr(String(e.message)));
  }, []);

  const runSearch = useCallback((filters) => {
    const body = {};
    for (const k of ["지역", "거래유형", "주거유형", "층조건", "근접시설"]) if (filters[k]) body[k] = filters[k];
    for (const k of ["가격_최소", "가격_최대", "보증금_최대", "면적_최소"]) if (filters[k] !== "") body[k] = Number(filters[k]);
    if (filters.기타 && filters.기타.trim()) body.기타 = filters.기타.trim();
    api.post("/listings/search", body).then((r) => { setRes(r); setErr(""); })
      .catch((e) => setErr(String(e.message)));
  }, []);
  useEffect(() => { runSearch(f); }, [f, runSearch]);

  const extract = async (text) => {
    const t = (text ?? utter).trim();
    if (!t) return;
    if (text != null) setUtter(text);
    try {
      const r = await api.post("/slots/extract", { utterance: t });
      setExtracted(r);
      const s = r.slots || {};
      setF({
        ...EMPTY,
        지역: s.지역 || "", 거래유형: s.거래유형 || "", 주거유형: s.주거유형 || "",
        층조건: s.층조건 || "", 근접시설: s.근접시설 || "",
        가격_최소: s.가격_최소 ?? "", 가격_최대: s.가격_최대 ?? "", 면적_최소: s.면적_최소 ?? "",
        기타: s.기타 || "",
      });
    } catch (e) { setErr(String(e.message)); }
  };

  if (!meta) {
    if (metaErr) return (
      <p className="note">
        매물 정보를 불러오지 못했습니다: {metaErr}<br />
        백엔드 서버(포트 8000)가 실행 중인지 확인해 주세요.
      </p>
    );
    return <p className="spin">불러오는 중…</p>;
  }

  const PillGroup = ({ k }) => (
    <div style={{ marginBottom: 14 }}>
      <label className="f">{k}</label>
      <div className="pillgroup">
        <button className={`pill ${f[k] === "" ? "on" : ""}`} onClick={() => setF({ ...f, [k]: "" })}>전체</button>
        {meta.categorical[k].map((v) => (
          <button key={v} className={`pill ${f[k] === v ? "on" : ""}`}
            onClick={() => setF({ ...f, [k]: f[k] === v ? "" : v })}>{v}</button>
        ))}
      </div>
    </div>
  );
  const Num = ({ k, label }) => (
    <div>
      <label className="f">{label}</label>
      <input type="number" placeholder="—" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </div>
  );

  return (
    <section>
      <Head
        eyebrow="매물 검색"
        title="어떤 방을 찾고 있나요?"
        lead="원하는 조건을 문장으로 말하면 지역·유형·가격·면적은 물론 자유로운 조건까지 이해해 바로 매물을 찾아드립니다."
      />

      <div className="searchbar mb">
        <input
          type="text" value={utter}
          onChange={(e) => setUtter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && extract()}
          placeholder="예: 마포구 원룸 월세 60만원 이하 역세권으로 찾아줘"
        />
        <button className="btn" onClick={() => extract()}>검색</button>
      </div>
      <div className="wrap mb">
        {EXAMPLES.map((e) => (
          <button key={e} className="btn ghost sm" onClick={() => extract(e)}>{e}</button>
        ))}
      </div>
      {extracted && (
        <Card className="mb" style={{ padding: "12px 16px" }}>
          <span style={{ fontSize: 13.5 }}>
            {Object.keys(extracted.slots).length
              ? <>이해한 조건 {Object.entries(extracted.slots).map(([k, v]) => <Chip key={k} label={k} value={String(v)} />)}</>
              : <span className="muted">이해한 조건이 없습니다 — 지역·유형·가격 등을 포함해 보세요.</span>}
          </span>
        </Card>
      )}

      <div className="search-wrap">
        <Card>
          <h3>필터</h3>
          {["지역", "거래유형", "주거유형", "층조건", "근접시설"].map((k) => <PillGroup key={k} k={k} />)}
          <div className="two" style={{ marginBottom: 8 }}>
            <Num k="가격_최소" label="월세 최소(만원)" /><Num k="가격_최대" label="월세 최대(만원)" />
            <Num k="보증금_최대" label="보증금 최대(만원)" /><Num k="면적_최소" label="면적 최소(평)" />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label className="f">기타 자유조건 (설명 기반 검색)</label>
            <input
              type="text"
              placeholder="예: 반려동물 가능, 조용한 동네, 즉시 입주"
              value={f.기타}
              onChange={(e) => setF({ ...f, 기타: e.target.value })}
            />
          </div>
          <button className="btn ghost" style={{ width: "100%" }}
            onClick={() => { setF(EMPTY); setExtracted(null); setUtter(""); }}>
            필터 초기화
          </button>
        </Card>

        <div>
          {err && <p className="note mb">API 오류: {err} — 백엔드(8000)가 켜져 있는지 확인하세요.</p>}
          {res && (
            <>
              <p style={{ marginBottom: 10 }}>
                <span className="result-cnt">{fmt(res.total)}</span>{" "}
                <span className="muted">건이 조건에 맞아요 · 상위 {res.items.length}건 표시</span>
              </p>
              <Card className="mb">
                <p className="muted" style={{ marginBottom: 4 }}>검색 결과의 지역 분포</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={res.region_counts} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tipStyle} />
                    <Bar dataKey="count" name="매물 수" fill="#2b6ff3" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              {res.items.length === 0 ? (
                <div className="empty">조건에 맞는 매물이 없어요. 조건을 조금 완화해 보세요.</div>
              ) : (
                <div className="listings-grid">
                  {res.items.map((x, i) => (
                    <div key={i} className="listing">
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
                        {f.기타 && x.설명 && (
                          <p className="muted" style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5 }}>{x.설명}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {res.total > res.items.length && (
                <p className="muted" style={{ textAlign: "center", marginTop: 12 }}>
                  외 {fmt(res.total - res.items.length)}건 — 조건을 좁혀 보세요
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
