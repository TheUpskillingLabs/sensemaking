import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { ErrorNote, Loader, Segmented, kindOf, useTitle } from "../components/bits";
import { CAPITALS, LEVEL_LABEL, flowLabel, isRated, namedConnections, noteField, ratingField, rolesLabel } from "../lib/capitals";
import { CYCLE } from "../lib/config";
import { applyFilters, readFilters } from "../lib/filters";
import type { Level, ProfileRow } from "../lib/types";
import { useGalleryData } from "./Gallery";
import "../styles/print.css";
import { QR } from "../components/QR";
import { cardCode } from "../lib/group";

/* Cut-out cards on US Letter. /print?<gallery filters>&size=half|quarter
   - half: two 5.5 x 8.5 in cards on a landscape sheet. One cut down the middle.
   - quarter: four 4.25 x 5.5 in cards on a portrait sheet. One cut each way.
   - sixth: six 3.67 x 4.25 in cards on a landscape sheet. Three cuts.
   DCPL allows twenty printed sheets, so 6 per sheet is the default and the
   page counts sheets against the allowance.
   The page margin is zero and each card keeps its own inner margin, so the
   paper's edges are the cards' outer edges and the cut lines are the only
   lines to cut. Text is clamped to fit; the full profile is always in the app.
   Cards are read together in the room, so they never carry an author. */

type Size = "half" | "quarter" | "sixth";
const SIZES: Size[] = ["half", "quarter", "sixth"];
const PER: Record<Size, number> = { half: 2, quarter: 4, sixth: 6 };
const GRID: Record<Size, [number, number]> = { half: [2, 1], quarter: [2, 2], sixth: [3, 2] }; // columns, rows
const LANDSCAPE: Record<Size, boolean> = { half: true, quarter: false, sixth: true };
const SHEET_PX: Record<Size, number> = { half: 1056, quarter: 816, sixth: 1056 }; // 11in or 8.5in at 96px/in
const SHEET_LIMIT = 20; // DCPL's print allowance
const ABOUT: Record<Size, string> = {
  half: "Each card is 5.5 × 8.5 in with the full profile. Cut once, down the dashed line.",
  quarter: "Each card is 4.25 × 5.5 in, a short version for sorting on a table. Cut once each way.",
  sixth: "Each card is 3.67 × 4.25 in, just enough to sort and talk about. Three cuts.",
};

function chunk<T>(rows: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += n) out.push(rows.slice(i, i + n));
  return out;
}

/** The seven capitals as a shape with short labels, drawn in ink for paper. */
function PrintShape({ p, size, labels }: { p: ProfileRow; size: number; labels: boolean }) {
  const K = { low: 0.4, medium: 0.7, high: 1 } as const;
  const c = 60, r = labels ? 40 : 50;
  const at = (i: number, k: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / CAPITALS.length; return [c + Math.cos(a) * r * k, c + Math.sin(a) * r * k] as const; };
  const vals = CAPITALS.map((cap) => p[ratingField(cap.key)] as Level | null);
  const rated = vals.some(isRated);
  return (
    <svg className="ps" viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      {[0.4, 0.7, 1].map((k) => <polygon key={k} className={k === 1 ? "ps-frame" : "ps-ring"} points={CAPITALS.map((_, i) => at(i, k).join(",")).join(" ")} />)}
      {CAPITALS.map((_, i) => { const [x, y] = at(i, 1); return <line key={i} className="ps-spoke" x1={c} y1={c} x2={x} y2={y} />; })}
      {rated && <polygon className="ps-shape" points={vals.map((v, i) => at(i, isRated(v) ? K[v] : 0.08).join(",")).join(" ")} />}
      {labels && CAPITALS.map((cap, i) => { const [x, y] = at(i, 1.3); return <text key={cap.key} className="ps-label" x={x} y={y} textAnchor="middle" dominantBaseline="middle">{cap.label.charAt(0)}</text>; })}
    </svg>
  );
}

/** The card's foot: a line of small print, and the QR code the group scanner reads. */
function Foot({ p, qr, children }: { p: ProfileRow; qr: string; children: ReactNode }) {
  return (
    <footer className="cc-foot">
      <p>{children}<br /><span className="cc-scan">Group code</span></p>
      <QR text={cardCode(p.id)} size={qr} />
    </footer>
  );
}

const t = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

function Head({ p, shape }: { p: ProfileRow; shape: number }) {
  const roles = rolesLabel(p.roles);
  return (
    <header className="cc-head">
      <PrintShape p={p} size={shape} labels />
      <div className="cc-id">
        <h2 className="cc-name">{p.name?.trim() || "Untitled player"}</h2>
        <p className="cc-kind">{kindOf(p) || "Type not set"}</p>
        {roles && <p className="cc-roles">{roles}</p>}
        {p.status === "draft" && <p className="cc-draft">Draft</p>}
      </div>
    </header>
  );
}

