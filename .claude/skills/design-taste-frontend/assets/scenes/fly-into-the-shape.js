// tasteskill / scenes / fly-into-the-shape.js — the brand's own mark turns to face you, then you fly into it.
//
// The mark rides up with the content and arrives at the centre of the screen exactly as the stage is
// held: a big, solid mark with a real extruded side, the title set in light type on its face. It turns to
// face you, then you fly at it: the camera moves at a steady speed, so the mark grows slowly while it
// turns and the next chapter (a photograph of its world) shows through its face, then rushes past every
// edge of the screen, the way a near object does when you fly through it. It grows about the centre of
// its largest inscribed circle, and the world inside keeps coming towards you for the rest of the hold.
// The title rides on the face and is never faded or split: at rest every line of it sits inside the face
// at every angle of the turn (set smaller when the mark is smaller than the title), and it grows with the
// mark to its full size, never faster, so no edge of the mark ever crosses a word. The face starts as the
// solid accent and clears to the picture while the mark is still a shape on the paper; the chapter's
// first sentence settles last.
// data-dir="out" plays it backwards at a chapter's end: the world shrinks back into the mark, the face
// fills with the accent, and the mark turns upright as it lands behind the closing title, so a pair of
// scenes lets the reader leave the way they came in.
//
// Needs gsap + ScrollTrigger, stage.js and fly-into-the-shape.css. Use it as the doorway into a dark
// or immersive chapter on a page whose brand has an ownable, solid symbol (a monogram, an emblem, a
// building's silhouette, a keyhole). Skip it when there is no such mark: a plain circle is the generic
// version. The clips are written as clip-path: path() in screen pixels every frame, so the edges stay
// vector-sharp at any zoom; browsers without clip-path: path() get the finished composition.
//
// DOM (the CSS file draws the finished composition from the same markup):
//   <section class="scene" data-scene="fly-into-the-shape" data-dir="in" data-options='{}' aria-labelledby="t">
//     <div class="scene-stage">
//       <div class="portal-outside">                          the outgoing paper (var(--ground))
//         <p class="portal-aside">3-6 words</p>               optional: top-left, fades as the dive starts
//         <p class="portal-cue" aria-hidden="true">Scroll</p>  optional: bottom centre (live only)
//       </div>
//       <h2 class="portal-title portal-title--out" id="t">    the title: light on the mark's face while it runs
//         <span class="portal-line">Line one</span> <span class="portal-line">line two</span>
//       </h2>                                                2-6 words on 2 lines, 12 characters a line at most
//       <div class="portal-world">                            the next chapter; never transformed, only clipped
//         <picture><source media="(max-width: 767px)" srcset="9:16 crop">
//           <img class="portal-media" src alt width height></picture>   or <video class="portal-media" muted loop playsinline poster>
//         <div class="portal-scrim" aria-hidden="true"></div>   flat scrim so light type reads on the picture
//         <div class="portal-tint" aria-hidden="true"></div>    the mark's face: the solid accent, cleared by scroll
//         <svg class="portal-mark" viewBox="0 0 100 100" aria-hidden="true"><use href="#mark"/></svg>  finished state only
//         <p class="portal-sub">10-18 words that open the chapter</p>
//       </div>
//       <svg class="portal-src" viewBox="0 0 100 100" width="0" height="0" aria-hidden="true">
//         <path id="mark" d="one closed path" data-anchor="50 61.2" data-rin="34.7"/>
//       </svg>
//     </div>
//   </section>
// While it runs, the script adds the extruded side (<div class="portal-depth">, under the world), and the
// h2 itself is the title on the face: light, above the world, scaled about the stage's centre. An older
// .portal-title--in inside the world or a .portal-lit copy is not needed and stays hidden.
// The picture may be sized and placed by the page (for example taller than the stage, hanging below
// it, so a bright foreground stays out of sight): the script grows it about the stage's centre,
// wherever its box is.
//
// The mark: one closed path in its viewBox (a 100x100 box is usual), any SVG commands (relative,
// shorthand and arcs are converted on load). It needs a solid core: an inscribed circle of at least
// 15% of the box height, or the cover zoom runs long and the edge sweeps for too long.
// data-anchor (the centre of the largest inscribed circle) and data-rin (its radius) are computed when
// they are missing. fill-rule="evenodd" on the path is honoured.
//
// Options (data-options JSON; defaults, ranges):
//   dir        "in"     "in" | "out"   prefer the data-dir attribute, which the CSS also reads
//   hold       2        1.4-2.6   screens the stage is held on desktop
//   phoneHold  1.6      1.2-2.4   screens on a phone (under 768px)
//   size       0.4      0.2-0.6   height of the mark's box at rest, as a share of the stage's height (and
//                                 at most 0.45 of its width): the hero of the first frame, with the title
//                                 on its face. A number above 1 is read as px (96-720). "fit": the
//                                 smallest mark that holds the whole title at its full rest size.
//                                 The face always holds every line of the title at rest, at every angle
//                                 of the turn: when the mark is smaller than that, the title is set
//                                 smaller on it and grows with the mark to its full size. A mark of 65%
//                                 or more of the size that would hold the full title (as on a portrait
//                                 tablet) grows to that size instead, and one that would set the title
//                                 under half its size grows until it holds half (the mark itself at most
//                                 0.98 of the width and half the height). At any size the mark at rest,
//                                 turned as it rests and with its side, stays 16px inside the stage.
//   phoneSize  "fit"    "fit" | 0.3-0.75 | px 64-420   on a phone. "fit" (default): the smallest mark,
//                                 from half the width up to 0.98 of the width (the mark itself, not its
//                                 box; 16px clear of the edges with its side) and half the height, whose
//                                 face holds every line of the title at
//                                 its full rest size (turned and upright); when the title is too wide for
//                                 that, the largest such mark with the title set smaller on its face.
//                                 A share is of the stage's width (at most 0.4 of its height).
//   turn       45       0-180     degrees of the turn: "in" runs -turn -> 0 while the mark is still
//                                 small, "out" lands from +turn -> 0 as the mark shrinks home
//   phoneTurn  12       0-180     a smaller turn on a phone keeps the big mark on the screen
//   depth      0.06     0-0.15    thickness of the extruded side at rest, as a share of the mark's box
//                                 (above 1 = px); it thickens as the mark comes closer. 0 = a flat mark
//   phoneDepth 0.05     0-0.15
//   ease       "fly"    the approach: "fly" (default: the camera moves at a steady speed, so the mark
//                                 grows slowly, then rushes past the edges of the screen), "sine.inOut"
//                                 (log space: a legible lock, then a gentle arrival) or "none" (log space:
//                                 a constant rate of growth)
//   zoom       1.4      1-1.8     how far the world's picture grows over the whole hold (about the
//                                 stage's centre, at a steady rate), so you keep travelling into the
//                                 world after the mark has passed
//   blur       0        0-6       px of blur on the world's picture through the fastest part of the dive
//                                 (desktop only). Off by default: a full-screen filter every frame cost
//                                 2-3x the frame time in testing; 2-3 is enough when the machines allow it
//   scrub      true with Lenis, else 0.8   seconds of catch-up, or true (locked to the scrollbar)
//   phone      "same"   "same" | "rest" (the phone gets the finished composition)
//
// Colours come from the page: var(--ground) paper, var(--ink) the notes on it (and the title of the
// finished "out" composition), var(--accent) the mark's face (the light title sits on it, so keep 3:1
// or more against --portal-light), --portal-side the extruded
// side (default: the accent mixed with 45% black), --portal-night the world's ground (give the next
// section exactly this ground), --portal-light the title inside, --portal-soft the sub-line.
// --portal-focus sets the picture's focal point (object-position, default 50% 50%); the picture always
// grows about the anchor, the centre of the stage. The side follows the face: the accent mixed with
// black while the face is solid, deepening towards --portal-night as the face clears to the picture,
// so it always reads about half as light as the face beside it.
//
// Pictures: one landscape photograph of the chapter's world, 16:10 or 16:9, 2000px or more, dark
// (mean luminance about 20% or less) with a calm centre across 40% x 30% where the title and the
// sub-line sit, a dark bottom edge (the stage scrolls up into the next section's flat ground), and a
// 9:16 crop for phones. A night sky, a deep interior, a lit street all suit. Pictures decode before
// they move: the script holds the picture still until img.decode() resolves.
// Or a loop: <video class="portal-media" muted loop playsinline poster="…"> with a 6-10 s seamless
// clip of 4MB or less (stars turning, snow falling through a lamp's light, traffic trails). It plays
// only while the section is on screen, grows like a picture, and keeps the world alive in the dwell.
//
// Testing: the section carries data-z, data-rot, data-cover, data-box (the mark's box at rest, px),
// data-fit (the box that would hold the whole title at its full rest size, px) and data-ts (the title's
// scale at rest, 0.94 when it is held at full size) while it runs.
// Cover is reached at 76% of the hold ("in") and left at 10% ("out"), on every screen and mark.
(() => {
  const ID = 'fly-into-the-shape';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => { const n = typeof v === 'string' && v.trim() !== '' ? +v : v; return typeof n === 'number' && isFinite(n) ? clamp(n, a, b) : d; };
  // a share (0-1) or, above 1, px
  const share = (v, d, a, b, pa, pb) => { const n = num(v, d, 0, 1e4); return n > 1 ? clamp(n, pa, pb) : clamp(n, a, b); };
  const TAU = Math.PI * 2;
  const f1 = (v) => v.toFixed(1);
  if (window.ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });

  // ---------- one SVG path -> absolute M / L / C / Q / Z segments ----------
  // Relative commands, H/V, S/T shorthand and arcs are rewritten, so the per-frame transform only has
  // to move points.
  function arcToCubics(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
    if (!rx || !ry || (x1 === x2 && y1 === y2)) return [[x1, y1, x2, y2, x2, y2]];
    rx = Math.abs(rx); ry = Math.abs(ry);
    const sp = Math.sin((phi * Math.PI) / 180), cp = Math.cos((phi * Math.PI) / 180);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const xp = cp * dx + sp * dy, yp = -sp * dx + cp * dy;
    const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const nume = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
    const deno = rx * rx * yp * yp + ry * ry * xp * xp;
    const co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, nume / (deno || 1)));
    const cxp = (co * rx * yp) / ry, cyp = (-co * ry * xp) / rx;
    const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
    let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
    if (!fs && dt > 0) dt -= TAU; else if (fs && dt < 0) dt += TAU;
    const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9)), d = dt / n, k = (4 / 3) * Math.tan(d / 4);
    const e = (ux, uy) => [cp * rx * ux - sp * ry * uy + cx, sp * rx * ux + cp * ry * uy + cy];
    const out = [];
    for (let i = 0; i < n; i++) {
      const a1 = t1 + i * d, a2 = a1 + d, c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2);
      out.push([...e(c1 - k * s1, s1 + k * c1), ...e(c2 + k * s2, s2 - k * c2), ...e(c2, s2)]);
    }
    return out;
  }

  function parsePath(d) {
    const t = String(d).match(/[a-df-zA-DF-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
    const segs = [];
    let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lc = null, lq = null;
    const isCmd = (s) => /^[a-zA-Z]$/.test(s);
    const n = () => { const v = +t[i++]; if (!isFinite(v)) throw new Error('bad number'); return v; };
    const flag = () => { const s = t[i]; if (s && s.length > 1 && (s[0] === '0' || s[0] === '1')) { t[i] = s.slice(1); return +s[0]; } i++; return +s; };
    while (i < t.length) {
      if (isCmd(t[i])) cmd = t[i++];
      else if (!cmd) throw new Error('path must start with M');
      const C = cmd.toUpperCase(), rel = cmd !== C, ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === 'Z') { segs.push({ c: 'Z', p: [] }); x = sx; y = sy; lc = lq = null; if (i < t.length && !isCmd(t[i])) throw new Error('numbers after Z'); continue; }
      if (C === 'M') { x = ox + n(); y = oy + n(); sx = x; sy = y; segs.push({ c: 'M', p: [x, y] }); cmd = rel ? 'l' : 'L'; lc = lq = null; }
      else if (C === 'L') { x = ox + n(); y = oy + n(); segs.push({ c: 'L', p: [x, y] }); lc = lq = null; }
      else if (C === 'H') { x = ox + n(); segs.push({ c: 'L', p: [x, y] }); lc = lq = null; }
      else if (C === 'V') { y = oy + n(); segs.push({ c: 'L', p: [x, y] }); lc = lq = null; }
      else if (C === 'C' || C === 'S') {
        const r = C === 'S' ? (lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y]) : [ox + n(), oy + n()];
        const p = [r[0], r[1], ox + n(), oy + n(), ox + n(), oy + n()];
        segs.push({ c: 'C', p }); lc = [p[2], p[3]]; lq = null; x = p[4]; y = p[5];
      } else if (C === 'Q' || C === 'T') {
        const r = C === 'T' ? (lq ? [2 * x - lq[0], 2 * y - lq[1]] : [x, y]) : [ox + n(), oy + n()];
        const p = [r[0], r[1], ox + n(), oy + n()];
        segs.push({ c: 'Q', p }); lq = [p[0], p[1]]; lc = null; x = p[2]; y = p[3];
      } else if (C === 'A') {
        const rx = n(), ry = n(), phi = n(), fa = flag(), fs = flag(), ex = ox + n(), ey = oy + n();
        for (const p of arcToCubics(x, y, rx, ry, phi, fa, fs, ex, ey)) segs.push({ c: 'C', p });
        x = ex; y = ey; lc = lq = null;
      } else throw new Error('unknown command ' + cmd);
    }
    if (!segs.length || segs[0].c !== 'M') throw new Error('empty path');
    return segs;
  }

  // ---------- segments -> closed sub-paths of edges ----------
  // Every edge carries its own start: { c: 'L', p: [x0, y0, x1, y1] } or { c: 'C', p: [x0, y0, c1, c2, x1, y1] }
  // (quadratics become cubics), and every sub-path is closed with a line when it ends elsewhere.
  function toSubs(segs) {
    const subs = [];
    let cur = null, x = 0, y = 0;
    const end = () => {
      if (!cur) return;
      if (Math.hypot(x - cur.x0, y - cur.y0) > 1e-6) cur.edges.push({ c: 'L', p: [x, y, cur.x0, cur.y0] });
      x = cur.x0; y = cur.y0; cur = null;
    };
    for (const s of segs) {
      const p = s.p;
      if (s.c === 'M') { end(); x = p[0]; y = p[1]; continue; }
      if (s.c === 'Z') { end(); continue; }
      if (!cur) { cur = { x0: x, y0: y, edges: [] }; subs.push(cur); }
      if (s.c === 'L') cur.edges.push({ c: 'L', p: [x, y, p[0], p[1]] });
      else if (s.c === 'Q') cur.edges.push({ c: 'C', p: [x, y, x + (2 / 3) * (p[0] - x), y + (2 / 3) * (p[1] - y), p[2] + (2 / 3) * (p[0] - p[2]), p[3] + (2 / 3) * (p[1] - p[3]), p[2], p[3]] });
      else cur.edges.push({ c: 'C', p: [x, y, ...p] });
      x = p[p.length - 2]; y = p[p.length - 1];
    }
    end();
    return subs.filter((s) => s.edges.length);
  }
  const reverseSub = (s) => {
    const edges = s.edges.slice().reverse().map((e) => { const q = []; for (let k = e.p.length - 2; k >= 0; k -= 2) q.push(e.p[k], e.p[k + 1]); return { c: e.c, p: q }; });
    return { x0: edges[0].p[0], y0: edges[0].p[1], edges };
  };

  // Points along the outline (densest where it is longest), one closed ring per sub-path.
  const ctrlLen = (p) => { let L = 0; for (let k = 2; k < p.length; k += 2) L += Math.hypot(p[k] - p[k - 2], p[k + 1] - p[k - 1]); return L; };
  const bez = (p, u) => { const v = 1 - u; return [v * v * v * p[0] + 3 * v * v * u * p[2] + 3 * v * u * u * p[4] + u * u * u * p[6], v * v * v * p[1] + 3 * v * v * u * p[3] + 3 * v * u * u * p[5] + u * u * u * p[7]]; };
  function sample(subs, total = 2048) {
    const sum = subs.reduce((a, s) => a + s.edges.reduce((b, e) => b + ctrlLen(e.p), 0), 0) || 1;
    return subs.map((s) => {
      const ring = [[s.x0, s.y0]];
      for (const e of s.edges) {
        const p = e.p, m = Math.max(2, Math.round((total * ctrlLen(p)) / sum));
        for (let k = 1; k <= m; k++) { const u = k / m; ring.push(e.c === 'L' ? [p[0] + (p[2] - p[0]) * u, p[1] + (p[3] - p[1]) * u] : bez(p, u)); }
      }
      return ring;
    });
  }
  const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a / 2; };

  const inside = (rings, x, y) => {
    let c = false;
    for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const edgeDist = (rings, x, y) => {
    let m = Infinity;
    for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const ax = r[j][0], ay = r[j][1], dx = r[i][0] - ax, dy = r[i][1] - ay;
      const q = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      m = Math.min(m, Math.hypot(x - ax - q * dx, y - ay - q * dy));
    }
    return m;
  };

  // The pole of inaccessibility (centre of the largest inscribed circle): a grid search, refined twice.
  function pole(rings) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of rings) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const coarse = rings.map((r) => r.filter((_, k) => k % 4 === 0));
    let best = [(x0 + x1) / 2, (y0 + y1) / 2, 0];
    let step = Math.max(x1 - x0, y1 - y0) / 48;
    const scan = (ax, ay, bx, by, st, rs) => {
      for (let y = ay; y <= by; y += st) for (let x = ax; x <= bx; x += st) {
        if (!inside(rs, x, y)) continue;
        const d = edgeDist(rs, x, y);
        if (d > best[2]) best = [x, y, d];
      }
    };
    scan(x0, y0, x1, y1, step, coarse);
    for (let k = 0; k < 2; k++) { const [bx, by] = best; best[2] = 0; scan(bx - step, by - step, bx + step, by + step, step / 6, rings); step /= 6; }
    best[2] = edgeDist(rings, best[0], best[1]);
    return best;
  }

  // First-exit radius from the anchor in each 1-degree bin (in the shape's own frame).
  function exitTable(rings, ax, ay) {
    const bins = new Array(360).fill(Infinity);
    for (const r of rings) for (const [x, y] of r) {
      const a = ((Math.atan2(y - ay, x - ax) * 180) / Math.PI + 360) % 360;
      const b = Math.floor(a) % 360, d = Math.hypot(x - ax, y - ay);
      if (d < bins[b]) bins[b] = d;
    }
    // empty bins take the nearer of their nearest filled neighbours
    const filled = bins.map((v) => v < Infinity);
    if (!filled.some(Boolean)) return null;
    return bins.map((v, b) => {
      if (filled[b]) return v;
      for (let k = 1; k < 180; k++) {
        const l = bins[(b - k + 360) % 360], r = bins[(b + k) % 360];
        if (l < Infinity || r < Infinity) return Math.min(l, r);
      }
      return v;
    });
  }

  // Zoom at which the mark's thinnest part, rotated by rot degrees, passes every point of a W x H
  // screen's edge (96 points with the corners), with a 3% and 2px safety margin.
  function coverZoom(table, rin, s0, W, H, rot) {
    const cx = W / 2, cy = H / 2;
    const fallback = (1.03 * (Math.hypot(cx, cy) + 2)) / (s0 * rin);
    if (!table) return fallback;
    const pts = [[0, 0], [W, 0], [W, H], [0, H]];
    const per = 2 * (W + H);
    for (let k = 0; k < 92; k++) {
      let d = (per * (k + 0.5)) / 92;
      if (d < W) pts.push([d, 0]); else if ((d -= W) < H) pts.push([W, d]); else if ((d -= H) < W) pts.push([W - d, H]); else pts.push([0, H - (d - W)]);
    }
    let z = 0;
    for (const [px, py] of pts) {
      const a = ((((Math.atan2(py - cy, px - cx) * 180) / Math.PI - rot) % 360) + 360) % 360;
      let r = Infinity;
      for (let k = -2; k <= 2; k++) r = Math.min(r, table[(Math.floor(a) + k + 360) % 360]);
      if (!(r > 0) || r === Infinity) return fallback;
      z = Math.max(z, (Math.hypot(px - cx, py - cy) + 2) / (s0 * r));
    }
    return Math.max(1, 1.03 * z);
  }

  const P = (x, y) => f1(x) + ' ' + f1(y);

  // ---------- the extruded side, exactly ----------
  // The mark swept along a vector v is the union of the mark, the mark moved by v, and, for every edge,
  // the ribbon that edge sweeps. A ribbon folds over itself where its edge runs parallel to v, so curves
  // are split there; then every ribbon is wound the same way as the mark's outer rings, and one nonzero
  // path holds the exact solid in a few dozen pieces (a stack of copies needs hundreds, and costs a
  // full-screen mask far more to paint every frame).
  const cubicSplit = (q, t) => {
    const l = (a, b) => a + (b - a) * t;
    const ax = l(q[0], q[2]), ay = l(q[1], q[3]), bx = l(q[2], q[4]), by = l(q[3], q[5]), cx = l(q[4], q[6]), cy = l(q[5], q[7]);
    const dx = l(ax, bx), dy = l(ay, by), ex = l(bx, cx), ey = l(by, cy), fx = l(dx, ex), fy = l(dy, ey);
    return [[q[0], q[1], ax, ay, dx, dy, fx, fy], [fx, fy, ex, ey, cx, cy, q[6], q[7]]];
  };
  // where a cubic's tangent is parallel to (vx, vy): roots in (0, 1) of cross(B'(t), v) = 0
  const parallelAt = (q, vx, vy) => {
    const cr = (x, y) => x * vy - y * vx;
    const a = cr(q[2] - q[0], q[3] - q[1]), b = cr(q[4] - q[2], q[5] - q[3]), c = cr(q[6] - q[4], q[7] - q[5]);
    const A = a - 2 * b + c, B = 2 * (b - a), C = a, eps = 1e-9 * (Math.abs(a) + Math.abs(b) + Math.abs(c) + 1);
    let ts = [];
    if (Math.abs(A) < eps) { if (Math.abs(B) > eps) ts = [-C / B]; } else {
      const D = B * B - 4 * A * C;
      if (D >= 0) { const r = Math.sqrt(D); ts = [(-B - r) / (2 * A), (-B + r) / (2 * A)]; }
    }
    return ts.filter((t) => t > 1e-4 && t < 1 - 1e-4).sort((x, y) => x - y);
  };
  // one ribbon piece (a line [x0 y0 x1 y1] or a cubic [x0 y0 c1 c2 x1 y1] that never turns parallel to v)
  function ribbon(q, vx, vy, sg) {
    const cub = q.length === 8, L = q.length;
    const tx = cub ? q[6] + q[4] - q[2] - q[0] : q[2] - q[0], ty = cub ? q[7] + q[5] - q[3] - q[1] : q[3] - q[1];
    const o = Math.sign(tx * vy - ty * vx);
    if (!o) return '';
    const fw = (a, dx, dy) => (cub ? 'C' + P(a[2] + dx, a[3] + dy) + ' ' + P(a[4] + dx, a[5] + dy) + ' ' + P(a[6] + dx, a[7] + dy) : 'L' + P(a[2] + dx, a[3] + dy));
    const bw = (a, dx, dy) => (cub ? 'C' + P(a[4] + dx, a[5] + dy) + ' ' + P(a[2] + dx, a[3] + dy) + ' ' + P(a[0] + dx, a[1] + dy) : 'L' + P(a[0] + dx, a[1] + dy));
    // forward (along the edge, back along its copy) winds with the sign of cross(tangent, v)
    if (o === sg) return 'M' + P(q[0], q[1]) + fw(q, 0, 0) + 'L' + P(q[L - 2] + vx, q[L - 1] + vy) + bw(q, vx, vy) + 'Z';
    return 'M' + P(q[0], q[1]) + 'L' + P(q[0] + vx, q[1] + vy) + fw(q, vx, vy) + 'L' + P(q[L - 2], q[L - 1]) + bw(q, 0, 0) + 'Z';
  }
  function ribbons(scr, vx, vy, sg) {
    let s = '';
    for (const sp of scr) for (const e of sp) {
      if (e.length === 4) { s += ribbon(e, vx, vy, sg); continue; }
      let rest = e, done = 0;
      for (const t of parallelAt(e, vx, vy)) { const [a, b] = cubicSplit(rest, (t - done) / (1 - done)); s += ribbon(a, vx, vy, sg); rest = b; done = t; }
      s += ribbon(rest, vx, vy, sg);
    }
    return s;
  }

  // Parsed marks are kept per path element, so a page can hold a pair of scenes on one mark.
  const cache = new WeakMap();
  function readMark(path) {
    if (cache.has(path)) return cache.get(path);
    const subs = toSubs(parsePath(path.getAttribute('d') || ''));
    if (!subs.length) throw new Error('no closed shape');
    const rings = sample(subs);
    const svg = path.ownerSVGElement;
    const vb = svg && svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.height ? svg.viewBox.baseVal : null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of rings) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const box = vb ? Math.max(vb.width, vb.height) : Math.max(x1 - x0, y1 - y0);
    const given = String(path.dataset.anchor || '').trim().split(/[\s,]+/).map(Number);
    let ax, ay, rin;
    if (given.length === 2 && given.every(isFinite) && inside(rings, given[0], given[1])) {
      [ax, ay] = given;
      rin = num(path.dataset.rin, edgeDist(rings, ax, ay), 0.001, 1e6);
    } else [ax, ay, rin] = pole(rings);
    const table = exitTable(rings, ax, ay);
    const evenodd = (path.getAttribute('fill-rule') || '').trim() === 'evenodd';
    if (rin / box < 0.15) console.warn(`${ID}: the mark's solid core is thin (inscribed radius ${(Math.floor(1000 * rin / box) / 10).toFixed(1)}% of its box); the dive will run long. 15% or more reads best.`);
    // the side is a nonzero union of copies: wind every outer ring one way (sg) and, for an even-odd
    // mark, its holes the other way; a nonzero mark keeps its own windings inside each outer ring
    const areas = rings.map(area);
    let big = 0;
    areas.forEach((a, i) => { if (Math.abs(a) > Math.abs(areas[big])) big = i; });
    const sg = Math.sign(areas[big]) || 1;
    const depthOf = rings.map((r, i) => rings.reduce((d, q, j) => d + (j !== i && inside([q], r[0][0], r[0][1]) ? 1 : 0), 0));
    const rootOf = (i) => (depthOf[i] === 0 ? i : rings.findIndex((q, j) => j !== i && depthOf[j] === 0 && inside([q], rings[i][0][0], rings[i][0][1])));
    const sideSubs = subs.map((s, i) => {
      const flip = evenodd ? Math.sign(areas[i]) !== (depthOf[i] % 2 ? -sg : sg) : Math.sign(areas[rootOf(i)] ?? areas[i]) !== sg;
      return flip ? reverseSub(s) : s;
    });
    // a lighter copy of the outline for the title-fit test
    const coarse = rings.map((r) => r.filter((_, k) => k % 4 === 0));
    const mark = { subs, sideSubs, sg, ax, ay, rin, box, table, coarse, bw: (x1 - x0) / box, bh: (y1 - y0) / box, rule: evenodd ? 'evenodd, ' : '' };
    cache.set(path, mark);
    return mark;
  }

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const dir = String(root.dataset.dir || opts.dir || 'in') === 'out' ? 'out' : 'in';
    root.dataset.dir = dir;
    // a share, px above 1, or "fit"; anything else keeps the default
    const sizeOpt = (v, d, a, b, pa, pb) => {
      if (v === 'fit') return 'fit';
      const n = typeof v === 'string' && v.trim() !== '' ? +v : v;
      return typeof n === 'number' && isFinite(n) && n > 0 ? share(n, 0, a, b, pa, pb) : d;
    };
    const o = {
      hold: num(opts.hold, 2, 1.4, 2.6),
      phoneHold: num(opts.phoneHold, 1.6, 1.2, 2.4),
      size: sizeOpt(opts.size, 0.4, 0.2, 0.6, 96, 720),
      phoneSize: sizeOpt(opts.phoneSize, 'fit', 0.3, 0.75, 64, 420),
      turn: num(opts.turn, 45, 0, 180),
      phoneTurn: num(opts.phoneTurn, 12, 0, 180),
      depth: share(opts.depth, 0.06, 0, 0.15, 0, 48),
      phoneDepth: share(opts.phoneDepth, 0.05, 0, 0.15, 0, 24),
      ease: opts.ease === 'none' || opts.ease === 'sine.inOut' ? opts.ease : 'fly',
      zoom: num(opts.zoom, 1.4, 1, 1.8),
      blur: num(opts.blur, 0, 0, 6),
      scrub: opts.scrub === true ? true : typeof opts.scrub === 'number' ? clamp(opts.scrub, 0, 2) : null,
      phone: opts.phone === 'rest' ? 'rest' : 'same',
    };
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];

    // Without clip-path: path() the scene keeps its finished composition.
    const canClip = window.CSS && CSS.supports && CSS.supports('clip-path', 'path("M0 0L1 0L1 1Z")');
    const srcPath = $('.portal-src path') || (() => { const u = $('.portal-mark use'); const id = u && (u.getAttribute('href') || u.getAttribute('xlink:href') || '').replace(/^#/, ''); return id ? document.getElementById(id) : null; })();
    let mark = null;
    try { if (srcPath) mark = readMark(srcPath); } catch (e) { console.warn(`${ID}: the mark's path could not be read (${e.message}); showing the finished composition.`); }
    if (!srcPath) console.warn(`${ID}: needs <svg class="portal-src"><path d="…"></svg> for the mark; showing the finished composition.`);

    function build(tl, ctx) {
      const { stage, phone } = ctx;
      const world = $('.portal-world'), outTitle = $('.portal-title--out');
      const media = $('.portal-media'), tint = $('.portal-tint'), sub = $('.portal-sub'), outside = $('.portal-outside');
      const IN = dir === 'in';
      // the paper's notes leave as the dive starts ("in"), or arrive once the mark is home ("out";
      // a scroll cue makes no sense there and stays hidden in the CSS)
      const notes = $$(IN ? '.portal-aside, .portal-cue' : '.portal-aside');
      const turn = phone ? o.phoneTurn : o.turn;
      const sizeWant = phone ? o.phoneSize : o.size;
      const depthOpt = phone ? o.phoneDepth : o.depth;
      const blurPx = phone ? 0 : o.blur;
      const FLY = o.ease === 'fly';
      const TS0 = 0.94; // the title's full scale at rest (set smaller on a mark that cannot hold it)
      let dead = false;
      const made = [];

      gsap.context(() => {
        // the extruded side: a dark accent layer under the world, clipped to the mark swept along the
        // side's vector. A night layer inside it deepens it as the face clears, so the side always reads
        // darker than the face (solid accent, then the picture)
        let side = null, sideNight = null;
        if (depthOpt > 0) {
          side = document.createElement('div');
          side.className = 'portal-depth';
          side.setAttribute('aria-hidden', 'true');
          sideNight = document.createElement('div');
          sideNight.className = 'portal-depth-night';
          side.appendChild(sideNight);
          outTitle.parentNode.insertBefore(side, outTitle.nextSibling);
          made.push(side);
        }

        // st.ts: how far the title has grown from its rest scale (g.ts0) towards its full size (0-1)
        const st = { zl: 0, rot: 0, tint: 1, ts: 0, note: 1, sub: 0, bl: 0, mz: 1 };
        const g = { W: 0, H: 0, s0: 1, k0: 0, zCover: 1, key: '', box: 0, ts0: TS0 };
        const last = {};
        // writes a style only when it changed (this build's own memory, so a rebuild starts clean)
        const written = new Map();
        const put = (el, prop, v) => {
          if (!el) return;
          let m = written.get(el);
          if (!m) written.set(el, (m = {}));
          if (m[prop] !== v) { m[prop] = v; el.style[prop] = v; }
        };

        // The title rides on the face: at rest every line of it lies inside the face at every angle the
        // turn passes through, 6px clear of the edge. The lines' ink boxes are read at scale 1, around the
        // stage's centre (the anchor); holds(B, s) tests the title at scale s on a mark whose box is B px.
        const M = 6;
        const inkBoxes = () => {
          const tw = outTitle.offsetWidth;
          if (!tw) return [];
          const tr = outTitle.getBoundingClientRect();
          const k = 1 / ((tr.width / tw) || 1), cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;
          const els = outTitle.querySelectorAll('.portal-line').length ? [...outTitle.querySelectorAll('.portal-line')] : [outTitle];
          const out = [];
          for (const el of els) {
            const rg = document.createRange();
            rg.selectNodeContents(el);
            const a = rg.getBoundingClientRect(), b = el.getBoundingClientRect();
            if (a.width) out.push([(a.left - cx) * k, (a.right - cx) * k, (b.top - cy) * k, (b.bottom - cy) * k]);
          }
          return out;
        };
        // the angles of the turn, every 7.5 degrees or closer ("in" turns -turn -> 0, "out" +turn -> 0)
        const angles = () => { const n = Math.max(1, Math.ceil(turn / 7.5)); return Array.from({ length: n + 1 }, (_, i) => (IN ? -turn : turn) * (1 - i / n)); };
        const holds = (boxes, rots, B, s) => {
          const sc = B / mark.box;
          for (const rot of rots) {
            const a = (-rot * Math.PI) / 180, c = Math.cos(a), n = Math.sin(a);
            const ok = (x, y) => inside(mark.coarse, mark.ax + (c * x - n * y) / sc, mark.ay + (n * x + c * y) / sc);
            for (const [l, r, t, b] of boxes) {
              const x0 = l * s - M, x1 = r * s + M, y0 = t * s - M, y1 = b * s + M;
              for (let i = 0; i <= 10; i++) {
                const u = i / 10, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
                if (!ok(x, y0) || !ok(x, y1) || !ok(x0, y) || !ok(x1, y)) return false;
              }
            }
          }
          return true;
        };
        // the smallest mark that holds the whole title at its full rest size (TS0)
        const fullFit = (boxes, rots, W, H) => {
          let lo = 8, hi = 24 * Math.max(W, H);
          if (!holds(boxes, rots, hi, TS0)) return Infinity;
          for (let i = 0; i < 24 && hi - lo > 1; i++) { const mid = (lo + hi) / 2; if (holds(boxes, rots, mid, TS0)) hi = mid; else lo = mid; }
          return hi;
        };
        // the largest box whose mark at rest (turned as it rests, with its extruded side) stays 16px inside
        // the stage on every side, so nothing of it is cut by the screen's edge before the dive
        const fitScreen = (W, H) => {
          const G = 16, d = depthOpt > 1 ? 0 : depthOpt, dpx = depthOpt > 1 ? depthOpt : 0;
          const a = ((IN ? -turn : 0) * Math.PI) / 180, c = Math.cos(a), n = Math.sin(a);
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
          for (const r of mark.coarse) for (const [mx, my] of r) {
            const dx = c * (mx - mark.ax) - n * (my - mark.ay), dy = n * (mx - mark.ax) + c * (my - mark.ay);
            x0 = Math.min(x0, dx); x1 = Math.max(x1, dx); y0 = Math.min(y0, dy); y1 = Math.max(y1, dy);
          }
          const lim = (room, extent, perBox) => { const k = extent / mark.box + perBox; return k > 0 ? Math.max(0, room) / k : Infinity; };
          return Math.min(lim(W / 2 - G, -x0, 0), lim(W / 2 - G - VX * dpx, x1, VX * d), lim(H / 2 - G, -y0, 0), lim(H / 2 - G - VY * dpx, y1, VY * d));
        };
        // the mark's box at rest (a share of the stage: its height on desktop, its width on a phone) and
        // the title's scale on it
        const boxPx = (W, H) => {
          const boxes = inkBoxes(), rots = angles(), scr = fitScreen(W, H);
          if (!boxes.length) return { box: Math.min(scr, phone ? 0.45 * W : Math.min(0.4 * H, 0.45 * W)), ts: TS0 };
          const F = fullFit(boxes, rots, W, H);
          root.dataset.fit = isFinite(F) ? Math.round(F) : 0;
          // the mark itself (not its box) may be at most 0.98 of the width and half the height, and stays
          // on the stage
          const hi = Math.min((0.98 * W) / (mark.bw || 1), (0.5 * H) / (mark.bh || 1), scr);
          let box;
          if (sizeWant === 'fit') {
            const from = phone ? 0.5 * W : 0.25 * H;
            box = Math.max(Math.min(F, hi), Math.min(from, hi));
          } else {
            const B = Math.min(scr, phone ? (sizeWant > 1 ? sizeWant : Math.min(sizeWant * W, 0.4 * H)) : sizeWant > 1 ? sizeWant : Math.min(sizeWant * H, 0.45 * W));
            // a mark a little smaller than the title grows to hold it at full size (a portrait tablet);
            // one that would set the title under half its size grows until it holds half
            if (B >= F) box = B;
            else if (B >= 0.65 * F && F <= Math.max(hi, B)) box = F;
            else box = Math.max(B, Math.min(hi, (0.5 * F) / TS0));
          }
          if (!isFinite(F)) return { box, ts: TS0 };
          // the title set smaller on a mark that cannot hold it at full size (the margin is kept in px)
          let ts = Math.min(TS0, (TS0 * box) / F);
          for (let i = 0; i < 40 && ts > 0.05 && !holds(boxes, rots, box, ts); i++) ts *= 0.97;
          return { box, ts };
        };
        const measure = () => {
          if (dead) return;
          const W = stage.clientWidth || innerWidth, H = stage.clientHeight || innerHeight;
          // on a phone the URL bar never re-measures it (100svh is stable): only a new width, a real
          // change of height, or a title whose text changed size (late fonts) counts
          const rg = document.createRange();
          rg.selectNodeContents(outTitle);
          const ink = outTitle.offsetHeight + ' ' + Math.round(rg.getBoundingClientRect().width);
          const key = [W, phone ? Math.round(H / 120) : H, outTitle.offsetWidth, ink].join(' ');
          if (key !== g.key) {
            const fit = boxPx(W, H);
            g.box = fit.box;
            g.ts0 = fit.ts;
            g.s0 = g.box / mark.box;
            // "in" covers once it is upright; "out" leaves the cover still turned
            g.zCover = coverZoom(mark.table, mark.rin, g.s0, W, H, IN ? 0 : turn);
            g.k0 = depthOpt > 1 ? depthOpt : depthOpt * g.box;
            g.key = key;
          }
          g.W = W; g.H = H;
          root.style.setProperty('--portal-th', outTitle.offsetHeight + 'px');
          root.dataset.cover = g.zCover.toFixed(2);
          root.dataset.box = Math.round(g.box);
          root.dataset.ts = g.ts0.toFixed(3);
          // the picture grows about the stage's centre, wherever the page put its box
          if (media) put(media, 'transformOrigin', `${f1(W / 2 - media.offsetLeft)}px ${f1(H / 2 - media.offsetTop)}px`);
        };

        // sub-paths in screen px: rotated and scaled by (c, n), moved by (tx, ty), as path text
        const subsPath = (subs, c, n, tx, ty, dx = 0, dy = 0) => {
          let s = '';
          tx += dx; ty += dy;
          for (const sp of subs) {
            s += 'M' + P(c * sp.x0 - n * sp.y0 + tx, n * sp.x0 + c * sp.y0 + ty);
            for (const e of sp.edges) {
              const p = e.p;
              s += e.c;
              for (let k = 2; k < p.length; k += 2) s += ' ' + P(c * p[k] - n * p[k + 1] + tx, n * p[k] + c * p[k + 1] + ty);
            }
            s += 'Z';
          }
          return s;
        };
        // ... and as numbers, one flat array per edge, for the side's ribbons
        const subsScreen = (subs, c, n, tx, ty) => subs.map((sp) => sp.edges.map((e) => {
          const p = e.p, q = new Array(p.length);
          for (let k = 0; k < p.length; k += 2) { q[k] = c * p[k] - n * p[k + 1] + tx; q[k + 1] = n * p[k] + c * p[k + 1] + ty; }
          return q;
        }));
        // the side's direction on screen: down and to the right, fixed while the mark turns (a light
        // from the upper left)
        const VX = 0.6 / Math.hypot(0.6, 1), VY = 1 / Math.hypot(0.6, 1);

        let mediaOk = !media || media.tagName !== 'IMG' || (media.complete && media.naturalWidth > 0);
        const render = () => {
          if (dead || !g.W) return;
          const zl = clamp(st.zl, 0, 1);
          // "fly": the distance to the mark falls at a steady rate, so its size grows as 1 / distance.
          // The curve is that of a flight of at most 8x, stretched in log space to the real cover zoom,
          // so a thin mark (a cover of 15-30x) never crowds its last sweep into a single wheel tick
          const lz = Math.log(g.zCover), R = Math.min(g.zCover, 8);
          const z = Math.exp(lz * (FLY && R > 1.01 ? -Math.log(1 - zl * (1 - 1 / R)) / Math.log(R) : zl));
          const s = g.s0 * z, a = (st.rot * Math.PI) / 180, c = Math.cos(a) * s, n = Math.sin(a) * s;
          const tx = g.W / 2 - (c * mark.ax - n * mark.ay), ty = g.H / 2 - (n * mark.ax + c * mark.ay);
          const covered = zl >= 0.9999;
          const face = covered ? '' : subsPath(mark.subs, c, n, tx, ty);
          put(world, 'clipPath', covered ? 'none' : `path(${mark.rule}"${face}")`);
          // once the world covers the stage the paper side is out of sight: stop painting it
          put(outside, 'visibility', covered ? 'hidden' : '');
          if (side) {
            // the side thickens as the mark comes closer (z^0.35: perspective, not a drop shadow)
            const k = g.k0 * Math.pow(z, 0.35);
            const show = !covered && k > 0.5;
            put(side, 'visibility', show ? '' : 'hidden');
            if (show) {
              const vx = VX * k, vy = VY * k;
              // the face itself (under the world, so the face's edge never shows the paper through its
              // antialiasing), the face moved by v, and the ribbons between them; nonzero
              const near = subsPath(mark.sideSubs, c, n, tx, ty);
              const sp = near + subsPath(mark.sideSubs, c, n, tx, ty, vx, vy) + ribbons(subsScreen(mark.subs, c, n, tx, ty), vx, vy, mark.sg);
              put(side, 'clipPath', `path("${sp}")`);
              // the side deepens with the face: accent-dark on the solid face, towards the night once it
              // clears, so its lightness stays about half the face's (measured 0.5-0.55 at 40-60%)
              put(sideNight, 'opacity', ((1 - clamp(st.tint, 0, 1)) * 0.55).toFixed(3));
            }
          }
          put(tint, 'opacity', st.tint.toFixed(3));
          // the title grows from its rest scale towards its full size, but never faster than the mark
          // (ts / z stays at or under the rest scale the face was fitted to), so it stays on the face
          const ts = Math.min(g.ts0 * z, g.ts0 + (1 - g.ts0) * clamp(st.ts, 0, 1));
          put(outTitle, 'transform', `scale(${ts.toFixed(4)})`);
          if (media) {
            // the world comes towards you for the whole hold; the picture stays still until it decoded
            const ms = mediaOk ? st.mz : 1;
            put(media, 'transform', ms > 1.0001 ? `scale(${ms.toFixed(4)})` : 'none');
            const b = blurPx * clamp(st.bl, 0, 1);
            put(media, 'filter', b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none');
          }
          for (const el of notes) put(el, 'opacity', st.note.toFixed(3));
          if (sub) { put(sub, 'opacity', st.sub.toFixed(3)); put(sub, 'transform', `translate3d(0, ${(16 * (1 - st.sub)).toFixed(2)}px, 0)`); }
          const zs = z.toFixed(2), rs = st.rot.toFixed(1);
          if (last.z !== zs) { last.z = zs; root.dataset.z = zs; }
          if (last.r !== rs) { last.r = rs; root.dataset.rot = rs; }
        };

        // the timeline: every tween drives the state object; render() writes the DOM once per update
        const E = FLY ? 'none' : o.ease;
        if (IN) {
          tl.fromTo(st, { zl: 0 }, { zl: 1, duration: 0.7, ease: E }, 0.06)
            .fromTo(st, { rot: -turn }, { rot: 0, duration: 0.3, ease: 'power2.out' }, 0.06)
            // the face clears while the mark is still a shape on the paper, so the next chapter is
            // already alive inside it well before it covers the screen
            .fromTo(st, { tint: 1 }, { tint: 0, duration: 0.44, ease: 'sine.inOut' }, 0.14)
            .fromTo(st, { ts: 0 }, { ts: 1, duration: 0.7, ease: 'sine.inOut' }, 0.06)
            .fromTo(st, { note: 1 }, { note: 0, duration: 0.08 }, 0.06)
            .fromTo(st, { sub: 0 }, { sub: 1, duration: 0.1, ease: 'power2.out' }, 0.8)
            // the world keeps coming at a steady rate, through the rush and on through the dwell
            .fromTo(st, { mz: 1 }, { mz: o.zoom, duration: 0.94 }, 0.06)
            // the rush: the world's picture blurs a little as the edges stream past (a full-screen
            // filter is not free)
            .fromTo(st, { bl: 0 }, { bl: 1, duration: 0.12, ease: 'sine.inOut' }, FLY ? 0.58 : 0.4)
            .to(st, { bl: 0, duration: 0.12, ease: 'sine.inOut' }, FLY ? 0.7 : 0.55);
        } else {
          tl.fromTo(st, { zl: 1 }, { zl: 0, duration: 0.7, ease: E }, 0.1)
            .fromTo(st, { tint: 0 }, { tint: 1, duration: 0.44, ease: 'sine.inOut' }, 0.26)
            // still turned as its edge comes into view, the mark rights itself as it lands
            .fromTo(st, { rot: turn }, { rot: 0, duration: 0.33, ease: 'power2.out' }, 0.45)
            .fromTo(st, { ts: 1 }, { ts: 0, duration: 0.7, ease: 'sine.inOut' }, 0.1)
            .fromTo(st, { sub: 1 }, { sub: 0, duration: 0.08 }, 0.04)
            .fromTo(st, { note: 0 }, { note: 1, duration: 0.08 }, 0.8)
            .fromTo(st, { mz: o.zoom }, { mz: 1, duration: 0.8 }, 0)
            .fromTo(st, { bl: 0 }, { bl: 1, duration: 0.1, ease: 'sine.inOut' }, FLY ? 0.08 : 0.24)
            .to(st, { bl: 0, duration: 0.14, ease: 'sine.inOut' }, FLY ? 0.18 : 0.39);
        }
        tl.set({}, {}, 1);
        tl.eventCallback('onUpdate', render);

        measure();
        render();
        // re-measure on every refresh (resize, fonts, pictures), then redraw
        ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onRefresh: () => { measure(); render(); } });
        // late fonts change the title's size, which places the sub-line and can resize a "fit" mark
        let ro = null;
        if ('ResizeObserver' in window) { ro = new ResizeObserver(() => { if (!dead) { measure(); render(); } }); ro.observe(outTitle); }
        // pictures decode before they move; a video plays only while the section is on screen. The picture
        // stays painted with the world, never on a layer of its own: under the moving clip a layer adds a
        // full-screen mask every frame, and promoting it at cover costs one long raster right at the rush
        if (media && blurPx > 0) media.style.willChange = 'filter';
        if (media && media.tagName === 'IMG') {
          media.loading = 'eager';
          if (!mediaOk) {
            const go = () => { if (dead || mediaOk) return; mediaOk = true; render(); };
            if (media.decode) media.decode().then(go, go); else media.addEventListener('load', go, { once: true });
          }
        }
        let io = null;
        if (media && media.tagName === 'VIDEO' && 'IntersectionObserver' in window) {
          io = new IntersectionObserver(([e]) => { if (e.isIntersecting) media.play().catch(() => {}); else media.pause(); });
          io.observe(root);
        }

        return () => {
          dead = true;
          tl.eventCallback('onUpdate', null);
          if (ro) ro.disconnect();
          if (io) io.disconnect();
          for (const el of made) el.remove();
          world.style.removeProperty('clip-path');
          if (outside) outside.style.removeProperty('visibility');
          if (media) { media.style.removeProperty('filter'); media.style.removeProperty('will-change'); media.style.removeProperty('transform-origin'); }
          for (const el of [outTitle, media, tint, sub, ...notes]) if (el) { el.style.removeProperty('transform'); el.style.removeProperty('opacity'); }
          for (const k of ['z', 'rot', 'cover', 'box', 'fit', 'ts']) delete root.dataset[k];
          root.style.removeProperty('--portal-th');
        };
      });
    }

    const plan = canClip && mark && $('.portal-world') && $('.portal-title--out') ? build : null;
    if (mark && !plan && canClip) console.warn(`${ID}: needs .portal-world and an h2.portal-title--out; showing the finished composition.`);
    return Stage.scene(root, {
      hold: o.hold,
      scrub: o.scrub ?? (Stage.lenis ? true : 0.8),
      build: plan,
      phone: o.phone === 'rest' || !plan ? 'rest' : { hold: o.phoneHold, build: plan },
    });
  };
})();
