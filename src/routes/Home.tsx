import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { ErrorNote, Loader, useTitle } from "../components/bits";
import { api } from "../lib/api";
import { typeLabel } from "../lib/capitals";
import type { ProfileRow } from "../lib/types";

const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const inWords = (n: number) => words[n] ?? String(n);

export default function Home() {
  useTitle("My profiles");
  const { membership, reloadMembership } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const flash = (loc.state as { flash?: string } | null)?.flash;
  const [rows, setRows] = useState<ProfileRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setRows(await api.listMine()); } catch (e) { setError(e instanceof Error ? e.message : "We couldn't load your profiles."); }
  }, []);
  useEffect(() => { void load(); void reloadMembership(); }, [load, reloadMembership]);

  if (!membership) return <Loader center />;
  const required = membership.config.required_profiles;
  const open = membership.config.submissions_open;
  const submitted = rows?.filter((r) => r.status === "submitted").length ?? 0;
  const unlocked = membership.unlocked || submitted >= required;
  const pct = Math.min(100, Math.round((submitted / required) * 100));

  async function create() {
    setCreating(true); setCreateError(null);
    try {
      const row = await api.createDraft();
      nav(`/profiles/${row.id}/edit`, { viewTransition: true });
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "We couldn't start a new profile.");
      setCreating(false);
    }
  }

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <p className="eyebrow rv">Build Cycle C04 · Sensemaking</p>
        <h1 className="h1 rv">My profiles</h1>
        <p className="lede rv">Write one profile for each player you see around The Labs in DC: a library, an employer, an agency, a community group, a training provider, anyone who matters here.</p>
      </div>

      {flash && <div className="note note-info rv" role="status" style={{ marginBottom: 24 }}>{flash}</div>}

      <section className="progress rv" aria-label="Your progress">
        <p className="progress-count" aria-live="polite">{rows ? `${submitted} of ${required} submitted` : "Counting…"}</p>
        <div className={`meter${submitted >= required ? " done" : ""}`} role="progressbar" aria-valuemin={0} aria-valuemax={required} aria-valuenow={Math.min(submitted, required)} aria-label="Profiles submitted"
          style={{ ["--pct" as string]: `${rows ? pct : 0}%` }}><span /></div>
      </section>

      <div className="stack" style={{ ["--s" as string]: "24px", marginTop: 32 }}>
        {!unlocked && !membership.facilitator && (
          <p className="note rv">Once you've submitted your {inWords(required)}, you'll be able to read everyone else's. Until then, nobody sees yours and you don't see theirs. That keeps everyone's view independent.</p>
        )}
        {membership.facilitator && !unlocked && (
          <p className="note note-info rv">You're a facilitator, so you can already read every profile, drafts included. <Link to="/gallery" viewTransition>Open the gallery</Link>.</p>
        )}
        {unlocked && (
          <div className="note note-info rv">
            <p className="h3" style={{ marginBottom: 8 }}>You've unlocked the gallery.</p>
            <p className="muted" style={{ marginBottom: 16 }}>Read what everyone else saw. Anything you write from here on won't be independent of theirs, and that's fine.</p>
            <Link className="btn btn-primary" to="/gallery" viewTransition>Read everyone's profiles <span className="nudge" aria-hidden="true">→</span></Link>
          </div>
        )}
        {!open && <p className="note rv" role="status"><strong>Submissions are closed.</strong> You can still read your profiles, but you can't start or edit any.</p>}

        <div className="act rv" style={{ justifyContent: "space-between" }}>
          <h2 className="h3">Your profiles</h2>
          {open && (
            <button type="button" className="btn btn-primary" onClick={() => void create()} disabled={creating} aria-busy={creating}>
              {creating ? "Starting…" : <>New profile <span className="arrow" aria-hidden="true">+</span></>}
            </button>
          )}
        </div>
        {createError && <ErrorNote title="Couldn't start a profile" message={createError} />}

        {error ? <ErrorNote message={error} onRetry={() => void load()} />
          : !rows ? <Loader label="Loading your profiles" />
          : rows.length === 0 ? <p className="empty rv">No profiles yet. Start with a player you know well.</p>
          : (
            <ul className="plist">
              {rows.map((r) => (
                <li key={r.id} className="pitem rv">
                  <Link to={r.status === "draft" && open ? `/profiles/${r.id}/edit` : `/profiles/${r.id}`} viewTransition>
                    <span className="pname">{r.name?.trim() || "Untitled player"}</span>
                    <span className="pmeta">
                      <span className={`badge ${r.status === "draft" ? "badge-draft" : "badge-sub"}`}>{r.status === "draft" ? "Draft" : "Submitted"}</span>
                      {r.org_type ? <> · {typeLabel(r)}</> : null}
                    </span>
                    <span className="arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
