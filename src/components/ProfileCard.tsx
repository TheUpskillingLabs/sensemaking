import { kindOf } from "./bits";
import { CAPITALS, LEVEL_LABEL, noteField, ratingField } from "../lib/capitals";
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
    <figure className="capring">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={pts.map((q) => `${q.cap.label}: ${q.v ? LEVEL_LABEL[q.v] : "not rated"}`).join(", ")}>
        {[0.4, 0.7, 1].map((k) => <polygon key={k} className="cr-ring" points={pts.map((q) => `${c + Math.cos(q.a) * r * k},${c + Math.sin(q.a) * r * k}`).join(" ")} />)}
        {pts.map((q) => <line key={q.cap.key} x1={c} y1={c} x2={q.ex} y2={q.ey} className="cr-spoke" />)}
        {rated.length > 0 && <polygon points={pts.map((q) => q.v ? `${q.x},${q.y}` : `${c + Math.cos(q.a) * r * 0.08},${c + Math.sin(q.a) * r * 0.08}`).join(" ")} className="cr-area" />}
        {pts.map((q) => q.v && <circle key={q.cap.key} cx={q.x} cy={q.y} r={4} className="cr-dot" />)}
        {pts.map((q) => <text key={q.cap.key} x={q.lx} y={q.ly} className="cr-label" textAnchor={Math.abs(Math.cos(q.a)) < 0.3 ? "middle" : Math.cos(q.a) > 0 ? "start" : "end"} dominantBaseline="middle">{q.cap.label}</text>)}
      </svg>
      <figcaption>Further from the centre means rated higher.</figcaption>
    </figure>
  );
}

export function ProfileCard({ p, author, headingLevel = 1, showStatus, variant = "page" }: { p: ProfileRow; author?: string; headingLevel?: 1 | 2; showStatus?: boolean; variant?: "page" | "print" }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <article className={`card card-${variant}`} aria-label={p.name ?? "Untitled profile"}>
      <header className="card-head">
        <H className="card-title">{p.name?.trim() || "Untitled player"}</H>
        <p className="card-meta">
          <span>{kindOf(p) || "Type and ring not set"}</span>
          {showStatus && <span className={`state state-${p.status}`}>{p.status === "draft" ? "Draft" : "Submitted"}</span>}
          {showStatus && p.edited_at && <span className="state" title={new Date(p.edited_at).toLocaleString()}>Edited after submitting</span>}
          {author && <span className="author">Written by {author}</span>}
        </p>
      </header>

      <section aria-label="Who they are">
        <p className="desc"><Text v={p.description} /></p>
      </section>

      {variant === "page" ? (
        <div className="caps-view">
          <CapRing p={p} />
          <CapTable p={p} />
        </div>
      ) : <CapTable p={p} />}

      <dl className="kv">
        <div><dt>What they need</dt><dd><Text v={p.needs} /></dd></div>
        <div><dt>What they value</dt><dd><Text v={p.values_held} /></dd></div>
        <div><dt>What they fear or want to avoid</dt><dd><Text v={p.fears} /></dd></div>
        <div><dt>Influence</dt><dd><Lvl v={p.influence_level} />{p.influence_note?.trim() ? <span className="capnote">{p.influence_note}</span> : null}</dd></div>
        <div><dt>Stake: what they stand to gain or lose</dt><dd><Text v={p.stake} /></dd></div>
        <div><dt>How they could connect to The Labs</dt><dd><Text v={p.connection_to_labs} /></dd></div>
      </dl>
    </article>
  );
}

function CapTable({ p }: { p: ProfileRow }) {
  return (
    <table className="captable">
      <caption>What they bring</caption>
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
