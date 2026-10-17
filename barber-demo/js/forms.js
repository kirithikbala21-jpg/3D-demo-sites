// All forms are demo-only: they validate in the browser and show a confirmation. Nothing is sent anywhere.
import { $, $$, site, toast, cafeNow, hoursFor, fmtHour, reduceMotion } from './util.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOUNS = { experience: 'experience booking', private: 'private dining enquiry', catering: 'catering request', other: 'question' };

/* ---------- Booking (demo): service, barber, calendar, time grid, details, confirmation ---------- */
(() => {
  const form = $('#book-form');
  if (!form) return;
  const success = $('#form-success');
  const dateEl = $('#f-date'), timeEl = $('#f-time'), svcEl = $('#f-service'), hint = $('#h-time'), svcHint = $('#h-service');
  const grid = $('#cal-grid'), slotsEl = $('#slots'), titleEl = $('#cal-title');
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const now = new Date(), todayStr = iso(now);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60);   // bookable up to 60 days ahead
  const barber = () => (form.querySelector('input[name=barber]:checked') || {}).value || 'any';
  const barberName = () => { const l = form.querySelector('input[name=barber]:checked'); return l ? l.closest('label').querySelector('strong').textContent : 'Next available'; };
  const mins = () => Number(svcEl.selectedOptions[0].dataset.mins) || 30;
  const showService = () => { const o = svcEl.selectedOptions[0]; svcHint.textContent = `About ${mins()} minutes, $${o.dataset.price}.`; };

  // Links such as book.html?service=skin-fade&barber=marco pre-select the choices
  const q = new URLSearchParams(location.search);
  if (q.get('service') && [...svcEl.options].some((o) => o.value === q.get('service'))) svcEl.value = q.get('service');
  const qb = form.querySelector(`input[name=barber][value="${(q.get('barber') || '').replace(/[^a-z]/g, '')}"]`);
  if (qb) qb.checked = true;

  // Calendar
  let view = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = (d) => d.toLocaleDateString(site.locale, { month: 'long', year: 'numeric' });
  function drawCal() {
    titleEl.textContent = monthName(view);
    $('#cal-prev').disabled = view <= new Date(now.getFullYear(), now.getMonth(), 1);
    $('#cal-next').disabled = new Date(view.getFullYear(), view.getMonth() + 1, 1) > lastDay;
    grid.textContent = '';
    const lead = (view.getDay() + 6) % 7;                      // Monday-first
    for (let i = 0; i < lead; i++) grid.appendChild(document.createElement('span'));
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d), v = iso(date);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cal-day'; b.textContent = d; b.dataset.date = v;
      b.setAttribute('aria-label', date.toLocaleDateString(site.locale, { weekday: 'long', day: 'numeric', month: 'long' }));
      const closed = !hoursFor(date.getDay()), past = v < todayStr || date > lastDay;
      if (closed || past) { b.disabled = true; if (closed && !past) b.title = 'Closed'; }
      if (v === todayStr) b.classList.add('is-today');
      b.setAttribute('aria-pressed', String(v === dateEl.value));
      grid.appendChild(b);
    }
  }
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.cal-day'); if (!b || b.disabled) return;
    dateEl.value = b.dataset.date; $('#e-date').textContent = '';
    $$('.cal-day', grid).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    timeEl.value = ''; drawSlots();
  });
  $('#cal-prev').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); drawCal(); });
  $('#cal-next').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); drawCal(); });

  // Time grid: only times inside that weekday's hours (and long enough for the service), plus a deterministic "fully booked" demo.
  const full = (dateStr, t, who) => { let h = 7; for (const c of dateStr + t + who) h = (h * 31 + c.charCodeAt(0)) % 997; return h % 5 === 0; };
  const label = (t) => { const h = Math.floor(t), m = Math.round((t - h) * 60); return `${((h + 11) % 12) + 1}:${pad(m)}${h < 12 ? 'am' : 'pm'}`; };
  function drawSlots() {
    showService();
    slotsEl.textContent = '';
    const v = dateEl.value;
    if (!v) { hint.textContent = 'Choose a date to see which times are open.'; return; }
    const [y, m, d] = v.split('-').map(Number);
    const hrs = hoursFor(new Date(y, m - 1, d).getDay());
    const cn = cafeNow();
    let open = 0;
    if (hrs) {
      for (let t = hrs.open; t + mins() / 60 <= hrs.close + 1e-9; t += 0.5) {
        const val = `${pad(Math.floor(t))}:${pad(Math.round((t % 1) * 60))}`;
        const past = v === todayStr && t <= cn.hour, booked = !past && full(v, val, barber());
        const b = document.createElement('button'); b.type = 'button'; b.className = 'slot'; b.dataset.time = val; b.textContent = label(t);
        if (past || booked) { b.disabled = true; if (booked) { b.classList.add('is-full'); b.title = 'Fully booked'; b.setAttribute('aria-label', label(t) + ', fully booked'); } }
        else open++;
        b.setAttribute('aria-pressed', String(val === timeEl.value));
        slotsEl.appendChild(b);
      }
    }
    hint.textContent = hrs ? `We are open ${fmtHour(hrs.open)} to ${fmtHour(hrs.close)} that day. ${open ? 'Crossed-out times are taken.' : 'No times are left, so please try another date.'}` : 'We are closed that day. Please choose another date.';
  }
  slotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.slot'); if (!b || b.disabled) return;
    timeEl.value = b.dataset.time; $('#e-time').textContent = '';
    $$('.slot', slotsEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  svcEl.addEventListener('change', () => { timeEl.value = ''; drawSlots(); });
  $$('input[name=barber]', form).forEach((r) => r.addEventListener('change', () => { timeEl.value = ''; drawSlots(); }));
  drawCal(); showService();

  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please tell us your name so we can put it in the diary.' : ''),
    phone: (v) => (!v.trim() ? 'We need a phone number in case we have to reach you.' : v.replace(/\D/g, '').length < 8 || /[^\d\s()+-]/.test(v) ? "That phone number doesn't look right. Use digits, spaces or +." : ''),
    date: (v) => (!v ? 'Which day suits you? Pick a date in the calendar.' : v < todayStr ? 'That date has already passed. Pick today or later.' : ''),
    time: (v) => (!v ? 'Pick a time from the list.' : ''),
    message: (v) => (v.length > 500 ? 'Please keep your notes under 500 characters.' : ''),
  };
  const field = (n) => form.elements[n];
  function check(n) {
    const el = field(n), msg = rules[n](el.value);
    $('#e-' + n).textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  ['name', 'phone', 'message'].forEach((n) => {
    field(n).addEventListener('blur', () => check(n));
    field(n).addEventListener('input', () => { if (field(n).getAttribute('aria-invalid') === 'true') check(n); });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const order = ['date', 'time', 'name', 'phone', 'message'];
    const bad = order.map((n) => [n, check(n)]).find(([, ok]) => !ok);
    if (bad) { const t = { date: $('.cal-day:not(:disabled)', grid), time: $('.slot:not(:disabled)', slotsEl) }[bad[0]]; (t || field(bad[0])).focus(); return; }
    // DEMO ONLY: this is where a real booking system would be called, e.g.
    //   fetch('https://your-booking-system.example/api/bookings', { method: 'POST', body: new FormData(form) })
    // and the confirmation would be shown only after a successful response.
    const date = new Date(dateEl.value + 'T00:00:00').toLocaleDateString(site.locale, { weekday: 'long', day: 'numeric', month: 'long' });
    const svc = svcEl.selectedOptions[0].textContent.replace(/ \(\$.*$/, '');
    const who = barber() === 'any' ? 'the next available barber' : barberName();
    const [hh, mm] = timeEl.value.split(':').map(Number), startT = hh + mm / 60;
    const ref = 'BB-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const record = { ref, service: svc, barber: barberName(), date: dateEl.value, time: timeEl.value, name: field('name').value.trim(), phone: field('phone').value.trim(), price: Number(svcEl.selectedOptions[0].dataset.price), savedAt: new Date().toISOString() };
    try { const all = JSON.parse(localStorage.getItem('bb-bookings') || '[]'); all.unshift(record); localStorage.setItem('bb-bookings', JSON.stringify(all.slice(0, 20))); } catch (_) { /* storage blocked: the confirmation still shows */ }
    $('#ok-name').textContent = record.name.split(' ')[0];
    $('#ok-detail').textContent = `Your ${svc} with ${who} is pencilled in for ${date} at ${label(startT)}.`;
    const rows = [['Reference', ref], ['Service', `${svc} (about ${mins()} min)`], ['Barber', barberName()], ['When', `${date}, ${label(startT)} to ${label(startT + mins() / 60)}`], ['Price', `$${record.price} (pay in the shop)`], ['Name', record.name], ['Phone', record.phone]];
    const dl = $('#ok-summary'); dl.textContent = '';
    rows.forEach(([k, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; dl.append(dt, dd); });
    form.hidden = true; success.hidden = false; success.focus();
    success.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  $('#form-reset').addEventListener('click', () => {
    form.reset();
    $$('[aria-invalid]', form).forEach((el) => el.setAttribute('aria-invalid', 'false'));
    dateEl.value = timeEl.value = ''; drawCal(); drawSlots();
    success.hidden = true; form.hidden = false; field('name').focus();
  });
})();

/* ---------- Generic demo forms (careers, wholesale) ---------- */
$$('form[data-demo-form]').forEach((form) => {
  const inputs = $$('[data-rule]', form);
  const msg = (rule, el) => {
    const v = el.value.trim();
    for (const r of rule.split(' ')) {
      if (r === 'required' && !v) return 'This field is required.';
      if (r === 'email' && v && !EMAIL.test(v)) return "That email doesn't look quite right. Could you check it?";
      if (r.startsWith('min:') && v && v.length < Number(r.slice(4))) return `Please write a little more (at least ${r.slice(4)} characters).`;
    }
    return '';
  };
  const check = (el) => { const m = msg(el.dataset.rule, el); const out = el.getAttribute('aria-describedby') && document.getElementById(el.getAttribute('aria-describedby')); if (out) out.textContent = m; el.setAttribute('aria-invalid', m ? 'true' : 'false'); return !m; };
  inputs.forEach((el) => { el.addEventListener('blur', () => check(el)); el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); }); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = inputs.map(check); // check every field so all the messages show at once
    if (results.includes(false)) { inputs[results.indexOf(false)].focus(); return; }
    const ok = $('.form-success', form);
    const nm = form.elements.name;
    if (nm) $('[data-name]', ok).textContent = nm.value.trim().split(' ')[0];
    [...form.children].forEach((c) => { if (c !== ok) c.hidden = true; });
    ok.hidden = false; ok.focus();
  });
});

/* ---------- Newsletter ---------- */
$$('#news-form').forEach((form) => {
  const input = $('#n-email', form), msg = $('#e-news', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = EMAIL.test(input.value.trim());
    msg.className = ok ? 'success' : 'error';
    msg.textContent = ok ? "You're on the list (demo only: nothing was saved)." : "That email doesn't look quite right. Could you check it?";
    input.setAttribute('aria-invalid', String(!ok));
    if (ok) form.reset(); else input.focus();
  });
});

/* ---------- Gift card picker ---------- */
(() => {
  const form = $('#gift-form'); if (!form) return;
  const out = $('#gift-amount');
  form.addEventListener('change', () => { out.textContent = '$' + form.elements.amount.value; });
  form.addEventListener('submit', (e) => { e.preventDefault(); toast(`Demo only: a $${form.elements.amount.value} gift card would be sent here. No payment was taken.`); });
})();
