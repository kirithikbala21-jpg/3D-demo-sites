// Forms validate in the browser. With no form address in site.config.json (forms.endpoint) they are demos that send nothing; with one,
// the request is posted to it, and a failure shows a "call us" fallback. Each form has a hidden spam trap and a double-submit guard.
import { $, $$, site, toast, nowCafe, resolveDay, fmtHour, store } from './util.js';
import { addDays, DAY_NAMES, dayLabel } from './clock.js';
import { addHoneypot, tripped, guard, send, isLive, phoneFallback } from './formtools.js';
import { mountReminder } from './reminder.js';
import { waitlistForm } from './waitlist.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOUNS = { experience: 'experience booking', private: 'private dining enquiry', catering: 'catering request', other: 'question' };

/* ---------- Reservation / enquiry form ---------- */
(() => {
  const form = $('#reserve-form');
  if (!form) return;
  const success = $('#form-success');
  const dateEl = $('#f-date');
  const timeEl = $('#f-time');
  const hint = $('#h-time');
  const todayStr = nowCafe().key; // the café's today (Melbourne), not the visitor's
  dateEl.min = todayStr;
  dateEl.max = addDays(todayStr, Math.max((site.booking || {}).daysAhead || 90, 365)); // always rolls forward from today

  // Pre-select the enquiry type from the link that brought us here (reserve.html?type=private)
  const type = new URLSearchParams(location.search).get('type');
  if (type && [...form.elements.type.options].some((o) => o.value === type)) form.elements.type.value = type;

  // Time slots: only times inside that day's opening hours (holidays and closures included), and a deterministic "fully booked" demo.
  const labels = new Map([...timeEl.options].map((o) => [o.value, o.textContent]));
  const full = (dateStr, t) => { let h = 7; for (const c of dateStr + t) h = (h * 31 + c.charCodeAt(0)) % 997; return h % 5 === 0; };
  function updateTimes() {
    const v = dateEl.value;
    if (!v) { hint.textContent = 'Choose a date to see which times are open.'; return; }
    const hrs = resolveDay(v);
    const cn = nowCafe();
    let anyOpen = 0;
    [...timeEl.options].forEach((o) => {
      if (!o.value) return;
      const [hh, mm] = o.value.split(':').map(Number); const t = hh * 60 + mm;
      const inside = !hrs.closed && t >= hrs.open && t <= hrs.close - 30;
      const past = v === cn.key && t <= cn.mins;
      const booked = inside && !past && full(v, o.value);
      o.disabled = !inside || past || booked;
      o.textContent = labels.get(o.value) + (booked ? ' (fully booked)' : '');
      if (!o.disabled) anyOpen++;
    });
    if (timeEl.selectedOptions[0] && timeEl.selectedOptions[0].disabled) timeEl.value = '';
    renderWaitlist(v, [...timeEl.options].filter((o) => o.value && / \(fully booked\)$/.test(o.textContent)));
    hint.textContent = !hrs.closed
      ? `We are open ${fmtHour(hrs.open)} to ${fmtHour(hrs.close)} that day. ${anyOpen ? 'Some times may already be full.' : 'No times are left, so please try another date.'}`
      : `We are closed that day${hrs.name ? ' for ' + hrs.name : ''}. Please choose another date.`;
  }
  dateEl.addEventListener('change', updateTimes);

  // Waitlist (config: waitlistEnabled): every fully booked time gets a "Join the waitlist" button that opens a small form. FRONT END ONLY.
  const wlSlots = $('#wl-slots'), wlHost = $('#wl-host');
  function renderWaitlist(day, booked) {
    if (!wlSlots) return;
    wlHost.hidden = true; wlHost.replaceChildren();
    if (!site.waitlistEnabled || !booked.length) { wlSlots.replaceChildren(); return; }
    wlSlots.innerHTML = '<p class="wl-lead">Fully booked, but you can join the waitlist:</p><ul class="wl-list" role="list">' + booked.map((o) => {
      const t = o.textContent.replace(/ \(fully booked\)$/, '');
      return `<li><span>${t}</span><button type="button" class="wl-join btn btn-secondary btn-sm" data-t="${o.value}">Join the waitlist<span class="sr-only"> for ${t}</span></button></li>`;
    }).join('') + '</ul>';
  }
  wlSlots && wlSlots.addEventListener('click', (e) => {
    const b = e.target.closest('.wl-join'); if (!b) return;
    const [hh, mm] = b.dataset.t.split(':').map(Number);
    const el = waitlistForm({ dayKey: dateEl.value, mins: hh * 60 + mm, what: field('type').selectedOptions[0].textContent.replace(/…|\.\.\./g, '').trim() });
    wlHost.replaceChildren(el); wlHost.hidden = false;
    el.scrollIntoView({ block: 'nearest' }); const first = el.querySelector('input'); if (first) first.focus();
  });

  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please tell us your name so we can pop it on the booking.' : ''),
    email: (v) => (!v.trim() ? 'We need an email to confirm your booking.' : !EMAIL.test(v.trim()) ? "That email doesn't look quite right. Could you check it?" : ''),
    date: (v) => (!v ? 'Which day suits you? Pick a date.' : v < nowCafe().key ? 'That date has already passed. Pick today or later.' : resolveDay(v).closed && field('type').value === 'table' ? `We are closed that day${resolveDay(v).name ? ' for ' + resolveDay(v).name : ''}. Please pick another date.` : ''),
    guests: (v) => { const n = Number(v); return !v ? 'How many people are coming?' : !Number.isInteger(n) || n < 1 || n > 12 ? 'We can seat 1 to 12 guests online. For bigger groups, give us a call.' : ''; },
    message: (v) => (v.length > 500 ? 'Please keep your message under 500 characters.' : ''),
  };
  const field = (n) => form.elements[n];
  function check(n) {
    const el = field(n), msg = rules[n](el.value);
    $('#e-' + n).textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  Object.keys(rules).forEach((n) => {
    field(n).addEventListener('blur', () => check(n));
    field(n).addEventListener('input', () => { if (field(n).getAttribute('aria-invalid') === 'true') check(n); });
  });
  addHoneypot(form);
  const reminder = mountReminder($('button[type=submit]', form), site, 'rsv-rm'); // "Remind me" None / Email / Text (config: remindersEnabled)
  const busy = guard($('button[type=submit]', form));
  const failBox = document.createElement('div'); failBox.setAttribute('aria-live', 'assertive'); $('button[type=submit]', form).after(failBox);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return; // a second click while the first is still being handled
    try {
      failBox.innerHTML = '';
      const bad = Object.keys(rules).map((n) => [n, check(n)]).find(([, ok]) => !ok);
      if (bad) { field(bad[0]).focus(); return; }
      if (reminder) { const r = reminder.read(); if (!r.ok) { r.input.focus(); return; } }
      const guests = Number(field('guests').value);
      const email = field('email').value.trim();
      const kind = field('type').value;
      const rec = { id: 'ER-' + Date.now().toString(36).toUpperCase(), saved: new Date().toISOString(), type: kind, name: field('name').value.trim(), email, date: dateEl.value, time: timeEl.value || null, guests, message: field('message').value.trim() };
      if (!tripped(form)) { // a filled-in spam trap looks successful but sends nothing
        // SENDING A REMINDER IS NOT CONNECTED: plug an email or SMS service in here, per customer, using rec.reminder.
        const rm = reminder ? reminder.read() : { mode: 'none' };
        rec.reminder = rm.mode === 'none' ? 'none' : { mode: rm.mode, contact: rm.contact, leadHours: site.reminderLeadHours || 24 };
        const res = await send({ _subject: `Website ${kind} request ${rec.id}`, formType: 'reservation', ...rec });
        if (!res.ok) { failBox.innerHTML = phoneFallback(); return; }
        try {
          const all = JSON.parse(store('eo-reservations') || '[]');
          all.push(rec);
          store('eo-reservations', JSON.stringify(all.slice(-20)));
        } catch (_) { /* storage unavailable: carry on */ }
      }
      const date = dayLabel(dateEl.value);
      const at = timeEl.value ? ` at ${timeEl.selectedOptions[0].textContent}` : '';
      $('#ok-name').textContent = field('name').value.trim().split(' ')[0];
      $('#ok-detail').textContent = kind === 'table'
        ? `We've noted a table for ${guests} ${guests === 1 ? 'guest' : 'guests'} on ${date}${at}. We'll email ${email} to confirm.`
        : `We've received your ${NOUNS[kind] || 'request'} for ${date}${at}. A team member will email ${email} within one business day.`;
      const mins = timeEl.value ? Number(timeEl.value.split(':')[0]) * 60 + Number(timeEl.value.split(':')[1]) : undefined;
      const rline = reminder ? reminder.confirmation(dateEl.value, { now: nowCafe(), startMins: mins }) : '';
      const rEl = $('#ok-reminder'); if (rEl) { rEl.textContent = rline; rEl.hidden = !rline; }
      // Preview of the reminder message (SENDING IS NOT CONNECTED: this only shows what it would say)
      const what = kind === 'table' ? `your table for ${guests}` : `your ${NOUNS[kind] || 'request'}`;
      const pv = reminder ? reminder.preview(`Hi ${field('name').value.trim().split(' ')[0]}, a reminder that ${what} is on ${date}${timeEl.value ? ' at ' + timeEl.selectedOptions[0].textContent.trim() : ''} at ${site.name}.`) : '';
      const pEl = $('#ok-preview'); if (pEl) { pEl.textContent = pv; pEl.hidden = !pv; }
      form.hidden = true; if (wlHost) wlHost.hidden = true; success.hidden = false; success.focus();
    } finally { busy.stop(); }
  });
  $('#form-reset').addEventListener('click', () => {
    form.reset();
    field('guests').value = 2;
    if (reminder) reminder.reset();
    $$('[aria-invalid]', form).forEach((el) => el.setAttribute('aria-invalid', 'false'));
    updateTimes();
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
  addHoneypot(form);
  const sub = $('button[type=submit]', form), busy = guard(sub);
  const reminder = form.hasAttribute('data-reminder') ? mountReminder(sub, site, 'enq-rm') : null; // enquiries can ask to be reminded to look for our reply
  const failBox = document.createElement('div'); failBox.setAttribute('aria-live', 'assertive'); sub.after(failBox);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return;
    try {
      failBox.innerHTML = '';
      const results = inputs.map(check); // check every field so all the messages show at once
      if (results.includes(false)) { inputs[results.indexOf(false)].focus(); return; }
      if (reminder) { const r = reminder.read(); if (!r.ok) { r.input.focus(); return; } }
      if (!tripped(form)) {
        const data = Object.fromEntries(new FormData(form).entries()); delete data.website;
        const res = await send({ formType: location.pathname.split('/').pop().replace('.html', '') || 'form', _subject: 'Website enquiry', ...data });
        if (!res.ok) { failBox.innerHTML = phoneFallback(); return; }
      }
      const ok = $('.form-success', form);
      const rl = $('[data-reminder-line]', ok);
      if (rl && reminder) { const t = reminder.confirmation(addDays(nowCafe().key, 2), { now: nowCafe() }); rl.textContent = t; rl.hidden = !t; reminder.reset(); }
      const nm = form.elements.name;
      if (nm) $('[data-name]', ok).textContent = nm.value.trim().split(' ')[0];
      [...form.children].forEach((c) => { if (c !== ok) c.hidden = true; });
      ok.hidden = false; ok.focus();
    } finally { busy.stop(); }
  });
});

