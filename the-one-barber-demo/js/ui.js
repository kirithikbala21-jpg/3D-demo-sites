// Page behaviour: header, full-screen menu, tabs, reveal / split-text / count-up animations, magnetic buttons, hours status, map, cookies.
import { tr, lang } from './i18n.js';
import { $, $$, site, reduceMotion, finePointer, nowShop, statusNow, store, toast, dayLabel, addDays as addDaysKey } from './util.js';

/* ---------- Header solid on scroll, progress bar, hero parallax ---------- */
(() => {
  const bar = $('.progress'), header = $('.site-header'), hero = $('.hero');
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    header.classList.toggle('is-scrolled', y > 40);
    if (hero && !reduceMotion && y < window.innerHeight * 1.2) hero.style.setProperty('--py', (y * 0.22).toFixed(1) + 'px');
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

/* ---------- Announcement bar: dismiss and remember ---------- */
(() => {
  const btn = $('#announce-close'), bar = $('#announce');
  if (!btn || !bar) return;
  btn.addEventListener('click', () => {
    document.documentElement.classList.add('no-announce');
    try { localStorage.setItem('tob-announce', 'off'); } catch (_) { /* ignore */ }
    const link = $('.brand'); if (link) link.focus();
  });
})();

/* ---------- Menu tabs (arrow keys, Home/End, roving tabindex) + deep links from search ---------- */
(() => {
  const tabs = $$('[role="tab"]');
  if (!tabs.length) return;
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    else tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      select(tabs[(map[e.key] + tabs.length) % tabs.length], true);
    });
  });
  function goto() {
    const id = decodeURIComponent(location.hash.slice(1));
    const el = id && document.getElementById(id);
    const panel = el && el.closest('[role="tabpanel"]');
    if (!panel) return;
    select($(`[aria-controls="${panel.id}"]`), false);
    requestAnimationFrame(() => { el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }); el.animate([{ background: 'rgba(221,180,106,.35)' }, { background: 'transparent' }], { duration: 2200 }); });
  }
  goto();
  window.addEventListener('hashchange', goto);
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

/* ---------- "From farm to cup": steps light up and a line fills as you scroll ---------- */
(() => {
  const list = $('.journey'), bar = $('.journey-bar span');
  if (!list) return;
  const steps = $$('li', list);
  if (reduceMotion) { steps.forEach((s) => s.classList.add('is-active')); bar.style.setProperty('--jp', 1); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-active'); }), { threshold: 0.5 });
  steps.forEach((s) => io.observe(s));
  const upd = () => { const r = list.getBoundingClientRect(); const p = (window.innerHeight * 0.75 - r.top) / (r.height + window.innerHeight * 0.2); bar.style.setProperty('--jp', Math.max(0, Math.min(1, p)).toFixed(3)); };
  window.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
  upd();
})();

/* ---------- Gallery hover tilt ---------- */
(() => {
  if (reduceMotion || !finePointer) return;
  $$('.tile').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--rx', (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(2) + 'deg');
      tile.style.setProperty('--ry', (-((e.clientY - r.top) / r.height - 0.5) * 10).toFixed(2) + 'deg');
    });
    tile.addEventListener('pointerleave', () => { tile.style.removeProperty('--rx'); tile.style.removeProperty('--ry'); });
  });
})();

/* ---------- Opening hours: today's row + "Open now" chip, in the shop's own time zone (holidays and closures included) ---------- */
(() => {
  let away = false;
  try { away = Intl.DateTimeFormat().resolvedOptions().timeZone !== site.timezone; } catch (_) { /* ignore */ }
  const zone = (site.timezone || '').split('/').pop().replace(/_/g, ' ');
  function tick() {
    const n = nowShop();
    $$('.hours tr').forEach((row) => {
      const today = Number(row.dataset.day) === n.dow, th = $('th', row), badge = $('.today-badge', row);
      row.classList.toggle('is-today', today);
      if (today && !badge) th.insertAdjacentHTML('beforeend', ` <span class="today-badge">${lang() === 'zh' ? '今天' : 'Today'}</span>`);
      if (!today && badge) badge.remove();
      if (today && badge) badge.textContent = lang() === 'zh' ? '今天' : 'Today';
    });
    const st = statusNow();
    const text = tr(st.text) + (away ? (lang() === 'zh' ? `（${zone}时间）` : ` (${zone} time)`) : '');
    ['#open-status', '#open-status-2', '#open-status-3'].forEach((sel) => {
      const el = $(sel); if (!el) return;
      el.textContent = text;
      el.closest('.chip').classList.toggle('is-closed', st.state !== 'open');
    });
    $$('[data-year]').forEach((el) => { el.textContent = String(n.y); });
    $$('[data-since]').forEach((el) => { el.textContent = String(n.y - Number(el.dataset.since)); el.dataset.count = el.textContent; });
    $$('time[data-days-ago]').forEach((el) => { // sample journal posts: dated relative to today, so they never look old
      const key = addDaysKey(n.key, -Number(el.dataset.daysAgo));
      el.setAttribute('datetime', key); el.textContent = dayLabel(key).replace(/^\w+ /, '') + ' ' + key.slice(0, 4);
    });
  }
  tick();
  setInterval(tick, 60000);
  document.addEventListener('langchange', tick);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
})();

/* ---------- Magnetic buttons (fine pointers only, never with reduced motion) ---------- */
(() => {
  if (!finePointer || reduceMotion) return;
  const mags = $$('.hero .btn, .page-hero .btn, .header-link, .feature-card .btn, .link-arrow');
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
  const KEY = 'eo-cookie';
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
  const imgs = $$('.photo img');
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
