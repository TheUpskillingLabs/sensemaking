import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";
import { ConfirmDialog, ErrorNote, GroupShape, Loader, kindOf, useTitle } from "../components/bits";
import { PhotoReader, ProfilePicker, useSubmittedProfiles } from "../components/GroupEditor";
import { api } from "../lib/api";
import { CAPITALS, CAPITAL_LABEL, DIRECTION_LABEL, LEVEL_LABEL, ratingField } from "../lib/capitals";
import { ROLE_NAMES, agreement, countOf, meanLabel, summarize, type Averaged } from "../lib/group";
import type { GroupRow, Level, ProfileRow } from "../lib/types";

/* One stakeholder group: the profiles in it, averaged. Means sit beside their
   spread, because where people disagree is as useful as the average. */

function SpreadBar({ a }: { a: Averaged }) {
  const total = a.spread.low + a.spread.medium + a.spread.high + a.spread.unsure;
  if (!total) return <span className="muted">No ratings</span>;
  const parts: [keyof typeof a.spread, string][] = [["low", "Low"], ["medium", "Medium"], ["high", "High"], ["unsure", "Not sure"]];
  return (
    <span className="spread" role="img" aria-label={parts.filter(([k]) => a.spread[k]).map(([k, l]) => `${a.spread[k]} ${l.toLowerCase()}`).join(", ")}>
      {parts.map(([k]) => a.spread[k] ? <i key={k} className={`sp-${k}`} style={{ flexGrow: a.spread[k] }} /> : null)}
    </span>
  );
}

function AgreeTag({ a }: { a: Averaged }) {
  const g = agreement(a.spread);
  if (!g) return null;
  return <span className={`agree agree-${g}`}>{g === "agree" ? "Everyone agreed" : g === "mixed" ? "Some difference" : "Split: low and high"}</span>;
}

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

