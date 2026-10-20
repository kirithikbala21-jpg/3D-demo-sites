// Gift voucher mini-form. FRONT END ONLY: nothing is issued, sent or charged.
import { $, $$, store, SITE } from './util.js';
import { addHoneypot, tripped, guard, send, isLive, phoneFallback } from './forms.js';

const root = $('#voucher-app');
if (root) {
  const form = $('form', root), done = $('.voucher-done', root);
  const name = $('#v-name'), email = $('#v-email'), ne = $('#v-name-err'), ee = $('#v-email-err');
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bad = (input, el, msg) => { el.textContent = msg; el.hidden = false; input.setAttribute('aria-invalid', 'true'); };
  const ok = (input, el) => { el.hidden = true; input.removeAttribute('aria-invalid'); };
  addHoneypot(form);
  const busy = guard($('button[type=submit]', form));
  const failBox = document.createElement('div'); failBox.setAttribute('aria-live', 'assertive'); form.append(failBox);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return;
    try {
    failBox.innerHTML = '';
    ok(name, ne); ok(email, ee);
    let first = null;
    if (name.value.trim().length < 2) { bad(name, ne, "Please enter the recipient's name."); first = name; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { bad(email, ee, 'Please enter a valid email address.'); first = first || email; }
    if (first) { first.focus(); return; }
    const amount = Number($('input[name=amount]:checked', form).value);
    const rec = { amount, to: name.value.trim(), email: email.value.trim(), created: new Date().toISOString() };
    if (!tripped(form)) { // a filled-in spam trap looks successful but sends nothing
      const res = await send({ type: 'voucher', _subject: `Gift voucher request: $${amount} for ${rec.to}`, ...rec });
      if (!res.ok) { failBox.innerHTML = phoneFallback(); return; }
      try { const all = JSON.parse(store.get('ml-vouchers') || '[]'); all.push({ ...rec, demo: !isLive() }); store.set('ml-vouchers', JSON.stringify(all.slice(-25))); } catch (err) { /* ignore */ }
    }
    const note = isLive()
      ? `<p class="small"><strong>Thanks, we have your request.</strong> We will email the voucher and confirm payment details. Questions? Call <a href="tel:${SITE.phoneHref}">${SITE.phone}</a>.</p>`
      : '<p class="small"><strong>This is a demo: no voucher was issued, no email was sent and nothing was charged.</strong></p>';
    done.innerHTML = `<h3>${isLive() ? 'Voucher request received.' : 'Your demo voucher is ready.'}</h3><p><strong>$${amount}</strong> for <strong>${esc(name.value.trim())}</strong>, to be sent to ${esc(email.value.trim())}.</p>${note}<button type="button" class="btn btn-clay" data-again>Make another</button>`;
    form.hidden = true; done.hidden = false; done.focus();
    } finally { busy.stop(); }
  });
  done.addEventListener('click', (e) => { if (e.target.closest('[data-again]')) { form.reset(); form.hidden = false; done.hidden = true; $('input[name=amount]:checked', form).focus(); } });
}
