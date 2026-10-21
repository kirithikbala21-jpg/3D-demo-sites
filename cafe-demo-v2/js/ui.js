// Page behaviour: header, full-screen menu, tabs, reveal / split-text / count-up animations, magnetic buttons, hours status, map, cookies.
import { $, $$, site, reduceMotion, finePointer, cafeNow, nowCafe, resolveDay, fmtShort, store, toast } from './util.js';
import { addDays, DAY_NAMES } from './clock.js';
import { scrollToEl } from './motion.js';

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

/* ---------- Announcement bar: dismissible, remembered, and the layout variable follows ---------- */
(() => {
  const bar = $('#announce'), btn = $('.announce-close');
  if (!bar || !btn) return;
  btn.addEventListener('click', () => {
    store('eo-announce', 'off');
    document.documentElement.classList.add('announce-off');
    document.documentElement.style.setProperty('--ticker-h', '0px'); // the hero's height maths uses this variable
    const main = $('#main'); // the button is gone now: keep keyboard focus in the page
    if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
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
    requestAnimationFrame(() => { scrollToEl(el, { block: 'center' }); el.animate([{ background: 'rgba(221,180,106,.35)' }, { background: 'transparent' }], { duration: 2200 }); });
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
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 4) * 0.09 + 's');
  });
  const fmt = (n) => n.toLocaleString(site.locale);
  const finish = (el) => { el.textContent = fmt(+el.dataset.count) + (el.dataset.suffix || ''); };
  // The final numbers are real text in the HTML. Only when this script runs (and motion is allowed) do they restart from 0 and count up.
  if (reduceMotion || !('IntersectionObserver' in window)) { reveals.forEach((el) => el.classList.add('is-visible')); counters.forEach(finish); return; }
  counters.forEach((el) => { el.textContent = fmt(0); });
  const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); rio.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach((el) => rio.observe(el));
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 1600), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = p === 1 ? fmt(end) + (el.dataset.suffix || '') : fmt(Math.round(end * eased));
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

/* ---------- Opening hours: today's row + "Open now" chips, always in the café's own time zone (holidays and closures included) ---------- */
(() => {
  const tick = () => {
    const n = nowCafe();
    $$('.hours tr.is-today').forEach((r) => { r.classList.remove('is-today'); $$('.today-badge', r).forEach((x) => x.remove()); });
    const row = $(`.hours tr[data-day="${n.dow}"]`);
    if (row) { row.classList.add('is-today'); $('th', row).insertAdjacentHTML('beforeend', ' <span class="today-badge">Today</span>'); }
    const t = resolveDay(n.key);
    // If the visitor's clock differs from the café's (another time zone), say so: the status is always the café's local time.
    const local = new Date(), lc = cafeNow(local);
    const away = lc.day !== local.getDay() || Math.abs(lc.hour - (local.getHours() + local.getMinutes() / 60)) > 0.01;
    const zone = away ? ` (${site.city || 'café'} time)` : '';
    let text, isOpen = false;
    // a late night that started yesterday and runs past midnight
    const y = resolveDay(addDays(n.key, -1));
    if (!y.closed && y.close > 1440 && n.mins < y.close - 1440) { text = `Open now \u00b7 until ${fmtShort(y.close)}${zone}`; isOpen = true; }
    else if (!t.closed && n.mins >= t.open && n.mins < t.close) { text = `Open now \u00b7 until ${fmtShort(t.close)}${zone}`; isOpen = true; }
    else if (!t.closed && n.mins < t.open) text = `Closed now \u00b7 opens ${fmtShort(t.open)} today${zone}`;
    else {
      let next = null, i = 1;
      for (; i <= 21; i++) { const k = addDays(n.key, i), r = resolveDay(k); if (!r.closed) { next = { r, k }; break; } }
      const why = t.closed && t.name ? ` for ${t.name}` : '';
      text = next ? `Closed ${t.closed ? 'today' : 'now'}${why} \u00b7 opens ${fmtShort(next.r.open)} ${i === 1 ? 'tomorrow' : DAY_NAMES[new Date(next.k + 'T12:00:00Z').getUTCDay()]}${zone}` : 'Closed for now';
    }
    $$('[data-open-status]').forEach((el) => {
      el.textContent = text;
      el.closest('.chip').classList.toggle('is-closed', !isOpen);
    });
    $$('[data-year]').forEach((el) => { el.textContent = String(n.y); });
    // the top announcement hides itself after its end date
    const bar = $('#announce');
    if (bar && bar.dataset.end && n.key > bar.dataset.end) { document.documentElement.classList.add('announce-off'); document.documentElement.style.setProperty('--ticker-h', '0px'); }
  };
  tick();
  setInterval(tick, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
})();

/* ---------- Map: load the interactive map only when asked (privacy + speed) ---------- */
(() => {
  const box = $('#map-box'), btn = $('#map-load');
  if (!box || !btn) return;
  btn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = box.dataset.src; f.title = 'Map of central Melbourne (demo)'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer';
    box.prepend(f); box.classList.add('is-loaded'); box.removeAttribute('role');
  });
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
