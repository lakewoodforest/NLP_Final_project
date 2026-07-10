import { useState } from "react";

/* ── 작은 아이콘 ── */
const P = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4",
  sparkle: "M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 14l.9 2.1 2.1.9-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  chat: "M4 5h16v10H9l-4 4z",
  bolt: "M13 3 4 14h6l-1 7 9-11h-6z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 20c0-3.5 3-6 7-6s7 2.5 7 6",
  shield: "M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z",
  scale: "M12 4v16M7 20h10M6 8l-3 6h6zM18 8l-3 6h6zM6 8l6-2 6 2",
  report: "M7 3h7l4 4v14H7zM9 12h6M9 16h4",
  heart: "M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20z",
  home: "M4 11 12 4l8 7M6 10v9h12v-9",
};
function Ic({ d, w = 18, c }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"}
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  );
}

const HOT = ["서울 마포구 원룸", "강남구 투룸", "역세권 오피스텔", "반려동물 가능", "보증금 1억 이하"];

const RECS = [
  { nm: "마포구 서교동 원룸", pr: "보증금 1억 / 월세 50만", cs: ["역세권", "풀옵션", "즉시입주"], badge: "추천", b: 0, emoji: "🛏️", g: "linear-gradient(135deg,#dbe8fb,#c3d6f2)", q: "마포구 원룸" },
  { nm: "강남구 역삼동 투룸", pr: "보증금 2억 / 월세 80만", cs: ["역세권", "관리비 포함", "신축"], badge: "인기", b: 1, emoji: "🛋️", g: "linear-gradient(135deg,#e7e0f7,#d3c6ee)", q: "강남구 투룸" },
  { nm: "서초구 서초동 오피스텔", pr: "보증금 1.5억 / 월세 70만", cs: ["역세권", "풀옵션", "주차가능"], badge: "추천", b: 0, emoji: "🏢", g: "linear-gradient(135deg,#dcecf7,#c2ddef)", q: "서초구 오피스텔" },
  { nm: "성동구 성수동 원룸", pr: "보증금 8천만 / 월세 45만", cs: ["역세권", "리모델링", "즉시입주"], badge: "신규", b: 2, emoji: "🛏️", g: "linear-gradient(135deg,#dcf1e6,#c3e8d3)", q: "성동구 원룸" },
];

/* 우측 3D 씬 */
function Scene() {
  return (
    <div className="scene" aria-hidden="true">
      <div className="glow" />
      {/* 블러 도시 */}
      <svg className="city" viewBox="0 0 600 540" preserveAspectRatio="xMidYMax meet" fill="none">
        <defs>
          <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bcd4f5" /><stop offset="1" stopColor="#8fb6ea" />
          </linearGradient>
        </defs>
        <g fill="url(#bd)" opacity="0.85">
          <rect x="60" y="300" width="46" height="180" rx="4" />
          <rect x="118" y="250" width="52" height="230" rx="4" />
          <rect x="182" y="330" width="40" height="150" rx="4" />
          <rect x="360" y="290" width="50" height="190" rx="4" />
          <rect x="420" y="240" width="56" height="240" rx="4" />
          <rect x="486" y="320" width="44" height="160" rx="4" />
        </g>
        {/* N타워 */}
        <g stroke="#8fb6ea" strokeWidth="6" opacity="0.8">
          <path d="M540 180 V420" />
          <path d="M528 300 h24" />
        </g>
        <circle cx="540" cy="176" r="16" fill="#a9c8ef" />
      </svg>
      {/* 글래스 서클 */}
      <div className="gcirc" style={{ width: 90, height: 90, right: 40, top: 70 }} />
      <div className="gcirc" style={{ width: 54, height: 54, left: 40, top: 150 }} />
      {/* 플로팅 아이콘 */}
      <div className="fico" style={{ left: 70, top: 60 }}><Ic d={P.home} w={22} /></div>
      <div className="fico" style={{ left: 130, top: 180, animationDelay: ".8s" }}><Ic d={P.report} w={22} /></div>
      {/* 플랫폼 */}
      <svg className="platform" viewBox="0 0 300 90" fill="none">
        <ellipse cx="150" cy="45" rx="145" ry="40" fill="#cfe0f8" />
        <ellipse cx="150" cy="38" rx="120" ry="30" fill="#e8f1fd" />
      </svg>
      <img className="masc" src="/mascot.png" alt=""
        onError={(e) => { e.currentTarget.style.display = "none"; }} />
    </div>
  );
}