export default function Group() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { user, membership } = useAuth();
  const { rows, error: rowsError, reload } = useSubmittedProfiles();
  const [g, setG] = useState<GroupRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());
  const [draftName, setDraftName] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useTitle(g?.name ?? "Group");

  const load = useCallback(async () => {
    setError(null);
    try { setG(await api.getGroup(id)); } catch (e) { setError(e instanceof Error ? e.message : "We couldn't open this group."); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const byId = useMemo(() => new Map((rows ?? []).map((r) => [r.id, r])), [rows]);
  const members = useMemo(() => (g ? g.profile_ids.map((pid) => byId.get(pid)).filter((p): p is ProfileRow => Boolean(p)) : []), [g, byId]);
  const missing = g ? g.profile_ids.length - members.length : 0;
  const sum = useMemo(() => summarize(members), [members]);

  if (!membership) return <Loader center />;
  if (!(membership.unlocked || membership.facilitator)) return <Navigate to="/" replace />;
  const canEdit = Boolean(g && user && (g.created_by === user.id || membership.facilitator));

  function startEdit() { if (!g) return; setDraftIds(new Set(g.profile_ids)); setDraftName(g.name); setDraftNote(g.note ?? ""); setEditing(true); setActionError(null); }
  async function saveEdit() {
    if (!g || !draftName.trim()) return;
    setBusy(true); setActionError(null);
    try { setG(await api.updateGroup(g.id, { name: draftName.trim(), note: draftNote.trim() || null, profile_ids: [...draftIds] })); setEditing(false); }
    catch (e) { setActionError(e instanceof Error ? e.message : "We couldn't save the group."); }
    finally { setBusy(false); }
  }
  async function doDelete() {
    if (!g) return;
    setBusy(true);
    try { await api.deleteGroup(g.id); nav("/groups", { replace: true, viewTransition: true }); }
    catch (e) { setActionError(e instanceof Error ? e.message : "We couldn't delete the group."); setBusy(false); setConfirmDelete(false); }
  }
  const toggle = (pid: string) => setDraftIds((s) => { const n = new Set(s); if (n.has(pid)) n.delete(pid); else n.add(pid); return n; });

  if (error) return <div className="page"><nav className="crumb" aria-label="Back"><Link to="/groups" viewTransition>Groups</Link></nav><ErrorNote message={error} onRetry={() => void load()} /></div>;
  if (!g || !rows) return rowsError ? <div className="page"><ErrorNote message={rowsError} onRetry={() => void reload()} /></div> : <Loader center label="Opening the group" />;

  return (
    <div className="page page-doc group-page">
      <nav className="crumb" aria-label="Back"><Link to="/groups" viewTransition>Groups</Link>
        {canEdit && !editing && <button type="button" className="btn btn-quiet btn-sm" onClick={startEdit}>Edit group</button>}</nav>

      {editing ? (
        <section className="gn-step group-edit" aria-label="Edit group">
          <div className="field"><label className="label" htmlFor="ge-name">Name</label><input id="ge-name" className="input" value={draftName} maxLength={120} onChange={(e) => setDraftName(e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="ge-note">Why these belong together <span className="opt">(optional)</span></label><textarea id="ge-note" className="textarea" value={draftNote} maxLength={2000} onChange={(e) => setDraftNote(e.target.value)} /></div>
          <p className="label">Profiles <span className="opt">({draftIds.size})</span></p>
          <PhotoReader known={new Set(rows.map((r) => r.id))} onFound={(ids) => setDraftIds((s) => new Set([...s, ...ids]))} />
          <ProfilePicker rows={rows} selected={draftIds} onToggle={toggle} />
          {actionError && <ErrorNote title="Couldn't save" message={actionError} />}
          <div className="gn-act">
            <button type="button" className="btn btn-primary" onClick={() => void saveEdit()} disabled={busy || !draftName.trim()}>{busy ? "Saving…" : "Save changes"}</button>
            <button type="button" className="btn btn-quiet" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
            <button type="button" className="btn-link quiet" onClick={() => setConfirmDelete(true)} disabled={busy}>Delete group</button>
          </div>
        </section>
      ) : (
        <article className="group-view">
          <header className="group-head">
            <GroupShape means={CAPITALS.map((c) => sum.capitals[c.key].mean)} members={members.map((p) => CAPITALS.map((c) => p[ratingField(c.key)] as Level | null))} size={168} labels title="The group's capitals: the average of its profiles, with each profile faint behind" />
            <div>
              <h1 className="h-display group-title">{g.name}</h1>
              <p className="card-meta"><span>{members.length} {members.length === 1 ? "profile" : "profiles"}</span>{sum.types.slice(0, 3).map((t) => <span key={t.label}>{countOf(t.count, t.label)}</span>)}</p>
              {g.note && <p className="group-note">{g.note}</p>}
              {missing > 0 && <p className="muted small">{missing} {missing === 1 ? "profile in this group isn't" : "profiles in this group aren't"} open to you, or {missing === 1 ? "was" : "were"} deleted.</p>}
            </div>
          </header>

          {members.length === 0 ? <p className="empty">No profiles in this group yet.{canEdit ? " Edit it to add some." : ""}</p> : (
            <>
              <section className="gv-sec" aria-labelledby="gv-caps">
                <h2 className="h-section" id="gv-caps">What they bring, on average</h2>
                <p className="hint">The average leaves out "not sure". The bar shows how the answers split: gold low, teal medium, white high, grey not sure.</p>
                <table className="gv-caps">
                  <thead><tr><th scope="col">Capital</th><th scope="col">Average</th><th scope="col">How people rated it</th></tr></thead>
                  <tbody>
                    {CAPITALS.map((c) => { const a = sum.capitals[c.key]; return (
                      <tr key={c.key}><th scope="row">{c.label}</th><td><b>{meanLabel(a.mean)}</b>{a.mean !== null && <span className="gv-num"> {a.mean.toFixed(1)}</span>}</td><td><SpreadBar a={a} /> <AgreeTag a={a} /></td></tr>
                    ); })}
                    <tr className="gv-inf"><th scope="row">Influence</th><td><b>{meanLabel(sum.influence.mean)}</b>{sum.influence.mean !== null && <span className="gv-num"> {sum.influence.mean.toFixed(1)}</span>}</td><td><SpreadBar a={sum.influence} /> <AgreeTag a={sum.influence} /></td></tr>
                  </tbody>
                </table>
              </section>

              <section className="gv-sec gv-grid" aria-label="Where they sit">
                <div>
                  <h2 className="gv-h">Inner circle or wider field</h2>
                  <p className="gv-bar"><span>Inner circle</span><b>{sum.rings.inner_circle}</b><i style={{ width: `${pct(sum.rings.inner_circle, members.length)}%` }} /></p>
                  <p className="gv-bar"><span>Wider field</span><b>{sum.rings.wider_field}</b><i style={{ width: `${pct(sum.rings.wider_field, members.length)}%` }} /></p>
                </div>
                <div>
                  <h2 className="gv-h">Serving, contributing, sustaining</h2>
                  {(["serving", "contributing", "sustaining"] as const).map((r) => <p key={r} className="gv-bar"><span>{ROLE_NAMES[r]}</span><b>{sum.roles[r]}</b><i style={{ width: `${pct(sum.roles[r], members.length)}%` }} /></p>)}
                  {(sum.roles.unsure > 0 || sum.roles.none > 0) && <p className="muted small">{sum.roles.unsure ? `${sum.roles.unsure} not sure` : ""}{sum.roles.unsure && sum.roles.none ? ", " : ""}{sum.roles.none ? `${sum.roles.none} with no tie marked` : ""}.</p>}
                </div>
              </section>

              {sum.connections.length > 0 && (
                <section className="gv-sec" aria-labelledby="gv-conns">
                  <h2 className="h-section" id="gv-conns">Who they're connected to</h2>
                  <p className="hint">Merged across the group, most-mentioned first. Players already in this group are left out.</p>
                  <ul className="gv-conns">
                    {sum.connections.slice(0, 24).map((c) => (
                      <li key={c.name}><b>{c.name}</b><span className="gv-cnt">{c.count} of {members.length}</span>
                        {c.capitals.length > 0 && <span className="gv-flow">{c.capitals.slice(0, 3).map((f) => `${CAPITAL_LABEL[f.capital].toLowerCase()}${f.direction ? `, ${DIRECTION_LABEL[f.direction]}` : ""}${f.count > 1 ? ` (${f.count})` : ""}`).join("; ")}</span>}</li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="gv-sec" aria-labelledby="gv-voices">
                <h2 className="h-section" id="gv-voices">In their own words</h2>
                <p className="hint">What each profile said they need and what's at stake for them.</p>
                <ul className="gv-voices">
                  {members.map((p) => (
                    <li key={p.id}>
                      <p className="gv-who"><Link to={`/profiles/${p.id}`} viewTransition>{p.name?.trim() || "Untitled player"}</Link><span>{kindOf(p)}</span></p>
                      {p.needs?.trim() && <p><b>Needs</b> {p.needs.trim()}</p>}
                      {p.stake?.trim() && <p><b>At stake</b> {p.stake.trim()}</p>}
                      {p.influence_level && <p className="muted small">Influence: {LEVEL_LABEL[p.influence_level].toLowerCase()}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </article>
      )}

      <ConfirmDialog open={confirmDelete} title="Delete this group?" confirmLabel="Delete group" danger busy={busy} onConfirm={() => void doDelete()} onCancel={() => setConfirmDelete(false)}>
        <p>The profiles stay as they are. Only the group goes.</p>
      </ConfirmDialog>
    </div>
  );
}
