import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CapGlyph, ErrorNote, kindOf } from "./bits";
import { api } from "../lib/api";
import { matchCode, shortId } from "../lib/group";
import type { ProfileRow } from "../lib/types";

/* Reading a photo of a cluster of printed cards, and picking profiles by hand.
   The photo is decoded on this device (zxing-wasm, loaded only when someone
   adds a photo) and never uploaded. Each card's QR code holds its profile's
   address; we keep the ids that match profiles this person can see. */

export function useSubmittedProfiles() {
  const [rows, setRows] = useState<ProfileRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try { setRows(await api.listAll(false)); } catch (e) { setError(e instanceof Error ? e.message : "We couldn't load the profiles."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { rows, error, reload: load };
}

interface Found { x: number; y: number; w: number; h: number; points: string; known: boolean }
interface Shot { url: string; width: number; height: number; found: Found[]; known: number; unknown: number; name: string }

type Read = { text: string; isValid: boolean; position: { topLeft: { x: number; y: number }; topRight: { x: number; y: number }; bottomRight: { x: number; y: number }; bottomLeft: { x: number; y: number } } };

async function reader() {
  const zx = await import("zxing-wasm/reader");
  const wasmUrl = (await import("zxing-wasm/reader/zxing_reader.wasm?url")).default;
  zx.prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? wasmUrl : prefix + path) }, fireImmediately: true });
  return zx;
}

/** Read every QR code in a photo. First the whole photo; then, for codes too small to read that way,
    overlapping tiles enlarged 2x. Positions come back in the photo's own pixels. */
async function decode(file: File): Promise<Read[]> {
  const zx = await reader();
  const opts = { formats: ["QRCode" as const], maxNumberOfSymbols: 80, tryHarder: true, tryRotate: true, tryInvert: false, tryDownscale: true };
  const out = new Map<string, Read>();
  for (const r of await zx.readBarcodes(file, opts)) if (r.isValid) out.set(r.text, r as Read);
  const bmp = await createImageBitmap(file);
  const W = bmp.width, H = bmp.height, cols = 3, rows = 3, scale = 2;
  const tw = Math.ceil(W / cols * 1.35), th = Math.ceil(H / rows * 1.35);
  const canvas = document.createElement("canvas");
  canvas.width = tw * scale; canvas.height = th * scale;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) { bmp.close(); return [...out.values()]; }
  ctx.imageSmoothingQuality = "high";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = Math.max(0, Math.min(W - tw, Math.round((c * W) / cols - (tw - W / cols) / 2)));
    const y0 = Math.max(0, Math.min(H - th, Math.round((r * H) / rows - (th - H / rows) / 2)));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, x0, y0, tw, th, 0, 0, tw * scale, th * scale);
    const found = await zx.readBarcodes(ctx.getImageData(0, 0, canvas.width, canvas.height), { ...opts, tryDownscale: false });
    for (const f of found) {
      if (!f.isValid || out.has(f.text)) continue;
      const map = (p: { x: number; y: number }) => ({ x: x0 + p.x / scale, y: y0 + p.y / scale });
      out.set(f.text, { text: f.text, isValid: true, position: { topLeft: map(f.position.topLeft), topRight: map(f.position.topRight), bottomRight: map(f.position.bottomRight), bottomLeft: map(f.position.bottomLeft) } });
    }
  }
  bmp.close();
  return [...out.values()];
}

function imageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve({ width: i.naturalWidth, height: i.naturalHeight }); i.onerror = reject; i.src = url; });
}

