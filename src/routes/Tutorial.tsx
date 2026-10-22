import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CapGlyph, Segmented, useTitle } from "../components/bits";
import { ProfileCard } from "../components/ProfileCard";
import { CAPITALS, CUSTOMER_ROLES, LEVELS, ORG_TYPES, RINGS, blankConnection, noteField, ratingField } from "../lib/capitals";
import { CASE, EXAMPLES, stepsFor, type Example, type Step } from "../lib/tutorial";
import type { Connection, ProfileDraft, ProfileRow } from "../lib/types";

/* A worked example, played: the form fills itself in one question at a time
   while a caption says why. Pause, step, or jump to the finished profile.
   Under reduced motion nothing types or auto-advances; each step appears
   whole and waits. The form is a copy of the real one, inert; the captions
   are the accessible track (a live region, plus the full list underneath). */

const TYPE_MS = 28;      // per character
const HOLD_MS = 1600;    // after a step completes
const QUICK_MS = 900;    // after a pick

const blank = (): ProfileDraft => ({
  name: "", org_type: null, org_type_other: null, description: "", tried_before: "", ring: null,
  capital_natural_rating: null, capital_natural_note: "", capital_cultural_rating: null, capital_cultural_note: "",
  capital_human_rating: null, capital_human_note: "", capital_social_rating: null, capital_social_note: "",
  capital_political_rating: null, capital_political_note: "", capital_financial_rating: null, capital_financial_note: "",
  capital_built_rating: null, capital_built_note: "", connections: [],
  needs: "", values_held: "", fears: "", influence_level: null, influence_note: "", stake: "", customer_role: null, connection_to_labs: "",
});

/** The full value a step writes. */
function fullValue(ex: Example, key: string): string | Connection {
  if (key.startsWith("connection:")) return ex.connections[Number(key.split(":")[1])] as Connection;
  if (key.startsWith("capital_")) return ex.ratings[key.replace("capital_", "").replace("_rating", "") as keyof typeof ex.ratings];
  if (key === "connection") return ex.connection;
  return String((ex as unknown as Record<string, unknown>)[key] ?? "");
}

/** The draft as it stands after `done` whole steps plus `chars` characters of the current one. */
function draftAt(ex: Example, steps: Step[], done: number, chars: number): ProfileDraft {
  const d = blank();
  const apply = (s: Step, partial: number | null) => {
    const v = fullValue(ex, s.key);
    if (s.kind === "connection") {
      const c = v as Connection;
      const name = partial === null ? c.name : c.name.slice(0, partial);
      const rest = partial === null || partial >= c.name.length;
      d.connections = [...d.connections, rest ? c : { ...blankConnection(), name }];
      return;
    }
    const text = v as string;
    if (s.kind === "text") {
      const out = partial === null ? text : text.slice(0, partial);
      if (s.key === "connection") d.connection_to_labs = out; else (d as unknown as Record<string, unknown>)[s.key] = out;
      return;
    }
    (d as unknown as Record<string, unknown>)[s.key] = text;
    if (s.key.startsWith("capital_")) { const k = s.key.replace("capital_", "").replace("_rating", "") as keyof typeof ex.notes; const n = ex.notes[k]; if (n) (d as unknown as Record<string, unknown>)[noteField(k)] = n; }
    if (s.key === "influence_level" && ex.influence_note) d.influence_note = ex.influence_note;
  };
  for (let i = 0; i < done && i < steps.length; i++) apply(steps[i] as Step, null);
  if (done < steps.length && chars > 0) apply(steps[done] as Step, chars);
  return d;
}

function asRow(ex: Example, d: ProfileDraft): ProfileRow {
  return { id: `example-${ex.id}`, cycle: "example", author_id: "example", status: "submitted", created_at: "", updated_at: "", submitted_at: "", edited_at: null, ...d };
}

