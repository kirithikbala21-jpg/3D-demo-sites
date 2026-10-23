// "Remind me" control for the quote form. FRONT END ONLY.
//
// SENDING IS NOT CONNECTED. Nothing here emails or texts anyone. When the owner is ready, plug an email or SMS service in where the
// quote form is submitted (see `reminder.read()` in js/quote.js): send `{ mode, contact, remindAt }` to the service, per customer.
// Until then the confirmation only says a reminder is "set" for a time, and the demo note says nothing is sent.
import { addDays, dayLabel } from './dates.js';
import { auMobile, emailOk } from './phone.js';

/** When the reminder is due, as { key, label }: `leadHours` before the day (24 = the day before, 48 = two days before) at 9am.
 *  If that moment has already passed (for example a same-day request) it moves to the next 9am, never after the day itself.
 *  `now` is { key, mins } in the business's time zone. */
export function reminderDay(targetKey, leadHours, now) {
  const days = Math.max(1, Math.round((leadHours || 24) / 24));
  let day = addDays(targetKey, -days);
  if (day < now.key || (day === now.key && now.mins >= 540)) day = now.mins < 540 ? now.key : addDays(now.key, 1);
  if (day > targetKey) day = targetKey;
  return { key: day, label: `${dayLabel(day)}, 9am` };
}

/** Adds the control just above `host` (the submit button) and returns a controller, or null when reminders are switched off. */
export function mountReminder(host, cfg = {}, id = 'rm') {
  if (!host || cfg.remindersEnabled !== true) return null;
  const wrap = document.createElement('fieldset'); wrap.className = 'field rm-field'; wrap.id = id + '-field';
  wrap.innerHTML = `<legend>Remind me <span class="rm-opt">(optional)</span></legend>
    <div class="urgency-grid when-grid rm-grid">
      <label class="opt"><input type="radio" name="${id}-mode" value="none" checked><span>None</span></label>
      <label class="opt"><input type="radio" name="${id}-mode" value="email"><span>Email</span></label>
      <label class="opt"><input type="radio" name="${id}-mode" value="text"><span>Text</span></label>
    </div>
    <div class="rm-contact" hidden>
      <label class="rm-label" for="${id}-contact">Email address</label>
      <input class="rm-input" id="${id}-contact" name="${id}-contact" autocomplete="off" aria-describedby="${id}-err ${id}-consent">
      <p class="field-error" id="${id}-err" hidden></p>
      <p class="rm-consent" id="${id}-consent">We will only use this to send your reminder.</p>
    </div>`;
  host.before(wrap);
  const q = (s) => wrap.querySelector(s);
  const box = q('.rm-contact'), input = q('.rm-input'), label = q('.rm-label'), err = q('.field-error');
  const mode = () => wrap.querySelector('input[name$="-mode"]:checked').value;
  const sync = () => {
    const m = mode(); box.hidden = m === 'none';
    if (m === 'email') { label.textContent = 'Email address'; input.type = 'email'; input.inputMode = 'email'; input.autocomplete = 'email'; input.placeholder = 'you@example.com'; }
    if (m === 'text') { label.textContent = 'Mobile number for the text'; input.type = 'tel'; input.inputMode = 'tel'; input.autocomplete = 'tel'; input.placeholder = '0412 345 678'; }
    err.hidden = true; input.removeAttribute('aria-invalid');
  };
  // only the None/Email/Text choice re-syncs the field: a text input's own blur/change must not hide its error (that shifts the button under the visitor's finger)
  wrap.addEventListener('change', (e) => { if (e.target.matches('input[type=radio]')) sync(); }); sync();
  const ctl = {
    el: wrap,
    /** { ok, mode, contact }; shows an error under the field when the chosen option is invalid. */
    read() {
      const m = mode(); if (m === 'none') return { ok: true, mode: 'none' };
      const v = input.value.trim(); let ok = true, msg = '';
      if (m === 'email' && !emailOk(v)) { ok = false; msg = 'Please enter a valid email address, like you@example.com.'; }
      if (m === 'text' && !auMobile(v)) { ok = false; msg = 'Please enter an Australian mobile number, like 0412 345 678.'; }
      err.textContent = msg; err.hidden = ok;
      if (ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
      return { ok, mode: m, contact: ok ? (m === 'text' ? auMobile(v) : v) : undefined, input };
    },
    /** "Reminder set for Tuesday 20 October, 9am (by email)." or '' when none was chosen. */
    confirmation(targetKey, now) {
      const r = ctl.read(); if (!r.ok || r.mode === 'none') return '';
      return `Reminder set for ${reminderDay(targetKey, cfg.reminderLeadHours, now).label} (by ${r.mode === 'email' ? 'email' : 'text'}).`;
    },
    show(on) { wrap.hidden = !on; },
    reset() { wrap.querySelector('input[value="none"]').checked = true; input.value = ''; sync(); },
  };
  return ctl;
}