/* ---------- Newsletter ---------- */
$$('#news-form').forEach((form) => {
  const input = $('#n-email', form), msg = $('#e-news', form);
  addHoneypot(form);
  const busy = guard($('button[type=submit]', form));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return;
    try {
      const ok = EMAIL.test(input.value.trim());
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok) { msg.className = 'error'; msg.textContent = "That email doesn't look quite right. Could you check it?"; input.focus(); return; }
      if (!tripped(form)) {
        const res = await send({ formType: 'newsletter', _subject: 'Newsletter signup', email: input.value.trim() });
        if (!res.ok) { msg.className = 'error'; msg.innerHTML = `Sorry, that did not send. Please call us on <a href="tel:${site.phoneHref}">${site.phone}</a>.`; return; }
      }
      msg.className = 'success';
      msg.textContent = isLive() ? "You're on the list. Thank you!" : "You're on the list (demo only: nothing was saved).";
      form.reset();
    } finally { busy.stop(); }
  });
});

/* ---------- Gift card picker ---------- */
(() => {
  const form = $('#gift-form'); if (!form) return;
  const out = $('#gift-amount');
  form.addEventListener('change', () => { out.textContent = '$' + form.elements.amount.value; });
  addHoneypot(form);
  const busy = guard($('button[type=submit]', form));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return;
    try {
      const amount = form.elements.amount.value;
      if (!tripped(form)) {
        const res = await send({ formType: 'gift-card', _subject: `Gift card request: $${amount}`, amount });
        if (!res.ok) { toast(`Sorry, that did not send. Please call us on ${site.phone}.`); return; }
      }
      toast(isLive() ? `Thanks! We have your $${amount} gift card request and will be in touch to arrange payment.` : `Demo only: a $${amount} gift card would be sent here. No payment was taken.`);
    } finally { busy.stop(); }
  });
})();
