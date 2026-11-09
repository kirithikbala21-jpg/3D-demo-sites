// tasteskill / scenes / powers-of-ten-pullback.js — a camera pulls back through nested pictures.
//
// A full-bleed film (or a still from it) shrinks until it is a screen on the wall of a real place: a
// screen hung on a calm wall (the scene draws its housing), or a measured opening such as a window, a
// frame or a billboard. Then the place shrinks until it is the picture inside an object resting on the
// page's plain ground: a framed print or a device screen, built in CSS so it registers by construction.
// Three flat layers scale at different rates in log space, all driven by two eased values, so the film
// lands on its wall and stays there: about an 11x pull-back in two reveals (about 18x on a phone). Use
// it when the punchline is context: a reel shown in a space, a product in its setting, something at its
// true scale. The phone runs the same two reveals with a portrait print and the copy under it.
//
// Needs gsap + ScrollTrigger, stage.js and powers-of-ten-pullback.css. No SplitText.
//
// DOM (the CSS file draws the finished composition from the same markup):
//   <section class="scene pb" data-scene="powers-of-ten-pullback" data-options='{}' aria-labelledby="pb-head">
//     <div class="scene-stage pb-stage">
//       <div class="pb-field" aria-hidden="true"></div>
//       <div class="pb-tilt">                                   the settle: rotation and drop
//         <div class="pb-world">                                level 2: the object (frame or bezel)
//           <div class="pb-slot">                               the object's picture opening
//             <div class="pb-room" style="--wx:.335;--wy:.245;--ww:.33;--wh:.2784;
//                                        --wx-sm:.275;--wy-sm:.255;--ww-sm:.45;--wh-sm:.2025">
//               <picture>                                       level 1: the place
//                 <source media="(max-width: 767px)" srcset="room-4x5.webp 1600w, room-4x5-l.webp 2666w"
//                         sizes="175vw" width="1600" height="2000">
//                 <img class="pb-room-img" src="room.webp" srcset="room.webp 2400w, room-l.webp 3600w"
//                      sizes="120vw" width="3600" height="2400" alt="the place">
//               </picture>
//               <div class="pb-inner">                         level 0: the film's box
//                 <img class="pb-film" src="still.webp" width="2560" height="1440" alt="the film">
//                 (or <video class="pb-film" muted loop playsinline controls preload="metadata" poster="still.webp">:
//                  the live scene hides the controls and plays it; at rest it is the poster with controls)
//               </div>
//             </div>
//             <div class="pb-glass" aria-hidden="true"></div>
//           </div>
//           <div class="pb-object" aria-hidden="true"></div>    the frame and mat, drawn in CSS
//         </div>
//       </div>
//       <div class="pb-scrim" aria-hidden="true"></div>
//       <header class="pb-title"><p>the film's name, 2-6 words</p><p>one sentence, 8-16 words</p></header>
//       <p class="pb-label">the wall label, 6-10 words</p>
//       <div class="pb-copy"><h2 id="pb-head">3-8 words, two lines</h2><p>18-32 words</p><a href="#">2-3 words</a></div>
//       <div class="pb-ground" aria-hidden="true"></div>       optional (made when missing): jumps 1 only
//     </div>
//   </section>
// The copy's headline is the section's heading (any level; it is .pb-copy's first child). The opening
// title is .pb-title's first child; at rest it becomes the caption under the object, so it is a <p>.
//
// The window. --wx --wy --ww --wh on .pb-room are where the film sits, as fractions of the room picture's
// natural box (x y width height, 4 decimals): the screen's picture area on a calm wall, or the INNER edge
// of a real opening. Its pixel aspect is the film's aspect. The -sm set is used under 768px, where the
// room should be a 4:5 portrait crop given through <picture><source> (the window about 0.45 of its width,
// over the wall, with the people or things that give the place its scale left in view below it). Both the
// live scene and the finished composition read them, so the film is registered with or without script.
// Never put object-fit or a CSS size on the room picture; give it its real width and height attributes
// (on the <source> too). The live scene moves the room so the window sits as near the stage's centre as
// the picture allows; a window whose middle is at 38-48% of the picture's height reads best.
//
// Options (data-options JSON; defaults, ranges):
//   jumps       2          1 | 2     2 = film -> room -> object; 1 = film -> room, ending full-bleed in
//                                    the room with the copy on a band of ground
//   hold        3 (1.8 at jumps 1)   1.5-4 screens the stage is held on desktop
//   holdPhone   2.6 (2.2 at jumps 1) 1.6-3.2 screens on a phone
//   depth       1.7        1-2.2     the room's start scale: 1 = the film flies back into a still wall,
//                                    1.7 = a dolly out of a hall, 2.2 = strong parallax (needs a 4800px room)
//   depthPhone  1.8        1-2.2
//   end         0.32       0.24-0.44 the object's opening at the end, as a share of the stage width
//   endPhone    0.56       0.4-0.7   the same on a phone, where the print settles centred at the top
//   side        "right"    "right" | "left": where the object settles; the copy takes the other side
//                          (for "left" also put class="pb-side-left" on the section, so the finished
//                          composition matches without script)
//   tilt        3          0-6       degrees the object turns as it settles (0 = clinical, 6 = playful;
//                                    phones and upright tablets use at most 2)
//   drop        0.02       0-0.06    how far it drops as it settles, as a share of the stage height
//   drift       0.08 (0 for a video) 0-0.15  the still's slow zoom inside its box, so held frames live
//   scrub       0.8 (0.4 with Lenis) seconds of catch-up, or true
//   phone       "same"     "same" | "rest" (the phone gets the finished composition)
// Upright tablets (768-1099px wide, under 1.2:1) settle the object centred near the top at 0.52 of the
// width, with the copy centred under it; landscape tablets use the desktop layout.
//
// CSS custom properties on the section (the finished composition reads them too):
//   --pb-aspect 1.7778     the object's opening (width / height); the room is cropped to it
//   --pb-aspect-sm .8      the same on a phone (a portrait print)
//   --pb-housing .018      the screen's housing around the film, as a share of the film's width; it
//                          scales with the film, so the screen's edge shows first and the wall second.
//                          0 when the window is a real opening (a window, a frame) with its own edge.
//   --pb-housing-color var(--ink)
//   --pb-frame  0.035      frame thickness, as a share of the opening's width
//   --pb-mat    0.11       mat thickness (0 for a device bezel)
//   --pb-frame-color var(--ink)   --pb-mat-color var(--surface)   --pb-radius 0 (the opening's corners)
//   --pb-scrim  rgb(0 0 0 / .34)  flat scrim under the opening title while the film is full-bleed
//   --pb-glass  rgb(255 255 255 / .06)  flat glazing over the room once it is a picture in the object
// Page tokens: --ground (the field), --ink, --muted, --surface (the label card and the mat), --accent
// (the link), --font-display, --font-text.
//
// Pictures: the film, 16:9 (the window's aspect), 2560 wide, its subject in the centre third (the phone
// starts on the middle quarter). The room: a place seen straight on, 3:2 or 4:3, 3600 wide or more, with a
// calm wall (or one rectangular opening) for the window at 0.30-0.36 of its width, centred within 6%, and
// what gives it depth and scale around it: a floor, a ceiling, lines leading in, a person, a bench. A dark
// room makes the film glow. A video film needs muted, loop and playsinline, and a good poster: it plays
// only while the section is near the screen.
(() => {
  const ID = 'powers-of-ten-pullback';
  const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const px = (n) => Math.round(n * 100) / 100 + 'px';

  window.Scenes = window.Scenes || {};
  Scenes[ID] = (root, opts = {}) => {
    const jumps = +opts.jumps === 1 ? 1 : 2;
    const side = (opts.side ?? (root.classList.contains('pb-side-left') ? 'left' : 'right')) === 'left' ? 'left' : 'right';
    const o = {
      jumps,
      side,
      hold: clamp(num(opts.hold, jumps === 1 ? 1.8 : 3), 1.5, 4),
      holdPhone: clamp(num(opts.holdPhone, jumps === 1 ? 2.2 : 2.6), 1.6, 3.2),
      depth: clamp(num(opts.depth, 1.7), 1, 2.2),
      depthPhone: clamp(num(opts.depthPhone, 1.8), 1, 2.2),
      end: clamp(num(opts.end, 0.32), 0.24, 0.44),
      endPhone: clamp(num(opts.endPhone, 0.56), 0.4, 0.7),
      tilt: clamp(Math.abs(num(opts.tilt, 3)), 0, 6),
      drop: clamp(num(opts.drop, 0.02), 0, 0.06),
      drift: opts.drift == null ? null : clamp(num(opts.drift, 0.08), 0, 0.15),
    };
    const q1 = (sel) => root.querySelector(sel);
    const el = {
      stage: q1('.pb-stage') || q1('.scene-stage'),
      tilt: q1('.pb-tilt'), world: q1('.pb-world'), slot: q1('.pb-slot'), room: q1('.pb-room'),
      img: q1('.pb-room-img'), inner: q1('.pb-inner'), film: q1('.pb-film'), glass: q1('.pb-glass'),
      object: q1('.pb-object'), scrim: q1('.pb-scrim'), title: q1('.pb-title'), label: q1('.pb-label'),
      copy: q1('.pb-copy'), ground: q1('.pb-ground'),
    };
    root.classList.add('pb');
    root.classList.toggle('pb-side-left', side === 'left');
    const video = el.film && el.film.tagName === 'VIDEO' ? el.film : null;
    const drift = o.drift ?? (video ? 0 : 0.08);
    let inst = null;

    // The film: a video plays only while the scene is live and near the screen; at rest it is a poster
    // with controls, and nothing autoplays.
    const restVideo = () => {
      if (!video) return;
      video.pause(); video.removeAttribute('autoplay'); video.controls = true;
    };

    function live(tl, ctx, mode) {
      if (inst) inst.destroy();
      const { stage, tilt, world, slot, room, img, inner, film, glass, scrim, title, label, copy } = el;
      if (!stage || !world || !slot || !room || !img || !inner) { console.warn(ID + ': markup incomplete'); return; }
      let ground = el.ground;
      let madeGround = false;
      if (mode === 'one' && !ground) {
        ground = document.createElement('div');
        ground.className = 'pb-ground'; ground.setAttribute('aria-hidden', 'true');
        stage.appendChild(ground); madeGround = true;
      }
      root.classList.add(mode === 'one' ? 'pb-one' : 'pb-two');
      const j1 = { v: 0 }, j2 = { v: 0 };
      const g = { Z: 1, D0: 1, r2: 1, H: 1, W: 1, tiltDeg: 0 };
      const touched = [world, slot, room, inner, label, tilt, stage, ground].filter(Boolean);
      let dead = false;   // the proxies' tweens call draw() while GSAP reverts them, after destroy()

      const draw = () => {
        if (dead) return;
        room.style.transform = `scale(${Math.pow(g.Z, -j1.v)})`;
        inner.style.transform = `scale(${Math.pow(g.D0, -j1.v)})`;
        world.style.transform = mode === 'two' ? `scale(${Math.pow(g.r2, j2.v)})` : '';
      };

      // the room picture's box: its natural size once known, else the width and height attributes of the
      // <source> the browser picked (a phone's portrait crop), else the <img>'s own
      const dims = () => {
        if (img.naturalWidth && img.naturalHeight) return [img.naturalWidth, img.naturalHeight];
        const pic = img.parentElement && img.parentElement.tagName === 'PICTURE' ? img.parentElement : null;
        for (const s of pic ? pic.querySelectorAll('source') : []) {
          if (s.media && !window.matchMedia(s.media).matches) continue;
          const w = num(s.getAttribute('width'), 0), h = num(s.getAttribute('height'), 0);
          if (w && h) return [w, h];
          break;
        }
        return [num(img.getAttribute('width'), 3), num(img.getAttribute('height'), 2)];
      };

      const layout = () => {
        if (dead) return;
        const W = stage.clientWidth || window.innerWidth, H = stage.clientHeight || window.innerHeight;
        // a phone or an upright tablet stacks: the object settles centred at the top, the copy under it
        const stack = mode === 'two' && (ctx.phone || (W < 1100 && W / H < 1.2));
        const tablet = stack && !ctx.phone;
        root.classList.toggle('pb-stack', stack);
        const [nw, nh] = dims();
        const AR = nw / nh;
        const rs = getComputedStyle(room), ss = getComputedStyle(root);
        const wx = num(rs.getPropertyValue('--pb-wx'), 0.335), wy = num(rs.getPropertyValue('--pb-wy'), 0.335);
        const ww = num(rs.getPropertyValue('--pb-ww'), 0.33), wh = num(rs.getPropertyValue('--pb-wh'), 0.33);
        const aspect = ctx.phone
          ? clamp(num(ss.getPropertyValue('--pb-aspect-sm'), 0.8), 0.5, 3)
          : clamp(num(ss.getPropertyValue('--pb-aspect'), 16 / 9), 0.5, 3);
        const housing = clamp(num(ss.getPropertyValue('--pb-housing'), 0.018), 0, 0.08);
        // (1) the slot: the object's opening, covering the stage at the start (the stage itself for one
        //     jump). The mat overlaps the room's edge by `ov` layout px, sized so it still covers about 1.6
        //     screen px once the world has shrunk, and the slot overscans the stage so none of it shows at 0.
        const endShare = ctx.phone ? o.endPhone : tablet ? Math.max(o.end, 0.52) : o.end;
        let slotW = W, slotH = H, ov = 1;
        if (mode === 'two') {
          ov = clamp(1.6 * Math.max(W, H * aspect) / (endShare * W), 1, 8);
          const os = ov + 3;
          slotW = Math.max(W + 2 * os, (H + 2 * os) * aspect); slotH = slotW / aspect;
        }
        const sx = (W - slotW) / 2, sy = (H - slotH) / 2;
        // (2) the room at rest: a cover fit of the slot, moved (inside the cover) so the window's centre
        //     sits as near the slot's centre as the picture allows. Oc = the window's centre; the landed film.
        const rW = Math.max(slotW, slotH * AR), rH = rW / AR;
        const fx = wx + ww / 2, fy = wy + wh / 2;
        const rx = clamp(slotW / 2 - fx * rW, slotW - rW, 0), ry = clamp(slotH / 2 - fy * rH, slotH - rH, 0);
        const ocx = rx + fx * rW, ocy = ry + fy * rH;
        const lw = ww * rW + 4, lh = wh * rH + 4;                   // 2px outset on every side
        const filmAR = lw / lh;
        // (4) the film's start box: 1.06 x the cover needed around Oc, so no room shows at 0
        const cx = sx + ocx, cy = sy + ocy;
        const l0W = 1.06 * Math.max(2 * Math.max(cx, W - cx), 2 * Math.max(cy, H - cy) * filmAR);
        const l0H = l0W / filmAR;
        // (3) the room is laid out at its start scale and only ever scales down; origin = the window's centre
        const Z = Math.min(ctx.phone ? o.depthPhone : o.depth, l0W / lw);
        const RW = rW * Z, RH = rH * Z, ox = fx * RW, oy = fy * RH;
        Object.assign(room.style, { left: px(ocx - ox), top: px(ocy - oy), width: px(RW), height: px(RH), transformOrigin: `${px(ox)} ${px(oy)}` });
        Object.assign(inner.style, { left: px(ox - l0W / 2), top: px(oy - l0H / 2), width: px(l0W), height: px(l0H) });
        // the housing is drawn in the film's own px, so it scales with the film and lands with it
        inner.style.setProperty('--pb-hpx', px(housing * l0W));
        g.Z = Z; g.D0 = l0W / (lw * Z); g.W = W; g.H = H;
        // (5) the world: frame and mat around the slot; it scales to r2 about the fixed point F
        if (mode === 'two') {
          const fr = clamp(num(ss.getPropertyValue('--pb-frame'), 0.035), 0, 0.3) * slotW;
          const mt = clamp(num(ss.getPropertyValue('--pb-mat'), 0.11), 0, 0.4) * slotW;
          const b = fr + mt;
          const left = side === 'left';
          g.r2 = Math.min(0.95, (endShare * W) / slotW);
          g.tiltDeg = (stack ? Math.min(o.tilt, 2) : o.tilt) * (left ? 1 : -1);
          const ow = (slotW + 2 * b) * g.r2, oh = (slotH + 2 * b) * g.r2, rad = Math.abs(g.tiltDeg) * Math.PI / 180;
          const ex = (stack ? 0.5 : left ? 1 - 0.66 : 0.66) * W;
          // a phone centres the settled print and the copy under it as one group on the stage
          const half = (oh / 2) * Math.cos(rad) + (ow / 2) * Math.sin(rad);
          const groupH = 2 * half + 36 + (copy ? copy.offsetHeight : 0);
          const ey = ctx.phone ? clamp((H - groupH) / 2, 0.05 * H, 0.2 * H) - o.drop * H + half : (tablet ? 0.34 : 0.46) * H;
          const Fx = W / 2 + (ex - W / 2) / (1 - g.r2), Fy = H / 2 + (ey - H / 2) / (1 - g.r2);
          Object.assign(world.style, { left: px(sx - b), top: px(sy - b), width: px(slotW + 2 * b), height: px(slotH + 2 * b), transformOrigin: `${px(Fx - (sx - b))} ${px(Fy - (sy - b))}` });
          Object.assign(slot.style, { left: px(b), top: px(b), width: px(slotW), height: px(slotH) });
          world.style.setProperty('--pb-fpx', px(fr));
          world.style.setProperty('--pb-mpx', px(mt));
          world.style.setProperty('--pb-opx', px(ov));
          if (tilt) tilt.style.transformOrigin = `${px(ex)} ${px(ey)}`;
          // where the settled object ends, so a stacked layout starts its copy under it
          const bottom = ey + o.drop * H + half;
          stage.style.setProperty('--pb-copy-top', px(Math.min(bottom + (ctx.phone ? 36 : 48), 0.7 * H)));
        } else {
          Object.assign(world.style, { left: '0px', top: '0px', width: px(W), height: px(H), transformOrigin: '' });
          Object.assign(slot.style, { left: '0px', top: '0px', width: px(W), height: px(H) });
          g.r2 = 1; g.tiltDeg = 0;
          // the band of ground that carries the copy at the end starts 48px under the landed film
          const top = clamp(cy + lh / 2 + 48, 0.5 * H, 0.66 * H);
          stage.style.setProperty('--pb-band', px(top));
        }
        // the wall label: a card under the landed screen's left edge, in screen space. On a wide screen it
        // keeps to the left half of the screen, like a gallery label, so it leaves the wall below the
        // screen's middle (where people stand) clear.
        if (label) {
          const hs = housing * lw;
          const lx = Math.max(16, cx - lw / 2 - hs);
          const mw = ctx.phone ? Math.max(lw + 2 * hs, 240) : clamp(0.46 * lw, 220, 320);
          Object.assign(label.style, { left: px(lx), top: px(cy + lh / 2 + hs + (ctx.phone ? 12 : 16)), maxWidth: px(Math.min(W - lx - 16, mw)) });
        }
        draw();
      };

      const onRefreshInit = () => layout();
      ScrollTrigger.addEventListener('refreshInit', onRefreshInit);
      ScrollTrigger.addEventListener('refresh', draw);
      const onLoad = () => { layout(); };
      img.addEventListener('load', onLoad);
      layout();
      // decode before anything moves; a late picture re-lays the scene out
      Promise.all([img.decode ? img.decode().catch(() => {}) : null, film && film.decode ? film.decode().catch(() => {}) : null])
        .then(() => { if (inst && inst.layout === layout) { layout(); ScrollTrigger.refresh(); } });

      const head = copy ? copy.firstElementChild : null;
      const rest = copy ? [...copy.children].filter((c) => c !== head) : [];
      const A = mode === 'two'
        ? { j1: [0.04, 0.38], t1: 0.06, lin: 0.40, lout: 0.53, j2: [0.56, 0.28], tilt: 0.70, h: 0.82, r: 0.85, y: 32 }
        : { j1: [0.04, 0.56], t1: 0.06, lin: 0.56, lout: 0.67, band: 0.69, h: 0.74, r: 0.78, y: 24 };

      // 1. the first reveal: room and film read one eased value in log space, so they land together
      tl.fromTo(j1, { v: 0 }, { v: 1, duration: A.j1[1], ease: 'sine.inOut', onUpdate: draw }, A.j1[0]);
      if (film && drift) tl.fromTo(film, { scale: 1 + drift }, { scale: 1, duration: mode === 'two' ? 0.84 : 0.86, ease: 'none' }, 0);
      // 2. the opening title and its scrim leave while the room shows only as slivers, before the film's
      //    edge can reach the title's corner of the screen
      if (scrim) tl.fromTo(scrim, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.07, ease: 'power1.in' }, A.t1);
      if (title) tl.fromTo(title, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: 0.07, ease: 'power1.in' }, A.t1);
      // 3. the wall label, only while the film sits still on its wall
      if (label) {
        tl.fromTo(label, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'power2.out' }, A.lin);
        tl.fromTo(label, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.04, ease: 'power1.in', immediateRender: false }, A.lout);
      }
      if (mode === 'two') {
        // 4. the second reveal: the world shrinks about F, so the slot travels straight to its end point
        tl.fromTo(j2, { v: 0 }, { v: 1, duration: A.j2[1], ease: 'sine.inOut', onUpdate: draw }, A.j2[0]);
        if (glass) tl.fromTo(glass, { opacity: 0 }, { opacity: 1, duration: 0.10 }, A.j2[0]);
        // 5. the settle, after the zoom has landed
        if (tilt) tl.fromTo(tilt, { rotation: 0, y: 0 }, { rotation: () => g.tiltDeg, y: () => o.drop * g.H, duration: 0.20, ease: 'power2.out' }, A.tilt);
      } else if (ground) {
        // 4. one jump: a band of the page's ground rises under the room to carry the copy
        tl.fromTo(ground, { yPercent: 100 }, { yPercent: 0, duration: 0.12, ease: 'power2.out' }, A.band);
      }
      // 6. the copy, on the plain field
      if (head) tl.fromTo(head, { autoAlpha: 0, y: A.y }, { autoAlpha: 1, y: 0, duration: 0.10, ease: 'power3.out' }, A.h);
      if (rest.length) tl.fromTo(rest, { autoAlpha: 0, y: A.y }, { autoAlpha: 1, y: 0, duration: 0.10, ease: 'power3.out' }, A.r);
      tl.set({}, {}, 1);

      // the film plays only near the screen; the three moving layers are promoted only then
      ScrollTrigger.create({
        trigger: root, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => {
          root.classList.toggle('pb-near', self.isActive);
          if (!video) return;
          if (self.isActive) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } else video.pause();
        },
      });
      if (video) { video.muted = true; video.loop = true; video.playsInline = true; video.controls = false; }
      draw();

      inst = {
        layout,
        destroy() {
          dead = true;
          ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
          ScrollTrigger.removeEventListener('refresh', draw);
          img.removeEventListener('load', onLoad);
          for (const n of touched) {
            for (const p of ['left', 'top', 'width', 'height', 'maxWidth', 'transform', 'transformOrigin']) n.style[p] = '';
          }
          for (const v of ['--pb-fpx', '--pb-mpx', '--pb-opx']) world.style.removeProperty(v);
          inner.style.removeProperty('--pb-hpx');
          stage.style.removeProperty('--pb-band');
          stage.style.removeProperty('--pb-copy-top');
          if (madeGround && ground) ground.remove();
          root.classList.remove('pb-one', 'pb-two', 'pb-near', 'pb-stack');
          if (video) video.pause();
          inst = null;
        },
      };
    }

    // Reduced motion on a desktop matches neither of the stage's conditions, so the stage never calls
    // rest() there: watch the query here too, so a live scene switched to reduced motion is cleared.
    const rmq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const onReduce = () => { if (rmq && rmq.matches) { if (inst) inst.destroy(); restVideo(); } };
    if (rmq) { if (rmq.addEventListener) rmq.addEventListener('change', onReduce); else if (rmq.addListener) rmq.addListener(onReduce); onReduce(); }

    const scrub = opts.scrub ?? (window.Stage && Stage.lenis ? 0.4 : 0.8);
    const build = (tl, ctx) => live(tl, ctx, jumps === 2 ? 'two' : 'one');
    return Stage.scene(root, {
      hold: o.hold,
      scrub,
      build,
      phone: opts.phone === 'rest' ? 'rest' : { hold: o.holdPhone, build },
      rest() { if (inst) inst.destroy(); restVideo(); },
    });
  };
})();
