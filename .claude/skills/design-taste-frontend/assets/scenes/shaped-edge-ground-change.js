// tasteskill / scenes / shaped-edge-ground-change.js — the sky's own colour rises as an arch and becomes
// the ground of the next chapter.
//
// One photograph with a wide, even sky holds the stage and zooms slowly towards a point low in the frame.
// A field painted in exactly the sky's colour climbs over it as a full-width elliptical arch, 1:1 with the
// scroll, so it reads as the sky itself coming loose. A short heading set on the arch's curve spreads
// word by word as it climbs; a statement rides in the arch below it. When the arch has passed the top of
// the screen the field is the flat ground of the next chapter: its title turns in letter by letter and a
// small picture opens under it. The next section continues on the same ground with no seam.
//
// Needs gsap + ScrollTrigger (no SplitText), stage.js and shaped-edge-ground-change.css. Use it as a
// chapter divider for architecture, places, travel or property, no more than two or three times a page,
// each time on a different photograph and ground colour.
//
// DOM (the CSS file draws the finished composition from the same markup):
//   <section class="scene seg" data-scene="shaped-edge-ground-change" data-options='{}'
//            style="--ground:#cddce3; --ink:#13233a" aria-labelledby="seg-hero-title">
//     <div class="scene-stage">
//       <figure class="seg-photo">
//         <picture>                                       (optional: a 2:3 crop for phones)
//           <source media="(max-width: 767px)" srcset="portrait 2:3, 1200-1600 wide" sizes="150vw">
//           <img class="seg-photo__img" src srcset sizes="(max-width: 767px) 150vw, 125vw"
//                width height alt="what the place is">   3:2 or 16:10, 3000px+ wide, even sky in the top third
//         </picture>
//       </figure>
//       <div class="seg-hero">                              in the sky, in --ink (or on a band: hero option)
//         <h2 class="seg-hero__title" id="seg-hero-title">3-6 words, two lines</h2>   (a headline that
//                                                         would take three lines is set smaller, to 72% at most)
//         <p class="seg-hero__lede">14 words or fewer</p>
//       </div>
//       <div class="seg-ground">                            ONE element: elliptical cap + flat body
//         <div class="seg-cap">
//           <h3 class="seg-arc-label">4 words (6 at most on desktop, 34 characters)</h3>
//           <svg class="seg-arc" aria-hidden="true" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMax meet">
//             <path id="seg-arc-a" d="M101 720 A619 619 0 0 1 1339 720" fill="none"/>
//             <text class="seg-arc__static" text-anchor="middle"><textPath href="#seg-arc-a" startOffset="50%">the same words</textPath></text>
//           </svg>            (with script this SVG is hidden and the script sets the heading on the curve
//                             letter by letter in a <div class="seg-arc seg-arc-words"> beside it, moved by
//                             transform only; style the words through .seg-arc as usual)
//                     This static path is what a page with no script draws. Its id must be unique on the page:
//                     when the scene is used two or three times, give each instance its own id (seg-arc-a,
//                     seg-arc-b...) and point that instance's textPath href at it.
//           <div class="seg-crest">
//             <img class="seg-crest__mark" src alt="">      optional emblem, 40-56px
//             <p class="seg-crest__caption">a statement, 6-10 words</p>   set in the display face, two lines
//           </div>
//         </div>
//         <div class="seg-body">
//           <h3 class="seg-title">1-3 words, 16 characters</h3>   (split into letters by the script)
//           <figure class="seg-inset"><img class="seg-inset__img" src alt width height></figure>   2:1, 1200x600+
//         </div>
//       </div>
//     </div>
//   </section>
//   <section style="background: var(--ground)">…</section>   the next section, same ground, no margin
//
// Options (data-options JSON; defaults, ranges):
//   hero          "sky"            "sky": the headline is set in --ink straight on the photograph's sky, with
//                                  no scrim. Only for a photograph with open, even sky behind the headline
//                                  (no cloud texture, no ridge line, no subject reaching up into it).
//                                  | "band": a flat translucent fill (rgb(8 14 24 / .45)) sits behind the
//                                  headline block and the type turns white; use it for any photograph
//                                  whose top-left is busy. (The class seg--band on the section does the
//                                  same and also holds without script.)
//   zoom          1.5    1.2-1.8   end scale of the photograph (it starts at 1.06; linear, done at 0.88)
//   phoneZoom     1.3    1.1-1.5   (starts at 1.04)
//   fade          false            the photograph also fades into the ground while it zooms (dusk or
//                                  interior chapters): opacity 1 -> 0.7 by 0.55 -> 0 by 0.86
//   arc           "spread"         "spread": the words open from 0.28em apart to the full spread as the
//                                  arch climbs | "static": they hold a mid spread
//   spread        0.10   0.04-0.12 the widest word gap, as a share of the width (capped so the words stay
//                                  in the middle 62% of the curve and never tilt past about 56 degrees)
//   phoneSpread   0.08   0.04-0.10
//   chrome        ""               a selector for a fixed header that sits over the scene. While the
//                                  photograph is under it, the scene sets --chrome-ink on it to
//   chromeLight   "#fff"           this colour, and removes it the moment the arch's edge passes under the
//                                  header (the header uses color: var(--chrome-ink, var(--ink))). Leave it
//                                  empty when the sky under the header is pale: --ink reads there anyway.
//                                  The flip is timed at the centre of the header's first child (its logo);
//   chromeX       null   0-100     or at this many percent across the header, for a centred logo.
//                                  (With no script nothing flips, so give a fixed header a solid bar then.)
//   scrub         0.6 | true       seconds of catch-up; true (locked) is the default when Lenis is smoothing
//                                  and on touch screens
//   phone         "same"           "same" | "rest" (the phone gets the finished composition). A heading of
//                                  more than four words always rests on a phone.
//
// The hold is not an option: it is 1.25 * (1 + C/H) screens (2.25 at C = 0.8H), set in the CSS, so the
// arch travels exactly as far as the page scrolls. The arch height C is --seg-cap in the CSS.
//
// Timeline (fractions of the hold): photo zoom 0-0.88; headline out 0.06-0.18; ground climbs 0.08-0.88;
// words spread 0.10-0.56; title letters 0.60-0.76; inset opens 0.78-0.94; settled 0.94-1.
//
// Colour: --ground MUST be sampled from the final photograph (median of a 5% patch in the top third),
// never chosen by eye. --ink is whichever of a deep near-black or a near-white of the same hue reads at
// 7:1 or better on it (a deep sky makes a dark chapter with pale type).
//
// The photograph decides whether the move is seen. Where the arch crosses sky of its own colour it
// vanishes, by design: it reads as the sky coming loose. So the shape is only drawn by what it covers:
// pick a photograph whose subject (a range, a skyline, terraces, a shoreline) runs edge to edge across
// the lower half or more, with the open sky above it. A small central subject (one tower, one peak) on
// a big sky leaves the arch's flanks on sky, and from a third of the way in nothing of the shape is
// left. A sky that deepens towards the top (sample it in the top third) is fine: the arch matches it
// where it ends and reads as a darker dome against the paler sky near the horizon.
//
// Screens under 560px tall get the finished composition.
(() => {
  const ID = 'shaped-edge-ground-change';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => { const n = typeof v === 'string' && v.trim() !== '' ? +v : v; return typeof n === 'number' && isFinite(n) ? clamp(n, a, b) : d; };
  // depth of the arch's edge below its crown at x, for an arch W wide and C tall
  const edgeDepth = (x, W, C) => { const u = clamp((x - W / 2) / (W / 2), -1, 1); return C * (1 - Math.sqrt(1 - u * u)); };

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const o = {
      hero: opts.hero === 'band' ? 'band' : 'sky',
      zoom: num(opts.zoom, 1.5, 1.2, 1.8),
      phoneZoom: num(opts.phoneZoom, 1.3, 1.1, 1.5),
      fade: opts.fade === true,
      arc: opts.arc === 'static' ? 'static' : 'spread',
      spread: num(opts.spread, 0.1, 0.04, 0.12),
      phoneSpread: num(opts.phoneSpread, 0.08, 0.04, 0.1),
      chrome: typeof opts.chrome === 'string' ? opts.chrome.trim() : '',
      chromeLight: typeof opts.chromeLight === 'string' && opts.chromeLight.trim() ? opts.chromeLight.trim() : '#fff',
      chromeX: opts.chromeX == null || opts.chromeX === '' ? null : num(opts.chromeX, null, 0, 100),
      scrub: opts.scrub === true ? true : typeof opts.scrub === 'number' ? clamp(opts.scrub, 0, 2) : null,
      phone: opts.phone === 'rest' ? 'rest' : 'same',
    };
    const $ = (s) => root.querySelector(s);
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const photo = $('.seg-photo'), img = $('.seg-photo__img'), hero = $('.seg-hero');
    const ground = $('.seg-ground'), cap = $('.seg-cap'), label = $('.seg-arc-label'), svg = $('.seg-arc');
    const title = $('.seg-title'), inset = $('.seg-inset'), insetImg = $('.seg-inset__img');
    const chromeEl = o.chrome ? document.querySelector(o.chrome) : null;
    if (!stage || !photo || !img || !ground || !cap) {
      console.warn(`${ID}: needs .scene-stage, .seg-photo with .seg-photo__img, .seg-ground and .seg-cap`);
      return Stage.scene(root, { build: null });
    }
    if (o.hero === 'band') root.classList.add('seg--band');

    // Pictures decode before they move: the photograph is on screen from the first frame and the inset
    // opens late from a closed clip, so without this its first paint (and decode) lands mid-scrub.
    for (const im of [img, insetImg]) if (im && im.decode) im.decode().catch(() => {});

    // The headline holds two lines. In a face wider than the condensed default a six-word headline can
    // take three, so it is set smaller, in steps, down to 72% of the CSS size (fit after fonts load and
    // whenever the arch is re-measured).
    const heroTitle = hero ? hero.querySelector('.seg-hero__title') : null;
    const fitHero = () => {
      if (!heroTitle || !heroTitle.offsetWidth) return;
      heroTitle.style.removeProperty('font-size');
      const cs = getComputedStyle(heroTitle);
      const base = parseFloat(cs.fontSize) || 16;
      const lh = (fs) => { const v = parseFloat(getComputedStyle(heroTitle).lineHeight); return isFinite(v) && v > 0 ? v : fs; };
      let fs = base;
      for (let k = 0; k < 8 && heroTitle.offsetHeight > 2.5 * lh(fs) && fs > 0.72 * base; k++) {
        fs = Math.max(0.72 * base, fs * 0.94);
        heroTitle.style.fontSize = fs.toFixed(1) + 'px';
      }
    };

    // ---- the heading on the curve. The words spread along the arch every frame from 0.10 to 0.56, so
    // they must move by transform only: each letter is its own element, placed on the curve the way
    // a textPath places a glyph (its middle on the path, its baseline on the path, turned to the
    // tangent there). Moving a letter is then a compositor job: no text layout, no repaint of the
    // ground. Letter positions inside each word are measured from the word set whole, so kerning holds.
    // The static SVG in the markup stays for a page with no script; with script it is hidden.
    const words = label ? label.textContent.trim().split(/\s+/).filter(Boolean) : [];
    const arc = { box: null, words: [], probe: null, lut: null, geo: null, L: 0, sum: 0, base: 0, gStart: 0, gEnd: 0, g: -1, ok: false, fits: true };
    if (svg && words.length) {
      arc.box = document.createElement('div');
      arc.box.className = 'seg-arc seg-arc-words';
      arc.box.setAttribute('aria-hidden', 'true');
      for (const w of words) {
        const m = document.createElement('span'); // the word set whole, measured, never seen
        m.className = 'seg-arc__measure';
        m.textContent = w;
        arc.box.appendChild(m);
        let at = 0; // offsets in the text node are UTF-16 units, letters are code points
        const chars = [...w].map((ch) => {
          const c = document.createElement('span');
          c.className = 'seg-arc__char';
          c.textContent = ch;
          arc.box.appendChild(c);
          const it = { el: c, at, len: ch.length, c: 0, w: 0 };
          at += ch.length;
          return it;
        });
        arc.words.push({ m, chars, width: 0 });
      }
      arc.probe = document.createElement('span'); // finds the baseline inside a letter's box
      arc.probe.className = 'seg-arc__measure';
      arc.probe.innerHTML = 'H<i class="seg-arc__base"></i>';
      arc.box.appendChild(arc.probe);
      svg.after(arc.box);
      root.classList.add('seg--chars');
    }
    // The curve: the upper half of an ellipse centred on the cap's bottom middle, inset by i (rx = W/2 - i,
    // ry = C - i). A table of arc length against angle turns "s along the curve" into a point and a
    // tangent with no DOM call, so a frame costs only arithmetic and transforms.
    const N = 720;
    const pointAt = (s) => {
      const { lut, geo } = arc;
      s = clamp(s, 0, arc.L);
      let lo = 0, hi = N;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (lut[mid] <= s) lo = mid; else hi = mid; }
      const f = lut[hi] > lut[lo] ? (s - lut[lo]) / (lut[hi] - lut[lo]) : 0;
      const th = Math.PI * (1 - (lo + f) / N);
      const sin = Math.sin(th), cos = Math.cos(th);
      return { x: geo.cx + geo.rx * cos, y: geo.cy - geo.ry * sin, a: (Math.atan2(geo.ry * cos, geo.rx * sin) * 180) / Math.PI };
    };
    // W, C, the curve, its length, the letter positions and the widest gap: all depend on the box and
    // the font. The words must stay in the middle 62% of the curve (no tilt past about 56 degrees). A
    // heading too long for that at the CSS size (a wide display face, a 30-character heading) is set
    // smaller, down to 65% of it; only past that is it set straight.
    arc.measure = () => {
      arc.ok = false;
      if (!arc.words.length) return false;
      const W = cap.clientWidth, C = cap.clientHeight;
      if (!W || !C) return false;
      const i = clamp(0.14 * C, 44, 110); // baseline inset: glyph tops stay ~0.4em inside the edge
      arc.geo = { cx: W / 2, cy: C, rx: W / 2 - i, ry: C - i };
      const lut = new Float64Array(N + 1);
      let px = arc.geo.cx - arc.geo.rx, py = C;
      for (let k = 1; k <= N; k++) {
        const th = Math.PI * (1 - k / N);
        const x = arc.geo.cx + arc.geo.rx * Math.cos(th), y = arc.geo.cy - arc.geo.ry * Math.sin(th);
        lut[k] = lut[k - 1] + Math.hypot(x - px, y - py);
        px = x; py = y;
      }
      arc.lut = lut;
      arc.L = lut[N];
      // The words keep to the middle of the curve: their ends within its middle 62%, and no letter
      // where the curve turns steeper than 56 degrees (on a phone the arch is taller than it is wide,
      // so that comes sooner than the 62%).
      let k0 = 0;
      for (; k0 < N / 2; k0++) {
        const th = Math.PI * (1 - k0 / N);
        if (Math.abs(Math.atan2(arc.geo.ry * Math.cos(th), arc.geo.rx * Math.sin(th))) <= (56 * Math.PI) / 180) break;
      }
      const n = arc.words.length;
      let win = 0.62 * arc.L;
      const fs = () => parseFloat(getComputedStyle(arc.box).fontSize) || 16;
      const read = () => {
        const range = document.createRange();
        for (const wd of arc.words) {
          const node = wd.m.firstChild, r0 = wd.m.getBoundingClientRect();
          wd.width = r0.width;
          wd.chars.forEach((ch) => {
            range.setStart(node, ch.at); range.setEnd(node, ch.at + ch.len);
            const r = range.getBoundingClientRect();
            ch.w = r.width; ch.c = r.left - r0.left + r.width / 2;
          });
        }
        arc.base = arc.probe.lastChild.offsetTop;
        arc.sum = arc.words.reduce((a, wd) => a + wd.width, 0);
        arc.gStart = 0.28 * fs();
        // the outermost letters' middles may reach the 56-degree points, their ends a little past
        const first = arc.words[0].chars[0], lw = arc.words[n - 1], last = lw.chars[lw.chars.length - 1];
        win = Math.min(0.62 * arc.L, arc.L - 2 * lut[k0] + (first ? first.c : 0) + (last ? lw.width - last.c : 0));
        return arc.sum + (n - 1) * arc.gStart;
      };
      arc.box.style.removeProperty('font-size');
      let need = read();
      arc.fits = need <= win;
      if (!arc.fits && need > 0) {
        const k = (0.94 * win) / need;
        if (k >= 0.65) {
          arc.box.style.fontSize = (k * fs()).toFixed(2) + 'px';
          need = read();
          arc.fits = need <= win;
        }
      }
      // each letter turns about the middle of its baseline, the point that sits on the curve
      for (const wd of arc.words) for (const ch of wd.chars) ch.el.style.transformOrigin = `${(ch.w / 2).toFixed(2)}px ${arc.base.toFixed(2)}px`;
      const room = n > 1 ? (win - arc.sum) / (n - 1) : 0;
      arc.gEnd = n > 1 ? Math.max(arc.gStart, Math.min((Stage.phone ? o.phoneSpread : o.spread) * W, room)) : 0;
      arc.g = -1;
      arc.ok = arc.L > 0 && arc.sum > 0;
      return arc.ok;
    };
    arc.layout = (g) => {
      if (!arc.ok || Math.abs(g - arc.g) < 0.05) return;
      arc.g = g;
      const n = arc.words.length;
      let s = arc.L / 2 - (arc.sum + (n - 1) * g) / 2;
      for (const wd of arc.words) {
        for (const ch of wd.chars) {
          const p = pointAt(s + ch.c);
          ch.el.style.transform = `translate(${(p.x - ch.w / 2).toFixed(2)}px, ${(p.y - arc.base).toFixed(2)}px) rotate(${p.a.toFixed(2)}deg)`;
        }
        s += wd.width + g;
      }
      root.classList.add('seg--arc-set');
    };

    let liveTl = null; // the scrubbed timeline while the scene runs; null in the finished composition
    const gapNow = () => {
      if (!liveTl || o.arc === 'static') return Math.max(arc.gStart, 0.5 * arc.gEnd);
      return arc.gStart + (arc.gEnd - arc.gStart) * clamp((liveTl.progress() - 0.1) / 0.46, 0, 1);
    };
    // Measure with the letters' box shown (a display:none box measures nothing), then decide: on the
    // curve, or set straight when the words cannot fit on it.
    const relayout = () => {
      fitHero();
      if (!arc.words.length) { root.classList.add('seg--flat'); return; }
      root.classList.remove('seg--flat');
      const ok = arc.measure();
      const flat = ok && (!arc.fits || (Stage.phone && words.length > 4));
      root.classList.toggle('seg--flat', flat);
      if (ok && !flat) arc.layout(gapNow());
    };
    if (window.ResizeObserver) {
      let raf = 0;
      new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(relayout); }).observe(cap);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout).catch(() => {});

    // ---- the chapter title, split into letters (words kept whole so a phone wraps between them)
    if (title && !title.dataset.segSplit) {
      const text = title.textContent.trim().replace(/\s+/g, ' ');
      title.setAttribute('aria-label', text);
      title.textContent = '';
      text.split(' ').forEach((w, k) => {
        if (k) title.appendChild(document.createTextNode(' '));
        const ws = document.createElement('span');
        ws.className = 'seg-title__word';
        ws.setAttribute('aria-hidden', 'true');
        for (const ch of w) { const c = document.createElement('span'); c.className = 'seg-title__char'; c.textContent = ch; ws.appendChild(c); }
        title.appendChild(ws);
      });
      title.dataset.segSplit = '1';
    }
    const chars = title ? [...title.querySelectorAll('.seg-title__char')] : [];

    // ---- optional fixed header: light while the photograph is under it, back to ink when the edge passes
    const chromeOff = () => { if (chromeEl) chromeEl.style.removeProperty('--chrome-ink'); };
    const chromeTrigger = (live) => {
      if (!chromeEl || !window.ScrollTrigger) return;
      // the point the flip is timed at: chromeX percent across the header, else the centre of its
      // first child (the logo), else a little in from its left end
      const point = () => {
        const r = chromeEl.getBoundingClientRect();
        if (o.chromeX != null) return { x: r.left + (r.width * o.chromeX) / 100, y: r.top + r.height / 2 };
        const k = chromeEl.firstElementChild, b = k && k.getBoundingClientRect();
        if (b && b.width) return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
        return { x: r.left + Math.min(72, r.width / 2), y: r.top + r.height / 2 };
      };
      ScrollTrigger.create({
        trigger: root,
        start: () => `top ${Math.round(point().y)}px`,
        end: () => {
          const pt = point(), W = cap.clientWidth, C = cap.clientHeight, H = stage.clientHeight;
          if (live) {
            const top = root.getBoundingClientRect().top + window.scrollY;
            const y = pt.y - edgeDepth(pt.x, W, C); // where the ground's top is when its edge meets the point
            const t = clamp(0.08 + 0.8 * (H - y) / (H + C), 0, 1);
            return top + t * Math.max(1, root.offsetHeight - window.innerHeight);
          }
          return ground.getBoundingClientRect().top + window.scrollY + edgeDepth(pt.x, W, C) - pt.y;
        },
        onToggle: (self) => { if (self.isActive) chromeEl.style.setProperty('--chrome-ink', o.chromeLight); else chromeOff(); },
      });
    };

    function build(tl, ctx) {
      const { phone } = ctx;
      liveTl = tl;
      chromeOff();
      const H = () => stage.clientHeight || window.innerHeight;
      const C = () => cap.clientHeight;

      // 1. the photograph zooms, linear, towards a point low in the frame; finished as the ground covers it
      tl.fromTo(img, { scale: phone ? 1.04 : 1.06 }, { scale: phone ? o.phoneZoom : o.zoom, duration: 0.88 }, 0);
      if (o.fade) {
        tl.fromTo(img, { opacity: 1 }, { opacity: 0.7, duration: 0.55, ease: 'power2.in' }, 0)
          .to(img, { opacity: 0, duration: 0.31, ease: 'power2.in' }, 0.55);
      }
      // 2. the headline leaves before the arch's flank reaches it
      if (hero) tl.fromTo(hero, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: () => -0.06 * H(), duration: phone ? 0.1 : 0.12, ease: 'power1.in' }, 0.06);
      // 3. the ground climbs from below the stage until its body fills it: H + C of travel over
      //    0.8 * hold * H of scroll, which the CSS height makes equal
      tl.fromTo(ground, { y: () => H() }, { y: () => -C(), duration: 0.8 }, 0.08);
      // 4. the title turns in, letter by letter (one tween per letter, so every letter is set to its
      //    start state the moment the scene is built, not only the first)
      chars.forEach((c, k) => {
        tl.fromTo(c, { rotationY: 90, yPercent: 50, autoAlpha: 0, transformPerspective: 900 },
          { rotationY: 0, yPercent: 0, autoAlpha: 1, duration: 0.08, ease: 'power3.out' }, 0.6 + (chars.length > 1 ? (0.08 * k) / (chars.length - 1) : 0));
      });
      // 5. the inset opens from the bottom while its picture settles
      if (inset) {
        tl.fromTo(inset, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.16, ease: 'power2.out' }, 0.78);
        if (insetImg) tl.fromTo(insetImg, { scale: 1.4, xPercent: 14 }, { scale: 1, xPercent: 0, duration: 0.16, ease: 'power2.out' }, 0.78);
      }
      // 6. the photograph is unseen from here: stop painting it
      tl.set(photo, { autoAlpha: 0 }, 0.885);
      tl.to({}, { duration: 0.06 }, 0.94);

      // the words spread with the timeline (0.10-0.56): driven from its progress, so every render,
      // scrub catch-up and refresh lands on the right spread
      tl.eventCallback('onUpdate', () => arc.layout(gapNow()));
      // re-measure the curve whenever ScrollTrigger refreshes (resize, fonts, pictures)
      ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onRefresh: relayout });
      chromeTrigger(true);
      relayout();
    }

    function rest() {
      liveTl = null;
      chromeOff();
      relayout();
      if (Stage.live) chromeTrigger(false);
    }

    // Screens under 560px tall (a phone on its side) get the finished composition; a heading of more
    // than four words cannot sit on a phone's arch.
    const short = window.matchMedia('(max-height: 559px)');
    const start = () => {
      const H = window.innerHeight || 1, C = cap.clientHeight || 0.8 * H;
      return Stage.scene(root, {
        hold: Math.round(1.25 * (1 + C / H) * 100) / 100, // informational: the CSS sets the height
        // locked to the scroll when Lenis already smooths it, and on touch screens, where the finger's
        // own scroll is smooth and the arch must stay attached to it (1:1 is the point of the move)
        scrub: o.scrub ?? (Stage.lenis || Stage.touch ? true : 0.6),
        build: short.matches ? null : build,
        phone: o.phone === 'rest' || words.length > 4 ? 'rest' : 'same',
        rest,
      });
    };
    // The stage has no way to rebuild one scene with a different plan, so crossing the threshold
    // reverts this scene's matchMedia, takes it off Stage.scenes and starts the scene again.
    let mm = start();
    if (mm && short.addEventListener) {
      short.addEventListener('change', () => {
        if (mm) {
          mm.revert();
          const k = Stage.scenes.indexOf(mm);
          if (k >= 0) Stage.scenes.splice(k, 1);
        }
        mm = start();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    }
    return mm;
  };
})();
