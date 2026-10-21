import { Status } from "./bits";
import { CAPITALS, LEVEL_LABEL, RING_LABEL, noteField, ratingField, typeLabel } from "../lib/capitals";
import type { Level, ProfileRow } from "../lib/types";

function Lvl({ v }: { v: Level | null }) {
  return v ? <span className={`lvl lvl-${v}`}>{LEVEL_LABEL[v]}</span> : <span className="muted">Not rated</span>;
}

function Text({ v }: { v: string | null }) {
  return v && v.trim() ? <>{v}</> : <span className="muted">—</span>;
}

/** The full, read-only profile. Used by the profile view and by printed cards. Never shows the author unless given one. */
/** The seven capitals as a ring: one spoke each, the dot further out the higher the rating. */
export function CapRing({ p }: { p: ProfileRow }) {
  const R = { low: 0.4, medium: 0.7, high: 1 } as const;
  const size = 280, c = size / 2, r = 92;
  const pts = CAPITALS.map((cap, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / CAPITALS.length;
    const v = p[ratingField(cap.key)];
    const k = v ? R[v] : 0;
    return { cap, a, v, x: c + Math.cos(a) * r * k, y: c + Math.sin(a) * r * k, lx: c + Math.cos(a) * (r + 30), ly: c + Math.sin(a) * (r + 30), ex: c + Math.cos(a) * r, ey: c + Math.sin(a) * r };
  });
  const rated = pts.filter((q) => q.v);
  return (
    <figure className="capring rv">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={pts.map((q) => `${q.cap.label}: ${q.v ? LEVEL_LABEL[q.v] : "not rated"}`).join(", ")}>
        {[0.4, 0.7, 1].map((k) => <circle key={k} cx={c} cy={c} r={r * k} className="cr-ring" />)}
        {pts.map((q) => <line key={q.cap.key} x1={c} y1={c} x2={q.ex} y2={q.ey} className="cr-spoke" />)}
        {rated.length > 2 && <polygon points={rated.map((q) => `${q.x},${q.y}`).join(" ")} className="cr-area" />}
        {pts.map((q) => q.v && <circle key={q.cap.key} cx={q.x} cy={q.y} r={5.5} className={`cr-dot cr-${q.v}`} />)}
        {pts.map((q) => <text key={q.cap.key} x={q.lx} y={q.ly} className="cr-label" textAnchor={Math.abs(Math.cos(q.a)) < 0.3 ? "middle" : Math.cos(q.a) > 0 ? "start" : "end"} dominantBaseline="middle">{q.cap.label}</text>)}
      </svg>
      <figcaption>Further out means rated higher: low, medium, high.</figcaption>
    </figure>
  );
}

export function ProfileCard({ p, author, headingLevel = 1, showStatus, variant = "page" }: { p: ProfileRow; author?: string; headingLevel?: 1 | 2; showStatus?: boolean; variant?: "page" | "print" }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <article className={`card card-${variant}`} aria-label={p.name ?? "Untitled profile"}>
      <header className="card-head">
        <p className="card-meta rv">
          {[p.org_type ? typeLabel(p) : null, p.ring ? RING_LABEL[p.ring] : null].filter(Boolean).join(" · ")}
          {showStatus && <Status kind={p.status === "draft" ? "draft" : "submitted"}>{p.status === "draft" ? "Draft" : "Submitted"}</Status>}
          {showStatus && p.edited_at && <span title={`Edited after submitting, ${new Date(p.edited_at).toLocaleString()}`}><Status kind="edited">Edited</Status></span>}
        </p>
        <H className="card-title rv">{p.name?.trim() || "Untitled player"}</H>
        {author && <p className="author rv">Written by {author}</p>}
      </header>

      <section className="rv" aria-label="Who they are">
        <p className="desc"><Text v={p.description} /></p>
      </section>

      {variant === "page" ? (
        <div className="caps-view">
          <CapRing p={p} />
          <CapTable p={p} />
        </div>
      ) : <CapTable p={p} />}

      <dl className="kv">
        <div className="rv"><dt>What they need</dt><dd><Text v={p.needs} /></dd></div>
        <div className="rv"><dt>What they value</dt><dd><Text v={p.values_held} /></dd></div>
        <div className="rv"><dt>What they fear or want to avoid</dt><dd><Text v={p.fears} /></dd></div>
        <div className="rv"><dt>Influence</dt><dd><Lvl v={p.influence_level} />{p.influence_note?.trim() ? <> · {p.influence_note}</> : null}</dd></div>
        <div className="rv"><dt>Stake: what they stand to gain or lose</dt><dd><Text v={p.stake} /></dd></div>
        <div className="rv"><dt>How they could connect to The Labs</dt><dd><Text v={p.connection_to_labs} /></dd></div>
      </dl>
    </article>
  );
}

function CapTable({ p }: { p: ProfileRow }) {
  return (
    <table className="captable rv">
      <caption>What they bring: the seven capitals</caption>
      <tbody>
        {CAPITALS.map((c) => (
          <tr key={c.key}>
            <th scope="row">{c.label}</th>
            <td><Lvl v={p[ratingField(c.key)]} />{p[noteField(c.key)]?.trim() ? <span className="capnote">{p[noteField(c.key)]}</span> : null}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
