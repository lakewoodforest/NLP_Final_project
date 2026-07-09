import { Card } from "../components/ui.jsx";

const FEATURES = [
  {
    tag: "매물 검색",
    title: "말하듯 검색하면, 딱 맞는 방을 찾아드려요",
    desc: "지역·가격·평수는 물론 '반려동물 가능', '조용한 동네' 같은 자유로운 조건까지 이해해서 조건에 맞는 매물을 골라드립니다.",
    id: "search",
    cta: "매물 검색하기",
  },
  {
    tag: "계약서 검토",
    title: "계약 전에, 위험한 특약을 미리 짚어드려요",
    desc: "임대차 계약서 PDF를 올리면 조항을 하나씩 살펴 정상·주의·위험으로 나누고, 왜 위험한지 관련 법 조문 근거와 함께 쉬운 말로 설명합니다.",
    id: "contract",
    cta: "계약서 검토하기",
  },
];

const STEPS = [
  ["조건 말하기", "원하는 방의 조건을 자연스러운 문장으로 입력하세요."],
  ["매물 확인", "조건에 맞는 매물을 한눈에 비교해 보세요."],
  ["계약서 점검", "마음에 든 방의 계약서를 올려 위험 조항을 확인하세요."],
];

export default function Overview({ onNavigate }) {
  return (
    <section>
      <div className="hero">
        <h2>안전한 방 찾기부터<br />계약서 검토까지, 한 번에</h2>
        <p>
          자연어로 조건을 말하면 매물을 찾아주고, 계약 전 특약사항의 위험 조항을
          법 조문 근거와 함께 짚어주는 부동산 서비스입니다.
        </p>
        <div className="wrap">
          <button className="primary" onClick={() => onNavigate("search")}>매물 검색하기</button>
          <button className="secondary" onClick={() => onNavigate("contract")}>계약서 검토하기</button>
        </div>
      </div>

      <div className="grid g2 mt">
        {FEATURES.map((f) => (
          <Card key={f.id}>
            <span className="eyebrow">{f.tag}</span>
            <h3 style={{ marginTop: 8 }}>{f.title}</h3>
            <p className="muted" style={{ margin: "8px 0 16px", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            <button className="btn" onClick={() => onNavigate(f.id)}>{f.cta} →</button>
          </Card>
        ))}
      </div>

      <Card className="mt">
        <h3>이렇게 이용하세요</h3>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginTop: 12 }}>
          {STEPS.map(([t, d], i) => (
            <div key={i} style={{ padding: "4px 2px" }}>
              <div style={{ color: "var(--blue)", fontWeight: 800, fontSize: 14, marginBottom: 4 }}>0{i + 1}</div>
              <b style={{ fontSize: 15 }}>{t}</b>
              <p className="muted" style={{ marginTop: 4, fontSize: 13.5, lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="merge mt">
        <span className="icon">🔒</span>
        <p>
          계약서 분석 결과는 참고용 정보이며 법적 자문을 대체하지 않습니다.
          업로드한 계약서의 개인정보는 분석 과정에서 자동으로 가려집니다.
        </p>
      </div>
    </section>
  );
}