export default function Home({ onNavigate }) {
  const [q, setQ] = useState("");
  const submit = () => onNavigate("search", q.trim());

  return (
    <div className="home">
      <button className="bell" aria-label="알림">
        <Ic d={P.bell} w={22} />
        <span className="dot">3</span>
      </button>

      <section className="hero2">
        <div className="hero-left">
          <span className="pill"><Ic d={P.sparkle} w={14} /> REAL ESTATE AI</span>
          <h1>안전한 방 찾기부터<br /><span className="accent">계약서 검토</span>까지, 한 번에</h1>
          <p className="sub">
            자연어로 조건을 말하면 AI가 매물을 찾아주고,<br />
            계약 전 위험 조항을 한 곳으로 모아 함께 짚어드립니다.
          </p>
          <div className="home-search">
            <Ic d={P.search} w={20} />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="원하는 지역, 조건을 자연어로 입력해보세요" />
            <button className="ai-btn" onClick={submit}><Ic d={P.sparkle} w={16} /> AI로 검색하기</button>
          </div>
          <div className="hot">
            <span className="lbl">인기 검색어</span>
            {HOT.map((t) => (
              <button key={t} className="tag" onClick={() => onNavigate("search", t)}>{t}</button>
            ))}
          </div>
        </div>
        <Scene />
      </section>

      <div className="feat-grid">
        <button className="feat blue" onClick={() => onNavigate("search")}>
          <div className="htop">
            <div className="ico"><Ic d={P.search} w={26} c="var(--blue)" /></div>
            <div>
              <h3>AI 매물 검색</h3>
              <p>AI가 조건에 맞는 최적의 매물을 찾아드려요</p>
            </div>
          </div>
          <div className="subs">
            <span className="sub"><Ic d={P.chat} w={15} /> 자연어 검색</span>
            <span className="sub"><Ic d={P.bolt} w={15} /> 실시간 데이터</span>
            <span className="sub"><Ic d={P.user} w={15} /> 맞춤 추천</span>
          </div>
          <span className="link">매물 검색 시작하기 →</span>
          <BuildingIllust />
        </button>

        <button className="feat green" onClick={() => onNavigate("contract")}>
          <div className="htop">
            <div className="ico"><Ic d={P.report} w={26} c="var(--green)" /></div>
            <div>
              <h3>계약서 AI 검토</h3>
              <p>계약서 속 위험 조항을 AI가 꼼꼼하게 검토해드려요</p>
            </div>
          </div>
          <div className="subs">
            <span className="sub"><Ic d={P.shield} w={15} /> 위험 조항 분석</span>
            <span className="sub"><Ic d={P.scale} w={15} /> 법률 근거 제시</span>
            <span className="sub"><Ic d={P.report} w={15} /> 요약 리포트</span>
          </div>
          <span className="link">계약서 검토하기 →</span>
          <DocIllust />
        </button>
      </div>

      <div className="rec-head">
        <h3><Ic d={P.sparkle} w={20} c="var(--blue)" /> AI가 추천하는 맞춤 매물</h3>
        <button className="more" onClick={() => onNavigate("search")}>더 많은 매물 보기 →</button>
      </div>
      <div className="rec-grid">
        {RECS.map((r, i) => (
          <div key={i} className="rec-card" onClick={() => onNavigate("search", r.q)}>
            <div className="rec-photo">
              <div className="ph" style={{ background: r.g }}>{r.emoji}</div>
              <span className={`rec-badge b${r.b}`}>{r.badge}</span>
              <button className="heart" aria-label="찜" onClick={(e) => e.stopPropagation()}>
                <Ic d={P.heart} w={17} />
              </button>
            </div>
            <div className="rec-body">
              <div className="nm">{r.nm}</div>
              <div className="pr">{r.pr}</div>
              <div className="cs">{r.cs.map((c) => <span key={c}>{c}</span>)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 기능 카드 일러스트 */
function BuildingIllust() {
  return (
    <svg className="illust" viewBox="0 0 120 110" fill="none" aria-hidden="true">
      <rect x="14" y="46" width="34" height="58" rx="3" fill="#9fc0f2" />
      <rect x="46" y="26" width="40" height="78" rx="3" fill="#5b8cff" />
      <rect x="84" y="58" width="26" height="46" rx="3" fill="#bcd4f5" />
      <g fill="#fff" opacity="0.85">
        <rect x="52" y="34" width="7" height="7" rx="1" /><rect x="63" y="34" width="7" height="7" rx="1" /><rect x="74" y="34" width="7" height="7" rx="1" />
        <rect x="52" y="46" width="7" height="7" rx="1" /><rect x="63" y="46" width="7" height="7" rx="1" /><rect x="74" y="46" width="7" height="7" rx="1" />
        <rect x="52" y="58" width="7" height="7" rx="1" /><rect x="63" y="58" width="7" height="7" rx="1" /><rect x="74" y="58" width="7" height="7" rx="1" />
        <rect x="20" y="54" width="6" height="6" rx="1" /><rect x="30" y="54" width="6" height="6" rx="1" />
      </g>
    </svg>
  );
}
function DocIllust() {
  return (
    <svg className="illust" viewBox="0 0 120 110" fill="none" aria-hidden="true">
      <rect x="24" y="16" width="62" height="80" rx="7" fill="#fff" stroke="#bfe6cf" strokeWidth="2" />
      <g stroke="#cfead9" strokeWidth="3" strokeLinecap="round">
        <path d="M34 34h42M34 44h42M34 54h30" />
      </g>
      <circle cx="78" cy="72" r="20" fill="#e7f8ef" stroke="#2ccb7f" strokeWidth="3" />
      <path d="M70 72l6 6 10-11" stroke="#2ccb7f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M92 86l10 10" stroke="#2ccb7f" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
