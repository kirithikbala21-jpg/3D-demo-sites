// Ember & Oak: page behaviour. 3D lives in scene.js and is loaded lazily with a safety net.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Scroll progress bar ---------- */
(() => {
  const bar = $('.progress');
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* ---------- Small toast for demo-only actions ---------- */
const toastEl = $('#toast');
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4500);
}

/* ---------- Mobile menu (aria-expanded, Escape, link click, focus trap) ---------- */
(() => {
  const toggle = $('.nav-toggle');
  const menu = $('#mobile-nav');
  const focusables = () => [toggle, ...$$('a[href]', menu)];

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
    const items = focusables();
    const first = items[0], lastEl = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 1040px)').addEventListener('change', (m) => { if (m.matches && !menu.hidden) setOpen(false); });
})();

/* ---------- Menu tabs (arrow keys, Home/End, roving tabindex) ---------- */
(() => {
  const tabs = $$('[role="tab"]');
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
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
})();

/* ---------- Reveal on scroll + count-up (once) ---------- */
(() => {
  const reveals = $$('.reveal');
  reveals.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 4) * 0.09 + 's');
  });
  const counters = $$('[data-count]');
  const fmt = (n) => n.toLocaleString('en-AU');
  const finish = (el) => { el.textContent = fmt(+el.dataset.count) + (el.dataset.suffix || ''); };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
    counters.forEach(finish);
    return;
  }
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); revealIO.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach((el) => revealIO.observe(el));

  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target, end = +el.dataset.count, dur = 1600, t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(end * eased)) + (p === 1 ? el.dataset.suffix || '' : '');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => countIO.observe(el));
})();

/* ---------- Gallery hover tilt ---------- */
(() => {
  if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
  $$('.tile').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tile.style.setProperty('--rx', (px * 10).toFixed(2) + 'deg');
      tile.style.setProperty('--ry', (-py * 10).toFixed(2) + 'deg');
    });
    tile.addEventListener('pointerleave', () => { tile.style.removeProperty('--rx'); tile.style.removeProperty('--ry'); });
  });
})();

/* ---------- Highlight today's opening hours ---------- */
(() => {
  const row = $(`.hours tr[data-day="${new Date().getDay()}"]`);
  if (!row) return;
  row.classList.add('is-today');
  const th = $('th', row);
  th.insertAdjacentHTML('beforeend', ' <span class="today-badge">Today</span>');
})();

/* ---------- "Open now" status chip (uses the visitor's local clock) ---------- */
(() => {
  // Keep in sync with the opening-hours table: [open hour, close hour] in 24h time, 0 = Sunday.
  const hours = { 0: [8, 16], 1: [7, 16], 2: [7, 16], 3: [7, 16], 4: [7, 22], 5: [7, 22], 6: [7, 22] };
  const fmt = (h) => { const hr = h % 12 || 12; return `${hr}:00${h < 12 ? 'am' : 'pm'}`; };
  const now = new Date();
  const [open, close] = hours[now.getDay()];
  const t = now.getHours() + now.getMinutes() / 60;
  let text, isOpen = false;
  if (t >= open && t < close) { text = `Open now \u00B7 until ${fmt(close)}`; isOpen = true; }
  else if (t < open) text = `Closed \u00B7 opens ${fmt(open)} today`;
  else text = `Closed \u00B7 opens ${fmt(hours[(now.getDay() + 1) % 7][0])} tomorrow`;
  ['#open-status', '#open-status-2'].forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    el.textContent = text;
    el.closest('.chip').classList.toggle('is-closed', !isOpen);
  });
})();

/* ---------- Links that pre-select the enquiry type in the form ---------- */
$$('[data-enquiry]').forEach((a) => a.addEventListener('click', () => {
  const sel = $('#f-type');
  if (sel) sel.value = a.dataset.enquiry;
}));

