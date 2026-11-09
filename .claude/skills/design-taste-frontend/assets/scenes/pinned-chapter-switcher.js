// tasteskill / scenes / pinned-chapter-switcher.js — one held stage plays 3 to 6 picture chapters. The
// scroll drives a hard-edged wipe between each pair of pictures, and every wipe takes its own direction
// (from the right, out of the bottom-right corner, then a sheet rising from the bottom). The incoming
// picture settles from a slight scale as its seam lands; the outgoing one is pushed aside and darkens, so
// the new sheet reads as lying on top. Exactly at the half-and-half frame of each wipe the title and text
// swap through masks (timed, not scrubbed) and arrive the way the picture did: sliding in from the side the
// seam came from, bottom line first with a rising sheet. The count rolls ("2 of 4") and a progress bar per
// chapter fills with the scroll, so the reader always knows where they are and how much is left.
//
// Use it for feature chapters, before/after stories, project indexes or product variants where every
// chapter has a different picture and different words. Not for a run of similar photos. The half-and-half
// frame is the moment this scene exists for: shoot or pick the pictures as one series (the same horizon
// height, the same subject in different states, matched framing) with a hard change of colour between
// neighbours (blue morning, white noon, orange evening, deep blue night), so every seam says something.
//
// The pictures stay clean above their horizon. Every word (title, text, heading, count and index) sits low
// on the stage, on a flat band of scrim whose top edge lies on the picture's horizon, so the step from
// clear sky to darker sea hides in a line the picture already has. The finished composition does the same
// when a script runs; with no script the scrim covers each whole picture.
//
// DOM (the scene builds the count and the progress bars itself; it builds the index when it is missing;
// it wraps each picture in a <div class="chs-move">, the one box the wipes scale and drift, which also
// carries the band, so a picture and its band are one layer)
// <section class="scene" data-scene="pinned-chapter-switcher" aria-labelledby="route-title" data-options='{}'>
//   <div class="scene-stage">
//     <header class="chs-head"><h2 class="chs-heading" id="route-title">Section heading, 2-5 words</h2></header>
//     <nav class="chs-index" aria-label="Chapters"><ol>
//       <li class="chs-tab"><a href="#day-1">Tab name</a></li>        one per chapter, 14 characters or fewer
//     </ol></nav>
//     <article class="chs-ch" id="day-1" data-name="Tab name" data-horizon=".5" style="--plate-bg:#1f2a30; --scrim:.45">
//       <figure class="chs-plate"><picture>
//         <source media="(max-width: 767px)" srcset="2:5 portrait crops, 450w and 700w" sizes="112vw">
//         <source media="(orientation: portrait) and (max-width: 1023px)" srcset="3:5 crops, 720w and 1080w" sizes="112vw">
//         <img class="chs-img" src="square crop" srcset="1200w, 1700w, 2200w" sizes="112vw" alt="…" width="1700" height="1700">
//       </picture></figure>
//       <figure class="chs-inset">…</figure>       optional, 'pair' only: the small frame's own picture
//       <div class="chs-text"><h3 class="chs-title">Two to five words</h3><p class="chs-body">25 to 40 words.</p></div>
//     </article>
//     … one article per chapter, 3 to 6 (2 to 12 work; the hold is capped at maxHold screens)
//   </div>
// </section>
// Crops: give the scene pictures taller than the screen's shape, so it has room to lift each one to the
// shared horizon. A square (1:1) main crop serves every landscape screen, a 3:5 crop tablets held upright
// (768-1023px portrait) and a 2:5 or 1:3 crop phones. A crop exactly the screen's shape can't be moved: its
// horizon stays where it was shot, and its band is raised to just above the words if it has to be.
// Per article:
//   data-wipe   right | left | corner | corner-tl | rise | drop, overrides the set for the wipe that brings it in
//   data-horizon  0-1, the share of the picture's height where its horizon (or the series' key line) sits.
//               The scene lifts or lowers each such picture inside its crop so the lines meet at one height
//               and every seam continues them, and lays the scrim band from that line down. Without it, the
//               scrim covers the whole picture.
//   data-horizon-at  0.2-0.8, optional: where this picture's line lands on the stage (a share of its
//               height), instead of the shared height. A level seam (rise, drop) never crosses a horizon, so
//               the scene already gives a picture that rises in its own line at 0.58 (0.42 for a drop) when
//               no upright seam follows it (it is the last chapter, or the next wipe is level too): the strip
//               the rising edge uncovers first is then what stands on its horizon, not the ground below it.
//               The line never lands lower than just above the words.
//   --plate-bg  shown while the picture decodes; set it to the picture's dominant dark tone
//   --scrim     the flat black of the band under the horizon (or over the whole picture without
//               data-horizon), default .45 (0-.7). A calm, mid-toned sea reads at .3-.4; a bright or busy one
//               (white water, pale long exposure, sand) needs .45-.55. Check it: every line of body text at
//               4.5:1 or better against the worst frame of its picture, the half-and-half frames included.
//   --scrim-sky the flat black above the horizon, default 0 (0-.3)
//   --obj-pos   object-position of the picture: its x part frames the subject, its y part is overruled where
//               data-horizon is given (and frames the finished composition). It applies to every screen
//               768px and wider, tablets held upright (their 3:5 crop) included
//   --obj-pos-phone  object-position under 768px (default --obj-pos), to keep the subject in the phone crop
//   --inset-pos and --inset-zoom   'pair' without a .chs-inset: the small frame shows this detail of the
//               chapter's own picture (default 50% 50% and 1.7)
// Keep each picture's subject above its horizon or in its right two thirds: the title sits low on the left.
// Footage: <video class="chs-img" muted loop playsinline preload="auto" poster="…"> in place of the
// <picture>. Only the clips whose plates are in view play, and only while the scene is on screen; a clip
// fully covered by the next one is paused and hidden.
//
// Options (data-options JSON), default and range:
//   wipes        'mixed'  the character of the transitions:
//                         'mixed' = full-bleed pictures, wiping in from the right, the corner, then rising;
//                         one wipe name for every chapter ('right' makes a before/after stepper), or a list
//                         such as 'right,drop,corner';
//                         'pair' = two framed pictures per chapter on the stage ground, a big frame whose new
//                         picture is drawn in from the left while a small frame's is drawn in from the right,
//                         crossing; the words sit on the ground beside them, so no scrim. The small frame shows
//                         the article's .chs-inset, or a detail of its own picture. On a phone it is the big
//                         frame alone, with the words under it.
//   length       1        screens of scroll per chapter, 0.8-1.4 (the hold is chapters x length, capped at maxHold)
//   wipe         0.5      share of a chapter spent wiping, 0.35-0.7; 0.6+ lingers on the half-and-half frame,
//                         0.4- reads as an editorial cut
//   horizon      auto     where the data-horizon lines meet, as a share of the stage's height, 0.2-0.8; auto
//                         picks the height that lines up the most pictures, as close to 0.45 as their crops
//                         allow (the words need the lower half)
//   shade        0.25     how dark the outgoing picture gets as it is covered, 0-0.6
//   push         1        strength of the scale and drift on both pictures, 0-1.5
//   index        'tabs'   'tabs' (names over progress bars) | 'bars' (bars only) | 'none'; above 7 chapters 'bars'
//   counter      true     the rolling "2 of 4" beside the heading
//   preroll      true     the first picture settles into its frame while the section scrolls into view
//   scrub        true when smooth scrolling is on, else 0.6 (0.4 on a phone)
//   maxHold      6        ceiling on the screens held, 3-8
//   phone        'same'   'same' (the same scene with phone numbers) | 'rest' (finished composition)
//   phoneLength  0.85     screens per chapter on a phone
//   phoneWipe    0.55     wipe share on a phone
//   phoneMax     6        more chapters than this and the phone shows the finished composition
// A screen under 560px tall or 340px wide (a phone on its side, a window dragged short) shows the
// finished composition at any width, and the scene goes live again when the screen grows back. A turned
// phone or a resized window returns the reader to the same point of the scene.
// Index links scroll to the start of their chapter's rest, never to a seam.
(() => {
  if (!window.Stage) return;
  const ID = 'pinned-chapter-switcher';
  // edges: the inset the incoming picture starts at, as [top, right, bottom, left] shares of its frame
  // in: where its picture starts; out: where the outgoing one is pushed to
  // text: how the words enter with this wipe: y = travel (1 rising, -1 falling), x = xPercent they slide in
  //       from, lead = the end of each line that leads (tilted ahead, on the side the seam came from),
  //       from = which line comes first, slow = duration factor
  // (x is large on purpose: at reading speed a short slide reads as an ordinary masked rise, and the point
  // is that the title visibly arrives from the side the seam came from)
  const WIPES = {
    right: { edges: [0, 0, 0, 1], in: { scale: 1.14, xPercent: 5 }, out: { scale: 1.1, xPercent: -5 },
      text: { y: 1, x: 28, lead: 'right', from: 'start', slow: 1 } },
    left: { edges: [0, 1, 0, 0], in: { scale: 1.14, xPercent: -5 }, out: { scale: 1.1, xPercent: 5 },
      text: { y: 1, x: -28, lead: 'left', from: 'start', slow: 1 } },
    corner: { edges: [1, 0, 0, 1], in: { scale: 1.2, xPercent: 4, yPercent: 4 }, out: { scale: 1.14 },
      text: { y: 1, x: 18, lead: 'right', from: 'end', slow: 1 } },
    'corner-tl': { edges: [0, 1, 1, 0], in: { scale: 1.2, xPercent: -4, yPercent: -4 }, out: { scale: 1.14 },
      text: { y: -1, x: -18, lead: 'left', from: 'start', slow: 1 } },
    rise: { edges: [1, 0, 0, 0], in: { scale: 1.06 }, out: { scale: 1.1, yPercent: -5 },
      text: { y: 1, x: 0, lead: null, from: 'end', slow: 1.1 } },
    drop: { edges: [0, 0, 1, 0], in: { scale: 1.06 }, out: { scale: 1.1, yPercent: 5 },
      text: { y: -1, x: 0, lead: null, from: 'start', slow: 1.1 } },
  };
  const MIXED = ['right', 'corner', 'rise'];
  const HYST = 0.015;            // chapters of hysteresis around a seam before the text commits (~14px)
  // title lines travel this far (% of a line) so they clear masks padded for the tight display leading;
  // a skewed line travels further, by as much as its leading end is lifted, so no end of it shows early
  const TRAVEL = 135, SKEW = 7, TAN = Math.tan((SKEW * Math.PI) / 180);
  // measured once per split (never during a swap, where a read would force a layout mid-frame)
  const measureLift = (el) => {
    let w = el.offsetWidth; // the words' own width, not the line box's
    try { const r = document.createRange(); r.selectNodeContents(el); w = r.getBoundingClientRect().width || w; } catch (e) { /* keep the box */ }
    el.__chsLift = (100 * TAN * w) / Math.max(1, el.offsetHeight);
  };
  const travel = (el, skew) => TRAVEL + (skew ? el.__chsLift || 0 : 0);
  // the old words are gone (opacity 0) before the new first line shows in a mask they share
  const FADE = 0.1, ENTER_AT = 0.025;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => (v === undefined || v === null || v === '' || !Number.isFinite(+v) ? d : clamp(+v, a, b));

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const chapters = [...stage.querySelectorAll(':scope > .chs-ch')];
    const N = chapters.length;
    root.style.setProperty('--n', N);
    if (N < 2) return Stage.scene(root, { build: null, phone: 'rest' });

    const pair = String(opts.wipes || '').trim() === 'pair';
    root.dataset.set = pair ? 'pair' : 'plates';
    chapters.forEach((c, i) => { if (!c.id) c.id = (root.id || 'chapter') + '-' + (i + 1); });
    const plates = chapters.map((c) => c.querySelector('.chs-plate'));
    const imgs = plates.map((p) => (p && p.querySelector('img, video')) || null);
    const texts = chapters.map((c) => c.querySelector('.chs-text'));
    // The mover: one box per frame that holds the picture (its <picture>, clip or img) and, live, its scrim
    // band (the box's ::after, from the horizon down). Scale and drift move this one box, so the picture
    // and its band are painted once into one composited layer and travel together: the band's edge never
    // leaves the horizon, and nothing is painted again while a wipe runs.
    const moverOf = (frame) => {
      if (!frame) return null;
      let m = frame.querySelector(':scope > .chs-move');
      if (m) return m;
      const media = frame.querySelector(':scope > picture, :scope > img, :scope > video');
      if (!media) return null;
      m = document.createElement('div'); m.className = 'chs-move';
      media.before(m); m.append(media);
      return m;
    };
    const movers = plates.map(moverOf);
    const shadeOf = (p) => {
      if (!p) return null;
      let s = p.querySelector(':scope > .chs-shade');
      if (!s) { s = document.createElement('span'); s.className = 'chs-shade'; s.setAttribute('aria-hidden', 'true'); p.appendChild(s); }
      return s;
    };
    const shades = plates.map(shadeOf);

    // 'pair': the small frame of each chapter, the article's own .chs-inset or a detail of its picture
    const insets = chapters.map((c, k) => {
      let f = c.querySelector(':scope > .chs-inset');
      if (f || !pair || !movers[k]) return f;
      const src = movers[k].firstElementChild;
      if (!src) return null;
      let pic;
      if (src.tagName === 'VIDEO') { // a clip's detail is its poster, not a second decoder
        if (!src.poster) return null;
        pic = document.createElement('img'); pic.className = 'chs-img'; pic.src = src.poster;
      } else pic = src.cloneNode(true);
      [pic, ...pic.querySelectorAll('img')].forEach((i) => { if (i.tagName === 'IMG') { i.alt = ''; i.removeAttribute('fetchpriority'); } });
      f = document.createElement('figure');
      f.className = 'chs-inset';
      f.dataset.clone = '';
      f.setAttribute('aria-hidden', 'true');
      f.append(pic);
      plates[k].after(f);
      return f;
    });
    const insetImgs = insets.map((f) => (f && f.querySelector('img, video')) || null);
    const insetMovers = insets.map(moverOf);
    const insetShades = insets.map(shadeOf);
    [...imgs, ...insetImgs].forEach((img) => { if (img && img.decode) img.decode().catch(() => {}); });

    // head: heading plus the rolling count
    const head = stage.querySelector(':scope > .chs-head');
    let count = head && head.querySelector('.chs-count');
    if (count && opts.counter === false) { count.remove(); count = null; }
    if (head && !count && opts.counter !== false) {
      count = document.createElement('p'); count.className = 'chs-count'; head.appendChild(count);
    }
    if (count) {
      count.setAttribute('aria-hidden', 'true');
      count.innerHTML = `<span class="chs-odo"><span class="chs-reel">${chapters.map((_, i) => `<span>${i + 1}</span>`).join('')}</span></span> of ${N}`;
    }
    const reel = count && count.querySelector('.chs-reel');

    // index: names over progress bars, built from data-name or the title when the page has none
    const indexMode = opts.index === 'none' || opts.index === false ? 'none' : opts.index === 'bars' || N > 7 ? 'bars' : 'tabs';
    root.dataset.index = indexMode;
    let nav = stage.querySelector(':scope > .chs-index');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'chs-index';
      nav.setAttribute('aria-label', 'Chapters');
      const ol = document.createElement('ol');
      chapters.forEach((c) => {
        const li = document.createElement('li'), a = document.createElement('a');
        li.className = 'chs-tab';
        a.href = '#' + c.id;
        a.textContent = c.dataset.name || (c.querySelector('.chs-title') || c).textContent.trim();
        li.append(a); ol.append(li);
      });
      nav.append(ol);
      if (head) head.after(nav); else stage.prepend(nav);
    }
    const tabs = [...nav.querySelectorAll('.chs-tab')];
    const links = tabs.map((t) => t.querySelector('a'));
    const fills = tabs.map((t) => {
      const a = t.querySelector('a') || t;
      if (!a.querySelector('.chs-name')) { const n = document.createElement('span'); n.className = 'chs-name'; n.append(...a.childNodes); a.append(n); }
      // the name stays the link's accessible name where only the bars show (phone, many chapters)
      if (a.tagName === 'A' && !a.hasAttribute('aria-label')) a.setAttribute('aria-label', a.querySelector('.chs-name').textContent.trim());
      let tr = a.querySelector('.chs-track');
      if (!tr) { tr = document.createElement('span'); tr.className = 'chs-track'; tr.setAttribute('aria-hidden', 'true'); tr.innerHTML = '<span class="chs-fill"></span>'; a.prepend(tr); }
      return tr.querySelector('.chs-fill');
    });

    // the wipe each chapter arrives with
    const set = String(opts.wipes || 'mixed').split(/[\s,]+/).filter((n) => WIPES[n]);
    const wipes = chapters.map((c, k) => {
      if (pair) return 'left';
      if (WIPES[c.dataset.wipe]) return c.dataset.wipe;
      const list = set.length ? set : MIXED;
      return list[(Math.max(1, k) - 1) % list.length];
    });

    const maxHold = num(opts.maxHold, 6, 3, 8);
    const desk = { L: Math.min(num(opts.length, 1, 0.8, 1.4), maxHold / N), w: num(opts.wipe, 0.5, 0.35, 0.7), amp: 1, phone: false };
    const hand = { L: Math.min(num(opts.phoneLength, 0.85, 0.6, 1.4), maxHold / N), w: num(opts.phoneWipe, 0.55, 0.35, 0.7), amp: 0.6, phone: true };
    const push = num(opts.push, 1, 0, 1.5), shadeTo = num(opts.shade, 0.25, 0, 0.6);
    const masked = !!window.SplitText;
    const EASE = window.gsap ? gsap.parseEase('power1.inOut') : (t) => t;
    if (Stage.touch && window.ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });

    // live state, rebuilt by every build() and cleared by reset()
    const S = { live: false, building: false, cfg: null, tl: null, active: 0, first: true, swap: null, splits: [], lines: [], tracks: [], inView: true };

    const setText = (i, on) => {
      const t = texts[i]; if (!t) return;
      t.style.visibility = on ? '' : 'hidden';
      if (on) t.removeAttribute('aria-hidden'); else t.setAttribute('aria-hidden', 'true');
    };
    // Lines at rest are set to explicit neutral values, never cleared: GSAP keeps its cache of each line's
    // transform and reads its opacity from the inline style, so a swap starts without a single
    // getComputedStyle (each one forces a style recalculation in the middle of a frame).
    const NEUTRAL = { yPercent: 0, xPercent: 0, skewY: 0, opacity: 1 };
    const settleLines = (i) => {
      const L = S.lines[i];
      if (L && (L.title.length || L.body.length)) gsap.set([...L.title, ...L.body], NEUTRAL);
    };
    const settle = () => { // after a re-split or a jump: the active text set, every other hidden
      if (S.swap) { S.swap.kill(); S.swap = null; }
      texts.forEach((_, i) => { settleLines(i); setText(i, i === S.active); });
    };

    // how the words move when the reader crosses seam k in direction dir (1 down the page, -1 back up)
    // Back up the page the picture is uncovered the other way, so travel, slide, order and leading end all
    // flip; the skew keeps its sign (skewY about the left end: negative lifts the right end).
    const vec = (k, dir) => {
      const T = (WIPES[wipes[k]] || WIPES.rise).text;
      const y = T.y * dir;
      const lead = !T.lead ? null : dir > 0 ? T.lead : T.lead === 'right' ? 'left' : 'right';
      const skew = !lead ? 0 : (lead === 'right' ? -1 : 1) * y;
      const from = dir > 0 ? T.from : T.from === 'start' ? 'end' : 'start';
      return { y, x: T.x * dir, skew, from, slow: T.slow };
    };

    const enter = (tl, i, v, at, quick) => {
      const L = S.lines[i]; if (!L) return;
      if (quick) { // a fling: the target is readable within a few frames, however often it is replaced
        tl.fromTo([...L.title, ...L.body], { yPercent: 24 * v.y, xPercent: 0, skewY: 0, opacity: 0.3 },
          { yPercent: 0, opacity: 1, duration: 0.35, ease: 'expo.out', stagger: 0.015 }, at);
        setText(i, true);
        return;
      }
      if (L.title.length) {
        // the lines come in the way the picture did: from the side its seam left, skewed with the move,
        // the line nearest the incoming edge first
        tl.fromTo(L.title,
          masked ? { yPercent: (j, el) => travel(el, v.skew) * v.y, xPercent: v.x, skewY: SKEW * v.skew, opacity: 1 } : { yPercent: 24 * v.y, opacity: 0 },
          { yPercent: 0, xPercent: 0, skewY: 0, opacity: 1, duration: 0.62 * v.slow, ease: 'expo.out', stagger: { each: 0.05, from: v.from } }, at);
      }
      // the body cascade comes from growing durations, not from delays, in the same order as the title
      const n = L.body.length;
      L.body.forEach((ln, j) => tl.fromTo(ln, { yPercent: 100 * v.y, xPercent: v.x / 4, opacity: 0 },
        { yPercent: 0, xPercent: 0, opacity: 1, duration: 0.7 + 0.1 * (v.from === 'end' ? n - 1 - j : j), ease: 'power3.out' }, at + 0.1));
      setText(i, true); // its lines already sit outside their masks (fromTo renders at once)
    };
    const exit = (tl, i, v, at) => {
      const L = S.lines[i];
      if (!L) { setText(i, false); return; }
      if (L.title.length) {
        // a short lift in the same direction, and gone before the first new line shows: masks padded for
        // the display leading overlap their neighbours, so two titles may never be legible at once
        tl.to(L.title, masked
          ? { yPercent: -TRAVEL * v.y, xPercent: -v.x, skewY: 5 * v.skew, duration: 0.3, ease: 'power2.in' }
          : { yPercent: -24 * v.y, duration: 0.3, ease: 'power2.in' }, at);
        tl.to(L.title, { opacity: 0, duration: FADE, ease: 'power1.out' }, at);
      }
      if (L.body.length) tl.to(L.body, { yPercent: -24 * v.y, xPercent: -v.x / 4, opacity: 0, duration: FADE + 0.02, ease: 'power1.out' }, at);
      tl.add(() => { setText(i, false); settleLines(i); }, at + 0.3);
    };

    const swapTo = (idx, instant) => {
      const prev = S.active, dir = idx >= prev ? 1 : -1;
      S.active = idx;
      tabs.forEach((t, i) => {
        t.classList.toggle('is-active', i === idx);
        if (links[i]) { if (i === idx) links[i].setAttribute('aria-current', 'step'); else links[i].removeAttribute('aria-current'); }
      });
      if (reel) gsap.to(reel, { yPercent: (-100 * idx) / N, duration: instant ? 0 : 0.55, ease: 'power3.out', overwrite: 'auto' });
      // busy: the last swap's titles are still moving; after that its tail (the body cascade) can be
      // overtaken by an ordinary exit. (Its own clock, not isActive(): a swap made in the same frame has
      // not rendered yet, and isActive() calls it idle.)
      const busy = !!(S.swap && S.swap.progress() < 1 && S.swap.time() < 0.5);
      if (S.swap) { S.swap.kill(); S.swap = null; }
      // whatever path follows, only the outgoing and the incoming words may stay on: a swap killed before
      // its exit hid the old words would otherwise leave them standing
      texts.forEach((_, i) => { if (i !== idx && i !== prev && texts[i] && texts[i].style.visibility !== 'hidden') { setText(i, false); settleLines(i); } });
      const v = vec(dir > 0 ? idx : prev, dir);
      if (instant || busy || Math.abs(idx - prev) > 1) {
        // a fling or a reversal mid-swap: straight to the target, nothing else on screen
        texts.forEach((_, i) => { if (i !== idx) { setText(i, false); settleLines(i); } });
        if (instant) { settleLines(idx); setText(idx, true); return; }
        S.swap = gsap.timeline();
        enter(S.swap, idx, v, 0, true);
        return;
      }
      S.swap = gsap.timeline();
      exit(S.swap, prev, v, 0);
      enter(S.swap, idx, v, masked ? ENTER_AT : 0.22); // overlaps the exit, never waits for it
    };

    // footage plays only where it shows and while the scene is on screen
    const footage = [...imgs, ...insetImgs].some((v) => v && v.tagName === 'VIDEO');
    const playIf = (v, on) => {
      if (!v || v.tagName !== 'VIDEO') return;
      if (on) { if (v.paused) v.play().catch(() => {}); } else if (!v.paused) v.pause();
    };

    // the wipes: clip-path insets computed in whole pixels from the timeline's progress. A fractional
    // inset antialiases the picture and the shade above it separately, and the edge shows a lighter line.
    const clipAll = (p) => {
      for (const t of S.tracks) {
        for (const W of t.wipes) {
          if (!W || !W.el) continue;
          if (!W.w) { W.w = W.el.offsetWidth; W.h = W.el.offsetHeight; }
          const s = 1 - EASE(clamp((p - W.t0) / W.d, 0, 1)), e = W.edges;
          const css = `inset(${Math.round(e[0] * s * W.h)}px ${Math.round(e[1] * s * W.w)}px ${Math.round(e[2] * s * W.h)}px ${Math.round(e[3] * s * W.w)}px)`;
          if (css !== W.last) { W.last = css; W.el.style.clipPath = css; }
        }
      }
    };

    // One horizon for the series. Every article that gives data-horizon (the share of its picture's height
    // where the horizon or key line sits) is lifted or lowered inside its crop so the line lands at one
    // height on the stage, as far as the crop has room; then its scrim band is laid from that line down.
    // The height chosen is the one that lines up the most pictures, as close to the preferred one as they
    // allow. A crop taller than the stage's shape gives the room; one exactly its shape keeps its line.
    const horizons = chapters.map((c) => { const h = parseFloat(c.dataset.horizon); return h > 0 && h < 1 ? h : null; });
    // A level seam (rise, drop) runs along the horizon, never across it, so the picture it brings in needs
    // the shared line only where an upright seam (right, left, corner) follows it. When none does (it is the
    // last chapter, or the next wipe is level too) it gets its own line: just below the middle for a rise,
    // so the strip the rising edge uncovers first is what stands on its horizon (the glow, the figure), not
    // the dark ground under it; just above the middle for a drop. data-horizon-at sets it by hand.
    const LEVEL_AT = 0.58;
    const level = (x) => x === 'rise' || x === 'drop';
    const ownAt = chapters.map((c, k) => {
      const a = parseFloat(c.dataset.horizonAt);
      if (a >= 0.2 && a <= 0.8) return a;
      if (pair || k === 0 || !level(wipes[k]) || (k < N - 1 && !level(wipes[k + 1]))) return null;
      return wipes[k] === 'rise' ? LEVEL_AT : 1 - LEVEL_AT;
    });
    const align = () => {
      if (!S.live) return;
      const rows = [];
      horizons.forEach((h, k) => {
        const img = imgs[k];
        if (!img || h === null) return;
        img.style.removeProperty('object-position');
        const nw = img.naturalWidth || img.videoWidth, nh = img.naturalHeight || img.videoHeight;
        const bw = img.offsetWidth, bh = img.offsetHeight;
        if (!nw || !nh || !bw || !bh) return;
        const ph = nh * Math.max(bw / nw, bh / nh), slack = ph - bh >= 1 ? ph - bh : 0;
        // where the line can land, from lo (picture lifted as far as it goes) to hi, as shares of the box
        rows.push({ k, img, h, ph, bh, slack, lo: (h * ph - slack) / bh, hi: (h * ph) / bh, own: ownAt[k] });
      });
      if (!rows.length) return;
      const shared = rows.filter((r) => r.own === null);
      // the picture's box runs 6% past the stage at the top and the bottom
      const H = stage.offsetHeight || window.innerHeight;
      const toBox = (s) => (s + 0.06) / 1.12;
      // the words must stay on the band: the line may not land lower than just above the highest text
      let words = H;
      if (!pair) {
        const top = stage.getBoundingClientRect().top;
        texts.forEach((x) => { const r = x && x.getBoundingClientRect(); if (r && r.height) words = Math.min(words, r.top - top); });
      }
      const cap = toBox(Math.max(0.2, (words - 16) / H));
      const given = num(opts.horizon, NaN, 0.2, 0.8);
      let t = Math.min(cap, toBox(Number.isFinite(given) ? given : 0.45));
      if (!Number.isFinite(given) && shared.length) {
        const pref = t, EPS = 0.004;
        let best = -1, bestD = Infinity;
        for (const c of [pref, ...shared.flatMap((r) => [r.lo, r.hi, clamp(pref, r.lo, r.hi)])]) {
          if (c > cap + EPS) continue;
          const n = shared.filter((r) => c >= r.lo - EPS && c <= r.hi + EPS).length, dd = Math.abs(c - pref);
          if (n > best || (n === best && dd < bestD)) { best = n; bestD = dd; t = c; }
        }
      }
      rows.forEach((r) => {
        const at = r.own === null ? t : Math.min(cap, toBox(r.own));
        const o = r.slack ? clamp(r.h * r.ph - at * r.bh, 0, r.slack) : 0;
        if (r.slack) {
          const x = (getComputedStyle(r.img).objectPosition || '50%').split(' ')[0];
          r.img.style.objectPosition = `${x} ${(-o).toFixed(1)}px`;
        }
        // a crop that can't lift its line above the words gets its band raised to them anyway
        if (movers[r.k] && !pair) movers[r.k].style.setProperty('--band-top', `${Math.round(Math.min(r.h * r.ph - o, cap * r.bh))}px`);
      });
    };
    // The finished composition, when a script runs (reduced motion, a phone set to 'rest'): each block's
    // picture is set so its horizon sits a little above the middle of the block, and its scrim starts there
    // instead of covering the sky. With no script at all the scrim covers the whole picture.
    const restAlign = () => {
      if (S.live || root.classList.contains('is-live')) return;
      chapters.forEach((c, k) => {
        const img = imgs[k], plate = plates[k], h = horizons[k];
        if (!img || !plate || h === null) return;
        img.style.removeProperty('object-position');
        const nw = img.naturalWidth || img.videoWidth, nh = img.naturalHeight || img.videoHeight;
        const bw = img.offsetWidth, bh = img.offsetHeight;
        if (!nw || !nh || !bw || !bh) return;
        const ph = nh * Math.max(bw / nw, bh / nh), slack = ph - bh >= 1 ? ph - bh : 0;
        const tr = texts[k] && texts[k].getBoundingClientRect(), top = plate.getBoundingClientRect().top;
        const cap = tr && tr.height ? Math.max(0.2 * bh, tr.top - top - 16) : bh;
        const o = slack ? clamp(h * ph - Math.min(cap, 0.42 * bh), 0, slack) : 0;
        if (slack) {
          const x = (getComputedStyle(img).objectPosition || '50%').split(' ')[0];
          img.style.objectPosition = `${x} ${(-o).toFixed(1)}px`;
        }
        plate.style.setProperty('--band-top', `${Math.round(clamp(h * ph - o, 0, cap))}px`);
      });
    };
    let restQueued = 0;
    const queueRest = () => { if (!restQueued) restQueued = requestAnimationFrame(() => { restQueued = 0; restAlign(); }); };
    imgs.forEach((img, k) => {
      if (img && horizons[k] !== null) img.addEventListener(img.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', () => (S.live ? align() : queueRest()));
    });
    window.addEventListener('resize', () => { if (!S.live) queueRest(); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.live) queueRest(); });
    // the stage never calls rest() on a wide screen with reduced motion (its matchMedia matches neither
    // condition there), so the scene looks for itself, now and whenever that preference changes
    queueRest();
    if (window.matchMedia) {
      const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
      // (and the reader keeps their place while the stage collapses into it, or back)
      if (rm.addEventListener) rm.addEventListener('change', () => { arm(); requestAnimationFrame(queueRest); });
    }

    // hide what is fully covered or not yet started; promote only the pictures in play (the one showing,
    // the one coming in and the next after it, so no layer is made or dropped while a seam moves)
    const paint = (p) => {
      for (const t of S.tracks) {
        let top = 0;
        for (let k = 1; k < N; k++) if (t.wipes[k] && p >= t.wipes[k].t0 + t.wipes[k].d - 1e-4) top = k;
        t.els.forEach((el, j) => {
          if (!el) return;
          const v = j >= top && (j === 0 || (t.wipes[j] && p > t.wipes[j].t0));
          if (t.vis[j] !== v) { t.vis[j] = v; el.style.visibility = v ? '' : 'hidden'; }
          if (footage) playIf(t.media[j], v && S.inView);
          const wc = j >= top && j <= top + 2;
          if (t.movers[j] && t.wc[j] !== wc) { t.wc[j] = wc; t.movers[j].style.willChange = wc ? 'transform' : ''; }
        });
      }
    };

    const update = (p) => {
      if (!S.live || S.building) return;
      clipAll(p);
      const raw = p * N;
      const idx = clamp(Math.floor(raw), 0, N - 1);
      // forward the switch lands exactly on the seam; back, only HYST past it, so a hand resting on a
      // seam never flickers between two titles
      if (idx !== S.active && (S.first || idx > S.active || raw < idx + 1 - HYST)) swapTo(idx, S.first);
      S.first = false;
      paint(p);
    };

    const split = (el, onLines, lift) => {
      if (!el) return null;
      if (masked) {
        return SplitText.create(el, {
          type: 'lines', mask: 'lines', linesClass: 'chs-line', aria: 'auto', autoSplit: true,
          onSplit: (self) => {
            if (lift) self.lines.forEach(measureLift);
            gsap.set(self.lines, NEUTRAL); // parsed now, while nothing moves, not on the first swap
            onLines(self.lines);
            if (!S.building && S.live) settle();
          },
        });
      }
      onLines([el]);
      return null;
    };

    const reset = () => {
      S.live = false;
      if (S.swap) { S.swap.kill(); S.swap = null; }
      S.splits.forEach((s) => { try { if (s && s.revert) s.revert(); } catch (e) { /* already reverted */ } });
      S.splits = []; S.lines = []; S.tracks = [];
      texts.forEach((t) => { if (t) { t.style.removeProperty('visibility'); t.removeAttribute('aria-hidden'); } });
      [...plates, ...insets].forEach((p) => { if (p) { p.style.removeProperty('visibility'); p.style.removeProperty('clip-path'); } });
      [...imgs, ...insetImgs].forEach((v) => playIf(v, false)); // the finished composition shows posters
      imgs.forEach((img, k) => { if (img && horizons[k] !== null) img.style.removeProperty('object-position'); });
      [...movers, ...plates].forEach((m) => m && m.style.removeProperty('--band-top'));
      tabs.forEach((t) => t.classList.remove('is-active'));
      links.forEach((a) => a && a.removeAttribute('aria-current'));
      if (!window.gsap) return; // no script library: nothing was ever moved
      const moved = [...movers, ...insetMovers, ...shades, ...insetShades, ...fills, reel].filter(Boolean);
      gsap.killTweensOf(moved);
      gsap.set(moved, { clearProps: 'transform,opacity,willChange' });
    };

    const build = (tl, ctx, cfg) => {
      arm();
      reset();
      S.live = true; S.building = true; S.cfg = cfg; S.tl = tl; S.first = true; S.active = 0;
      const d = cfg.w / N, amp = cfg.amp * push;
      tl.to({}, { duration: 1 }, 0); // positions below read as fractions of the hold

      // one track of frames: the full-bleed plates (or the big frames), and in 'pair' the small frames.
      // Each frame's mover carries its picture and its scrim band, so the band's edge stays on the horizon.
      const track = (els, mvs, media, shs, kindOf, lag, inScale) => {
        const t = { els, movers: mvs, media, wipes: [], vis: [], wc: [] };
        for (let k = 1; k < N; k++) {
          const W = WIPES[kindOf(k)], t0 = k / N - d / 2 + lag * d;
          if (els[k]) t.wipes[k] = { el: els[k], edges: W.edges, t0, d, w: 0, h: 0, last: '' };
          if (mvs[k]) {
            // the incoming picture is still settling after its seam lands
            const sc = 1 + ((inScale || W.in.scale) - 1) * amp;
            tl.fromTo(mvs[k], { scale: sc }, { scale: 1, duration: Math.min((inScale ? 1.5 : 1.35) * d, 0.95 / N), ease: 'power2.out' }, t0);
            const from = {}, to = { duration: d, ease: 'power1.inOut' };
            if (W.in.xPercent) { from.xPercent = W.in.xPercent * amp; to.xPercent = 0; }
            if (W.in.yPercent) { from.yPercent = W.in.yPercent * amp; to.yPercent = 0; }
            if ('xPercent' in from || 'yPercent' in from) tl.fromTo(mvs[k], from, to, t0);
          }
          if (mvs[k - 1]) { // the outgoing picture is pushed by the incoming one
            const from = { scale: 1 }, to = { scale: 1 + (W.out.scale - 1) * amp, duration: d, ease: 'none', immediateRender: false };
            if (W.out.xPercent) { from.xPercent = 0; to.xPercent = W.out.xPercent * amp; }
            if (W.out.yPercent) { from.yPercent = 0; to.yPercent = W.out.yPercent * amp; }
            tl.fromTo(mvs[k - 1], from, to, t0);
          }
          // the shade is the plate's scrim (live CSS sets it to --scrim); it deepens as the plate is covered
          const sh = shs[k - 1];
          if (shadeTo && sh) {
            const base = parseFloat(getComputedStyle(sh).opacity) || 0;
            // written inline now, while nothing moves: a tween that starts later (immediateRender false)
            // would otherwise read the computed opacity as it starts, a forced style pass mid-wipe
            gsap.set(sh, { opacity: base });
            tl.fromTo(sh, { opacity: base }, { opacity: base + (1 - base) * shadeTo, duration: d, ease: 'none', immediateRender: false }, t0);
          }
        }
        S.tracks.push(t);
      };
      track(plates, movers, imgs, shades, (k) => wipes[k], 0, pair ? 1.2 : 0);
      // the small frame crosses the big one: drawn in from the right, a beat behind
      if (pair && !cfg.phone) track(insets, insetMovers, insetImgs, insetShades, () => 'right', 0.2, 1.2);

      fills.forEach((f, k) => { if (f) tl.fromTo(f, { scaleX: 0 }, { scaleX: 1, duration: 1 / N, ease: 'none' }, k / N); });

      // pre-roll: the first picture settles into its frame while the section arrives (in px, so it never
      // fights the percentages the wipes move it by)
      if (opts.preroll !== false && movers[0]) {
        const m = movers[0];
        gsap.fromTo(m, { y: () => -0.05 * cfg.amp * m.offsetHeight }, {
          y: 0, ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true },
        });
      }

      texts.forEach((t, i) => {
        S.lines[i] = { title: [], body: [] };
        if (!t) return;
        S.splits.push(split(t.querySelector('.chs-title'), (ls) => { S.lines[i].title = ls; }, true));
        S.splits.push(split(t.querySelector('.chs-body'), (ls) => { S.lines[i].body = ls; }));
        setText(i, i === 0);
      });
      tabs.forEach((t, i) => t.classList.toggle('is-active', i === 0));
      if (links[0]) links[0].setAttribute('aria-current', 'step');
      if (reel) gsap.set(reel, { yPercent: 0 });
      tl.eventCallback('onUpdate', () => update(tl.progress()));
      S.building = false;
      align();
      clipAll(tl.progress());
      paint(tl.progress());
    };

    // after a refresh (resize, fonts, pictures) the frames are measured again and every clip re-applied,
    // also when the refresh rendered the timeline without its callbacks
    if (window.ScrollTrigger) {
      ScrollTrigger.addEventListener('refresh', () => {
        if (!S.live || !S.tl) return;
        S.tracks.forEach((t) => t.wipes.forEach((W) => { if (W) { W.w = 0; W.last = ''; } }));
        align();
        update(S.tl.progress());
      });
    }

    // A turned phone or a resized window changes every height the scene measured, and crossing a breakpoint
    // rebuilds it. The scene keeps where the reader was relative to itself (above it, a point of its
    // progress, or past it) and returns them to that point after the refresh. While a resize is being
    // settled, scroll events are not the reader's: the browser clamps the scroll to the new page height and
    // reports it right after 'resize', before the scene is rebuilt, measured against the old geometry.
    const mem = { y: -1, above: false, p: 0, past: 0 };
    let pendingUntil = 0;
    const remember = () => {
      if (performance.now() < pendingUntil) return; // the clamp and the collapse are not a reader's scroll
      const y = window.scrollY, st = S.live && S.tl && S.tl.scrollTrigger;
      let above = false, p = 0, past = 0;
      if (st) {
        if (y < st.start) above = true;
        else if (y > st.end) { past = y - st.end; p = 1; } else p = (y - st.start) / Math.max(1, st.end - st.start);
      } else { // the finished composition: the chapter in view
        const r = root.getBoundingClientRect();
        if (r.top > 0) above = true;
        else if (r.bottom < window.innerHeight) { past = window.innerHeight - r.bottom; p = 1; } else {
          let k = 0;
          chapters.forEach((c, i) => { if (c.getBoundingClientRect().top <= window.innerHeight * 0.4) k = i; });
          p = (k + 0.5) / N;
        }
      }
      Object.assign(mem, { y, above, p, past });
    };
    window.addEventListener('scroll', remember, { passive: true });
    const arm = () => { if (mem.y > 2) pendingUntil = performance.now() + 900; };
    // 'resize' runs before the scroll steps of the same frame, so arming here keeps the clamp out of mem.
    // A phone's address bar sliding in or out changes only the height: that is the reader scrolling.
    let vw = window.innerWidth, vh = window.innerHeight;
    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      if (w !== vw || (h !== vh && !Stage.touch)) arm();
      vw = w; vh = h;
    }, { passive: true });
    window.addEventListener('orientationchange', arm, { passive: true });
    // The scene changing height by itself (the stage collapsing it when reduced motion is switched on, a
    // rebuild) clamps the scroll too, and that clamp can be reported before any listener of ours has run.
    // A resize observer reports the new height after layout, before the next scroll event, so it arms first.
    if ('ResizeObserver' in window) {
      let lastH = -1;
      new ResizeObserver((es) => {
        const h = Math.round(es[es.length - 1].contentRect.height);
        if (lastH >= 0 && h !== lastH) arm();
        lastH = h;
      }).observe(root);
    }
    // the reader taking over ends the wait, so a late refresh never pulls them back
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => window.addEventListener(ev, () => { pendingUntil = 0; }, { passive: true }));
    const putBack = () => {
      if (mem.y <= 2) return;
      const st = S.live && S.tl && S.tl.scrollTrigger;
      let y = mem.y;
      if (mem.above) { if (window.scrollY > 2) return; } // above the scene the browser keeps its own place
      else if (st) y = mem.past > 0 ? st.end + mem.past : st.start + mem.p * (st.end - st.start);
      else {
        const top = root.getBoundingClientRect().top + window.scrollY;
        y = mem.past > 0 ? top + root.offsetHeight - window.innerHeight + mem.past
          : chapters[clamp(Math.floor(mem.p * N), 0, N - 1)].getBoundingClientRect().top + window.scrollY;
      }
      y = Math.max(0, Math.round(y));
      mem.y = y;
      if (Math.abs(window.scrollY - y) < 1) return;
      if (Stage.lenis) Stage.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
    };
    if (window.ScrollTrigger) {
      ScrollTrigger.addEventListener('refresh', () => {
        if (performance.now() < pendingUntil) requestAnimationFrame(() => requestAnimationFrame(putBack));
      });
    }
    // footage stops when the scene leaves the screen and picks up where it shows when it returns
    if (footage && 'IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        S.inView = es[es.length - 1].isIntersecting;
        if (S.live && S.tl) paint(S.tl.progress());
      }).observe(root);
    }

    // index links go to the start of their chapter's rest, never to a seam
    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      const k = links.indexOf(a);
      if (k < 0 || !S.live || !S.tl || !S.tl.scrollTrigger) return;
      e.preventDefault();
      e.stopPropagation();
      const st = S.tl.scrollTrigger;
      const lag = pair && !S.cfg.phone ? 0.2 : 0;
      const p = k === 0 ? 0 : Math.min(1, (k + S.cfg.w * (0.5 + lag)) / N + 0.005);
      const y = Math.round(st.start + p * (st.end - st.start));
      if (Stage.lenis) Stage.lenis.scrollTo(y, { duration: 1 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    });

    const scrub = opts.scrub !== undefined ? opts.scrub : Stage.lenis ? true : Stage.phone ? 0.4 : 0.6;
    // A screen too small for the held stage (under 340px wide or 560px tall: a phone turned on its side, a
    // window dragged short) gets the finished composition, on either side of 768px: there the words and
    // the dock would cover most of the stage and leave the picture a strip.
    const tiny = () => window.innerWidth < 340 || window.innerHeight < 560;
    const still = () => {
      arm();
      reset();
      S.built = 'still';
      root.classList.remove('is-live'); root.classList.add('is-rest'); root.style.removeProperty('--hold');
      queueRest();
    };
    // the stage reverts a build (a breakpoint, reduced motion switched on) by its own context; the inline
    // clips, visibility and positions the scene wrote outside GSAP are cleared with it
    const live = (tl, ctx, cfg) => {
      if (tiny()) return still();
      build(tl, ctx, cfg);
      S.built = 'live';
      if (gsap.context) gsap.context(() => () => { if (S.tl === tl) { reset(); S.built = null; } });
    };
    const phone = opts.phone === 'rest' || N > num(opts.phoneMax, 6, 2, 12)
      ? 'rest'
      : { hold: N * hand.L, build: (tl, ctx) => live(tl, ctx, hand) };
    const plan = { hold: N * desk.L, scrub, build: (tl, ctx) => live(tl, ctx, desk), phone, rest: () => { arm(); reset(); S.built = null; queueRest(); } };
    let mm = Stage.scene(root, plan);
    // The stage's media queries watch the width and reduced motion only, so a resize that crosses 560px
    // in height (or 340px in width) without crossing 768px is rebuilt here, once it has settled.
    let tinyT = 0;
    window.addEventListener('resize', () => {
      clearTimeout(tinyT);
      tinyT = setTimeout(() => {
        if (!mm || !S.built || S.built === (tiny() ? 'still' : 'live')) return;
        arm();
        mm.revert();
        mm = Stage.scene(root, plan);
        root.__scene = mm;
        ScrollTrigger.refresh();
      }, 180);
    }, { passive: true });
    return mm;
  };
})();
