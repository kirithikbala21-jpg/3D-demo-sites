// Gift voucher mini-form. FRONT END ONLY: nothing is issued, sent or charged.
import { $, $$, store } from './util.js';

const root = $('#voucher-app');
if (root) {
  const form = $('form', root), done = $('.voucher-done', root);
  const name = $('#v-name'), email = $('#v-email'), ne = $('#v-name-err'), ee = $('#v-email-err');
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bad = (input, el, msg) => { el.textContent = msg; el.hidden = false; input.setAttribute('aria-invalid', 'true'); };
  const ok = (input, el) => { el.hidden = true; input.removeAttribute('aria-invalid'); };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ok(name, ne); ok(email, ee);
    let first = null;
    if (name.value.trim().length < 2) { bad(name, ne, "Please enter the recipient's name."); first = name; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { bad(email, ee, 'Please enter a valid email address.'); first = first || email; }
    if (first) { first.focus(); return; }
    const amount = Number($('input[name=amount]:checked', form).value);
    try { const all = JSON.parse(store.get('ml-vouchers') || '[]'); all.push({ amount, to: name.value.trim(), email: email.value.trim(), created: new Date().toISOString(), demo: true }); store.set('ml-vouchers', JSON.stringify(all.slice(-25))); } catch (err) { /* ignore */ }
    done.innerHTML = `<h3>Your demo voucher is ready.</h3><p><strong>$${amount}</strong> for <strong>${esc(name.value.trim())}</strong>, to be sent to ${esc(email.value.trim())}.</p><p class="small"><strong>This is a demo: no voucher was issued, no email was sent and nothing was charged.</strong></p><button type="button" class="btn btn-clay" data-again>Make another</button>`;
    form.hidden = true; done.hidden = false; done.focus();
  });
  done.addEventListener('click', (e) => { if (e.target.closest('[data-again]')) { form.reset(); form.hidden = false; done.hidden = true; $('input[name=amount]:checked', form).focus(); } });
}
