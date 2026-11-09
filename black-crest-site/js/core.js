// KB Web Designs: the entry module for every page.
// Works out the device tier, then starts the menu, motion, forms and the page's own pieces.
import { CONFIG } from './config.js';
import { initMotion } from './motion.js';
import { initMenu } from './menu.js';
import { initForms, store } from './forms.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

/* ---------- Device tier: "low" gets stills and simple fades instead of WebGL and pinned scrubbing ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const conn = navigator.connection || {};
const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 || conn.saveData;
const tier = reduce || lowPower ? 'low' : 'full';
root.classList.add('tier-' + tier);
if (reduce) root.classList.add('reduce');
export const env = { reduce, fine, tier };

/* ---------- Prices and contact details from CONFIG (the pages already hold the same values) ---------- */
const addOn = Object.fromEntries(CONFIG.addOns.map((a) => [a.id, a]));
$$('[data-price]').forEach((el) => {
  const k = el.dataset.price;
  const v = k === 'onePage' || k === 'fullSite' ? CONFIG.packages[k].price : k === 'carePlan' ? CONFIG.carePlan.pricePerMonth : addOn[k] && addOn[k].from;
  if (v == null) return;
  el.textContent = (el.dataset.prefix ?? '$') + Number(v).toLocaleString('en-AU');
  if (el.dataset.odometer) el.dataset.odometer = el.textContent;
});
$$('[data-email]').forEach((a) => { a.href = 'mailto:' + CONFIG.email; });
$$('[data-call]').forEach((a) => {
  if (CONFIG.phone) { a.href = 'tel:' + CONFIG.phone.replace(/[^\d+]/g, ''); a.hidden = false; } else a.hidden = true;
});
$$('[data-availability]').forEach((el) => { el.textContent = CONFIG.availability; });

/* ---------- The Melbourne clock ---------- */
const clocks = $$('[data-clock]');
if (clocks.length) {
  const fmt = new Intl.DateTimeFormat('en-AU', { timeZone: CONFIG.timezone, hour: 'numeric', minute: '2-digit', hour12: true });
  const tick = () => { const t = fmt.format(new Date()).replace(/\s/g, ' ').toLowerCase(); clocks.forEach((c) => { c.textContent = 'Melbourne · ' + t; }); };
  tick(); setInterval(tick, 15000);
}

/* ---------- Home preloader: a crest hairline draws while a counter follows real loading (fonts, the hero image,
   the page), capped at 1.4 s, then the screen splits open. Once per visit; never with reduced motion. ---------- */
const pre = $('#preloader');
if (pre) {
  if (!root.classList.contains('preload')) pre.remove();
  else {
    store.set('bc-pre', '1');
    const out = $('[data-pre-count]', pre), t0 = 0, heroImg = $('.hero-img'); // 1.4 s at most, counted from the start of the visit
    const jobs = [
      document.fonts ? document.fonts.ready : Promise.resolve(),
      heroImg && !heroImg.complete ? new Promise((r) => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }) : Promise.resolve(),
      document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true }))
    ];
    let done = 0, shown = 0;
    jobs.forEach((j) => j.then(() => { done++; }));
    const step = (now) => {
      const goal = now - t0 >= 1400 ? 100 : (done / jobs.length) * 100;
      shown = Math.min(goal, shown + Math.max(1, (goal - shown) * 0.18));
      out.textContent = String(Math.round(shown)).padStart(3, '0');
      if (shown < 100) return requestAnimationFrame(step);
      pre.classList.add('is-open');
      setTimeout(() => { root.classList.remove('preload'); pre.remove(); }, 950);
    };
    requestAnimationFrame(step);
  }
} else root.classList.remove('preload');

/* ---------- Everything below waits for the first frame, so the hero paints before motion, the Lab and the rest
   are set up. Nothing in the hero depends on it, and hidden reveals have a CSS failsafe. ---------- */