/* ---------- Gift card picker (demo) ---------- */
(() => {
  const form = $('#gift-form');
  const out = $('#gift-amount');
  const current = () => form.elements.amount.value;
  form.addEventListener('change', () => { out.textContent = '$' + current(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    toast(`Demo only: a $${current()} gift card would be sent here. No payment was taken.`);
  });
})();

/* ---------- Newsletter (demo) ---------- */
(() => {
  const form = $('#news-form');
  const input = $('#n-email');
  const msg = $('#e-news');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    msg.className = ok ? 'success' : 'error';
    msg.textContent = ok ? "You're on the list (demo only: nothing was saved)." : "That email doesn't look quite right. Could you check it?";
    input.setAttribute('aria-invalid', String(!ok));
    if (ok) form.reset(); else input.focus();
  });
})();

/* ---------- Reservation form (client-side only) ---------- */
(() => {
  const form = $('#reserve-form');
  const success = $('#form-success');
  const dateEl = $('#f-date');
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  dateEl.min = todayStr;

  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please tell us your name so we can pop it on the booking.' : ''),
    email: (v) => (!v.trim() ? 'We need an email to confirm your table.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "That email doesn't look quite right. Could you check it?" : ''),
    date: (v) => (!v ? 'Which day suits you? Pick a date.' : v < todayStr ? "That date has already passed. Pick today or later." : ''),
    guests: (v) => { const n = Number(v); return !v ? 'How many people are coming?' : !Number.isInteger(n) || n < 1 || n > 12 ? 'We can seat 1 to 12 guests online. For bigger groups, give us a call.' : ''; },
    message: (v) => (v.length > 500 ? 'Please keep your message under 500 characters.' : ''),
  };
  const field = (name) => form.elements[name];
  function check(name) {
    const el = field(name), msg = rules[name](el.value);
    $('#e-' + name).textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  Object.keys(rules).forEach((name) => {
    field(name).addEventListener('blur', () => check(name));
    field(name).addEventListener('input', () => { if (field(name).getAttribute('aria-invalid') === 'true') check(name); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = Object.keys(rules).map((n) => [n, check(n)]);
    const bad = results.find(([, ok]) => !ok);
    if (bad) { field(bad[0]).focus(); return; }

    // DEMO ONLY: this is where a real form service would be called, e.g.
    //   fetch('https://formspree.io/f/your-id', { method: 'POST', body: new FormData(form) })
    // and the success panel below would be shown after a successful response.
    const date = new Date(dateEl.value + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
    const guests = Number(field('guests').value);
    const email = field('email').value.trim();
    const type = field('type').value;
    $('#ok-name').textContent = field('name').value.trim().split(' ')[0];
    $('#ok-detail').textContent = type === 'table'
      ? `We've noted a table for ${guests} ${guests === 1 ? 'guest' : 'guests'} on ${date}. We'll email ${email} to confirm.`
      : `We've received your ${field('type').selectedOptions[0].textContent.toLowerCase()} for ${date}. A team member will email ${email} within one business day.`;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });
  $('#form-reset').addEventListener('click', () => {
    form.reset();
    field('guests').value = 2;
    field('type').value = 'table';
    $$('[aria-invalid]', form).forEach((el) => el.setAttribute('aria-invalid', 'false'));
    success.hidden = true;
    form.hidden = false;
    field('name').focus();
  });
})();

/* ---------- 3D hero with graceful fallback ---------- */
(() => {
  const stage = $('#stage');
  const canvas = $('#scene');
  let settled = false;
  let handle = null;

  function useFallback() {
    if (settled && !handle) return;
    settled = true;
    if (handle) { try { handle.dispose(); } catch (_) { /* ignore */ } handle = null; }
    canvas.remove();
    stage.classList.remove('has-3d');
    stage.classList.add('is-fallback'); // the SVG illustration is already in the page
  }
  function webglAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (_) { return false; }
  }
  if (!webglAvailable()) { useFallback(); return; }

  const timer = setTimeout(useFallback, 4000);
  import('./scene.js')
    .then((m) => m.initScene(canvas, { reduceMotion, onLost: useFallback }))
    .then((h) => {
      clearTimeout(timer);
      if (settled) { h.dispose(); return; } // too slow: fallback already shown
      settled = true; handle = h;
      stage.classList.add('has-3d');
      canvas.classList.add('is-ready');
    })
    .catch((err) => { clearTimeout(timer); console.info('3D unavailable, showing illustration.', err && err.message); settled = false; useFallback(); });
})();