export default function Tutorial() {
  useTitle("How to write a profile");
  const reduced = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const [exIndex, setExIndex] = useState(0);
  const ex = EXAMPLES[exIndex] as Example;
  const steps = useMemo(() => stepsFor(ex), [ex]);
  const [done, setDone] = useState(0);        // steps fully applied
  const [chars, setChars] = useState(0);      // of the current step
  const [playing, setPlaying] = useState(!reduced);
  const [finished, setFinished] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const current = steps[done];
  const target = current ? fullValue(ex, current.key) : null;
  const targetLen = current ? (current.kind === "connection" ? (target as Connection).name.length : current.kind === "text" ? (target as string).length : 1) : 0;

  const restart = useCallback((i: number) => { setExIndex(i); setDone(0); setChars(0); setFinished(false); setPlaying(!reduced); }, [reduced]);
  const next = useCallback(() => { setChars(0); setDone((n) => { if (n + 1 >= steps.length) { setFinished(true); setPlaying(false); return steps.length; } return n + 1; }); }, [steps.length]);
  const back = useCallback(() => { setChars(0); setFinished(false); setDone((n) => Math.max(0, n - 1)); }, []);

  // The clock: type a character, or hold, then move on.
  useEffect(() => {
    if (!playing || finished || !current) return;
    if (reduced) { const t = window.setTimeout(next, HOLD_MS); return () => window.clearTimeout(t); }
    if (chars < targetLen) { const t = window.setTimeout(() => setChars((c) => c + 1), current.kind === "text" || current.kind === "connection" ? TYPE_MS : QUICK_MS); return () => window.clearTimeout(t); }
    const t = window.setTimeout(next, current.kind === "text" ? HOLD_MS : QUICK_MS);
    return () => window.clearTimeout(t);
  }, [playing, finished, current, chars, targetLen, reduced, next]);

  // Keep the live field in view inside the form panel.
  useEffect(() => {
    const panel = formRef.current, el = panel?.querySelector<HTMLElement>(".is-live");
    if (!panel || !el) return;
    const top = el.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop - (panel.clientHeight - el.offsetHeight) / 2;
    panel.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
  }, [done, reduced]);

  const draft = draftAt(ex, steps, finished ? steps.length : done, reduced ? targetLen : chars);
  const liveKey = current?.key ?? null;
  const live = (k: string) => (!finished && liveKey === k ? " is-live" : "");
  const liveCap = (k: string) => (!finished && liveKey === ratingField(k as never) ? " is-live" : "");

  return (
    <div className="page tutorial">
      <header className="intro">
        <h1 className="h-display">How to write a profile</h1>
        <p className="lede">{CASE.blurb}</p>
      </header>

      <div className="tut-layout">
        <aside className="tut-side">
          <p className="tut-ex">Example {exIndex + 1} of {EXAMPLES.length}</p>
          <p className="tut-intro">{ex.intro}</p>
          <div className="tut-caption" role="status" aria-live="polite" aria-atomic="true">
            {finished ? <p><b>That's one profile.</b> Three of these, written on your own, and you're done.</p> : <p key={done}>{current?.caption}</p>}
          </div>
          <p className="tut-progress" aria-hidden="true"><span style={{ width: `${(Math.min(done + (chars >= targetLen ? 1 : chars / Math.max(targetLen, 1)), steps.length) / steps.length) * 100}%` }} /></p>
          <div className="tut-controls">
            {!finished && <button type="button" className="btn btn-primary btn-sm" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>{playing ? "Pause" : "Play"}</button>}
            <button type="button" className="btn btn-quiet btn-sm" onClick={back} disabled={done === 0 && !finished}>Back</button>
            {!finished && <button type="button" className="btn btn-quiet btn-sm" onClick={next}>Next</button>}
            {!finished && <button type="button" className="btn-link quiet" onClick={() => { setFinished(true); setPlaying(false); setDone(steps.length); }}>Skip to the finished profile</button>}
          </div>
          <div className="tut-after">
            {finished && exIndex + 1 < EXAMPLES.length && <button type="button" className="btn btn-primary" onClick={() => restart(exIndex + 1)}>Watch the second example</button>}
            {finished && <Link className="btn btn-quiet" to="/" viewTransition>Start your own</Link>}
            {!finished && exIndex + 1 < EXAMPLES.length && <button type="button" className="btn-link quiet" onClick={() => restart(exIndex + 1)}>Jump to the second example</button>}
            {exIndex > 0 && <button type="button" className="btn-link quiet" onClick={() => restart(0)}>Back to the first</button>}
          </div>
          <p className="tut-step" aria-hidden="true">{finished ? "Finished" : `Step ${done + 1} of ${steps.length}`}</p>
        </aside>

        {finished ? (
          <div className="tut-done">
            <ProfileCard p={asRow(ex, draft)} headingLevel={2} centre={CASE.short} />
          </div>
        ) : (
          <div className="tut-form" ref={formRef} aria-hidden="true" {...{ inert: "" }}>
            <div className="editor">
              <div className="form-head"><p className="rail-shape tut-shape"><CapGlyph p={asRow(ex, draft)} size={64} label={false} /></p><h2 className="h-title">{draft.name?.trim() || "A new player"}</h2></div>
              <div className="part">
                <h3 className="h-section part-title">In your own words</h3>
                <div className={`field${live("name")}`}><p className="label">Name of the player</p><input className="input" readOnly value={draft.name ?? ""} /></div>
                <div className={`field${live("org_type")}`}><p className="label">Type of player</p><select className="select" value={draft.org_type ?? ""} onChange={() => undefined}><option value="">Choose a type</option>{ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                {(draft.org_type === "other" || live("org_type_other")) && <div className={`field${live("org_type_other")}`}><p className="label">Say what kind</p><input className="input" readOnly value={draft.org_type_other ?? ""} /></div>}
                <div className={`field${live("description")}`}><p className="label">Who they are</p><textarea className="textarea big" readOnly value={draft.description ?? ""} /></div>
                {(ex.tried_before || live("tried_before")) && <div className={`field${live("tried_before")}`}><p className="label">What they've tried before <span className="opt">(optional)</span></p><textarea className="textarea" readOnly value={draft.tried_before ?? ""} /></div>}
              </div>
              <div className="part">
                <h3 className="h-section part-title">Give it structure</h3>
                <div className={`field${live("ring")}`}><p className="label">Inner circle or wider field?</p>
                  <div className="choices">{RINGS.map((r) => <label key={r.value} className="choice"><input type="radio" readOnly checked={draft.ring === r.value} /><b>{r.label}</b><span>{r.hint}</span></label>)}</div></div>
                <div className="field"><p className="label">What they bring</p>
                  <div className="caps">{CAPITALS.map((c) => (
                    <div key={c.key} className={`cap${liveCap(c.key)}`}>
                      <div className="cap-head"><span className="cap-name">{c.label}</span><span className="cap-prompt">{c.prompt}</span></div>
                      <Segmented name={`t-${c.key}`} value={draft[ratingField(c.key)]} options={LEVELS} onChange={() => undefined} />
                      <div className="note-wrap"><input className="input note-input" readOnly placeholder="Note (optional)" value={draft[noteField(c.key)] ?? ""} /></div>
                    </div>
                  ))}</div></div>
                <div className={`field${steps.some((s) => s.key.startsWith("connection:") && s.key === liveKey) ? " is-live" : ""}`}><p className="label">Who they're connected to</p>
                  <ol className="conn-list">{(draft.connections.length ? draft.connections : [blankConnection()]).map((c, i) => (
                    <li key={i} className="conn">
                      <div className="conn-main"><input className="input" readOnly placeholder="Name of a player they work with" value={c.name} /><input className="input conn-note" readOnly placeholder="How, in a few words (optional)" value={c.note} /></div>
                      <div className="conn-flow"><select className="select" value={c.capital ?? ""} onChange={() => undefined}><option value="">What passes between them? (optional)</option>{CAPITALS.map((x) => <option key={x.key} value={x.key}>{x.label} capital</option>)}</select>
                        <select className="select" value={c.direction ?? ""} onChange={() => undefined}><option value="">Which way?</option><option value="gives">This player gives it</option><option value="gets">This player gets it</option><option value="both">Both ways</option></select><span /></div>
                    </li>
                  ))}</ol></div>
                <div className={`field${live("needs")}`}><p className="label">What they need</p><textarea className="textarea" readOnly value={draft.needs ?? ""} /></div>
                {(ex.values_held || live("values_held")) && <div className={`field${live("values_held")}`}><p className="label">What they value <span className="opt">(optional)</span></p><textarea className="textarea" readOnly value={draft.values_held ?? ""} /></div>}
                {(ex.fears || live("fears")) && <div className={`field${live("fears")}`}><p className="label">What they fear or want to avoid <span className="opt">(optional)</span></p><textarea className="textarea" readOnly value={draft.fears ?? ""} /></div>}
                <div className={`field${live("influence_level")}`}><p className="label">Influence</p><Segmented name="t-influence" value={draft.influence_level} options={LEVELS} onChange={() => undefined} /><input className="input optional" readOnly placeholder="Note (optional)" value={draft.influence_note ?? ""} /></div>
                <div className={`field${live("stake")}`}><p className="label">What's at stake for them</p><textarea className="textarea" readOnly value={draft.stake ?? ""} /></div>
                <div className={`field${live("customer_role")}`}><p className="label">Served, contributing, or both? <span className="opt">(optional)</span></p>
                  <div className="choices choices-4">{CUSTOMER_ROLES.map((r) => <label key={r.value} className="choice"><input type="radio" readOnly checked={draft.customer_role === r.value} /><b>{r.label}</b><span>{r.hint}</span></label>)}</div></div>
                <div className={`field${live("connection")}`}><p className="label">How they could connect to {CASE.short}</p><textarea className="textarea" readOnly value={draft.connection_to_labs ?? ""} /></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <details className="tut-transcript">
        <summary>Every step, as text</summary>
        <ol>{steps.map((s) => <li key={s.key}>{s.caption}</li>)}</ol>
      </details>
    </div>
  );
}
