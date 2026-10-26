// Waitlist form for a full class or time slot. FRONT END ONLY: nothing is sent anywhere.
// Real saving and notifications are connected later: plug an email/SMS service in where `onJoin` is handled in the caller (send
// { name, contact, day, time } and tell the customer when a spot opens). Until then the entry is only kept in THIS browser
// (localStorage key `waitlist`) so the demo can show it working.
// It is a <div role="group"> with a button (not a nested <form>), because on the trial page it sits inside the booking form.
import { dayLabel, clock12, DAYS, MONTHS, dow } from './dates.js';
import { auPhone } from './formtools.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const validContact = (v) => EMAIL.test(v.trim()) || !!auPhone(v);

/** Build the form. opts = { dayKey, mins (start minutes), what, onJoin(entry), kind: 'waitlist' | 'callback', consent }.
 *  Returns the element; the caller puts it in the page. */
export function waitlistForm(opts) {
  const callback = opts.kind === 'callback';
  const when = opts.dayKey ? `${dayLabel(opts.dayKey)}${opts.mins != null ? ', ' + clock12(opts.mins) : ''}` : '';
  const short = opts.dayKey ? `${DAYS[dow(opts.dayKey)].slice(0, 3)} ${Number(opts.dayKey.slice(8))} ${MONTHS[Number(opts.dayKey.slice(5, 7)) - 1].slice(0, 3)}${opts.mins != null ? ', ' + clock12(opts.mins) : ''}` : '';
  const el = document.createElement('div'); el.className = 'wl';
  const consent = opts.consent || (callback ? 'We will only use this to call you back.' : 'We will only contact you if a spot opens.');
  el.innerHTML = `<div class="wl-form" role="group" aria-labelledby="wl-title">
    <h4 class="wl-title" id="wl-title">${callback ? 'Call me back' : 'Join the waitlist'}</h4>
    ${when ? `<p class="wl-when">${callback ? 'Preferred time' : 'For'}: <strong>${esc(when)}</strong>${opts.what ? ' · ' + esc(opts.what) : ''}</p>` : ''}
    <label class="wl-label" for="wl-name">Name</label><input class="wl-input" id="wl-name" name="name" autocomplete="name">
    <p class="wl-err" data-for="name" hidden></p>
    <label class="wl-label" for="wl-contact">Phone or email</label><input class="wl-input" id="wl-contact" name="contact" autocomplete="off" placeholder="0412 345 678 or you@example.com">
    <p class="wl-err" data-for="contact" hidden></p>
    ${callback ? '' : `<label class="wl-label" for="wl-pref">Preferred day and time</label><input class="wl-input" id="wl-pref" name="pref" value="${esc(short)}">`}
    <p class="wl-consent">${esc(consent)}</p>
    <div class="hp" aria-hidden="true"><label>Leave empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
    <button class="btn btn-primary btn-block wl-btn" type="button">${callback ? 'Request a call back' : 'Join the waitlist'}</button>
    <p class="wl-demo">Demo only: nothing is sent. Your name and number are saved only in this browser so you can see it working; real saving and notifications are connected later.</p>
  </div><div class="wl-done" role="status" tabindex="-1" hidden></div>`;
  const form = el.querySelector('.wl-form'), done = el.querySelector('.wl-done');
  const input = (n) => form.querySelector(`[name=${n}]`);
  const err = (n, msg) => { const p = el.querySelector(`[data-for=${n}]`), i = input(n); p.textContent = msg; p.hidden = !msg; if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); return !msg; };
  let busy = false;
  const submit = () => {
    if (busy) return;
    const name = input('name').value.trim(), contact = input('contact').value.trim();
    const a = err('name', name.length < 2 ? 'Please tell us your name.' : ''), b = err('contact', !contact ? 'Please give a phone number or an email.' : validContact(contact) ? '' : 'That does not look like an Australian phone number or an email address.');
    if (!a) { input('name').focus(); return; } if (!b) { input('contact').focus(); return; }
    busy = true;
    if (!input('website').value) { // a filled-in spam trap looks successful but saves nothing
      const entry = { name, contact, day: opts.dayKey || null, time: opts.mins != null ? clock12(opts.mins) : null, pref: input('pref') ? input('pref').value.trim() : '', kind: opts.kind || 'waitlist', created: new Date().toISOString() };
      try { const all = JSON.parse(localStorage.getItem('waitlist') || '[]'); all.push(entry); localStorage.setItem('waitlist', JSON.stringify(all.slice(-25))); } catch (x) { /* storage blocked: fine */ }
      if (opts.onJoin) opts.onJoin(entry);
    }
    form.hidden = true; done.hidden = false;
    done.innerHTML = callback
      ? `<p><strong>Call-back requested.</strong> This is a demo, so nothing was sent.</p>`
      : `<p><strong>You're on the waitlist${when ? ' for ' + esc(when) : ''}.</strong></p><p>This is a demo: nothing was sent and nobody will be notified.</p>`;
    done.focus();
  };
  el.querySelector('.wl-btn').addEventListener('click', submit);
  form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); submit(); } });
  return el;
}
