// Shared by every page: the top bar, the phone menu and the footer, all built from site.config.json, so they change in
// one place. Also: smooth scrolling (Lenis, where the page loads it), the bar's hide-on-scroll, page text marked
// data-c="path.in.config", email links marked data-email, and quiet handling of missing images.
// Other scripts wait for the config with KB.config (a promise of the parsed JSON, or null if it could not load).
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // The site folder (…/kbventures-site/ here, / on its own domain): the folder this script is served from. Pages in
  // sub-folders and the 404 page (which sets <base> from basePath) all resolve links against it.
  const BASE = new URL('./', document.currentScript.src).pathname;
  const page = document.body.dataset.page || '';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => filled(u) && /^https:\/\/[^\s"'<>]+$/.test(u.trim());
  const year = String(Math.max(2026, new Date().getFullYear()));
  // {name}, {location}, {email} and {year} in any text are filled in from the config
  const fill = (s, cfg, extra = {}) => String(s).replace(/\{(\w+)\}/g, (m, k) => {
    const v = k in extra ? extra[k] : k === 'year' ? year : get(cfg, 'company.' + k);
    return v == null ? m : v;
  });
  const isLive = (b) => b && b.status === 'live' && safeUrl(b.url);
  const businesses = (cfg) => (Array.isArray(cfg && cfg.businesses) ? cfg.businesses.filter((b) => b && filled(b.name)) : []);

  const ICON = {
    chevron: '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.4" cy="6.6" r="1.15"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.4 6.4 0 1 0 5.4 6.3V8.6a8.1 8.1 0 0 0 4.4 1.3V6.5a4.5 4.5 0 0 1-4.4-4.5Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>'
  };
  const NETWORK = { instagram: 'Instagram', tiktok: 'TikTok', x: 'X' };
  const wordmark = (cls = '') => `<span class="wm ${cls}"><img src="${BASE}img/kb-wordmark.svg" width="360" height="120" alt=""></span>`;

  /* ---------- Missing images: hide the broken icon, keep the frame ---------- */
  const markMissing = (img) => { img.classList.add('is-missing'); if (img.classList.contains('hero-still')) img.hidden = true; };
  document.addEventListener('error', (e) => { if (e.target && e.target.tagName === 'IMG') markMissing(e.target); }, true);
  $$('img').forEach((img) => { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) markMissing(img); });

  /* ---------- The top bar and phone menu (drawn at once with default labels; the config fills them in) ---------- */
  function headerHTML(t, cfg) {
    const name = get(cfg, 'company.name') || 'KB Ventures';
    const cur = (p) => (page === p ? ' aria-current="page"' : '');
    return `<header class="nav" id="nav">
  <div class="container nav-inner">
    <a class="brand" href="${BASE}" aria-label="${esc(fill(t.home || '{name} home', cfg, { name }))}">${wordmark('brand-word')}<img class="brand-mark" src="${BASE}img/kb-favicon.svg" width="32" height="32" alt=""></a>
    <nav class="nav-links" aria-label="Main">
      <div class="dd" id="dd">
        <button class="nav-link dd-btn" type="button" aria-expanded="false" aria-controls="dd-panel">${esc(t.businesses)}${ICON.chevron}</button>
        <div class="dd-panel" id="dd-panel" data-lenis-prevent hidden><ul class="dd-list" id="dd-list"></ul></div>
      </div>
      <a class="nav-link" href="${BASE}about.html"${cur('about')}>${esc(t.about)}</a>
      <a class="nav-link" href="${BASE}contact.html"${cur('contact')}>${esc(t.contact)}</a>
    </nav>
    <a class="pill pill-primary nav-cta" href="${BASE}contact.html">${esc(t.cta)}</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu"><span class="menu-icon" aria-hidden="true"></span><span class="sr-only">${esc(t.menu)}</span></button>
  </div>
</header>
<div class="menu" id="menu" data-lenis-prevent hidden>
  <nav aria-label="Menu">
    <a href="${BASE}#businesses">${esc(t.businesses)}</a>
    <a href="${BASE}about.html"${cur('about')}>${esc(t.about)}</a>
    <a href="${BASE}contact.html"${cur('contact')}>${esc(t.contact)}</a>
  </nav>
  <a class="pill pill-primary menu-cta" href="${BASE}contact.html">${esc(t.cta)}</a>
</div>`;
  }
  const DEFAULT_NAV = { businesses: 'Businesses', about: 'About', contact: 'Contact', cta: 'Get in touch', menu: 'Menu', close: 'Close', home: '{name} home', comingSoon: 'Coming soon' };
  let navText = DEFAULT_NAV;
  const slot = $('#site-header');
  if (slot) slot.outerHTML = headerHTML(navText, null);
  const nav = $('#nav'), menu = $('#menu'), btn = $('.menu-btn'), dd = $('#dd'), ddBtn = $('.dd-btn'), ddPanel = $('#dd-panel');
  const navH = () => (nav ? nav.offsetHeight : 64);

  // the Businesses dropdown: one row per business with its one-line description; a link only once the business is live
  let ddFilled = false;
  function fillDropdown(cfg) {
    const list = businesses(cfg);
    if (!list.length) return;
    $('#dd-list').innerHTML = list.map((b) => {
      const body = `<span class="dd-name">${esc(b.name)}${isLive(b) ? '' : `<span class="tag">${esc(navText.comingSoon)}</span>`}</span>${filled(b.description) ? `<span class="dd-desc">${esc(b.description)}</span>` : ''}`;
      return `<li>${isLive(b) ? `<a class="dd-item" href="${esc(b.url.trim())}">${body}</a>` : `<div class="dd-item is-soon">${body}</div>`}</li>`;
    }).join('');
    ddFilled = true;
  }
  const ddOpen = () => ddBtn && ddBtn.getAttribute('aria-expanded') === 'true';
  let ddOpenedAt = 0;
  function setDropdown(open, restoreFocus = false) {
    if (!ddBtn) return;
    if (open && !ddFilled) { location.href = BASE + '#businesses'; return; } // no config: go to the cards instead
    if (open && !ddOpen()) ddOpenedAt = Date.now();
    ddBtn.setAttribute('aria-expanded', String(open));
    ddPanel.hidden = !open;
    if (open) nav.classList.remove('is-hidden');
    if (!open && restoreFocus) ddBtn.focus();
  }
  if (ddBtn) {
    // a click right after hover opened it keeps it open (the pointer is already there)
    ddBtn.addEventListener('click', () => { if (ddOpen() && Date.now() - ddOpenedAt < 600) return; setDropdown(!ddOpen()); });
    dd.addEventListener('focusout', (e) => { if (ddOpen() && !dd.contains(e.relatedTarget)) setDropdown(false); });
    document.addEventListener('click', (e) => { if (ddOpen() && !dd.contains(e.target)) setDropdown(false); });
    // with a mouse, it also opens on hover
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let t = null;
      dd.addEventListener('mouseenter', () => { clearTimeout(t); if (ddFilled) setDropdown(true); });
      dd.addEventListener('mouseleave', () => { t = setTimeout(() => { if (!dd.contains(document.activeElement)) setDropdown(false); }, 180); });
    }
  }

  // phone menu: full screen, Escape closes it, focus stays inside while it is open
  const menuOpen = () => btn && btn.getAttribute('aria-expanded') === 'true';
  let lenis = null;
  function setMenu(open, restoreFocus = true) {
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', String(open));
    $('.sr-only', btn).textContent = open ? navText.close : navText.menu;
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) nav.classList.remove('is-hidden');
    if (lenis) (open ? lenis.stop() : lenis.start());
    if (open) $('a', menu).focus(); else if (restoreFocus) btn.focus();
  }
  if (btn && menu) {
    btn.addEventListener('click', () => setMenu(!menuOpen()));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false, false); });
    window.matchMedia('(min-width: 720px)').addEventListener('change', (m) => { if (m.matches && menuOpen()) setMenu(false, false); });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (ddOpen()) { setDropdown(false, true); return; }
      if (menuOpen()) { setMenu(false); return; }
    }
    if (e.key !== 'Tab' || !menuOpen()) return;
    const items = [btn, ...$$('a', menu)], first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- Smooth scroll (pages that load Lenis; off for reduced motion) ---------- */
  const ease = (t) => 1 - Math.pow(1 - t, 3); // close to --ease in styles.css
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.1, easing: ease, smoothWheel: true, syncTouch: false });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  // links to a section of this same page glide there and stop just below the bar
  function goTo(id) {
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return false;
    const top = id === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY - navH() - 8;
    if (lenis) lenis.scrollTo(top, { duration: 1.2 });
    else window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id === 'top' ? location.pathname : '#' + id);
    const focusTarget = id === 'top' ? $('#main') : target;
    if (focusTarget) { if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1'); focusTarget.focus({ preventScroll: true }); }
    return true;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    if (a.pathname !== location.pathname || a.origin !== location.origin) return;
    const id = decodeURIComponent(a.hash.slice(1));
    if (!id || id === 'main') return; // the skip link keeps its native jump
    if (menuOpen()) setMenu(false, false);
    if (goTo(id)) e.preventDefault();
  });

  /* ---------- The bar: see-through at the top, frosted once scrolled, hides going down and returns going up ---------- */
  let lastY = window.scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    const y = Math.max(0, window.scrollY);
    if (!nav) return;
    nav.classList.toggle('is-scrolled', y > 8);
    const dy = y - lastY;
    if (Math.abs(dy) < 6) return;
    const keep = menuOpen() || ddOpen() || nav.contains(document.activeElement);
    nav.classList.toggle('is-hidden', dy > 0 && y > navH() * 2 && !keep);
    lastY = y;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  if (nav) nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
  onScroll();

  /* ---------- Footer ---------- */
  function socialsHTML(cfg) {
    const s = cfg.socials || {}, label = get(cfg, 'footer.socialLabel') || '{name} on {network}';
    return Object.keys(NETWORK).filter((k) => safeUrl(s[k])).map((k) =>
      `<li><a href="${esc(s[k].trim())}" target="_blank" rel="noopener" aria-label="${esc(fill(label, cfg, { network: NETWORK[k] }))}">${ICON[k]}</a></li>`).join('');
  }
  function footerHTML(cfg) {
    const f = cfg.footer || {}, email = get(cfg, 'company.email'), abn = get(cfg, 'company.abn');
    const list = businesses(cfg);
    const bizItems = list.map((b) => (isLive(b)
      ? `<li><a href="${esc(b.url.trim())}">${esc(b.name)}</a></li>`
      : `<li><span class="footer-soon">${esc(b.name)}</span> <span class="tag">${esc(navText.comingSoon)}</span></li>`)).join('');
    // the VCAA line goes wherever the footer mentions AceGuides or VCE
    const vce = list.some((b) => /aceguides|\bvce\b/i.test(b.name)) && filled(f.vceTrademark);
    const cur = (p) => (page === p ? ' aria-current="page"' : '');
    return `<footer class="footer" id="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="footer-logo" href="${BASE}" aria-label="${esc(fill(navText.home, cfg))}">${wordmark()}</a>
        ${filled(email) ? `<a class="footer-email" href="mailto:${esc(email.trim())}">${esc(email.trim())}</a>` : ''}
        <ul class="socials">${socialsHTML(cfg)}</ul>
      </div>
      ${list.length ? `<nav class="footer-col" aria-labelledby="footer-biz"><h2 class="footer-h" id="footer-biz">${esc(f.businesses || 'Businesses')}</h2><ul class="footer-list">${bizItems}</ul></nav>` : ''}
      <nav class="footer-col" aria-labelledby="footer-company"><h2 class="footer-h" id="footer-company">${esc(f.company || 'Company')}</h2>
        <ul class="footer-list">
          <li><a href="${BASE}about.html"${cur('about')}>${esc(f.about || 'About')}</a></li>
          <li><a href="${BASE}contact.html"${cur('contact')}>${esc(f.contact || 'Contact')}</a></li>
          <li><a href="${BASE}legal/privacy.html"${cur('privacy')}>${esc(f.privacy || 'Privacy')}</a></li>
          <li><a href="${BASE}legal/terms.html"${cur('terms')}>${esc(f.terms || 'Terms')}</a></li>
          <li><a href="${BASE}legal/refunds.html"${cur('refunds')}>${esc(f.refunds || 'Refunds')}</a></li>
        </ul>
      </nav>
    </div>
    <div class="footer-bottom">
      <p>${esc(fill(f.copyright || '© {year} {name}. Based in {location}.', cfg))}</p>
      ${filled(abn) ? `<p>${esc(f.abnLabel || 'ABN')} ${esc(abn.trim())}</p>` : ''}
      ${vce ? `<p>${esc(f.vceTrademark)}</p>` : ''}
    </div>
  </div>
</footer>`;
  }

  /* ---------- Everything from site.config.json ---------- */
  function apply(cfg) {
    navText = Object.assign({}, DEFAULT_NAV, cfg.nav || {});
    // labels in the bar and menu
    if (ddBtn) ddBtn.firstChild.textContent = navText.businesses;
    const links = $$('.nav-links > a', nav), mlinks = $$('nav a', menu);
    [navText.about, navText.contact].forEach((t, i) => { if (links[i]) links[i].textContent = t; if (mlinks[i + 1]) mlinks[i + 1].textContent = t; });
    if (mlinks[0]) mlinks[0].textContent = navText.businesses;
    $$('.nav-cta, .menu-cta').forEach((a) => { a.textContent = navText.cta; });
    $('.sr-only', btn).textContent = menuOpen() ? navText.close : navText.menu;
    $('.brand').setAttribute('aria-label', fill(navText.home, cfg));
    fillDropdown(cfg);
    // footer
    const foot = $('#site-footer');
    if (foot) foot.outerHTML = footerHTML(cfg);
    // page text: data-c="path.in.config"
    $$('[data-c]').forEach((node) => {
      const v = get(cfg, node.dataset.c);
      if (filled(v)) node.textContent = fill(v, cfg);
    });
    // email links and social icons anywhere on the page
    const email = get(cfg, 'company.email');
    if (filled(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) $$('a[data-email]').forEach((a) => { a.href = 'mailto:' + email.trim(); a.textContent = email.trim(); });
    $$('[data-socials]').forEach((ul) => { ul.innerHTML = socialsHTML(cfg); });
    // structured data keeps the email and social links in step
    const ld = $('#org-data');
    if (ld) {
      try {
        const d = JSON.parse(ld.textContent);
        if (filled(get(cfg, 'company.name'))) d.name = cfg.company.name;
        if (filled(email)) d.email = email.trim();
        const same = Object.keys(NETWORK).map((k) => (cfg.socials || {})[k]).filter(safeUrl).map((u) => u.trim());
        if (same.length) d.sameAs = same; else delete d.sameAs;
        ld.textContent = JSON.stringify(d);
      } catch (_) { /* keep the static copy */ }
    }
  }

  const config = fetch(BASE + 'site.config.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  window.KB = { base: BASE, config, filled, get, esc, safeUrl, fill, isLive, businesses, reduceMotion, lenis: () => lenis, goTo };
  config.then((cfg) => { if (cfg) apply(cfg); });
})();
