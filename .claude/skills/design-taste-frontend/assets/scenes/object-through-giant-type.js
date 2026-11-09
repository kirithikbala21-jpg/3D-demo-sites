// tasteskill / scenes / object-through-giant-type.js — one cut-out object falls through a wall of giant type.
//
// A short quote or manifesto is set in huge capitals that fill the held stage. One cut-out object (a coin,
// a clock face, a stone, a watch head) falls down the wall: each line parts at its word gap and the halves
// open around the object in a bell-shaped wake, then close behind it; each line turns from a muted tone
// to full ink as the object reaches it, while the wall itself climbs. In the last line the object swells
// toward the camera and smashes the lines around it into letters that tumble out across the stage, none
// over another (two of them swell to giant size low at its sides), while it tips and drops out behind
// them; then every letter flies home and the whole quote stands closed, in full ink, with its credit.
// Use it once per page, for a statement
// worth reading slowly, paired with one clean cut-out (or a photograph of a round thing, see below).
//
// DOM. One element per line, class ott-line (a <p> or a <span>; without any, each <p> of the quote is a
// line). A line holds two .ott-half spans with the real space between them, outside both spans, so copy
// and screen readers get the whole sentence. A line written without halves is parted by the script at the
// word gap nearest its middle; a single word of six letters or more at its middle letter; a shorter single
// word is never cut and steps aside whole as the object passes. Write the text in sentence case; the
// stylesheet sets it in capitals. No eyebrow above the quote: anything that introduces it goes into the
// credit.
//
//   <section class="scene ott" data-scene="object-through-giant-type" data-options='{}' aria-label="The quote">
//     <div class="scene-stage">
//       <blockquote class="ott-quote">
//         <p class="ott-line"><span class="ott-half">Twelve</span> <span class="ott-half">minutes</span></p>
//         …  3 to 7 lines make one wall (5 reads best). 8 to 12 lines become a travelling wall, taller
//            than the stage, that climbs through it and pulls back at the end to show the whole quote.
//            10-14 characters a line, 15 at most, with the gap near the middle: the more evenly a line
//            splits, the larger the type can be, because a parted line must still fit the stage. Halves
//            of two short words re-wrap into a tall wall on the phone; a long single word costs size there
//       </blockquote>
//       <div class="ott-object" aria-hidden="true">
//         <img class="ott-object__img" src="object.webp" width="640" height="640" alt="">
//         <img class="ott-object__back" src="back.webp" width="640" height="640" alt="">   flip mode, optional
//       </div>
//       <p class="ott-credit">Ingrid Holm, head roaster</p>                     optional, 5 words at most
//     </div>
//   </section>
//
// The object: a transparent WebP or PNG cropped close to the subject (its box is what lies over the type),
// a compact silhouette (aspect 0.7-1.4), clean alpha with no halo and no baked ground shadow, about twice
// its largest display size (the exit swells it to `grow`, so 900px or more for a sharp climax). Its
// width and height attributes set the box's proportions. It must stand apart from the ground and the ink
// by itself: the house style gives it no drop shadow. A part that sticks out (a handle, a strap) is safest
// pointing sideways. No cut-out at hand: a photograph of a round thing (a clock face, a coin, a record)
// works when the page makes the img square and round itself:
//   .ott-object img { aspect-ratio: 1; object-fit: cover; object-position: <x>% 50%; border-radius: 50%; }
// with width and height attributes equal, and the photo framed so the round thing fills its height.
// For the flip mode use a flat two-faced thing (a coin, a clock face, a badge: `edge` 'round'; a card or a
// label: 'flat'); the back face is the front again unless you give .ott-object__back. Colours and faces
// come from the page: --ground, --ink, --font-display, --font-text (fallbacks: warm paper, near black,
// inherit); --ott-stretch (desktop, default 100%) and --ott-stretch-phone (75%) set the width axis of a
// variable display face. Lines the object has not reached are the ink at the `rest` opacity (3:1 or
// better on the ground). The leading opens by itself only between two lines where a comma or an accent
// would touch the line above or below.
//
// Options (data-options JSON). Default, then range:
//   hold        3        screens the stage is held on desktop (2.5-4)
//   phoneHold   3.5      screens held under 768px (2.5-4.5)
//   phone       'same'   'same' runs the scene with phone numbers; 'rest' shows the poster frame
//   reflow      true     phone: the author's halves are re-wrapped into lines as wide as the phone allows,
//                        preferring the wrap that fills the screen with the largest type and cuts no word;
//                        false keeps the desktop lines
//   travel      'auto'   true / false forces the travelling wall; 'auto' uses it above 7 lines (8 on the
//                        phone) when fitting the whole block would shrink the type by more than 15%
//   scrub       auto     true when Lenis smooths the page, else 0.6 (seconds of catch-up)
//   mode        'tumble' 'tumble' turns the object in the picture plane; 'flip' spins it about its
//                        vertical axis like a coin: a face in every line, edge-on between lines
//   rim         ''       flip: colour of the object's edge seen edge-on (default a mid metal grey)
//   edge        'round'  flip: 'round' (coin, dial) or 'flat' (card) for the shape of that edge
//   thick       0.06     flip: thickness of the object as a share of its width (0.02-0.14)
//   size        1.45     object box as a multiple of the type size (1.1-1.8); phoneSize 1.9 (1.3-2.2)
//   push        1.4      how far the halves of the line the object sits in part, x the object radius
//                        (1.1-1.8); phonePush, the same on the phone (default: push)
//   radius      2.4      reach of the wake, x the object radius (1.8-3)
//   falloff     2.5      shape of the wake (1.5 = soft and wide, opens three lines; 4 = a tight slit)
//   lag         0.15     seconds the halves trail their place (0 = rigid, 0.35 = like water)
//   follow      0.4      how far the object leans toward each line's own word gap instead of falling
//                        dead straight (0-1); it keeps long halves on the stage when gaps sit off-centre
//   enter       'above'  'above': the object starts just above the wall and drops into line 1 by 8%, so the
//                        first frame is the whole quote, closed; 'inside': it starts in line 1 (the spec's
//                        first frame; that line must then fit the margins parted, which costs type size)
//   tilt        [-9, 15] object rotation in degrees at the first and at the last line; 17 more on the exit
//   exit        'break'  'break': the swelling object smashes the last lines into tumbling letters that
//                        fly home once it has gone; 'fall': it only swells, tips and drops out while the
//                        wall opens around it (never past the stage edge) and closes behind it
//   shatter     3        break: how many lines, counted up from the last, break into letters (1-6); the
//                        throw weakens line by line away from the object. Two lines in five always stay
//                        whole (a 3-line quote breaks only its last line), so the quote is never all letters
//   giants      2        break: letters of the last line that swell low at the object's sides, as large as
//                        the room under the whole lines allows, set back in a faint tone while swollen (0-3)
//   seed        7        break: the throw is seeded, so scrubbing back and forth shows the same picture;
//                        another number deals another throw
//   grow        2.4      scale the object swells to as it leaves (1.2-2.8)
//   tip         45       degrees it tips toward the camera as it drops (0-70)
//   drift       0.07     the wall climbs 2 x drift x stage height over the hold (0-0.12); phoneDrift 0.09
//   rest        0.5      opacity of the lines the object has not reached yet (0.42-0.7)
//   fill        0.86     widest closed line as a share of the stage width (0.7-0.92); phoneFill 0.88
//
// Type size: min(11.1vw, 17.8vh) on desktop and 20vw on the phone, then smaller if needed so the widest
// closed line fills `fill` of the width at most, the block (or six lines of a travelling wall) fits the
// height clear of the credit, and parted lines stay on the stage: inside the page margins in the first
// frame, inside half a margin for the line the object sits in (the one being read), and past the stage
// edge by 5% of the width at most (24px on the phone) for a line only partly open. The object box is
// `size` times that. The phone re-wraps the author's halves and keeps the wrap that fills the screen
// best at the largest size without cutting a word (the author's own lines win a near tie).
//
// Progress map (desktop, 5 lines): 0% the object hangs just above the wall, face on, every line closed and
// muted, line 1 starting to part under it; 8% it has dropped into line 1, which is parted and in ink;
// it meets one line every 13% (line 2 at 21%, line 3 at 34%, line 4 at 47%), a face (flip) in each,
// edge-on between, the halves parting before it and closing behind it, the wall climbing; 60% it sits
// in the last line. Exit 'break': 60-62% it swells and the last three lines burst into letters all at
// once, the block opening like a fan from its top edge (out and down), each letter shrinking into depth
// and tumbling as it goes, every one inside the stage, below the lines that stay
// whole and clear of every other letter all the way out and home (each throw is played through before
// it is kept); two dim in their place and swell to giant size low at its sides, in a faint tone, until
// they are home; from the break the object is drawn
// behind the burst; 62-74% it tips, falls and leaves; 70-79% every letter flies home (power3.inOut) and
// the lines close; 79-89% the credit comes in; 79-100% the closed quote is held in ink. Exit 'fall': the
// object swells (1.9x by 65%) while the last lines open wide, then drops out by 74%; credit 74-84%.
// The phone: the same with phone lines and a longer hold. A travelling wall: the object falls through
// the middle third of the stage while the taller wall climbs past it, lines fading as the stage edge cuts
// into them; 74-84% the wall pulls back (scales down) until the whole quote fits, centred, and holds.
// Reduced motion, a failed CDN and phone 'rest': one poster frame, the object resting in the middle
// line that parts at a word gap, the wake around it held still, every line in ink. No script: the object
// above the closed quote.
(() => {
  const ID = 'object-through-giant-type';
  const TRAVEL = 0.6;   // the object meets the last line here
  const EXIT = 0.14;    // and has left the stage this much later
  const ENTER = 0.08;   // from just above the wall into line 1 (or held in line 1)
  const BREAK = 0.603;  // the first letters leave here (exit 'break')
  const HOME = 0.79;    // and every letter is back in its place here
  const FIT0 = 0.74, FIT1 = 0.84;   // a travelling wall pulls back to show the whole quote
  const ASIDE = 1.15;   // a word that steps aside stops this many object radii from the object's centre
  const WALL = 7, PHONE_WALL = 8;   // more lines than this travel through the stage
  const TIP = -1;       // rotationX sign that tips the object's top edge toward the viewer
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
  const pair = (v, d, a, b) => (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number' && isFinite(x)) ? [clamp(v[0], a, b), clamp(v[1], a, b)] : d);
  const smooth = (t) => t * t * (3 - 2 * t);
  const out3 = (t) => 1 - Math.pow(1 - t, 3);
  const inOut3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const letters = (s) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
  // seeded random numbers (mulberry32): the same throw every time the scene is scrubbed
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const settings = (o) => {
    const push = num(o.push, 1.4, 1.1, 1.8);
    return {
      hold: num(o.hold, 3, 2.5, 4),
      phoneHold: num(o.phoneHold, 3.5, 2.5, 4.5),
      phone: o.phone === 'rest' ? 'rest' : 'same',
      reflow: o.reflow !== false,
      travel: typeof o.travel === 'boolean' ? o.travel : 'auto',
      scrub: typeof o.scrub === 'boolean' || typeof o.scrub === 'number' ? o.scrub : null,
      mode: o.mode === 'flip' ? 'flip' : 'tumble',
      rim: typeof o.rim === 'string' && o.rim ? o.rim : '',
      edge: o.edge === 'flat' ? 'flat' : 'round',
      thick: num(o.thick, 0.06, 0.02, 0.14),
      size: num(o.size, 1.45, 1.1, 1.8),
      phoneSize: num(o.phoneSize, 1.9, 1.3, 2.2),
      push,
      phonePush: num(o.phonePush, push, 1.1, 1.8),
      radius: num(o.radius, 2.4, 1.8, 3),
      falloff: num(o.falloff, 2.5, 1.5, 4),
      lag: num(o.lag, 0.15, 0, 0.35),
      follow: num(o.follow, 0.4, 0, 1),
      enter: o.enter === 'inside' ? 'inside' : 'above',
      tilt: pair(o.tilt, [-9, 15], -45, 45),
      exit: o.exit === 'fall' ? 'fall' : 'break',
      shatter: Math.round(num(o.shatter, 3, 1, 6)),
      giants: Math.round(num(o.giants, 2, 0, 3)),
      seed: Math.round(num(o.seed, 7, 0, 2147483647)),
      grow: num(o.grow, 2.4, 1.2, 2.8),
      tip: num(o.tip, 45, 0, 70),
      drift: num(o.drift, 0.07, 0, 0.12),
      phoneDrift: num(o.phoneDrift, 0.09, 0, 0.12),
      rest: num(o.rest, 0.5, 0.42, 0.7),
      fill: num(o.fill, 0.86, 0.7, 0.92),
      phoneFill: num(o.phoneFill, 0.88, 0.7, 0.92),
    };
  };

  // Where a line parts: the word gap nearest its middle; one word of six letters or more parts at the
  // letter nearest its middle (three letters a side at least); a shorter word is never cut, it steps
  // aside whole as the object passes.
  const split = (text) => {
    const t = norm(text);
    const gaps = [];
    for (let i = 0; i < t.length; i++) if (t[i] === ' ') gaps.push(i);
    if (gaps.length) {
      const mid = t.length / 2;
      let at = gaps[0];
      for (const g of gaps) if (Math.abs(g + 0.5 - mid) < Math.abs(at + 0.5 - mid)) at = g;
      return { a: t.slice(0, at), b: t.slice(at + 1), sep: ' ' };
    }
    const ch = [...t];
    if (letters(t) < 6) return { a: t, b: '', sep: '' };
    const at = clamp(Math.round(ch.length / 2), 3, ch.length - 3);
    return { a: ch.slice(0, at).join(''), b: ch.slice(at).join(''), sep: '' };
  };

  // The lines as written: the .ott-line elements (spans or paragraphs), or else each <p> of the quote;
  // the author's halves where a line has two, else the script's split.
  const readLine = (p) => {
    const h = [...p.children].filter((c) => c.classList.contains('ott-half'));
    if (h.length >= 2) {
      const nodes = [...p.childNodes];
      const between = nodes.slice(nodes.indexOf(h[0]) + 1, nodes.indexOf(h[1])).map((n) => n.textContent).join('');
      return { a: norm(h[0].textContent), b: norm(h.slice(1).map((x) => x.textContent).join(' ')), sep: /\s/.test(between) ? ' ' : '' };
    }
    return split(p.textContent);
  };
  const read = (quote) => {
    const found = quote.querySelectorAll('.ott-line');
    return [...(found.length ? found : quote.querySelectorAll('p'))].map(readLine).filter((l) => l.a || l.b);
  };

  // Glyph extents of the display face as shares of its size (accents above the capitals, commas and
  // tails below the baseline). Not cached across measures: a face that loads late is measured again.
  const pen = document.createElement('canvas').getContext('2d');
  const face = (el) => {
    const cs = getComputedStyle(el);
    const font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
    const seen = new Map();
    const glyph = (ch) => {
      if (!seen.has(ch)) {
        let m = { asc: 0.7, desc: 0 };
        try { pen.font = font; const t = pen.measureText(ch); m = { asc: t.actualBoundingBoxAscent / 100, desc: Math.max(0, t.actualBoundingBoxDescent / 100) }; } catch {}
        seen.set(ch, m);
      }
      return seen.get(ch);
    };
    const cap = glyph('H').asc;
    return { cap: cap > 0.3 && cap < 1 ? cap : 0.7, glyph };
  };

  const make = (root, opts = {}) => {
    const o = settings(opts || {});
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const quote = root.querySelector('.ott-quote');
    const obj = root.querySelector('.ott-object');
    if (!stage || !quote || !obj) return null;
    const note = root.querySelector('.ott-note');
    const credit = root.querySelector('.ott-credit');
    const front = obj.querySelector('.ott-object__img') || obj.querySelector('img');
    const model = read(quote);
    if (!model.length) return null;
    const plain = model.map((l) => l.a + l.sep + l.b).join(' ');

    root.dataset.mode = o.mode;
    let rimBar = null;
    if (o.mode === 'flip' && front) {
      front.classList.add('ott-object__img');
      if (!obj.querySelector('.ott-object__back')) {
        const back = front.cloneNode();
        back.className = 'ott-object__back';
        obj.append(back);
      }
      // the thickness: a few discs (or plates) of the edge colour stacked between the two faces, and a bar
      // across the middle for the moment it is exactly edge-on
      if (!obj.querySelector('.ott-object__disc')) {
        for (let j = 0; j < 5; j++) {
          const d = document.createElement('i');
          d.className = 'ott-object__disc';
          d.style.setProperty('--z', ((j - 2) * 0.4).toFixed(2));
          obj.append(d);
        }
      }
      rimBar = obj.querySelector('.ott-object__rim') || obj.appendChild(Object.assign(document.createElement('i'), { className: 'ott-object__rim' }));
      root.dataset.edge = o.edge;
      if (o.rim) root.style.setProperty('--ott-rim', o.rim);
      root.style.setProperty('--ott-thick', String(o.thick));
    }
    // the picture's proportions inside the object's square box (for the faces and the edge): the width and
    // height attributes when given (a photo cropped square by the page keeps a square box), else the file's
    const aspect = () => {
      const w = (front && (+front.getAttribute('width') || front.naturalWidth)) || 1;
      const h = (front && (+front.getAttribute('height') || front.naturalHeight)) || 1;
      root.style.setProperty('--ott-pwk', (w >= h ? 1 : w / h).toFixed(4));
      root.style.setProperty('--ott-phk', (w >= h ? h / w : 1).toFixed(4));
    };
    aspect();
    // decode before anything moves
    for (const img of obj.querySelectorAll('img')) if (img.decode) img.decode().then(aspect).catch(() => {});

    // how many lines break (exit 'break'): `shatter`, but two lines in five stay whole and readable
    // through the break, so a short quote never turns entirely into flying letters
    const shatterOf = (n) => clamp(Math.min(o.shatter, n - Math.max(1, Math.ceil(0.4 * n))), 1, n);

    const S = { live: false, posed: false, phone: false, key: '', geo: null, fonts: 0, ver: 0, putVer: -1, tl: null, lines: [], A: [], B: [], side: [], cut: [], L: [], on: [], put: null, setX: null, x: [], op: [], rimOp: NaN };

    // A half's letters, one span each, laid over the half's own text and shown only while the line is
    // broken (exit 'break'); hidden from screen readers and from copying, so the sentence is said once.
    const letterBox = (half, i) => {
      const box = document.createElement('span');
      box.className = 'ott-chs';
      box.setAttribute('aria-hidden', 'true');
      const text = half.textContent;
      let off = 0;
      for (const ch of text) {
        if (!/\s/.test(ch)) {
          const el = document.createElement('span');
          el.className = 'ott-ch';
          el.textContent = ch;
          box.append(el);
          S.L.push({ el, i, half, off, len: ch.length, ch, tr: '' });
        }
        off += ch.length;
      }
      half.append(box);
    };

    // Build the lines (once per set of lines): each a <p> with its two halves and the real space between.
    const render = (lines) => {
      const sig = JSON.stringify(lines);
      if (quote.dataset.sig !== sig) {
        quote.textContent = '';
        S.L = [];
        const cut = lines.some((l) => l.b && !l.sep);
        const breaking = o.exit === 'break' ? shatterOf(lines.length) : 0;
        lines.forEach((l, i) => {
          const p = document.createElement('p');
          p.className = 'ott-line';
          // at tight leading a line's glyph box reaches into the next line's: earlier lines stack on top, so
          // what lies over the foot of a line is its own ink, never the next line's empty glyph box
          p.style.zIndex = String(lines.length - i);
          const a = document.createElement('span');
          a.className = 'ott-half ott-half--a';
          a.textContent = l.a;
          p.append(a);
          let b = null;
          if (l.b) {
            b = document.createElement('span');
            b.className = 'ott-half ott-half--b';
            b.textContent = l.b;
            p.append(document.createTextNode(l.sep), b);
          }
          // words cut in two read badly aloud: the lines are hidden and the sentence is given whole
          if (cut) p.setAttribute('aria-hidden', 'true');
          quote.append(p);
          if (i >= lines.length - breaking) { letterBox(a, i); if (b) letterBox(b, i); }
        });
        if (cut) {
          const sr = document.createElement('span');
          sr.className = 'ott-sr';
          sr.textContent = plain;
          quote.append(sr);
        }
        quote.dataset.sig = sig;
        S.ver++;
      }
      S.lines = [...quote.querySelectorAll(':scope > .ott-line')];
      S.A = S.lines.map((p) => p.querySelector('.ott-half--a'));
      S.B = S.lines.map((p) => p.querySelector('.ott-half--b'));
      S.cut = lines.map((l) => !!(l.b && !l.sep));
      S.on = S.lines.map(() => false);
      // a line of one short word steps aside whole; consecutive ones go to opposite sides
      let turn = 0;
      S.side = S.B.map((b) => (b ? 0 : (turn++ % 2 ? 1 : -1)));
    };

    // Everything the script moved goes back to the stylesheet's place.
    const clear = () => {
      const els = [quote, obj, credit, rimBar, ...S.lines, ...S.A, ...S.B].filter(Boolean);
      if (window.gsap) gsap.set(els, { clearProps: 'transform,opacity,visibility' });
      else for (const el of els) { el.style.transform = ''; el.style.opacity = ''; el.style.visibility = ''; }
      for (const L of S.L) { L.el.style.transform = ''; L.el.style.opacity = ''; L.tr = ''; L.op = ''; }
      obj.style.zIndex = '';
      for (const l of S.lines) l.classList.remove('is-broken');
      S.on = S.lines.map(() => false);
    };

    // Phone lines: the author's phrases packed into lines as wide as the phone allows. Each wrap is set at
    // the largest size its lines fit the width, the height and (parted) the stage at; a wrap scores by
    // that size and by how much of the screen's height its wall fills, and wraps that would cut a word or
    // strand a short one are penalised, so two words share a line wherever they fit.
    const phoneLines = (W, room, lh, cap, fill, settle, k, above) => {
      // the author's phrases (the halves), each marked when it starts one of the author's lines
      const units = model.flatMap((l) => (l.b && l.sep ? [{ ws: l.a.split(' '), start: true }, { ws: l.b.split(' ') }] : [{ ws: (l.a + l.sep + l.b).split(' '), start: true }]));
      const probe = document.createElement('p');
      probe.className = 'ott-line';
      probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;margin:0';
      const spans = [];
      units.forEach((u) => u.ws.forEach((w) => {
        if (spans.length) probe.append(' ');
        const s = document.createElement('span');
        s.className = 'ott-half';
        s.textContent = w;
        probe.append(s);
        spans.push(s);
      }));
      quote.append(probe);
      const rs = spans.map((s) => s.getBoundingClientRect());
      probe.remove();
      const sp = rs.length > 1 ? rs.slice(1).reduce((a, r, j) => a + (r.left - rs[j].right), 0) / (rs.length - 1) / 100 : 0.25;
      let q = 0;
      for (const u of units) { u.w = u.ws.map(() => rs[q++].width / 100); u.width = u.w.reduce((a, b) => a + b, 0) + sp * (u.ws.length - 1); }
      // greedy, either across the author's line breaks or keeping them (then only splitting a line)
      const pack = (max, keep) => {
        const out = [];
        let cur = [], cw = 0;
        const add = (t, w) => {
          if (cur.length && cw + sp + w > max) { out.push(cur.join(' ')); cur = []; cw = 0; }
          cw = cur.length ? cw + sp + w : w;
          cur.push(t);
        };
        for (const u of units) {
          if (keep && u.start && cur.length) { out.push(cur.join(' ')); cur = []; cw = 0; }
          if (u.width <= max) add(u.ws.join(' '), u.width);
          else for (let j = 0; j < u.ws.length; j++) { if (u.w[j] > max) return null; add(u.ws[j], u.w[j]); }
        }
        if (cur.length) out.push(cur.join(' '));
        return out;
      };
      // a wrap's closed lines in type sizes, for partLimit
      const wordW = new Map();
      units.forEach((u) => u.ws.forEach((w, j) => wordW.set(w, u.w[j])));
      const widthOf = (t) => t.split(' ').reduce((a, w, j) => a + (j ? sp : 0) + (wordW.get(w) || 0.6 * w.length), 0);
      const parted = new Map();
      const partOf = (lines) => {
        const key = lines.join('|');
        if (!parted.has(key)) {
          let turn = 0;
          const side = [];
          const ref = lines.map((t) => {
            const s = split(t);
            const whole = widthOf(t);
            const aw = s.b && !s.sep ? (whole * [...s.a].length) / [...t].length : widthOf(s.a);
            const gap = s.b && s.sep ? sp : 0;
            const lw = s.b ? (s.sep ? aw + gap + widthOf(s.b) : whole) : aw;
            side.push(s.b ? 0 : (turn++ % 2 ? 1 : -1));
            return { le: -lw / 2, re: lw / 2, sp: s.b ? -lw / 2 + aw + gap / 2 : 0, aw };
          });
          parted.set(key, partLimit(ref, lines.map((_, i) => i * lh), lh, side, k, W, true, above));
        }
        return parted.get(key);
      };
      // every wrap from the narrowest (a word or two a line) to the widest, each set at the largest size
      // its widest line, its parted lines and the height allow
      let best = null;
      const seen = new Set();
      for (let m = 1.2; m <= (fill * W) / Math.max(16, 0.08 * W); m += 0.05) for (const keep of [true, false]) {
        const lines = pack(m, keep);
        if (!lines) continue;
        const sig = lines.join('|');
        if (seen.has(sig)) continue;
        seen.add(sig);
        const n = lines.length;
        const Fw = Math.min(0.2 * W, (fill * W) / Math.max(...lines.map(widthOf)));
        const { F: Fe, travel } = settle(Math.min(Fw, partOf(lines)), n, (n - 1) * lh + cap, room, lh, cap);
        const cuts = lines.filter((t) => !t.includes(' ') && letters(t) >= 6).length;
        const lone = lines.filter((t) => !t.includes(' ') && letters(t) < 6).length;
        // how much of the room the wall fills: a band across the middle third scores less than a wall
        // that stands from top to bottom at nearly the same size
        const cover = clamp((((n - 1) * lh + cap) * Fe) / (0.72 * room), 0, 1);
        // the author's own lines win a near tie, so the phone keeps the desktop's phrasing when it can
        const own = lines.length === model.length && lines.every((t, i) => t === norm(model[i].a + model[i].sep + model[i].b));
        const score = Fe * (0.4 + 0.6 * cover) * (1 - 0.3 * cuts - 0.06 * lone) * (travel ? 0.85 : 1) * (own ? 1.04 : 1);
        if (!best || score > best.score + 1e-6) best = { score, lines };
      }
      return best ? best.lines.map(split) : model;
    };

    // The largest type size at which parted lines stay on the stage, sampled over the whole fall (all in
    // type sizes, so it holds at any size): lines open in the first frame stay inside the page margins; a
    // line the object sits in, the one being read, stays inside half a margin; a line only partly open
    // may pass the stage edge by `allow` (5% of the width, 24px on the phone). A word that steps aside
    // fits on one side of the object.
    const partLimit = (ref, cyE, Pm, side, k, W, phone, above) => {
      const n = ref.length, r1 = k / 2, R = o.radius * r1;
      const gut = Math.max(16, 0.04 * W), allow = phone ? 24 : 0.05 * W;
      const gE = { cx: 0, r: r1, P: Pm, n, cy: cyE, sp: ref.map((r) => r.sp), aw: ref.map((r) => r.aw), side, push: phone ? o.phonePush : o.push };
      gE.fx = ref.map((r, i) => (side[i] ? 0 : o.follow * r.sp));
      let F = Infinity;
      ref.forEach((r, i) => { if (side[i]) F = Math.min(F, (W / 2 - gut) / (r.aw + ASIDE * r1 + 0.1)); });
      const yS = cyE[0] - above, steps = 6 * n;
      for (let j = 0; j <= steps; j++) {
        const yb = yS + ((cyE[n - 1] - yS) * j) / steps;
        const xo = leanAt(gE, yb);
        for (let i = 0; i < n; i++) {
          if (side[i]) continue;
          const [xa, xb] = wakeAt(gE, yb, 1, xo, i);
          const ext = Math.max(-(ref[i].le + xa), ref[i].re + xb);
          const d = yb - cyE[i], f = d * d < R * R ? Math.pow(1 - (d * d) / (R * R), o.falloff) : 0;
          const lim = j === 0 ? W / 2 - gut : W / 2 + allow * (1 - f) - (gut / 2) * f;
          if (ext > 0) F = Math.min(F, lim / ext);
        }
      }
      return F;
    };

    // The wake of line i: where its halves sit and how much ink it has, a pure function of where the
    // object is in the wall (yb: its centre in the wall's own coordinates), its scale s and its x offset
    // xo. Scrubbing back is exact, and the poster frame is the same picture held still. g may be in px or
    // in type sizes (em); gut, the page margin, only in px (and with it the stage edges are known).
    const wakeAt = (g, yb, s, xo, i, gut) => {
      // as the object swells the halves part with it, but the wake's reach grows only half as fast, so the
      // lines slam shut right behind it as it drops
      const r = g.r * s, R = o.radius * g.r * (1 + (s - 1) / 2), R2 = R * R;
      const d = yb - g.cy[i];
      const f = d * d < R2 ? Math.pow(1 - (d * d) / R2, o.falloff) : 0;
      let xa = 0, xb = 0;
      const ox = g.cx + xo;
      if (g.side[i]) {
        // a short word steps aside whole, never past the page margin
        const c = g.sp[i], half = g.aw[i] / 2;
        let want = g.side[i] < 0 ? Math.min(0, ox - ASIDE * r - (c + half)) : Math.max(0, ox + ASIDE * r - (c - half));
        if (gut != null) want = g.side[i] < 0 ? Math.max(want, gut - (c - half)) : Math.min(want, g.W - gut - (c + half));
        xa = want * smooth(clamp(f / 0.5, 0, 1));
      } else {
        // the bias moves the gap onto the object even when the word gap is not where the object falls
        // (eagerly: a gap is centred on the object before the line is fully open, so a round object that
        // swings toward the next line's gap never clips the letters of the line it is leaving)
        const bias = (ox - g.sp[i]) * smooth(clamp(f / 0.55, 0, 1)), p = g.push * r * (1 + 0.5 * (s - 1)) * f;
        xa = bias - p;
        xb = bias + p;
        // as the object swells on its way out the halves are thrown wider, but never past the stage edge,
        // so no word is left standing half cut: each half stops half a margin inside it (or where it
        // already was at full size, if that was further out)
        if (s > 1 && gut != null && g.le) {
          const p1 = g.push * g.r * Math.pow(Math.max(0, 1 - (d * d) / Math.pow(o.radius * g.r, 2)), o.falloff);
          xa = Math.max(xa, Math.min(bias - p1, gut / 2 - g.le[i]));
          xb = Math.min(xb, Math.max(bias + p1, g.W - gut / 2 - g.re[i]));
        }
      }
      // ink: from half a line above the line to its centre, and it stays
      const ink = smooth(clamp(1 + d / (0.5 * g.P), 0, 1));
      return [xa, xb, ink];
    };
    // The object's x offset at depth yb: it leans toward each line's own gap (by `follow`) and eases from
    // one to the next between lines, so it moves straight down at every line it sits in.
    const leanAt = (g, yb) => {
      const n = g.n;
      if (!o.follow) return 0;
      if (yb <= g.cy[0] || n < 2) return g.fx[0];
      if (yb >= g.cy[n - 1]) return g.fx[n - 1];
      let i = 0;
      while (i < n - 2 && yb > g.cy[i + 1]) i++;
      const t = (yb - g.cy[i]) / (g.cy[i + 1] - g.cy[i] || 1);
      return g.fx[i] + (g.fx[i + 1] - g.fx[i]) * (1 - Math.cos(Math.PI * t)) / 2;
    };

    // The throw (exit 'break'): for every letter of the breaking lines, where it flies, how it turns and
    // when, all dealt from the seed and the measured geometry, so the frame at any progress is fixed.
    // The deal is then played through in small steps of progress before it is kept: a letter's throw is
    // taken only when, all the way out and home, its glyph box stays on the stage, below the words of
    // the lines that stay whole, and off every other flying letter (and theirs off it), so no two texts
    // are ever drawn over each other. A letter whose dealt throw would touch another tries a gentler or
    // a turned one; one that finds no clean way flies a short way and fades while it is out. The object
    // is drawn behind the burst from the moment the wall breaks, so it never lies on a letter.
    const throwOf = (g, Lm, cap) => {
      const { W, H, n, cx, cy, F } = g;
      const rand = seeded(o.seed);
      const N = shatterOf(n);
      const M = Math.max(W, H);
      const ox = cx + g.fx[n - 1], oy = cy[n - 1] + g.byA;   // the object's centre as it breaks the wall
      // the giants: one of the two widest letters of each half of the last line, each swelling on its
      // own half's side of the stage
      const halves = [S.A[n - 1], S.B[n - 1]].filter(Boolean);
      const giants = new Map();
      for (let k = 0; k < o.giants; k++) {
        const h = halves[k % halves.length];
        const cand = S.L.map((L, j) => j).filter((j) => S.L[j].half === h && /\p{L}/u.test(S.L[j].ch) && !giants.has(j));
        cand.sort((a, b) => Lm[b].w - Lm[a].w || a - b);
        if (!cand.length) continue;
        giants.set(cand[Math.floor(rand() * Math.min(2, cand.length))], h === S.B[n - 1] ? 1 : -1);
      }
      const whole = n - 1 - N;
      // each letter's draw from the seed, its timing, and how hard it is thrown (harder the nearer the
      // object)
      const deal = S.L.map((L, j) => {
        const u = Array.from({ length: 9 }, rand);
        const lx = Lm[j].x, ly = cy[L.i] + g.byA;
        const vx = lx - ox, vy = ly - oy, d0 = Math.hypot(vx, vy);
        const k = n - 1 - L.i, e = Math.pow(Math.max(0, 1 - (k / N) * (k / N)), 1.5);
        let t;
        if (giants.has(j)) {
          const first = giants.get(j) < 0 || giants.size < 2;
          // a giant dims in its place as the burst leaves, then travels and swells (late, once it has
          // drawn away from the line)
          t = { t0: BREAK + 0.008, t1: BREAK + (first ? 0.09 : 0.085), b0: first ? 0.7 : 0.694, b1: HOME };
        } else {
          // the burst leaves all at once and comes home all at once: one timing, so no letter closes
          // on a neighbour that has not left yet or is already home
          t = { t0: BREAK + 0.002, t1: BREAK + 0.077, b0: 0.708, b1: HOME - 0.002 };
        }
        return { u, vx, vy, d0, e, ...t };
      });
      // a line breaks when its first letter leaves
      const brk0 = [];
      deal.forEach((d, j) => { const i = S.L[j].i; brk0[i] = Math.min(brk0[i] ?? 1, d.t0); });

      // the steps of progress the throw is played through, and where the wall stands at each
      const ps = [];
      for (let p = BREAK; p < HOME + 0.0012; p += 0.0025) ps.push(Math.min(p, HOME));
      const walls = ps.map((p) => wallAt(g, p));
      // where each half of a breaking line stands (the wake's place): at each step until the line breaks,
      // and when it breaks; its letters keep that place until they turn home
      const halfX = new Map();
      const placeOf = (i, sd) => {
        const key = i * 2 + sd;
        if (!halfX.has(key)) halfX.set(key, { at: ps.map((p) => (p < brk0[i] ? halfAt(g, i, sd, p) : 0)), x0: halfAt(g, i, sd, brk0[i]) });
        return halfX.get(key);
      };
      const shiftAt = (j, f, k) => {
        const L = S.L[j], X = placeOf(L.i, L.half === S.B[L.i] ? 1 : 0), p = ps[k];
        return p < brk0[L.i] ? X.at[k] : X.x0 * keep(f, p);
      };
      // a letter on the screen at step k, turned and scaled about its own middle and carried by the
      // wall (its climb and, for a travelling wall, its pull-back): its glyph box (the box its words are
      // read in) and its own box, turned (where it is hit; glyph boxes of tightly set lines overlap,
      // their own boxes only touch)
      const boxAt = (j, f, k) => {
        const L = Lm[j], p = ps[k], [a, as, ar] = thrown(f, p);
        const th = (f.rot * ar * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
        const w = walls[k], sc = (1 + (f.sc - 1) * as) * w.sq;
        const px = W / 2 + (L.px + shiftAt(j, f, k) + f.dx * a - W / 2) * w.sq, py = H / 2 + (L.py + f.dy * a - H / 2) * w.sq + w.by;
        let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
        for (let q = 0; q < 4; q++) {
          const x = q & 1 ? L.q[2] : L.q[0], y = q & 2 ? L.q[3] : L.q[1];
          const X = (x * c - y * s) * sc, Y = (x * s + y * c) * sc;
          if (X < l) l = X; if (X > r) r = X; if (Y < t) t = Y; if (Y > b) b = Y;
        }
        // a turn in depth (and its perspective) can draw a letter a little larger than its flat box
        const grow = 1 + (f.pin ? 0.03 : 0.08) * Math.min(1, a);
        return {
          l: px + l, r: px + r, t: py + t, b: py + b, x: px, y: py, c, s, hw: (L.ow / 2) * sc, hh: (L.oh / 2) * sc, grow,
          fs: (f.pin ? Math.max(1, f.sc) : 1) * F, op: inkOf(f, a, p),
        };
      };
      // inside a letter's own (turned) box, and inside its glyph box
      const hits = (B, x, y, k = 1) => {
        const dx = x - B.x, dy = y - B.y, u = dx * B.c + dy * B.s, v = -dx * B.s + dy * B.c;
        return Math.abs(u) <= B.hw * k + 0.5 && Math.abs(v) <= B.hh * k + 0.5;
      };
      const inGlyph = (B, x, y, k = 1) => { const e = (k - 1) * Math.max(B.r - B.l, B.b - B.t) + 0.5; return x >= B.l - e && x <= B.r + e && y >= B.t - e && y <= B.b + e; };
      // the points the eye (and the scene check) reads a line of words at: across its glyph box, at a
      // third, half and two thirds of its height, where the letter itself is
      const pts = (bx) => {
        if (bx.pts) return bx.pts;
        const w = bx.r - bx.l, h = bx.b - bx.t, out = [];
        const nx = Math.max(2, Math.min(16, Math.round(w / Math.max(12, bx.fs * 0.7))));
        const ys = bx.fs >= 40 ? [0.3, 0.5, 0.7] : [0.3, 0.7];
        for (let i = 0; i < nx; i++) for (const fy of ys) { const x = bx.l + (w * (i + 0.5)) / nx, y = bx.t + h * fy; if (hits(bx, x, y)) out.push(x, y); }
        return (bx.pts = out);
      };
      // one letter lies on another's words: one of the points it is read at is inside the other's own box
      // and glyph box
      const onto = (A, B) => { const P = pts(A); for (let i = 0; i < P.length; i += 2) if (hits(B, P[i], P[i + 1], B.grow) && inGlyph(B, P[i], P[i + 1], B.grow)) return true; return false; };
      const clash = (A, B) => A.op >= 0.25 && B.op >= 0.25 && !(A.r < B.l - 40 || B.r < A.l - 40 || A.b < B.t - 40 || B.b < A.t - 40) && (onto(A, B) || onto(B, A));
      // the foot of the whole lines (their own boxes), on the screen at step k
      const foot = whole >= 0 ? g.band[whole][1] : -Infinity;
      const floorAt = (k) => H / 2 + (foot - H / 2) * walls[k].sq + walls[k].by;
      const low = (bx) => { const P = pts(bx); let m = Infinity; for (let i = 1; i < P.length; i += 2) m = Math.min(m, P[i]); return m; };
      // a throw played through: its boxes at every step, or null where it leaves the stage, rises into
      // the whole lines or touches a letter already placed
      const placed = [];
      // every letter at its place while it waits to leave and once it is home: a throw must keep off
      // those too, also for letters not placed yet
      const homes = S.L.map((_, m) => { const d = deal[m], f = { pin: false, dx: 0, dy: 0, rot: 0, sc: 1, t0: d.t0, t1: d.t1, b0: d.b0, b1: d.b1 }; return ps.map((p, k) => boxAt(m, f, k)); });
      const waiting = S.L.map((_, m) => ps.map((p, k) => (p <= deal[m].t0 || p >= deal[m].b1 ? homes[m][k] : null)));
      const free = new Set(S.L.map((_, m) => m));
      const play = (j, f, loose) => {
        const boxes = [];
        for (let k = 0; k < ps.length; k++) {
          const bx = boxAt(j, f, k);
          boxes.push(bx);
          if (bx.op < 0.25 || loose) continue;
          const b0 = homes[j][k];
          if (bx.l < Math.min(2, b0.l) || bx.r > Math.max(W - 2, b0.r) || bx.b > Math.max(H - 2, b0.b)) return null;
          if (low(bx) < Math.min(floorAt(k), low(b0)) - 0.5) return null;
          for (const [m, P] of placed) if (clash(bx, P[k])) return null;
          for (const m of free) if (m !== j && waiting[m][k] && clash(bx, waiting[m][k])) return null;
        }
        return boxes;
      };
      const out = new Array(S.L.length);
      const keepThrow = (j, f, boxes) => { const L = S.L[j]; f.x0 = placeOf(L.i, L.half === S.B[L.i] ? 1 : 0).x0; out[j] = f; placed.push([j, boxes]); free.delete(j); };
      // the giants first: swelling low on their own side, inside the stage and under the whole lines, set
      // back in a faint tone while they are swollen; the first one large, the next one smaller and higher,
      // so the two never read as a pair of initials. A giant that cannot swell clear of the whole lines and
      // the stage's edges is thrown as a letter.
      for (const [j, side] of giants) {
        const d = deal[j], u = d.u, L = Lm[j];
        const first = side < 0 || giants.size < 2;
        const rot = side * (first ? 4 + 6 * u[2] : 10 + 8 * u[2]);
        const capT0 = (first ? 0.42 + 0.08 * u[0] : 0.27 + 0.06 * u[0]) * Math.min(H, 1.3 * W);
        const k1 = Math.min(ps.length - 1, Math.max(0, Math.round((d.t1 - BREAK) / 0.0025)));
        const X0 = placeOf(S.L[j].i, side > 0 ? 1 : 0).x0;
        const th = (rot * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
        // as large as the room under the whole lines allows (the second one stands a quarter higher)
        let h1 = 0;
        { let t = Infinity, b = -Infinity; for (let q = 0; q < 4; q++) { const x = q & 1 ? L.q[2] : L.q[0], y = q & 2 ? L.q[3] : L.q[1], Y = (x * s + y * c) * 1.06; t = Math.min(t, Y); b = Math.max(b, Y); } h1 = b - t; }
        const room = H - 10 - floorAt(k1) - 4;
        const sc0 = Math.min(capT0 / (cap * F), room / (h1 * (first ? 1 : 1.25)));
        for (const shrink of [1, 0.9, 0.8, 0.7, 0.6, 0.5]) {
          const sc = sc0 * shrink;
          if (sc < 1.4) break;
          let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
          for (let q = 0; q < 4; q++) {
            const x = q & 1 ? L.q[2] : L.q[0], y = q & 2 ? L.q[3] : L.q[1];
            const X = (x * c - y * s) * sc * 1.06, Y = (x * s + y * c) * sc * 1.06;
            if (X < l) l = X; if (X > r) r = X; if (Y < t) t = Y; if (Y > b) b = Y;
          }
          const tx = clamp(W / 2 + side * (first ? 0.2 + 0.06 * u[1] : 0.25 + 0.06 * u[1]) * W, 4 - l, W - 4 - r);
          const ty = H - 6 - b - (first ? 0 : 0.25 * (b - t));
          // faint as it is, a giant never stands behind the lines that stay whole
          if (ty + t < floorAt(k1) + 4) continue;
          const f = { pin: true, dx: (tx - L.px - X0) / 1.03, dy: (ty - walls[k1].by - L.py) / 1.03, rot, rx: 0, ry: -side * (12 + 14 * u[3]), sc, t0: d.t0, t1: d.t1, b0: d.b0, b1: d.b1, persp: 4 * M };
          const boxes = play(j, f, false);
          if (boxes) { keepThrow(j, f, boxes); break; }
        }
      }
      // then every other letter. The block of breaking lines opens like a fan from its top edge above the
      // object: each letter flies out along its own ray from there (a little sideways, as far down as the
      // stage allows), shrinking into depth and turning as it goes, all on one timing, so neighbours only
      // ever draw apart. A letter whose flight would still touch a giant tries a gentler one.
      const normal = S.L.map((_, j) => j).filter((j) => !out[j]);
      if (normal.length) {
        const top = whole >= 0 ? g.band[whole][1] : Math.min(...normal.map((j) => Lm[j].py - Lm[j].oh / 2));
        const cxA = ox;
        const m = Math.max(4, g.gut / 2);
        let rl = 1, rr = 1, foot = top + 1;
        for (const j of normal) {
          const L = Lm[j], x0 = placeOf(S.L[j].i, S.L[j].half === S.B[S.L[j].i] ? 1 : 0).x0;
          rl = Math.max(rl, cxA - (L.px + x0 - L.ow / 2)); rr = Math.max(rr, L.px + x0 + L.ow / 2 - cxA);
          foot = Math.max(foot, L.py + L.oh / 2);
        }
        const kT = Math.min(ps.length - 1, Math.round((deal[normal[0]].t1 - BREAK) / 0.0025));
        const Kx = clamp(Math.min((cxA - m) / rl, (W - m - cxA) / rr), 1, 1.25);
        const Ky = clamp((H - 8 - walls[kT].by - top) / (foot - top), 1, 2.4);
        const order = normal.sort((a, b) => deal[a].d0 - deal[b].d0 || a - b);
        for (const j of order) {
          const d = deal[j], u = d.u, e = d.e, L = Lm[j];
          const x0 = placeOf(S.L[j].i, S.L[j].half === S.B[S.L[j].i] ? 1 : 0).x0;
          const base = {
            pin: false, dx: (L.px + x0 - cxA) * (Kx - 1), dy: (L.py - top) * (Ky - 1),
            rot: (u[6] * 2 - 1) * 160 * Math.sqrt(e), rx: (u[7] * 2 - 1) * 100 * e, ry: (u[8] * 2 - 1) * 240 * e,
            sc: 0.5 + 0.2 * u[2], t0: d.t0, t1: d.t1, b0: d.b0, b1: d.b1, persp: Math.max(500, 6 * F),
          };
          let done = false;
          for (const rf of [1, 0.5, 0.2]) {
            for (const mf of [1, 0.85, 0.7, 0.5, 0.3, 0]) {
              const f = { ...base, dx: base.dx * mf, dy: base.dy * mf, rot: base.rot * rf, rx: base.rx * rf, ry: base.ry * rf, sc: rf < 1 ? Math.min(base.sc, 0.5) : base.sc };
              const boxes = play(j, f, false);
              if (boxes) { keepThrow(j, f, boxes); done = true; break; }
            }
            if (done) break;
          }
          if (!done) {
            // no clean way out: it stays near its place, shrinks into depth and fades while it is out
            const f = { ...base, dx: base.dx * 0.3, dy: base.dy * 0.3, sc: 0.5, rot: base.rot * 0.3, rx: base.rx * 0.3, ry: base.ry * 0.3, fade: true };
            keepThrow(j, f, play(j, f, true));
          }
        }
      }
      return out;
    };
    // how much ink a thrown letter keeps: a giant falls back to a faint tone (under a quarter of the ink)
    // as it draws away from the line, so the burst reads over it; a letter with no clean way out fades
    // (a giant dims in its place before it leaves and lights up again only once it is home)
    const inkOf = (f, a, p) => (f.pin ? 1 - 0.78 * Math.min(smooth(clamp((p - BREAK - 0.002) / 0.004, 0, 1)), smooth(clamp((f.b1 - 0.001 - p) / 0.005, 0, 1))) : f.fade ? clamp(1 - a / 0.3, 0, 1) : 1);
    // how much of its parted place a thrown letter keeps (it flies out from where its half stood when
    // the line broke, and back to the closed line)
    const keep = (f, p) => (p < f.b0 ? 1 : p >= f.b1 ? 0 : 1 - inOut3((p - f.b0) / (f.b1 - f.b0)));
    // where the wall stands at progress p: its climb and, at the end of a travelling wall, the scale of
    // its pull-back about the stage centre (the timeline's own curves)
    const wallAt = (g, p) => {
      if (p <= TRAVEL) return { by: g.by0 + ((g.byA - g.by0) * p) / TRAVEL, sq: 1 };
      if (p <= FIT0) return { by: g.byA + ((g.byE - g.byA) * (p - TRAVEL)) / (FIT0 - TRAVEL), sq: 1 };
      if (p <= FIT1) { const t = (p - FIT0) / (FIT1 - FIT0), e = g.travel ? inOut3(t) : t; return { by: g.byE + (g.byM - g.byE) * e, sq: 1 + (g.scale - 1) * e }; }
      return { by: g.byM + ((g.by1 - g.byM) * (p - FIT1)) / (1 - FIT1), sq: g.scale };
    };
    // the object in its exit (power3.in down, power2.out swelling), and the place the wake gives half sd
    // of line i at progress p
    const objAt = (g, p) => { const t = clamp((p - TRAVEL) / EXIT, 0, 1); return { y: g.yA + (g.yEnd - g.yA) * t ** 4, s: 1 + (o.grow - 1) * out3(t) }; };
    const halfAt = (g, i, sd, p) => {
      const ob = objAt(g, p), w = wallAt(g, p);
      const yb = (ob.y - w.by - g.H / 2) / w.sq + g.H / 2;
      return wakeAt(g, yb, ob.s, leanAt(g, yb), i, g.gut)[sd] || 0;
    };
    // how far along its throw a letter is at progress p: out (power3.out), drifting on, home (power3.inOut);
    // and how much of its swell it keeps (a giant shrinks back sooner than it travels, so two giants
    // flying home never stack into one blot)
    // and how far it has turned (a letter turns once it is under way, so it has drawn clear of its
    // neighbours before it spins)
    const thrown = (f, p) => {
      if (p <= f.t0 || p >= f.b1) return [0, 0, 0];
      if (p < f.t1) { const a = out3((p - f.t0) / (f.t1 - f.t0)); return [a, f.pin ? a * a * a : a, f.pin ? a : a * a]; }
      if (p < f.b0) { const a = 1 + (0.06 * (p - f.t1)) / (f.b0 - f.t1); return [a, 1, a]; }
      const a = 1 - inOut3((p - f.b0) / (f.b1 - f.b0));
      return [1.06 * a, f.pin ? Math.pow(a, 2.5) : a, f.pin ? 1.06 * a : 1.06 * a * a];
    };

    // Type size and geometry, measured with every transform cleared.
    const measure = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      const phone = S.phone, posed = S.posed;
      const k = phone ? o.phoneSize : o.size;
      const fill = phone ? o.phoneFill : o.fill;
      const D = posed ? 0 : (phone ? o.phoneDrift : o.drift) * H;
      const gut = Math.max(16, 0.04 * W);
      // a size limited by the width (Fw) against the height: the whole block fits the stage (one wall), or,
      // for more than 7 lines (8 on the phone) that would have to shrink by more than 15% to fit, six lines
      // fit and the wall travels through the stage
      const settle = (Fw, n, blockE, room, lh, cap) => {
        const fit = room / blockE, win = room / (5 * lh + cap);
        const travel = !posed && (o.travel === true || (o.travel === 'auto' && n > (phone ? PHONE_WALL : WALL) && fit < 0.85 * Fw));
        return { F: Math.min(Fw, travel ? win : fit), travel };
      };
      root.classList.add('ott-measure');
      root.style.setProperty('--ott-F', '100px');
      for (const l of S.lines) l.style.marginTop = '';
      const st0 = stage.getBoundingClientRect();
      const cxA = st0.left + W / 2;
      // the block clears the top edge (and a note) at the start, and the credit at the end
      const base = 0.04 * H + 14;
      const topE = note ? Math.max(base, note.getBoundingClientRect().bottom - st0.top + 14) : base;
      const credE = credit ? Math.max(base, st0.bottom - credit.getBoundingClientRect().top + 14) : base;
      const room = H - 2 * Math.max(topE + D, credE - D);
      const lh = parseFloat(getComputedStyle(quote).lineHeight) / 100 || (phone ? 0.9 : 0.88);
      const fc = face(quote);
      const cap = fc.cap;

      const above0 = o.enter === 'inside' ? 0 : cap / 2 + 0.525 * k + 0.08;
      render(phone && o.reflow ? phoneLines(W, room, lh, cap, fill, settle, k, above0) : model);
      for (const l of S.lines) l.style.marginTop = '';
      const n = S.lines.length;

      // closed lines at 100px: edges, the gap, the halves (in type sizes from the stage centre)
      const ref = S.lines.map((l, i) => {
        const a = S.A[i].getBoundingClientRect(), b = S.B[i] ? S.B[i].getBoundingClientRect() : null;
        return {
          le: (a.left - cxA) / 100,
          re: ((b || a).right - cxA) / 100,
          sp: ((b ? (a.right + b.left) / 2 : (a.left + a.right) / 2) - cxA) / 100,
          aw: a.width / 100,
        };
      });
      // the leading opens only between two lines whose glyphs would touch: a comma or a tail over a
      // capital, an accent under a letter (the halves' own text; their letter layers are copies)
      const marks = S.lines.map((line) => {
        const out = [];
        const rg = document.createRange();
        const walk = document.createTreeWalker(line, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (t.parentElement && t.parentElement.closest('.ott-chs') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
        for (let t; (t = walk.nextNode());) {
          const s = t.textContent;
          for (let j = 0; j < s.length; j++) {
            if (/\s/.test(s[j]) || (s.charCodeAt(j) & 0xfc00) === 0xdc00) continue;
            rg.setStart(t, j);
            rg.setEnd(t, Math.min(s.length, j + ((s.charCodeAt(j) & 0xfc00) === 0xd800 ? 2 : 1)));
            const r = rg.getBoundingClientRect();
            const m = fc.glyph(s[j].toUpperCase());
            out.push({ x0: r.left / 100, x1: r.right / 100, asc: Math.max(m.asc, cap), desc: m.desc });
          }
        }
        return out;
      });
      const extra = [0];
      for (let i = 1; i < n; i++) {
        let need = 0;
        for (const g of marks[i - 1]) for (const h of marks[i]) {
          if (g.desc < 0.03 && h.asc < cap + 0.03) continue;
          if (g.x1 + 0.02 < h.x0 || h.x1 + 0.02 < g.x0) continue;
          need = Math.max(need, g.desc + h.asc + 0.03);
        }
        extra.push(Math.max(0, Math.round((need - lh) * 1000) / 1000));
      }
      const cyE = [];
      extra.reduce((acc, e, i) => { const y = i ? acc + lh + e : 0; cyE.push(y); return y; }, 0);
      const bh = cyE[n - 1] + cap;
      const Pm = n > 1 ? cyE[n - 1] / (n - 1) : lh;

      // type size
      let Fw = phone ? 0.2 * W : Math.min(0.111 * W, 0.178 * H);
      Fw = Math.min(Fw, (fill * W) / Math.max(0.01, ...ref.map((r) => r.re - r.le)));
      const r1 = k / 2;
      const above = o.enter === 'inside' && !S.cut[0] && !S.side[0] ? 0 : cap / 2 + 1.05 * r1 + 0.08;
      Fw = Math.min(Fw, partLimit(ref, cyE, Pm, S.side, k, W, phone, above));
      const fit = settle(Fw, n, bh, room, lh, cap);
      const travel = fit.travel;
      const F = Math.max(16, fit.F);
      root.style.setProperty('--ott-F', F.toFixed(2) + 'px');
      root.style.setProperty('--ott-S', (k * F).toFixed(2) + 'px');
      S.lines.forEach((l, i) => { l.style.marginTop = extra[i] ? extra[i] + 'em' : ''; });

      // the laid-out lines at that size: cap centres, gaps, halves, closed edges (stage px)
      const st = stage.getBoundingClientRect();
      const cy = [], sp = [], aw = [], le = [], re = [];
      S.lines.forEach((l, i) => {
        const probe = document.createElement('i');
        probe.className = 'ott-probe';
        l.append(probe);
        cy.push(probe.getBoundingClientRect().bottom - st.top - (cap * F) / 2);
        probe.remove();
        const a = S.A[i].getBoundingClientRect(), b = S.B[i] ? S.B[i].getBoundingClientRect() : null;
        sp.push((b ? (a.right + b.left) / 2 : (a.left + a.right) / 2) - st.left);
        aw.push(a.width);
        le.push(a.left - st.left);
        re.push((b || a).right - st.left);
      });
      // the letters of the breaking lines: each laid exactly over its own glyph (kerning kept); its middle
      // (the point it turns and swells about) and its glyph box about that middle, for the throw
      const rg = document.createRange();
      const Lm = S.L.map((L) => {
        const t = L.half.firstChild;
        L.el.style.fontSize = '';
        L.el.style.transformOrigin = '';
        if (!t || t.nodeType !== 3) return { x: 0, w: 0, l: 0, px: 0, py: 0, ow: 0, oh: 0, q: [0, 0, 0, 0] };
        rg.setStart(t, L.off);
        rg.setEnd(t, L.off + L.len);
        const r = rg.getBoundingClientRect(), hr = L.half.getBoundingClientRect();
        L.el.style.left = ((r.left - hr.left) / F).toFixed(4) + 'em';
        const box = L.el.parentNode.getBoundingClientRect();
        const px = box.left - st.left + L.el.offsetLeft + L.el.offsetWidth / 2, py = box.top - st.top + L.el.offsetTop + L.el.offsetHeight / 2;
        return {
          x: r.left + r.width / 2 - st.left, w: r.width, l: (r.left - hr.left) / F, px, py, ow: L.el.offsetWidth, oh: L.el.offsetHeight,
          q: [r.left - st.left - px, r.top - st.top - py, r.right - st.left - px, r.bottom - st.top - py],
        };
      });
      // the band each line's halves fill (their own boxes, top and foot), in the wall's own px
      const band = S.lines.map((l, i) => {
        let t0 = Infinity, b0 = -Infinity;
        for (const h of [S.A[i], S.B[i]]) {
          if (!h) continue;
          const q = h.getBoundingClientRect();
          t0 = Math.min(t0, q.top - st.top); b0 = Math.max(b0, q.bottom - st.top);
        }
        return [t0, b0];
      });
      root.classList.remove('ott-measure');
      const r = (k * F) / 2;
      const P = n > 1 ? (cy[n - 1] - cy[0]) / (n - 1) : lh * F;
      const cx = W / 2;
      // the wall's offset: a slow climb by 2D (one wall), or a climb past the object (a travelling wall:
      // line 1 where a six-line wall's first line would be, the last line where its sixth would be)
      let by0 = D, byA = D - 2 * D * TRAVEL;
      if (travel) {
        const win = (5 * lh + cap) * F;
        by0 = H / 2 - win / 2 + (cap * F) / 2 + D - cy[0];
        byA = H / 2 + win / 2 - (cap * F) / 2 + D - 2 * D * TRAVEL - cy[n - 1];
      }
      const by1 = byA - 2 * D * (1 - TRAVEL);
      const at = (t) => byA + ((by1 - byA) * (t - TRAVEL)) / (1 - TRAVEL);
      const byEnd = at(TRAVEL + EXIT);
      // after the exit: one wall keeps climbing; a travelling wall pulls back (scales down about the stage
      // centre) until the whole quote fits between the top margin and the credit, centred there
      let byE = at(FIT0), byM = at(FIT1), byZ = by1, scale = 1;
      if (travel) {
        const top = topE, bottom = H - credE;
        const block = cy[n - 1] - cy[0] + cap * F * 1.3;
        scale = Math.min(1, (bottom - top) / block);
        byM = (top + bottom) / 2 - H / 2 - ((cy[0] + cy[n - 1]) / 2 - H / 2) * scale;
        byZ = byM;
      }
      // entering from above, it drops into line 1 by `enter`, then meets one line every
      // (TRAVEL - enter) / (n - 1)
      const enter = above ? ENTER : 0;
      const g = {
        W, H, F, P, r, n, cx, cy, sp, aw, le, re, D, gut, travel, enter, capH: cap * F, band,
        side: S.side, push: phone ? o.phonePush : o.push,
        fx: sp.map((x, i) => (S.side[i] ? 0 : o.follow * (x - cx))),
        by0, byA, by1: byZ, byE, byM, scale,
        y0: cy[0] + by0 - above * F,
        y1: cy[0] + by0 + ((byA - by0) * ENTER) / TRAVEL,
        yA: cy[n - 1] + byA,
        // gone below the stage, and far enough past the last line that the wake has closed
        yEnd: Math.max(H + 1.1 * o.grow * r + 10, cy[n - 1] + byEnd + o.radius * r * (1 + (o.grow - 1) / 2) + 4),
      };
      g.fl = S.L.length && !posed ? throwOf(g, Lm, cap) : [];
      // a giant is set at its swollen size and scaled down to its glyph at rest, so the browser draws it
      // sharp at the size it is seen at (a small glyph scaled up six times is drawn soft on a phone)
      g.fl.forEach((f, j) => {
        if (!f.pin) return;
        const L = S.L[j];
        f.m = Math.max(1, f.sc);
        f.cx = Lm[j].ow / 2;
        f.cy = Lm[j].oh / 2;
        L.el.style.fontSize = f.m.toFixed(3) + 'em';
        L.el.style.left = ((Lm[j].l || 0) / f.m).toFixed(4) + 'em';
        L.el.style.transformOrigin = '0 0';
      });
      // the stretch of the scene each breaking line spends in letters
      g.brk = S.lines.map(() => null);
      g.fl.forEach((f, j) => {
        const i = S.L[j].i, b = g.brk[i] || (g.brk[i] = [1, 0]);
        b[0] = Math.min(b[0], f.t0);
        b[1] = Math.max(b[1], f.b1);
      });
      return g;
    };
    const key = () => `${stage.clientWidth}x${stage.clientHeight}|${S.fonts}|${S.phone ? 'p' : 'd'}|${S.posed ? 'r' : 'l'}`;
    const G = () => {
      const k = key();
      if (k !== S.key || !S.geo) { S.geo = measure(); S.key = key(); }
      return S.geo;
    };

    // the halves follow their places at once, or eased when `lag` is on; rebuilt when the lines change
    // and on every build (gsap.matchMedia reverts the old context, which kills these functions)
    const setters = () => {
      const one = (el) => {
        if (!el) return () => {};
        if (!o.lag) { const set = gsap.quickSetter(el, 'x', 'px'); return (v) => set(v); }
        const to = gsap.quickTo(el, 'x', { duration: o.lag, ease: 'power3.out' });
        return (v, now) => (now ? to(v, v) : to(v));
      };
      const fa = S.A.map(one), fb = S.B.map(one);
      S.x = S.lines.map(() => [NaN, NaN]);
      S.op = S.lines.map(() => NaN);
      S.put = (i, xa, xb, now) => {
        const x = S.x[i];
        if (now || x[0] !== xa) { fa[i](xa, now); x[0] = xa; }
        if (now || x[1] !== xb) { fb[i](xb, now); x[1] = xb; }
      };
      S.setX = gsap.quickSetter(obj, 'x', 'px');
      S.putVer = S.ver;
    };
    const wake = (now) => {
      const g = S.geo;
      if (!g || !S.live || !window.gsap) return;
      if (S.putVer !== S.ver || !S.put) setters();
      const yo = gsap.getProperty(obj, 'y'), s = gsap.getProperty(obj, 'scale') || 1;
      const by = gsap.getProperty(quote, 'y'), sq = gsap.getProperty(quote, 'scale') || 1;
      // the object's centre in the wall's own coordinates (the wall may be climbing and, at the end of a
      // travelling wall, scaled about the stage centre)
      const yb = (yo - by - g.H / 2) / sq + g.H / 2;
      const xo = leanAt(g, yb);
      S.setX(Math.round(xo * 10) / 10);
      const back = g.scale < 1 ? clamp((1 - sq) / (1 - g.scale), 0, 1) : 0;
      for (let i = 0; i < g.n; i++) {
        const [xa, xb, ink] = wakeAt(g, yb, s, xo, i, g.gut);
        S.put(i, Math.round(xa * 10) / 10, Math.round(xb * 10) / 10, now === true);
        let op = o.rest + (1 - o.rest) * ink;
        // a travelling wall: a line fades as the stage edge cuts into it, so no half-cut line is left
        // standing at the top or the bottom; as the wall pulls back every line comes back in full
        if (g.travel) {
          const c = g.H / 2 + (g.cy[i] - g.H / 2) * sq + by, h = (g.capH / 2) * sq;
          op *= Math.max(back, smooth(clamp(Math.min(c - h, g.H - c - h) / (0.45 * g.F * sq) + 0.15, 0, 1)));
        }
        // on the halves, not the line: each half is its own layer already, so a faded line costs no extra
        // offscreen surface in the compositor
        op = Math.round(op * 1000) / 1000;
        if (op !== S.op[i]) {
          const v = op >= 1 ? '' : String(op);
          S.A[i].style.opacity = v;
          if (S.B[i]) S.B[i].style.opacity = v;
          S.op[i] = op;
        }
      }
      // the break: the lines in letters while their throw lasts, each letter where its throw has it
      if (g.fl.length) {
        const p = S.tl ? S.tl.progress() : 0;
        const hx = new Map();
        S.lines.forEach((l, i) => {
          const on = !!g.brk[i] && p > g.brk[i][0] && p < g.brk[i][1];
          if (on !== S.on[i]) { l.classList.toggle('is-broken', on); S.on[i] = on; }
        });
        S.L.forEach((L, j) => {
          const f = g.fl[j];
          const on = !!f && S.on[L.i];
          const [a, as, ar] = on ? thrown(f, p) : [0, 0, 0];
          let tr = '', op = '';
          if (on) {
            // it flies from where its half stood when the line broke and comes back to the closed line,
            // wherever the (hidden) half has moved meanwhile
            if (!hx.has(L.half)) hx.set(L.half, gsap.getProperty(L.half, 'x') || 0);
            const dx = f.x0 * keep(f, p) - hx.get(L.half) + f.dx * a, dy = f.dy * a;
            if (f.m) {
              // a giant (set at its swollen size, origin at its corner): turned about its glyph's centre and
              // scaled down by its own size, so at rest it is exactly its glyph
              const sc = (1 + (f.sc - 1) * as) / f.m;
              tr = `translate3d(${(dx + f.cx).toFixed(1)}px,${(dy + f.cy).toFixed(1)}px,0) perspective(${Math.round(f.persp)}px) rotate(${(f.rot * ar).toFixed(1)}deg) rotateY(${(f.ry * ar).toFixed(1)}deg) scale(${sc.toFixed(4)}) translate(${(-f.cx * f.m).toFixed(1)}px,${(-f.cy * f.m).toFixed(1)}px)`;
            } else {
              const sc = 1 + (f.sc - 1) * as;
              tr = `perspective(${Math.round(f.persp)}px) translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0) rotate(${(f.rot * ar).toFixed(1)}deg) rotateX(${(f.rx * ar).toFixed(1)}deg) rotateY(${(f.ry * ar).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
            }
            // a giant is set back in a faint tone while it is swollen; a letter that found no clean way out
            // fades while it is out
            if (f.fade || f.pin) op = String(Math.round(inkOf(f, a, p) * 100) / 100);
          }
          if (tr !== L.tr) { L.el.style.transform = tr; L.tr = tr; }
          if (op !== L.op) { L.el.style.opacity = op; L.op = op; }
        });
        // from the moment the wall breaks the object is drawn behind the burst, so it never lies on a letter
        const z = p >= BREAK ? '0' : '';
        if (obj.style.zIndex !== z) obj.style.zIndex = z;
      }
      // the bar across the edge shows only near edge-on; face-on it would read as a line across the face
      if (rimBar) {
        const a = Math.abs(Math.sin((gsap.getProperty(obj, 'rotationY') * Math.PI) / 180));
        const op = Math.round(smooth(clamp((a - 0.82) / 0.14, 0, 1)) * 100) / 100;
        if (op !== S.rimOp) { rimBar.style.opacity = String(op); S.rimOp = op; }
      }
    };

    const build = (tl, c) => {
      S.live = true; S.posed = false; S.phone = c.phone; S.tl = tl;
      // the old context's quickTo / quickSetter functions died with it: make new ones
      S.put = null;
      root.classList.remove('is-posed');
      clear();
      S.key = ''; S.geo = null; S.rimOp = NaN;
      G();
      const t0 = o.tilt[0], t1 = o.tilt[1];
      // the pull-back is eased for a travelling wall; one wall keeps an even climb through it
      const fitEase = (t) => (S.geo && S.geo.travel ? inOut3(t) : t);
      tl.fromTo(quote, { y: () => G().by0, scale: 1 }, { y: () => G().byA, duration: TRAVEL }, 0)
        .fromTo(quote, { y: () => G().byA }, { y: () => G().byE, duration: FIT0 - TRAVEL, immediateRender: false }, TRAVEL)
        .fromTo(quote, { y: () => G().byE, scale: 1 }, { y: () => G().byM, scale: () => G().scale, duration: FIT1 - FIT0, ease: fitEase, immediateRender: false }, FIT0)
        .fromTo(quote, { y: () => G().byM }, { y: () => G().by1, duration: 1 - FIT1, immediateRender: false }, FIT1)
        // in: from just above the wall into line 1 (or held in line 1 when it starts there)
        .fromTo(obj, { y: () => G().y0, scale: 1, rotationX: 0 }, { y: () => G().y1, duration: ENTER }, 0)
        .fromTo(obj, { y: () => G().y1 }, { y: () => G().yA, duration: TRAVEL - ENTER, immediateRender: false }, ENTER)
        .fromTo(obj, { rotation: t0 }, { rotation: t1, duration: TRAVEL }, 0)
        // the exit: it swells toward the camera while it still hangs in the last line (the wall breaks or
        // bursts open around it), then tips and falls out of the stage
        .fromTo(obj, { y: () => G().yA }, { y: () => G().yEnd, duration: EXIT, ease: 'power3.in', immediateRender: false }, TRAVEL)
        .fromTo(obj, { scale: 1 }, { scale: o.grow, duration: EXIT, ease: 'power2.out', immediateRender: false }, TRAVEL)
        .fromTo(obj, { rotation: t1, rotationX: 0 }, { rotation: t1 + 17, rotationX: TIP * o.tip, duration: EXIT, ease: 'power2.in', immediateRender: false }, TRAVEL);
      if (o.mode === 'flip') {
        const turn = () => 180 * Math.max(1, G().n - 1);
        // a face at every line, edge-on between lines (half a turn on the way in when it enters from above)
        tl.fromTo(obj, { rotationY: () => (G().enter ? -180 : 0) }, { rotationY: 0, duration: ENTER }, 0)
          .fromTo(obj, { rotationY: 0 }, { rotationY: turn, duration: TRAVEL - ENTER, immediateRender: false }, ENTER)
          .fromTo(obj, { rotationY: turn }, { rotationY: () => turn() + 180, duration: EXIT, ease: 'power2.in', immediateRender: false }, TRAVEL);
      }
      // the credit comes in once the object has gone (and, after a break, once the letters are nearly home)
      if (credit) tl.fromTo(credit, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out' }, o.exit === 'break' ? HOME : TRAVEL + EXIT);
      tl.eventCallback('onUpdate', wake);
      wake(true);
    };

    // The poster frame: the object resting inside the middle line that parts at a word gap (its
    // neighbours parted just around it, so no word is shown cut), every line in ink. Needs no GSAP.
    const pose = (phone) => {
      S.live = false; S.posed = true; S.phone = !!phone; S.put = null;
      root.classList.add('is-posed');
      clear();
      S.key = ''; S.geo = null;
      const g = G();
      const mid = (g.n - 1) / 2;
      const ok = (i) => !!S.B[i] && !S.cut[i];
      const cost = (i) => (ok(i) ? 0 : 100) + (S.cut[i - 1] || S.cut[i + 1] ? 10 : 0) + Math.abs(i - mid);
      const host = [...g.cy.keys()].sort((a, b) => cost(a) - cost(b) || a - b)[0];
      const yb = g.cy[host], xo = leanAt(g, yb);
      S.lines.forEach((l, i) => {
        const [xa, xb] = wakeAt(g, yb, 1, xo, i, g.gut);
        S.A[i].style.transform = Math.abs(xa) > 0.05 ? `translate3d(${xa.toFixed(1)}px,0,0)` : '';
        if (S.B[i]) S.B[i].style.transform = Math.abs(xb) > 0.05 ? `translate3d(${xb.toFixed(1)}px,0,0)` : '';
      });
      obj.style.transform = `translate3d(${xo.toFixed(1)}px,${yb.toFixed(1)}px,0) rotate(-4deg)`;
      if (rimBar) rimBar.style.opacity = '0';
    };
    const rest = (c) => pose(!!(c && c.phone));

    // Late fonts and resizes: a poster is posed again; a live scene re-measures through a refresh (a
    // window resize is left to ScrollTrigger's own refresh, so it is not done twice).
    let wait = 0, win = '';
    const again = () => {
      clearTimeout(wait);
      wait = setTimeout(() => {
        const w = `${window.innerWidth}x${window.innerHeight}`;
        const resized = w !== win;
        win = w;
        if (S.posed) pose(S.phone);
        else if (S.live && window.ScrollTrigger && key() !== S.key && !resized) ScrollTrigger.refresh();
      }, 60);
    };
    win = `${window.innerWidth}x${window.innerHeight}`;
    if (document.fonts) document.fonts.addEventListener('loadingdone', () => { S.fonts++; again(); });
    if (window.ResizeObserver) new ResizeObserver(again).observe(stage);
    if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', () => { if (S.live) wake(true); });

    // for test pages: the live geometry (each letter's throw, and whether it found a clean way out)
    root.ottGeometry = () => S.geo;
    if (!window.Stage) return null;
    if (Stage.live && Stage.touch) ScrollTrigger.config({ ignoreMobileResize: true });
    const scrub = o.scrub !== null ? o.scrub : (Stage.lenis ? true : 0.6);
    const mm = Stage.scene(root, {
      hold: o.hold,
      scrub,
      build,
      phone: o.phone === 'rest' ? 'rest' : { hold: o.phoneHold, build },
      rest,
    });
    // Stage work-around: gsap.matchMedia only calls back when one of its conditions matches, and reduced
    // motion on a desktop matches neither (motion, phone), so the stage never shows the finished
    // composition there. Pose it here, and again whenever the media change into that state.
    if (mm && window.matchMedia) {
      const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
      const small = window.matchMedia('(max-width: 767px)');
      const orphan = () => {
        if (motion.matches || small.matches) return;
        root.classList.remove('is-live');
        root.classList.add('is-rest');
        root.style.removeProperty('--hold');
        pose(false);
      };
      orphan();
      motion.addEventListener('change', () => setTimeout(orphan));
      small.addEventListener('change', () => setTimeout(orphan));
    }
    return mm;
  };

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = make;
})();
