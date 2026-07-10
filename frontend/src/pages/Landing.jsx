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

function Mascot({ style }) {
  const NAVY = "#16265c", BLUE = "#aac3ea", W = "#ffffff";
  return (
    <svg viewBox="0 0 200 268" style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* 등껍질 */}
      <ellipse cx="134" cy="152" rx="47" ry="53" fill={BLUE} stroke={NAVY} strokeWidth="5" />
      <polygon points="134,116 168,137 168,167 134,188 100,167 100,137" fill="none" stroke="#7f9fd0" strokeWidth="3" />
      <path d="M134 116 L134 152 M100 137 L134 152 L168 137 M100 167 L134 152 L168 167" fill="none" stroke="#7f9fd0" strokeWidth="2.5" />
      {/* 다리 */}
      <rect x="74" y="216" width="22" height="38" rx="11" fill={W} stroke={NAVY} strokeWidth="5" />
      <rect x="104" y="216" width="22" height="38" rx="11" fill={W} stroke={NAVY} strokeWidth="5" />
      {/* 후드 몸통 */}
      <path d="M58 160 Q58 128 100 128 Q142 128 142 160 L142 214 Q142 228 126 228 L74 228 Q58 228 58 214 Z" fill={NAVY} />
      {/* 끈 리본 */}
      <path d="M100 146 q-13 -7 -15 4 q11 5 15 -4" fill={W} />
      <path d="M100 146 q13 -7 15 4 q-11 5 -15 -4" fill={W} />
      <circle cx="100" cy="146" r="4.5" fill={W} />
      <path d="M96 150 L93 166 M104 150 L107 166" stroke={W} strokeWidth="3" strokeLinecap="round" />
      {/* HSU */}
      <text x="100" y="192" textAnchor="middle" fill={W} fontSize="19" fontWeight="800" fontFamily="Arial, sans-serif" letterSpacing="1">HSU</text>
      {/* 손 */}
      <ellipse cx="70" cy="200" rx="14" ry="15" fill={W} stroke={NAVY} strokeWidth="5" />
      <ellipse cx="130" cy="200" rx="14" ry="15" fill={W} stroke={NAVY} strokeWidth="5" />
      {/* 후드 머리 */}
      <path d="M100 30 q-9 -8 -1 -16 q9 8 1 16" fill={NAVY} />
      <circle cx="100" cy="82" r="47" fill={NAVY} />
      <circle cx="100" cy="87" r="38" fill={W} />
      {/* 볼 */}
      <ellipse cx="79" cy="95" rx="13" ry="8.5" fill={BLUE} />
      <ellipse cx="121" cy="95" rx="13" ry="8.5" fill={BLUE} />
      {/* 눈 */}
      <circle cx="86" cy="84" r="3.8" fill={NAVY} />
      <circle cx="114" cy="84" r="3.8" fill={NAVY} />
      {/* 입 (ᴥ) */}
      <path d="M91 92 q4.5 7 9 1 q4.5 7 9 -1" fill="none" stroke={NAVY} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* 이마 애교머리 */}
      <path d="M95 68 q5 -7 9 -2 q-3 4 -7 4" fill="none" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
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

      {/* 마스코트 — 블러 없이, 안쪽(텍스트 쪽) 가장자리만 살짝 투명하게 자연스럽게.
          frontend/public/mascot.png 필요. 파일 없으면 자동 숨김. */}
      <img src="/mascot.png" alt="한입 부동산 마스코트"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
        style={{
          position: "absolute", right: "23%", top: "40%",
          transform: "translateY(-44%) rotate(-8deg)",
          width: "min(31%, 300px)", height: "auto",
          zIndex: 1, pointerEvents: "none",
          filter: "drop-shadow(0 14px 24px rgba(8,24,60,.26))",
          WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0.4) 0%, #000 28%)",
          maskImage: "linear-gradient(to right, rgba(0,0,0,0.4) 0%, #000 28%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff", marginBottom: 44 }}>
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
          zIndex: 1,
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
