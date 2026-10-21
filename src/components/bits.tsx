import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { CAPITALS, LEVEL_LABEL, ratingField } from "../lib/capitals";
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
        return <span key={c.key} className={v ? `s-${v}` : ""} title={`${c.label}: ${v ? LEVEL_LABEL[v] : "not rated"}`}>{c.label.slice(0, 3)}</span>;
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
