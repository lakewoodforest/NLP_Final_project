import { Head, Star } from "../components/ui.jsx";

export default function Favorites({ favs = [], toggleFav = () => {}, onNavigate = () => {} }) {
  return (
    <div className="home">
      <Head
        eyebrow="즐겨찾기"
        title="찜한 매물"
        lead="별표로 저장한 매물을 한곳에 모아봤어요. 나중에 다시 확인해 보세요."
      />

      {favs.length === 0 ? (
        <div className="fav-empty">
          <div className="fav-empty-ic"><Star size={30} /></div>
          <p className="ttl">아직 찜한 매물이 없어요</p>
          <p className="muted">매물 검색이나 홈에서 매물의 <b>별표</b>를 누르면 여기에 모여요.</p>
          <button className="btn" style={{ marginTop: 16 }} onClick={() => onNavigate("search")}>매물 검색하러 가기 →</button>
        </div>
      ) : (
        <div className="rec-grid">
          {favs.map((f) => (
            <div key={f.id} className="rec-card">
              <div className="rec-photo" style={{ background: "linear-gradient(135deg,#dbe8fb,#c3d6f2)" }}>
                {f.photo
                  ? <img className="ph-img" src={f.photo} alt="" loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  : <div className="ph-emoji">{f.emoji || "🏠"}</div>}
                <button className="heart" aria-label="찜 해제" onClick={() => toggleFav(f)}>
                  <Star on size={18} />
                </button>
              </div>
              <div className="rec-body">
                <div className="nm">{f.title}</div>
                <div className="pr">{f.sub}</div>
                <div className="cs">{(f.chips || []).map((c) => <span key={c}>{c}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
