import { Fragment, type ReactNode } from "react";
import { NOTES, SECTIONS, noteRefs, type Note, type Section } from "../lib/essay";

/* The essay's small inline markup: **bold**, *italic*, [^n] note marks, and bare URLs in notes. */

const MARK = /(\*\*[^*]+\*\*|\*[^*]+\*|\[\^\d+\]|https?:\/\/[^\s]+)/g;

export function Inline({ text, notePrefix = "", linkUrls = false }: { text: string; notePrefix?: string; linkUrls?: boolean }) {
  const parts = text.split(MARK);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith("**")) return <b key={i}>{p.slice(2, -2)}</b>;
        if (p.startsWith("*")) return <i key={i}>{p.slice(1, -1)}</i>;
        if (p.startsWith("[^")) {
          const n = p.slice(2, -1);
          return <sup key={i} className="fn"><a href={`#${notePrefix}n${n}`} id={`${notePrefix}r${n}`} aria-label={`Note ${n}`}>{n}</a></sup>;
        }
        if (linkUrls && p.startsWith("http")) {
          const trimmed = p.replace(/[.,;)]+$/, "");
          const host = trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          return <Fragment key={i}><a href={trimmed} target="_blank" rel="noopener noreferrer">{host}<span className="sr-only"> (opens in a new tab)</span></a>{p.slice(trimmed.length)}</Fragment>;
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/** One section: the lead line large, then the body, then key terms and the two short lines. */
export function EssaySection({ s, n, headingLevel = 2, notePrefix = "", children }: { s: Section; n?: number; headingLevel?: 2 | 3; notePrefix?: string; children?: ReactNode }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <section className="es" id={s.id} aria-labelledby={`${notePrefix}h-${s.id}`}>
      <H className="h-section es-title" id={`${notePrefix}h-${s.id}`}>{n !== undefined && <span className="es-n">{n}</span>}{s.title}</H>
      <p className="es-lead"><Inline text={s.lead} notePrefix={notePrefix} /></p>
      <div className="es-body">
        {s.body.map((p, i) => <p key={i}><Inline text={p} notePrefix={notePrefix} /></p>)}
      </div>
      {s.terms && <p className="es-terms"><span>Key terms</span>{s.terms.join(" · ")}</p>}
      {s.forProfile && <p className="es-for"><span>For your profile</span><Inline text={s.forProfile} /></p>}
      {s.talk && <p className="es-talk"><span>Talk about it</span><Inline text={s.talk} /></p>}
      {children}
    </section>
  );
}

export function NoteList({ notes, notePrefix = "", heading = "Notes" }: { notes: Note[]; notePrefix?: string; heading?: string }) {
  return (
    <section className="es-notes" aria-labelledby={`${notePrefix}h-notes`}>
      <h2 className="es-notes-h" id={`${notePrefix}h-notes`}>{heading}</h2>
      <ol>
        {notes.map((nt) => (
          <li key={nt.n} id={`${notePrefix}n${nt.n}`} value={nt.n}>
            <Inline text={nt.text} linkUrls />
            {" "}<a className="fn-back" href={`#${notePrefix}r${nt.n}`} aria-label={`Back to note ${nt.n} in the text`}>↩</a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A section on its own (the editor's side sheet), with only the notes it cites. */
export function SectionAlone({ s }: { s: Section }) {
  const refs = noteRefs(s);
  const n = SECTIONS.indexOf(s) + 1;
  return (
    <>
      <EssaySection s={s} n={n} notePrefix="sh-" />
      {refs.length > 0 && <NoteList notes={NOTES.filter((nt) => refs.includes(nt.n))} notePrefix="sh-" heading="Notes for this section" />}
    </>
  );
}
