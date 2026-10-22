import { Link } from "react-router-dom";
import { LocalNav, Words, useTitle } from "../components/bits";
import { EssaySection, Inline, NoteList } from "../components/Essay";
import { ESSAY, NOTES, SECTIONS } from "../lib/essay";

/* The reading behind the profile, as one essay. Two ways through it: the
   brief, the lead lines and the italic lines for a skim; everything for the
   full read. Notes are real footnotes: a mark jumps down, the arrow jumps
   back. The same sections open one at a time from the editor's "Why we ask". */

export default function Reading() {
  useTitle("Where the questions come from");
  return (
    <div className="page reading">
      <header className="intro">
        <h1 className="h-display"><Words text={ESSAY.title} /></h1>
        <p className="es-time">{ESSAY.readingTime}</p>
      </header>

      <div className="doc-layout">
        <aside className="doc-rail">
          <LocalNav label="Sections of this guide" rail links={[
            { id: "brief", label: "In brief" },
            ...SECTIONS.map((s, i) => ({ id: s.id, label: `${i + 1}. ${s.title}` })),
            { id: "notes", label: "Notes" },
          ]} />
        </aside>

        <div className="doc-main essay">
          <div className="es-note">
            {ESSAY.note.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          <section className="es-brief" id="brief" aria-labelledby="h-brief">
            <h2 className="es-brief-h" id="h-brief">In brief</h2>
            <ul>{ESSAY.brief.map((b, i) => <li key={i}><Inline text={b} /></li>)}</ul>
          </section>

          {SECTIONS.map((s, i) => <EssaySection key={s.id} s={s} n={i + 1} />)}

          <p className="es-closing">{ESSAY.closing}</p>

          <div id="notes">
            <NoteList notes={NOTES} />
            <p className="fine">{ESSAY.checked} <Link to="/" viewTransition>Back to your profiles</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
