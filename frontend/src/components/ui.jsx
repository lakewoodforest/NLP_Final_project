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

export function Star({ on = false, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={on ? "#f5a623" : "none"} stroke={on ? "#f5a623" : "currentColor"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l2.7 5.4 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.8l6-.9z" />
    </svg>
  );
}
