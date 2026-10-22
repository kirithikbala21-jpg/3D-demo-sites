// Waitlist form for a full time slot (and the plumber's "Call me back"). FRONT END ONLY: nothing is sent anywhere.
// Real notifications plug in where `onJoin` is handled (send { name, contact, day, time } to an email/SMS service and tell the
// customer when a spot opens). Until then the entry is only kept in this browser (localStorage key `waitlist`).
import { dayLabel, clock12 } from './dates.js';
import { auMobile } from './reminder.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const validContact = (v) => EMAIL.test(v.trim()) || !!auMobile(v);

/** Build the form. opts = { dayKey, mins (start minutes), what, onJoin(entry), kind: 'waitlist' | 'callback', phone, consent }.
 *  Returns the element; the caller puts it in the page. */
export function waitlistForm(opts) {
  const callback = opts.kind === 'callback';
  const when = opts.dayKey ? `${dayLabel(opts.dayKey)}${opts.mins != null ? ', ' + clock12(opts.mins) : ''}` : '';
  const el = document.createElement('div'); el.className = 'wl';
  const consent = opts.consent || (callback ? 'We will only use this to call you back.' : 'We will only contact you if a spot opens.');
  el.innerHTML = `<div class="wl-form" role="group" aria-labelledby="wl-title">
    <h4 class="wl-title" id="wl-title">${callback ? 'Call me back' : 'Join the waitlist'}</h4>
    ${when ? `<p class="wl-when">${callback ? 'Preferred time' : 'For'}: <strong>${esc(when)}</strong>${opts.what ? ' · ' + esc(opts.what) : ''}</p>` : ''}
    <label class="wl-label" for="wl-name">Name</label><input class="wl-input" id="wl-name" name="wl-name" autocomplete="name">
    <p class="wl-err" data-for="name" hidden></p>
    <label class="wl-label" for="wl-contact">Mobile or email</label><input class="wl-input" id="wl-contact" name="wl-contact" autocomplete="off" placeholder="0412 345 678 or you@example.com">
    <p class="wl-err" data-for="contact" hidden></p>
    ${callback ? '' : `<label class="wl-label" for="wl-pref">Preferred day and time</label><input class="wl-input" id="wl-pref" name="wl-pref" value="${esc(when)}">`}
    <p class="wl-consent">${esc(consent)}</p>
    <div class="hp" aria-hidden="true"><label>Leave empty<input type="text" name="wl-website" tabindex="-1" autocomplete="off"></label></div>
    <button class="wl-btn" type="button">${callback ? 'Request a call back' : 'Join the waitlist'}</button>
    <p class="wl-demo">Demo only: nothing is sent. ${callback ? '' : 'Real notifications are not connected.'}</p>
  </div><div class="wl-done" role="status" tabindex="-1" hidden></div>`;
  // a plain group, not a <form>, so it can sit inside another form (the reservation) without nesting forms
  const form = el.querySelector('.wl-form'), done = el.querySelector('.wl-done'), field = (n) => form.querySelector(`[name=wl-${n}]`); // names are prefixed so they never clash with the reservation form's own fields
  const err = (n, msg) => { const p = el.querySelector(`[data-for=${n}]`), i = field(n); p.textContent = msg; p.hidden = !msg; if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); return !msg; };
  let busy = false;
  const submit = (e) => {
    e.preventDefault(); if (busy) return;
    const name = field('name').value.trim(), contact = field('contact').value.trim();
    const a = err('name', name.length < 2 ? 'Please tell us your name.' : ''), b = err('contact', !contact ? 'Please give a mobile number or an email.' : validContact(contact) ? '' : 'That does not look like an Australian mobile or an email address.');
    if (!a) { field('name').focus(); return; } if (!b) { field('contact').focus(); return; }
    busy = true;
    if (!field('website').value) {
      const entry = { name, contact, day: opts.dayKey || null, time: opts.mins != null ? clock12(opts.mins) : null, pref: field('pref') ? field('pref').value.trim() : '', kind: opts.kind || 'waitlist', created: new Date().toISOString() };
      try { const all = JSON.parse(localStorage.getItem('waitlist') || '[]'); all.push(entry); localStorage.setItem('waitlist', JSON.stringify(all.slice(-25))); } catch (x) { /* storage blocked: fine */ }
      if (opts.onJoin) opts.onJoin(entry);
    }
    form.hidden = true; done.hidden = false;
    done.innerHTML = callback
      ? `<p><strong>Call-back requested.</strong> This is a demo, so nothing was sent. In an emergency please call <a href="tel:${esc(opts.phoneHref || '')}">${esc(opts.phone || '')}</a>.</p>`
      : `<p><strong>You're on the waitlist${when ? ' for ' + esc(when) : ''}.</strong></p><p>This is a demo: nothing was sent and nobody will be notified.</p>`;
    done.focus();
  };
  form.querySelector('.wl-btn').addEventListener('click', submit);
  form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') submit(e); });
  return el;
}
export const WAITLIST_CSS = `.wl{margin:12px 0;padding:16px;border:1.5px solid currentColor;border-radius:12px}.wl-title{margin:0 0 6px}.wl-when{margin:0 0 8px}.wl-label{display:block;margin:10px 0 4px;font-weight:600}.wl-input{width:100%;min-height:48px;padding:0 12px;font:inherit;border:1.5px solid currentColor;border-radius:8px;background:#fff;color:#111}.wl-err{margin:6px 0 0;font-weight:600;color:#a11}.wl-consent,.wl-demo{margin:8px 0 0;font-size:.875rem}.wl-btn{margin-top:12px;min-height:48px;padding:0 22px;border-radius:999px;border:0;font:inherit;font-weight:700;cursor:pointer;background:currentColor}.wl-btn span{color:#fff}.hp{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.hp input{width:1px;height:1px;padding:0;border:0;pointer-events:none}`;
