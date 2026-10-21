/* The opening, from The Labs' CSC Workshop 3 portal (site/public/assets/gate.js
   there), lifted as is and turned into a controller the app can drive.

   Beats, on one clock (every beat is a smoothstep window, so each starts and
   ends at rest):
     1. Loading: a field of dust appears grain by grain on the orbits round
        where the orb will be. It tracks real loading (the font, the two logo
        images, AND the app saying it's ready: the sign-in check), holds short
        of full until all are in, and the dust keeps circling meanwhile.
     2. The coalescence: one sweep, tail to head. Each grain leaves its orbit
        on a curve through a halo round the orb and lands on its point of the
        swoosh, while the live orb grows and paints in. A soft bloom; the mark.
     3. The logotype (`named`).
     4. The app decides: `showPortal()` glides the lockup up and the content
        rises in under it; `leave()` flies into the orb (the warp), then ink.
   `jolt()` shakes the dust (a sign-in that didn't work).

   Classes go on `root` (the scene's container), not on <html>:
     loaded, formed, named, ready, leaving.
   The swoosh is 2,048 points traced from the brand kit's orb mark (swoosh.js).
   Canvas 2D for the dust, WebGL 2 for the orb (orb.js), no libraries. */
import { SWOOSH, SWOOSH_N } from "./swoosh.js";
import { mountOrb } from "./orb.js";

const still = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Where the orb sits in the centred lockup (fractions of its width and height; radius as a fraction of width).
const ORB = { x: 0.50006, y: 0.34847, r: 0.21547 };

// The swoosh's points, decoded once, keyed tail (0) to head (1) along its long axis.
const N = SWOOSH_N, AMB = 420, TOTAL = N + AMB;
const tx = new Float32Array(N), ty = new Float32Array(N), br = new Float32Array(N), key = new Float32Array(N);
let headI = 0;
{
  const raw = Uint8Array.from(atob(SWOOSH), (c) => c.charCodeAt(0));
  const dv = new DataView(raw.buffer);
  const ax = Math.cos(31.2 * Math.PI / 180), ay = Math.sin(31.2 * Math.PI / 180);
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < N; i++) {
    tx[i] = dv.getInt16(i * 6, true) / 1e4; ty[i] = dv.getInt16(i * 6 + 2, true) / 1e4; br[i] = dv.getInt16(i * 6 + 4, true) / 1e3;
    key[i] = tx[i] * ax + ty[i] * ay; lo = Math.min(lo, key[i]); hi = Math.max(hi, key[i]);
  }
  for (let i = 0; i < N; i++) key[i] = (key[i] - lo) / (hi - lo);
  for (let i = 1; i < N; i++) if (key[i] > key[headI]) headI = i;
}

const smooth = (u) => u * u * (3 - 2 * u);
const clamp = (v) => Math.max(0, Math.min(1, v));
const bez = (u, a, m, b) => (1 - u) * (1 - u) * a + 2 * u * (1 - u) * m + u * u * b;
const T = { min: 1.2, hold: 0.15, coal: 1.9, settle: 0.7, leave: 1500 };

