import { CAPITALS, LEVEL_LABEL, RING_LABEL, noteField, ratingField, typeLabel } from "../lib/capitals";
import type { Level, ProfileRow } from "../lib/types";

function Lvl({ v }: { v: Level | null }) {
  return v ? <span className={`lvl lvl-${v}`}>{LEVEL_LABEL[v]}</span> : <span className="muted">Not rated</span>;
}

function Text({ v }: { v: string | null }) {
  return v && v.trim() ? <>{v}</> : <span className="muted">—</span>;
}

/** The full, read-only profile. Used by the profile view and by printed cards. Never shows the author unless given one. */
export function ProfileCard({ p, author, headingLevel = 1, showStatus }: { p: ProfileRow; author?: string; headingLevel?: 1 | 2; showStatus?: boolean }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <article className="card" aria-label={p.name ?? "Untitled profile"}>
      <header className="card-head">
        <H className="card-title rv">{p.name?.trim() || "Untitled player"}</H>
        <div className="chips rv">
          {p.org_type && <span className="chip">{typeLabel(p)}</span>}
          {p.ring && <span className={`chip${p.ring === "inner_circle" ? " ring-inner" : ""}`}>{RING_LABEL[p.ring]}</span>}
          {showStatus && <span className={`badge ${p.status === "draft" ? "badge-draft" : "badge-sub"}`}>{p.status === "draft" ? "Draft" : "Submitted"}</span>}
          {showStatus && p.edited_at && <span className="badge badge-edited" title={`Edited after submitting, ${new Date(p.edited_at).toLocaleString()}`}>Edited</span>}
        </div>
        {author && <p className="author rv">Written by {author}</p>}
      </header>

      <section className="rv" aria-label="Who they are">
        <p className="desc"><Text v={p.description} /></p>
      </section>

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
