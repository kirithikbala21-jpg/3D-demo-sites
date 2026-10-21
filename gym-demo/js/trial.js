// Free trial / class booking (demo): session, coach, calendar, time grid, details, confirmation. Saved to localStorage "vc-bookings" only.
import { $, $$, site, resolveDay, fmtClock, gymNow, pad, reduceMotion } from './util.js';
import { phoneMessage, auPhone, prettyPhone, addHoneypot, tripped, guard, send, isLive, phoneFallback, failBox } from './formtools.js';

(() => {
  const form = $('#trial-form');
  if (!form) return;
  const success = $('#form-success');
  const dateEl = $('#f-date'), timeEl = $('#f-time'), sessEl = $('#f-session'), hint = $('#h-time'), sessHint = $('#h-session'), coachHint = $('#h-coach');
  const grid = $('#cal-grid'), slotsEl = $('#slots'), titleEl = $('#cal-title');
  const coachRadios = $$('input[name=coach]', form);

  // Dates are handled as plain yyyy-mm-dd strings in UTC arithmetic, with "today" taken in the gym's own time zone.
  const today = gymNow().date;
  const [ty, tm, td] = today.split('-').map(Number);
  const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
  const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const AHEAD = Math.max((site.booking || {}).daysAhead || 90, 90);
  const lastDay = iso(utc(ty, tm, td + AHEAD)); // always rolls forward from today: bookable up to 90+ days ahead
  const weekday = (v) => { const [y, m, d] = v.split('-').map(Number); return utc(y, m, d).getUTCDay(); };
  const long = (v) => { const [y, m, d] = v.split('-').map(Number); return utc(y, m, d).toLocaleDateString(site.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }); };

  const session = () => {
    const o = sessEl.selectedOptions[0];
    const isClass = o.value !== 'trial';
    return { id: o.value, isClass, mins: Number(o.dataset.mins) || 45, day: isClass ? Number(o.dataset.day) : null, start: o.dataset.start || '', coach: o.dataset.coach || '', label: o.textContent.replace(/ \(\d+ min\)$/, '') };
  };
  const coachVal = () => (form.querySelector('input[name=coach]:checked') || {}).value || 'any';
  const coachName = () => { const r = form.querySelector('input[name=coach]:checked'); return r ? r.closest('label').querySelector('strong').textContent : 'Next available'; };

  // Links such as trial.html?class=tue-1730-power-hour&coach=marcus pre-select the choices
  const q = new URLSearchParams(location.search);
  if (q.get('class') && [...sessEl.options].some((o) => o.value === q.get('class'))) sessEl.value = q.get('class');
  const qc = coachRadios.find((r) => r.value === (q.get('coach') || '').replace(/[^a-z]/g, ''));
  if (qc) qc.checked = true;

  function syncSession() {
    const s = session();
    if (s.isClass) {
      coachRadios.forEach((r) => { r.checked = r.value === s.coach; r.disabled = true; });
      coachHint.textContent = `This class is led by ${site.coaches[s.coach] || 'one of our coaches'}.`;
      sessHint.textContent = `${s.mins} minutes. It runs every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][s.day]} at ${fmtClock(Number(s.start.slice(0, 2)) + Number(s.start.slice(3)) / 60)}, so only those days can be picked.`;
    } else {
      coachRadios.forEach((r) => { r.disabled = false; });
      coachHint.textContent = '';
      sessHint.textContent = `${s.mins} minutes with a coach: a tour of the floor and a workout at your level. Free, no card needed.`;
    }
  }

  /* ----- calendar ----- */
  let view = utc(ty, tm, 1);
  const monthName = (d) => d.toLocaleDateString(site.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  function drawCal() {
    const s = session();
    titleEl.textContent = monthName(view);
    $('#cal-prev').disabled = view <= utc(ty, tm, 1);
    $('#cal-next').disabled = iso(utc(view.getUTCFullYear(), view.getUTCMonth() + 2, 1)) > lastDay;
    grid.textContent = '';
    const lead = (view.getUTCDay() + 6) % 7; // Monday-first
    for (let i = 0; i < lead; i++) grid.appendChild(document.createElement('span'));
    const days = utc(view.getUTCFullYear(), view.getUTCMonth() + 2, 0).getUTCDate();
    for (let d = 1; d <= days; d++) {
      const date = utc(view.getUTCFullYear(), view.getUTCMonth() + 1, d), v = iso(date), dow = date.getUTCDay();
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cal-day'; b.textContent = d; b.dataset.date = v;
      b.setAttribute('aria-label', long(v));
      const day = resolveDay(v), closed = day.closed, past = v < today || v > lastDay, wrongDay = s.isClass && dow !== s.day;
      if (closed || past || wrongDay) { b.disabled = true; if (!past) b.title = closed ? (day.name ? 'Closed: ' + day.name : 'Closed') : 'No ' + s.label.replace(/^[\d:apm]+ /, '') + ' this day'; }
      if (v === today) b.classList.add('is-today');
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
  $('#cal-prev').addEventListener('click', () => { view = utc(view.getUTCFullYear(), view.getUTCMonth(), 1); drawCal(); });
  $('#cal-next').addEventListener('click', () => { view = utc(view.getUTCFullYear(), view.getUTCMonth() + 2, 1); drawCal(); });

  /* ----- time grid: only times inside that weekday's opening hours and long enough for the session; a deterministic "fully booked" demo ----- */
  const full = (dateStr, t, who) => { let h = 7; for (const c of dateStr + t + who) h = (h * 31 + c.charCodeAt(0)) % 997; return h % 5 === 0; };
  const GROUPS = [['Morning', 0, 12], ['Afternoon', 12, 17], ['Evening', 17, 24]];
  function drawSlots() {
    slotsEl.textContent = '';
    const v = dateEl.value, s = session();
    if (!v) { hint.textContent = 'Choose a date to see which times are open.'; return; }
    const dow = weekday(v), day = resolveDay(v), hrs = day.closed ? null : { open: day.open / 60, close: day.close / 60 }, gn = gymNow();
    const times = [];
    if (hrs) {
      if (s.isClass) { if (dow === s.day) times.push(Number(s.start.slice(0, 2)) + Number(s.start.slice(3)) / 60); }
      else for (let t = hrs.open; t + s.mins / 60 <= hrs.close + 1e-9; t += 0.5) times.push(t);
    }
    let open = 0;
    GROUPS.forEach(([name, from, to]) => {
      const part = times.filter((t) => t >= from && t < to);
      if (!part.length) return;
      const g = document.createElement('div'); g.className = 'slot-group';
      const lab = document.createElement('p'); lab.className = 'slot-group-label'; lab.textContent = name;
      const row = document.createElement('div'); row.className = 'slot-row';
      part.forEach((t) => {
        const val = `${pad(Math.floor(t))}:${pad(Math.round((t % 1) * 60))}`;
        const past = v === gn.date && t <= gn.hour, booked = !past && full(v, val, s.id + coachVal());
        const b = document.createElement('button'); b.type = 'button'; b.className = 'slot'; b.dataset.time = val; b.textContent = fmtClock(t);
        if (past || booked) { b.disabled = true; if (booked) { b.classList.add('is-full'); b.title = 'Fully booked'; b.setAttribute('aria-label', fmtClock(t) + ', fully booked'); } }
        else open++;
        b.setAttribute('aria-pressed', String(val === timeEl.value));
        row.appendChild(b);
      });
      g.append(lab, row); slotsEl.appendChild(g);
    });
    hint.textContent = !hrs ? (day.name ? `We are closed that day for ${day.name}. Please choose another date.` : 'We are closed that day. Please choose another date.')
      : `We are open ${fmtClock(hrs.open)} to ${fmtClock(hrs.close)} that day (${site.timezoneLabel} time). ${open ? 'Crossed-out times are taken.' : 'No times are left, so please try another date.'}`;
  }
  slotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.slot'); if (!b || b.disabled) return;
    timeEl.value = b.dataset.time; $('#e-time').textContent = '';
    $$('.slot', slotsEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  const reset = () => { dateEl.value = timeEl.value = ''; drawCal(); drawSlots(); };
  sessEl.addEventListener('change', () => { syncSession(); reset(); });
  coachRadios.forEach((r) => r.addEventListener('change', () => { timeEl.value = ''; drawSlots(); }));
  syncSession(); drawCal();

  /* ----- validation ----- */
  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please tell us your name so we can put it on the list.' : ''),
    phone: phoneMessage,
    date: (v) => (!v ? 'Which day suits you? Pick a date in the calendar.' : v < today ? 'That date has already passed. Pick today or later.' : ''),
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
    field(n).addEventListener('blur', () => { if (field(n).value.trim()) check(n); }); // empty fields are reported on submit, so a message never shifts the button away from a tap
    field(n).addEventListener('input', () => { if (field(n).getAttribute('aria-invalid') === 'true') check(n); });
  });
  addHoneypot(form);
  const submitBtn = $('button[type=submit]', form), busy = guard(submitBtn);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return; // a second click while the first is still being handled
    try {
    failBox(form).innerHTML = '';
    const order = ['date', 'time', 'name', 'phone', 'message'];
    const bad = order.map((n) => [n, check(n)]).find(([, ok]) => !ok);
    if (bad) { const t = { date: $('.cal-day:not(:disabled)', grid), time: $('.slot:not(:disabled)', slotsEl) }[bad[0]]; (t || field(bad[0])).focus(); return; }
    // the clock keeps moving while the form is open: refuse a time that has passed in the meantime
    const gn = gymNow(), [h0, m0] = timeEl.value.split(':').map(Number);
    if (dateEl.value === gn.date && h0 * 60 + m0 <= gn.mins) { timeEl.value = ''; drawSlots(); $('#e-time').textContent = 'That time has just passed. Pick another time from the list.'; return; }
    const s = session();
    const [hh, mm] = timeEl.value.split(':').map(Number), startT = hh + mm / 60;
    const ref = 'VC-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const isSpam = tripped(form);
    const record = { ref, kind: s.isClass ? 'class' : 'trial', session: s.id, sessionLabel: s.label, coach: coachName(), date: dateEl.value, time: timeEl.value, name: field('name').value.trim(), phone: field('phone').value.trim(), savedAt: new Date().toISOString() };
    if (!isSpam) { // a filled-in spam trap looks successful but sends nothing
      const res = await send({ type: s.isClass ? 'class booking' : 'free trial', _subject: `Booking request ${ref}`, ...record });
      if (!res.ok) { failBox(form).innerHTML = phoneFallback(); return; }
    }
    try { const all = JSON.parse(localStorage.getItem('vc-bookings') || '[]'); all.unshift(record); localStorage.setItem('vc-bookings', JSON.stringify(all.slice(0, 20))); } catch (_) { /* storage blocked: the confirmation still shows */ }
    const who = coachVal() === 'any' ? 'the next available coach' : coachName();
    $('#ok-name').textContent = record.name.split(' ')[0];
    $('#ok-detail').textContent = `Your ${s.isClass ? s.label : 'free trial session'} with ${who} is pencilled in for ${long(record.date)} at ${fmtClock(startT)}.`;
    const rows = [['Reference', ref], ['Session', `${s.label}${s.isClass ? '' : ' (45 min)'}`], ['Coach', coachName()], ['When', `${long(record.date)}, ${fmtClock(startT)} to ${fmtClock(startT + s.mins / 60)}`],
      ['Cost', s.isClass ? 'Members: included. Guests: $28 day pass at the desk.' : 'Free'], ['Name', record.name], ['Phone', record.phone]];
    const dl = $('#ok-summary'); dl.textContent = '';
    rows.forEach(([k, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; dl.append(dt, dd); });
    form.hidden = true; success.hidden = false; success.focus();
    success.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    } finally { busy.stop(); }
  });
  $('#form-reset').addEventListener('click', () => {
    form.reset();
    $$('[aria-invalid]', form).forEach((el) => el.setAttribute('aria-invalid', 'false'));
    sessEl.value = 'trial'; syncSession(); reset();
    success.hidden = true; form.hidden = false; field('name').focus();
  });
})();
