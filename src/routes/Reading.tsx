import { Link } from "react-router-dom";
import { LocalNav, Words, useTitle } from "../components/bits";
import { TOPICS } from "../lib/reading";
import { TopicBody } from "../components/Learn";
import type { TopicId } from "../lib/reading";

const SHORT_LABEL: Record<TopicId, string> = { ced: "Community development", capitals: "Seven capitals", frames: "Frame innovation", archaeology: "Looking back", field: "Field mapping", customers: "Two customers" };

/* Background reading: the ideas behind this exercise, in plain words, each with
   a few sources that were opened and checked (2026-10-21). Prefer free,
   authoritative sources; say so when something is paywalled or needs an account. */

export default function Reading() {
  useTitle("Background reading");
  return (
    <div className="page reading">
      <header className="hero">
        <p className="kicker rv">Build Cycle C04 · Background reading</p>
        <h1 className="display rv"><Words text="The ideas behind the map." /></h1>
        <p className="lede rv">You don't need to read any of this to write a good profile. What matters most is your own view. But if you're curious where the questions come from, start here.</p>
      </header>
      <LocalNav label="Topics on this page" links={TOPICS.map((t) => ({ id: t.id, label: SHORT_LABEL[t.id] }))} />

      {TOPICS.map((t, i) => (
        <section key={t.id} id={t.id} className="topic" aria-labelledby={`h-${t.id}`}>
          <TopicBody t={t} n={i + 1} />
        </section>
      ))}

      <p className="fine rv">Links checked October 2026. <Link to="/" viewTransition>← Back to my profiles</Link></p>
    </div>
  );
}
