import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Words, useTitle } from "../components/bits";
import { BLOCKS, currentBlock, label } from "../lib/today";

/* The run of show for sensemaking day. The block the room is in is marked from
   the clock, so a phone shows where we are; every block is readable ahead. */

export default function Today() {
  useTitle("Today");
  const [now, setNow] = useState<number | null>(() => currentBlock());
  useEffect(() => {
    const t = setInterval(() => setNow(currentBlock()), 30_000);
    return () => clearInterval(t);
  }, []);
  const live = now !== null;

  return (
    <div className="page today">
      <header className="intro">
        <h1 className="h-display"><Words text="Saturday, step by step" /></h1>
        <p className="lede">October 24 at DC Public Library. Doors at 10:15, we start at 10:30 and finish at 3:45. Seven tensions from the retreat, tested against what people said in the survey and the players on the cards, ending with Research Pods to recruit for.</p>
        <p className="muted small">Lunch isn't provided. The break is 11:50 to 12:30.</p>
      </header>

      <ol className="rs" aria-label="Run of show">
        {BLOCKS.map((b, i) => {
          const state = !live ? "" : i < (now as number) ? " is-past" : i === now ? " is-now" : "";
          return (
            <li key={b.start} className={`rs-block${state}`} id={`b-${b.start.replace(":", "")}`} aria-current={i === now ? "step" : undefined}>
              <div className="rs-time">
                <time>{label(b.start)}</time>
                <span className="rs-who">{b.who}</span>
                {i === now && <span className="rs-live">Now</span>}
              </div>
              <div className="rs-body">
                <h2 className="rs-title">{b.title}</h2>
                <ul className="rs-what">{b.what.map((w, j) => <li key={j}>{w}</li>)}</ul>
                {b.produces && <p className="rs-out"><span>Leaves behind</span>{b.produces}</p>}
                {b.app && (
                  <p className="rs-app">
                    {b.app.map((a) => a.to ? <Link key={a.text} className="btn btn-quiet btn-sm" to={a.to} viewTransition>{a.text}</Link> : a.href ? <a key={a.text} className="btn btn-quiet btn-sm" href={a.href}>{a.text}</a> : <span key={a.text}>{a.text}</span>)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="rs-after" aria-labelledby="rs-h">
        <h2 className="h-section" id="rs-h">After today</h2>
        <p>Each Research Pod has three weeks, to November 14, to propose frames and take them to the players. A frame reads "if we approached this as if it were …, then …". Projects form on the 14th around frames that held up.</p>
        <p className="muted">The vocabulary (archaeology, paradox, context, field, themes, frames) is Kees Dorst's frame creation model. The <Link to="/reading" viewTransition>reading</Link> covers the capitals the cards use.</p>
      </section>
    </div>
  );
}
