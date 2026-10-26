// Waitlist form for a full time slot: name + phone. FRONT END ONLY: nothing is sent anywhere. The entry is saved in THIS browser only
// (localStorage key `bb-waitlist`) so the demo can show it working. REAL SAVING AND NOTIFICATIONS ARE CONNECTED LATER: handle `onJoin`
// (send { name, phone, day, time } to your diary / email / SMS service, and tell the customer when a spot opens).
import { dayLabel, clock12 } from './dates.js';
import { auPhone, PHONE_ERR } from './formkit.js';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Build the form. opts = { dayKey, mins (start minutes), what, onJoin(entry) }. Returns the element; the caller puts it in the page. */
export function waitlistForm(opts) {
  const when = opts.dayKey ? `${dayLabel(opts.dayKey)}${opts.mins != null ? ', ' + clock12(opts.mins) : ''}` : '';
  const el = document.createElement('div'); el.className = 'wl';
  el.innerHTML = `<form class="wl-form" novalidate>
    <h4 class="wl-title">Join the waitlist</h4>
    ${when ? `<p class="wl-when">For: <strong>${esc(when)}</strong>${opts.what ? ' · ' + esc(opts.what) : ''}</p>` : ''}
    <div class="field"><label for="wl-name">Name</label><input id="wl-name" name="name" autocomplete="name"><p class="error" data-for="name" aria-live="polite"></p></div>
    <div class="field"><label for="wl-phone">Phone</label><input id="wl-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0412 345 678"><p class="error" data-for="phone" aria-live="polite"></p></div>
    <p class="note wl-consent">We will only contact you if a spot opens.</p>
    <div class="hp" aria-hidden="true"><label>Leave empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
    <button class="btn btn-primary" type="submit">Join the waitlist</button>
    <p class="note wl-demo">Demo only: this is saved in this browser and nothing is sent. Real saving and notifications are connected later.</p>
  </form><div class="wl-done" role="status" tabindex="-1" hidden></div>`;
  const form = el.querySelector('form'), done = el.querySelector('.wl-done');
  const err = (n, msg) => { const p = el.querySelector(`[data-for=${n}]`), i = form.elements[n]; p.textContent = msg; if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); return !msg; };
  let busy = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault(); if (busy) return;
    const name = form.elements.name.value.trim(), phone = form.elements.phone.value.trim();
    const a = err('name', name.length < 2 ? 'Please tell us your name so we can put it on the list.' : '');
    const b = err('phone', !phone ? 'We need a phone number in case a spot opens.' : auPhone(phone) ? '' : PHONE_ERR);
    if (!a) { form.elements.name.focus(); return; }
    if (!b) { form.elements.phone.focus(); return; }
    busy = true;
    if (!form.elements.website.value) { // a filled-in spam trap looks successful but saves nothing
      const entry = { name, phone: auPhone(phone), day: opts.dayKey || null, time: opts.mins != null ? clock12(opts.mins) : null, created: new Date().toISOString() };
      try { const all = JSON.parse(localStorage.getItem('bb-waitlist') || '[]'); all.push(entry); localStorage.setItem('bb-waitlist', JSON.stringify(all.slice(-25))); } catch (x) { /* storage blocked: carry on */ }
      if (opts.onJoin) opts.onJoin(entry);
    }
    form.hidden = true; done.hidden = false;
    done.innerHTML = `<p><strong>You're on the waitlist${when ? ' for ' + esc(when) : ''}.</strong></p><p>This is a demo: it was saved in this browser only, and nobody will be notified.</p>`;
    done.focus();
  });
  return el;
}
