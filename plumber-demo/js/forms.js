// Shared form helpers: spam trap, double-submit guard, sending to the endpoint set in site.config.json (forms.endpoint).
// With no endpoint the forms stay a clearly labelled demo (nothing is sent). Failures are logged and shown with a phone fallback.
import { SITE } from './util.js';

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
export async function send(payload, { file } = {}) {
  const url = endpoint();
  if (!url) return { ok: true, demo: true };
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const opts = file
      ? { method: 'POST', headers: { Accept: 'application/json' }, body: (() => { const b = new FormData(); Object.entries(payload).forEach(([k, v]) => b.append(k, v)); b.append('photo', file); return b; })(), signal: ctl.signal }
      : { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: ctl.signal };
    const res = await fetch(url, opts);
    clearTimeout(t);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return { ok: true, demo: false };
  } catch (err) {
    console.error('[form] could not send the enquiry:', err && err.message ? err.message : err, payload && payload.type);
    return { ok: false, demo: false };
  }
}
export const phoneFallback = () => `<p class="form-fail" role="alert">Sorry, that did not send. Please call us on <a href="tel:${SITE.phoneHref}">${SITE.phone}</a> and we will sort it out.</p>`;
