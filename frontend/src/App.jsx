import { useState } from "react";
import Landing from "./pages/Landing.jsx";
import Overview from "./pages/Overview.jsx";
import Search from "./pages/Search.jsx";
import Contract from "./pages/Contract.jsx";

const TABS = [
  { id: "overview", label: "홈" },
  { id: "search", label: "매물 검색" },
  { id: "contract", label: "계약서 검토" },
];

export default function App() {
  const [tab, setTab] = useState(null);
  const go = (id) => { setTab(id); window.scrollTo({ top: 0 }); };

  if (tab === null) return <Landing onNavigate={go} />;

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <div className="brand" style={{ cursor: "pointer" }} onClick={() => go(null)}>
            <div className="mark">🏠</div>
            <div>
              <b>한입 부동산</b>
              <small>매물 검색 × 계약서 검토</small>
            </div>
          </div>
          <nav className="topnav">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => go(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="content">
        {tab === "overview" && <Overview onNavigate={go} />}
        {tab === "search" && <Search />}
        {tab === "contract" && <Contract />}
        <p className="muted" style={{ marginTop: 40 }}>
          © 한입 부동산 · 안전한 방 찾기부터 계약서 검토까지
        </p>
      </main>
    </>
  );
}
