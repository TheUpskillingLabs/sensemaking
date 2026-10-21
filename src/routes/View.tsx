import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../auth";
import { ErrorNote, Loader, Tick, useTitle } from "../components/bits";
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
  const back = mine ? { to: "/", label: "← My profiles" } : { to: "/gallery", label: "← Gallery" };

  return (
    <div className="page page-narrow">
      <p className="rv" style={{ marginBottom: 16 }}><Link to={back.to} viewTransition>{back.label}</Link></p>
      {error ? <ErrorNote message={error} onRetry={() => void load()} />
        : !p ? <Loader label="Opening the profile" />
        : (
          <>
            {justSubmitted && (
              <div className="note note-info rv" role="status" style={{ marginBottom: 24 }}>
                <p style={{ display: "flex", alignItems: "center", gap: 8 }}><Tick /> <strong>Submitted.</strong></p>
                <p className="muted" style={{ marginTop: 4 }}>{membership?.unlocked ? <>You've unlocked everyone's profiles. <Link to="/gallery" viewTransition>Open the gallery</Link>.</> : <>Thank you. <Link to="/" viewTransition>Back to your profiles</Link> to write the next one.</>}</p>
              </div>
            )}
            {mine && p.status === "draft" && membership?.config.submissions_open && (
              <p className="note rv" style={{ marginBottom: 24 }}>This is still a draft. <Link to={`/profiles/${p.id}/edit`} viewTransition>Keep editing</Link>.</p>
            )}
            <div className="sheet">
              <ProfileCard p={p} author={membership?.facilitator ? author : undefined} showStatus={Boolean(mine) || p.status === "draft"} />
            </div>
          </>
        )}
    </div>
  );
}
