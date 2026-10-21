/* The Labs' orb, live: the same lit sphere as the ambassadors site's world
   (src/scripts/orbnet.ts there: ORB_VS, ORB_FS, RAMP, the orientation and the light),
   lifted as is and drawn on its own. Its three bands are latitude bands round one pole,
   fitted to the brand kit's orb mark (rolled 22.5° left, tilted 15.4° toward the viewer),
   with the mark's grain, a thin atmosphere, glints, and a halo. `reveal` paints the bands
   in from the pole down: teal, then the ink band, then the red.
   Plain WebGL 2; returns null where WebGL 2 isn't available. */
const RAMP = "250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,41,27,250,40,27,249,40,27,249,40,26,248,39,26,247,38,26,245,38,26,244,37,26,242,36,26,240,36,26,238,35,27,235,34,26,232,33,26,229,32,26,226,32,26,222,31,26,218,30,26,214,29,26,209,29,27,204,28,27,199,27,27,193,27,27,187,26,27,180,26,28,173,25,28,166,25,28,158,24,28,150,24,28,141,23,28,132,23,29,123,23,29,114,22,29,105,22,30,97,22,30,88,21,30,80,21,30,72,21,30,65,21,31,59,21,31,52,21,31,46,21,31,40,21,31,35,22,31,30,22,31,26,22,31,23,23,32,19,23,32,16,24,33,13,25,34,11,26,35,10,25,34,9,24,32,9,22,30,8,22,30,6,22,30,5,22,31,4,22,31,3,23,32,2,23,32,2,24,33,1,25,33,1,26,34,1,27,36,2,29,37,2,31,39,2,33,42,3,36,44,3,38,46,4,41,48,5,43,51,5,47,54,6,51,58,7,55,62,8,61,67,9,67,73,10,74,80,11,82,87,12,90,96,13,100,105,14,110,114,15,120,124,16,130,133,16,140,143,16,149,152,16,159,161,16,167,169,16,176,177,15,184,185,14,193,193,13,201,200,12,207,206,11,210,208";
const ORB_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aQ; uniform vec4 uRect;
void main() { gl_Position = vec4(mix(uRect.xy, uRect.zw, aQ * 0.5 + 0.5), 0.0, 1.0); }`;
const ORB_FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec2 uTan; uniform vec3 uCenter; uniform float uR;
uniform vec3 uPole; uniform vec3 uLight; uniform mat3 uInv; uniform sampler2D uRamp;
uniform float uBright; uniform float uHalo; uniform float uGlint; uniform float uReveal; uniform vec2 uShift;
out vec4 o;

float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float hash3(vec3 p) { p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 hash33(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
void main() {
  vec2 ndc = gl_FragCoord.xy / uRes * 2.0 - 1.0 - uShift;
  vec3 dir = normalize(vec3(ndc.x * uTan.x, ndc.y * uTan.y, -1.0));
  // The grain is pinned to the orb (by whole pixels from its centre), so it travels with the orb as it moves.
  vec2 cPx = (vec2(uCenter.x / (-uCenter.z * uTan.x), uCenter.y / (-uCenter.z * uTan.y)) + uShift) * 0.5 * uRes + 0.5 * uRes;
  vec2 g = floor(gl_FragCoord.xy - cPx);
  float b = dot(dir, uCenter);
  vec3 off = dir * b - uCenter;
  float dist = length(off);
  float pix = -uCenter.z * 2.0 * uTan.y / uRes.y;
  float cover = smoothstep(uR + pix * 0.8, uR - pix * 0.8, dist);
  vec3 col = vec3(0.0); float alpha = 0.0;
  if (cover > 0.0) {
    float t = b - sqrt(max(uR * uR - dist * dist, 0.0));
    vec3 n = normalize(dir * t - uCenter);
    float d = dot(n, uPole);
    // The mark's grain: the latitude dithered per pixel, so the band edges break up like the logo's.
    float dj = d + (hash(g) - 0.5) * 0.13;
    vec3 c = texture(uRamp, vec2((clamp(dj, -1.0, 1.0) * 0.5 + 0.5) * (100.0 / 101.0) + 0.5 / 101.0, 0.5)).rgb;
    float tealW = smoothstep(0.3, 0.8, d), redW = smoothstep(-0.05, -0.45, d);
    float lit = dot(n, uLight);
    c *= 1.0 + lit * (0.2 * tealW + 0.07 * redW);
    // Glints in the teal and the red, fixed to the surface, caught by the light.
    vec3 os = uInv * n;
    vec3 cell = floor(os * 64.0);
    float h = hash3(cell + 7.0);
    if (h > 0.985) {
      vec3 np = normalize(n + (hash33(cell) - 0.5) * 1.1);
      float s = pow(max(dot(reflect(dir, np), uLight), 0.0), 18.0);
      c += (c * 2.2 + 0.25) * s * (tealW + redW) * uGlint;
    }
    // A thin atmosphere at the limb, teal above and red below, so it sits in its light like a planet.
    float rim = pow(1.0 - max(dot(n, -dir), 0.0), 3.0);
    c += mix(vec3(0.95, 0.2, 0.18), vec3(0.1, 0.85, 0.85), smoothstep(-0.3, 0.45, d)) * rim * 0.3;
    // At the opening the bands paint in from the pole down: teal, then the ink band, then the red.
    c *= smoothstep(1.0 - uReveal * 2.4, 1.18 - uReveal * 2.4, d);
    col = c * uBright * cover; alpha = cover;
  }
  // A halo just outside the limb, with the grain in it: red below, a little teal above.
  float outside = max(dist - uR, 0.0) / uR;
  float side = dot(off / max(dist, 1e-5), uPole);
  vec3 hc = mix(vec3(0.84, 0.17, 0.2), vec3(0.0, 0.58, 0.63), smoothstep(-0.6, 0.6, side));
  float hw = mix(0.95, 0.55, smoothstep(-0.6, 0.6, side));
  float hl = uReveal * (exp(-outside / 0.08) * 0.7 + exp(-outside / 0.3) * 0.22) * hw * uHalo * (1.0 - cover) * (0.65 + 0.7 * hash(g.yx + 3.0));
  col += hc * hl * 0.55; alpha += hl * 0.22;
  o = vec4(col, min(alpha, 1.0));
}`;

