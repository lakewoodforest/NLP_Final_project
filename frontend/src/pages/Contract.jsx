import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { Card, Head, Stamp } from "../components/ui.jsx";

export default function Contract() {
  const [laws, setLaws] = useState([]);
  useEffect(() => { api.get("/contract/laws").then(setLaws); }, []);

  /* ── 계약서 PDF 분석 ── */
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [aErr, setAErr] = useState("");
  const fileRef = useRef(null);
  const analyzeSample = async () => {
    setBusy(true); setAErr("");
    try { setAnalysis(await api.post("/contract/analyze-sample", {})); }
    catch (e) { setAErr(String(e.message)); }
    setBusy(false);
  };
  const analyzeFile = async (file) => {
    if (!file) return;
    setBusy(true); setAErr("");
    try { setAnalysis(await api.upload("/contract/analyze", file)); }
    catch (e) { setAErr(String(e.message)); }
    setBusy(false);
  };

  /* ── 단건 간이 판정 ── */
  const [demo, setDemo] = useState("");
  const [judged, setJudged] = useState(null);
  const judge = async (text) => {
    const t = (text ?? demo).trim();
    if (!t) return;
    if (text != null) setDemo(text);
    setJudged(await api.post("/contract/judge", { text: t, with_evidence: true }));
  };

  const byLaw = laws.reduce((m, a) => ((m[a.law] = m[a.law] || []).push(a), m), {});

  const ClauseResult = ({ c }) => (
    <div className="clause" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <Stamp l={c.label_id} />
        <p style={{ flex: 1 }}>
          <span className="badge" style={{ marginRight: 6 }}>{c.source}</span>
          {c.text}
        </p>
      </div>
      {c.evidence?.results?.length > 0 && (
        <div style={{ marginLeft: 4 }}>
          {c.evidence.results.map((e) => (
            <div key={e.id} className={`evi ${c.label_id === 1 ? "warn-side" : ""}`}>
              <b>{e.title}</b>
              {e.text}
            </div>
          ))}
        </div>
      )}
      {c.explanation && (
        <div style={{ marginLeft: 4, marginTop: 8, padding: "10px 13px", background: "var(--bg)", borderLeft: "3px solid var(--blue)", borderRadius: 8, fontSize: 13.5, lineHeight: 1.65 }}>
          <b style={{ color: "var(--blue)" }}>💬 AI 설명</b>
          <p style={{ marginTop: 4 }}>{c.explanation}</p>
        </div>
      )}
    </div>
  );

  return (
    <section className="tool-page contract-page">
      <Head
        title="계약서 특약 검토"
        lead="계약서 PDF를 올리면 조항을 정상·주의·위험으로 나누고, 주의·위험 조항에는 관련 법 조문 근거와 쉬운 설명을 붙여드립니다."
      />

      <Card className="mb contract-panel upload-panel">
        <h3>계약서 PDF 분석</h3>
        <div className="wrap">
          <button className="btn" onClick={analyzeSample} disabled={busy}>
            {busy ? "분석 중…" : "샘플 계약서로 살펴보기"}
          </button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
            내 PDF 업로드
          </button>
          <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }}
            onChange={(e) => analyzeFile(e.target.files?.[0])} />
        </div>
        {aErr && <p className="note mt">분석 실패: {aErr}</p>}
        {analysis && (() => {
          const cnt = (l) => analysis.counts[l] ?? analysis.counts[String(l)] ?? 0;
          const danger = cnt(2), warn = cnt(1);
          const tone = danger > 0
            ? { bg: "var(--red-soft)", bd: "var(--red)", msg: `위험 조항 ${danger}건${warn ? ` · 주의 ${warn}건` : ""} 발견 — 계약 전 반드시 확인하세요.` }
            : warn > 0
            ? { bg: "var(--amber-soft)", bd: "var(--amber)", msg: `주의가 필요한 조항이 ${warn}건 있어요. 내용을 확인해 보세요.` }
            : { bg: "var(--green-soft)", bd: "var(--green)", msg: "특별히 위험하거나 주의가 필요한 조항은 발견되지 않았습니다." };
          return (
            <div className="mt">
              <div style={{ padding: "12px 16px", borderRadius: 12, background: tone.bg, borderLeft: `4px solid ${tone.bd}`, marginBottom: 14, fontWeight: 600 }}>
                {tone.msg}
              </div>
              <p className="muted" style={{ marginBottom: 10 }}>
                총 {analysis.n_clauses}개 조항 ·{" "}
                {[2, 1, 0].map((l) => (
                  <span key={l} style={{ marginRight: 8 }}>
                    <Stamp l={l} /> {cnt(l)}
                  </span>
                ))}
              </p>
              {analysis.clauses.map((c, i) => <ClauseResult key={i} c={c} />)}
            </div>
          );
        })()}
      </Card>

      <Card className="mb contract-panel judge-panel">
        <h3>특약 조항 간이 판정</h3>
        <textarea rows={2} value={demo} onChange={(e) => setDemo(e.target.value)}
          placeholder="예: 임차인은 어떠한 경우에도 보증금 반환을 요구할 수 없다." />
        <div className="wrap" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => judge()}>판정해 보기</button>
          <button className="btn ghost sm" onClick={() => judge("임차인은 어떠한 경우에도 계약 기간 중 보증금의 반환을 청구할 수 없으며, 중도 해지 시 보증금은 전액 몰수된다.")}>위험 예시</button>
          <button className="btn ghost sm" onClick={() => judge("임대인은 보일러 등 주요 설비의 노후로 인한 고장을 자신의 비용으로 수리한다.")}>정상 예시</button>
        </div>
        {judged && (
          <div className="mt">
            <p>판정: <Stamp l={judged.label_id} big /></p>
            {judged.evidence?.results?.length > 0 && (
              <div className="mt">
                <p className="muted">관련 법 조문 근거</p>
                {judged.evidence.results.map((e) => (
                  <div key={e.id} className="evi"><b>{e.title}</b>{e.text}</div>
                ))}
              </div>
            )}
            {judged.explanation && (
              <div className="mt" style={{ padding: "12px 14px", background: "var(--bg)", borderLeft: "3px solid var(--blue)", borderRadius: 8, lineHeight: 1.65 }}>
                <b style={{ color: "var(--blue)" }}>💬 AI 설명</b>
                <p style={{ marginTop: 4 }}>{judged.explanation}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {laws.length > 0 && (
        <Card className="mb contract-panel laws-panel">
          <h3>참고 법령</h3>
          <p className="muted" style={{ marginBottom: 12 }}>
            검토에 활용되는 주택임대차 관련 주요 법 조문입니다.
          </p>
          {Object.entries(byLaw).map(([law, arts]) => (
            <div key={law} style={{ marginBottom: 12 }}>
              <p className="eyebrow">{law}</p>
              {arts.map((a) => (
                <details key={a.id} className="law">
                  <summary>{a.title}</summary>
                  <p className="txt">{a.text}</p>
                </details>
              ))}
            </div>
          ))}
        </Card>
      )}

      <p className="note">
        ⚠️ 본 결과는 참고용이며 법적 자문을 대체하지 않습니다. 조문은 요지를 정리한 것으로 실제 자문 시 원문 확인이 필요합니다.
      </p>
    </section>
  );
}
