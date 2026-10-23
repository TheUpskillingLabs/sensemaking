import { useEffect, useRef } from "react";
import { TutorialPlayer } from "../routes/Tutorial";
import { CASE } from "../lib/tutorial";

/* The tutorial, the first time someone signs in: a full-screen sheet on a
   phone, a large panel on a laptop. It doesn't play until they press Play,
   so nothing moves before they've read what it is. Closing it, by the
   button, Escape or Start your own, counts as seen. Seen is remembered per
   person in this browser; the tutorial page is always there from Home. */

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
