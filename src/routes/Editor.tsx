import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";
import { Why } from "../components/Learn";
import { ConnectionsEditor } from "../components/Connections";
import { CapGlyph, LocalNav, ConfirmDialog, ErrorNote, Loader, Segmented, Tick, useTitle } from "../components/bits";
import { ApiError, api } from "../lib/api";
import { CAPITALS, CUSTOMER_ROLES, LEVELS, ORG_TYPES, RINGS, missingFields, noteField, ratingField, type Missing } from "../lib/capitals";
import { EDITABLE_FIELDS, type EditableField, type ProfileDraft, type ProfileRow } from "../lib/types";

const AUTOSAVE_MS = 800;
const SECTIONS = [
  { id: "s-own", label: "In your own words" },
  { id: "s-ring", label: "Ring" },
  { id: "s-capitals", label: "Capitals" },
  { id: "s-connections", label: "Connections" },
  { id: "s-needs", label: "Needs and values" },
  { id: "s-influence", label: "Influence" },
  { id: "s-stake", label: "Stake" },
  { id: "s-connection", label: "And The Labs" },
];
const MAX_BACKOFF_MS = 30_000;
type SaveState = "idle" | "saving" | "saved" | "retrying" | "locked" | "incomplete";

const pickDraft = (r: ProfileRow): ProfileDraft => Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, r[f]])) as ProfileDraft;
const toDb = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

