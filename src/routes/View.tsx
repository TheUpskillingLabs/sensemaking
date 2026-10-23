import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";
import { ConfirmDialog, ErrorNote, Loader, Tick, useTitle } from "../components/bits";
import { ProfileCard } from "../components/ProfileCard";
import { api } from "../lib/api";
import type { ProfileRow } from "../lib/types";

export default function View() {
  const { id = "" } = useParams();
  const loc = useLocation();
  const { user, membership } = useAuth();
  const justSubmitted = Boolean((loc.state as { justSubmitted?: boolean } | null)?.justSubmitted);
  const [p, setP] = useState<ProfileRow | null>(null);
  const [author, setAuthor] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const nav = useNavigate();
  useTitle(p?.name?.trim() || "Profile");

  const load = useCallback(async () => {
    setError(null);
    try {
      const row = await api.getProfile(id);
      setP(row);
      if (membership?.facilitator) {
        const names = await api.authorNames().catch(() => []);
        setAuthor(names.find((n) => n.author_id === row.author_id)?.display_name);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "We couldn't open this profile."); }
  }, [id, membership?.facilitator]);
  useEffect(() => { void load(); }, [load]);

  const mine = p && user && p.author_id === user.id;
  const back = mine ? { to: "/", label: "Your profiles" } : { to: "/gallery", label: "Gallery" };

  return (
    <div className="page page-doc">
      <nav className="crumb" aria-label="Back"><Link to={back.to} viewTransition>{back.label}</Link>
        {p && mine && p.status === "submitted" && membership?.config.submissions_open && <Link className="btn btn-ghost btn-sm" to={`/profiles/${p.id}/edit`} viewTransition>Edit this profile</Link>}
        {p && !mine && membership?.facilitator && (
          <span className="crumb-act">
            <Link className="btn btn-ghost btn-sm" to={`/profiles/${p.id}/edit`} viewTransition>Edit</Link>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirm(true)}>Delete</button>
          </span>
        )}</nav>
      {error ? <ErrorNote message={error} onRetry={() => void load()} />
        : !p ? <Loader label="Opening the profile" />
        : (
          <>
            {justSubmitted && (
              <div className="notice notice-done" role="status">
                <p><Tick /> <strong>Submitted.</strong> {membership?.unlocked ? <>Everyone's profiles are open to you. <Link to="/gallery" viewTransition>Open the gallery</Link>.</> : <>Thank you. <Link to="/" viewTransition>Back to your profiles</Link>.</>}</p>
              </div>
            )}
            {mine && p.status === "draft" && membership?.config.submissions_open && (
              <p className="notice">This is still a draft. <Link to={`/profiles/${p.id}/edit`} viewTransition>Keep editing</Link>.</p>
            )}
            <ProfileCard p={p} author={membership?.facilitator ? author : undefined} showStatus={Boolean(mine) || p.status === "draft"} />
            <ConfirmDialog open={confirm} title="Delete this profile?" confirmLabel="Delete profile" danger busy={busy}
              onConfirm={() => { setBusy(true); setDelError(null); api.deleteProfile(p.id).then(() => nav("/gallery", { replace: true, viewTransition: true })).catch((e) => { setBusy(false); setDelError(e instanceof Error ? e.message : "We couldn't delete it."); }); }}
              onCancel={() => { setConfirm(false); setDelError(null); }}>
              <p>{author ? `It's ${author}'s.` : "It isn't yours."} It disappears for its author and from the gallery, and its printed card stops matching. This can't be undone.</p>
              {delError && <p className="err-text" role="alert" style={{ marginTop: 8 }}>{delError}</p>}
            </ConfirmDialog>
          </>
        )}
    </div>
  );
}
