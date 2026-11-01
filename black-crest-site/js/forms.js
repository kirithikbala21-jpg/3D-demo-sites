// Forms (Web3Forms, the same service and key as the KB Ventures site), the price calculator, the quiz,
// pre-filling the contact form, and the confirmation toast. Nothing personal ever goes in the address bar:
// choices travel between pages in this tab's sessionStorage only.
import { CONFIG } from './config.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n) => '$' + Number(n).toLocaleString('en-AU', { maximumFractionDigits: 0 });
export const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} },
  del(k) { try { sessionStorage.removeItem(k); } catch (_) {} }
};

export function initForms({ reduce }) {
  calculator(reduce);
  quiz();
  prefillContact();
  sendForms();
  toast();
}

/* ---------- Price calculator: animated total and progress ring ---------- */
function calculator(reduce) {
  const calc = $('#calc'); if (!calc) return;
  const totalEl = $('#calc-total'), monthEl = $('#calc-month'), list = $('#calc-lines'), ringFill = $('.ring .fill', calc), ringN = $('.ring b', calc);
  const optionCount = CONFIG.addOns.length + 1;
  let shown = CONFIG.packages.onePage.price, anim = 0;
  const tween = (to) => {
    cancelAnimationFrame(anim);
    if (reduce) { shown = to; totalEl.textContent = money(to); return; }
    const from = shown, t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - p, 3); shown = Math.round(from + (to - from) * e); totalEl.textContent = money(shown); if (p < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  };
  const read = () => {
    const pkgKey = ($('input[name=pkg]:checked', calc) || {}).value || 'onePage';
    const pkg = CONFIG.packages[pkgKey];
    const lines = [`${pkg.name}: ${money(pkg.price)}`];
    let total = pkg.price, picked = 0;
    CONFIG.addOns.forEach((a) => {
      const box = $(`#add-${a.id}`, calc); if (!box || !box.checked) return;
      const qty = a.perUnit ? Number(($(`#qty-${a.id}`, calc) || {}).value || 1) : 1;
      total += a.from * qty; picked++;
      lines.push(`${a.name}${qty > 1 ? ' x ' + qty : ''}: from ${money(a.from * qty)}`);
    });
    const care = $('#add-care', calc).checked;
    if (care) { lines.push(`${CONFIG.carePlan.name}: ${money(CONFIG.carePlan.pricePerMonth)} a month`); picked++; }
    return { pkgKey, total, care, lines, picked };
  };
  const render = () => {
    const q = read();
    tween(q.total);
    monthEl.hidden = !q.care;
    list.replaceChildren(...q.lines.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
    $$('.qty', calc).forEach((s) => { s.disabled = !$(`#add-${s.dataset.for}`, calc).checked; });
    if (ringFill) ringFill.style.strokeDashoffset = String(1 - q.picked / optionCount);
    if (ringN) ringN.textContent = q.picked;
  };
  calc.addEventListener('change', render); render();
  $('#calc-send').addEventListener('click', () => {
    const q = read();
    store.set('bc-quote', JSON.stringify({ pkgKey: q.pkgKey, total: q.total, care: q.care, lines: q.lines }));
    location.href = 'contact.html#quote';
  });
}

/* ---------- Quiz (nothing is stored or sent) ---------- */
function quiz() {
  const form = $('#quiz'); if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const qs = $$('fieldset', form), err = $('#quiz-error');
    const missing = qs.filter((f) => !$('input:checked', f));
    if (missing.length) { err.hidden = false; err.textContent = `Please answer all ${qs.length} questions (${missing.length} left).`; $('input', missing[0]).focus(); return; }
    err.hidden = true;
    const score = qs.filter((f) => $('input:checked', f).value === 'good').length;
    const out = $('#quiz-result'), band = score >= 5 ? 'high' : score >= 3 ? 'mid' : 'low';
    $$('[data-band]', out).forEach((p) => { p.hidden = p.dataset.band !== band; });
    $('#quiz-score', out).textContent = `${score} out of ${qs.length}`;
    const tips = $('#quiz-tips', out);
    tips.replaceChildren(...qs.filter((f) => $('input:checked', f).value !== 'good').map((f) => Object.assign(document.createElement('li'), { textContent: f.dataset.tip })));
    tips.hidden = !tips.children.length;
    out.hidden = false; out.focus();
    store.set('bc-quiz', score + '/' + qs.length);
  });
  const rv = $('#quiz-review'); if (rv) rv.addEventListener('click', () => store.set('bc-review', '1'));
}

