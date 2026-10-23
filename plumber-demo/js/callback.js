// "Call me back" request, offered next to the quote form and from the after-hours bar. FRONT END ONLY: in the demo nothing is sent
// (the request is kept in this browser under localStorage key "wp-callbacks"). Set site.config.json > form.endpoint to send it for real.
// Switched off (and hidden completely) when site.config.json > waitlistEnabled is false.
import { $, SITE, store, nowMel } from './util.js';
import { addHoneypot, tripped, guard, send, isLive, phoneFallback } from './forms.js';
import { phoneOk, normPhone, emailOk } from './phone.js';

(() => {
  const wrap = $('#callback'); if (!wrap) return;
  if (!SITE.waitlistEnabled) { wrap.remove(); return; }
  wrap.hidden = false;
  const toggle = $('#callback-toggle'), panel = $('#callback-panel');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  panel.innerHTML = `<form class="cb-form" novalidate>
      <h3 class="cb-title">Call me back</h3>
      <div class="field"><label for="cb-name">Your name</label><input id="cb-name" name="name" type="text" autocomplete="name" aria-describedby="cb-e-name"><p class="field-error" id="cb-e-name" hidden></p></div>
      <div class="field"><label for="cb-contact">Mobile, phone or email</label><input id="cb-contact" name="contact" type="text" autocomplete="off" placeholder="0412 345 678 or you@example.com" aria-describedby="cb-e-contact"><p class="field-error" id="cb-e-contact" hidden></p></div>
      <div class="field"><label for="cb-when">Best time to call</label><select id="cb-when" name="when"><option value="asap">As soon as possible</option><option value="evening">This evening</option><option value="morning">Tomorrow morning</option><option value="afternoon">Tomorrow afternoon</option></select></div>
      <p class="rm-consent">We will only use this to call you back.</p>
      <button class="btn btn-navy btn-lg btn-block" type="submit">Request a call back</button>
      <div class="cb-fail" aria-live="assertive"></div>
      <p class="demo-note">${isLive() ? 'Your request goes to our office.' : '<strong>Demo form.</strong> Nothing is sent. For an emergency, call ' + esc(SITE.phone) + ' (answered 24/7).'}</p>
    </form>
    <div class="form-done cb-done" tabindex="-1" role="status" hidden></div>`;
  const form = $('form', panel), done = $('.cb-done', panel), fail = $('.cb-fail', panel);
  addHoneypot(form);
  const busy = guard($('button[type=submit]', form));
  const name = form.elements.name, contact = form.elements.contact;
  const WHEN = { asap: 'as soon as possible', evening: 'this evening', morning: 'tomorrow morning', afternoon: 'tomorrow afternoon' };
  const set = (el, id, msg) => { const p = $('#' + id); p.textContent = msg; p.hidden = !msg; if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); return !msg; };
  const open = (focus) => { panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); if (focus) name.focus({ preventScroll: false }); };
  toggle.addEventListener('click', () => { if (panel.hidden) open(true); else { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-callback-open]'); if (!a) return; e.preventDefault(); wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }); open(true); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return;
    try {
      fail.innerHTML = '';
      const v = contact.value.trim();
      const a = set(name, 'cb-e-name', name.value.trim().length < 2 ? 'Please tell us your name.' : '');
      const b = set(contact, 'cb-e-contact', !v ? 'Please give a phone number or an email so we can reach you.' : (phoneOk(v) || emailOk(v)) ? '' : 'That does not look like an Australian phone number or an email address.');
      if (!a) { name.focus(); return; } if (!b) { contact.focus(); return; }
      const rec = { name: name.value.trim(), contact: phoneOk(v) ? normPhone(v) : v, when: form.elements.when.value, savedAt: new Date().toISOString(), melbourneDay: nowMel().key };
      if (!tripped(form)) { // a filled-in spam trap looks successful but sends nothing
        const res = await send({ type: 'callback', _subject: `Call me back: ${rec.name}`, ...rec });
        if (!res.ok) { fail.innerHTML = phoneFallback(); return; }
        try { const all = JSON.parse(store.get('wp-callbacks') || '[]'); all.push(rec); store.set('wp-callbacks', JSON.stringify(all.slice(-20))); } catch (err) { store.set('wp-callbacks', JSON.stringify([rec])); }
      }
      form.hidden = true; done.hidden = false;
      done.innerHTML = `<h3>Call-back requested</h3><p>Thanks ${esc(rec.name.split(/\s+/)[0])}. We will call you ${WHEN[rec.when]}.</p><p class="done-sub">${isLive() ? 'If you do not hear from us, call' : 'This is a demo, so nothing was sent. For an emergency, call'} <a href="tel:${esc(SITE.phoneHref)}">${esc(SITE.phone)}</a>. The emergency line is answered 24/7.</p><button class="btn btn-outline" type="button" id="cb-again">Send another</button>`;
      done.focus();
    } finally { busy.stop(); }
  });
  done.addEventListener('click', (e) => { if (e.target.closest('#cb-again')) { form.reset(); form.hidden = false; done.hidden = true; name.focus(); } });
})();
