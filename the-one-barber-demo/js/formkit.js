// Shared form helpers: spam trap, double-submit guard, sending to the endpoint set in site.config.json (forms.endpoint).
// With no endpoint the forms stay a clearly labelled demo (nothing is sent). Failures are logged and shown with a phone fallback.
import { site as SITE } from './util.js';

export const endpoint = () => ((SITE.forms || {}).endpoint || '').trim();
export const isLive = () => !!endpoint();
/** A hidden field real people never fill in; if it has a value, treat the submission as spam. */
export const tripped = (form) => { const hp = form.querySelector('input[name="website"]'); return !!(hp && hp.value.trim()); };
/** Add the honeypot field to a form that does not have one yet. */
export function addHoneypot(form) {
  if (form.querySelector('input[name="website"]')) return;
  const d = document.createElement('div'); d.className = 'hp'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = '<label>Leave this field empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
  form.append(d);
}
/** Stops a second click while the first is being handled. Use: const busy = guard(btn); if (!busy.start()) return; ... busy.stop(). */
export function guard(button) {
  let on = false;
  return {
    start() { if (on) return false; on = true; if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); } return true; },
    stop() { on = false; if (button) { button.disabled = false; button.removeAttribute('aria-busy'); } },
  };
}
/** Send a payload. Resolves { ok, demo }. Never throws. */
export async function send(payload) {
  const url = endpoint();
  if (!url) return { ok: true, demo: true };
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return { ok: true, demo: false };
  } catch (err) {
    console.error('[form] could not send the enquiry:', err && err.message ? err.message : err, payload && payload.type);
    return { ok: false, demo: false };
  }
}
export const phoneFallback = () => `<p class="form-fail" role="alert">Sorry, that did not send. Please call us on <a href="tel:${SITE.phoneHref}">${SITE.phone}</a> and we will sort it out.</p>`;

/** Australian phone numbers: mobiles (04), landlines (02, 03, 07, 08), 13/1300/1800. Returns the digits (0412345678) or null. */
export function auPhone(v) {
  let d = String(v).replace(/[\s\-().]/g, '');
  if (/^\+61/.test(d)) d = '0' + d.slice(3); else if (/^61\d{9}$/.test(d)) d = '0' + d.slice(2);
  if (!/^\d+$/.test(d)) return null;
  return (/^04\d{8}$/.test(d) || /^0[2378]\d{8}$/.test(d) || /^1[38]00\d{6}$/.test(d) || /^13\d{4}$/.test(d)) ? d : null;
}
export const prettyPhone = (d) => (d.startsWith('04') ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : /^0\d{9}$/.test(d) ? `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}` : d);
export const PHONE_ERR = `Please enter an Australian phone number, like 0412 345 678 or ${SITE.phone || '02 5550 0100'}.`;
