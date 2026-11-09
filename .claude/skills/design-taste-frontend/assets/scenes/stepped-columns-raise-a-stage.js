// tasteskill / scenes / stepped-columns-raise-a-stage.js — Stepped columns raise a stage.
//
// A held stage on one flat page colour holds a row of 3-5 equal columns. Each column opens as an ink
// stub that already holds its step's copy, under its note (the date or stage, in ink on the page). The
// stubs rise together and finish at evenly spread points, so the row reads first as a falling bar chart
// and then levels into one block, late in the hold. An ink edge never stops in a line of copy: where it
// would cross one (the note at the top of a column), it jumps past it in one step, so no word is ever
// cut into two colours while it is read. Wherever ink has arrived, a page-coloured line drawing shows: a
// square wheel rolling over a road of arches with its hub perfectly level, gaining a side on every arch
// as the arches shrink, until it rests as a circle on a flat road in the last column. The rolling wheel
// says "the road gets smoother as we go": use it only when the steps' own copy runs from rough to
// smooth, and {"wheel":"none"} for a plain stepped chart otherwise (a timeline, an order's progress,
// tiers): there the wheel means nothing.
//
// Needs gsap + ScrollTrigger (no SplitText), stage.js, then this file. Read the CSS file's header too.
//
// Markup (the ghost copy, the drawing and the wheel are made by this file; do not write them):
//
//   <section class="scene" data-scene="stepped-columns-raise-a-stage" style="--n:4"
//            data-options='{"order":"descending"}' aria-labelledby="sr-title">
//     <div class="scene-stage">
//       <header class="sr-head">
//         <h2 class="sr-title" id="sr-title">Every table starts out rough</h2>     ≤ 8 words, ≤ 2 lines
//         <div class="sr-rail" aria-hidden="true">                                 optional
//           <span class="sr-rail-end">Rough</span>
//           <span class="sr-rail-line"><span class="sr-rail-dot"></span></span>
//           <span class="sr-rail-end">Smooth</span>
//         </div>
//       </header>
//       <ol class="sr-cols">
//         <li class="sr-col">
//           <div class="sr-panel">
//             <p class="sr-note">Week one</p>               optional; plain words, never an index number
//             <h3 class="sr-col-title">Rough-sawn oak</h3>   ≤ 2 short lines (≤ 18 characters a line)
//             <p class="sr-col-text">We pick the boards at the yard ourselves.<span class="sr-more"> Then
//               they settle in the shop for a week before the first cut.</span></p>
//           </div>                                          16-28 words. The optional .sr-more part is
//         </li>                                             what a phone row drops: keep the rest ≤ 70
//         … one <li> per step                               characters (two lines on a 390px phone)
//       </ol>
//     </div>
//   </section>
//
// Step counts: 3-5 is the design; 1-6 run as columns; 7-12 run as rows (a horizontal bar chart, on
// desktop too); more than 12 show the finished composition.
//
// Colours (CSS): exactly two. --sr-page (defaults to the page's --ground, else white) must be ONE flat
// colour under the whole stage: the drawing is printed in it and is meant to be invisible off the ink.
// --sr-ink (defaults to --accent, else vermilion #d2232a) must reach 4.5:1 against the page.
//
// Options (data-options JSON, or the second argument), with defaults and ranges:
//   hold       screens the stage is held on desktop       0.6 × N, clamped 1.8-3 (2.4 for four);
//                                                          1.8 with wheel "none"
//   phoneHold  screens held on a phone (rows)              0.5 × N, clamped 1.8-2.6 (2 for four);
//                                                          1.8 with wheel "none"
//   scrub      seconds of catch-up                         0.3 with Stage.smooth(), else 0.5   (0.2-0.8)
//   order      which column fills first                    "descending" (first column first, reads "done in
//                                                          order") | "ascending" (last column first: a rising
//                                                          chart for tiers) | "centre" (odd N, middle first)
//   ends       [first, last] ink end points, 0-1           [0.30, 0.86]; first 0.20-0.40, last 0.75-0.88
//   wheel      "road" (the rolling wheel) | "none"         "road"
//   ghost      false: each column starts as an ink stub     false; true = the whole step's copy waits in
//              that already holds its copy, under its       ink on the page and the ink rises from the
//              note in ink on the page                      column's foot (it jumps past the copy at once)
// The rail is optional; without it the rows layout has no wheel. --n on the section (the step count)
// is only needed for the no-script layout; the script sets it.
//
// Timeline (fractions of the hold), one linear proxy 0 → 1 that renders every frame:
//   columns  every panel's clip-path runs from its stub (inset(100% 0 0 0) with the ghost) to inset(0)
//            from 0, ending at its end point (default 0.30 / 0.49 / 0.67 / 0.86 for four), skipping
//            every band that holds a line of copy: the edge reaches the line, then is past it on the
//            next frame. The wheel rolls from 0.22 (later if the ink would not lead it: it is never cut
//            by a bar top) to 0.94, so something still moves until the stage lets go.
//   rows     each row turns to ink as one block, faded over 0.04 of the hold that ends at its end
//            point (a wipe would cut the row's words); the rail wheel rolls from 0.05 to the last end
//            + 0.08.
//   The header, the road, the dashed axle and the ghost copy never move.
//
// Layout modes, chosen on every refresh from the stage size and N:
//   cols   columns side by side (1-6 steps, ≥ 860px wide, ≥ 540px tall, ≥ 190px a column); the drawing
//          prints in page colour on the ink. Titles share one top line, bodies another.
//   rows   below that, on a phone, or 7-12 steps: stacked rows, each with its note on its title's line,
//          that turn to ink one after another; the wheel moves onto the header rail and rolls there in
//          ink on the page colour (R up to 32px in the rail's top padding). When the copy does not fit,
//          two compact levels are tried before giving up: data-sr-dense="rows" (smaller row type and
//          padding, and on a row ≥ 560px wide title, body and note side by side) and
//          data-sr-dense="all" (a short header too, the rail's labels beside its road). That keeps a
//          375x667 phone, landscape phones and 12 steps on a 1440x900 desktop moving.
//   still  the copy does not fit even then: the finished composition, unheld.
// Reduced motion, no script and a failed CDN show the finished composition (CSS): every column inked;
// with this file running it also prints the road and one wheel per column, square to circle. Turning
// reduced motion on mid-session lands on the same composition.
(() => {
  if (!window.Stage) return;
  const ID = 'stepped-columns-raise-a-stage';
  const NS = 'http://www.w3.org/2000/svg';
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const r1 = (v) => Math.round(v * 10) / 10;

  // ---- geometry of a regular polygon rolling on inverted catenaries --------------------------------
  // A polygon of n sides and circumradius R (apothem a = R cos(pi/n)) rolls with a level hub over arches
  // y = axle + a cosh(u / a), each 2a acosh(1 / cos(pi/n)) wide: the crest touches a side, the troughs
  // touch a vertex. The hub stays directly above the contact point, so x alone decides the rotation.
  const apothem = (n, R) => R * Math.cos(PI / n);
  const archWidth = (n, R) => 2 * apothem(n, R) * Math.acosh(1 / Math.cos(PI / n));
  const ROAD = [4, 4, 4, 5, 6, 7, 8, 9, 10, 12];
  const ROAD_SHORT = [4, 4, 5, 6, 8, 12]; // three columns
  const DROP = [9, 7, 4, 10, 5, 8, 6]; // what goes first when the road is too long
  const FADE = 2; // 12-sided arches that flatten while the wheel rounds off
  const SAMPLES = 360; // outline points while two outlines blend (every n here but 7 divides it)
  const ROW_FADE = 0.04; // rows: how much of the hold one row takes to turn to ink
  const AIR = 6; // px of air the ink edge keeps from a line of copy it jumps past
  const MAX_COLS = 6, MAX_ROWS = 12;

  // The ink in a column, 0-1 of its height from the foot, for a share f (0-1) of its rise from k0. The
  // bands in `zones` hold copy: the edge never stops in one. It runs through what is left at an even
  // pace and crosses each band between two frames, so a line of copy is never shown cut in two colours.
  const allowed = (k0, zones) => {
    const segs = [];
    let x = k0;
    for (const [a, b] of zones) {
      if (b <= x) continue;
      if (a > x) segs.push([x, Math.min(a, 1)]);
      x = Math.max(x, b);
      if (x >= 1) break;
    }
    if (x < 1) segs.push([x, 1]);
    return segs;
  };
  const inkAt = (segs, f) => {
    if (f >= 1 || !segs.length) return f >= 1 ? 1 : segs.length ? segs[0][0] : 0;
    let d = f * segs.reduce((s, [a, b]) => s + b - a, 0);
    for (const [a, b] of segs) { if (d <= b - a) return a + d; d -= b - a; }
    return 1;
  };
  // the share of the rise at which the ink first reaches k
  const shareAt = (segs, k) => {
    const L = segs.reduce((s, [a, b]) => s + b - a, 0);
    if (!L) return 1;
    let acc = 0;
    for (const [a, b] of segs) { if (k <= b) return clamp((acc + Math.max(0, k - a)) / L, 0, 1); acc += b - a; }
    return 1;
  };

  // The road: arches from x0 (a trough) until the bumps end at or before xT, then flat. A long road
  // drops arches; a short one gains up to `grow` more squares at its start.
  function planRoad(base, R, x0, xT, grow) {
    const seq = base.slice();
    const length = () => seq.reduce((s, n) => s + archWidth(n, R), 0) + FADE * archWidth(12, R);
    for (const n of DROP) {
      if (x0 + length() <= xT) break;
      const i = seq.indexOf(n);
      if (i > -1 && (n !== 4 || seq.filter((v) => v === 4).length > 1)) seq.splice(i, 1);
    }
    for (let k = 0; k < grow && x0 + length() + archWidth(4, R) <= xT; k++) seq.unshift(4);
    const arches = [];
    let x = x0;
    const add = (n, fade) => { const w = archWidth(n, R); arches.push({ x0: x, x1: x + w, xc: x + w / 2, w, n, a: apothem(n, R), fade }); x += w; };
    seq.forEach((n) => add(n, false));
    const fadeStart = x;
    for (let k = 0; k < FADE; k++) add(12, true);
    return { arches, fadeStart, flatX: x, R };
  }

  function roadPath(road, axleY, xStart, xEnd) {
    const { R, arches } = road;
    const yT = axleY + R;
    const K = 24;
    let d = `M${r1(xStart)} ${r1(yT)}L${r1(arches[0].x0)} ${r1(yT)}`;
    for (const A of arches) {
      for (let j = 1; j <= K; j++) {
        const u = -A.w / 2 + (j / K) * A.w;
        let dip = R - A.a * Math.cosh(u / A.a);
        if (A.fade) dip *= 1 - smooth(road.fadeStart, road.flatX, A.xc + u);
        d += `L${r1(A.xc + u)} ${r1(yT - dip)}`;
      }
    }
    return d + `L${r1(xEnd)} ${r1(yT)}`;
  }

  // Where the wheel is at x: its rotation, and which outline (or blend of two, or circle) it has.
  function wheelAt(road, x) {
    const A = road.arches, R = road.R;
    if (x >= road.flatX) return { rho: (x - road.flatX) / R, nA: 12, nB: 12, s: 0, c: 1 };
    let k = 0;
    while (k < A.length - 1 && x > A[k].x1) k++;
    const ar = A[k];
    const u = clamp(x - ar.xc, -ar.w / 2, ar.w / 2);
    const rho = Math.atan(Math.sinh(u / ar.a)) + (u <= 0 ? PI / ar.n : -PI / ar.n);
    let nA = ar.n, nB = ar.n, s = 0;
    const prev = A[k - 1], next = A[k + 1];
    if (prev && prev.n !== ar.n && x < ar.x0 + 0.15 * ar.w) { nA = prev.n; s = smooth(ar.x0 - 0.15 * prev.w, ar.x0 + 0.15 * ar.w, x); }
    else if (next && next.n !== ar.n && x > ar.x1 - 0.15 * ar.w) { nB = next.n; s = smooth(ar.x1 - 0.15 * ar.w, ar.x1 + 0.15 * next.w, x); }
    const c = ar.fade ? smooth(road.fadeStart, road.flatX, x) : 0;
    return { rho, nA, nB, s, c };
  }

  // Outline radius (as a fraction of R) of the n-gon at polar angle phi, vertex pointing down at 0.
  const unitRadius = (n, phi) => {
    const seg = TAU / n;
    let m = (phi - PI / 2) % seg;
    if (m < 0) m += seg;
    return Math.cos(PI / n) / Math.cos(m - PI / n);
  };
  const polygon = (n, R) => {
    let d = '';
    for (let k = 0; k < n; k++) { const p = PI / 2 + (k * TAU) / n; d += `${k ? 'L' : 'M'}${r1(R * Math.cos(p))} ${r1(R * Math.sin(p))}`; }
    return d + 'Z';
  };
  const circle = (R) => `M${r1(R)} 0A${r1(R)} ${r1(R)} 0 1 1 ${r1(-R)} 0A${r1(R)} ${r1(R)} 0 1 1 ${r1(R)} 0Z`;
  const shapeKey = (w) => (w.c >= 0.999 ? 'circle' : w.c > 0 || (w.s > 0 && w.s < 1) ? 'blend' : 'n' + (w.s >= 1 ? w.nB : w.nA));
  function shapePath(w, R, cache) {
    const key = shapeKey(w);
    if (key === 'circle') return cache.circle || (cache.circle = circle(R));
    if (key !== 'blend') return cache[key] || (cache[key] = polygon(w.s >= 1 ? w.nB : w.nA, R));
    let d = '';
    for (let j = 0; j < SAMPLES; j++) {
      const phi = (j * TAU) / SAMPLES;
      let u = unitRadius(w.nA, phi);
      if (w.s > 0) u += (unitRadius(w.nB, phi) - u) * w.s;
      u += (1 - u) * w.c;
      d += `${j ? 'L' : 'M'}${r1(R * u * Math.cos(phi))} ${r1(R * u * Math.sin(phi))}`;
    }
    return d + 'Z';
  }

  const el = (tag, cls, parent) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); if (parent) parent.appendChild(e); return e; };

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const colEls = [...root.querySelectorAll('.sr-col')];
    const N = colEls.length;
    if (!stage || !N) return null;

    // ---- options ----
    const wheelOn = !(opts.wheel === 'none' || opts.wheel === false);
    const ghostOn = opts.ghost === true || opts.ghost === 'on';
    const ends = Array.isArray(opts.ends) ? opts.ends : [0.3, 0.86];
    const e1 = clamp(+ends[0] || 0.3, 0.05, 0.85), eN = clamp(+ends[1] || 0.86, e1, 0.88);
    const order = opts.order || 'descending';
    const lin = (i) => (N === 1 ? eN : e1 + (i * (eN - e1)) / (N - 1));
    const E = colEls.map((_, i) => {
      if (order === 'ascending') return lin(N - 1 - i);
      if (order === 'centre' || order === 'center') { const m = (N - 1) / 2; return m ? e1 + ((eN - e1) * Math.abs(i - m)) / m : e1; }
      return lin(i);
    });
    const lastEnd = Math.max(...E);
    const hold = opts.hold ?? (wheelOn ? clamp(0.6 * N, 1.8, 3) : 1.8);
    const phoneHold = opts.phoneHold ?? (wheelOn ? clamp(0.5 * N, 1.8, 2.6) : 1.8);
    const scrub = opts.scrub ?? (Stage.lenis ? 0.3 : 0.5);

    // ---- the parts this file makes ----
    root.classList.add('sr-js');
    root.style.setProperty('--n', N);
    const panels = colEls.map((c) => c.querySelector('.sr-panel'));
    if (!ghostOn) root.setAttribute('data-sr-ghost', 'off');
    colEls.forEach((c, i) => {
      if (!panels[i] || c.querySelector('.sr-ghost')) return;
      const g = panels[i].cloneNode(true);
      g.classList.replace('sr-panel', 'sr-ghost');
      g.removeAttribute('id');
      g.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      g.setAttribute('aria-hidden', 'true');
      g.inert = true;
      c.insertBefore(g, panels[i]);
    });
    const probe = document.createElement('div');
    probe.className = 'sr-probe';
    probe.setAttribute('aria-hidden', 'true');
    stage.appendChild(probe);
    let draw = stage.querySelector('svg.sr-draw');
    if (!draw) { draw = el('svg', 'sr-draw', stage); }
    draw.setAttribute('aria-hidden', 'true');
    draw.setAttribute('focusable', 'false');
    draw.replaceChildren();
    const axle = el('line', 'sr-axle', draw);
    const road = el('path', 'sr-road', draw);
    const stations = el('g', 'sr-stations', draw);
    const wheel = el('svg', 'sr-wheel', stage);
    wheel.setAttribute('aria-hidden', 'true');
    wheel.setAttribute('focusable', 'false');
    const wheelAtG = el('g', null, wheel);
    const wheelRot = el('g', null, wheelAtG);
    const wheelShape = el('path', 'sr-wheel-shape', wheelRot);
    const hub = el('circle', 'sr-hub', wheelAtG);
    const rail = root.querySelector('.sr-rail');
    const railLine = root.querySelector('.sr-rail-line');
    const dot = root.querySelector('.sr-rail-dot');

    const S = { live: false, geo: null, lastP: 0, key: '', cache: {}, stub: 0, clip: [], segs: [] };

    // ---- measuring ----
    const relTo = (base) => (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      return { left: r.left - base.left, top: r.top - base.top, right: r.right - base.left, bottom: r.bottom - base.top, width: r.width, height: r.height };
    };
    const parts = (rel) => colEls.map((c, i) => {
      const p = panels[i] || c;
      return { col: rel(c), panel: rel(p), note: rel(p.querySelector('.sr-note')), title: rel(p.querySelector('.sr-col-title')), text: rel(p.querySelector('.sr-col-text')) };
    });
    // two boxes on one line, closer than `gap` side by side
    const overlaps = (a, b, gap) => a.left < b.right + gap && b.left < a.right + gap && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    // Does every step's copy sit inside its panel, clear of its note?
    function fits() {
      const rel = relTo(stage.getBoundingClientRect());
      const cols = root.getAttribute('data-sr-mode') === 'cols';
      const dense = root.hasAttribute('data-sr-dense');
      return parts(rel).every((m) => {
        const P = m.col; // the cell, not the panel: a panel grows past its cell when the copy overflows
        const copy = [m.title, m.text].filter(Boolean);
        if (!P || !copy.length) return true;
        const all = m.note ? [m.note, ...copy] : copy;
        // a compact row has thin padding: ask for a little air above and below its copy as well
        const airTop = dense ? 8 : 4, airBottom = dense ? 6 : -1;
        if (all.some((b) => b.top < P.top + airTop || b.bottom > P.bottom - airBottom || b.right > P.right + 1)) return false;
        if (!m.note) return true;
        // columns keep the note above the copy; rows set it beside the title
        if (!cols) return copy.every((b) => !overlaps(m.note, b, 8));
        return copy[0].top >= m.note.bottom + 12;
      });
    }
    const setAttr = (k, v) => { if (v == null) { if (root.hasAttribute(k)) root.removeAttribute(k); } else if (root.getAttribute(k) !== v) root.setAttribute(k, v); };

    // Every copy block in one visual row of cards as tall as the tallest, so the titles share one top
    // line and the bodies another, whatever the body lengths.
    function equalize(on) {
      setAttr('data-sr-even', null);
      colEls.forEach((c) => { c.style.removeProperty('--sr-title-h'); c.style.removeProperty('--sr-text-h'); });
      if (!on) return;
      const h = (p, sel) => { const e = p && p.querySelector(sel); return e ? e.getBoundingClientRect().height : 0; };
      const rows = [];
      colEls.forEach((c, i) => {
        const top = c.getBoundingClientRect().top;
        let row = rows.find((r) => Math.abs(r.top - top) < 2);
        if (!row) rows.push((row = { top, cols: [], title: 0, text: 0 }));
        row.cols.push(c);
        row.title = Math.max(row.title, h(panels[i], '.sr-col-title'));
        row.text = Math.max(row.text, h(panels[i], '.sr-col-text'));
      });
      rows.forEach((r) => r.cols.forEach((c) => {
        c.style.setProperty('--sr-title-h', Math.ceil(r.title) + 'px');
        c.style.setProperty('--sr-text-h', Math.ceil(r.text) + 'px');
      }));
      setAttr('data-sr-even', '');
    }

    function pickMode() {
      const W = stage.clientWidth || window.innerWidth;
      const H = probe.offsetHeight || window.innerHeight;
      const G = clamp(W * 0.0167, 16, 24);
      setAttr('data-sr-dense', null);
      if (N <= MAX_COLS && W >= 860 && H >= 540 && (W - 2 * G - (N - 1) * 12) / N >= 190) {
        setAttr('data-sr-mode', 'cols');
        equalize(true);
        if (fits()) return 'cols';
      }
      equalize(false);
      if (N <= MAX_ROWS) {
        setAttr('data-sr-mode', 'rows');
        if (fits()) return 'rows';
        // compact rows first, then a compact header too
        for (const level of ['rows', 'all']) {
          setAttr('data-sr-dense', level);
          if (fits()) return 'rows';
        }
        setAttr('data-sr-dense', null);
      }
      return 'still';
    }

    // ---- the layout: mode, geometry, the static drawing ----
    function layout() {
      const live = S.live && root.classList.contains('is-live');
      const mode = live ? pickMode() : 'rest';
      setAttr('data-sr-mode', mode);
      if (mode !== 'rows') setAttr('data-sr-dense', null);
      // the finished composition: every panel fully inked (columns clip, rows fade)
      panels.forEach((p) => {
        if (!p) return;
        if (mode !== 'cols') p.style.removeProperty('clip-path');
        if (mode !== 'rows') p.style.removeProperty('opacity');
      });
      S.clip = [];
      let base = stage.getBoundingClientRect();
      let rel = relTo(base);
      let M = parts(rel);
      const oneRow = N > 1 && M.every((m) => Math.abs(m.col.top - M[0].col.top) < 2);
      const wrap = oneRow || N === 1 ? 'no' : 'yes';
      setAttr('data-sr-wrap', wrap);
      if (mode !== 'cols') equalize(mode === 'rest' || mode === 'still');
      base = stage.getBoundingClientRect();
      rel = relTo(base);
      M = parts(rel);
      const W = base.width;
      // ghost copy off (the default): each column starts as an ink stub just tall enough to hold its copy
      S.stub = 0;
      if (!ghostOn && mode === 'cols') {
        const colH = M[0].col.height;
        S.stub = clamp(Math.max(...M.map((m) => m.col.bottom - ((m.title || m.text || { top: m.col.bottom }).top - 22))) / colH, 0, 0.6);
      }
      // the bands of each column the ink edge may cross but never stop in: every block of copy, the
      // panel's and the ghost's (they share a place), with AIR above and below, from the column's foot
      S.segs = [];
      if (mode === 'cols') {
        M.forEach((m, i) => {
          const col = m.col;
          const z = [m.note, m.title, m.text].filter(Boolean)
            .map((b) => [(col.bottom - b.bottom - AIR) / col.height, (col.bottom - b.top + AIR) / col.height])
            .sort((a, b) => a[0] - b[0]);
          const merged = [];
          for (const [a, b] of z) { const l = merged[merged.length - 1]; if (l && a <= l[1]) l[1] = Math.max(l[1], b); else merged.push([a, b]); }
          S.segs[i] = allowed(S.stub, merged);
        });
      }
      let kind = 'none';
      if (wheelOn) {
        if (mode === 'cols' || ((mode === 'rest' || mode === 'still') && oneRow && W >= 860)) kind = 'ink';
        else if (railLine && rail) kind = 'rail';
      }
      const g = { mode, kind, wheel: false, p0: 0.22, p1: 0.94, railLen: 0 };
      if (mode === 'rows') { g.p0 = 0.05; g.p1 = Math.min(0.95, lastEnd + 0.08); }
      // when each panel starts filling: together in columns (a bar chart); in rows just before its end point
      g.start = E.map((e) => (mode === 'rows' ? Math.max(0, e - ROW_FADE) : 0));
      if (kind === 'ink') {
        const top = Math.max(...M.map((m) => (m.note ? m.note.bottom : m.col.top + 16)));
        const foot = Math.min(...M.map((m) => (m.title || m.text || { top: m.col.bottom - 16 }).top));
        const band = foot - top;
        const colW = M[0].col.width;
        g.R = Math.min(0.34 * colW, 0.25 * band);
        g.axleY = top + band / 2;
        if (g.R < 24) kind = g.kind = 'none';
        else {
          const last = M[N - 1].col;
          g.road = planRoad(N === 3 ? ROAD_SHORT : ROAD, g.R, -g.R, last.left, 4);
          g.wx0 = -g.R;
          g.wx1 = last.left + last.width / 2;
          g.centres = M.map((m) => m.col.left + m.col.width / 2);
          axle.setAttribute('x1', 0);
          axle.setAttribute('x2', r1(W));
          axle.setAttribute('y1', r1(g.axleY));
          axle.setAttribute('y2', r1(g.axleY));
          road.setAttribute('d', roadPath(g.road, g.axleY, -g.R - 4, W + 4));
          if (mode === 'cols') {
            // the ink must lead the wheel: each column is inked above the wheel's top before it arrives
            const colH = M[0].col.height, colBottom = M[0].col.bottom;
            const need = clamp((colBottom - (g.axleY - g.R - 4)) / colH, 0, 1);
            M.forEach((m, i) => {
              const ti = clamp((m.col.left - (g.wx0 + g.R)) / (g.wx1 - g.wx0), 0, 1);
              if (ti < 1) g.p0 = Math.max(g.p0, (E[i] * shareAt(S.segs[i], need) - g.p1 * ti) / (1 - ti));
            });
            g.p0 = Math.min(g.p0, 0.6);
            g.wheel = true;
          }
        }
      }
      if (kind === 'rail') {
        // the rail's own top padding is the wheel's room; the road replaces the rail's track
        const line = rel(railLine);
        const box = rel(rail);
        const roadY = line ? line.top + line.height / 2 : 0;
        g.R = line && box ? Math.min(clamp(W * 0.08, 14, 32), (roadY - box.top - 8) / 2) : 0;
        if (g.R < 8 || !line || line.width < 80) kind = g.kind = 'none';
        else {
          g.axleY = roadY - g.R;
          g.road = planRoad(ROAD, g.R, line.left, line.left + 0.7 * line.width, 8);
          g.wx0 = g.road.arches[0].xc;
          g.wx1 = line.right - g.R;
          road.setAttribute('d', roadPath(g.road, g.axleY, line.left, line.right));
          g.wheel = mode === 'rows';
        }
      }
      if (kind === 'none') road.removeAttribute('d');
      if (kind !== 'ink') axle.removeAttribute('x2');
      setAttr('data-sr-draw', kind);
      // the drawing layer covers only the band it draws in, never the copy or the header above it
      if (kind === 'none') draw.style.display = 'none';
      else {
        const y0 = Math.floor(g.axleY - g.R - 12), y1 = Math.ceil(g.axleY + g.R + 12);
        draw.style.display = '';
        draw.style.top = y0 + 'px';
        draw.style.height = y1 - y0 + 'px';
        draw.setAttribute('viewBox', `0 ${y0} ${r1(W)} ${y1 - y0}`);
        draw.setAttribute('preserveAspectRatio', 'none');
      }

      // ghost lines the ink has fully covered are hidden, so nothing reads as text lying under a panel
      g.ghosts = colEls.map((c, i) => {
        const gh = c.querySelector('.sr-ghost');
        if (!gh || (mode !== 'cols' && mode !== 'rows')) return [];
        const col = M[i].col;
        const range = document.createRange();
        return [...gh.children].map((e) => {
          e.style.removeProperty('visibility');
          // the text itself, not its box: a block title is as wide as the row but its words are not
          range.selectNodeContents(e);
          const rs = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
          if (!rs.length) return null;
          const top = Math.min(...rs.map((r) => r.top)) - base.top, right = Math.max(...rs.map((r) => r.right)) - base.left;
          const at = mode === 'cols' ? (col.bottom - top + 1) / col.height : (right - col.left + 1) / col.width;
          return { e, at, off: false };
        }).filter(Boolean);
      });
      if (mode !== 'cols' && mode !== 'rows') root.querySelectorAll('.sr-ghost > *').forEach((e) => e.style.removeProperty('visibility'));

      // the finished composition: one wheel per column (or four on the rail), square to circle
      stations.replaceChildren();
      if (!g.wheel && kind !== 'none' && (mode === 'rest' || mode === 'still')) {
        let targets;
        if (kind === 'ink') targets = g.centres;
        else {
          // on the rail: square, the first hexagon, the last 12-gon, then the circle at the far end
          const A = g.road.arches, plain = A.slice(0, A.length - FADE);
          const hex = plain.find((a) => a.n >= 6) || plain[Math.floor(plain.length / 2)];
          targets = [A[0].xc, hex.xc, plain[plain.length - 1].xc, g.wx1];
        }
        const crests = g.road.arches;
        const used = new Set();
        targets.forEach((x, i) => {
          let at = x, w;
          if (i === targets.length - 1 && x >= g.road.flatX) w = { rho: 0, nA: 12, nB: 12, s: 0, c: 1 };
          else {
            let best = crests[0];
            for (const A of crests) if (Math.abs(A.xc - x) < Math.abs(best.xc - x)) best = A;
            if (used.has(best)) return;
            used.add(best);
            at = best.xc;
            w = wheelAt(g.road, at - 1e-6);
          }
          const s = el('g', 'sr-station', stations);
          s.setAttribute('transform', `translate(${r1(at)} ${r1(g.axleY)})`);
          const rot = el('g', null, s);
          rot.setAttribute('transform', `rotate(${((w.rho * 180) / PI).toFixed(2)})`);
          el('path', 'sr-wheel-shape', rot).setAttribute('d', shapePath(w, g.R, {}));
          el('circle', 'sr-hub', s).setAttribute('r', r1(Math.max(2, g.R * 0.03)));
        });
      }

      // the rolling wheel
      setAttr('data-sr-wheel', g.wheel ? 'on' : 'off');
      if (g.wheel) {
        g.box = Math.ceil(g.R + 6);
        wheel.setAttribute('width', 2 * g.box);
        wheel.setAttribute('height', 2 * g.box);
        wheelAtG.setAttribute('transform', `translate(${g.box} ${g.box})`);
        hub.setAttribute('r', r1(Math.max(2, g.R * 0.03)));
      }
      if (!wheelOn) { g.p0 = 0; g.p1 = lastEnd; }

      // the rail dot travels with the wheel while the scene runs; at rest it waits at the far end
      g.railLen = live && railLine && dot && (mode === 'cols' || (mode === 'rows' && kind === 'none')) ? Math.max(0, railLine.clientWidth - dot.offsetWidth) : 0;
      if (dot && !g.railLen) dot.style.transform = '';
      S.geo = g;
      S.cache = {};
      S.key = '';
      if (live) render(S.lastP);
    }

    // ---- one frame ----
    function render(p) {
      S.lastP = p;
      const g = S.geo;
      if (!g) return;
      if (g.mode === 'cols' || g.mode === 'rows') {
        for (let i = 0; i < N; i++) {
          const el = panels[i];
          if (!el) continue;
          const f = clamp((p - g.start[i]) / (E[i] - g.start[i]), 0, 1);
          // columns: the edge rises, skipping every band of copy; rows: the whole row fades to ink at once
          const k = g.mode === 'cols' ? inkAt(S.segs[i] || [], f) : Math.round(f * 1000) / 1000;
          if (g.mode === 'cols') {
            const v = `inset(${(100 - k * 100).toFixed(2)}% 0% 0% 0%)`;
            if (S.clip[i] !== v) { el.style.clipPath = v; S.clip[i] = v; }
          } else if (S.clip[i] !== k) { el.style.opacity = String(k); S.clip[i] = k; }
          for (const part of g.ghosts[i]) {
            const off = g.mode === 'cols' ? k >= part.at : k >= 1;
            if (off !== part.off) { part.off = off; part.e.style.visibility = off ? 'hidden' : ''; }
          }
        }
      }
      const t = clamp((p - g.p0) / (g.p1 - g.p0), 0, 1);
      if (g.railLen) dot.style.transform = `translate3d(${r1(t * g.railLen)}px,0,0)`;
      if (!g.wheel) return;
      const x = g.wx0 + t * (g.wx1 - g.wx0);
      const w = wheelAt(g.road, x);
      wheel.style.transform = `translate3d(${r1(x - g.box)}px,${r1(g.axleY - g.box)}px,0)`;
      wheelRot.setAttribute('transform', `rotate(${((w.rho * 180) / PI).toFixed(2)})`);
      const key = shapeKey(w);
      if (key !== S.key || key === 'blend') { wheelShape.setAttribute('d', shapePath(w, g.R, S.cache)); S.key = key; }
    }

    // ---- staying right: refreshes while it runs, resizes and late fonts while it rests ----
    if (window.ScrollTrigger) {
      ScrollTrigger.addEventListener('refreshInit', () => { if (S.live) layout(); });
      ScrollTrigger.addEventListener('refresh', () => { if (S.live) render(S.lastP); });
    }
    let raf = 0;
    const later = () => { if (!S.live && !raf) raf = requestAnimationFrame(() => { raf = 0; if (!S.live) layout(); }); };
    if (window.ResizeObserver) new ResizeObserver(later).observe(stage);
    if (document.fonts) document.fonts.ready.then(later);
    // The stage drops .is-live without calling rest() when reduced motion is switched on mid-session on
    // a desktop (its matchMedia has no branch for it): land on the finished composition anyway.
    const settle = () => { if (S.live && !root.classList.contains('is-live')) { S.live = false; layout(); } };
    if (window.MutationObserver) new MutationObserver(settle).observe(root, { attributes: true, attributeFilter: ['class'] });
    const reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (reduce && reduce.addEventListener) reduce.addEventListener('change', () => requestAnimationFrame(settle));

    const build = (tl) => {
      S.live = true;
      layout();
      const proxy = { p: 0 };
      tl.fromTo(proxy, { p: 0 }, { p: 1, duration: 1, ease: 'none', onUpdate: () => render(proxy.p) }, 0);
    };

    return Stage.scene(root, {
      hold,
      scrub,
      build,
      phone: { hold: phoneHold, build },
      rest: () => { S.live = false; layout(); },
    });
  };
})();
