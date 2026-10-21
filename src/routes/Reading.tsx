import { Link } from "react-router-dom";
import { Words, useTitle } from "../components/bits";
import { TOPICS } from "../lib/reading";
import { TopicBody } from "../components/Learn";

/* Background reading: the ideas behind this exercise, in plain words, each with
   a few sources that were opened and checked (2026-10-21). Prefer free,
   authoritative sources; say so when something is paywalled or needs an account. */

export default function Reading() {
  useTitle("Background reading");
  return (
    <div className="page page-narrow reading">
      <div className="page-head">
        <p className="eyebrow rv">Build Cycle C04 · Background reading</p>
        <h1 className="h1 rv"><Words text="The ideas behind the map" /></h1>
        <p className="lede rv">You don't need to read any of this to write a good profile. What matters most is your own view. But if you're curious where the questions come from, start here.</p>
        <nav className="toc rv" aria-label="On this page">
          {TOPICS.map((t) => <a key={t.id} href={`#${t.id}`}>{t.title}</a>)}
        </nav>
      </div>

      {TOPICS.map((t) => (
        <section key={t.id} id={t.id} className="topic" aria-labelledby={`h-${t.id}`}>
          <TopicBody t={t} />
        </section>
      ))}

      <p className="small muted rv" style={{ marginTop: 48 }}>Links checked October 2026. <Link to="/" viewTransition>← Back to my profiles</Link></p>
    </div>
  );
}
