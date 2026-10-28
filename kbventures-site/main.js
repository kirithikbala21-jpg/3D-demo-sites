// Page behaviour: smooth scroll (Lenis) that stops below the sticky nav, nav state (hairline, active section, phone menu),
// the hero object's parallax, slow fade-ups, the concept-websites carousel, quiet handling of missing images, and all the
// page text from site.config.json. The HTML holds the same text, so the page still works if the config cannot load.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = $('#nav'), track = $('#track');
  const navH = () => (nav ? nav.offsetHeight : 64);
  // the same curve as --ease in styles.css (cubic-bezier(.22, .61, .36, 1)), close enough to an ease-out cubic
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* ---------- Missing images: hide the broken icon, keep the frame ---------- */
  const markMissing = (img) => { img.classList.add('is-missing'); if (img.classList.contains('hero-still')) img.hidden = true; };
  document.addEventListener('error', (e) => { if (e.target && e.target.tagName === 'IMG') markMissing(e.target); }, true);
  $$('img').forEach((img) => { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) markMissing(img); });

  /* ---------- Smooth scroll (off for reduced motion; native scrolling is the fallback) ---------- */
  if (track) track.setAttribute('data-lenis-prevent', ''); // the row scrolls sideways natively
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.1, easing: ease, smoothWheel: true, syncTouch: false });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  function goTo(id) {
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return false;
    if (lenis) lenis.scrollTo(id === 'top' ? 0 : target, { offset: -navH() - 8, duration: 1.2 });
    else window.scrollTo({ top: id === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY - navH() - 8, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id === 'top' ? location.pathname : '#' + id);
    const focusTarget = id === 'top' ? $('#main') : target;
    if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
    return true;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id || id === 'main') return;
    if (menuOpen()) setMenu(false, false);
    if (goTo(id)) e.preventDefault();
  });

  /* ---------- Phone menu: full screen, closes on link tap and Escape, keeps focus inside ---------- */
  const btn = $('.menu-btn'), menu = $('#menu');
  const menuOpen = () => btn && btn.getAttribute('aria-expanded') === 'true';
  function setMenu(open, restoreFocus = true) {
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('.sr-only').textContent = open ? (window.__kbText && window.__kbText.close) || 'Close' : (window.__kbText && window.__kbText.menu) || 'Menu';
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (lenis) (open ? lenis.stop() : lenis.start());
    if (open) $('a', menu).focus(); else if (restoreFocus) btn.focus();
  }
  if (btn && menu) {
    btn.hidden = false;
    btn.addEventListener('click', () => setMenu(!menuOpen()));
    document.addEventListener('keydown', (e) => {
      if (!menuOpen()) return;
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key !== 'Tab') return;
      const items = [btn, ...$$('a', menu)], first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.matchMedia('(min-width: 720px)').addEventListener('change', (m) => { if (m.matches && menuOpen()) setMenu(false, false); });
  }

  /* ---------- Nav hairline, active section, hero parallax ---------- */
  const stage = $('#stage');
  const parallax = $$('[data-parallax]'), watermarks = $$('.watermark'), steps = $('#steps');
  const navLinks = $$('.nav-links a');
  const sectionFor = { businesses: 'businesses', how: 'businesses', websites: 'websites', testimonials: 'websites', contact: 'contact' };
  const sections = Object.keys(sectionFor).map((id) => document.getElementById(id)).filter(Boolean);
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 8);
    // the active link belongs to the last section whose top has passed 40% of the screen
    let current = null;
    const line = navH() + window.innerHeight * 0.4;
    for (const s of sections) if (!s.hidden && s.getBoundingClientRect().top <= line) current = sectionFor[s.id];
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 4) current = 'contact';
    navLinks.forEach((a) => { if (a.getAttribute('href') === '#' + current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if (stage && !reduceMotion) {
      const p = Math.min(1, y / Math.max(1, window.innerHeight));
      stage.style.setProperty('--py', (p * 40).toFixed(1) + 'px'); // the card lags a little behind the page
    }
    if (!reduceMotion) {
      const vh = window.innerHeight, mid = vh / 2;
      // gentle parallax for the card visuals (data-parallax = how many px they travel either way)
      parallax.forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - mid) / vh)); el.style.setProperty('--px', (t * +el.dataset.parallax).toFixed(1) + 'px'); });
      // the faint KB watermarks drift slower than the page
      watermarks.forEach((el) => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; el.style.setProperty('--wy', ((r.top + r.height / 2 - mid) * -0.12).toFixed(1) + 'px'); });
      // the steps' connecting line draws itself between 85% and 45% of the screen
      if (steps) { const r = steps.getBoundingClientRect(); steps.style.setProperty('--draw', Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.4))).toFixed(3)); }
    }
    flushIfBottom();
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Slow fade-ups as things come into view (once) ---------- */
  // Fail-safe: content is visible unless this script has marked it as waiting; a reveal plays once and always ends at
  // full opacity. Without IntersectionObserver (or with reduced motion) nothing is ever hidden.
  let io = null;
  try {
    if (!reduceMotion && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: 0.01, rootMargin: '0px 0px -4% 0px' });
    }
  } catch (_) { io = null; }
  const waiting = new Set();
  const show = (el) => { el.classList.add('is-visible'); waiting.delete(el); if (io) io.unobserve(el); };
  const reveal = (els, step = 0.07) => els.forEach((el, i) => {
    el.style.setProperty('--d', (i * step).toFixed(2) + 's');
    if (!io) return; // never hide anything we can't reliably reveal
    el.classList.add('reveal'); waiting.add(el); io.observe(el);
  });
  // safety nets: at the bottom of the page everything shows, and nothing above the fold waits longer than 2.5s
  const flushIfBottom = () => { if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40) waiting.forEach(show); };
  setTimeout(() => waiting.forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight) show(el); }), 2500);
  $$('.section .center').forEach((c) => reveal([...c.children]));
  reveal($$('.biz'), 0.1);
  reveal($$('.step'), 0.12);
  onScroll();
  reveal([$('#carousel'), $('.footer-logo')].filter(Boolean));

  /* ---------- Concept websites carousel: start-aligned, next card peeking ---------- */
  const controls = $('#carousel-controls'), dotsBox = $('#dots'), prev = $('#prev'), next = $('#next');
  let slides = [], active = 0;
  const maxScroll = () => track.scrollWidth - track.clientWidth;
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: Math.min(slides[i].offsetLeft - slides[0].offsetLeft, maxScroll()), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function update() {
    const x = track.scrollLeft, base = slides[0].offsetLeft;
    let best = 0, dist = Infinity;
    slides.forEach((s, i) => { const d = Math.abs(s.offsetLeft - base - x); if (d < dist) { dist = d; best = i; } });
    if (x >= maxScroll() - 2) best = slides.length - 1; // the last card can't start-align, it sits flush right
    active = best;
    $$('button', dotsBox).forEach((b, i) => b.setAttribute('aria-current', String(i === best)));
    prev.disabled = best === 0; next.disabled = best === slides.length - 1;
  }
  function setupCarousel() {
    if (!track || !controls) return;
    slides = [...track.children];
    if (!slides.length) return;
    dotsBox.replaceChildren(...slides.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Show website ${i + 1} of ${slides.length}: ${s.querySelector('.card-title').textContent}`);
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

  /* ---------- All page text from site.config.json ---------- */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  const safeUrl = (u) => filled(u) && /^https:\/\//.test(u.trim());
  const local = (u) => typeof u === 'string' && /^img\/(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.webp$/.test(u); // images inside img/ (subfolders allowed, no ..)
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const img = (src, w, h, alt) => { const i = el('img'); i.src = src; i.width = w; i.height = h; i.alt = alt; i.loading = 'lazy'; i.decoding = 'async'; return i; };

  function slide(d, i, n, openLabel) {
    const li = el('li', 'slide card');
    li.setAttribute('aria-roledescription', 'slide');
    li.setAttribute('aria-label', `${i + 1} of ${n}: ${d.name}`);
    if (local(d.desktop)) {
      const shot = el('div', 'shot'), browser = el('div', 'browser'), bar = el('div', 'browser-bar');
      bar.setAttribute('aria-hidden', 'true'); bar.append(el('i'), el('i'), el('i'));
      const tall = local(d.tall);
      const shotImg = img(tall ? d.tall : d.desktop, 1280, tall ? 1956 : 800, `Front page of ${d.name}, a concept ${String(d.type).toLowerCase()} website`);
      if (tall) shotImg.className = 'scroll-shot';
      browser.append(bar, shotImg);
      shot.append(browser);
      if (local(d.mobile)) { const ph = el('div', 'phone'); ph.append(img(d.mobile, 480, 1039, 'The same page on a phone')); shot.append(ph); }
      li.append(shot);
    }
    const text = el('div', 'slide-text');
    const a = el('a', 'pill pill-secondary', openLabel || 'Open demo');
    a.href = d.url; a.target = '_blank'; a.rel = 'noopener';
    a.append(el('span', 'sr-only', `: ${d.name} (opens in a new tab)`));
    text.append(el('p', 'label', d.type), el('h3', 'card-title', d.name), el('p', 'dim', d.line), a);
    li.append(text);
    return li;
  }

  function apply(cfg) {
    const location = filled(cfg.location) ? cfg.location : '';
    window.__kbText = cfg.nav || {};
    // every element marked data-c="path.to.text" takes its text from the config; {location} is filled in
    $$('[data-c]').forEach((node) => {
      const v = get(cfg, node.dataset.c);
      if (filled(v)) node.textContent = v.replace('{location}', location);
    });
    if (cfg.meta) {
      if (filled(cfg.meta.title)) document.title = cfg.meta.title;
      if (filled(cfg.meta.description)) { const m = $('meta[name="description"]'); if (m) m.content = cfg.meta.description; }
    }
    // email everywhere
    if (filled(cfg.email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email)) {
      for (const id of ['mail', 'mail-foot']) { const m = document.getElementById(id); if (m) { m.href = 'mailto:' + cfg.email; m.textContent = cfg.email; } }
    }
    // AceGuides: a real "See the guides" pill once the shop address is filled in, otherwise one quiet line
    const foot = $('#ace-foot'), ace = get(cfg, 'businesses.aceguides') || {};
    if (foot) {
      if (safeUrl(cfg.aceguidesShopUrl)) {
        const a = el('a', 'pill pill-secondary', ace.shopButton || 'See the guides'); a.href = cfg.aceguidesShopUrl.trim();
        foot.replaceChildren(a);
      } else if (filled(ace.noShopLine)) foot.replaceChildren(el('p', 'quiet', ace.noShopLine));
      else foot.hidden = true;
    }
    // AceGuides covers and the KB Websites preview, from the config
    const covers = Array.isArray(ace.covers) ? ace.covers.filter((c) => c && local(c.src) && filled(c.alt)) : [];
    const stack = $('#cover-stack');
    if (stack && covers.length) stack.replaceChildren(...covers.slice(0, 5).map((c) => { const i = img(c.src, 720, 960, c.alt); i.className = 'cover'; return i; }));
    const pv = get(cfg, 'businesses.kbwebsites.preview'), pvImg = $('#kb-preview');
    if (pvImg && pv && local(pv.src)) { pvImg.src = pv.src; if (filled(pv.alt)) pvImg.alt = pv.alt; }
    // optional links and ABN: shown only when filled in
    for (const key of ['instagram', 'linkedin']) { const a = document.getElementById(key); if (a) { if (safeUrl(cfg[key])) { a.href = cfg[key].trim(); a.hidden = false; } else a.hidden = true; } }
    const abn = $('#abn');
    if (abn) { if (filled(cfg.abn)) { abn.textContent = `${get(cfg, 'footer.abnLabel') || 'ABN'} ${cfg.abn.trim()}`; abn.hidden = false; } else abn.hidden = true; }
    // testimonials: only real ones with a quote and a name
    const quotes = Array.isArray(cfg.testimonials) ? cfg.testimonials.filter((q) => q && filled(q.quote) && filled(q.name)) : [];
    const tSection = $('#testimonials');
    if (tSection) {
      if (quotes.length) {
        $('#quotes').replaceChildren(...quotes.map((q) => {
          const f = el('figure', 'card quote'), b = el('blockquote');
          b.textContent = `“${q.quote.trim()}”`;
          f.append(b, el('figcaption', '', [q.name, q.business].filter(filled).join(' · ')));
          return f;
        }));
        tSection.hidden = false;
        reveal([...$('.center', tSection).children]); reveal($$('.quote', tSection), 0.1);
      } else tSection.hidden = true;
    }
    // the demo row
    const demos = Array.isArray(cfg.demos) ? cfg.demos.filter((d) => d && filled(d.name) && filled(d.type) && safeUrl(d.url)) : [];
    if (track && demos.length) { track.replaceChildren(...demos.map((d, i) => slide(d, i, demos.length, get(cfg, 'websites.openDemo')))); setupCarousel(); }
    // structured data stays in step with the config
    const ld = $('#org-data');
    if (ld) {
      try {
        const data = JSON.parse(ld.textContent);
        if (filled(cfg.name)) data.name = cfg.name;
        if (filled(cfg.email)) data.email = cfg.email;
        if (cfg.meta && filled(cfg.meta.description)) data.description = cfg.meta.description;
        const same = ['instagram', 'linkedin'].filter((k) => safeUrl(cfg[k])).map((k) => cfg[k].trim());
        if (same.length) data.sameAs = same; else delete data.sameAs;
        ld.textContent = JSON.stringify(data);
      } catch (_) { /* keep the static copy */ }
    }
  }

  fetch('site.config.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((cfg) => { if (cfg) apply(cfg); onScroll(); }).catch(() => { /* keep the HTML copy */ });

  const year = $('#year'); if (year) year.textContent = String(Math.max(2026, new Date().getFullYear()));
})();
