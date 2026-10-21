import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import { createScene, type Scene } from "../scene/scene.js";

/* The opening, as on the CSC Workshop 3 portal: dust gathers on the orbits
   while the app loads, sweeps into the swoosh as the live orb paints in, the
   mark and the logotype resolve, and then either the portal content rises in
   under the lockup (`portal`), or the scene flies into the orb and hands over
   to the page (`onDone`). */

export interface OpeningHandle {
  /** Fly into the orb; resolves when the screen is ink. */
  leave(): Promise<void>;
  /** The dust jolts. */
  jolt(): void;
}

const SESSION_KEY = "sp.opened";
export function openedThisSession(): boolean { try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; } }
export function markOpened() { try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* storage may be blocked */ } }

/** The page beneath arrives: the light blooms from the centre, the bar comes down, the headline arrives word by word. */
export function arrive() {
  const root = document.documentElement;
  root.classList.add("arrive");
  window.setTimeout(() => root.classList.remove("arrive"), 3200);
}

interface Props {
  /** The app has what it needs; until then the dust keeps circling. */
  ready: boolean;
  /** Content to rise in under the lockup. Without it, the scene leaves on its own once formed. */
  portal?: ReactNode;
  onDone?: () => void;
  label?: string;
}

export const Opening = forwardRef<OpeningHandle, Props>(function Opening({ ready, portal, onDone, label = "Loading" }, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const orbRef = useRef<HTMLCanvasElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLImageElement>(null);
  const wordRef = useRef<HTMLImageElement>(null);
  const scene = useRef<Scene | null>(null);
  const hasPortal = useRef(Boolean(portal));
  hasPortal.current = Boolean(portal);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const root = rootRef.current, canvas = sceneRef.current, slot = slotRef.current;
    if (!root || !canvas || !slot) return;
    const s = createScene({
      root, scene: canvas, orb: orbRef.current, slot, col: colRef.current, portal: portalRef.current,
      images: [markRef.current, wordRef.current],
      onFormed: () => {
        if (hasPortal.current) s.showPortal();
        else void s.leave().then(() => done.current?.());
      },
    });
    scene.current = s;
    return () => { s.destroy(); scene.current = null; };
  }, []);

  useEffect(() => { if (ready) scene.current?.setReady(); }, [ready]);
  // The portal's height changes what the lockup's lift should be.
  useEffect(() => { scene.current?.relayout(); }, [portal]);

  useImperativeHandle(ref, () => ({
    leave: () => scene.current ? scene.current.leave() : Promise.resolve(),
    jolt: () => scene.current?.jolt(),
  }), []);

  return (
    <div className="opening" ref={rootRef}>
      <canvas className="opening-orb" ref={orbRef} aria-hidden="true" />
      <canvas className="opening-scene" ref={sceneRef} aria-hidden="true" />
      <div className="opening-stage">
        <div className="opening-col" ref={colRef}>
          <div className="opening-slot" ref={slotRef}>
            <div className="opening-loader" aria-hidden="true">{label}</div>
            <img className="mark" ref={markRef} src="/lockup-c-mark.webp" alt="" width={1616} height={1011} decoding="async" />
            <img className="word" ref={wordRef} src="/lockup-c-word.webp" alt="The Upskilling Labs" width={1616} height={1011} decoding="async" />
          </div>
          <div className="opening-portal" ref={portalRef}>{portal}</div>
        </div>
      </div>
      <p className="sr-only" role="status">{ready ? "" : `${label}…`}</p>
    </div>
  );
});
