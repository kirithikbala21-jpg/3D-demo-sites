// Page behaviour: smooth scroll (Lenis), header blur, progress bar, split-text headings, reveals, hero parallax,
// and the content that comes from site.config.json. The HTML already holds the same content, so the page still
// works when this file or the config cannot load (for example when index.html is opened straight from disk).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Smooth scroll (off for reduced motion; native scrolling is the fallback) ---------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true, syncTouch: false });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target || !lenis) return;
    e.preventDefault();
    lenis.scrollTo(id === 'top' ? 0 : target, { offset: id === 'top' ? 0 : -64, duration: 1.2 });
    history.replaceState(null, '', id === 'top' ? location.pathname : '#' + id);
    if (target !== document.body) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });

  /* ---------- Header blur, progress bar and three-layer hero parallax ---------- */
  const header = $('#header'), bar = $('.progress'), hero = $('.hero');
  if (hero && !reduceMotion) hero.classList.add('hero-px');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 24);
    bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    if (hero && !reduceMotion) {
      const h = Math.max(0, Math.min(y, hero.offsetHeight));
      // background drifts the most, text the least: at most about 30px across the hero
      hero.style.setProperty('--hp1', (h * 0.035).toFixed(1) + 'px');
      hero.style.setProperty('--hp2', (h * 0.02).toFixed(1) + 'px');
      hero.style.setProperty('--hp3', (h * -0.012).toFixed(1) + 'px');
    }
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Split-text headings: each word rises into place ---------- */
  function split(node, n) {
    [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', n.i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) split(c, n);
    });
  }
  const heads = $$('[data-split]');
  heads.forEach((h) => { h.setAttribute('aria-label', h.textContent.trim()); split(h, { i: 0 }); $$('.w', h).forEach((w) => w.setAttribute('aria-hidden', 'true')); });

  /* ---------- Reveal on scroll (once, staggered between siblings) ---------- */
  function watch(els) {
    els.forEach((el) => {
      const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      el.style.setProperty('--d', Math.min(Math.max(sibs.indexOf(el), 0), 4) * 0.06 + 's');
    });
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-visible', 'is-in')); return; }
    els.forEach((el) => io.observe(el));
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add(e.target.hasAttribute('data-split') ? 'is-in' : 'is-visible');
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }) : null;
  watch($$('.reveal'));
  if (reduceMotion || !io) heads.forEach((h) => h.classList.add('is-in')); else heads.forEach((h) => io.observe(h));

  /* ---------- Content from site.config.json ---------- */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const arrow = () => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M7 17 17 7M8 7h9v9'); s.append(p); return s; };
  const img = (src, w, h) => { const i = el('img'); i.src = src; i.alt = ''; i.width = w; i.height = h; i.loading = 'lazy'; i.decoding = 'async'; return i; };
  const safe = (u) => typeof u === 'string' && /^https:\/\//.test(u);
  const local = (u) => typeof u === 'string' && /^img\/[\w.-]+\.webp$/.test(u);

  function demoRow(d, i) {
    const art = el('article', 'demo reveal');
    const media = el('a', 'demo-media');
    media.href = d.url; media.target = '_blank'; media.rel = 'noopener'; media.tabIndex = -1; media.setAttribute('aria-hidden', 'true');
    if (local(d.desktop)) { const b = el('span', 'browser'), top = el('span', 'browser-bar'); top.append(el('i'), el('i'), el('i')); b.append(top, img(d.desktop, 1200, 750)); media.append(b); }
    if (local(d.mobile)) { const p = el('span', 'phone'); p.append(img(d.mobile, 600, 1299)); media.append(p); }
    const copy = el('div', 'demo-copy');
    const a = el('a', 'btn btn-ghost', 'Open demo ');
    a.href = d.url; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', `Open demo: ${d.name} (opens in a new tab)`); a.append(arrow());
    copy.append(el('span', 'demo-num', String(i + 1).padStart(2, '0')), el('span', 'demo-type', d.type), el('h3', '', d.name), el('p', '', d.line), a);
    if (media.childElementCount) art.append(media);
    art.append(copy);
    return art;
  }

  fetch('site.config.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((cfg) => {
    if (!cfg) return;
    const list = $('#demo-list');
    const demos = Array.isArray(cfg.demos) ? cfg.demos.filter((d) => d && d.name && safe(d.url)) : [];
    if (list && demos.length) { const rows = demos.map(demoRow); list.replaceChildren(...rows); watch(rows); }
    const note = $('#demos-note'); if (note && cfg.demosNote) note.textContent = cfg.demosNote;
    const shop = $('#ace-actions');
    if (shop) {
      shop.replaceChildren();
      if (safe(cfg.aceguidesShopUrl)) { const a = el('a', 'btn btn-primary', 'Visit the AceGuides shop '); a.href = cfg.aceguidesShopUrl; a.append(arrow()); shop.append(a); }
    }
    if (cfg.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email)) { $('#mail').href = 'mailto:' + cfg.email; $('#mail-text').textContent = cfg.email; }
    if (cfg.location) $('#location').textContent = cfg.location;
  }).catch(() => { /* keep the HTML copy */ });
  const year = $('#year'); if (year) year.textContent = String(Math.max(2026, new Date().getFullYear()));
})();
