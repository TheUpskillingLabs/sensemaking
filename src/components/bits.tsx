import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CAPITALS, LEVEL_LABEL, RING_LABEL, ratingField, typeLabel } from "../lib/capitals";
import type { Level, ProfileRow } from "../lib/types";

export function Loader({ label = "Loading", center = false }: { label?: string; center?: boolean }) {
  return <div className={`loader${center ? " loader-center" : ""}`} role="status" aria-live="polite">{label}…</div>;
}

export function ErrorNote({ message, onRetry, title = "Something went wrong" }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div className="note note-error rv" role="alert">
      <p><strong>{title}.</strong> {message}</p>
      {onRetry && <div className="act" style={{ marginTop: 12 }}><button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>Try again</button></div>}
    </div>
  );
}

export function Tick() {
  return <svg className="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" /></svg>;
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Low / Medium / High (or any small set) as native radios with a gliding thumb. */
export function Segmented<T extends string>({ name, value, options, onChange, labelledBy, dark, idFirst, invalid }: {
  name: string; value: T | null; options: { value: T; label: string }[]; onChange: (v: T) => void;
  labelledBy?: string; dark?: boolean; idFirst?: string; invalid?: boolean;
}) {
  const sel = options.findIndex((o) => o.value === value);
  return (
    <div className={`seg${dark ? " dark" : ""}`} role="radiogroup" aria-labelledby={labelledBy} aria-invalid={invalid || undefined}
      data-empty={sel < 0} style={{ ["--n" as string]: options.length, ["--sel" as string]: Math.max(sel, 0) }}>
      <span className="thumb" aria-hidden="true" />
      {options.map((o, i) => {
        const id = i === 0 && idFirst ? idFirst : `${name}-${o.value}`;
        return (
          <span key={o.value} style={{ display: "contents" }}>
            <input type="radio" id={id} name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <label htmlFor={id}>{o.label}</label>
          </span>
        );
      })}
    </div>
  );
}

export function CapStrip({ p }: { p: ProfileRow }) {
  return (
    <div className="strip" role="img" aria-label={CAPITALS.map((c) => { const v = p[ratingField(c.key)]; return `${c.label}: ${v ? LEVEL_LABEL[v] : "not rated"}`; }).join(", ")}>
      {CAPITALS.map((c) => {
        const v = p[ratingField(c.key)] as Level | null;
        return <span key={c.key} className={`cd cd-${v ?? "none"}`} title={`${c.label}: ${v ? LEVEL_LABEL[v] : "not rated"}`}><i aria-hidden="true" />{c.label.slice(0, 3)}</span>;
      })}
    </div>
  );
}

/** An accessible in-page confirm, using the native <dialog> (focus trap, Esc to close). */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = "Cancel", danger, busy, onConfirm, onCancel }: {
  open: boolean; title: string; children?: ReactNode; confirmLabel: string; cancelLabel?: string; danger?: boolean; busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useRef(`dlg-${Math.random().toString(36).slice(2)}`).current;
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }}>
      <div className="dialog-body">
        <h2 id={titleId} className="h3">{title}</h2>
        {children && <div className="muted">{children}</div>}
        <div className="act">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button type="button" className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={busy} autoFocus>{busy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </dialog>
  );
}

/** Sets the document title for each screen. */
export function useTitle(t: string) {
  useLayoutEffect(() => { document.title = t ? `${t} · Stakeholder Profiles` : "Stakeholder Profiles · The Upskilling Labs"; }, [t]);
}

/** A headline whose words arrive one by one when the page is arriving (after the opening). */
export function Words({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  return (
    <span className="words" aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true"><span className="w" style={{ ["--w" as string]: i }}>{w}</span>{i < words.length - 1 ? " " : ""}</span>
      ))}
    </span>
  );
}

/** A profile's shape: its seven capitals as one small radial mark, read clockwise from the top
    (Natural, Cultural, Human, Social, Political, Financial, Built). The further out a point, the higher the rating. */
