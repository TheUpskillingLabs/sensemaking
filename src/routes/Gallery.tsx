import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { DiscussionPrompts, ReadTheField } from "../components/Learn";
import { Status, CapStrip, ErrorNote, Loader, Words, useTitle } from "../components/bits";
import { api } from "../lib/api";
import { CAPITALS, LEVELS, ORG_TYPES, RINGS, RING_LABEL, typeLabel } from "../lib/capitals";
import { CYCLE } from "../lib/config";
import { downloadCsv, toCsv } from "../lib/csv";
import { applyFilters, readFilters, sortRows, writeFilters, type Filters } from "../lib/filters";
import type { AuthorName, ProfileRow } from "../lib/types";

export function useGalleryData(includeDrafts: boolean) {
  const [rows, setRows] = useState<ProfileRow[] | null>(null);
  const [names, setNames] = useState<AuthorName[]>([]);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, n] = await Promise.all([api.listAll(includeDrafts), includeDrafts ? api.authorNames().catch(() => []) : Promise.resolve([])]);
      setRows(sortRows(r)); setNames(n);
    } catch (e) { setError(e instanceof Error ? e.message : "We couldn't load the profiles."); }
  }, [includeDrafts]);
  useEffect(() => { void load(); }, [load]);
  return { rows, names, error, reload: load };
}

export default function Gallery() {
  useTitle("Gallery");
  const { membership } = useAuth();
  const [sp, setSp] = useSearchParams();
  const f = readFilters(sp);
  const facilitator = Boolean(membership?.facilitator);
  const allowed = Boolean(membership && (membership.unlocked || facilitator));
  const { rows, names, error, reload } = useGalleryData(facilitator);
  const [q, setQ] = useState(f.q);
  const qTimer = useRef<number | undefined>(undefined);

  const update = (patch: Partial<Filters>) => setSp(writeFilters({ ...f, ...patch }), { replace: true });
  useEffect(() => () => window.clearTimeout(qTimer.current), []);

  const shown = useMemo(() => (rows ? applyFilters(rows, f, facilitator) : []), [rows, sp, facilitator]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => ({ submitted: rows?.filter((r) => r.status === "submitted").length ?? 0, drafts: rows?.filter((r) => r.status === "draft").length ?? 0 }), [rows]);

  if (!membership) return <Loader center />;
  if (!allowed) {
    return <Navigate to="/" replace state={{ flash: `The gallery opens once you've submitted ${membership.config.required_profiles} profiles. That keeps everyone's view independent.` }} />;
  }

  const nameOf = (id: string) => names.find((n) => n.author_id === id)?.display_name;
  const filtered = Boolean(f.type || f.ring || (f.cap && f.level) || f.q.trim());
  const qs = sp.toString();

  return (
    <div className="page">
      <header className="hero">
        <p className="kicker rv">Build Cycle C04 · Everyone's view</p>
        <h1 className="display rv"><Words text="The field, as we each see it." /></h1>
        <p className="lede rv">Every submitted profile, side by side. Look for players many people saw, players only one person saw, and places where the views disagree.</p>
      </header>
      <div className="guides">
        <ReadTheField />
        {facilitator && <DiscussionPrompts />}
      </div>

      <form className="filters rv" role="search" onSubmit={(e) => e.preventDefault()} aria-label="Filter profiles">
        <div className="field">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" className="input" type="search" placeholder="Name, description, needs, connection" value={q}
            onChange={(e) => { const v = e.target.value; setQ(v); window.clearTimeout(qTimer.current); qTimer.current = window.setTimeout(() => update({ q: v }), 250); }} />
        </div>
        <div className="field">
          <label className="label" htmlFor="ft">Type</label>
          <select id="ft" className="select" value={f.type} onChange={(e) => update({ type: e.target.value as Filters["type"] })}>
            <option value="">All types</option>
            {ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="fr">Ring</label>
          <select id="fr" className="select" value={f.ring} onChange={(e) => update({ ring: e.target.value as Filters["ring"] })}>
            <option value="">Both rings</option>
            {RINGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <fieldset className="field">
          <legend className="label">Capital rated</legend>
          <div className="capfilter">
            <label className="sr-only" htmlFor="fc">Capital</label>
            <select id="fc" className="select" value={f.cap} onChange={(e) => update({ cap: e.target.value as Filters["cap"], level: e.target.value ? f.level || "high" : "" })}>
              <option value="">Any capital</option>
              {CAPITALS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <label className="sr-only" htmlFor="fl">Rating</label>
            <select id="fl" className="select" value={f.level} disabled={!f.cap} onChange={(e) => update({ level: e.target.value as Filters["level"] })}>
              {!f.cap && <option value="">—</option>}
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </fieldset>
      </form>

      <div className="toolbar rv">
        <p className="count" aria-live="polite">
          {rows ? <>{shown.length} {shown.length === 1 ? "profile" : "profiles"}{filtered ? " match" : ""}</> : "Loading…"}
          {facilitator && rows && <> · {counts.submitted} submitted, {counts.drafts} {counts.drafts === 1 ? "draft" : "drafts"} in progress</>}
        </p>
        <div className="act">
          {filtered && <button type="button" className="btn-link" onClick={() => { setQ(""); setSp(writeFilters({ type: "", ring: "", cap: "", level: "", q: "", drafts: f.drafts }), { replace: true }); }}>Clear filters</button>}
          {facilitator && (
            <label className="toggle"><input type="checkbox" checked={f.drafts} onChange={(e) => update({ drafts: e.target.checked })} /> Include drafts</label>
          )}
          {facilitator && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={!rows || shown.length === 0}
              onClick={() => downloadCsv(`stakeholder-profiles-${CYCLE}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(shown, nameOf))}>Export CSV</button>
          )}
          <Link className="btn btn-primary btn-sm" to={`/print${qs ? `?${qs}` : ""}`}>Print cards</Link>
        </div>
      </div>

      <p className="legend rv" aria-hidden="true">
        <span className="cd cd-high"><i />High</span>
        <span className="cd cd-medium"><i />Medium</span>
        <span className="cd cd-low"><i />Low</span>
        <span className="cd cd-none"><i />Not rated</span>
        <span>Capitals: {CAPITALS.map((c) => c.label).join(", ")}</span>
      </p>

      {error ? <ErrorNote message={error} onRetry={() => void reload()} />
        : !rows ? <Loader label="Gathering everyone's profiles" />
        : shown.length === 0 ? <p className="empty rv">{rows.length === 0 ? "No profiles have been submitted yet." : "Nothing matches these filters."}</p>
        : (
          <ul className="grid">
            {shown.map((p) => (
              <li key={p.id} className="gcard rv">
                <Link to={`/profiles/${p.id}`} viewTransition>
                  <p className="gmeta">
                    {[p.org_type ? typeLabel(p) : null, p.ring ? RING_LABEL[p.ring] : null].filter(Boolean).join(" · ")}
                    {p.status === "draft" && <Status kind="draft">Draft</Status>}
                    {facilitator && p.edited_at && <Status kind="edited">Edited</Status>}
                  </p>
                  <h3>{p.name?.trim() || "Untitled player"}</h3>
                  {facilitator && nameOf(p.author_id) && <p className="gauthor">by {nameOf(p.author_id)}</p>}
                  <p>{p.description}</p>
                  <CapStrip p={p} />
                </Link>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