function HalfCard({ p }: { p: ProfileRow }) {
  const conns = namedConnections(p.connections);
  return (
    <article className="cc cc-half" aria-label={p.name ?? "Untitled profile"}>
      <Head p={p} shape={96} />
      {t(p.description) && <p className="cc-desc cl-5">{t(p.description)}</p>}
      {t(p.touchpoints) && <p className="cc-field cl-2"><b>Where people meet them</b> {t(p.touchpoints)}</p>}
      <div className="cc-caps">
        <p className="cc-h">What they bring</p>
        <table><tbody>
          {CAPITALS.map((c) => { const v = p[ratingField(c.key)] as Level | null; const n = t(p[noteField(c.key)]); return (
            <tr key={c.key}><th>{c.label}</th><td className={`lv lv-${v ?? "none"}`}>{v ? LEVEL_LABEL[v] : "—"}</td><td className="cn">{n}</td></tr>
          ); })}
        </tbody></table>
      </div>
      {conns.length > 0 && (
        <div className="cc-conns">
          <p className="cc-h">Connected to</p>
          <ul>{conns.slice(0, 5).map((c, i) => <li key={i}><b>{c.name.trim()}</b>{flowLabel(c) && <span> · {flowLabel(c).toLowerCase()}</span>}</li>)}</ul>
          {conns.length > 5 && <p className="cc-more">and {conns.length - 5} more</p>}
        </div>
      )}
      <div className="cc-two">
        {t(p.needs) && <p className="cc-field cl-3"><b>Needs</b> {t(p.needs)}</p>}
        {t(p.stake) && <p className="cc-field cl-3"><b>At stake</b> {t(p.stake)}</p>}
        {t(p.values_held) && <p className="cc-field cl-2"><b>Values</b> {t(p.values_held)}</p>}
        {t(p.fears) && <p className="cc-field cl-2"><b>Fears</b> {t(p.fears)}</p>}
      </div>
      {t(p.connection_to_labs) && <p className="cc-field cl-2"><b>And The Labs</b> {t(p.connection_to_labs)}</p>}
      <Foot p={p} qr="0.72in">Influence: {p.influence_level ? LEVEL_LABEL[p.influence_level].toLowerCase() : "not rated"}<br />The Upskilling Labs, Build Cycle {CYCLE}</Foot>
    </article>
  );
}

function QuarterCard({ p }: { p: ProfileRow }) {
  const conns = namedConnections(p.connections);
  return (
    <article className="cc cc-quarter" aria-label={p.name ?? "Untitled profile"}>
      <Head p={p} shape={104} />
      {t(p.description) && <p className="cc-desc cl-5">{t(p.description)}</p>}
      {t(p.touchpoints) && <p className="cc-field cl-2"><b>Where people meet them</b> {t(p.touchpoints)}</p>}
      {conns.length > 0 && <p className="cc-field cl-3"><b>Connected to</b> {conns.map((c) => c.name.trim()).join(", ")}</p>}
      {t(p.needs) && <p className="cc-field cl-3"><b>Needs</b> {t(p.needs)}</p>}
      {t(p.stake) && <p className="cc-field cl-2"><b>At stake</b> {t(p.stake)}</p>}
      <Foot p={p} qr="0.66in">Build Cycle {CYCLE}</Foot>
    </article>
  );
}

function SixthCard({ p }: { p: ProfileRow }) {
  const conns = namedConnections(p.connections);
  return (
    <article className="cc cc-sixth" aria-label={p.name ?? "Untitled profile"}>
      <Head p={p} shape={78} />
      {t(p.description) && <p className={`cc-desc ${(p.name ?? "").length > 40 ? "cl-3" : "cl-4"}`}>{t(p.description)}</p>}
      {t(p.touchpoints) && <p className="cc-field cl-2"><b>Meet them</b> {t(p.touchpoints)}</p>}
      {conns.length > 0 && <p className="cc-field cl-2"><b>Connected to</b> {conns.map((c) => c.name.trim()).join(", ")}</p>}
      {t(p.needs) && <p className="cc-field cl-2"><b>Needs</b> {t(p.needs)}</p>}
      {t(p.stake) && <p className="cc-field cl-1"><b>At stake</b> {t(p.stake)}</p>}
      <Foot p={p} qr="0.7in">Build Cycle {CYCLE}</Foot>
    </article>
  );
}

