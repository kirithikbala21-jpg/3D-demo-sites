// Demo forms: they validate in the browser and show a confirmation. Nothing is sent anywhere.
import { $, $$, toast, modal } from './util.js';

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

/* ---------- Gift voucher picker ---------- */
(() => {
  const form = $('#gift-form'); if (!form) return;
  const out = $('#gift-amount');
  form.addEventListener('change', () => { out.textContent = '$' + form.elements.amount.value; });
  form.addEventListener('submit', (e) => { e.preventDefault(); toast(`Demo only: a $${form.elements.amount.value} gift voucher would be sent here. No payment was taken.`); });
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
    name: (v) => (v.trim().length < 2 ? 'Please tell us your name.' : ''),
    phone: (v) => (!v.trim() ? 'We need a phone number to confirm your visit.' : v.replace(/\D/g, '').length < 8 || /[^\d\s()+-]/.test(v) ? "That phone number doesn't look right. Use digits, spaces or +." : ''),
    day: (v) => (v ? '' : 'Choose a day.'),
    time: (v) => (v ? '' : 'Choose a time of day.'),
  };
  const err = { name: '#e-v-name', phone: '#e-v-phone', day: '#e-v-day', time: '#e-v-time' };
  const check = (n) => { const el = form.elements[n], m = rules[n](el.value); $(err[n]).textContent = m; el.setAttribute('aria-invalid', m ? 'true' : 'false'); return !m; };
  Object.keys(rules).forEach((n) => { form.elements[n].addEventListener('blur', () => check(n)); form.elements[n].addEventListener('input', () => { if (form.elements[n].getAttribute('aria-invalid') === 'true') check(n); }); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const res = Object.keys(rules).map(check);
    if (res.includes(false)) { form.elements[Object.keys(rules)[res.indexOf(false)]].focus(); return; }
    const rec = { name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), day: form.elements.day.value, time: form.elements.time.value, savedAt: new Date().toISOString() };
    try { const all = JSON.parse(localStorage.getItem('vc-visits') || '[]'); all.unshift(rec); localStorage.setItem('vc-visits', JSON.stringify(all.slice(0, 20))); } catch (_) { /* storage blocked: the confirmation still shows */ }
    $('#visit-name').textContent = rec.name.split(' ')[0];
    $('#visit-detail').textContent = `We would see you on ${rec.day}, ${rec.time.toLowerCase()}.`;
    form.hidden = true; done.hidden = false; done.focus();
  });
})();
