import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { topic, type TopicId } from "../lib/reading";
import { SectionAlone } from "./Essay";
import { sectionFor } from "../lib/essay";

/* Background, delivered without getting in the way of the profile:
   - <Why id> sits beside a question: one quiet "Why we ask" link. Tapping it
     opens a short explanation in place (two or three sentences). Nothing opens
     on its own, and only one is open at a time.
   - "Read more" opens the matching section of the reading essay in a side
     sheet (a bottom sheet on a phone). The page stays where it was, so typing
     and autosave carry on; Escape or Close puts focus back where it was.
   - The Reading tab holds the whole essay. */

interface SheetApi { open: (id: TopicId) => void; openWhy: string | null; setOpenWhy: (key: string | null) => void }
const SheetCtx = createContext<SheetApi | null>(null);

export function ReadingSheetProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<TopicId | null>(null);
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const open = useCallback((next: TopicId) => {
    returnTo.current = document.activeElement as HTMLElement | null;
    setId(next);
  }, []);
  const close = useCallback(() => dialog.current?.close(), []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (id && !d.open) { d.showModal(); d.querySelector<HTMLElement>(".sheet-body")?.scrollTo(0, 0); }
  }, [id]);

  return (
    <SheetCtx.Provider value={{ open, openWhy, setOpenWhy }}>
      {children}
      <dialog
        ref={dialog}
        className="reading-sheet reading"
        aria-labelledby={id ? `sh-h-${sectionFor(id).id}` : undefined}
        onClose={() => { setId(null); returnTo.current?.focus?.({ preventScroll: true }); }}
        onClick={(e) => { if (e.target === dialog.current) close(); }}
      >
        {id && (
          <div className="sheet-inner">
            <div className="sheet-top">
              <span className="sheet-label">Background reading</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={close} autoFocus>Close</button>
            </div>
            <div className="sheet-body essay"><SectionAlone s={sectionFor(id)} /></div>
          </div>
        )}
      </dialog>
    </SheetCtx.Provider>
  );
}

export function useReadingSheet(): SheetApi {
  const v = useContext(SheetCtx);
  if (!v) throw new Error("useReadingSheet outside ReadingSheetProvider");
  return v;
}

const SHORT: Record<TopicId, string> = { ced: "community economic development", capitals: "the seven capitals", frames: "frame innovation", archaeology: "looking back first", field: "field mapping", customers: "the two kinds of customers" };

/** A quiet "Why we ask" beside a question. Collapsed by default; one open at a time. */
export function Why({ id, label = "Why we ask" }: { id: TopicId; label?: string }) {
  const { open, openWhy, setOpenWhy } = useReadingSheet();
  const key = useId();
  const expanded = openWhy === key;
  const t = topic(id);
  return (
    <span className="why">
      <button type="button" className="why-toggle" aria-expanded={expanded} aria-controls={`${key}-panel`}
        onClick={() => setOpenWhy(expanded ? null : key)}>
        {label}
      </button>
      {expanded && (
        <span className="why-panel" id={`${key}-panel`} role="note">
          {t.why}{" "}
          <button type="button" className="why-more" onClick={() => open(id)}>Read more about {SHORT[id]}</button>
        </span>
      )}
    </span>
  );
}

/** A button that opens one topic in the sheet. */
export function ReadMore({ id, children }: { id: TopicId; children: ReactNode }) {
  const { open } = useReadingSheet();
  return <button type="button" className="why-more" onClick={() => open(id)}>{children}</button>;
}

function useRemembered(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [v, setV] = useState<boolean>(() => { try { const s = localStorage.getItem(key); return s === null ? initial : s === "1"; } catch { return initial; } });
  const set = useCallback((next: boolean) => { setV(next); try { localStorage.setItem(key, next ? "1" : "0"); } catch { /* storage may be blocked */ } }, [key]);
  return [v, set];
}

/** Above the gallery: three ways to read the field. Folded away once someone has closed it. */
export function ReadTheField() {
  const [open, setOpen] = useRemembered("sp.guide.gallery", true);
  return (
    <details className="guide" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary><span className="guide-title">How to read the field</span><span className="guide-sub">Three things to look for</span></summary>
      <ol className="guide-list">
        <li>
          <b>Who keeps showing up?</b> Players many people wrote about are probably central. Players only one person saw might be blind spots for the rest of us. <ReadMore id="field">Field mapping</ReadMore>
        </li>
        <li>
          <b>Which capitals are strong, and which are thin?</b> Use the “Rated for a capital” filter. A capital almost nobody rates high is something our area may be missing. <ReadMore id="capitals">The seven capitals</ReadMore>
        </li>
        <li>
          <b>Served, contributing, or both?</b> Some players are people The Labs serves, some contribute to that work by paying, hosting, hiring, or volunteering, and some are both. Where what one side wants clashes with what the other needs, write it down. That's a tension worth talking about. <ReadMore id="customers">Two kinds of customers</ReadMore>
        </li>
      </ol>
    </details>
  );
}

/** Facilitators only: questions to run the sensemaking day with. */
export function DiscussionPrompts() {
  const [open, setOpen] = useRemembered("sp.guide.prompts", false);
  return (
    <details className="guide guide-fac" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary><span className="guide-title">Discussion prompts</span><span className="guide-sub">For facilitators, to work through for each program</span></summary>
      <ol className="guide-list">
        <li>Who is the main person this program helps? Describe a real person, not a big group.</li>
        <li>Who pays for it, and who else has to be happy for it to keep going?</li>
        <li>What does each of them want? Use their own words from the profiles.</li>
        <li>Does what the funder pays for depend on people really being helped? If not, where's the gap?</li>
        <li>What proof would make both of them happy, and who would collect it?</li>
        <li>Which players are on both sides, like a library that hosts Upskillers and also pays for programs?</li>
        <li>Where does what a contributor wants clash with what the people being served need? Write each one down as a tension.</li>
      </ol>
      <p className="small muted">Background: <ReadMore id="customers">two kinds of customers</ReadMore> and <ReadMore id="frames">frame innovation</ReadMore>.</p>
    </details>
  );
}
