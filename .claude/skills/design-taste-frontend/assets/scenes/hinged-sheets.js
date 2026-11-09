// tasteskill / scenes / hinged-sheets.js — paper with two printed sides, dealt from a face-down deck.
//
// Two to four tickets (prices, passes, stats, letters) rise together from one face-down deck below
// the fold. Each peels off, turns from its ink-coloured back to its paper front on a shared vanishing
// point, lifts towards the viewer at mid-turn and lands in its slot, one by one, left to right. The
// stagger comes from the rise durations, not from delays. Before the deck comes up, the headline steps
// out of its way: it rises and shrinks to the top of the stage and stays there, sharp, as the heading
// over the row. It is in place before the deck's top edge reaches it, so no ticket ever passes over a
// word. The line over the row and the fine print under it arrive as the last ticket lands, and the
// finished row holds still for a short beat (the last 12% of the hold), not a dead screen.
// Use it when the brand has a paper, ticket, stationery or print idea; without one the turning is a
// trick.
//
// The deal runs when every ticket can be at least 296px wide in one row with the band over the row and
// the fine print in their room (three tickets: about 1040 x 700 and up). Phones, tablets, short windows
// and more than four tickets get the flow version: no held stage; the tickets stand in a column or a
// grid, and each one rises, turns and lands on its own as it scrolls in, face-up and still before it is
// read; the fine print under them comes in once the last one is down. Reduced motion, no
// script and a failed CDN show the finished composition: headline, the line over the row, the tickets
// face-up, the fine print.
//
// DOM (optional parts can be left out):
//   <section class="scene" data-scene="hinged-sheets" id="tickets" aria-labelledby="hs-title">
//     <div class="scene-stage">
//       <div class="hs-head">
//         <h2 class="hs-title" id="hs-title">The sea is open all winter</h2>   4-7 words of plain text,
//                                                                            two lines
//         <p class="hs-sub">One sentence, under 20 words.</p>     optional; leaves before the deal
//       </div>
//       <p class="hs-lead">Prices for October to April</p>      3-8 words: what the prices are for (the
//                                                               season, the unit); it sits between the
//                                                               headline and the row
//       <ol class="hs-row" role="list">
//         <li class="hs-slot">                                 2-4 of them (5-12 run as the flow version)
//           <div class="hs-sheet">                             nothing here may fade, clip or filter
//             <article class="hs-face hs-face--front">
//               <img class="hs-photo" src alt="" width height>  optional, the top quarter; better left out:
//                                                             without it the ticket is printed type, the
//                                                             name large and the copy filling the sheet
//                                                             (a photo on top reads as a pricing card)
//               <div class="hs-body">
//                 <h3 class="hs-name">One swim</h3>             1-2 words
//                 <p class="hs-pitch">…</p>                     10-16 words with a photo, up to 26 without
//                 <ul class="hs-points"><li>…</li></ul>         2-3 points of 2-5 words
//               </div>
//               <div class="hs-stub">                          below the perforation
//                 <p class="hs-price"><span class="hs-amount">€14</span><span class="hs-per">a visit</span></p>
//                 <a class="hs-cta" href="…">Buy one swim</a>   optional
//               </div>
//             </article>
//             <div class="hs-face hs-face--back" aria-hidden="true">   shown only while live
//               <span class="hs-big">1 swim</span>              one or two short words, very large
//               <span class="hs-brand">Selkie Sea Baths</span>
//               <span class="hs-small">Any day of the season</span>
//             </div>
//           </div>
//         </li>
//       </ol>
//       <p class="hs-note">One or two lines of fine print, 15-25 words.</p>
//     </div>
//   </section>
// The script makes the ground wash and the turn shades itself, and while live it gives each face and
// shade its paper, ink or shade as a bitmap background with the perforation punched through, so a
// moving ticket needs no mask. Give every front the same amount of copy: tickets keep a 1:1.414 shape.
//
// Options (data-options JSON; defaults in brackets):
//   hold     1.2-4             [0.6 + 0.5 x tickets: 2.1 for three]  screens the stage is held
//   scrub    true | 0.2-0.6    [true with Lenis, else 0.5]
//   deck     0-1               [1]     how far the tickets start towards one centre deck, in slot
//                                      pitches: 0 rises each one straight up from its own slot
//   stagger  0.08-0.18         [0.14; 0.12 with four]  scene between one landing and the next
//   wobble   0-8 (degrees)     [7]     starting rotation of the deck (pattern -1, +0.7, -0.4, +0.6)
//   lean     0-18 (degrees)    [16]    starting rotationX
//   lift     0-120 (px)        [120]   how far each ticket comes towards the viewer at mid-turn
//   phone    'flip' | 'rest'   ['flip']  the phone's per-ticket turn, or the finished composition
//
// Page tokens: --accent (the one ink: the backs and every word, #b62118), --paper (#fafaf9),
// --font-display, --font-text, --radius (the page's one corner radius: the tickets and the button take
// it, up to 24px on a ticket; 0 when the page has none), and the weights --display-weight (headline,
// ticket names, prices, the big word on the back; 500), --strong-weight (the line over the row, the
// points, the button, the name on the back; 600) and --text-weight (400). Set each weight to one the
// page loads: a weight the font lacks is drawn at the nearest weight it has (fake bold is off). Scene
// tokens on the section:
// --hs-ground-a and --hs-ground-b (the ground at the start and at the end, a tint of a hue that sets off
// the ink; b clearly lighter, so the stage brightens as the tickets land), --hs-title-end (the
// headline's size once it has stepped back over the row; clamp(36px, min(4.2vw, 7svh), 72px)) and
// --hs-shade-paper (what a front greys to as it turns away: a cool dark, never the ink). Timeline
// positions are fractions of the scene (0-1).
//
// Scenes['hinged-sheets'](root, opts) returns a handle: { mm (the live gsap.matchMedia), revert() }.
// revert() stops the scene for good and leaves the finished composition.
(() => {
  const ID = 'hinged-sheets';
  if (!window.Stage) { console.warn(ID + ': load stage.js before this file'); return; }

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const opt = (v, d, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : d);
  const RAD = Math.PI / 180;
  const WOBBLE = [-1, 0.714, -0.429, 0.571];
  const SHADE = 0.42;     // darkest a face gets, edge-on
  const MIN_W = 296;      // narrowest ticket the deal runs with (its text is 14px there)
  // The deal's clock, in fractions of the hold. The headline steps back (0.03-0.30) while the deck rises
  // from below the fold (from 0.04; its top edge first shows near 0.18, far below the headline), the last
  // ticket lands at 0.80, the line over the row and the fine print are in by 0.88, and the finished row
  // holds for the rest.
  const STEP = [0.03, 0.27], DECK = 0.04, LAND = 0.80;
  const GAP = 12;         // headline to the line over the row, once it has stepped back

  // Any CSS colour as sRGB numbers, through a 1px canvas (it reads oklch() and color-mix() results).
  let pen = null;
  const rgbOf = (css) => {
    try {
      pen = pen || Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
      pen.clearRect(0, 0, 1, 1);
      pen.fillStyle = '#010203';
      pen.fillStyle = css;
      if (pen.fillStyle === '#010203') return null; // a colour this browser's canvas cannot read
      pen.fillRect(0, 0, 1, 1);
      const d = pen.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    } catch { return null; }
  };
  const make = (tag, cls, parent, first) => {
    const el = document.createElement(tag);
    el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    first ? parent.prepend(el) : parent.append(el);
    return el;
  };

  // The perforation while live. The finished composition cuts it with a CSS mask; a moving 3D face
  // must not have a mask or a clip-path: Chrome draws such a layer through a mask texture the size of
  // its projection, rebuilt as it turns, and a ticket lifted towards the viewer at mid-turn needs one of
  // several screens of pixels on every frame. Nor an SVG picture: on a moving 3D layer Chrome records
  // it again on every frame. So while live each surface (paper, ink and the two turn shades) is a
  // bitmap, drawn once at the ticket's size and the screen's density, with the holes already punched
  // out: a row of 26 holes and two edge notches on the line at 70% of the ticket, in the same
  // 1000 x 1414 box as the mask. The holes stay real (they show whatever is behind the ticket).
  const punched = (rgb, w, h) => {
    const k = Math.min(2, window.devicePixelRatio || 1);
    const c = document.createElement('canvas');
    c.width = Math.max(10, Math.round(w * k));
    c.height = Math.max(14, Math.round(h * k));
    const g = c.getContext('2d');
    g.fillStyle = `rgb(${rgb.join(',')})`;
    g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-out';
    const s = c.width / 1000, y = (990 / 1414) * c.height;
    const hole = (cx, r) => { g.moveTo((cx + r) * s, y); g.arc(cx * s, y, r * s, 0, 2 * Math.PI); };
    g.beginPath();
    hole(0, 26);
    hole(1000, 26);
    for (let x = 75; x <= 925; x += 34) hole(x, 8);
    g.fill();
    return `url("${c.toDataURL('image/png')}")`;
  };

  Scenes[ID] = (root, opts = {}) => {
    const stage = root.querySelector(':scope > .scene-stage');
    const row = root.querySelector('.hs-row');
    const slots = [...root.querySelectorAll('.hs-slot')].filter((s) => s.querySelector('.hs-sheet'));
    const sheets = slots.map((s) => s.querySelector('.hs-sheet'));
    const N = sheets.length;
    if (!stage || !row || !N) { console.warn(ID + ': needs .scene-stage, .hs-row and at least one .hs-slot > .hs-sheet'); return null; }

    const title = root.querySelector('.hs-title');
    const sub = root.querySelector('.hs-sub');
    const lead = root.querySelector('.hs-lead');
    const note = root.querySelector('.hs-note');
    const wash = stage.querySelector(':scope > .hs-wash') || make('div', 'hs-wash', stage, true);
    // reads the deal's ticket width and the headline's stepped-back size from the CSS (one source)
    const gauge = stage.querySelector(':scope > .hs-gauge') || make('span', 'hs-gauge', stage);
    const shades = sheets.map((sh) => [...sh.querySelectorAll(':scope > .hs-face')].map((f) => f.querySelector(':scope > .hs-shade') || make('span', 'hs-shade', f)));
    // The backs are print (aria-hidden). During the deal they overlap one another in the deck, so their
    // words become generated content there and are never counted as text lying under a ticket; in the
    // flow they are ordinary text again.
    const printed = [...root.querySelectorAll('.hs-face--back > *:not(.hs-shade)')].filter((el) => !el.children.length);
    const asPrint = (on) => {
      for (const el of printed) {
        if (on && el.dataset.print == null && el.textContent.trim()) { el.dataset.print = el.textContent.replace(/\s+/g, ' ').trim(); el.textContent = ''; }
        else if (!on && el.dataset.print != null) { el.textContent = el.dataset.print; delete el.dataset.print; }
      }
    };
    // The punched surfaces, in the page's own colours (read from the scene's tokens on every build).
    // Until they are set, or if a colour cannot be read, the faces stay solid, without holes. Each
    // face and shade gets its bitmap as its own inline background, never through a custom property: the
    // stage sets --p on the section on every frame, a background that reads a variable is resolved again
    // each time, and every face would be repainted on every frame.
    const surfaces = sheets.flatMap((sheet) => [...sheet.querySelectorAll(':scope > .hs-face')].flatMap((face) => {
      const front = face.classList.contains('hs-face--front');
      return [[face, front ? '--hs-paper' : '--hs-ink'], [face.querySelector(':scope > .hs-shade'), front ? '--hs-shade-paper' : '--hs-shade']];
    })).filter(([el]) => el);
    let cutW = 0;
    const unpunch = () => { for (const [el] of surfaces) el.style.removeProperty('background'); cutW = 0; };
    const punch = () => {
      const w = sheets[0].offsetWidth, h = sheets[0].offsetHeight;
      if (!w || !h) return;
      const probe = make('span', 'hs-probe', stage);
      probe.style.display = 'none';
      const pics = {};
      for (const token of ['--hs-paper', '--hs-ink', '--hs-shade-paper', '--hs-shade']) {
        probe.style.color = `var(${token})`;
        const rgb = rgbOf(getComputedStyle(probe).color);
        pics[token] = rgb && punched(rgb, w, h);
      }
      probe.remove();
      if (Object.values(pics).some((p) => !p)) return; // a colour this browser cannot read: solid faces
      for (const [el, token] of surfaces) el.style.background = `${pics[token]} 0 0 / 100% 100% no-repeat`;
      cutW = w;
    };
    slots.forEach((s, i) => s.style.setProperty('--i', i));
    if (N <= 4) root.style.setProperty('--n', N);
    root.querySelectorAll('img').forEach((img) => { if (img.decode) img.decode().catch(() => {}); }); // decoded before they move

    const o = {
      deck: opt(opts.deck, 1, 0, 1),
      stagger: opt(opts.stagger, N > 3 ? 0.12 : 0.14, 0.08, 0.18),
      wobble: opt(opts.wobble, 7, 0, 8),
      lean: opt(opts.lean, 16, 0, 18),
      lift: opt(opts.lift, 120, 0, 120),
    };
    const hold = opt(opts.hold, 0.6 + 0.5 * Math.min(N, 4), 1.2, 4);
    const scrub = typeof opts.scrub === 'boolean' ? opts.scrub : typeof opts.scrub === 'number' ? clamp(opts.scrub, 0.2, 0.6) : (Stage.lenis ? true : 0.5);

    // Turning: |sin(rotationY)| shades both faces, so the edge-on moment reads as paper, not a stray
    // line. Which face shows is left to backface-visibility alone: the browser knows where the eye is,
    // so nothing here can make a ticket vanish. data-face only takes the pointer off the face that is
    // turned away. Everything is read live from the sheet, never from a cache, and turn() runs on every
    // timeline update and after every refresh (a refresh renders the timeline with its events muted).
    const turn = (i) => {
      const sheet = sheets[i];
      const ry = gsap.getProperty(sheet, 'rotationY') * RAD;
      const s = Math.round(Math.abs(Math.sin(ry)) * SHADE * 1000) / 1000;
      const sh = shades[i];
      if (sh.last !== s) { sh.last = s; for (const el of sh) el.style.opacity = s; }
      const face = Math.cos(ry) >= 0 ? 'front' : 'back';
      if (sheet.dataset.face !== face) sheet.dataset.face = face;
    };
    const untouched = () => {
      sheets.forEach((sheet, i) => { delete sheet.dataset.face; shades[i].last = 0; for (const el of shades[i]) el.style.opacity = ''; });
      unpunch();
      row.removeAttribute('data-shut');
      root.classList.remove('hs-moving');
    };

    // Is there room for the deal: one row, every ticket MIN_W or wider once the band over the row (the
    // stepped-back headline and the line over the row) and the fine print under it have their room. The
    // CSS works the width out (--hs-deal-w); the gauge reads it.
    const roomy = () => {
      const W = window.innerWidth, H = window.innerHeight;
      if (N > 4 || W < 768 || H < 560) return false;
      return gauge.getBoundingClientRect().width >= MIN_W;
    };
    // where an element sits in the stage, untransformed (offsets ignore transforms, so this holds mid-tween)
    const topIn = (el) => { let y = 0; for (let n = el; n && n !== stage; n = n.offsetParent) y += n.offsetTop; return y; };

    // the deal currently running (null in the flow), for the keyboard guard below
    let current = null;
    row.addEventListener('focusin', () => {
      if (!current || !root.classList.contains('is-live')) return;
      const { tl, open } = current, st = tl.scrollTrigger;
      if (!st || tl.progress() >= open) return;
      const y = st.start + 0.94 * (st.end - st.start);   // a keyboard user lands on the finished row
      if (Stage.lenis) Stage.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
    });

    // ---- the deal: held stage, desktop ----
    function deal(tl, { stage: st }) {
      root.classList.remove('hs-flow');
      untouched();
      // the headline's line count at its live size decides how tall the band over the row is (CSS)
      if (title) {
        const lh = parseFloat(getComputedStyle(title).lineHeight) || 0.92 * parseFloat(getComputedStyle(title).fontSize);
        root.style.setProperty('--hs-title-lines', lh > 0 ? Math.max(1, Math.round(title.offsetHeight / lh)) : 2);
      }
      punch();
      asPrint(true);
      // the last ticket lands at LAND; the first no sooner than 0.40, so the deck has time to rise
      const first = Math.max(0.40, LAND - (N - 1) * o.stagger);
      const ends = sheets.map((_, i) => first + i * o.stagger);
      const last = ends[N - 1];
      const mid = (N - 1) / 2;
      // slot pitch, measured whenever the timeline is (re)built or refreshed
      const pitch = () => (N > 1 ? slots[1].offsetLeft - slots[0].offsetLeft : 0);
      // the deck's top edge starts 40px below the fold, plus what the wobble raises its corners by
      const below = () => st.clientHeight - topIn(row) + 40 + (sheets[0].offsetWidth / 2) * Math.sin(o.wobble * RAD);

      tl.fromTo(wash, { opacity: 0 }, { opacity: 1, duration: last - DECK }, DECK);
      if (sub) tl.fromTo(sub, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -12, ease: 'power1.in', duration: 0.10 }, STEP[0]);

      sheets.forEach((sheet, i) => {
        const end = ends[i];
        const fs = DECK + 0.35 * (end - DECK), fd = end - 0.04 - fs; // turn starts with a quarter showing, ends before landing
        tl.fromTo(sheet,
          { x: () => (mid - i) * pitch() * o.deck, y: below, rotation: WOBBLE[i % 4] * o.wobble, rotationX: o.lean, transformOrigin: '50% 50%' },
          { x: 0, y: 0, rotation: 0, rotationX: 0, ease: 'power1.inOut', duration: end - DECK }, DECK);
        tl.fromTo(sheet, { rotationY: 180 }, { rotationY: 0, ease: 'power2.inOut', duration: fd }, fs);
        tl.fromTo(sheet, { z: 0 }, { z: o.lift, ease: 'sine.out', duration: fd / 2 }, fs);
        tl.to(sheet, { z: 0, ease: 'sine.in', duration: fd / 2 }, fs + fd / 2);
      });

      // The headline steps back before the deck reaches it: from 0.03 to 0.30 it rises and shrinks (a 2D
      // scale about its bottom edge, so the words stay sharp) until its bottom edge sits GAP above the line
      // over the row, at --hs-title-end. The deck is still below the fold when it starts, and the band
      // over the row is reserved in the CSS, so no ticket ever passes over the headline, and the finished
      // row keeps it as its heading.
      if (title) {
        gsap.set(title, { transformOrigin: '50% 100%' });
        const k = () => {
          const end = parseFloat(getComputedStyle(gauge).fontSize), now = parseFloat(getComputedStyle(title).fontSize);
          return end > 0 && now > 0 ? Math.min(1, end / now) : 0.4;
        };
        const y = () => topIn(lead || row) - GAP - (topIn(title) + title.offsetHeight);
        tl.fromTo(title, { y: 0, scale: 1 }, { y, scale: k, ease: 'power2.inOut', duration: STEP[1] }, STEP[0]);
      }
      if (lead) tl.fromTo(lead, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.08 }, last - 0.04);
      if (note) tl.fromTo(note, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.08 }, last);
      tl.set({}, {}, 1);

      // the row takes the pointer only once the last ticket is down; the headline is its own layer
      // (will-change) only while it steps back, and painted flat and sharp into the stage the rest of the time
      const open = last + 0.02;
      let shut = null, moving = null;
      const update = () => {
        for (let i = 0; i < N; i++) turn(i);
        const p = tl.progress();
        const s = p < open;
        if (s !== shut) { shut = s; if (s) row.setAttribute('data-shut', ''); else row.removeAttribute('data-shut'); }
        const m = p > 0.005 && p < STEP[0] + STEP[1] + 0.02;
        if (m !== moving) { moving = m; root.classList.toggle('hs-moving', m); }
      };
      tl.eventCallback('onUpdate', update);
      update();
      current = { tl, open, update };
    }

    // ---- the flow: no held stage; each ticket turns over as it scrolls into view ----
    function flow(tl, { phone }) {
      root.classList.add('hs-flow');
      untouched();
      punch();
      asPrint(false);
      current = null;
      const colOf = (i) => { let c = 0; for (let k = i - 1; k >= 0 && slots[k].offsetTop === slots[i].offsetTop; k--) c++; return c; };
      sheets.forEach((sheet, i) => {
        const d = Math.min(0.3, colOf(i) * 0.1); // tickets side by side still land left to right
        const len = 1 - d;
        const t = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: slots[i], start: 'top 96%', end: 'top 38%', scrub: phone || scrub === true ? 0.4 : scrub, invalidateOnRefresh: true },
        });
        t.fromTo(sheet, { y: 140, rotation: WOBBLE[i % 4] * Math.min(o.wobble, 5), rotationX: 14, transformOrigin: '50% 50%' },
          { y: 0, rotation: 0, rotationX: 0, ease: 'power1.inOut', duration: len }, d)
          .fromTo(sheet, { rotationY: 180 }, { rotationY: 0, ease: 'power2.inOut', duration: 0.65 * len }, d + 0.25 * len)
          .fromTo(sheet, { z: 0 }, { z: Math.min(o.lift, 60), ease: 'sine.out', duration: 0.325 * len }, d + 0.25 * len)
          .to(sheet, { z: 0, ease: 'sine.in', duration: 0.325 * len }, d + 0.575 * len);
        // the fine print sits under the last row, where its tickets rise from: it comes in once they are down
        if (note && i === N - 1) t.fromTo(note, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.9);
        t.set({}, {}, 1);
        t.eventCallback('onUpdate', () => turn(i));
        turn(i);
      });
    }

    // A refresh (resize, fonts, pictures, another scene) renders every timeline at its new progress
    // with events muted, so the shades and data-face are brought up to date after each one; and when
    // the tickets changed size, their punched surfaces are drawn again at the new size.
    const refreshed = () => {
      if (!root.classList.contains('is-live')) return;
      if (current) current.update(); else for (let i = 0; i < N; i++) turn(i);
      if (Math.abs(sheets[0].offsetWidth - cutW) > 2) punch();
    };

    let mm = null, dealing = null, timer = 0;
    const start = () => {
      mm = Stage.scene(root, {
        hold,
        scrub,
        phone: opts.phone === 'rest' ? 'rest' : { hold: 1, build: flow },
        build: (tl, ctx) => { dealing = roomy(); return dealing ? deal(tl, ctx) : flow(tl, ctx); },
      });
    };
    const stop = () => {
      if (!mm) return;
      const k = Stage.scenes.indexOf(mm);
      if (k > -1) Stage.scenes.splice(k, 1);
      mm.revert();
      mm = null;
      current = null;
      untouched();
    };
    // The stage only switches at the phone width; this scene also switches between the deal and the
    // flow when a resize changes whether the row fits.
    const resized = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!mm || Stage.phone || !root.classList.contains('is-live') || roomy() === dealing) return;
        stop();
        start();
        ScrollTrigger.refresh();
      }, 150);
    };
    start();
    if (mm) {
      window.addEventListener('resize', resized);
      ScrollTrigger.addEventListener('refresh', refreshed);
    }
    // one stable handle for the life of the section, whatever the resizes rebuild underneath it
    return {
      get mm() { return mm; },
      revert() {
        clearTimeout(timer);
        window.removeEventListener('resize', resized);
        if (window.ScrollTrigger) ScrollTrigger.removeEventListener('refresh', refreshed);
        stop();
        asPrint(false);
        root.classList.remove('hs-flow', 'is-live', 'is-rest');
      },
    };
  };
})();
