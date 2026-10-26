// "Remind me" control for booking, quote, enquiry and trial forms. FRONT END ONLY.
//
// SENDING IS NOT CONNECTED. Nothing here emails or texts anyone. When the owner is ready, plug an email or SMS service in
// where the form is submitted (look for `reminder.read()` in js/trial.js and js/forms.js): send `{ mode, contact, remindAt }` to the
// service, per customer. Until then the confirmation only says a reminder is "set" for a time, and the demo note says nothing is sent.
import { addDays, dayLabel } from './dates.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Australian mobile: 04xx xxx xxx, +61 4xx xxx xxx, with spaces, dashes or brackets allowed. */
export function auMobile(v) {
  let d = String(v).replace(/[\s\-().]/g, '');
  if (/^\+614\d{8}$/.test(d)) d = '0' + d.slice(3); else if (/^614\d{8}$/.test(d)) d = '0' + d.slice(2);
  return /^04\d{8}$/.test(d) ? d : null;
}
/** When the reminder is due: the day before (leadHours 24 = 1 day, 48 = 2 days ...) at 9am, as a readable string. */
export function reminderWhen(dayKey, leadHours = 24, todayKey = null) {
  const daysBefore = Math.max(1, Math.round(leadHours / 24)), due = addDays(dayKey, -daysBefore);
  if (todayKey && due < todayKey) return 'today, straight after you book (the appointment is very soon)'; // the usual time has already passed
  return `${dayLabel(due)}, 9am`;
}

/** Adds the control to `host` (an element inside the form, usually just above the submit button) and returns a controller.
 *  cfg = { remindersEnabled, reminderLeadHours }. Returns null (and adds nothing) when reminders are switched off in config. */
export function mountReminder(host, cfg = {}, id = 'rm') {
  if (!host || cfg.remindersEnabled === false || cfg.remindersEnabled === undefined || cfg.remindersEnabled === null) return null;
  const wrap = document.createElement('fieldset'); wrap.className = 'rm-field';
  wrap.innerHTML = `<legend>Remind me <span class="rm-opt">(optional)</span></legend>
    <div class="rm-choices" role="radiogroup">
      <label class="rm-choice"><input type="radio" name="${id}-mode" value="none" checked><span>None</span></label>
      <label class="rm-choice"><input type="radio" name="${id}-mode" value="email"><span>Email</span></label>
      <label class="rm-choice"><input type="radio" name="${id}-mode" value="text"><span>Text</span></label>
    </div>
    <div class="rm-contact" hidden>
      <label class="rm-label" for="${id}-contact"></label>
      <input class="rm-input" id="${id}-contact" name="${id}-contact" autocomplete="off" aria-describedby="${id}-err ${id}-consent">
      <p class="rm-err" id="${id}-err" role="alert" hidden></p>
      <p class="rm-consent" id="${id}-consent">We will only use this to send your reminder.</p>
    </div>`;
  host.before(wrap);
  const q = (s) => wrap.querySelector(s);
  const box = q('.rm-contact'), input = q('.rm-input'), label = q('.rm-label'), err = q('.rm-err');
  const mode = () => wrap.querySelector('input[name$="-mode"]:checked').value;
  const sync = () => {
    const m = mode(); box.hidden = m === 'none';
    if (m === 'email') { label.textContent = 'Email address'; input.type = 'email'; input.inputMode = 'email'; input.autocomplete = 'email'; input.placeholder = 'you@example.com'; }
    if (m === 'text') { label.textContent = 'Mobile number'; input.type = 'tel'; input.inputMode = 'tel'; input.autocomplete = 'tel'; input.placeholder = '0412 345 678'; }
    err.hidden = true; input.removeAttribute('aria-invalid');
  };
  wrap.addEventListener('change', (e) => { if (e.target.name === `${id}-mode`) sync(); }); // only the None/Email/Text choice re-renders; typing in the field must not hide its error
  sync();
  const ctl = {
    el: wrap,
    /** { ok, mode, contact } ; shows an error under the field when the chosen option is invalid */
    read() {
      const m = mode(); if (m === 'none') return { ok: true, mode: 'none' };
      const v = input.value.trim(); let ok = true, msg = '';
      if (m === 'email' && !EMAIL.test(v)) { ok = false; msg = 'Please enter a valid email address, like you@example.com.'; }
      if (m === 'text' && !auMobile(v)) { ok = false; msg = 'Please enter an Australian mobile number, like 0412 345 678.'; }
      err.textContent = msg; err.hidden = ok; if (ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
      return { ok, mode: m, contact: ok ? (m === 'text' ? auMobile(v) : v) : undefined, input };
    },
    /** One line for the confirmation: "Reminder set for Tuesday 20 October, 9am (by email)." or '' when none was chosen. */
    confirmation(dayKey, todayKey = null) {
      const r = ctl.read(); if (!r.ok || r.mode === 'none') return '';
      return `Reminder set for ${reminderWhen(dayKey, cfg.reminderLeadHours || 24, todayKey)} (by ${r.mode === 'email' ? 'email' : 'text'}).`;
    },
    reset() { wrap.querySelector('input[value="none"]').checked = true; input.value = ''; sync(); },
  };
  return ctl;
}