// Unsaved typing is mirrored to this browser so a crash or a closed tab loses nothing.
const mirrorKey = (id: string) => `sp.unsaved.${id}`;
function readMirror(id: string): { at: number; values: Partial<ProfileDraft> } | null {
  try { const raw = localStorage.getItem(mirrorKey(id)); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function writeMirror(id: string, values: Partial<ProfileDraft>) { try { localStorage.setItem(mirrorKey(id), JSON.stringify({ at: Date.now(), values })); } catch { /* storage may be full or blocked */ } }
function clearMirror(id: string) { try { localStorage.removeItem(mirrorKey(id)); } catch { /* ignore */ } }

export default function Editor() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { user, membership, reloadMembership } = useAuth();

  const [row, setRow] = useState<ProfileRow | null>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [confirm, setConfirm] = useState<null | "submit" | "delete">(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const draftRef = useRef<ProfileDraft | null>(null);
  const dirty = useRef(new Set<EditableField>());
  const inflight = useRef<Promise<void> | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const attempt = useRef(0);
  const alive = useRef(true);
  // A submitted profile stays submitted and complete: edits save only while every required field is filled.
  const submittedRef = useRef(false);

  useTitle(draft?.name?.trim() ? `Editing ${draft.name.trim()}` : "New profile");

  // ── Load ──
  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const r = await api.getProfile(id);
      if (user && r.author_id !== user.id) { nav(`/profiles/${id}`, { replace: true }); return; }
      submittedRef.current = r.status === "submitted";
      if (submittedRef.current) setShowErrors(true);
      let d = pickDraft(r);
      const m = readMirror(id);
      if (m && m.at > Date.parse(r.updated_at)) {
        d = { ...d, ...m.values };
        (Object.keys(m.values) as EditableField[]).forEach((f) => dirty.current.add(f));
      } else if (m) clearMirror(id);
      draftRef.current = d;
      setRow(r); setDraft(d);
      if (dirty.current.size) schedule(0);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "We couldn't open this profile.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, nav]);

  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; window.clearTimeout(timer.current); }; }, [load]);

  // ── Autosave ──
  const flush = useCallback(async (): Promise<void> => {
    window.clearTimeout(timer.current);
    if (inflight.current) { await inflight.current; if (dirty.current.size) return flush(); return; }
    if (!dirty.current.size || !draftRef.current) return;
    if (submittedRef.current && missingFields(draftRef.current).length) { setSave("incomplete"); return; }
    const snapshot: Partial<Record<EditableField, unknown>> = {};
    dirty.current.forEach((f) => { snapshot[f] = draftRef.current?.[f]; });
    const patch = Object.fromEntries(Object.entries(snapshot).map(([k, v]) => [k, toDb(v)])) as Partial<ProfileDraft>;
    setSave("saving");
    const run = (async () => {
      try {
        const saved = await api.saveDraft(id, patch);
        attempt.current = 0;
        for (const [f, v] of Object.entries(snapshot)) if (draftRef.current?.[f as EditableField] === v) dirty.current.delete(f as EditableField);
        if (!alive.current) return;
        setRow(saved);
        if (dirty.current.size) { schedule(AUTOSAVE_MS); setSave("saving"); }
        else { clearMirror(id); setSave("saved"); }
      } catch (e) {
        if (!alive.current) return;
        const err = e as ApiError;
        if (err.kind === "locked" || err.kind === "denied" || err.kind === "notfound") { setSave("locked"); setLockedMsg(err.message); return; }
        attempt.current += 1;
        setSave("retrying");
        schedule(Math.min(MAX_BACKOFF_MS, 1000 * 2 ** (attempt.current - 1)));
      }
    })();
    inflight.current = run;
    try { await run; } finally { inflight.current = null; }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function schedule(ms: number) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void flush(); }, ms);
  }

  useEffect(() => {
    const online = () => { if (dirty.current.size) void flush(); };
    const leave = (e: BeforeUnloadEvent) => { if (dirty.current.size) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", leave);
    return () => { window.removeEventListener("online", online); window.removeEventListener("beforeunload", leave); };
  }, [flush]);

  function set<K extends EditableField>(field: K, value: ProfileDraft[K]) {
    if (!draftRef.current || save === "locked") return;
    const next = { ...draftRef.current, [field]: value };
    draftRef.current = next;
    setDraft(next);
    dirty.current.add(field);
    const unsaved: Partial<ProfileDraft> = {};
    dirty.current.forEach((f) => { (unsaved as Record<string, unknown>)[f] = next[f]; });
    writeMirror(id, unsaved);
    if (save !== "retrying") setSave(submittedRef.current && missingFields(next).length ? "incomplete" : "idle");
    schedule(save === "retrying" ? Math.max(AUTOSAVE_MS, 1000) : AUTOSAVE_MS);
  }

  // ── Validation ──
  const missing: Missing[] = useMemo(() => (draft ? missingFields(draft) : []), [draft]);
  const bad = (f: EditableField) => showErrors && missing.some((m) => m.field === f);

  function focusField(f: EditableField) {
    const el = document.getElementById(`f-${f}`);
    if (!el) return;
    el.focus({ preventScroll: true });
    el.closest(".field, .cap")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }

  function trySubmit() {
    setActionError(null);
    if (missing.length) {
      setShowErrors(true); setShakeKey((k) => k + 1);
      const first = missing[0];
      if (first) focusField(first.field);
      return;
    }
    setConfirm("submit");
  }

  async function doSubmit() {
    if (!draftRef.current) return;
    setBusy(true); setActionError(null);
    try {
      window.clearTimeout(timer.current);
      if (inflight.current) await inflight.current.catch(() => undefined);
      const full = Object.fromEntries(Object.entries(draftRef.current).map(([k, v]) => [k, toDb(v)])) as ProfileDraft;
      if (full.org_type !== "other") full.org_type_other = null;
      await api.submit(id, full);
      dirty.current.clear(); clearMirror(id);
      void reloadMembership();
      nav(`/profiles/${id}`, { replace: true, viewTransition: true, state: { justSubmitted: true } });
    } catch (e) {
      const err = e as ApiError;
      setBusy(false);
      if (err.kind === "missing") { setConfirm(null); setShowErrors(true); setShakeKey((k) => k + 1); return; }
      setActionError(err.message || "We couldn't submit this profile.");
    }
  }

  // Leaving a submitted profile: save what's there (if it's complete), then back to the read-only view.
  async function done() {
    setActionError(null);
    if (missing.length) { setShowErrors(true); setShakeKey((k) => k + 1); const first = missing[0]; if (first) focusField(first.field); return; }
    setBusy(true);
    await flush();
    if (dirty.current.size) { setBusy(false); setActionError("We couldn't save your last changes yet. They're kept in this browser; try Done again in a moment."); return; }
    nav(`/profiles/${id}`, { replace: true, viewTransition: true });
  }

  async function doDelete() {
    setBusy(true); setActionError(null);
    try {
      window.clearTimeout(timer.current);
      if (inflight.current) await inflight.current.catch(() => undefined);
      await api.deleteDraft(id);
      dirty.current.clear(); clearMirror(id);
      nav("/", { replace: true, viewTransition: true, state: { flash: "Draft deleted." } });
    } catch (e) {
      setBusy(false);
      setActionError(e instanceof Error ? e.message : "We couldn't delete this draft.");
    }
  }

  if (loadError) return <div className="page page-narrow"><ErrorNote message={loadError} onRetry={() => void load()} /><p style={{ marginTop: 16 }}><Link to="/" viewTransition>Your profiles</Link></p></div>;
  if (!draft || !row) return <Loader center label="Opening your profile" />;
  const closed = membership ? !membership.config.submissions_open : false;
  const readOnly = save === "locked" || closed;
  const isSubmitted = row.status === "submitted";

  const saveLabel =
    save === "saving" ? "Saving…" :
    save === "saved" ? "Saved" :
    save === "retrying" ? "Couldn't save, retrying" :
    save === "locked" ? "Not saved" :
    save === "incomplete" ? "Not saved: fill in what's missing" :
    dirty.current.size ? "Unsaved changes" : "All changes saved";

  return (
    <div className="page page-form">
      <nav className="crumb" aria-label="Back"><Link to="/" viewTransition>Your profiles</Link></nav>
      <div className="form-layout">
      <aside className="form-rail">
        <div className="rail-shape" aria-hidden="true"><CapGlyph p={{ ...row, ...draft }} size={88} label={false} /><span>{isSubmitted ? "Submitted" : "Draft"}</span></div>
        <LocalNav label="Sections of this profile" links={SECTIONS} rail />
      </aside>
      <form className="editor" noValidate onSubmit={(e) => { e.preventDefault(); trySubmit(); }} aria-describedby="save-state">
        <div className="form-head">
          <h1 className="h-title">{draft.name?.trim() || "A new player"}</h1>
          <p className="lede">{isSubmitted
            ? "You're editing a submitted profile. Changes save as you go, and it stays submitted. Facilitators can see that it was edited after you submitted it."
            : "Start in your own words, then give it some structure. Everything saves as you go. Nobody else sees this until you've submitted all of yours."}{!isSubmitted && <> <Link to="/tutorial" viewTransition>See an example first</Link>.</>}</p>
          {readOnly && <p className="note note-error" role="alert">{closed ? "Submissions are closed, so this profile can't be changed." : lockedMsg}</p>}
        </div>

        <fieldset className="part" id="s-own" disabled={readOnly}>
          <legend className="sr-only">Part 1: In your own words</legend>
          <h2 className="h-section part-title">In your own words</h2>

          <div className={`field${bad("name") ? " invalid" : ""}`}>
            <label className="label" htmlFor="f-name">Name of the player <span className="req" aria-hidden="true">*</span></label>
            <input id="f-name" className="input" type="text" autoComplete="off" value={draft.name ?? ""} onChange={(e) => set("name", e.target.value)} aria-required="true" aria-invalid={bad("name") || undefined} maxLength={200} />
            {bad("name") && <p className="err-text">Give this player a name.</p>}
          </div>

          <div className={`field${bad("org_type") ? " invalid" : ""}`}>
            <label className="label" htmlFor="f-org_type">Type <span className="req" aria-hidden="true">*</span></label>
            <select id="f-org_type" className="select" value={draft.org_type ?? ""} onChange={(e) => set("org_type", (e.target.value || null) as ProfileDraft["org_type"])} aria-required="true" aria-invalid={bad("org_type") || undefined}>
              <option value="">Choose a type</option>
              {ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {bad("org_type") && <p className="err-text">Pick the closest type, or Other.</p>}
          </div>

          {draft.org_type === "other" && (
            <div className={`field reveal-in${bad("org_type_other") ? " invalid" : ""}`}>
              <label className="label" htmlFor="f-org_type_other">What kind of player? <span className="req" aria-hidden="true">*</span></label>
              <input id="f-org_type_other" className="input" type="text" value={draft.org_type_other ?? ""} onChange={(e) => set("org_type_other", e.target.value)} aria-required="true" aria-invalid={bad("org_type_other") || undefined} maxLength={120} />
              {bad("org_type_other") && <p className="err-text">Say what kind of player this is.</p>}
            </div>
          )}

          <div className={`field${bad("description") ? " invalid" : ""}`}>
            <label className="label" htmlFor="f-description">Who they are <span className="req" aria-hidden="true">*</span></label>
            <p className="hint" id="h-description">In your own words: who they are, what real things they make, fix, teach, or help others make, and how they show up in the DC area.</p>
            <textarea id="f-description" className="textarea big" value={draft.description ?? ""} onChange={(e) => set("description", e.target.value)} aria-describedby="h-description" aria-required="true" aria-invalid={bad("description") || undefined} />
            {bad("description") && <p className="err-text">Write a few lines about who they are.</p>}
          </div>

          <div className="field">
            <label className="label" htmlFor="f-tried_before">What they've tried before <span className="opt">(optional)</span></label>
            <p className="hint" id="h-tried_before">Anything they've already tried in this area, and what got in the way. That history is evidence.</p>
            <Why id="archaeology" />
            <textarea id="f-tried_before" className="textarea" value={draft.tried_before ?? ""} onChange={(e) => set("tried_before", e.target.value)} aria-describedby="h-tried_before" />
          </div>
        </fieldset>

        <fieldset className="part" id="s-structure" disabled={readOnly}>
          <legend className="sr-only">Part 2: Give it structure</legend>
          <h2 className="h-section part-title">Give it structure</h2>

          <div id="s-ring" className={`field${bad("ring") ? " invalid" : ""}`} role="radiogroup" aria-labelledby="l-ring" aria-required="true">
            <p className="label" id="l-ring">Ring <span className="req" aria-hidden="true">*</span></p>
            <Why id="field" />
            <div className="choices">
              {RINGS.map((r, i) => (
                <label key={r.value} className="choice">
                  <input type="radio" name="ring" id={i === 0 ? "f-ring" : undefined} value={r.value} checked={draft.ring === r.value} onChange={() => set("ring", r.value)} />
                  <b>{r.label}</b><span>{r.hint}</span>
                </label>
              ))}
            </div>
            {bad("ring") && <p className="err-text">Choose a ring.</p>}
          </div>

          <div id="s-capitals" className="field">
            <p className="label" id="l-caps">What they bring <span className="req" aria-hidden="true">*</span></p>
            <p className="hint">Rate each of the seven capitals Low, Medium or High. Add a note wherever it helps.</p>
            <Why id="capitals" label="What are the capitals?" />
            <div className="caps" aria-labelledby="l-caps" role="group">
              {CAPITALS.map((c) => {
                const rf = ratingField(c.key), nf = noteField(c.key);
                return (
                  <div key={c.key} className={`cap${bad(rf) ? " invalid" : ""}`}>
                    <div className="cap-head">
                      <span className="cap-name" id={`l-${rf}`}>{c.label}</span>
                      <span className="cap-prompt" id={`p-${rf}`}>{c.prompt}</span>
                    </div>
                    <Segmented name={rf} value={draft[rf]} options={LEVELS} onChange={(v) => set(rf, v)} labelledBy={`l-${rf} p-${rf}`} idFirst={`f-${rf}`} invalid={bad(rf)} />
                    <div className="note-wrap">
                      <label className="sr-only" htmlFor={`f-${nf}`}>{c.label} capital note (optional)</label>
                      <input id={`f-${nf}`} className="input note-input" type="text" placeholder="Note (optional)" value={draft[nf] ?? ""} onChange={(e) => set(nf, e.target.value)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="s-connections" className={`field${bad("connections") ? " invalid" : ""}`}>
            <p className="label" id="l-connections">Who they're connected to <span className="req" aria-hidden="true">*</span></p>
            <p className="hint" id="h-connections">Other players this one works with, funds, hires from, hosts, or depends on. If you know which capital moves between them, say which and which way. One is enough to start.</p>
            <Why id="field" label="Why connections?" />
            <ConnectionsEditor value={draft.connections ?? []} onChange={(v) => set("connections", v)} invalid={bad("connections")} />
            {bad("connections") && <p className="err-text">Name at least one player this one is connected to.</p>}
          </div>

          <div id="s-needs" className={`field${bad("needs") ? " invalid" : ""}`}>
            <label className="label" htmlFor="f-needs">What they need <span className="req" aria-hidden="true">*</span></label>
            <textarea id="f-needs" className="textarea" value={draft.needs ?? ""} onChange={(e) => set("needs", e.target.value)} aria-required="true" aria-invalid={bad("needs") || undefined} />
            {bad("needs") && <p className="err-text">What do they need?</p>}
          </div>

          <div className="field">
            <label className="label" htmlFor="f-values_held">What they value <span className="opt">(optional)</span></label>
            <textarea id="f-values_held" className="textarea" value={draft.values_held ?? ""} onChange={(e) => set("values_held", e.target.value)} />
          </div>

          <div className="field">
            <label className="label" htmlFor="f-fears">What they fear or want to avoid <span className="opt">(optional)</span></label>
            <textarea id="f-fears" className="textarea" value={draft.fears ?? ""} onChange={(e) => set("fears", e.target.value)} />
          </div>

          <div id="s-influence" className={`field${bad("influence_level") ? " invalid" : ""}`}>
            <p className="label" id="l-influence">Influence <span className="req" aria-hidden="true">*</span></p>
            <p className="hint" id="h-influence">How much influence do they have in the ecosystem around The Labs?</p>
            <Segmented name="influence_level" value={draft.influence_level} options={LEVELS} onChange={(v) => set("influence_level", v)} labelledBy="l-influence h-influence" idFirst="f-influence_level" invalid={bad("influence_level")} />
            <label className="sr-only" htmlFor="f-influence_note">Influence note (optional)</label>
            <input id="f-influence_note" className="input optional" type="text" placeholder="Note (optional)" value={draft.influence_note ?? ""} onChange={(e) => set("influence_note", e.target.value)} />
            {bad("influence_level") && <p className="err-text">Choose Low, Medium or High.</p>}
          </div>

          <div id="s-stake" className={`field${bad("stake") ? " invalid" : ""}`}>
            <label className="label" htmlFor="f-stake">Stake <span className="req" aria-hidden="true">*</span></label>
            <p className="hint" id="h-stake">What do they stand to gain or lose?</p>
            <textarea id="f-stake" className="textarea" value={draft.stake ?? ""} onChange={(e) => set("stake", e.target.value)} aria-describedby="h-stake" aria-required="true" aria-invalid={bad("stake") || undefined} />
            {bad("stake") && <p className="err-text">What's at stake for them?</p>}
          </div>

          <div id="s-connection" className="field" role="radiogroup" aria-labelledby="l-role">
            <p className="label" id="l-role">Served, contributing, or both? <span className="opt">(optional)</span></p>
            <p className="hint">Every nonprofit has two kinds of customers: the people it helps and the people who keep it going. Pick one if you know.</p>
            <Why id="customers" />
            <div className="choices choices-4">
              {CUSTOMER_ROLES.map((r, i) => (
                <label key={r.value} className="choice">
                  <input type="radio" name="customer_role" id={i === 0 ? "f-customer_role" : undefined} value={r.value} checked={draft.customer_role === r.value} onChange={() => set("customer_role", r.value)} />
                  <b>{r.label}</b><span>{r.hint}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={`field${bad("connection_to_labs") ? " invalid" : ""}`}>
            <label className="label" htmlFor="f-connection_to_labs">How they could connect to The Labs <span className="req" aria-hidden="true">*</span></label>
            <p className="hint" id="h-connection">What would each side want from it?</p>
            <textarea id="f-connection_to_labs" className="textarea" value={draft.connection_to_labs ?? ""} onChange={(e) => set("connection_to_labs", e.target.value)} aria-describedby="h-connection" aria-required="true" aria-invalid={bad("connection_to_labs") || undefined} />
            {bad("connection_to_labs") && <p className="err-text">How could they connect to The Labs?</p>}
          </div>
        </fieldset>

        {showErrors && missing.length > 0 && (
          <div key={shakeKey} className="summary shake" role="alert" style={{ marginTop: 32 }}>
            <p><strong>{missing.length === 1 ? "One thing is" : `${missing.length} things are`} {isSubmitted ? " missing. A submitted profile needs these to save:" : " still missing before you can submit:"}</strong></p>
            <ul>{missing.map((m) => <li key={m.field}><a href={`#f-${m.field}`} onClick={(e) => { e.preventDefault(); focusField(m.field); }}>{m.label}</a></li>)}</ul>
          </div>
        )}
        {actionError && !confirm && <p className="note note-error" role="alert" style={{ marginTop: 16 }}>{actionError}</p>}

        <div className="dock">
          <span id="save-state" className={`savestate${save === "saved" ? " ok" : save === "retrying" || save === "locked" || save === "incomplete" ? " err" : save === "saving" ? " busy" : ""}`} role="status" aria-live="polite">
            {save === "saved" && <Tick key={row.updated_at} />}{saveLabel}
          </span>
          <div className="act">
            {!readOnly && !isSubmitted && <button type="button" className="btn-link quiet" onClick={() => setConfirm("delete")}>Delete draft</button>}
            {!readOnly && !isSubmitted && <button type="submit" className="btn btn-primary">Submit profile</button>}
            {isSubmitted && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void done()}>Done</button>}
          </div>
        </div>
      </form>
      </div>

      <ConfirmDialog open={confirm === "submit"} title="Submit this profile?" confirmLabel="Submit profile" busy={busy}
        onConfirm={() => void doSubmit()} onCancel={() => { setConfirm(null); setActionError(null); }}>
        <p>Once it's submitted, it counts toward your three. You can still come back and edit it while submissions are open.</p>
        {actionError && <p className="err-text" role="alert" style={{ marginTop: 8 }}>{actionError}</p>}
      </ConfirmDialog>
      <ConfirmDialog open={confirm === "delete"} title="Delete this draft?" confirmLabel="Delete draft" danger busy={busy}
        onConfirm={() => void doDelete()} onCancel={() => { setConfirm(null); setActionError(null); }}>
        <p>This can't be undone.</p>
        {actionError && <p className="err-text" role="alert" style={{ marginTop: 8 }}>{actionError}</p>}
      </ConfirmDialog>
    </div>
  );
}
