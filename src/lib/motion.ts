// Reveals, as on the CSC Workshop 3 site: each `.rv` element arrives as it comes
// into view, and elements that appear together arrive in turn (--i staggers them).
// Watches the DOM, so content that loads later reveals too.

export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

let started = false;

export function startReveals() {
  if (started || typeof document === "undefined") return;
  started = true;
  document.documentElement.classList.add("js");

  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { e.target.classList.add("in"); io?.unobserve(e.target); }
        }
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 })
    : null;

  let pending: Element[] = [];
  let scheduled = false;
  function flush() {
    scheduled = false;
    const batch = pending; pending = [];
    batch.forEach((el, i) => {
      (el as HTMLElement).style.setProperty("--i", String(Math.min(i, 10)));
      // Two frames so the starting state paints before the transition runs.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (io) io.observe(el); else el.classList.add("in");
      }));
    });
  }
  function collect(root: ParentNode) {
    const found: Element[] = [];
    if (root instanceof Element && root.matches(".rv:not([data-rv])")) found.push(root);
    root.querySelectorAll?.(".rv:not([data-rv])").forEach((el) => found.push(el));
    for (const el of found) { el.setAttribute("data-rv", ""); pending.push(el); }
    if (found.length && !scheduled) { scheduled = true; queueMicrotask(flush); }
  }
  collect(document);
  new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach((n) => { if (n.nodeType === 1) collect(n as Element); });
  }).observe(document.body, { childList: true, subtree: true });

  // Printing must never catch a card half-arrived.
  window.addEventListener("beforeprint", () => document.querySelectorAll(".rv").forEach((el) => el.classList.add("in")));
}
