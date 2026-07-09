export const LNAME = ["정상", "주의", "위험"];

export function Stamp({ l, big, children }) {
  return <span className={`stamp s${l} ${big ? "big" : ""}`}>{children || LNAME[l]}</span>;
}

export function Chip({ ok = true, label, value }) {
  return (
    <span className={`chip ${ok ? "hit" : "miss"}`}>
      <b>{label}</b> {value || "∅"}
    </span>
  );
}

export function Stat({ n, l, tone }) {
  return (
    <div className="stat">
      <div className={`n ${tone || ""}`}>{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

export function Card({ children, className = "", ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}

export function Head({ eyebrow, title, lead }) {
  return (
    <div className="head">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}

export const fmt = (n) => Number(n).toLocaleString("ko-KR");
export const tipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #DCDED6" };
