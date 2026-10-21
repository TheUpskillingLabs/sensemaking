import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { ErrorNote, Loader, Status, Words, useTitle } from "../components/bits";
import { api } from "../lib/api";
import { RING_LABEL, typeLabel } from "../lib/capitals";
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

  // Your required profiles as numbered columns (submitted first, then drafts, then empty slots); any extras
  // are listed after them.
  const ordered = rows ? [...rows].sort((x, y) => (x.status === y.status ? Date.parse(y.updated_at) - Date.parse(x.updated_at) : x.status === "submitted" ? -1 : 1)) : [];
  const slots = Array.from({ length: Math.max(required, Math.min(ordered.length, required)) }, (_, i) => ordered[i] ?? null);
  const extras = ordered.slice(required);
  const firstEmpty = slots.findIndex((x) => x === null);
  const href = (r: ProfileRow) => (open ? `/profiles/${r.id}/edit` : `/profiles/${r.id}`);

  return (
    <div className="page">
      <header className="hero">
        <p className="kicker rv">Build Cycle C04 · Sensemaking</p>
        <h1 className="display rv"><Words text="Map the field." /></h1>
        <p className="lede rv">Write one profile for each player you see around The Labs in DC: a library, an employer, an agency, a community group, a training provider, anyone who matters here.</p>
        <p className="hero-meta rv" aria-live="polite">
          {rows ? <><b>{submitted} of {required}</b> submitted</> : "Counting…"}
          {" · "}{!unlocked && !membership.facilitator ? "Others' profiles unlock after your " + inWords(required) : unlocked ? "Everyone's profiles are open to you" : "You can read every profile"}
          {" · "}<Link to="/reading" viewTransition>Where the questions come from</Link>
        </p>
      </header>

      {flash && <p className="band band-info rv" role="status">{flash}</p>}
      {!open && <p className="band rv" role="status"><Status kind="closed">Submissions are closed</Status> You can still read your profiles, but you can't start or edit any.</p>}
      {createError && <ErrorNote title="Couldn't start a profile" message={createError} />}

      <section className="sec" aria-labelledby="h-yours">
        <h2 className="sr-only" id="h-yours">Your profiles</h2>
        {error ? <ErrorNote message={error} onRetry={() => void load()} />
          : !rows ? <Loader label="Loading your profiles" />
          : (
            <ol className="steps">
              {slots.map((r, i) => (
                <li key={r?.id ?? `empty-${i}`} className={`step rv${r?.status === "submitted" ? " is-done" : r ? " is-draft" : ""}`}>
                  <p className="step-no"><span className="no">{String(i + 1).padStart(2, "0")}</span>
                    {r ? <Status kind={r.status === "draft" ? "draft" : "submitted"}>{r.status === "draft" ? "Draft" : "Submitted"}</Status> : <span className="status">Not started</span>}
                    {r?.edited_at && <Status kind="edited">Edited</Status>}
                  </p>
                  {r ? (
                    <>
                      <h3 className="step-title"><Link to={r.status === "draft" && open ? `/profiles/${r.id}/edit` : `/profiles/${r.id}`} viewTransition>{r.name?.trim() || "Untitled player"}</Link></h3>
                      <p className="step-body">{[r.org_type ? typeLabel(r) : null, r.ring ? RING_LABEL[r.ring] : null].filter(Boolean).join(" · ") || "Still in your own words"}</p>
                      <p className="step-act">
                        {r.status === "draft" && open ? <Link className="textlink" to={href(r)} viewTransition>Keep writing →</Link>
                          : <Link className="textlink" to={`/profiles/${r.id}`} viewTransition>Read it →</Link>}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="step-title muted-title">A player you know</h3>
                      <p className="step-body">{i === 0 ? "Start with someone you know well." : "Someone different from the others: a funder, a neighbor, a rival."}</p>
                      <p className="step-act">
                        {open && i === firstEmpty && (
                          <button type="button" className="btn btn-primary" onClick={() => void create()} disabled={creating} aria-busy={creating}>
                            {creating ? "Starting…" : <>Start <span className="arrow" aria-hidden="true">→</span></>}
                          </button>
                        )}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}
      </section>

      {rows && (unlocked || membership.facilitator) && (
        <section className="band band-lit rv" aria-labelledby="h-unlocked">
          <div>
            <Status kind="unlocked">{membership.facilitator && !unlocked ? "Facilitator" : "Unlocked"}</Status>
            <h2 className="band-title" id="h-unlocked">{membership.facilitator && !unlocked ? "You can read every profile." : "Read what everyone else saw."}</h2>
            <p>{membership.facilitator && !unlocked ? "Drafts included. Participants can't see each other's until they've submitted their own." : "Anything you write from here on won't be independent of theirs, and that's fine."}</p>
          </div>
          <Link className="btn btn-primary" to="/gallery" viewTransition>Open the gallery <span className="arrow" aria-hidden="true">→</span></Link>
        </section>
      )}
      {rows && !unlocked && !membership.facilitator && (
        <p className="fine rv">Once you've submitted your {inWords(required)}, you'll be able to read everyone else's. Until then, nobody sees yours and you don't see theirs. That keeps everyone's view independent.</p>
      )}

      {rows && (extras.length > 0 || (open && firstEmpty === -1)) && (
        <section className="sec" aria-labelledby="h-more">
          <div className="sec-head">
            <h2 className="sub" id="h-more">More players</h2>
            {open && firstEmpty === -1 && (
              <button type="button" className="btn btn-ghost" onClick={() => void create()} disabled={creating} aria-busy={creating}>
                {creating ? "Starting…" : <>New profile <span className="arrow" aria-hidden="true">+</span></>}
              </button>
            )}
          </div>
          {extras.length > 0 && (
            <ul className="rows">
              {extras.map((r) => (
                <li key={r.id} className="rv">
                  <Link className="row" to={r.status === "draft" && open ? `/profiles/${r.id}/edit` : `/profiles/${r.id}`} viewTransition>
                    <span className="row-main"><span className="row-title">{r.name?.trim() || "Untitled player"}</span>
                      <span className="row-sub">{r.org_type ? typeLabel(r) : "No type yet"}</span></span>
                    <Status kind={r.status === "draft" ? "draft" : "submitted"}>{r.status === "draft" ? "Draft" : "Submitted"}</Status>
                    <span className="arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