export function CapGlyph({ p, size = 44, label = true }: { p: ProfileRow; size?: number; label?: boolean }) {
  const K = { low: 0.4, medium: 0.7, high: 1 } as const;
  const c = 50, r = 44;
  const at = (i: number, k: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / CAPITALS.length; return `${(c + Math.cos(a) * r * k).toFixed(1)},${(c + Math.sin(a) * r * k).toFixed(1)}`; };
  const vals = CAPITALS.map((cap) => p[ratingField(cap.key)] as Level | null);
  const rated = vals.filter(Boolean).length;
  const desc = CAPITALS.map((cap, i) => `${cap.label} ${vals[i] ? LEVEL_LABEL[vals[i] as Level].toLowerCase() : "not rated"}`).join(", ");
  return (
    <svg className={`glyph${rated ? "" : " glyph-empty"}`} viewBox="0 0 100 100" width={size} height={size}
      role={label ? "img" : undefined} aria-label={label ? `Capitals: ${desc}` : undefined} aria-hidden={label ? undefined : true}>
      <polygon className="g-frame" points={CAPITALS.map((_, i) => at(i, 1)).join(" ")} />
      {CAPITALS.map((_, i) => <line key={i} className="g-spoke" x1={c} y1={c} x2={at(i, 1).split(",")[0]} y2={at(i, 1).split(",")[1]} />)}
      {rated > 0 && <polygon className="g-shape" points={vals.map((v, i) => at(i, v ? K[v] : 0.08)).join(" ")} />}
    </svg>
  );
}

/** How to read the mark: one worked example, labelled, instead of a colour legend. */
export function GlyphKey() {
  const K = { low: 0.4, medium: 0.7, high: 1 } as const;
  const ex: Level[] = ["high", "medium", "low", "high", "medium", "low", "medium"];
  const c = 60, r = 40;
  const at = (i: number, k: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / CAPITALS.length; return [c + Math.cos(a) * r * k, c + Math.sin(a) * r * k]; };
  return (
    <figure className="gkey">
      <svg className="glyph" viewBox="0 0 120 120" width={120} height={120} aria-hidden="true">
        <polygon className="g-frame" points={CAPITALS.map((_, i) => at(i, 1).join(",")).join(" ")} />
        {CAPITALS.map((_, i) => { const [x, y] = at(i, 1); return <line key={i} className="g-spoke" x1={c} y1={c} x2={x} y2={y} />; })}
        <polygon className="g-shape" points={ex.map((v, i) => at(i, K[v]).join(",")).join(" ")} />
        {CAPITALS.map((cap, i) => { const [x, y] = at(i, 1.32); return <text key={cap.key} className="g-label" x={x} y={y} textAnchor="middle" dominantBaseline="middle">{cap.label.slice(0, 3)}</text>; })}
      </svg>
      <figcaption>Each profile's mark shows the seven capitals, clockwise from Natural at the top. The further a point reaches toward the edge, the higher that capital was rated.</figcaption>
    </figure>
  );
}

/** "Library, inner circle": a player's type and ring as one plain phrase. */
export function kindOf(p: ProfileRow): string {
  const t = p.org_type ? typeLabel(p) : "";
  const r = p.ring ? RING_LABEL[p.ring] : "";
  return t && r ? `${t}, ${r.toLowerCase()}` : t || r;
}

export type StatusKind = "draft" | "submitted" | "edited" | "open" | "closed" | "unlocked";
/** A status is a plain word; colour carries it only where it means something (drafts). */
export function Status({ kind, children }: { kind: StatusKind; children: ReactNode }) {
  return <span className={`status st-${kind}`}>{children}</span>;
}

/** A page's own sections, as a row under the header; the one in view is marked as you scroll. */
export function LocalNav({ links, label, rail }: { links: { id: string; label: string }[]; label: string; rail?: boolean }) {
  const [current, setCurrent] = useState<string | null>(links[0]?.id ?? null);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const els = links.map((l) => document.getElementById(l.id)).filter((e): e is HTMLElement => Boolean(e));
    if (!els.length || !("IntersectionObserver" in window)) return;
    const seen = new Map<string, number>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : Infinity);
      let best: string | null = null, top = Infinity;
      for (const [id, t] of seen) if (t !== Infinity && t < top) { top = t; best = id; }
      if (best) setCurrent(best);
    }, { rootMargin: "-120px 0px -55% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [links]);
  // Keep the marked link in view on a phone, where the row scrolls sideways.
  useEffect(() => {
    const a = ref.current?.querySelector<HTMLElement>(`a[data-id="${current}"]`);
    if (a && ref.current && ref.current.scrollWidth > ref.current.clientWidth) ref.current.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
  }, [current]);
  return (
    <nav className={`lnav${rail ? " lnav-rail" : ""}`} aria-label={label} ref={ref}>
      <ul>
        {links.map((l) => (
          <li key={l.id}><a href={`#${l.id}`} data-id={l.id} aria-current={current === l.id ? "location" : undefined}
            onClick={(e) => { e.preventDefault(); document.getElementById(l.id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); history.replaceState(null, "", `#${l.id}`); }}>{l.label}</a></li>
        ))}
      </ul>
    </nav>
  );
}
