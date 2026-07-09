/* 진입 화면 — 파란 배경 랜딩 (styles.css 는 건드리지 않음, 인라인 스타일만) */

function Logo() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#dbe8ff" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect width="60" height="60" rx="16" fill="url(#lg)" />
      <path d="M16 29 L30 17 L44 29" stroke="#2b6ff3" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 28 V42 H40 V28" stroke="#2b6ff3" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 42 V34 H33 V42" stroke="#2b6ff3" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#2b6ff3" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="12" height="19" rx="1.5" />
      <path d="M8 11h1.5M12.5 11H14M8 15h1.5M12.5 15H14M8 19h1.5M12.5 19H14" />
      <circle cx="22" cy="19" r="5.2" />
      <path d="M25.8 22.8 29 26" />
    </svg>
  );
}

function ContractIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#2b6ff3" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h9l7 7v15a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 26V5.5A1.5 1.5 0 0 1 8 4Z" />
      <path d="M17 4v6a1 1 0 0 0 1 1h6" />
      <path d="M11 18l2.2 2.2L18 15.5" />
      <path d="M11 24h10" />
    </svg>
  );
}

const CARDS = [
  { id: "search", title: "매물 검색", cta: "매물 검색하기", Icon: SearchIcon },
  { id: "contract", title: "계약서 검토", cta: "계약서 검토하기", Icon: ContractIcon },
];

const WRAP = {
  position: "relative",
  overflow: "hidden",
  minHeight: "100vh",
  width: "100%",
  background: "linear-gradient(165deg, #1746a6 0%, #2264d8 48%, #3a86f0 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "64px 20px",
  boxSizing: "border-box",
};

export default function Landing({ onNavigate }) {
  return (
    <div style={WRAP}>
      {/* 도시 스카이라인 실루엣 */}
      <svg
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 220, opacity: 0.14 }}
        fill="#ffffff"
        aria-hidden="true"
      >
        <path d="M0 220V150h70v-34h46v54h60V96h54v40h58V70h50v66h64v-40h48v40h70V120h56v34h60V88h52v66h66v-30h46v30h72V150h60v70H0Z" />
      </svg>

      <div style={{ position: "relative", textAlign: "center", color: "#fff", marginBottom: 44 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.4em", fontWeight: 700, opacity: 0.75, marginBottom: 18 }}>
          REAL ESTATE AI
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Logo />
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 20, color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,.18)" }}>
          한입 부동산
        </div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 1.34,
            letterSpacing: "-0.03em",
            margin: "0 0 16px",
            color: "#fff",
            textShadow: "0 2px 16px rgba(0,0,0,.18)",
          }}
        >
          안전한 방 찾기부터<br />계약서 검토까지, 한 번에
        </h1>
        <p style={{ fontSize: 15.5, opacity: 0.9, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
          자연어로 조건을 말하면 매물을 찾아주고,<br />
          계약 전 위험 조항을 법 조문 근거와 함께 짚어드립니다.
        </p>
      </div>

      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 300px))",
          gap: 22,
          width: "100%",
          maxWidth: 640,
          justifyContent: "center",
        }}
      >
        {CARDS.map(({ id, title, cta, Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            style={{
              background: "#fff",
              border: "none",
              borderRadius: 20,
              padding: "30px 26px",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 12px 34px rgba(8,32,80,.24)",
              transition: "transform .16s ease, box-shadow .16s ease",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 20px 46px rgba(8,32,80,.34)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "0 12px 34px rgba(8,32,80,.24)";
            }}
          >
            <span
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "#eaf1fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon />
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#191f28" }}>
              {title}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#2b6ff3", fontWeight: 700, fontSize: 14.5 }}>
              {cta}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