function boot() {
  /* ---------- Start the shared systems ---------- */
  const motion = initMotion(env);
  root.classList.add('motion-ready');
  initMenu({ reduce, lenis: motion.lenis });
  initForms(env);

  /* ---------- Gold progress line along the side ---------- */
  const bar = $('.progress span');
  if (bar) {
    const set = () => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleY(${max > 0 ? Math.min(1, scrollY / max) : 0})`; };
    addEventListener('scroll', () => requestAnimationFrame(set), { passive: true }); set();
  }

  /* ---------- Showreel: plays muted while on screen (not with reduced motion); "Play reel" opens it full screen ---------- */
  const reel = $('[data-reel]');
  if (reel) {
    // its poster frame loads when the reel comes near the screen, not with the hero
    const setPoster = () => { if (reel.dataset.poster && !reel.poster) reel.poster = reel.dataset.poster; };
    if ('IntersectionObserver' in window) { const pio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { pio.disconnect(); setPoster(); } }, { rootMargin: '900px 0px' }); pio.observe(reel); } else setPoster();
    if (!reduce) new IntersectionObserver(([e]) => { if (e.isIntersecting) { reel.preload = 'auto'; reel.play().catch(() => {}); } else reel.pause(); }, { threshold: 0.2 }).observe(reel);
    const btn = $('[data-reel-play]');
    if (btn) btn.addEventListener('click', () => {
      reel.controls = true; reel.play().catch(() => {});
      const fs = reel.requestFullscreen || reel.webkitRequestFullscreen || reel.webkitEnterFullscreen;
      if (fs) try { const r = fs.call(reel); if (r && r.catch) r.catch(() => {}); } catch (_) {}
    });
    const exit = () => { if (!document.fullscreenElement && !document.webkitFullscreenElement) { reel.controls = false; if (reduce) reel.pause(); } };
    document.addEventListener('fullscreenchange', exit); reel.addEventListener('webkitendfullscreen', exit);
  }

  /* ---------- Anatomy: pointing at a numbered point lights its spot on the screenshot ---------- */
  const anat = $('[data-anatomy]');
  if (anat) {
    const dots = $$('.hot', anat), cards = $$('.hot-card', anat);
    cards.forEach((c, i) => ['pointerenter', 'pointerleave'].forEach((t) => c.addEventListener(t, () => { const on = t === 'pointerenter'; dots[i].classList.toggle('is-on', on); c.classList.toggle('is-on', on); })));
  }

  /* ---------- Hover image reveals (work list, "next concept"): a preview follows the pointer on desktop ---------- */
  const hovers = $$('[data-hover-img]');
  if (hovers.length && fine && !reduce) {
    const box = document.createElement('div'), img = new Image();
    box.className = 'hover-img'; box.setAttribute('aria-hidden', 'true'); img.alt = ''; box.append(img); document.body.append(box);
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => { x += (tx - x) * 0.18; y += (ty - y) * 0.18; box.style.left = x + 'px'; box.style.top = y + 'px'; raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0; };
    hovers.forEach((a) => {
      a.addEventListener('pointerenter', (e) => { img.src = a.dataset.hoverImg; x = tx = e.clientX; y = ty = e.clientY; box.classList.add('is-on'); loop(); });
      a.addEventListener('pointermove', (e) => { tx = e.clientX + 40; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
      a.addEventListener('pointerleave', () => box.classList.remove('is-on'));
    });
    addEventListener('scroll', () => box.classList.remove('is-on'), { passive: true });
  }

  /* ---------- Concept Lab (home and lab.html) ---------- */
  // the Lab draws its preview (and fetches its photos) only when it comes near the screen, so the hero loads first
  const labEl = $('[data-lab]');
  if (labEl) {
    const startLab = () => import('./lab.js').then((m) => m.initLab(env));
    if ('IntersectionObserver' in window) { const lio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { lio.disconnect(); startLab(); } }, { rootMargin: '900px 0px' }); lio.observe(labEl); } else startLab();
  }

  /* ---------- How it works: the pinned visual follows the step in view ---------- */
  const story = $('[data-story]');
  if (story) {
    const steps = $$('.story-step', story), stages = $$('.stage', story), num = $('.count b', story), fill = $('.bar i', story);
    const activate = (i) => {
      steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
      stages.forEach((s, j) => s.classList.toggle('is-active', j === i));
      if (num) num.textContent = String(i + 1).padStart(2, '0');
      if (fill) fill.style.transform = `scaleX(${(i + 1) / steps.length})`;
    };
    activate(0);
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) activate(steps.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
  }

  /* ---------- Concept rail: pinned sideways scroll on desktop, a swipe row elsewhere ---------- */
  const rail = $('[data-rail]');
  if (rail) {
    const track = $('.rail-track', rail), items = $$('.rail-item', rail), count = $('.rail-count b', rail), ST = window.ScrollTrigger, gsap = window.gsap;
    if (ST && gsap && tier === 'full' && innerWidth >= 1024) {
      rail.classList.add('is-pinned');
      gsap.to(track, { x: () => -Math.max(0, track.scrollWidth - innerWidth), ease: 'none',
        scrollTrigger: { trigger: $('.rail-pin', rail), start: 'top top', end: () => '+=' + Math.max(0, track.scrollWidth - innerWidth), pin: $('.rail-sticky', rail), scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (s) => { if (count) count.textContent = String(Math.min(items.length, Math.round(s.progress * (items.length - 1)) + 1)).padStart(2, '0'); } } });
    }
    $$('.rail-btn', rail).forEach((b) => b.addEventListener('click', () => track.scrollBy({ left: Number(b.dataset.dir) * ((items[0] ? items[0].offsetWidth : 300) + 18), behavior: reduce ? 'auto' : 'smooth' })));
    track.addEventListener('scroll', () => { if (!count || rail.classList.contains('is-pinned')) return; const w = items[0] ? items[0].offsetWidth + 18 : 300; count.textContent = String(Math.min(items.length, Math.round(track.scrollLeft / w) + 1)).padStart(2, '0'); }, { passive: true });
  }

  /* ---------- Before/after slider ---------- */
  $$('[data-compare]').forEach((box) => {
    const range = $('input[type=range]', box);
    const set = () => { box.style.setProperty('--pos', range.value + '%'); range.setAttribute('aria-valuenow', range.value); range.setAttribute('aria-valuetext', range.value + '% before'); };
    range.addEventListener('input', () => { set(); box.classList.add('is-touched'); }); set();
  });

  /* ---------- Home: real-time 3D (the hero card and the concept collection), only on capable devices, when idle ---------- */
  const force3d = /[?&](3d=on|still=1)\b/.test(location.search);
  const gpuOK = () => {
    try {
      const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return false;
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      return !/swiftshader|llvmpipe|software|basic render/i.test(info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '');
    } catch (_) { return false; }
  };
  const can3d = force3d || (tier === 'full' && gpuOK());
  root.classList.toggle('has-3d', can3d);
  const idle = (fn) => {
    const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  };
  /* ---------- Hero render: a slight parallax on scroll (40px at most) and one soft light sweep across the card ----------
     The sweep sits exactly over the card: its box is worked out from the render's size, the crop on screen
     (object-fit: cover) and where the card is in the source image. Off with reduced motion (the zoom is CSS). */
  const hm = $('[data-hero-media]');
  if (hm && !reduce) {
    const img = $('img', hm), sweep = $('.hero-sweep', hm), stack = matchMedia('(max-width: 719px), (max-aspect-ratio: 1/1)');
    // [image width, height, card left, top, right, bottom, object-position x, y], in source pixels
    const WIDE = [2752, 1536, 1544, 462, 2350, 1084, 0.74, 0.5], PHONE = [1228, 1536, 198, 462, 1004, 1084, 0.5, 0.5];
    const place = () => {
      const [iw, ih, l, t, r, b, px, py] = stack.matches ? PHONE : WIDE;
      const w = hm.offsetWidth, h = hm.offsetHeight, k = Math.max(w / iw, h / ih), ox = (w - iw * k) * px, oy = (h - ih * k) * py;
      Object.assign(sweep.style, { left: ox + l * k + 'px', top: oy + t * k + 'px', width: (r - l) * k + 'px', height: (b - t) * k + 'px', clipPath: `inset(0 round ${Math.round((r - l) * k * 0.022)}px)` });
      sweep.classList.add('is-on');
    };
    if (img.complete) place(); else img.addEventListener('load', place, { once: true });
    addEventListener('resize', place, { passive: true }); stack.addEventListener('change', place);
    let ticking = false;
    // phones: the words sit below the image, so it does not drift
    const drift = () => { ticking = false; const y = stack.matches ? 0 : Math.min(40, Math.max(0, scrollY * 0.08)); hm.style.transform = y ? `translate3d(0, ${y.toFixed(1)}px, 0)` : ''; };
    addEventListener('scroll', () => { if (!ticking && scrollY < innerHeight * 1.2) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
  }
  /* ---------- Hero video: the looping film of the card, over the still ----------
     Never for reduced motion, Save-Data or a 2G connection: then the still (with its CSS zoom and sweep) stays.
     The files are chosen here, not by <source media>, which not every browser honours: the 4:5 phone film for the
     stacked phone layout, the 16:9 film otherwise. It fades in only once it really plays, pauses when the hero is
     off screen or the tab is hidden, and is decoration only (aria-hidden, out of the tab order). */
  const conn = navigator.connection;
  const lean = reduce || !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));
  const sources = (v, base) => {
    v.querySelectorAll('source').forEach((x) => x.remove());
    // Safari (and every iPhone browser) gets the H.264 mp4 first; others the smaller WebM, with the mp4 as fallback
    const apple = /Apple/.test(navigator.vendor || '');
    (apple ? [['mp4', 'video/mp4'], ['webm', 'video/webm']] : [['webm', 'video/webm'], ['mp4', 'video/mp4']]).forEach(([ext, type]) => { const el = document.createElement('source'); el.src = `${base}.${ext}`; el.type = type; v.append(el); });
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.load();
  };
  const hv = $('.hero-video');
  if (hv && !lean) {
    const hero = hv.closest('.hero'), phone = matchMedia('(max-width: 719px), (max-aspect-ratio: 1/1)');
    let seen = true;
    const play = () => { if (seen && !document.hidden) { const p = hv.play(); if (p && p.catch) p.catch(() => {}); } };
    const pick = () => { const m = phone.matches; hv.poster = hv.dataset.poster + (m ? '-mobile' : '') + '.jpg'; sources(hv, hv.dataset.video + (m ? '-mobile' : '-1080')); play(); };
    hv.addEventListener('playing', () => hero.classList.add('has-video'));
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) play(); else hv.pause(); }).observe(hero);
    document.addEventListener('visibilitychange', () => { if (document.hidden) hv.pause(); else play(); });
    phone.addEventListener('change', () => { hero.classList.remove('has-video'); pick(); });
    pick();
  }
  /* ---------- The small film in the final call to action: loads and plays only while it is on screen ---------- */
  $$('.cta-video').forEach((v) => {
    if (lean) return;
    const box = v.closest('.cta-media');
    v.addEventListener('playing', () => box.classList.add('is-playing'));
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!v.querySelector('source')) sources(v, v.dataset.video); const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
    }, { rootMargin: '120px 0px' }).observe(box);
  });

  const stage = $('.hero-stage[data-hero3d]');
  if (stage && can3d) {
    const run = () => import('./hero3d.js').then((m) => m.start(stage, env)).catch((e) => console.warn('3D card skipped:', e && e.message));
    /[?&]still=1\b/.test(location.search) ? run() : idle(run);
  }
  const gallery = $('[data-gallery]');
  if (gallery && can3d && innerWidth >= 900) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      import('./gallery3d.js').then((m) => m.start(gallery, env)).catch((err) => console.warn('3D gallery skipped:', err && err.message));
    }, { rootMargin: '500px 0px' });
    idle(() => io.observe(gallery));
  }

  /* ---------- Small things ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  $$('[data-print]').forEach((b) => b.addEventListener('click', () => print()));
  $$('[data-top]').forEach((b) => b.addEventListener('click', () => { motion.lenis ? motion.lenis.scrollTo(0) : scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }));
}
requestAnimationFrame(() => setTimeout(boot, 0));
