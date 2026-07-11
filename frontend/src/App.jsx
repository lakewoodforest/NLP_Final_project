import { useState, useEffect } from "react";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Contract from "./pages/Contract.jsx";
import Favorites from "./pages/Favorites.jsx";

const I = {
  home: "M4 11 12 4l8 7M6 10v9h12v-9",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4M9.5 13l1.6 1.6L15 11",
  star: "M12 3.5l2.7 5.4 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.8l6-.9z",
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
  { id: "favorite", label: "즐겨찾기", icon: "star" },
];

const loadFavs = () => {
  try { return JSON.parse(localStorage.getItem("hanip_favs") || "[]"); } catch { return []; }
};

export default function App() {
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState(loadFavs);

  useEffect(() => {
    try { localStorage.setItem("hanip_favs", JSON.stringify(favs)); } catch { /* ignore */ }
  }, [favs]);

  const isFav = (id) => favs.some((f) => f.id === id);
  const toggleFav = (item) =>
    setFavs((prev) => (prev.some((f) => f.id === item.id)
      ? prev.filter((f) => f.id !== item.id)
      : [item, ...prev]));

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
            <div className="mark" aria-hidden="true" />
            <div>
              <b>한입 부동산</b>
            </div>
          </div>

          <nav className="sb-nav roomy">
            {NAV.map((n) => (
              <button key={n.id} className={`nav-${n.id}${tab === n.id ? " on" : ""}`} onClick={() => go(n.id)}>
                <span className="nav-ic"><NavIcon name={n.icon} /></span>
                {n.label}
                {n.id === "favorite" && favs.length > 0 && <span className="sb-count">{favs.length}</span>}
              </button>
            ))}
          </nav>

        </aside>

        <main className="main">
          {tab === "home" && <Home onNavigate={go} isFav={isFav} toggleFav={toggleFav} />}
          {tab === "search" && <Search initialQuery={query} isFav={isFav} toggleFav={toggleFav} />}
          {tab === "contract" && <Contract />}
          {tab === "favorite" && <Favorites favs={favs} toggleFav={toggleFav} onNavigate={go} />}
        </main>
      </div>
    </div>
  );
}
