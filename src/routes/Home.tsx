import { SURVEY_URL } from "../lib/config";
import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { CapGlyph, ErrorNote, Loader, Words, kindOf, useTitle } from "../components/bits";
import { opensLabel, opensLater } from "../lib/capitals";
import { api } from "../lib/api";
import type { ProfileRow } from "../lib/types";
import { markTutorialSeen, tutorialSeen } from "../components/TutorialDialog";

const TutorialDialog = lazy(() => import("../components/TutorialDialog"));

const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const inWords = (n: number) => words[n] ?? String(n);

export default function Home() {
  useTitle("My profiles");
  const { user, membership, reloadMembership } = useAuth();
  const [showTutorial, setShowTutorial] = useState(() => Boolean(user && !tutorialSeen(user.id)));
  const closeTutorial = () => { if (user) markTutorialSeen(user.id); setShowTutorial(false); };
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
  const surveyKey = `sp.survey.done.${user?.id ?? "anon"}`;
  const [surveyDone, setSurveyDone] = useState(() => { try { return localStorage.getItem(surveyKey) === "1"; } catch { return false; } });
  const markSurvey = (v: boolean) => { setSurveyDone(v); try { if (v) localStorage.setItem(surveyKey, "1"); else localStorage.removeItem(surveyKey); } catch { /* storage may be blocked */ } };

  if (!membership) return <Loader center />;
  const required = membership.config.required_profiles;
  const open = membership.config.submissions_open;
  const submitted = rows?.filter((r) => r.status === "submitted").length ?? 0;
  const later = opensLater(membership.config.gallery_opens_at);
  const opens = opensLabel(membership.config.gallery_opens_at);
  const unlocked = membership.unlocked || (submitted >= required && !later);
  const allDone = submitted >= required;

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
      {showTutorial && rows && (
        <Suspense fallback={null}>
          <TutorialDialog onClose={closeTutorial} onStart={() => { closeTutorial(); if (open && rows.length === 0) void create(); }} />
        </Suspense>
      )}
      <header className="intro">
        <h1 className="h-display"><Words text="Your stakeholder profiles" /></h1>
        <p className="lede">Write one profile for each of three players around The Labs in DC: a library, an employer, an agency, a community group, a training provider, anyone who matters here.</p>
      </header>

      {flash && <p className="notice" role="status">{flash}</p>}
      {open && later && opens && (() => {
        const drafts = (rows ?? []).filter((r) => r.status === "draft").length;
        const ready = allDone && surveyDone;
        return (
          <section className={`before${ready ? " is-ready" : ""}`} aria-labelledby="before-h">
            <h2 className="before-h" id="before-h">{ready ? "You're ready for tomorrow" : `Before ${opens}`}</h2>
            {ready && <p className="before-ready">Both done. Nothing else to do tonight; you can still edit your profiles until {opens}.</p>}
            <ol className="before-list">
              <li className={surveyDone ? "is-done" : ""}>
                <div>
                  <p className="before-t">Share what you've seen in the survey</p>
                  <p className="before-d">{surveyDone ? "Sent." : "A few minutes, anonymous, no account needed. It opens in OLOS, where every response stays together; tomorrow morning they go on the wall. Tick Done when you've sent it."}</p>
                </div>
                <div className="before-a">
                  {!surveyDone && <a className="btn btn-quiet btn-sm" href={SURVEY_URL} target="_blank" rel="noopener noreferrer">Open the survey</a>}
                  <label className="before-tick"><input type="checkbox" checked={surveyDone} onChange={(e) => markSurvey(e.target.checked)} /> Done</label>
                </div>
              </li>
              <li className={allDone ? "is-done" : ""}>
                <div>
                  <p className="before-t">Write your {inWords(required)} profiles</p>
                  <p className="before-d">{allDone ? "All submitted." : `About 10 minutes each. ${submitted} of ${required} submitted${drafts ? `, ${drafts === 1 ? "1 draft" : `${drafts} drafts`} still to submit (drafts aren't printed)` : ""}. The cards are printed at ${opens.replace(/^\w+ at /, "")}, so anything later won't be on the table.`}</p>
                </div>
              </li>
              <li className="is-info">
                <div>
                  <p className="before-t">Tomorrow at DC Public Library</p>
                  <p className="before-d">Doors at 10:15, we start at 10:30 sharp and finish at 3:45. Lunch isn't provided: bring your own, or head out from 11:50 to 12:30. Bring a laptop and a charged phone.</p>
                </div>
                <div className="before-a"><Link className="btn btn-quiet btn-sm" to="/today" viewTransition>How the day runs</Link></div>
              </li>
            </ol>
          </section>
        );
      })()}
      {!open && <p className="notice" role="status"><strong>Submissions are closed.</strong> You can still read your profiles, but you can't start or edit any.</p>}
      {createError && <ErrorNote title="Couldn't start a profile" message={createError} />}

      <section className="mine" aria-labelledby="h-yours">
        <div className="mine-head">
          <h2 className="h-section" id="h-yours">{rows ? <><span className="num">{submitted}</span> of <span className="num">{required}</span> submitted</> : "Your profiles"}</h2>
          <p className="aside-note" aria-live="polite">
            {membership.facilitator ? "As a facilitator you can read every profile."
              : unlocked ? "You can read everyone's profiles."
              : later && opens ? (allDone ? `Everyone's profiles open ${opens}.` : `Others' profiles open ${opens}, once you've submitted your ${ordinal[required - 1] ?? inWords(required)}.`)
              : `Others' profiles open to you after your ${ordinal[required - 1] ?? inWords(required)}.`}
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
                      <span className="prow-kind">{kindOf(r) || "No type yet"}</span>
                    </div>
                    <span className={`state state-${r.status}`}>{r.status === "draft" ? "Draft" : r.edited_at ? "Submitted, then edited" : "Submitted"}</span>
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
                      <span className="prow-kind">{ordered.length + i === 0 ? "Start with someone you know well." : "Anyone who matters here. Different from the first, if you can."}</span>
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
            <p>{membership.facilitator && !unlocked ? "Participants can't see each other's until the gallery opens and they've submitted their own." : "Anything you write from here on will be shaped by theirs, and that's fine."}</p>
          </div>
          <Link className="btn btn-primary" to="/gallery" viewTransition>Open the gallery</Link>
        </section>
      )}
      {rows && !unlocked && !membership.facilitator && allDone && later && !open && (
        <section className="next" aria-labelledby="h-waiting">
          <div>
            <h2 className="h-section" id="h-waiting">Your {inWords(required)} are in.</h2>
            <p>Everyone's profiles open {opensLabel(membership.config.gallery_opens_at, true)}. Until then you can edit yours or add another player.</p>
          </div>
        </section>
      )}

      <aside className="home-foot">
        {rows && !unlocked && !membership.facilitator && (
          <p>{later && opens ? `Until ${opens}, nobody sees yours and you don't see theirs.` : `Until you've submitted your ${inWords(required)}, nobody sees yours and you don't see theirs.`} That keeps everyone's view independent.</p>
        )}
        <p>New to this? <button type="button" className="btn-link" onClick={() => setShowTutorial(true)}>Watch two example profiles get written</button>. About two minutes each.</p>
        <p><Link to="/reading" viewTransition>Background reading</Link>: where these questions come from, in plain words.</p>
      </aside>
    </div>
  );
}
