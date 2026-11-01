// Black Crest Web Designs: the entry module for every page.
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
    const out = $('[data-pre-count]', pre), t0 = performance.now(), heroImg = $('.hero-stage img');
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

/* ---------- Button labels roll up to a duplicate on hover (mouse only; screen readers still hear the label once) ---------- */
if (fine && !reduce) $$('.btn').forEach((b) => {
  const t = [...b.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  if (!t) return;
  const roll = document.createElement('span'), inner = document.createElement('span');
  roll.className = 'btn-roll'; roll.dataset.text = t.textContent.trim(); inner.textContent = t.textContent.trim();
  roll.append(inner); t.replaceWith(roll);
});

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

/* ---------- Card spotlight borders follow the pointer (a hover effect on cards, not a cursor) ---------- */
if (fine && !reduce) $$('.tile').forEach((c) => c.addEventListener('pointermove', (e) => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}));

/* ---------- Showreel: plays muted while on screen (not with reduced motion); "Play reel" opens it full screen ---------- */
const reel = $('[data-reel]');
if (reel) {
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

/* ---------- Anatomy: numbered spots on a concept screenshot, joined to their cards by hairlines on desktop ---------- */
const anat = $('[data-anatomy]');
if (anat) {
  const svg = $('.anatomy-lines', anat), dots = $$('.hot', anat), cards = $$('.hot-card', anat);
  const draw = () => {
    if (innerWidth < 1024) { svg.innerHTML = ''; return; }
    const box = anat.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = cards.map((c, i) => {
      const d = dots[i].getBoundingClientRect(), r = c.getBoundingClientRect(), left = r.right < d.left;
      const x1 = d.left + d.width / 2 - box.left, y1 = d.top + d.height / 2 - box.top, x2 = (left ? r.right : r.left) - box.left, y2 = r.top + r.height / 2 - box.top;
      const mx = left ? x2 + 28 : x2 - 28;
      return `<path data-line="${i}" d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${mx.toFixed(1)} ${y2.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
    }).join('');
  };
  const on = (i, v) => { dots[i].classList.toggle('is-on', v); cards[i].classList.toggle('is-on', v); const l = svg.querySelector(`[data-line="${i}"]`); if (l) l.classList.toggle('is-on', v); };
  cards.forEach((c, i) => { c.addEventListener('pointerenter', () => on(i, true)); c.addEventListener('pointerleave', () => on(i, false)); });
  draw(); addEventListener('resize', draw); addEventListener('load', draw);
  const img = $('img', anat); if (img && !img.complete) img.addEventListener('load', draw, { once: true });
  if (window.ScrollTrigger) window.ScrollTrigger.addEventListener('refresh', draw);
}

/* ---------- Concept Lab (home and lab.html) ---------- */
if ($('[data-lab]')) import('./lab.js').then((m) => m.initLab(env));

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

/* ---------- Home: real-time 3D (the hero crest and the globe), only on capable devices, when the browser is idle ---------- */
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
const stage = $('.hero-stage[data-hero3d]');
if (stage && can3d) {
  const run = () => import('./hero3d.js').then((m) => m.start(stage, env)).catch((e) => console.warn('3D crest skipped:', e && e.message));
  /[?&]still=1\b/.test(location.search) ? run() : idle(run);
}
const globe = $('[data-globe]');
if (globe && can3d) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return; io.disconnect();
    import('./globe3d.js').then((m) => m.start(globe, env)).catch((err) => console.warn('3D globe skipped:', err && err.message));
  }, { rootMargin: '400px 0px' });
  idle(() => io.observe(globe));
}

/* ---------- Small things ---------- */
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
$$('[data-print]').forEach((b) => b.addEventListener('click', () => print()));
$$('[data-top]').forEach((b) => b.addEventListener('click', () => { motion.lenis ? motion.lenis.scrollTo(0) : scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }));