/** Add photos; returns the profile ids found. Shows each photo with a box on every code it read. */
export function PhotoReader({ known, onFound }: { known: Set<string>; onFound: (ids: string[]) => void }) {
  const [shots, setShots] = useState<Shot[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => shots.forEach((s) => URL.revokeObjectURL(s.url)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const byShort = useMemo(() => new Map([...known].map((id) => [shortId(id), id])), [known]);

  async function read(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true); setError(null);
    try {
      const all: string[] = [];
      for (const file of Array.from(files)) {
        const url = URL.createObjectURL(file);
        const [{ width, height }, results] = await Promise.all([imageSize(url), decode(file)]);
        const found: Found[] = [];
        let k = 0, u = 0;
        for (const r of results) {
          const id = r.isValid ? matchCode(r.text, byShort) : null;
          const ok = Boolean(id);
          if (ok && id) { all.push(id); k += 1; } else u += 1;
          const p = r.position;
          const xs = [p.topLeft.x, p.topRight.x, p.bottomRight.x, p.bottomLeft.x], ys = [p.topLeft.y, p.topRight.y, p.bottomRight.y, p.bottomLeft.y];
          found.push({ x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys),
            points: `${p.topLeft.x},${p.topLeft.y} ${p.topRight.x},${p.topRight.y} ${p.bottomRight.x},${p.bottomRight.y} ${p.bottomLeft.x},${p.bottomLeft.y}`, known: ok });
        }
        setShots((s) => [...s, { url, width, height, found, known: k, unknown: u, name: file.name }]);
      }
      onFound(all);
    } catch (e) {
      setError(e instanceof Error ? `We couldn't read that photo. ${e.message}` : "We couldn't read that photo.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="reader">
      <label className={`btn btn-primary reader-btn${busy ? " is-busy" : ""}`}>
        <input ref={input} type="file" accept="image/*" capture="environment" multiple onChange={(e) => void read(e.target.files)} disabled={busy} />
        {busy ? "Reading the cards…" : shots.length ? "Add another photo" : "Take a photo of the cards"}
      </label>
      <p className="hint">Lay the cards flat, face up, and hold the phone straight above so the cluster fills the frame. Up to about 8 cards fit in one photo. More than that? Take a few photos; a card that shows up twice is only counted once.</p>
      {error && <ErrorNote title="Couldn't read the photo" message={error} />}
      {shots.length > 0 && (
        <ul className="shots">
          {shots.map((s, i) => (
            <li key={i} className="shot">
              <div className="shot-img">
                <img src={s.url} alt={`Photo ${i + 1} of the cluster`} />
                <svg viewBox={`0 0 ${s.width} ${s.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  {s.found.map((f, j) => <polygon key={j} points={f.points} className={f.known ? "hit" : "miss"} style={{ strokeWidth: Math.max(4, s.width / 250) }} />)}
                </svg>
              </div>
              <p className="shot-note">{s.known} {s.known === 1 ? "card" : "cards"} read{s.unknown ? `, ${s.unknown} ${s.unknown === 1 ? "code" : "codes"} not from this gallery` : ""}.</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pick profiles by hand: search, tick, untick. */
export function ProfilePicker({ rows, selected, onToggle }: { rows: ProfileRow[]; selected: Set<string>; onToggle: (id: string) => void }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const t = q.trim().toLocaleLowerCase();
    const list = t ? rows.filter((p) => `${p.name ?? ""} ${kindOf(p)}`.toLocaleLowerCase().includes(t)) : rows;
    return [...list].sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id)) || (a.name ?? "").localeCompare(b.name ?? ""));
  }, [rows, q, selected]);
  return (
    <div className="picker">
      <label className="sr-only" htmlFor="pick-q">Find a profile</label>
      <input id="pick-q" className="input" type="search" placeholder="Find a profile by name or type" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="pick-list">
        {shown.map((p) => (
          <li key={p.id}>
            <label className={`pick${selected.has(p.id) ? " on" : ""}`}>
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => onToggle(p.id)} />
              <CapGlyph p={p} size={32} label={false} />
              <span className="pick-main"><span className="pick-name">{p.name?.trim() || "Untitled player"}</span><span className="pick-kind">{kindOf(p)}</span></span>
            </label>
          </li>
        ))}
        {shown.length === 0 && <li className="muted pick-empty">No profiles match.</li>}
      </ul>
    </div>
  );
}
