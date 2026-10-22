import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { CapGlyph, ErrorNote, Loader, Words, kindOf, useTitle } from "../components/bits";
import { api } from "../lib/api";
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

  // Submitted first, then drafts (newest first), then empty places up to the number required.
  const ordered = rows ? [...rows].sort((x, y) => (x.status === y.status ? Date.parse(y.updated_at) - Date.parse(x.updated_at) : x.status === "submitted" ? -1 : 1)) : [];
  const empties = Math.max(0, required - ordered.length);
  const ordinal = ["first", "second", "third", "fourth", "fifth", "sixth"];

  return (
    <div className="page page-home">
      <header className="intro">
        <h1 className="h-display"><Words text="Your stakeholder profiles" /></h1>
        <p className="lede">Write one profile for each player you see around The Labs in DC: a library, an employer, an agency, a community group, a training provider, anyone who matters here.</p>
      </header>

      {flash && <p className="notice" role="status">{flash}</p>}
      {!open && <p className="notice" role="status"><strong>Submissions are closed.</strong> You can still read your profiles, but you can't start or edit any.</p>}
      {createError && <ErrorNote title="Couldn't start a profile" message={createError} />}

      <section className="mine" aria-labelledby="h-yours">
        <div className="mine-head">
          <h2 className="h-section" id="h-yours">{rows ? <><span className="num">{submitted}</span> of <span className="num">{required}</span> submitted</> : "Your profiles"}</h2>
          <p className="aside-note" aria-live="polite">
            {membership.facilitator ? "As a facilitator you can read every profile." : unlocked ? "You can read everyone's profiles." : `Others' profiles open to you after your ${ordinal[required - 1] ?? inWords(required)}.`}
          </p>
        </div>
        {error ? <ErrorNote message={error} onRetry={() => void load()} />
          : !rows ? <Loader label="Loading your profiles" />
          : (
            <>
              <ol className="plist">
                {ordered.map((r) => (
                  <li key={r.id} className={`prow${r.status === "draft" ? " is-draft" : ""}`}>
                    <CapGlyph p={r} />
                    <div className="prow-main">
                      <Link className="prow-name" to={r.status === "draft" && open ? `/profiles/${r.id}/edit` : `/profiles/${r.id}`} viewTransition>{r.name?.trim() || "Untitled player"}</Link>
                      <span className="prow-kind">{kindOf(r) || "Not yet typed"}</span>
                    </div>
                    <span className={`state state-${r.status}`}>{r.status === "draft" ? "Draft" : r.edited_at ? "Submitted, edited" : "Submitted"}</span>
                    <span className="prow-act">
                      {r.status === "draft" && open
                        ? <Link className="btn btn-quiet btn-sm" to={`/profiles/${r.id}/edit`} viewTransition>Keep writing</Link>
                        : open ? <Link className="btn btn-quiet btn-sm" to={`/profiles/${r.id}/edit`} viewTransition>Edit</Link> : null}
                    </span>
                  </li>
                ))}
                {Array.from({ length: empties }, (_, i) => (
                  <li key={`empty-${i}`} className="prow is-empty">
                    <span className="glyph-slot" aria-hidden="true" />
                    <div className="prow-main">
                      <span className="prow-name">{ordered.length + i === 0 ? "Your first player" : `Your ${ordinal[ordered.length + i] ?? "next"} player`}</span>
                      <span className="prow-kind">{ordered.length + i === 0 ? "Start with someone you know well." : "Someone different from the others: a funder, a neighbor, a rival."}</span>
                    </div>
                    <span className="state" />
                    <span className="prow-act">
                      {open && i === 0 && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => void create()} disabled={creating} aria-busy={creating}>{creating ? "Starting…" : "Start a profile"}</button>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              {open && empties === 0 && (
                <p className="mine-more"><button type="button" className="btn btn-quiet btn-sm" onClick={() => void create()} disabled={creating} aria-busy={creating}>{creating ? "Starting…" : "Add another player"}</button></p>
              )}
            </>
          )}
      </section>

      {rows && (unlocked || membership.facilitator) && (
        <section className="next" aria-labelledby="h-unlocked">
          <div>
            <h2 className="h-section" id="h-unlocked">{membership.facilitator && !unlocked ? "Every profile, drafts included" : "Read what everyone else saw"}</h2>
            <p>{membership.facilitator && !unlocked ? "Participants can't see each other's until they've submitted their own." : "Anything you write from here on won't be independent of theirs, and that's fine."}</p>
          </div>
          <Link className="btn btn-primary" to="/gallery" viewTransition>Open the gallery</Link>
        </section>
      )}

      <aside className="home-foot">
        {rows && !unlocked && !membership.facilitator && (
          <p>Until you've submitted your {inWords(required)}, nobody sees yours and you don't see theirs. That keeps everyone's view independent.</p>
        )}
        <p>New to this? <Link to="/tutorial" viewTransition>Watch a profile get written</Link>, two made-up examples in about two minutes each.</p>
        <p><Link to="/reading" viewTransition>Background reading</Link>: where these questions come from, in plain words.</p>
      </aside>
    </div>
  );
}
