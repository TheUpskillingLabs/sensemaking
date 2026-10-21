import { useEffect, useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { ErrorNote, Loader, Segmented, useTitle } from "../components/bits";
import { ProfileCard } from "../components/ProfileCard";
import { applyFilters, readFilters } from "../lib/filters";
import { useGalleryData } from "./Gallery";

/** Printable cards: /print?<gallery filters>&per=1|2. One per page portrait, or two per page landscape.
    They are read together in the room, so they never carry an author, even for facilitators. */
function pages<T>(rows: T[], per: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += per) out.push(rows.slice(i, i + per));
  return out;
}

export default function Print() {
  useTitle("Print cards");
  const { membership } = useAuth();
  const [sp, setSp] = useSearchParams();
  const f = readFilters(sp);
  const per = sp.get("per") === "2" ? "2" : "1";
  const facilitator = Boolean(membership?.facilitator);
  const { rows, error, reload } = useGalleryData(facilitator);
  const shown = useMemo(() => (rows ? applyFilters(rows, f, facilitator) : []), [rows, sp, facilitator]); // eslint-disable-line react-hooks/exhaustive-deps

  // Page orientation has to be set at the document level.
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = per === "2" ? "@page { size: landscape; margin: 10mm; }" : "@page { size: portrait; margin: 14mm; }";
    document.head.appendChild(s);
    return () => s.remove();
  }, [per]);

  if (!membership) return <Loader center />;
  if (!(membership.unlocked || facilitator)) return <Navigate to="/" replace />;

  const back = new URLSearchParams(sp); back.delete("per");

  return (
    <>
      <div className="print-bar noprint">
        <Link to={`/gallery${back.toString() ? `?${back}` : ""}`} className="btn btn-ghost btn-sm">← Gallery</Link>
        <span className="count">{rows ? `${shown.length} ${shown.length === 1 ? "card" : "cards"}` : "Loading…"}</span>
        <div className="act">
          <span className="sr-only" id="per-l">Cards per page</span>
          <div style={{ width: 240 }}>
            <Segmented dark name="per" labelledBy="per-l" value={per} options={[{ value: "1", label: "1 per page" }, { value: "2", label: "2, landscape" }]}
              onChange={(v) => { const n = new URLSearchParams(sp); if (v === "2") n.set("per", "2"); else n.delete("per"); setSp(n, { replace: true }); }} />
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()} disabled={!rows || shown.length === 0}>Print</button>
        </div>
      </div>
      <main id="main">
        {error ? <div className="page"><ErrorNote message={error} onRetry={() => void reload()} /></div>
          : !rows ? <Loader center label="Laying out the cards" />
          : shown.length === 0 ? <div className="page"><p className="empty">Nothing to print with these filters.</p></div>
          : (
            <div className={`print-sheet${per === "2" ? " two" : ""}`}>
              {pages(shown, Number(per)).map((group) => (
                <div key={group[0]?.id} className="print-page">
                  {group.map((p) => (
                    <div key={p.id} className="print-card">
                      <ProfileCard p={p} headingLevel={2} showStatus={p.status === "draft"} variant="print" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
      </main>
    </>
  );
}
