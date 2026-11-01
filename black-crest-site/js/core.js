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

/* ---------- First-visit intro (replaced by the preloader on the home page in phase 3) ---------- */
const intro = $('#intro');
if (intro) {
  if (reduce || store.get('bc-intro')) intro.remove();
  else {
    store.set('bc-intro', '1'); intro.hidden = false;
    const end = () => { if (!intro.isConnected) return; intro.classList.add('is-done'); setTimeout(() => intro.remove(), 500); };
    intro.addEventListener('click', end); document.addEventListener('keydown', end, { once: true }); setTimeout(end, 1500);
  }
}

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

/* ---------- Hero spotlight ---------- */
const hero = $('.hero');
if (hero && fine && !reduce) {
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    hero.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    hero.classList.add('has-glow');
  });
  hero.addEventListener('pointerleave', () => hero.classList.remove('has-glow'));
}

/* ---------- Hero crest area: keep the crest clear of the headline and the price card ---------- */
const heroStage = $('.hero-stage');
if (heroStage) {
  const fitStage = () => {
    const blockers = $$(innerWidth >= 1200 ? '.hero-card' : '.hero-grid .label, .hero-grid h1, .hero-card');
    heroStage.style.height = '';
    const s = heroStage.getBoundingClientRect();
    let limit = s.bottom;
    blockers.forEach((el) => { const r = el.getBoundingClientRect(); if (r.right > s.left && r.left < s.right && r.top < limit) limit = r.top; });
    heroStage.style.height = Math.max(140, Math.floor(limit - s.top - 16)) + 'px';
  };
  fitStage(); addEventListener('resize', fitStage); if (document.fonts) document.fonts.ready.then(fitStage);
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
  range.addEventListener('input', set); set();
});

/* ---------- Home: the 3D crest, only on capable devices, after first paint ---------- */
const stage = $('.hero-stage[data-hero3d]');
if (stage && (tier === 'full' || /[?&]3d=on\b/.test(location.search))) {
  const gpuOK = () => {
    try {
      const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return false;
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      return !/swiftshader|llvmpipe|software|basic render/i.test(info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '');
    } catch (_) { return false; }
  };
  if (/[?&]3d=on\b/.test(location.search) || gpuOK()) {
    let started = false;
    const go = () => { if (started) return; started = true; ['pointermove', 'scroll', 'touchstart', 'keydown'].forEach((t) => removeEventListener(t, go)); import('./hero3d.js').then((m) => m.start(stage, env)).catch(() => {}); };
    const arm = () => ['pointermove', 'scroll', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, go, { passive: true, once: true }));
    if (document.readyState === 'complete') arm(); else addEventListener('load', arm, { once: true });
  }
}

/* ---------- Small things ---------- */
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
$$('[data-print]').forEach((b) => b.addEventListener('click', () => print()));
$$('[data-top]').forEach((b) => b.addEventListener('click', () => { motion.lenis ? motion.lenis.scrollTo(0) : scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }));
