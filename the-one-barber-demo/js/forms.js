// Forms: they validate in the browser, then either show a demo confirmation (no form address set) or send to the address in
// site.config.json (forms.endpoint). Honeypot, double-submit guard and a "call us" fallback on failure are in formkit.js.
import { $, $$, site, toast, nowShop, resolveDay, fmtHour, dayLabel, addDays, pad, CLOCK_CFG, reduceMotion } from './util.js';
import { dowOf, hasFutureSlot } from './clock.js';
import { addHoneypot, tripped, guard, send, isLive, phoneFallback, auPhone, prettyPhone, PHONE_ERR } from './formkit.js';
import { mountReminder, reminderPreview } from './reminder.js';
import { waitlistForm } from './waitlist.js';

const G = site.growth || {}; // growth settings from site.config.json (reminders, waitlist ...)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOUNS = { experience: 'experience booking', private: 'private dining enquiry', catering: 'catering request', other: 'question' };

/* ---------- Booking (demo): service, barber, calendar, time grid, details, confirmation ---------- */
(() => {
  const form = $('#book-form');
  if (!form) return;
  const success = $('#form-success');
  const dateEl = $('#f-date'), timeEl = $('#f-time'), svcEl = $('#f-service'), hint = $('#h-time'), svcHint = $('#h-service');
  const grid = $('#cal-grid'), slotsEl = $('#slots'), titleEl = $('#cal-title');
  const B = site.booking || {}, SLOT = B.slotMinutes || 30, AHEAD = Math.max(B.daysAhead || 90, 90), LEAD = B.leadMinutes || 0;
  const todayKey = () => nowShop().key;                       // the shop's today (its own time zone), re-read each time it matters
  const lastKey = () => addDays(todayKey(), AHEAD - 1);       // a rolling window: always at least 90 days from today
  const fail = document.createElement('div'); fail.setAttribute('aria-live', 'assertive');
  const barber = () => (form.querySelector('input[name=barber]:checked') || {}).value || 'any';
  const barberName = () => { const l = form.querySelector('input[name=barber]:checked'); return l ? l.closest('label').querySelector('strong').textContent : 'Next available'; };
  const mins = () => Number(svcEl.selectedOptions[0].dataset.mins) || 30;
  const showService = () => { const o = svcEl.selectedOptions[0]; svcHint.textContent = o.dataset.price ? `About ${mins()} minutes, $${o.dataset.price}.` : 'Price to be confirmed by the shop. The calendar uses a placeholder length of ' + mins() + ' minutes.'; };

  // Links such as book.html?service=skin-fade&barber=marco pre-select the choices
  const q = new URLSearchParams(location.search);
  if (q.get('service') && [...svcEl.options].some((o) => o.value === q.get('service'))) svcEl.value = q.get('service');
  const qb = form.querySelector(`input[name=barber][value="${(q.get('barber') || '').replace(/[^a-z]/g, '')}"]`);
  if (qb) qb.checked = true;
  // "Manage my booking" > Change: pre-fill from the saved demo booking; the old one is replaced when the new one is confirmed
  try {
    const chg = sessionStorage.getItem('tob-change');
    const old = chg && JSON.parse(localStorage.getItem('tob-bookings') || '[]').find((b) => b.ref === chg);
    if (old) {
      const opt = [...svcEl.options].find((o) => o.textContent.startsWith(old.service)); if (opt) svcEl.value = opt.value;
      if (form.elements.name) form.elements.name.value = old.name || ''; if (form.elements.phone) form.elements.phone.value = old.phone || '';
      const cn = $('#change-note'); if (cn) { cn.textContent = `Changing booking ${old.ref}: pick a new day and time. The old booking is replaced when you confirm.`; cn.hidden = false; }
    }
  } catch (_) { /* storage blocked: ignore */ }

  // Calendar (month view, Monday first): only days from today to the end of the rolling window, open days, with something left to book
  const first = () => { const n = nowShop(); return { y: n.y, m: n.m }; };
  let view = first();
  const monthName = () => new Date(Date.UTC(view.y, view.m - 1, 1, 12)).toLocaleDateString(site.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const bookable = (key) => { const n = nowShop(); return hasFutureSlot(key, { key: n.key, mins: n.mins + LEAD }, CLOCK_CFG, mins(), SLOT); };
  function drawCal() {
    const cur = first(), t = todayKey(), last = lastKey();
    titleEl.textContent = monthName();
    $('#cal-prev').disabled = view.y === cur.y && view.m === cur.m;
    const nextFirst = view.m === 12 ? `${view.y + 1}-01-01` : `${view.y}-${pad(view.m + 1)}-01`;
    $('#cal-next').disabled = nextFirst > last;
    grid.textContent = '';
    const lead = (dowOf(`${view.y}-${pad(view.m)}-01`) + 6) % 7;
    for (let i = 0; i < lead; i++) grid.appendChild(document.createElement('span'));
    const days = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
    for (let d = 1; d <= days; d++) {
      const v = `${view.y}-${pad(view.m)}-${pad(d)}`, r = resolveDay(v);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cal-day'; b.textContent = d; b.dataset.date = v;
      b.setAttribute('aria-label', dayLabel(v) + (r.name ? ', ' + r.name : ''));
      const past = v < t || v > last, off = past || !bookable(v);
      if (off) { b.disabled = true; if (!past) b.title = r.closed ? (r.name ? 'Closed for ' + r.name : 'Closed') : 'No times left'; }
      if (v === t) b.classList.add('is-today');
      b.setAttribute('aria-pressed', String(v === dateEl.value));
      grid.appendChild(b);
    }
  }
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.cal-day'); if (!b || b.disabled) return;
    dateEl.value = b.dataset.date; $('#e-date').textContent = '';
    $$('.cal-day', grid).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    timeEl.value = ''; clearWaitlist(); drawSlots();
  });
  $('#cal-prev').addEventListener('click', () => { view = view.m === 1 ? { y: view.y - 1, m: 12 } : { y: view.y, m: view.m - 1 }; drawCal(); });
  $('#cal-next').addEventListener('click', () => { view = view.m === 12 ? { y: view.y + 1, m: 1 } : { y: view.y, m: view.m + 1 }; drawCal(); });

  // Time grid: only times inside that weekday's hours (and long enough for the service), plus a deterministic "fully booked" demo.
  const full = (dateStr, t, who) => { let h = 7; for (const c of dateStr + t + who) h = (h * 31 + c.charCodeAt(0)) % 997; return h % 5 === 0; };
  const label = (m) => { const t = ((m % 1440) + 1440) % 1440, h = Math.floor(t / 60); return `${((h + 11) % 12) + 1}:${pad(t % 60)}${h < 12 ? 'am' : 'pm'}`; };
  function drawSlots() {
    showService();
    slotsEl.textContent = '';
    const v = dateEl.value;
    if (!v) { hint.textContent = 'Choose a date to see which times are open.'; return; }
    const r = resolveDay(v), n = nowShop();
    let open = 0;
    if (!r.closed) {
      for (let t = r.open; t + mins() <= r.close; t += SLOT) {
        const val = `${pad(Math.floor((t % 1440) / 60))}:${pad(t % 60)}`;
        const past = v === n.key && t <= n.mins + LEAD, booked = !past && full(v, val, barber());
        const b = document.createElement('button'); b.type = 'button'; b.className = 'slot'; b.dataset.time = val; b.dataset.mins = t; b.textContent = label(t);
        if (booked && G.waitlistEnabled) { // a full time stays clickable: it opens the waitlist form instead of selecting the time
          b.classList.add('is-full', 'is-waitlist'); b.dataset.full = '1'; b.innerHTML = `${label(t)}<span class="slot-wl">Waitlist</span>`;
          b.setAttribute('aria-label', label(t) + ', fully booked. Join the waitlist');
        } else if (past || booked) { b.disabled = true; if (booked) { b.classList.add('is-full'); b.title = 'Fully booked'; b.setAttribute('aria-label', label(t) + ', fully booked'); } }
        else open++;
        b.setAttribute('aria-pressed', String(val === timeEl.value));
        slotsEl.appendChild(b);
      }
    }
    hint.textContent = !r.closed ? `We are open ${fmtHour(r.open)} to ${fmtHour(r.close)} that day. ${open ? 'Crossed-out times are taken.' : 'No times are left, so please try another date.'}` : `We are closed that day${r.name ? ' for ' + r.name : ''}. Please choose another date.`;
  }
  const wlHost = $('#waitlist-host');
  const clearWaitlist = () => { if (wlHost) wlHost.textContent = ''; };
  slotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.slot'); if (!b || b.disabled) return;
    if (b.dataset.full) { // full slot: show the waitlist form for that day and time
      timeEl.value = ''; clearWaitlist();
      $$('.slot', slotsEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (wlHost) { wlHost.append(waitlistForm({ dayKey: dateEl.value, mins: Number(b.dataset.mins), what: `${svcEl.selectedOptions[0].textContent.replace(/ \((\$|price ).*$/, '')} with ${barberName()}` })); $('#wl-name', wlHost).focus(); }
      return;
    }
    clearWaitlist();
    timeEl.value = b.dataset.time; timeEl.dataset.mins = b.dataset.mins; $('#e-time').textContent = '';
    $$('.slot', slotsEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  svcEl.addEventListener('change', () => { timeEl.value = ''; clearWaitlist(); drawSlots(); });
  $$('input[name=barber]', form).forEach((r) => r.addEventListener('change', () => { timeEl.value = ''; clearWaitlist(); drawSlots(); }));
  drawCal(); showService();

  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please tell us your name so we can put it in the diary.' : ''),
    phone: (v) => (!v.trim() ? 'We need a phone number in case we have to reach you.' : auPhone(v) ? '' : PHONE_ERR),
    date: (v) => (!v ? 'Which day suits you? Pick a date in the calendar.' : v < todayKey() ? 'That date has already passed. Pick today or later.' : ''),
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
  addHoneypot(form); form.querySelector('button[type=submit]').before(fail);
  // Optional reminder (front end only: SENDING IS NOT CONNECTED, see js/reminder.js)
  const rem = mountReminder(fail, G);
  const busy = guard(form.querySelector('button[type=submit]'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return; // a second click while the first is still being handled
    try {
      fail.innerHTML = '';
      const order = ['date', 'time', 'name', 'phone', 'message'];
      const bad = order.map((n) => [n, check(n)]).find(([, ok]) => !ok);
      if (bad) { const t = { date: $('.cal-day:not(:disabled)', grid), time: $('.slot:not(:disabled):not(.is-waitlist)', slotsEl) }[bad[0]]; (t || field(bad[0])).focus(); return; }
      const rr = rem ? rem.read() : { ok: true, mode: 'none' };
      if (!rr.ok) { rr.input.focus(); return; }
      // the clock keeps moving while the form is open: make sure the chosen time has not just passed
      const n0 = nowShop(), startM = Number(timeEl.dataset.mins);
      if (dateEl.value === n0.key && startM <= n0.mins + LEAD) {
        timeEl.value = ''; drawSlots(); $('#e-time').textContent = 'That time has just passed. Pick another from the list.'; (($('.slot:not(:disabled)', slotsEl)) || field('time')).focus(); return;
      }
      const date = dayLabel(dateEl.value);
      const svc = svcEl.selectedOptions[0].textContent.replace(/ \((\$|price ).*$/, '');
      const who = barber() === 'any' ? 'the next available barber' : barberName();
      const ref = 'TOB-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const phone = auPhone(field('phone').value);
      const record = { ref, service: svc, barber: barberName(), date: dateEl.value, time: timeEl.value, name: field('name').value.trim(), phone, notes: field('message').value.trim(), price: Number(svcEl.selectedOptions[0].dataset.price), savedAt: new Date().toISOString() };
      if (!tripped(form)) { // a filled-in spam trap looks successful but sends nothing
        const res = await send({ type: 'booking', _subject: `Booking request ${ref}`, ...record, when: `${date}, ${label(startM)}`, reminder: rr.mode === 'none' ? 'none' : { mode: rr.mode, contact: rr.contact, remindAt: rem.confirmation(dateEl.value, todayKey()) } });
        if (!res.ok) { fail.innerHTML = phoneFallback(); return; }
        try { let all = JSON.parse(localStorage.getItem('tob-bookings') || '[]'); const chg = sessionStorage.getItem('tob-change'); if (chg) { all = all.filter((b) => b.ref !== chg); sessionStorage.removeItem('tob-change'); } all.unshift(record); localStorage.setItem('tob-bookings', JSON.stringify(all.slice(0, 20))); } catch (_) { /* storage blocked: the confirmation still shows */ }
      }
      $('#ok-name').textContent = record.name.split(' ')[0];
      $('#ok-detail').textContent = `Your ${svc} with ${who} is ${isLive() ? 'requested' : 'pencilled in'} for ${date} at ${label(startM)}.`;
      const remLine = rem ? rem.confirmation(dateEl.value, todayKey()) : '';
      if (remLine) $('#ok-detail').textContent += ' ' + remLine;
      // Preview of the reminder text (sending is NOT connected: plug an email or SMS service in here, per customer; see js/reminder.js)
      const pv = $('#ok-preview'); pv.hidden = !remLine;
      pv.textContent = remLine ? reminderPreview({ name: record.name, what: svc, dayKey: dateEl.value, time: label(startM), business: site.name }) + ' (Demo: this message is not sent.)' : '';
      const rows = [['Reference', ref], ['Service', `${svc} (about ${mins()} min)`], ['Barber', barberName()], ['When', `${date}, ${label(startM)} to ${label(startM + mins())}`], ['Price', record.price ? `$${record.price} (pay in the shop)` : 'To be confirmed by the shop (pay in the shop)'], ['Name', record.name], ['Phone', prettyPhone(phone)]];
      const dl = $('#ok-summary'); dl.textContent = '';
      rows.forEach(([k, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; dl.append(dt, dd); });
      const ban = $('.demo-banner', success);
      if (ban) ban.innerHTML = isLive() ? `<strong>Thanks, your request is with us.</strong> We will confirm by phone or text. If you have not heard from us within a day, call <a href="tel:${site.phoneHref}">${site.phone}</a>.` : '<strong>This is a demo, no real booking was made.</strong> The details were saved only in this browser.';
      form.hidden = true; success.hidden = false; success.focus();
      success.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    } finally { busy.stop(); }
  });
  $('#form-reset').addEventListener('click', () => {
    form.reset();
    $$('[aria-invalid]', form).forEach((el) => el.setAttribute('aria-invalid', 'false'));
    dateEl.value = timeEl.value = ''; if (rem) rem.reset(); clearWaitlist(); drawCal(); drawSlots();
    success.hidden = true; form.hidden = false; field('name').focus();
  });
})();
