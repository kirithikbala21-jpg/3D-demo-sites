// All forms are demo-only: they validate in the browser and show a confirmation. Nothing is sent anywhere.
import { $, $$, site, toast, cafeNow, hoursFor, fmtHour, store } from './util.js';

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
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  dateEl.min = todayStr;

  // Pre-select the enquiry type from the link that brought us here (reserve.html?type=private)
  const type = new URLSearchParams(location.search).get('type');
  if (type && [...form.elements.type.options].some((o) => o.value === type)) form.elements.type.value = type;

  // Time slots: only times inside that weekday's opening hours, and a deterministic "fully booked" demo.
  const labels = new Map([...timeEl.options].map((o) => [o.value, o.textContent]));
  const full = (dateStr, t) => { let h = 7; for (const c of dateStr + t) h = (h * 31 + c.charCodeAt(0)) % 997; return h % 5 === 0; };
  function updateTimes() {
    const v = dateEl.value;
    if (!v) { hint.textContent = 'Choose a date to see which times are open.'; return; }
    const [y, m, d] = v.split('-').map(Number);
    const hrs = hoursFor(new Date(y, m - 1, d).getDay());
    const cn = cafeNow();
    let anyOpen = 0;
    [...timeEl.options].forEach((o) => {
      if (!o.value) return;
      const [hh, mm] = o.value.split(':').map(Number); const t = hh + mm / 60;
      const inside = hrs && t >= hrs.open && t <= hrs.close - 0.5;
      const past = v === todayStr && t <= cn.hour;
      const booked = inside && !past && full(v, o.value);
      o.disabled = !inside || past || booked;
      o.textContent = labels.get(o.value) + (booked ? ' (fully booked)' : '');
      if (!o.disabled) anyOpen++;
    });
    if (timeEl.selectedOptions[0] && timeEl.selectedOptions[0].disabled) timeEl.value = '';
    hint.textContent = hrs ? `We are open ${fmtHour(hrs.open)} to ${fmtHour(hrs.close)} that day. ${anyOpen ? 'Some times may already be full.' : 'No times are left, so please try another date.'}` : 'Please choose another date.';
  }
  dateEl.addEventListener('change', updateTimes);

  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please tell us your name so we can pop it on the booking.' : ''),
    email: (v) => (!v.trim() ? 'We need an email to confirm your booking.' : !EMAIL.test(v.trim()) ? "That email doesn't look quite right. Could you check it?" : ''),
    date: (v) => (!v ? 'Which day suits you? Pick a date.' : v < todayStr ? 'That date has already passed. Pick today or later.' : ''),
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
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = Object.keys(rules).map((n) => [n, check(n)]).find(([, ok]) => !ok);
    if (bad) { field(bad[0]).focus(); return; }
    // DEMO ONLY: this is where a real form service or booking system would be called, e.g.
    //   fetch('https://formspree.io/f/your-id', { method: 'POST', body: new FormData(form) })
    // and the success panel below would be shown after a successful response.
    const date = new Date(dateEl.value + 'T00:00:00').toLocaleDateString(site.locale, { weekday: 'long', day: 'numeric', month: 'long' });
    const guests = Number(field('guests').value);
    const email = field('email').value.trim();
    const kind = field('type').value;
    const at = timeEl.value ? ` at ${timeEl.selectedOptions[0].textContent}` : '';
    // DEMO ONLY: the confirmed request is kept in this browser (localStorage 'eo-reservations'); nothing is sent anywhere.
    try {
      const all = JSON.parse(store('eo-reservations') || '[]');
      all.push({ id: 'ER-' + Date.now().toString(36).toUpperCase(), saved: new Date().toISOString(), type: kind, name: field('name').value.trim(), email, date: dateEl.value, time: timeEl.value || null, guests, message: field('message').value.trim() });
      store('eo-reservations', JSON.stringify(all.slice(-20)));
    } catch (_) { /* storage unavailable: carry on */ }
    $('#ok-name').textContent = field('name').value.trim().split(' ')[0];
    $('#ok-detail').textContent = kind === 'table'
      ? `We've noted a table for ${guests} ${guests === 1 ? 'guest' : 'guests'} on ${date}${at}. We'll email ${email} to confirm.`
      : `We've received your ${NOUNS[kind] || 'request'} for ${date}${at}. A team member will email ${email} within one business day.`;
    form.hidden = true; success.hidden = false; success.focus();
  });
  $('#form-reset').addEventListener('click', () => {
    form.reset();
    field('guests').value = 2;
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
