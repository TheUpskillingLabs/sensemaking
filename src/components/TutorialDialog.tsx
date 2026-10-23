import { useEffect, useRef, useState } from "react";
import { TutorialPlayer } from "../routes/Tutorial";
import { CASE } from "../lib/tutorial";

/* The first time someone signs in, a small question: watch a two-minute
   example first, or go straight to writing. Only a yes opens the tutorial
   (a full-screen sheet on a phone, a large panel on a laptop, paused until
   they press Play). Either answer, Close, or Escape counts as seen. Seen is
   remembered per person in this browser; the tutorial page is always in the
   menu as "How to write a profile". */

const KEY = (userId: string) => `sp.tutorial.seen.${userId}`;
export function tutorialSeen(userId: string): boolean { try { return localStorage.getItem(KEY(userId)) === "1"; } catch { return true; } }
export function markTutorialSeen(userId: string) { try { localStorage.setItem(KEY(userId), "1"); } catch { /* storage may be blocked */ } }

export default function TutorialDialog({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    document.documentElement.classList.add("has-sheet");
    return () => document.documentElement.classList.remove("has-sheet");
  }, []);
  const [watching, setWatching] = useState(false);
  if (!watching) {
    return (
      <dialog ref={ref} className="tut-dialog tut-ask" aria-labelledby="tut-ask-h" aria-describedby="tut-ask-p" onCancel={(e) => { e.preventDefault(); onClose(); }}>
        <div className="tut-ask-inner">
          <h2 className="tut-dialog-h" id="tut-ask-h">Want to see one written first?</h2>
          <p id="tut-ask-p">A two-minute example walks through a profile for a made-up community kitchen, one question at a time. You can skip it and start writing; it stays in the menu as "How to write a profile".</p>
          <div className="tut-ask-act">
            <button type="button" className="btn btn-primary" onClick={() => setWatching(true)} autoFocus>Watch the example</button>
            <button type="button" className="btn btn-quiet" onClick={onClose}>Skip, I'll start writing</button>
          </div>
        </div>
      </dialog>
    );
  }
  return (
    <dialog ref={ref} className="tut-dialog" aria-labelledby="tut-dialog-h" onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <div className="tut-dialog-inner">
        <header className="tut-dialog-top">
          <div>
            <h2 className="tut-dialog-h" id="tut-dialog-h">Watch a profile get written</h2>
            <p className="tut-dialog-sub">{CASE.blurb}</p>
          </div>
          <button type="button" className="btn btn-quiet btn-sm" onClick={onClose}>Close</button>
        </header>
        <div className="tut-dialog-body tutorial">
          <TutorialPlayer onStart={onStart} autoplay={false} focusPlay />
        </div>
      </div>
    </dialog>
  );
}
