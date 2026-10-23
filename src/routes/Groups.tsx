import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import { ErrorNote, GroupShape, Loader, Words, useTitle } from "../components/bits";
import { useSubmittedProfiles } from "../components/GroupEditor";
import { api } from "../lib/api";
import { CAPITALS, ratingField } from "../lib/capitals";
import { summarize } from "../lib/group";
import type { GroupRow, Level, ProfileRow } from "../lib/types";

/* Every stakeholder group the room has made. */

export default function Groups() {
  useTitle("Groups");
  const { membership } = useAuth();
  const { rows } = useSubmittedProfiles();
  const [groups, setGroups] = useState<GroupRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setError(null); try { setGroups(await api.listGroups()); } catch (e) { setError(e instanceof Error ? e.message : "We couldn't load the groups."); } }, []);
  useEffect(() => { void load(); }, [load]);
  const byId = useMemo(() => new Map((rows ?? []).map((r) => [r.id, r])), [rows]);
  const grouped = useMemo(() => new Set((groups ?? []).flatMap((g) => g.profile_ids)), [groups]);

  if (!membership) return <Loader center />;
  if (!(membership.unlocked || membership.facilitator)) return <Navigate to="/" replace />;

  return (
    <div className="page">
      <header className="intro">
        <h1 className="h-display"><Words text="Stakeholder groups" /></h1>
        <p className="lede">Cluster the printed cards on the table, then photograph each cluster. The app reads the cards and averages them into one group.</p>
        <p><Link className="btn btn-primary" to="/groups/new" viewTransition>Make a group</Link></p>
      </header>

      {error ? <ErrorNote message={error} onRetry={() => void load()} /> : !groups ? <Loader label="Loading the groups" /> : groups.length === 0 ? (
        <p className="empty">No groups yet. Make the first one from a cluster on the table.</p>
      ) : (
        <>
          {rows && <p className="count gl-count">{groups.length} {groups.length === 1 ? "group" : "groups"}, covering {grouped.size} of {rows.length} profiles{rows.length - [...grouped].filter((id) => byId.has(id)).length > 0 ? `. ${rows.length - [...grouped].filter((id) => byId.has(id)).length} not in a group yet` : ""}.</p>}
          <ul className="grid">
            {groups.map((g) => {
              const members = g.profile_ids.map((id) => byId.get(id)).filter((p): p is ProfileRow => Boolean(p));
              const s = summarize(members);
              return (
                <li key={g.id} className="gitem">
                  <GroupShape means={CAPITALS.map((c) => s.capitals[c.key].mean)} members={members.map((p) => CAPITALS.map((c) => p[ratingField(c.key)] as Level | null))} size={64} />
                  <div className="gbody">
                    <h3><Link to={`/groups/${g.id}`} viewTransition>{g.name}</Link></h3>
                    <p className="gkind">{g.profile_ids.length} {g.profile_ids.length === 1 ? "profile" : "profiles"}{s.types[0] && <span>mostly {s.types[0].label.toLowerCase()}</span>}</p>
                    {g.note && <p className="gdesc">{g.note}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
