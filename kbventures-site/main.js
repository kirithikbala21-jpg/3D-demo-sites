// Page effects shared by Home and the inner pages (each part runs only where its element exists): the business cards
// built from "businesses" in site.config.json, the FAQ accordions built from "faq", the gentle tilt on the standard
// cards, parallax, the faint KB watermarks, and short fade-ups. The bar, footer and page text come from site.js.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KB = window.KB || {};
  const BASE = KB.base || './';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  // only images that live in this site's img/ folder
  const local = (p) => filled(p) && /^img\/(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:webp|jpe?g|png|avif|svg)$/.test(p.trim());
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* ---------- Business cards ---------- */
  const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  function picture(b) {
    const box = el('div', 'biz-visual');
    const size = Array.isArray(b.imageSize) && b.imageSize.length === 2 ? b.imageSize.map(Number) : null;
    const img = (src, alt) => {
      const i = el('img'); i.src = BASE + src.trim(); i.alt = filled(alt) ? alt : ''; i.loading = 'lazy'; i.decoding = 'async';
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
  let level = 'h3'; // h2 on pages where the cards come straight after the H1
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
    body.append(el(level, 'card-title', b.name));
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
    body.append(el(level, 'card-title', t.moreComing || 'More coming'));
    if (filled(t.moreComingText)) body.append(el('p', 'dim', t.moreComingText));
    content.append(body); c.append(v, content);
    return c;
  }

  /* ---------- FAQ accordions ---------- */
  // An answer's links are named by their text: { "text": "Refunds page", "href": "legal/refunds.html" }
  function answerNodes(item) {
    const out = []; let rest = item.a;
    const links = (Array.isArray(item.links) ? item.links : []).filter((l) => l && filled(l.text) && filled(l.href));
    while (rest) {
      let hit = null;
      links.forEach((l) => { const i = rest.indexOf(l.text); if (i >= 0 && (!hit || i < hit.i)) hit = { i, l }; });
      if (!hit) { out.push(document.createTextNode(rest)); break; }
      if (hit.i) out.push(document.createTextNode(rest.slice(0, hit.i)));
      const a = el('a', '', hit.l.text);
      const h = hit.l.href.trim();
      a.href = /^(https:|mailto:)/.test(h) ? h : BASE + h.replace(/^\//, '');
      out.push(a);
      rest = rest.slice(hit.i + hit.l.text.length);
    }
    return out;
  }
  let faqId = 0;
  function buildFaq(box, items) {
    box.replaceChildren(...items.map((item) => {
      const n = ++faqId, wrap = el('div', 'faq-item');
      const h = el(box.dataset.level || 'h3', 'faq-h'), b = el('button', 'faq-q');
      b.type = 'button'; b.id = 'faq-q-' + n;
      b.append(el('span', '', item.q)); b.insertAdjacentHTML('beforeend', '<span class="faq-icon" aria-hidden="true"></span>');
      h.append(b);
      const panel = el('div', 'faq-a'); panel.id = 'faq-a-' + n; panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', b.id);
      const inner = el('div', 'faq-a-inner'), p = el('p'); p.append(...answerNodes(item)); inner.append(p); panel.append(inner);
      wrap.append(h, panel);
      return wrap;
    }));
    initFaq(box);
  }
  function initFaq(box) {
    const buttons = $$('.faq-q', box);
    buttons.forEach((b) => {
      const panel = document.getElementById(b.id.replace('faq-q-', 'faq-a-'));
      b.setAttribute('aria-controls', panel.id);
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', () => {
        const open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(open));
        b.closest('.faq-item').classList.toggle('is-open', open);
      });
      // arrow keys move between the questions
      b.addEventListener('keydown', (e) => {
        const i = buttons.indexOf(b);
        const j = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
        if (j === undefined) return;
        e.preventDefault(); buttons[(j + buttons.length) % buttons.length].focus();
      });
    });
    box.classList.add('is-ready');
  }
  $$('[data-faq]').forEach(initFaq);
  // FAQPage structured data, word for word the same as the visible questions and answers
  function faqLd(items) {
    const ld = $('#faq-data');
    if (!ld) return;
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  }

  /* ---------- Standard cards: a slight tilt and a soft light that follows the pointer ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.std-card').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        c.style.setProperty('--rx', ((0.5 - y) * 6).toFixed(2) + 'deg'); c.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Parallax and watermarks ---------- */
  const stage = $('#stage');
  let parallax = $$('[data-parallax]');
  const watermarks = $$('.watermark');
  let ticking = false;
  function onScroll() {
    ticking = false;
    flushIfBottom();
    if (reduceMotion) return;
    const y = window.scrollY, vh = window.innerHeight, mid = vh / 2;
    if (stage) stage.style.setProperty('--py', (Math.min(1, y / Math.max(1, vh)) * 32).toFixed(1) + 'px'); // the card lags a little
    parallax.forEach((e) => { const r = e.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - mid) / vh)); e.style.setProperty('--px', (t * +e.dataset.parallax).toFixed(1) + 'px'); });
    watermarks.forEach((e) => { const r = e.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; e.style.setProperty('--wy', ((r.top + r.height / 2 - mid) * -0.12).toFixed(1) + 'px'); });
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Short fade-ups as things come into view (once) ---------- */
  // Fail-safe: content is visible unless this script has marked it as waiting; a reveal plays once and always ends at
  // full opacity. Without IntersectionObserver (or with reduced motion) nothing is ever hidden.
  let io = null;
  try {
    if (!reduceMotion && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) show(e.target); }), { threshold: 0.01, rootMargin: '0px 0px -6% 0px' });
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
  const revealAll = () => {
    $$('.section .center, .about-text, .page-head').forEach((c) => reveal([...c.children]));
    reveal($$('.biz'), 0.1);
    reveal($$('.step-card'), 0.08);
    reveal($$('.std-card'), 0.1);
    reveal($$('.about-mark, .faq, .section-foot, .detail-row'));
  };

  /* ---------- From the config ---------- */
  if (KB.config) KB.config.then((cfg) => {
    if (cfg) {
      const grid = $('#biz-grid'), list = KB.businesses(cfg);
      if (grid && list.length) {
        level = grid.dataset.level || 'h3';
        const cards = list.map((b) => card(b, cfg));
        // the Businesses page always shows "More coming"; Home only when showMoreComingCard is true
        if (grid.dataset.more === 'always' || cfg.showMoreComingCard === true) cards.push(moreCard(cfg));
        grid.replaceChildren(...cards);
        grid.dataset.count = String(cards.length);
        parallax = $$('[data-parallax]');
      }
      const faq = Array.isArray(cfg.faq) ? cfg.faq.filter((f) => f && filled(f.q) && filled(f.a)) : [];
      if (faq.length) {
        $$('[data-faq]').forEach((box) => { const n = parseInt(box.dataset.faq, 10); buildFaq(box, n > 0 ? faq.slice(0, n) : faq); });
        faqLd(faq);
      }
    }
    revealAll();
    onScroll();
  }); else { revealAll(); onScroll(); }
})();
