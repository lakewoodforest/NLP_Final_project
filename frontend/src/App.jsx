import { useState } from "react";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Contract from "./pages/Contract.jsx";

const I = {
  home: "M4 11 12 4l8 7M6 10v9h12v-9",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4M9.5 13l1.6 1.6L15 11",
  star: "M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8z",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  chart: "M4 20V4M4 20h16M8 20v-6M12 20v-10M16 20v-4",
  users: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20c0-3 2.5-5 5-5s5 2 5 5M16 11a3 3 0 1 0 0-6M15 15c2.5 0 5 2 5 5",
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M19 12l1.5-1-1.2-2.6-1.8.4a6 6 0 0 0-1.6-.9L15.5 4h-3l-.4 1.9a6 6 0 0 0-1.6.9l-1.8-.4L7.5 9 9 10a6 6 0 0 0 0 2l-1.5 1 1.2 2.6 1.8-.4a6 6 0 0 0 1.6.9l.4 1.9h3l.4-1.9a6 6 0 0 0 1.6-.9l1.8.4 1.2-2.6L19 14a6 6 0 0 0 0-2",
};

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={I[name]} />
    </svg>
  );
}

const NAV = [
  { id: "home", label: "홈", icon: "home" },
  { id: "search", label: "매물 검색", icon: "search" },
  { id: "contract", label: "계약서 검토", icon: "doc" },
  { id: "favorite", label: "즐겨찾기", icon: "star", soon: true },
  { id: "alerts", label: "알림", icon: "bell", soon: true, count: 3 },
  { id: "reports", label: "분석 리포트", icon: "chart", soon: true },
  { id: "community", label: "커뮤니티", icon: "users", soon: true },
  { id: "settings", label: "설정", icon: "gear", soon: true },
];

export default function App() {
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const go = (id, q) => {
    if (q != null) setQuery(q);
    setTab(id);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="app-bg">
      <div className="shell">
        <aside className="sidebar">
          <div className="sb-brand" style={{ cursor: "pointer" }} onClick={() => go("home")}>
            <div className="mark">🐢</div>
            <div>
              <b>한입 부동산</b>
              <div className="sb-sub">REAL ESTATE AI</div>
            </div>
          </div>

          <nav className="sb-nav">
            {NAV.map((n) => (
              <button key={n.id} className={tab === n.id ? "on" : ""}
                disabled={n.soon}
                title={n.soon ? "준비 중인 기능" : ""}
                onClick={() => !n.soon && go(n.id)}>
                <NavIcon name={n.icon} />
                {n.label}
                {n.count && <span className="sb-count">{n.count}</span>}
              </button>
            ))}
          </nav>

          <div className="sb-foot">
            <div className="av">👤</div>
            <div className="who">
              <b>한입 님</b>
              <div className="muted">환영합니다!</div>
            </div>
            <span className="arr">→</span>
          </div>
          <div className="premium" onClick={() => go("home")}>
            <span className="pro">PRO</span>
            <b>AI 프리미엄</b>
            <small>더 정확한 분석과 맞춤 추천</small>
            <span className="more">자세히 보기 →</span>
          </div>
        </aside>

        <main className="main">
          {tab === "home" && <Home onNavigate={go} />}
          {tab === "search" && <Search initialQuery={query} />}
          {tab === "contract" && <Contract />}
          {["favorite", "alerts", "reports", "community", "settings"].includes(tab) && (
            <div className="empty" style={{ marginTop: 100 }}>준비 중인 기능입니다.</div>
          )}
        </main>
      </div>
    </div>
  );
}
