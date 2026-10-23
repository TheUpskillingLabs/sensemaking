import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { ErrorNote, GroupShape, Loader, useTitle } from "../components/bits";
import { PhotoReader, ProfilePicker, useSubmittedProfiles } from "../components/GroupEditor";
import { api } from "../lib/api";
import { CAPITALS } from "../lib/capitals";
import { summarize } from "../lib/group";
import type { Level } from "../lib/types";
import { ratingField } from "../lib/capitals";

/* Making a group: photograph a cluster of printed cards (or pick by hand),
   check who's in it, name it, save. */

export default function GroupScan() {
  useTitle("New group");
  const { membership } = useAuth();
  const nav = useNavigate();
  const { rows, error, reload } = useSubmittedProfiles();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);

  const members = useMemo(() => (rows ?? []).filter((r) => selected.has(r.id)), [rows, selected]);
  const sum = useMemo(() => summarize(members), [members]);

  if (!membership) return <Loader center />;
  if (!(membership.unlocked || membership.facilitator)) return <Navigate to="/" replace />;

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  async function save() {
    if (!name.trim()) { setNameError(true); document.getElementById("g-name")?.focus(); return; }
    setSaving(true); setSaveError(null);
    try {
      const g = await api.createGroup({ name: name.trim(), note: note.trim() || null, profile_ids: [...selected] });
      nav(`/groups/${g.id}`, { replace: true, viewTransition: true });
    } catch (e) { setSaveError(e instanceof Error ? e.message : "We couldn't save the group."); setSaving(false); }
  }

  return (
    <div className="page group-new">
      <nav className="crumb" aria-label="Back"><Link to="/groups" viewTransition>Groups</Link></nav>
      <header className="intro intro-tight">
        <h1 className="h-title">New group</h1>
        <p className="lede">Photograph a cluster of cards from the table. The app reads the code on each card and averages the profiles into one stakeholder group.</p>
      </header>

      {error ? <ErrorNote message={error} onRetry={() => void reload()} /> : !rows ? <Loader label="Loading the profiles" /> : (
        <div className="gn-layout">
          <section className="gn-step" aria-labelledby="gn-1">
            <h2 className="h-section" id="gn-1">The cards</h2>
            <PhotoReader rows={rows} onFound={(ids) => setSelected((s) => new Set([...s, ...ids]))} />
            <div className="gn-found">
              <p className="gn-count"><b>{selected.size}</b> {selected.size === 1 ? "profile" : "profiles"} in this group</p>
              {members.length > 0 && (
                <ul className="gn-members">
                  {members.map((p) => (
                    <li key={p.id}><span>{p.name?.trim() || "Untitled player"}</span>
                      <button type="button" className="btn-link quiet" onClick={() => toggle(p.id)} aria-label={`Remove ${p.name ?? "this profile"}`}>Remove</button></li>
                  ))}
                </ul>
              )}
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setPicking((v) => !v)} aria-expanded={picking}>{picking ? "Done picking" : "Add or remove by hand"}</button>
              {picking && <ProfilePicker rows={rows} selected={selected} onToggle={toggle} />}
            </div>
          </section>

          <section className="gn-step" aria-labelledby="gn-2">
            <h2 className="h-section" id="gn-2">Name it</h2>
            <div className={`field${nameError ? " invalid" : ""}`}>
              <label className="label" htmlFor="g-name">What would you call this group? <span className="req" aria-hidden="true">*</span></label>
              <input id="g-name" className="input" type="text" maxLength={120} value={name} onChange={(e) => { setName(e.target.value); setNameError(false); }} placeholder="For example: Neighborhood anchors" aria-required="true" aria-invalid={nameError || undefined} />
              {nameError && <p className="err-text">Give the group a name.</p>}
            </div>
            <div className="field">
              <label className="label" htmlFor="g-note">Why these belong together <span className="opt">(optional)</span></label>
              <textarea id="g-note" className="textarea" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {members.length > 0 && (
              <div className="gn-preview">
                <GroupShape means={CAPITALS.map((c) => sum.capitals[c.key].mean)} members={members.map((p) => CAPITALS.map((c) => p[ratingField(c.key)] as Level | null))} size={120} labels title="The group's capitals, averaged" />
                <p className="muted">The bold shape is the average of {members.length} {members.length === 1 ? "profile" : "profiles"}; the faint ones are each profile.</p>
              </div>
            )}
            {saveError && <ErrorNote title="Couldn't save" message={saveError} />}
            <div className="gn-act">
              <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving || selected.size === 0} aria-busy={saving}>{saving ? "Saving…" : "Save group"}</button>
              {selected.size === 0 && <span className="muted small">Add at least one profile first.</span>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
