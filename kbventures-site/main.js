// Page behaviour: smooth scroll (Lenis), sticky-nav hairline, hero frame parallax, slow fade-ups, the concept-websites
// carousel (dots, arrow buttons, arrow keys, swipe), and the content that comes from site.config.json. The HTML already
// holds the same content, so the page still works when this file or the config cannot load.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const track = $('#track');
  if (track) track.setAttribute('data-lenis-prevent', ''); // the row scrolls sideways natively (swipe, trackpad, keys)

  /* ---------- Smooth scroll (off for reduced motion; native scrolling is the fallback) ---------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true, syncTouch: false });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !lenis || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(id === 'top' ? 0 : target, { offset: -(($('#nav') || {}).offsetHeight || 64) - 8, duration: 1.4 });
    history.replaceState(null, '', id === 'top' ? location.pathname : '#' + id);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- Nav hairline once scrolled, and the hero frame's slow parallax ---------- */
  const nav = $('#nav'), frame = $('#hero-frame');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 8);
    if (frame && !reduceMotion) {
      const p = Math.min(1, y / Math.max(1, window.innerHeight)); // 0 at the top, 1 one screen down
      frame.style.setProperty('--py', (p * -36).toFixed(1) + 'px'); // drifts up a little slower than the page
      frame.style.setProperty('--tilt', ((window.innerWidth < 720 ? 4 : 7) * (1 - p)).toFixed(2) + 'deg'); // and straightens
    }
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Slow fade-up as things come into view (once) ---------- */
  const io = !reduceMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })
    : null;
  const reveal = (els, step = 0.08) => els.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', (i * step).toFixed(2) + 's'); if (io) io.observe(el); else el.classList.add('is-visible'); });
  $$('.section .center').forEach((c) => reveal([...c.children]));
  reveal($$('.biz'), 0.12);
  reveal([$('#carousel')].filter(Boolean));
  reveal([$('.footer-mark')].filter(Boolean));

  /* ---------- Concept websites carousel ---------- */
  const controls = $('#carousel-controls'), dotsBox = $('#dots'), prev = $('#prev'), next = $('#next');
  let slides = [], active = 0;
  const behavior = () => (reduceMotion ? 'auto' : 'smooth');
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    const s = slides[i];
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: behavior() });
  }
  function update() {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    slides.forEach((s, i) => { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
    active = best;
    $$('button', dotsBox).forEach((b, i) => b.setAttribute('aria-current', String(i === best)));
    prev.disabled = best === 0; next.disabled = best === slides.length - 1;
  }
  function setupCarousel() {
    if (!track || !controls) return;
    slides = [...track.children];
    dotsBox.replaceChildren(...slides.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Show website ${i + 1} of ${slides.length}: ${s.querySelector('.slide-name').textContent}`);
      b.setAttribute('aria-controls', 'track');
      b.addEventListener('click', () => go(i));
      return b;
    }));
    controls.hidden = false;
    update();
  }
  if (track) {
    let t = false;
    track.addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(() => { t = false; update(); }); } }, { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.target !== track) return; // links inside the cards keep their own keys
      const k = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: slides.length - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault(); go(k);
    });
    prev.addEventListener('click', () => go(active - 1));
    next.addEventListener('click', () => go(active + 1));
    window.addEventListener('resize', () => { if (slides.length) go(active); });
    setupCarousel();
  }

  /* ---------- Content from site.config.json ---------- */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const safe = (u) => typeof u === 'string' && /^https:\/\//.test(u);
  const local = (u) => typeof u === 'string' && /^img\/[\w.-]+\.webp$/.test(u);
  const img = (src, w, h, alt) => { const i = el('img'); i.src = src; i.width = w; i.height = h; i.alt = alt; i.loading = 'lazy'; i.decoding = 'async'; return i; };

  function slide(d, i, n) {
    const li = el('li', 'slide card');
    li.setAttribute('aria-roledescription', 'slide');
    li.setAttribute('aria-label', `${i + 1} of ${n}: ${d.name}`);
    if (local(d.desktop)) {
      const shot = el('div', 'shot'), browser = el('div', 'browser'), bar = el('div', 'browser-bar');
      bar.setAttribute('aria-hidden', 'true'); bar.append(el('i'), el('i'), el('i'));
      browser.append(bar, img(d.desktop, 1280, 800, `Front page of ${d.name}, a concept ${d.type.toLowerCase()} website`));
      shot.append(browser);
      if (local(d.mobile)) { const ph = el('div', 'phone'); ph.append(img(d.mobile, 480, 1039, 'The same page on a phone')); shot.append(ph); }
      li.append(shot);
    }
    const text = el('div', 'slide-text');
    const a = el('a', 'pill pill-secondary pill-sm', 'Open demo');
    a.href = d.url; a.target = '_blank'; a.rel = 'noopener';
    a.append(el('span', 'sr-only', `: ${d.name} (opens in a new tab)`));
    text.append(el('p', 'label', d.type), el('h3', 'slide-name', d.name), el('p', 'dim', d.line), a);
    li.append(text);
    return li;
  }

  fetch('site.config.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((cfg) => {
    if (!cfg) return;
    const demos = Array.isArray(cfg.demos) ? cfg.demos.filter((d) => d && d.name && d.type && safe(d.url)) : [];
    if (track && demos.length) { track.replaceChildren(...demos.map((d, i) => slide(d, i, demos.length))); setupCarousel(); }
    const note = $('#demos-note'); if (note && cfg.demosNote) note.textContent = cfg.demosNote;
    const shop = $('#ace-actions');
    if (shop) {
      shop.replaceChildren();
      if (safe(cfg.aceguidesShopUrl)) { const a = el('a', 'pill pill-secondary pill-sm', 'Visit the AceGuides shop'); a.href = cfg.aceguidesShopUrl; shop.append(a); }
    }
    if (cfg.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email)) {
      for (const id of ['mail', 'mail-foot']) { const m = document.getElementById(id); if (m) { m.href = 'mailto:' + cfg.email; m.textContent = cfg.email; } }
    }
    const loc = $('#location'); if (loc && cfg.location) loc.textContent = cfg.location;
  }).catch(() => { /* keep the HTML copy */ });

  const year = $('#year'); if (year) year.textContent = String(Math.max(2026, new Date().getFullYear()));
})();
