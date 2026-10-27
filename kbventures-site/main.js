// Page behaviour: smooth scroll (Lenis), the hero's load sequence, small scroll reveals, today's date in the dateline,
// and the content that comes from site.config.json. The HTML already holds the same content, so the page still
// works when this file or the config cannot load (for example when index.html is opened straight from disk).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Smooth scroll (off for reduced motion; native scrolling is the fallback) ---------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true, syncTouch: false });
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
    lenis.scrollTo(id === 'top' ? 0 : target, { offset: -16, duration: 1.3 });
    history.replaceState(null, '', id === 'top' ? location.pathname : '#' + id);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- Dateline: today's date in Melbourne, like the top of a newspaper ---------- */
  const dateline = $('#dateline');
  if (dateline) {
    try {
      const today = new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Melbourne' }).format(new Date());
      dateline.textContent = 'Melbourne, ' + today;
    } catch (_) { /* keep "Melbourne, Australia" */ }
  }

  /* ---------- Hero load sequence: words rise, the proof settles, the red pencil underlines ---------- */
  const hero = $('.hero'), title = $('.hero-title');
  if (title) {
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    let i = 0;
    const split = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span'), inner = document.createElement('span');
            w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            inner.textContent = part; inner.style.setProperty('--i', i++);
            w.append(inner); frag.append(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName !== 'svg') split(c);
      });
    };
    split(title);
  }
  const start = () => requestAnimationFrame(() => hero && hero.classList.add('is-loaded'));
  // wait for the headline font (max 1.2s) so the words don't jump when it swaps in
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]).then(start);

  /* ---------- Small reveals as sections come into view (once) ---------- */
  const io = !reduceMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    : null;
  const watch = (els) => els.forEach((el) => { el.classList.add('reveal'); if (io) io.observe(el); else el.classList.add('is-visible'); });
  watch($$('.businesses .biz, .process-text, .work-title, .work-note, .piece, .contact-text, .email'));

  /* ---------- Content from site.config.json ---------- */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const safe = (u) => typeof u === 'string' && /^https:\/\//.test(u);
  const local = (u) => typeof u === 'string' && /^img\/[\w.-]+\.webp$/.test(u);
  const img = (src, w, h) => { const i = el('img'); i.src = src; i.alt = ''; i.width = w; i.height = h; i.loading = 'lazy'; i.decoding = 'async'; return i; };
  const newTab = (a) => { a.target = '_blank'; a.rel = 'noopener'; a.append(el('span', 'sr-only', ' (opens in a new tab)')); return a; };

  function piece(d) {
    const li = el('li', 'piece grid' + (d.phone && local(d.mobile) ? ' has-phone' : ''));
    if (local(d.desktop)) {
      const pic = el('a', 'piece-image');
      pic.href = d.url; pic.target = '_blank'; pic.rel = 'noopener'; pic.tabIndex = -1; pic.setAttribute('aria-hidden', 'true');
      pic.append(img(d.desktop, 1200, 750));
      if (d.phone && local(d.mobile)) { const ph = el('span', 'phone'); ph.append(img(d.mobile, 600, 1299)); pic.append(ph); }
      li.append(pic);
    }
    const text = el('div', 'piece-text');
    text.append(el('p', 'piece-type', d.type), el('h3', 'piece-name', d.name), el('p', 'piece-line', d.line));
    if (d.aside) text.append(el('p', 'piece-aside', d.aside));
    const a = el('a', 'link link-on-ink', 'Open the demo'); a.href = d.url;
    text.append(newTab(a));
    li.append(text);
    return li;
  }

  fetch('site.config.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((cfg) => {
    if (!cfg) return;
    const list = $('#demo-list');
    const demos = Array.isArray(cfg.demos) ? cfg.demos.filter((d) => d && d.name && safe(d.url)) : [];
    if (list && demos.length) { const items = demos.map(piece); list.replaceChildren(...items); watch(items); }
    const note = $('#demos-note'); if (note && cfg.demosNote) note.textContent = cfg.demosNote;
    const shop = $('#ace-actions');
    if (shop) {
      shop.replaceChildren();
      if (safe(cfg.aceguidesShopUrl)) { const a = el('a', 'link', 'Visit the AceGuides shop'); a.href = cfg.aceguidesShopUrl; shop.append(a); }
    }
    if (cfg.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email)) {
      $('#mail').href = 'mailto:' + cfg.email; $('#mail-text').textContent = cfg.email;
      const f = $('#mail-foot'); if (f) { f.href = 'mailto:' + cfg.email; f.textContent = cfg.email; }
    }
    if (cfg.location) $('#location').textContent = cfg.location;
  }).catch(() => { /* keep the HTML copy */ });

  const year = $('#year'); if (year) year.textContent = String(Math.max(2026, new Date().getFullYear()));
})();