/* ---------- Contact page: fill in a calculator quote, a Concept Lab setup or a quiz review request ---------- */
function prefillContact() {
  const contact = $('#form-contact'); if (!contact) return;
  const msg = $('textarea[name=message]', contact), subject = $('input[name=subject]', contact), quoteField = $('input[name=quote]', contact), note = $('#prefill-note');
  const pick = (v) => { const r = $(`input[name=need][value="${v}"]`, contact); if (r) r.checked = true; };
  const json = (k) => { try { return JSON.parse(store.get(k) || 'null'); } catch (_) { return null; } };
  const q = json('bc-quote'), lab = json('bc-lab');
  if (q && location.hash === '#quote') {
    pick(q.pkgKey === 'fullSite' ? 'Full Website' : 'One Page');
    msg.value = `Please send me a quote for:\n- ${q.lines.join('\n- ')}\nEstimated total from ${money(q.total)}${q.care ? ' plus the care plan' : ''}.`;
    quoteField.value = q.lines.join('; ') + `; total from ${money(q.total)}`;
    subject.value = 'Black Crest: quote request from the price calculator';
    note.hidden = false; note.textContent = 'Your calculator choices are filled in below. Add anything else you need.';
  } else if (lab && location.hash === '#lab') {
    pick('Not sure');
    msg.value = `I set this up in the Concept Lab:\n- Trade: ${lab.trade}\n- Business name: ${lab.name}\n- Mood: ${lab.mood}\n- Features: ${lab.features.join(', ') || 'none picked'}\nPlease design my free concept.`;
    quoteField.value = `Lab: ${lab.trade}; ${lab.name}; ${lab.mood}; ${lab.features.join(', ')}`;
    subject.value = 'Black Crest: free concept request from the Concept Lab';
    note.hidden = false; note.textContent = 'Your Concept Lab choices are filled in below. Add your name and email and send.';
  } else if (store.get('bc-review') && location.hash === '#review') {
    pick('Not sure');
    const s = store.get('bc-quiz');
    msg.value = `I took the website quiz${s ? ' (score ' + s + ')' : ''}. Please send me a free mini review of my website: `;
    subject.value = 'Black Crest: free mini website review request';
    note.hidden = false; note.textContent = 'Add your website address to the message and we will email you a short review.';
  } else {
    const need = new URLSearchParams(location.search).get('need');
    if (need) pick({ 'one-page': 'One Page', 'full-website': 'Full Website', 'care-plan': 'Care plan' }[need] || 'Not sure');
  }
}

/* ---------- Sending: Web3Forms, with a spam trap and helpful errors ---------- */
function sendForms() {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  $$('form[data-form]').forEach((form) => {
    const status = $('.form-status', form), btn = $('button[type=submit]', form), label = btn.innerHTML;
    const showErr = (field, text) => {
      const out = $('#' + field.getAttribute('aria-describedby').split(' ')[0]);
      field.setAttribute('aria-invalid', text ? 'true' : 'false'); out.textContent = text; out.hidden = !text;
    };
    const check = (field) => {
      const v = field.value.trim();
      if (field.required && !v) return showErr(field, field.dataset.empty || 'Please fill this in.'), false;
      if (v && field.type === 'email' && !EMAIL_RE.test(v)) return showErr(field, 'Please enter a valid email address, like name@example.com.'), false;
      if (v && field.dataset.contact && !EMAIL_RE.test(v) && v.replace(/\D/g, '').length < 8) return showErr(field, 'Please enter an email address or a phone number.'), false;
      showErr(field, ''); return true;
    };
    const fields = $$('[aria-describedby][required], [aria-describedby][type=email], [data-contact]', form).filter((f) => f.id);
    // errors clear as the visitor types a fix (checking on blur would move the button away from a click mid-press)
    fields.forEach((f) => f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(f); }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bad = fields.filter((f) => !check(f));
      if (bad.length) { bad[0].focus(); return; }
      if ($('input[name=botcheck]', form).checked) { location.href = form.dataset.thanks; return; }
      const data = Object.fromEntries(new FormData(form).entries());
      delete data.redirect; data.botcheck = false;
      btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = ''; status.className = 'form-status';
      try {
        const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.success) throw new Error(out.message || res.status);
        store.del('bc-quote'); store.del('bc-review'); store.del('bc-lab'); store.set('bc-sent', '1');
        location.href = form.dataset.thanks;
      } catch (_) {
        btn.disabled = false; btn.innerHTML = label;
        status.className = 'form-status is-error';
        status.innerHTML = `Sorry, that did not send. Please try again, or email us at <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>.`;
      }
    });
  });
}

/* ---------- Toast on the thank-you page, after a form was sent ---------- */
function toast() {
  const t = $('#toast');
  if (!t || !store.get('bc-sent')) return;
  store.del('bc-sent');
  t.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('is-on')));
  setTimeout(() => t.classList.remove('is-on'), 6000);
}