export default function Print() {
  useTitle("Print cards");
  const { membership } = useAuth();
  const [sp, setSp] = useSearchParams();
  const f = readFilters(sp);
  const asked = sp.get("size");
  const facilitator = Boolean(membership?.facilitator);
  const { rows, error, reload } = useGalleryData(facilitator);
  const shown = useMemo(() => (rows ? applyFilters(rows, f, facilitator) : []), [rows, sp, facilitator]); // eslint-disable-line react-hooks/exhaustive-deps
  const size: Size = (SIZES as string[]).includes(asked ?? "") ? (asked as Size) : "sixth";

  // Paper size and orientation have to be set at the document level.
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `@page { size: letter ${LANDSCAPE[size] ? "landscape" : "portrait"}; margin: 0; }`;
    document.head.appendChild(s);
    return () => s.remove();
  }, [size]);

  // On screen, scale the sheets to fit the window; print is always actual size.
  const wrap = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const el = wrap.current; if (!el) return;
    const fit = () => setZoom(Math.min(1, (el.clientWidth - 2) / SHEET_PX[size]));
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [size, rows]);

  if (!membership) return <Loader center />;
  if (!(membership.unlocked || facilitator)) return <Navigate to="/" replace />;

  const back = new URLSearchParams(sp); back.delete("size"); back.delete("per");
  const sheets = chunk(shown, PER[size]);
  const over = sheets.length > SHEET_LIMIT;
  const [cols, rowsN] = GRID[size];

  return (
    <>
      <div className="print-bar noprint">
        <Link to={`/gallery${back.toString() ? `?${back}` : ""}`} className="btn btn-quiet btn-sm">Back to the gallery</Link>
        <div className="act">
          <span className="sr-only" id="size-l">Card size</span>
          <div className="size-seg">
            <Segmented dark name="size" labelledBy="size-l" value={size}
              options={SIZES.map((s) => ({ value: s, label: `${PER[s]} per sheet` }))}
              onChange={(v) => { const n = new URLSearchParams(sp); n.delete("per"); n.set("size", v); setSp(n, { replace: true }); }} />
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()} disabled={!rows || shown.length === 0}>Print</button>
        </div>
        {rows && (
          <div className={`budget${over ? " is-over" : ""}`} role="status" aria-live="polite">
            <p className="budget-n"><b>{sheets.length}</b> of {SHEET_LIMIT} sheets</p>
            <p className="budget-meter" aria-hidden="true">{Array.from({ length: SHEET_LIMIT }, (_, i) => <i key={i} className={i < sheets.length ? "on" : ""} />)}</p>
            <p className="budget-note">
              {shown.length} {shown.length === 1 ? "card" : "cards"}.{" "}
              {over ? (size === "sixth" ? `That's over DCPL's ${SHEET_LIMIT}-sheet allowance even at 6 per sheet. Filter to fewer profiles in the gallery (one type or one ring at a time) and print in batches.` : `That's over DCPL's ${SHEET_LIMIT}-sheet allowance. Choose more per sheet.`)
                : `Fits DCPL's ${SHEET_LIMIT}-sheet allowance.`}
            </p>
          </div>
        )}
        <p className="print-how">
          {ABOUT[size]} In the print dialog choose Letter, one-sided, scale 100%, and margins None or Default.
        </p>
      </div>
      <main id="main" className="print-main" ref={wrap}>
        {error ? <div className="page"><ErrorNote message={error} onRetry={() => void reload()} /></div>
          : !rows ? <Loader center label="Laying out the cards" />
          : shown.length === 0 ? <div className="page"><p className="empty">Nothing to print with these filters.</p></div>
          : (
            <div className={`sheets sheets-${size}`} style={{ ["--zoom" as string]: zoom }}>
              {sheets.map((group, i) => (
                <section key={group[0]?.id ?? i} className={`sheet sheet-${size}`} aria-label={`Sheet ${i + 1} of ${sheets.length}`}>
                  {Array.from({ length: PER[size] }, (_, j) => group[j]).map((p, j) => (
                    <div key={p?.id ?? `blank-${j}`} className="slot">
                      {p ? (size === "half" ? <HalfCard p={p} /> : size === "quarter" ? <QuarterCard p={p} /> : <SixthCard p={p} />) : null}
                    </div>
                  ))}
                  {Array.from({ length: cols - 1 }, (_, k) => <span key={`v${k}`} className="cut cut-v" style={{ left: `${((k + 1) / cols) * 100}%` }} aria-hidden="true" />)}
                  {Array.from({ length: rowsN - 1 }, (_, k) => <span key={`h${k}`} className="cut cut-h" style={{ top: `${((k + 1) / rowsN) * 100}%` }} aria-hidden="true" />)}
                </section>
              ))}
            </div>
          )}
      </main>
    </>
  );
}
