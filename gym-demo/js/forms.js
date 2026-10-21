// Site forms: they validate in the browser and show a confirmation. With no forms.endpoint in site.config.json they are demos and
// send nothing; with one, the request is posted there, and a failure keeps the form and shows a phone fallback (see formtools.js).
import { $, $$, toast, modal, site } from './util.js';
import { phoneMessage, addHoneypot, tripped, guard, send, isLive, phoneFallback, failBox } from './formtools.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- Generic demo forms (careers) ---------- */
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
  inputs.forEach((el) => { el.addEventListener('blur', () => { if (el.value.trim()) check(el); }); el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); }); });
  addHoneypot(form);
  const busy = guard($('button[type=submit]', form));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return;
    try {
      failBox(form).innerHTML = '';
      const results = inputs.map(check); // check every field so all the messages show at once
      if (results.includes(false)) { inputs[results.indexOf(false)].focus(); return; }
      if (!tripped(form)) {
        const res = await send({ type: 'application', _subject: 'Careers application', name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), role: form.elements.role.value, message: form.elements.message.value.trim() });
        if (!res.ok) { failBox(form).innerHTML = phoneFallback(); return; }
      }
      const ok = $('.form-success', form);
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
        const res = await send({ type: 'newsletter', _subject: 'Newsletter sign-up', email: input.value.trim() });
        if (!res.ok) { msg.className = 'error'; msg.innerHTML = `Sorry, that did not send. Please try again, or call <a href="tel:${site.phoneHref}">${site.phone}</a>.`; return; }
      }
      msg.className = 'success';
      msg.textContent = isLive() ? "You're on the list. Thanks!" : "You're on the list (demo only: nothing was saved).";
      form.reset();
    } finally { busy.stop(); }
  });
});

/* ---------- Gift voucher picker ---------- */
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
        const res = await send({ type: 'gift voucher', _subject: `Gift voucher request: $${amount}`, amount });
        if (!res.ok) { failBox(form).innerHTML = phoneFallback(); return; }
      }
      failBox(form).innerHTML = '';
      toast(isLive() ? `Thanks! We have your request for a $${amount} gift voucher and will be in touch to arrange payment.` : `Demo only: a $${amount} gift voucher would be sent here. No payment was taken.`);
    } finally { busy.stop(); }
  });
})();

/* ---------- Schedule a visit (modal, demo): validates, shows a clear demo confirmation, saves to localStorage "vc-visits" ---------- */
(() => {
  const root = $('#visit-modal'); if (!root) return;
  const form = $('#visit-form'), done = $('#visit-done');
  const dlg = modal(root, { bodyClass: 'modal-open', initialFocus: '#v-name' });
  $$('[data-visit-open]').forEach((b) => b.addEventListener('click', (e) => dlg.open(e.currentTarget)));
  $('#visit-close').addEventListener('click', () => dlg.close());
  $('#visit-ok').addEventListener('click', () => { form.reset(); form.hidden = false; done.hidden = true; dlg.close(); });
  root.addEventListener('click', (e) => { if (e.target === root) dlg.close(); });
  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please tell us your name so we can put it on the list.' : ''),
    phone: phoneMessage,
    day: (v) => (v ? '' : 'Which day suits you? Choose a day.'),
    time: (v) => (v ? '' : 'What time of day suits you? Choose a time.'),
  };
  const err = { name: '#e-v-name', phone: '#e-v-phone', day: '#e-v-day', time: '#e-v-time' };
  const check = (n) => { const el = form.elements[n], m = rules[n](el.value); $(err[n]).textContent = m; el.setAttribute('aria-invalid', m ? 'true' : 'false'); return !m; };
  // an empty field is reported on submit (not on blur), so a message never shifts the button away from a tap
  Object.keys(rules).forEach((n) => { form.elements[n].addEventListener('blur', () => { if (form.elements[n].value.trim()) check(n); }); form.elements[n].addEventListener('input', () => { if (form.elements[n].getAttribute('aria-invalid') === 'true') check(n); }); form.elements[n].addEventListener('change', () => { if (form.elements[n].getAttribute('aria-invalid') === 'true') check(n); }); });
  addHoneypot(form);
  const busy = guard($('button[type=submit]', form));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return;
    try {
      failBox(form).innerHTML = '';
      const res = Object.keys(rules).map(check); // all four fields are required: show every message at once, focus the first problem
      if (res.includes(false)) { form.elements[Object.keys(rules)[res.indexOf(false)]].focus(); return; }
      const rec = { name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), day: form.elements.day.value, time: form.elements.time.value, savedAt: new Date().toISOString() };
      if (!tripped(form)) {
        const sent = await send({ type: 'visit request', _subject: 'Visit request', ...rec });
        if (!sent.ok) { failBox(form).innerHTML = phoneFallback(); return; }
        try { const all = JSON.parse(localStorage.getItem('vc-visits') || '[]'); all.unshift(rec); localStorage.setItem('vc-visits', JSON.stringify(all.slice(0, 20))); } catch (_) { /* storage blocked: the confirmation still shows */ }
      }
      $('#visit-name').textContent = rec.name.split(' ')[0];
      $('#visit-detail').textContent = `We would see you on ${rec.day}, ${rec.time.toLowerCase()}.`;
      form.hidden = true; done.hidden = false; done.focus();
    } finally { busy.stop(); }
  });
})();
