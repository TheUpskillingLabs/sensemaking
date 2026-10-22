import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { DiscussionPrompts, ReadTheField } from "../components/Learn";
import { CapGlyph, ErrorNote, GlyphKey, Loader, Words, kindOf, useTitle } from "../components/bits";
import { api } from "../lib/api";
import { CAPITALS, CUSTOMER_ROLES, CUSTOMER_ROLE_LABEL, LEVELS, ORG_TYPES, RINGS, opensLabel, opensLater } from "../lib/capitals";
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
    const when = opensLater(membership.config.gallery_opens_at) ? opensLabel(membership.config.gallery_opens_at, true) : null;
    return <Navigate to="/" replace state={{ flash: when ? `The gallery opens ${when}, to everyone who has submitted ${membership.config.required_profiles} profiles.` : `The gallery opens once you've submitted ${membership.config.required_profiles} profiles. That keeps everyone's view independent.` }} />;
  }

  const nameOf = (id: string) => names.find((n) => n.author_id === id)?.display_name;
  const filtered = Boolean(f.type || f.ring || f.role || (f.cap && f.level) || f.q.trim());
  const qs = sp.toString();

  return (
    <div className="page">
      <header className="intro">
        <h1 className="h-display"><Words text="Gallery" /></h1>
        <p className="lede">Every submitted profile, side by side. Look for players many people saw, players only one person saw, and places where the views disagree.</p>
      </header>
      <div className="guides">
        <ReadTheField />
        {facilitator && <DiscussionPrompts />}
      </div>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()} aria-label="Filter profiles">
        <div className="field">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" className="input" type="search" placeholder="A name, a word, a connection" value={q}
            onChange={(e) => { const v = e.target.value; setQ(v); window.clearTimeout(qTimer.current); qTimer.current = window.setTimeout(() => update({ q: v }), 250); }} />
        </div>
        <div className="field">
          <label className="label" htmlFor="ft">Type of player</label>
          <select id="ft" className="select" value={f.type} onChange={(e) => update({ type: e.target.value as Filters["type"] })}>
            <option value="">All types</option>
            {ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="fr">Inner or wider</label>
          <select id="fr" className="select" value={f.ring} onChange={(e) => update({ ring: e.target.value as Filters["ring"] })}>
            <option value="">Inner and wider</option>
            {RINGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="fro">Served or contributing</label>
          <select id="fro" className="select" value={f.role} onChange={(e) => update({ role: e.target.value as Filters["role"] })}>
            <option value="">Any</option>
            {CUSTOMER_ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <fieldset className="field">
          <legend className="label">Rated for a capital</legend>
          <div className="capfilter">
            <label className="sr-only" htmlFor="fc">Capital</label>
            <select id="fc" className="select" value={f.cap} onChange={(e) => update({ cap: e.target.value as Filters["cap"], level: e.target.value ? f.level || "high" : "" })}>
              <option value="">Any</option>
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

      <div className="toolbar">
        <p className="count" aria-live="polite">
          {rows ? <>{shown.length} {shown.length === 1 ? "profile" : "profiles"}{filtered ? " match" : ""}</> : "Loading…"}
          {facilitator && rows && <span className="count-sub">{counts.submitted} submitted, {counts.drafts} {counts.drafts === 1 ? "draft" : "drafts"} in progress</span>}
        </p>
        <div className="act">
          {filtered && <button type="button" className="btn-link" onClick={() => { setQ(""); setSp(writeFilters({ type: "", ring: "", role: "", cap: "", level: "", q: "", drafts: f.drafts }), { replace: true }); }}>Clear filters</button>}
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

      <GlyphKey />

      {error ? <ErrorNote message={error} onRetry={() => void reload()} />
        : !rows ? <Loader label="Gathering everyone's profiles" />
        : shown.length === 0 ? <p className="empty">{rows.length === 0 ? "No profiles have been submitted yet." : "Nothing matches these filters."}</p>
        : (
          <ul className="grid">
            {shown.map((p) => (
              <li key={p.id} className={`gitem${p.status === "draft" ? " is-draft" : ""}`}>
                <CapGlyph p={p} size={64} />
                <div className="gbody">
                  <h3><Link to={`/profiles/${p.id}`} viewTransition>{p.name?.trim() || "Untitled player"}</Link></h3>
                  <p className="gkind">{kindOf(p)}{p.customer_role && <span>{CUSTOMER_ROLE_LABEL[p.customer_role]}</span>}{p.status === "draft" && <span className="state state-draft">Draft</span>}{facilitator && p.edited_at && <span className="state">Edited</span>}</p>
                  <p className="gdesc">{p.description}</p>
                  {facilitator && nameOf(p.author_id) && <p className="gauthor">{nameOf(p.author_id)}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
