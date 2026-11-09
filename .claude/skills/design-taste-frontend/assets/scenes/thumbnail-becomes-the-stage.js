// tasteskill / scenes / thumbnail-becomes-the-stage.js
//
// A two-line statement sits over a row of small 16:9 thumbnails. The middle one is really a keyhole onto
// a full-stage chapter picture or loop. As the page scrolls, the side thumbnails tuck in behind it, the
// keyhole rises and opens to full bleed, and the statement's first line passes through the keyhole's edge
// (ink outside, paper inside) and settles top-left as the chapter's heading, with an optional note under
// it. Feature notes then come in over a flat band at the foot of the picture. Use it to open a product,
// place or film chapter from one strong muted video loop or one strong picture.
//
// Requires stage.js (and stage.css), GSAP 3.15.0 + ScrollTrigger 3.15.0. Load thumbnail-becomes-the-stage.css.
// Call Stage.smooth() before Stage.init(), so the scene knows whether Lenis is running.
//
// DOM (one section; the paper copy may be left out, the script clones it from the ink statement, but include it
// so the finished composition without script has its heading too):
//
// <section class="scene" data-scene="thumbnail-becomes-the-stage" data-options='{"hold":2}'>
//   <div class="scene-stage">
//     <div class="kh-statement-box">
//       <h2 class="kh-statement">
//         <span class="kh-line kh-line--lead"><span class="kh-mask"><span class="kh-in">Swim after dark.</span></span></span>
//         <span class="kh-line"><span class="kh-mask"><span class="kh-in">Let the sea come in.</span></span></span>
//       </h2>
//     </div>
//     <div class="kh-row" aria-hidden="true">
//       <div class="kh-sat"><img src="neighbour-a.jpg" alt=""></div>          any number before the slot
//       <div class="kh-slot"><img class="kh-slot-poster" src="chapter-640.jpg" alt=""></div>
//       <div class="kh-sat"><img src="neighbour-b.jpg" alt=""></div>          and after it (0, 1 or 2 a side)
//     </div>
//     <div class="kh-window">
//       <div class="kh-media"><video muted loop playsinline preload="metadata" poster="chapter.jpg"><source src="chapter.mp4" type="video/mp4"></video></div>
//                                        or <img src="chapter.jpg" alt="…">, or a <picture>. No autoplay attribute:
//                                        the scene plays the loop while it is on screen and never under reduced motion
//       <div class="kh-shade" aria-hidden="true"></div>
//       <div class="kh-statement-box kh-statement-box--paper" aria-hidden="true">(the same h2 as a div, same spans)</div>
//       <div class="kh-chapter">
//         <p class="kh-note">Lamps on from nine until midnight</p>          optional, under the heading
//         <ul class="kh-features"><li><h3>Label</h3><p>Body</p></li> …</ul>  4 reads best
//       </div>
//     </div>
//   </div>
// </section>
//
// Content:
//   Line 1 is the chapter's name and becomes its heading; a second line is optional (house rule: two lines at
//   most). Keep lines to 20 characters or fewer. The type is one size in both roles and is never scaled while it
//   moves, but a line that would not fit is set smaller before the scene starts: line 1 is held to 62% of the
//   stage width on desktop and tablet and 82% on phones (wider, and the ink/paper split would last past two
//   thirds of the scene, because the window must grow past the line before it is wholly inside), and every
//   other line to the width between the gutters. The finished composition gets the same size when script
//   runs, so its heading is the live end frame's; without script a too-long line wraps instead, and the note
//   below it moves down with it.
//   The chapter picture keeps its subject in the central 75% x 70% (that crop is the thumbnail) and its upper
//   left calm and dark (the heading sits there in white). No text burned into pictures.
//   Feature items: a 2-3 word label and a body of 16 words or fewer. Up to 4 are shown (one row on desktop, two
//   by two on tablets and in the phone's finished composition, the first 2 while the scene runs on a phone);
//   any further items stay in the list for screen readers only, so 3 to 12 all work but only 4 are seen.
//
// Options (data-options JSON), defaults and ranges:
//   hold       2      screens the stage is held for on desktop and tablet (1.4-2.6)
//   phoneHold  1.6    screens held on phones under 768px (1.4-2.6)
//   phone      'same' 'same' runs the scene on phones with phone numbers; 'rest' shows the finished composition
//   scrub      auto   true (locked to the scrollbar) when Lenis smoothing runs, else 0.5 s of catch-up (0-0.8)
//   thumb      0.17   thumbnail width as a fraction of the row on desktop and tablet (0.12-0.24). On phones the keyhole
//                     starts at half the width with its neighbours running off the edges (CSS --kh-thumb-phone: 50%)
//   radius     page   keyhole and thumbnail corner radius in px (0-16); defaults to the page's --radius, else 0.
//                     It always decays to exactly 0 as the window reaches full bleed.
//   shade      0.3    alpha of the flat scrim laid over the picture once the heading is on it (0-0.6). Lower it for a
//                     picture whose upper left is already dark (0.1-0.15), so the opened stage lands bright
//   band       auto   alpha of the flat band behind the feature notes (0-0.85). By default it follows shade, so the
//                     notes keep the same ground whatever the shade: 0.64 at shade 0.3 (the default), 0.72 at 0.12
//   heading    0.15   where the heading settles, as a fraction of the stage height from the top (0.1-0.25)
//   nav        ''     selector of a fixed nav; it gets the class is-on-dark while the opened picture lies under it,
//                     until the stage has scrolled past it (style .is-on-dark in the page)
//
// Page tokens it follows when they exist: --ground (or --bg), --ink, --paper, --font-display, --font-text,
// --margin (side gutter), --radius.
//
// Everything the scrubbed timeline moves is a plain proxy object turned into custom properties by render()
// (--kh-t transform, --kh-o opacity, --kh-clip, --kh-win-o, --kh-band), each written on the element that uses
// it. The CSS gives every one its p = 0 value as the live default, so a fresh load or a ScrollTrigger refresh at
// any point of the scene shows the right frame.
//
// crosses words: `.kh-window` the keyhole opens behind line 1, never over it: the statement stays above the
// window, and line 1 carries its own paper copy (.kh-paper-ink, made by the script), clipped to the window, so
// where the edge passes the line it recolours each glyph whole (ink outside, paper inside). The second line
// has faded before the window reaches it.
(() => {
  const ID = 'thumbnail-becomes-the-stage';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  const px = (v) => Math.round(v * 100) / 100;
  // line 1 at most this share of the stage width, so it is wholly inside the opening window by about p 0.6
  const LEAD_SHARE = 0.62, LEAD_SHARE_PHONE = 0.82;

  let measureCtx = null;
  const ctx2d = () => (measureCtx = measureCtx || document.createElement('canvas').getContext('2d'));
  const setFont = (c, cs) => {
    c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ('letterSpacing' in c) c.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
  };

  // Where a line's glyphs actually paint, relative to its line box: the font's own metrics place the
  // baseline (half-leading), the text's measured ink gives the rest. Falls back to the box with a margin.
  const inkBounds = (line) => {
    const box = { x: 0, y: 0, w: line.offsetWidth, h: line.offsetHeight };
    const cs = getComputedStyle(line), fs = parseFloat(cs.fontSize) || 16;
    const pad = { x: -0.04 * fs, y: -0.1 * fs, w: box.w + 0.08 * fs, h: box.h + 0.1 * fs };
    try {
      const c = ctx2d();
      setFont(c, cs);
      const t = c.measureText(textOf(line).trim());
      if (!t.fontBoundingBoxAscent) return pad;
      const lh = parseFloat(cs.lineHeight) || fs;
      const base = (lh - (t.fontBoundingBoxAscent + t.fontBoundingBoxDescent)) / 2 + t.fontBoundingBoxAscent;
      const top = base - t.actualBoundingBoxAscent, bottom = base + t.actualBoundingBoxDescent;
      return { x: -t.actualBoundingBoxLeft - 1, y: top - 1, w: t.actualBoundingBoxLeft + t.actualBoundingBoxRight + 2, h: bottom - top + 2 };
    } catch { return pad; }
  };

  // a style property written only when its string changes
  const writer = (el, prop) => { let last = ''; return (v) => { if (v !== last) { last = v; el.style.setProperty(prop, v); } }; };

  // a line's own words, without the paper copy the script nests in line 1
  const PAPER = 'kh-paper-ink';
  const textOf = (el) => {
    let s = '';
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (!n.parentElement.closest('.' + PAPER)) s += n.nodeValue;
    return s;
  };

  function make(root, opts = {}) {
    const o = {
      hold: clamp(num(opts.hold, 2), 1.4, 2.6),
      phoneHold: clamp(num(opts.phoneHold, 1.6), 1.4, 2.6),
      phone: opts.phone === 'rest' ? 'rest' : 'same',
      scrub: opts.scrub,
      heading: clamp(num(opts.heading, 0.15), 0.1, 0.25),
      nav: typeof opts.nav === 'string' ? opts.nav : '',
    };
    if (opts.thumb != null) root.style.setProperty('--kh-thumb', clamp(num(+opts.thumb, 0.17), 0.12, 0.24) * 100 + '%');
    if (opts.radius != null) root.style.setProperty('--kh-radius', clamp(num(+opts.radius, 0), 0, 16) + 'px');
    if (opts.shade != null) root.style.setProperty('--kh-shade', clamp(num(+opts.shade, 0.3), 0, 0.6));
    if (opts.band != null) root.style.setProperty('--kh-band-alpha', clamp(num(+opts.band, 0.6), 0, 0.85));
    if (opts.heading != null) root.style.setProperty('--kh-head', o.heading * 100 + 'svh'); // the finished composition puts it there too

    const stageEl = root.querySelector(':scope > .scene-stage');
    const inkBox = root.querySelector('.kh-statement-box:not(.kh-statement-box--paper)');
    const win = root.querySelector('.kh-window');
    const row = root.querySelector('.kh-row');
    const slot = root.querySelector('.kh-slot');
    if (!stageEl || !inkBox || !win || !row || !slot) { console.warn(ID + ': missing .kh-statement-box, .kh-row, .kh-slot or .kh-window'); return null; }

    // the paper copy of the statement lives inside the window; clone it when the page left it out
    let paperBox = win.querySelector('.kh-statement-box--paper');
    if (!paperBox) {
      paperBox = inkBox.cloneNode(true);
      paperBox.classList.add('kh-statement-box--paper');
      paperBox.setAttribute('aria-hidden', 'true');
      paperBox.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      const chapter = win.querySelector('.kh-chapter');
      win.insertBefore(paperBox, chapter || null);
    }
    const thumbs = [...row.children].filter((n) => n.classList.contains('kh-sat') || n === slot);
    root.style.setProperty('--kh-n', thumbs.length);

    // Fit the statement: a line that would not fit is set smaller (one factor for every line, both copies,
    // live and finished). Natural widths come from the font itself, so wrapping in the finished composition
    // does not hide them. Returns the factor in use.
    const inkLines = [...inkBox.querySelectorAll('.kh-line')];
    const inkLead = inkBox.querySelector('.kh-line--lead') || inkLines[0];
    const statementEl = inkBox.querySelector('.kh-statement') || inkBox;
    // line 1's paper copy, nested in the ink line itself (after the window's copy was cloned, so that one
    // has none): while the scene runs it is clipped to the window, so the line is recoloured in place
    const leadIn = inkLead ? inkLead.querySelector('.kh-in') || inkLead : null;
    let veil = leadIn ? leadIn.querySelector(':scope > .' + PAPER) : null;
    if (leadIn && !veil) {
      veil = document.createElement('span');
      veil.className = PAPER;
      veil.setAttribute('aria-hidden', 'true');
      veil.textContent = textOf(leadIn).trim();
      leadIn.appendChild(veil);
    }
    const fit = (phone) => {
      const W = stageEl.clientWidth || root.clientWidth;
      if (!W || !inkLead) return 1;
      const now = parseFloat(root.style.getPropertyValue('--kh-fit')) || 1;
      let f = 1;
      try {
        const cs = getComputedStyle(statementEl), c = ctx2d();
        setFont(c, cs);
        const gutter = parseFloat(getComputedStyle(paperBox).paddingLeft) || Math.round(W * 0.03);
        const room = W - 2 * gutter - 2; // a little under, so the finished composition never wraps on a rounding
        for (const l of inkLines) {
          const natural = c.measureText(textOf(l).replace(/\s+/g, ' ').trim()).width / now; // at the CSS size
          const cap = l === inkLead ? Math.min(room, (phone ? LEAD_SHARE_PHONE : LEAD_SHARE) * W) : room;
          if (natural > 0) f = Math.min(f, cap / natural);
        }
      } catch { return now; }
      f = clamp(Math.floor(f * 1000) / 1000, 0.5, 1);
      if (Math.abs(f - now) > 0.002) { if (f >= 0.999) root.style.removeProperty('--kh-fit'); else root.style.setProperty('--kh-fit', String(f)); }
      return f;
    };

    // the finished composition (reduced motion, a phone set to 'rest', a failed CDN) gets the same size; it
    // re-fits on resize, when fonts arrive and when reduced motion is switched on. (Checked by class rather than
    // through the stage's rest() alone: the stage does not call rest() for reduced motion on a desktop.)
    const restFit = () => { if (!root.classList.contains('is-live')) fit(window.matchMedia('(max-width: 767px)').matches); };
    const later = () => setTimeout(restFit, 0); // after the stage has switched classes
    window.addEventListener('resize', later, { passive: true });
    try { window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', later); } catch {}
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(restFit);

    const Stage = window.Stage;
    if (window.ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });
    const scrub = o.scrub === true || typeof o.scrub === 'number' ? (o.scrub === true ? true : clamp(o.scrub, 0, 0.8)) : Stage.lenis ? true : 0.5;

    const build = (tl, ctx) => {
      const { stage } = ctx;
      const lineOf = (box) => { const ls = [...box.querySelectorAll('.kh-line')]; const lead = box.querySelector('.kh-line--lead') || ls[0]; return { lead, rest: ls.filter((l) => l !== lead) }; };
      const ink = lineOf(inkBox), paper = lineOf(paperBox);
      if (!ink.lead || !paper.lead) return;
      const slotAt = thumbs.indexOf(slot);
      const sats = thumbs.filter((t) => t !== slot).map((el) => {
        const i = thumbs.indexOf(el);
        return { el, side: i < slotAt ? 1 : -1, k: Math.abs(i - slotAt), t: writer(el, '--kh-t'), o: writer(el, '--kh-o') };
      });
      const media = win.querySelector('.kh-media');
      const shade = win.querySelector('.kh-shade');
      const features = win.querySelector('.kh-features');
      const items = features ? [...features.children] : [];
      const note = win.querySelector('.kh-note');
      const video = media && media.querySelector('video');

      const w = {
        clip: writer(win, '--kh-clip'), winO: writer(win, '--kh-win-o'), // its own name: --kh-o would be inherited by the notes
        media: media ? writer(media, '--kh-t') : () => {},
        row: writer(row, '--kh-t'),
        inkLead: writer(ink.lead, '--kh-t'),
        inkColour: leadIn ? writer(leadIn, 'color') : () => {}, veil: veil ? writer(veil, 'clip-path') : () => {},
        paperLead: writer(paper.lead, '--kh-t'),
        rest: ink.rest.map((l) => ({ t: writer(l, '--kh-t'), o: writer(l, '--kh-o'), v: writer(l, '--kh-vis') })),
        shade: shade ? writer(shade, '--kh-o') : () => {},
        band: features ? writer(features, '--kh-band') : () => {},
        items: items.map((li) => ({ t: writer(li, '--kh-t'), o: writer(li, '--kh-o') })),
        note: note ? { t: writer(note, '--kh-t'), o: writer(note, '--kh-o') } : null,
      };

      // proxies: normalised values the timeline drives; render() turns them into geometry and styles
      const radius0 = () => parseFloat(getComputedStyle(win).getPropertyValue('--kh-radius')) || 0;
      const A = { v: 0 }, K = { v: 0 }, E = { v: 0 }, R = { v: radius0() }, M = { v: 0 }, F = { v: 1 }, S = { v: 0 }, B = { v: 0 }, N = { v: 0 };
      const I = items.map(() => ({ v: 0 }));
      const V = thumbs.map(() => ({ v: 0 })); // entry reveal, one per thumbnail

      // geometry, measured on every refresh (offsets ignore transforms)
      let g = null;
      const offset = (el) => { let x = 0, y = 0; for (let n = el; n && n !== stage; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return { x, y }; };
      const measure = () => {
        const W = stage.clientWidth, H = stage.clientHeight;
        if (!W || !H) return null;
        fit(ctx.phone); // before anything is read: it may change the statement's size
        const tw = slot.offsetWidth, th = slot.offsetHeight;
        const so = offset(slot);
        const next = thumbs[slotAt + 1] || thumbs[slotAt - 1];
        const gap = next ? Math.abs(next.offsetLeft - slot.offsetLeft) - tw : 12;
        const lo = offset(ink.lead);
        const ib = inkBounds(ink.lead);
        const gutter = parseFloat(getComputedStyle(paperBox).paddingLeft) || Math.round(W * 0.03);
        const vo = veil ? offset(veil) : lo;
        // the lowest edge of the other lines, which must have faded before the window reaches them
        const restBottom = ink.rest.reduce((b, l) => Math.max(b, offset(l).y + l.offsetHeight), -Infinity);
        return {
          W, H, tw, th, gap, cx0: so.x + tw / 2, cy0: so.y + th / 2,
          s0: Math.min(1, 1.3 * Math.max(tw / W, th / H)),
          dx: gutter - lo.x, dy: o.heading * H - lo.y,
          // line 1's inked box at rest (where its glyphs actually paint), in stage pixels
          lx: lo.x + ib.x, ly: lo.y + ib.y, lw: ib.w, lh: ib.h,
          // its paper copy's box at rest
          vx: vo.x, vy: vo.y, vw: veil ? veil.offsetWidth : 0, vh: veil ? veil.offsetHeight : 0,
          restBottom,
          navY: nav ? navLine() : 0,
        };
      };

      const nav = o.nav ? document.querySelector(o.nav) : null;
      let navDark = false, pastNav = false;
      const navLine = () => { const r = nav.getBoundingClientRect(); return Math.max(0, r.top + r.height / 2); };
      const setNav = (d) => { if (nav && d !== navDark) { navDark = d; nav.classList.toggle('is-on-dark', d); } };

      let reveal = null;
      const render = () => {
        if (!g) g = measure();
        if (!g) return;
        if (reveal && reveal.progress() < 1 && tl.progress() > 0) reveal.progress(1);
        const { W, H, tw, th, gap, cx0, cy0, s0, dx, dy, lx, ly, lw, lh } = g;
        const alt = A.v, k = K.v, e = E.v, m = M.v;
        const vSlot = V[slotAt].v;

        // neighbours slide in under the keyhole and shrink about their inner edge; the row rides up with the
        // keyhole (same lift, same centre), so the window always stays seated on it and no ground shows below
        const slide = Math.min(1, 3 * alt), sc = 1 - alt / 2;
        for (const s of sats) {
          const v = V[thumbs.indexOf(s.el)].v;
          s.t(`translate3d(${px(s.side * s.k * (tw + gap) * slide)}px,${px(16 * (1 - v))}px,0) scale(${px(sc * 1000) / 1000})`);
          s.o(String(px(F.v * v)));
        }
        w.row(`translate3d(0,${px((H / 2 - cy0) * k)}px,0)`);

        // the window: rises (k), grows (e), loses its radius last (R); the media is centred on it and zooms with it
        const cy = cy0 + (H / 2 - cy0) * k + 16 * (1 - vSlot);
        const cx = cx0 + (W / 2 - cx0) * k;
        const ww = tw + (W - tw) * e, hh = th + (H - th) * e;
        const s = s0 + (1 - s0) * e;
        const top = Math.max(0, cy - hh / 2), bottom = Math.max(0, H - cy - hh / 2);
        const left = Math.max(0, cx - ww / 2), right = Math.max(0, W - cx - ww / 2);
        const r = top + bottom + left + right < 0.5 ? 0 : R.v;
        w.clip(`inset(${px(top)}px ${px(right)}px ${px(bottom)}px ${px(left)}px round ${px(r)}px)`);
        w.winO(String(px(vSlot)));
        w.media(`translate3d(${px(cx - W / 2)}px,${px(cy - H / 2)}px,0) scale(${Math.round(s * 10000) / 10000})`);
        w.shade(String(px(S.v)));

        // the other lines leave as the neighbours tuck in, and in any case 12px before the rising window
        // would reach them: the statement lies above the window, so nothing may be left of them there
        const lift = -24 * alt;
        const room = vSlot > 0 ? (top - (g.restBottom + lift) - 12) / 48 : 1;
        const restO = clamp(Math.min(1 - 1.6 * alt, room), 0, 1);
        for (const rl of w.rest) { rl.o(String(px(restO))); rl.v(restO > 0 ? 'visible' : 'hidden'); rl.t(`translate3d(0,${px(lift)}px,0)`); }

        // line 1 travels to the heading spot; the ink copy and the paper copy move as one
        const lt = `translate3d(${px(dx * m)}px,${px(dy * m)}px,0)`;
        w.inkLead(lt); w.paperLead(lt);
        // line 1's nested paper copy shows exactly where the window lies behind it (the same rectangle and
        // corners, in its own coordinates), so the edge recolours the line instead of passing over it
        if (veil) {
          const vx = g.vx + dx * m, vy = g.vy + dy * m;
          w.veil(vSlot > 0 ? `inset(${px(top - vy)}px ${px(vx + g.vw - (W - right))}px ${px(vy + g.vh - (H - bottom))}px ${px(left - vx)}px round ${px(r)}px)` : 'inset(100%)');
        }
        // under a wholly covered line the ink has nothing left to show: it goes clear, so no ink fringe
        // lines the paper letters, and comes back if the line ever leaves the window
        const gx = lx + dx * m, gy = ly + dy * m;
        const within = vSlot >= 1 && gx >= left && gx + lw <= W - right && gy >= top && gy + lh <= H - bottom;
        w.inkColour(within && veil ? 'transparent' : '');

        // the chapter: the band draws in from the left, the note and the feature notes rise into place
        w.band(String(px(B.v)));
        items.forEach((li, i) => { const v = I[i].v; w.items[i].o(String(px(v))); w.items[i].t(`translate3d(0,${px(24 * (1 - v))}px,0)`); });
        if (w.note) { w.note.o(String(px(N.v))); w.note.t(`translate3d(0,${px(8 * (1 - N.v))}px,0)`); }
        if (nav) setNav(!pastNav && vSlot >= 1 && top <= g.navY);
      };

      // ---- the scrubbed timeline (positions and durations are fractions of the scene) ----
      // shaped curves inside the scrub (power1 = quadratic, power2 = cubic in GSAP's names). Only proxies are
      // tweened, never the page's elements, so a refresh cannot leave a half-applied style behind.
      const ft = (target, from, to, at, dur, ease = 'none') => tl.fromTo(target, { v: from }, { v: to, duration: dur, ease, immediateRender: false }, at);
      ft(A, 0, 0.25, 0.08, 0.14, 'power1.in');      // the neighbours lead
      ft(A, 0.25, 1, 0.22, 0.34, 'power1.out');
      ft(K, 0, 1, 0.12, 0.58, 'power1.out');        // window rise (the row rides on it)
      ft(E, 0, 1, 0.14, 0.72, 'power1.inOut');      // window growth and media scale
      tl.fromTo(R, { v: () => radius0() }, { v: 0, duration: 0.16, ease: 'power1.in', immediateRender: false }, 0.7); // radius and inset reach 0 together at 0.86
      ft(M, 0, 1, 0.36, 0.5, 'power2.inOut');       // line 1 hand-off
      ft(F, 1, 0, 0.3, 0.1);                        // guard: the neighbours are already hidden behind the window
      ft(S, 0, 1, 0.26, 0.16);                      // flat scrim on before line 1 reaches the picture
      ft(B, 0, 1, 0.78, 0.12, 'power2.out');        // the band under the notes
      // the notes that are shown (CSS keeps the rest for screen readers) arrive one after another by 0.945
      const shown = Math.max(1, items.filter((li) => li.offsetWidth > 2).length);
      const each = shown > 1 ? Math.min(0.015, 0.045 / (shown - 1)) : 0;
      I.forEach((P, i) => ft(P, 0, 1, 0.83 + Math.min(i, shown - 1) * each, 0.07, 'power2.out'));
      if (note) ft(N, 0, 1, 0.86, 0.06, 'power2.out');
      tl.eventCallback('onUpdate', render);

      // ---- entry reveal, time-based, before the hold: the statement rises out of its masks, the row settles ----
      const ins = inkBox.querySelectorAll('.kh-in');
      reveal = gsap.timeline({ paused: true, onUpdate: render });
      reveal.fromTo(ins, { yPercent: 100, skewY: 5 }, { yPercent: 0, skewY: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1 }, 0);
      const order = [slot, ...sats.slice().sort((a, b) => a.k - b.k).map((s) => s.el)];
      order.forEach((el, i) => reveal.to(V[thumbs.indexOf(el)], { v: 1, duration: 0.6, ease: 'power2.out' }, 0.2 + i * 0.06));
      // it starts as the statement itself comes into view, so it is seen, and it is done long before the hold
      // (measured from the section top: the statement sits inside the sticky stage, which ScrollTrigger cannot offset)
      ScrollTrigger.create({ trigger: root, start: () => 'top+=' + Math.round(statementEl.offsetTop + inkBox.offsetTop) + ' 92%', once: true, onEnter: () => reveal.play() });

      // ---- side jobs: re-measure on every refresh, play the one video only while the scene is on screen ----
      let alive = true;
      ScrollTrigger.create({
        trigger: root, start: 'top bottom', end: 'bottom top',
        onRefresh: () => { g = null; render(); },
        onToggle: (self) => {
          if (!video) return;
          if (self.isActive) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } else video.pause(); // never rewound
        },
      });
      // a fixed nav turns light while the window lies under it, and back once the stage has gone past it
      if (nav) {
        ScrollTrigger.create({
          trigger: root, start: () => 'bottom top+=' + Math.round(navLine()),
          onEnter: () => { pastNav = true; setNav(false); },
          onLeaveBack: () => { pastNav = false; render(); },
        });
      }
      // what the timeline does not own is put back by hand when the scene stops (reduced motion turned on, a resize to 'rest')
      gsap.context(() => () => {
        alive = false; setNav(false); if (video) video.pause();
        // the finished composition shows line 1 in ink again (the paper copy is not drawn there)
        if (leadIn) leadIn.style.removeProperty('color');
        if (veil) veil.style.removeProperty('clip-path');
      });
      const again = () => { if (alive) { g = null; render(); } };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
      const pics = [...root.querySelectorAll('.kh-media img, .kh-sat img')].filter((i) => !i.complete);
      Promise.all(pics.map((i) => i.decode().catch(() => {}))).then(again);
      render();
    };

    const mm = Stage.scene(root, {
      hold: o.hold,
      scrub,
      build,
      phone: o.phone === 'rest' ? 'rest' : { hold: o.phoneHold, build },
      rest: restFit,
    });
    restFit();
    return mm;
  }

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = make;
})();
