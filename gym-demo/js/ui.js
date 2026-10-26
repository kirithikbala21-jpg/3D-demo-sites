// Page behaviour: header, full-screen menu, announcement bar, split-text / reveal / count-up animations, magnetic buttons, hours status, cookies, photo zoom.
import { $, $$, site, reduceMotion, finePointer, gymNow, clock, CLOCK_CFG, store, toast } from './util.js';

/* ---------- Header shrinks on scroll, progress bar, hero parallax ---------- */
(() => {
  const bar = $('.progress'), header = $('.site-header'), hero = $('.hero');
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    header.classList.toggle('is-scrolled', y > 40);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* ---------- Full-screen menu (aria-expanded, Escape, link click, focus trap) ---------- */
(() => {
  const toggle = $('.nav-toggle'), menu = $('#mobile-nav');
  const focusables = () => [toggle, ...$$('a[href], button', menu).filter((n) => n.offsetParent !== null)];
  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.body.classList.toggle('no-scroll', open);
    if (open) $('a[href]', menu).focus();
  }
  toggle.addEventListener('click', () => setOpen(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { setOpen(false); toggle.focus(); return; }
    if (e.key !== 'Tab') return;
    const items = focusables(), first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();

/* ---------- Announcement bar: dismiss and remember (localStorage "vc-announce") ---------- */
(() => {
  const btn = $('#announce-close'), bar = $('#announce');
  if (!btn || !bar) return;
  btn.addEventListener('click', () => {
    document.documentElement.classList.add('no-announce');
    store('vc-announce', 'off');
    const link = $('.brand'); if (link) link.focus();
  });
})();

/* ---------- Split-text headings ---------- */
(() => {
  const heads = $$('[data-split]');
  let n = 0;
  function split(node) {
    [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', n++);
          w.appendChild(inner); frag.appendChild(w);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) split(c);
    });
  }
  heads.forEach((h) => { n = 0; split(h); });
  if (reduceMotion || !('IntersectionObserver' in window)) { heads.forEach((h) => h.classList.add('is-in')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.3 });
  heads.forEach((h) => io.observe(h));
})();

/* ---------- Reveal on scroll + count-up (once) ---------- */
(() => {
  const reveals = $$('.reveal'), counters = $$('[data-count]');
  reveals.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 4) * 0.06 + 's');
  });
  const fmt = (n) => n.toLocaleString(site.locale);
  const finish = (el) => { el.textContent = fmt(+el.dataset.count) + (el.dataset.suffix || ''); };
  if (reduceMotion || !('IntersectionObserver' in window)) { reveals.forEach((el) => el.classList.add('is-visible')); counters.forEach(finish); return; }
  counters.forEach((el) => { el.textContent = '0'; }); // the HTML already holds the real value, so it stays if this script never gets this far
  const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); rio.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach((el) => rio.observe(el));
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 1600), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(end * eased)) + (p === 1 ? el.dataset.suffix || '' : '');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  counters.forEach((el) => cio.observe(el));
})();

/* ---------- Opening hours: today's row, "Open now" chip and footer year, in the gym's own time zone (holidays and closures included) ---------- */
(() => {
  const tick = () => {
    const now = gymNow();
    $$('.hours tr').forEach((row) => {
      const today = Number(row.dataset.day) === now.day;
      row.classList.toggle('is-today', today);
      const badge = $('.today-badge', row);
      if (today && !badge) $('th', row).insertAdjacentHTML('beforeend', ' <span class="today-badge">Today</span>');
      if (!today && badge) badge.remove();
    });
    const st = clock.statusAt(now, CLOCK_CFG);
    let text = st.text;
    let away = false;
    try { away = Intl.DateTimeFormat().resolvedOptions().timeZone !== site.timezone; } catch (_) { /* ignore */ }
    if (away) text += ` (${site.timezoneLabel} time)`;
    ['#open-status', '#open-status-2', '#open-status-3', '#open-status-4'].forEach((sel) => {
      const el = $(sel); if (!el) return;
      el.textContent = text;
      el.closest('.chip').classList.toggle('is-closed', st.state !== 'open');
    });
    $$('[data-year]').forEach((el) => { el.textContent = String(now.y); });
  };
  tick();
  setInterval(tick, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
})();

/* ---------- Magnetic buttons (fine pointers only, never with reduced motion) ---------- */
(() => {
  if (!finePointer || reduceMotion) return;
  const mags = $$('.hero .btn, .page-hero .btn, .header-link');
  if (!mags.length) return;
  window.addEventListener('pointermove', (e) => {
    mags.forEach((el) => {
      const r = el.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const near = Math.abs(dx) < r.width / 2 + 60 && Math.abs(dy) < r.height / 2 + 50;
      el.style.transform = near ? `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.28).toFixed(1)}px)` : '';
    });
  }, { passive: true });
})();

/* ---------- Cookie preferences (no tracking is loaded unless the visitor accepts) ---------- */
(() => {
  const box = $('#cookie'); if (!box) return;
  const KEY = 'vc-cookie';
  const show = () => { box.hidden = false; };
  const hide = () => { box.hidden = true; };
  const choice = store(KEY);
  if (choice === 'yes') loadAnalytics();
  else if (!choice) setTimeout(show, 1400);
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cookie]'); if (!b) return;
    store(KEY, b.dataset.cookie); hide();
    if (b.dataset.cookie === 'yes') { loadAnalytics(); toast('Thanks. Analytics are on (none are configured in this demo).'); }
    else toast('No problem. We will not track you.');
  });
  $$('[data-cookie-reset]').forEach((b) => b.addEventListener('click', () => { store(KEY, null); show(); }));
  function loadAnalytics() {
    // DEMO ONLY: add your analytics snippet here (for example Plausible or Google Analytics).
    // It runs only after the visitor has accepted.
  }
})();

/* ---------- Photos: a slow, subtle zoom as they scroll through the screen ---------- */
(() => {
  const imgs = $$('.photo img').filter((i) => !i.closest('.hero-photo')); // the hero photo has its own slow CSS zoom
  if (!imgs.length || reduceMotion) return;
  const live = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) live.add(e.target); else live.delete(e.target); }), { rootMargin: '10% 0px' });
  imgs.forEach((i) => io.observe(i));
  const tick = () => {
    const vh = window.innerHeight;
    live.forEach((img) => { const r = img.getBoundingClientRect(); const p = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / (vh + r.height / 2))); img.style.setProperty('--z', (1.03 + p * 0.09).toFixed(3)); });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
