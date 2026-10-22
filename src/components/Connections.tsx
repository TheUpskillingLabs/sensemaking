import { CAPITALS, DIRECTIONS, blankConnection } from "../lib/capitals";
import type { CapitalKey, Connection, FlowDirection } from "../lib/types";

/* Who this player is connected to: one row each, with the capital that flows
   along it and which way, if known. The first row's name carries the field's
   id so the submit check can focus it. Rows are plain inputs, no modal. */

export function ConnectionsEditor({ value, onChange, invalid }: { value: Connection[]; onChange: (v: Connection[]) => void; invalid?: boolean }) {
  const rows = value.length ? value : [blankConnection()];
  const update = (i: number, patch: Partial<Connection>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(rows.length === 1 ? [blankConnection()] : rows.filter((_, j) => j !== i));
  const add = () => onChange([...rows, blankConnection()]);
  return (
    <div className={`conns${invalid ? " invalid" : ""}`}>
      <ol className="conn-list">
        {rows.map((r, i) => (
          <li key={i} className="conn">
            <div className="conn-main">
              <label className="sr-only" htmlFor={i === 0 ? "f-connections" : `f-conn-${i}`}>Connected to</label>
              <input id={i === 0 ? "f-connections" : `f-conn-${i}`} className="input" type="text" placeholder="Who they're connected to" value={r.name} maxLength={160}
                onChange={(e) => update(i, { name: e.target.value })} aria-invalid={invalid && i === 0 || undefined} />
              <label className="sr-only" htmlFor={`f-conn-${i}-note`}>How, in a few words (optional)</label>
              <input id={`f-conn-${i}-note`} className="input conn-note" type="text" placeholder="How, in a few words (optional)" value={r.note} maxLength={200}
                onChange={(e) => update(i, { note: e.target.value })} />
            </div>
            <div className="conn-flow">
              <label className="sr-only" htmlFor={`f-conn-${i}-cap`}>Capital that flows</label>
              <select id={`f-conn-${i}-cap`} className="select" value={r.capital ?? ""} onChange={(e) => update(i, { capital: (e.target.value || null) as CapitalKey | null })}>
                <option value="">What flows? (optional)</option>
                {CAPITALS.map((c) => <option key={c.key} value={c.key}>{c.label} capital</option>)}
              </select>
              <label className="sr-only" htmlFor={`f-conn-${i}-dir`}>Which way</label>
              <select id={`f-conn-${i}-dir`} className="select" value={r.direction ?? ""} disabled={!r.capital} onChange={(e) => update(i, { direction: (e.target.value || null) as FlowDirection | null })}>
                <option value="">Which way?</option>
                {DIRECTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <button type="button" className="btn-link quiet conn-rm" onClick={() => remove(i)} aria-label={`Remove connection ${i + 1}`}>Remove</button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-quiet btn-sm" onClick={add}>Add another connection</button>
    </div>
  );
}