function sprite(r, g, b, size) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const x = c.getContext("2d"), h = size / 2;
  const grad = x.createRadialGradient(h, h, 0, h, h, h);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`); grad.addColorStop(0.25, `rgba(${r},${g},${b},.55)`); grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grad; x.fillRect(0, 0, size, size); return c;
}

export function createScene({ root, scene: canvas, orb: orbCanvas, slot, col, portal, images = [], onFormed }) {
  const reduce = still();
  const ctx = canvas.getContext("2d");
  let orb = null;
  try { orb = orbCanvas ? mountOrb(orbCanvas) : null; } catch (_) { orb = null; }

  let W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 0;
  function track() {
    const b = slot.getBoundingClientRect();
    cx = b.left + b.width * ORB.x; cy = b.top + b.height * ORB.y; R = b.width * ORB.r;
  }
  function layout() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // The 8px baseline: nudge the column so the content's first line starts on a multiple of 8px.
    if (portal) {
      root.style.setProperty("--snap", "0px");
      const top = portal.getBoundingClientRect().top;
      root.style.setProperty("--snap", ((8 - (((top % 8) + 8) % 8)) % 8).toFixed(2) + "px");
    }
    // Until the content arrives, the lockup sits alone in the middle: lift it by half the content's height.
    if (col) root.style.setProperty("--lift", ((col.offsetHeight - slot.offsetHeight) / 2).toFixed(1) + "px");
    track();
    if (orb) orb.resize(W, H, DPR);
  }

  /* Per-particle state (seeded, so every arrival looks the same). */
  const rnd = (() => { let s = 0x2f6e2b1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const ro = new Float32Array(TOTAL), th0 = new Float32Array(TOTAL), om = new Float32Array(TOTAL), spin = new Float32Array(TOTAL);
  const kind = new Uint8Array(TOTAL), kick = new Float32Array(TOTAL * 2);
  for (let i = 0; i < TOTAL; i++) {
    const band = rnd();
    ro[i] = i < N ? 0.9 + band * 4.8 : 1.1 + rnd() * 7.5;
    th0[i] = rnd() * 6.283; om[i] = 0.55 / Math.pow(ro[i], 1.1) * (0.85 + rnd() * 0.3);
    spin[i] = 0.75 + rnd() * 0.5;
    const k = rnd(); kind[i] = ro[i] < 1.5 && rnd() < 0.6 ? 4 : k < 0.68 ? 0 : k < 0.8 ? 1 : k < 0.9 ? 2 : 3;
  }
  const TILT = -14 * Math.PI / 180, FLAT = 0.34, cT = Math.cos(TILT), sT = Math.sin(TILT);
  const thr = new Float32Array(TOTAL), h = new Float32Array(N), hj = new Float32Array(N);
  for (let i = 0; i < TOTAL; i++) thr[i] = rnd() * 0.92;
  for (let i = 0; i < N; i++) { h[i] = 0.72 * key[i] + 0.28 * rnd(); hj[i] = 0.7 + rnd() * 0.9; }

  const BINS = 6;
  const SPR = Array.from({ length: BINS }, (_, k) => { const u = k / (BINS - 1); return sprite(Math.round(10 + 60 * u), Math.round(130 + 110 * u), Math.round(136 + 104 * u), 32); });
  const MOTE = [sprite(204, 168, 107, 32), sprite(26, 214, 224, 32), sprite(255, 77, 56, 32), sprite(255, 219, 189, 32), sprite(214, 227, 242, 32)];
  const binOf = (b) => Math.min(BINS - 1, Math.max(0, Math.round(((b - 0.33) / 0.67) * (BINS - 1))));

  // Readiness: the font, the logo images, and the app.
  let assets = false, appReady = false;
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    ...images.map((img) => (img && img.decode ? img.decode().catch(() => {}) : Promise.resolve())),
  ]).then(() => { assets = true; });

  let state = "boot", lp = 0, fullAt = 0, coalAt = 0, formedAt = 0, leaveAt = 0, jolt = 0, lastReal = 0, raf = 0, alive = true;
  let leaveDone = null;
  const bootAt = performance.now();
  let slowAvg = 16, thin = false;

  function orbitAt(i, now) {
    const th = th0[i] + om[i] * now / 1000;
    const x = ro[i] * R * Math.cos(th), y = ro[i] * R * FLAT * Math.sin(th);
    return [cx + x * cT - y * sT, cy + x * sT + y * cT];
  }
  function haloFrom(i, x, y, now) {
    const a = Math.atan2(y - cy, x - cx) + hj[i] + now * 0.00012, r = R * (1.18 + 0.6 * ((hj[i] - 0.7) / 0.9));
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92];
  }

  function formed() {
    state = "idle"; formedAt = performance.now();
    root.classList.add("formed");
    setTimeout(() => { if (alive) { root.classList.add("named"); onFormed && onFormed(); } }, 380);
  }

  function frame(now) {
    if (!alive) return;
    const rdt = Math.min(0.1, Math.max(0, (now - (lastReal || now)) / 1000)); lastReal = now;
    const ease60 = (k) => 1 - Math.pow(1 - k, rdt * 60);
    slowAvg = slowAvg * 0.9 + rdt * 1000 * 0.1; thin = slowAvg > 26;
    track();

    // Loading: real progress with a floor of T.min seconds, held short of full until everything's in.
    const bt = (now - bootAt) / 1000;
    const want = Math.min(smooth(clamp(bt / T.min)), assets && appReady ? 1 : 0.86);
    lp = lp + (want - lp) * ease60(0.12); if (want === 1 && lp > 0.996) lp = 1;
    if (state === "boot" && lp === 1) {
      if (!fullAt) fullAt = now;
      if (now - fullAt > T.hold * 1000) { state = "coal"; coalAt = now; root.classList.add("loaded"); }
    }
    const K = state === "boot" ? 0 : clamp((now - coalAt) / 1000 / T.coal);
    const settle = state === "idle" || state === "leave" ? smooth(clamp((now - formedAt) / 1000 / T.settle)) : 0;
    const L = state === "leave" ? clamp((now - leaveAt) / T.leave) : 0;
    const out = L, zoom = smooth(clamp((L - 0.1) / 0.8)), diag = Math.hypot(W, H);

    const fadeA = state === "boot" ? 0.38 : state === "idle" ? 0.3 + 0.7 * settle : state === "leave" ? 0.16 : 0.3;
    if (fadeA < 1) { ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = `rgba(0,0,0,${fadeA})`; ctx.fillRect(0, 0, W, H); }
    else ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    const jk = jolt ? Math.exp(-(now - jolt) / 170) : 0;

    if (orb) {
      if (state === "boot") orbCanvas.style.opacity = "0";
      else if (state === "coal") orbCanvas.style.opacity = String(smooth(clamp(K * 2 - 0.3)));
      else if (orbCanvas.style.opacity) orbCanvas.style.opacity = "";
      if (state !== "boot") {
        const lift = state === "coal" ? smooth(K) : 1 - settle;
        const rz = R * (0.84 + 0.16 * smooth(clamp(K * 1.6))) * (1 + 24 * Math.pow(zoom, 2.6));
        orb.draw({ px: cx, py: cy + (H / 2 - cy) * zoom, R: Math.min(rz, diag * 1.6), t: now / 1000, reveal: smooth(clamp(K * 2)),
          bright: 1 + 0.28 * lift + 0.6 * zoom, halo: 0.7 + 0.9 * lift + 1.2 * Math.sin(Math.PI * Math.min(1, zoom * 1.4)), glint: 1 + lift + zoom });
      }
    }
    const glowK = orb || state === "boot" ? 0 : 0.25 * (state === "coal" ? K : state === "idle" ? Math.max(0.25, 1 - settle) : 0.4 * (1 - out));
    if (glowK > 0) {
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.9);
      gr.addColorStop(0, `rgba(0,148,160,${0.32 * glowK})`); gr.addColorStop(0.55, `rgba(0,148,160,${0.1 * glowK})`); gr.addColorStop(1, "rgba(0,148,160,0)");
      ctx.fillStyle = gr; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
    }

    const sz = Math.max(1.1, R * 0.015);
    const phase = ((now - formedAt) / 2600) % 1.3 - 0.15;
    for (let i = 0; i < TOTAL; i++) {
      if (i >= N && thin && (i & 1)) continue;
      const vis = smooth(clamp((lp - thr[i]) / 0.14));
      if (vis <= 0) continue;
      let x, y, a, w = 0, s;
      if (i >= N) {
        [x, y] = orbitAt(i, now);
        a = 0.36 * vis * (1 - 0.55 * K) * (1 - 0.6 * settle);
        s = sz * 0.9;
        if (out) {
          const u = Math.pow(clamp(out * 1.6 - thr[i] * 0.5), 2.2);
          const dx = x - cx, dy = y - cy, r0 = Math.hypot(dx, dy) || 1, th = Math.atan2(dy, dx) + 0.35 * u * spin[i];
          const r = r0 + u * diag * 1.2; x = cx + Math.cos(th) * r; y = cy + Math.sin(th) * r;
          a = Math.max(a, 0.5 * vis) * (1 - smooth(clamp((out - 0.55) / 0.35))); s *= 1 + 1.5 * u;
        }
      } else {
        const tX = cx + tx[i] * R, tY = cy - ty[i] * R;
        const lm = state === "boot" ? 0 : smooth(clamp(K * 1.8 - h[i] * 0.8));
        if (lm <= 0) { [x, y] = orbitAt(i, now); }
        else if (lm >= 1) { x = tX; y = tY; }
        else { const f = orbitAt(i, now), m = haloFrom(i, f[0], f[1], now); x = bez(lm, f[0], m[0], tX); y = bez(lm, f[1], m[1], tY); }
        w = lm;
        const glint = Math.exp(-((key[i] - phase) ** 2) / 0.0035);
        a = vis * ((0.55 + 0.37 * lm) * (1 - 0.8 * settle) + 0.45 * glint * settle);
        s = sz * (1.1 - 0.1 * lm);
        if (out) {
          const u = Math.pow(clamp(out * 1.5 - (1 - h[i]) * 0.45), 2.2);
          const dx = tX - cx, dy = tY - cy, r0 = Math.hypot(dx, dy) || 1, th = Math.atan2(dy, dx) - 0.5 * u * spin[i];
          const r = r0 + u * diag * 1.3; x = cx + Math.cos(th) * r; y = cy + Math.sin(th) * r;
          a = 0.95 * (1 - smooth(clamp((out - 0.6) / 0.3))); s *= 1 + 2 * u; w = 1;
        }
      }
      if (jk) { x += kick[i * 2] * jk * R; y += kick[i * 2 + 1] * jk * R; }
      if (a <= 0.01) continue;
      const mote = MOTE[kind[i]], teal = i < N ? SPR[binOf(br[i])] : null;
      if (w < 1) { ctx.globalAlpha = Math.min(1, a * (1 - w)); ctx.drawImage(mote, x - s, y - s, s * 2, s * 2); }
      if (w > 0) { ctx.globalAlpha = Math.min(1, a * w); ctx.drawImage(teal, x - s, y - s, s * 2, s * 2); }
    }
    ctx.globalAlpha = 1;

    if (state === "coal" && K >= 1) formed();
    if (state === "idle" && now - formedAt < 900) {
      const u = (now - formedAt) / 900, hx = cx + tx[headI] * R, hy = cy - ty[headI] * R;
      const k = Math.sin(Math.PI * smooth(u));
      const gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.7);
      gr.addColorStop(0, `rgba(255,255,255,${0.5 * k})`); gr.addColorStop(0.35, `rgba(150,230,236,${0.18 * k})`); gr.addColorStop(1, "rgba(0,148,160,0)");
      ctx.fillStyle = gr; ctx.fillRect(hx - R, hy - R, R * 2, R * 2);
    }
    if (state === "leave") {
      const fk = Math.sin(Math.PI * clamp((L - 0.66) / 0.3));
      if (fk > 0) {
        const gr = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, diag * 0.6);
        gr.addColorStop(0, `rgba(214,248,250,${0.42 * fk})`); gr.addColorStop(0.45, `rgba(0,168,184,${0.22 * fk})`); gr.addColorStop(1, "rgba(0,95,104,0)");
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      }
      const ink = smooth(clamp((L - 0.78) / 0.22));
      if (ink > 0) { ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = `rgba(0,20,27,${ink})`; ctx.fillRect(0, 0, W, H); }
      if (L >= 1 && leaveDone) { const d = leaveDone; leaveDone = null; d(); }
    }
    ctx.globalCompositeOperation = "source-over";
    raf = requestAnimationFrame(frame);
  }

  addEventListener("resize", layout);
  layout();

  if (reduce) {
    // No travel: the lockup is simply there once the app is ready.
    if (orb) orbCanvas.style.opacity = "";
    const draw = () => { track(); if (orb) orb.draw({ px: cx, py: cy, R, t: 0, reveal: 1, bright: 1, halo: 0.7, glint: 1 }); };
    draw();
  } else {
    if (orb) orbCanvas.style.opacity = "0";
    raf = requestAnimationFrame(frame);
  }

  return {
    /** The app has what it needs (e.g. the sign-in check finished); the dust may gather. */
    setReady() {
      if (appReady) return;
      appReady = true;
      if (reduce) { root.classList.add("loaded", "formed", "named"); setTimeout(() => alive && onFormed && onFormed(), 0); }
    },
    /** Glide the lockup up and let the content rise in under it. */
    showPortal() { layout(); requestAnimationFrame(() => root.classList.add("ready")); },
    /** Fly into the orb. Resolves when the screen is ink. */
    leave() {
      root.classList.add("leaving");
      if (reduce || state === "boot" || state === "coal") return new Promise((r) => setTimeout(r, reduce ? 220 : 420));
      state = "leave"; leaveAt = performance.now();
      return new Promise((r) => { leaveDone = r; });
    },
    /** The dust jolts (something didn't work). */
    jolt() {
      for (let i = 0; i < TOTAL; i++) { const a = rnd() * 6.283, m = 0.05 + rnd() * 0.07; kick[i * 2] = Math.cos(a) * m; kick[i * 2 + 1] = Math.sin(a) * m; }
      jolt = performance.now();
    },
    relayout: layout,
    destroy() { alive = false; cancelAnimationFrame(raf); removeEventListener("resize", layout); },
  };
}
