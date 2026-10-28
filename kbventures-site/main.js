// Home page: the business cards (built from "businesses" in site.config.json), the hero object's parallax, the card
// visuals' parallax, the faint KB watermarks, and slow fade-ups. The shared bar, footer and page text come from site.js.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KB = window.KB || {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  // only images that live in this site's img/ folder
  const local = (p) => filled(p) && /^img\/(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:webp|jpe?g|png|avif|svg)$/.test(p.trim());

  /* ---------- Business cards ---------- */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  function picture(b) {
    const box = el('div', 'biz-visual');
    const size = Array.isArray(b.imageSize) && b.imageSize.length === 2 ? b.imageSize.map(Number) : null;
    const img = (src, alt) => {
      const i = el('img'); i.src = src.trim(); i.alt = filled(alt) ? alt : ''; i.loading = 'lazy'; i.decoding = 'async';
      if (size) { i.width = size[0]; i.height = size[1]; }
      return i;
    };
    if (Array.isArray(b.image)) {
      // several images: fanned like a hand of cards (up to five)
      const alts = Array.isArray(b.imageAlt) ? b.imageAlt : [];
      const srcs = b.image.map((s, i) => [s, alts[i]]).filter(([s]) => local(s)).slice(0, 5);
      if (!srcs.length) return box;
      const stack = el('div', 'cover-stack'); stack.dataset.parallax = '14';
      stack.append(...srcs.map(([s, a]) => { const i = img(s, a); i.className = 'cover'; return i; }));
      box.append(stack);
    } else if (local(b.image)) {
      if (b.imageFrame === 'browser') {
        // a website screenshot, floating in a browser frame
        const shot = el('div', 'float-shot'); shot.dataset.parallax = '18';
        const browser = el('div', 'browser'), bar = el('div', 'browser-bar');
        bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i><i></i><i></i>';
        browser.append(bar, img(b.image, b.imageAlt)); shot.append(browser); box.append(shot);
      } else {
        box.classList.add('biz-plain'); box.append(img(b.image, b.imageAlt));
      }
    }
    return box;
  }
  function card(b, cfg) {
    const nav = cfg.nav || {}, live = KB.isLive(b);
    // a live business is one big link; a coming-soon business is not a link at all
    const root = el(live ? 'a' : 'article', 'card biz ' + (live ? 'biz-live' : 'biz-soon'));
    if (live) root.href = b.url.trim();
    const content = el('div', 'biz-content');
    const status = el('p', 'status');
    const dot = el('span', 'dot ' + (live ? 'dot-live' : 'dot-soon')); dot.setAttribute('aria-hidden', 'true');
    status.append(dot, el('span', '', live ? nav.live || 'Live' : nav.comingSoon || 'Coming soon'));
    const body = el('div', 'biz-body');
    body.append(el('h3', 'card-title', b.name));
    if (filled(b.description)) body.append(el('p', 'dim', b.description));
    const foot = el('div', 'biz-foot');
    if (live) { const cta = el('span', 'biz-cta', b.ctaLabel || 'Visit'); cta.insertAdjacentHTML('beforeend', ARROW); foot.append(cta); }
    else foot.append(el('p', 'quiet', nav.comingSoon || 'Coming soon'));
    content.append(status, body, foot);
    root.append(picture(b), content);
    return root;
  }
  function moreCard(cfg) {
    const t = (cfg.home && cfg.home.businesses) || {};
    const c = el('article', 'card biz biz-soon biz-more');
    const v = el('div', 'biz-visual'); v.innerHTML = '<span class="more-plus" aria-hidden="true"></span>';
    const content = el('div', 'biz-content'), body = el('div', 'biz-body');
    body.append(el('h3', 'card-title', t.moreComing || 'More coming'));
    if (filled(t.moreComingText)) body.append(el('p', 'dim', t.moreComingText));
    content.append(body); c.append(v, content);
    return c;
  }

  /* ---------- Parallax and watermarks ---------- */
  const stage = $('#stage');
  let parallax = $$('[data-parallax]');
  const watermarks = $$('.watermark');
  let ticking = false;
  function onScroll() {
    ticking = false;
    if (reduceMotion) return;
    const y = window.scrollY, vh = window.innerHeight, mid = vh / 2;
    if (stage) stage.style.setProperty('--py', (Math.min(1, y / Math.max(1, vh)) * 32).toFixed(1) + 'px'); // the card lags a little
    parallax.forEach((e) => { const r = e.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - mid) / vh)); e.style.setProperty('--px', (t * +e.dataset.parallax).toFixed(1) + 'px'); });
    watermarks.forEach((e) => { const r = e.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; e.style.setProperty('--wy', ((r.top + r.height / 2 - mid) * -0.12).toFixed(1) + 'px'); });
    flushIfBottom();
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Slow fade-ups as things come into view (once) ---------- */
  // Fail-safe: content is visible unless this script has marked it as waiting; a reveal plays once and always ends at
  // full opacity. Without IntersectionObserver (or with reduced motion) nothing is ever hidden.
  let io = null;
  try {
    if (!reduceMotion && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) show(e.target); }), { threshold: 0.01, rootMargin: '0px 0px -4% 0px' });
    }
  } catch (_) { io = null; }
  const waiting = new Set();
  function show(e) { e.classList.add('is-visible'); waiting.delete(e); if (io) io.unobserve(e); }
  const reveal = (els, step = 0.07) => els.forEach((e, i) => {
    e.style.setProperty('--d', (i * step).toFixed(2) + 's');
    if (!io || e.getBoundingClientRect().top < window.innerHeight * 0.9) return; // never hide what is already on screen
    e.classList.add('reveal'); waiting.add(e); io.observe(e);
  });
  // safety nets: at the bottom of the page everything shows, and nothing waits longer than 2.5s once it is on screen
  function flushIfBottom() { if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40) waiting.forEach(show); }
  setInterval(() => waiting.forEach((e) => { if (e.getBoundingClientRect().top < window.innerHeight) show(e); }), 2500);
  $$('.section .center, .about-text').forEach((c) => reveal([...c.children]));
  reveal($$('.biz'), 0.1);
  reveal($$('.about-mark'));
  onScroll();

  /* ---------- Cards from the config ---------- */
  if (KB.config) KB.config.then((cfg) => {
    if (!cfg) return;
    const grid = $('#biz-grid'), list = KB.businesses(cfg);
    if (!grid || !list.length) return;
    const cards = list.map((b) => card(b, cfg));
    if (cfg.showMoreComingCard === true) cards.push(moreCard(cfg));
    grid.replaceChildren(...cards);
    grid.dataset.count = String(cards.length);
    parallax = $$('[data-parallax]');
    cards.forEach((c, i) => c.style.setProperty('--d', (i * 0.1).toFixed(2) + 's'));
    onScroll();
  });
})();