const DEG = Math.PI / 180;
const mul = (a, b) => { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]; return o; };
const rx = (t) => { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const ry = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rz = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
const tr = (m) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const apply = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];

export function mountOrb(canvas) {
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true, alpha: true });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, ORB_VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, ORB_FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn("orb: falling back", e); return null; }
  const U = {}; for (const n of ["uRect", "uRes", "uTan", "uCenter", "uR", "uPole", "uLight", "uInv", "uRamp", "uBright", "uHalo", "uGlint", "uReveal", "uShift"]) U[n] = gl.getUniformLocation(prog, n);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const ramp = new Uint8Array(101 * 4); RAMP.split(",").map(Number).forEach((v, i) => { ramp[Math.floor(i / 3) * 4 + (i % 3)] = v; });
  for (let i = 0; i < 101; i++) ramp[i * 4 + 3] = 255;
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 101, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, ramp);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const O = mul(rz(22.5 * DEG), rx(15.4 * DEG));
  const pole = apply(O, [0, 1, 0]);
  const L = (() => { const v = [0.8, 0.3, 0.65], l = Math.hypot(...v); return v.map((x) => x / l); })();
  let W = 1, H = 1, dpr = 1;

  return {
    resize(w, h, d) { W = w; H = h; dpr = d; canvas.width = Math.round(w * d); canvas.height = Math.round(h * d); },
    clear() { gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); },
    /* Draw the orb centred at (px, py) CSS pixels with radius R CSS pixels. t in seconds turns its grain. */
    draw({ px, py, R, t = 0, bright = 1, halo = 1, glint = 1, reveal = 1 }) {
      const w = canvas.width, h = canvas.height;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      if (R <= 0) return;
      const tanY = 0.1, tanX = tanY * (W / H);
      const D = H / (2 * R * tanY);                       // distance that makes a unit orb R pixels in radius
      const nx = (px / W) * 2 - 1, ny = 1 - (py / H) * 2;
      const c = [nx * D * tanX, ny * D * tanY, -D];
      const rxN = (1 * 3.2) / (D * tanX), ryN = (1 * 3.2) / (D * tanY);
      gl.useProgram(prog); gl.bindVertexArray(vao);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform2f(U.uShift, 0, 0);
      gl.uniform4f(U.uRect, nx - rxN, ny - ryN, nx + rxN, ny + ryN);
      gl.uniform2f(U.uRes, w, h); gl.uniform2f(U.uTan, tanX, tanY); gl.uniform3f(U.uCenter, c[0], c[1], c[2]); gl.uniform1f(U.uR, 1);
      gl.uniform3f(U.uPole, pole[0], pole[1], pole[2]); gl.uniform3f(U.uLight, L[0], L[1], L[2]);
      gl.uniformMatrix3fv(U.uInv, true, tr(mul(O, ry(t * 2 * DEG))));
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.uRamp, 0);
      gl.uniform1f(U.uBright, bright); gl.uniform1f(U.uHalo, halo); gl.uniform1f(U.uGlint, glint); gl.uniform1f(U.uReveal, reveal);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
