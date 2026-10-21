// Quote form. DEMO ONLY: it validates in the browser, shows a confirmation and saves the request to this browser
// (localStorage key "wp-quotes"). Nothing is sent unless site.config.json > form.endpoint is set (see README, "Connect the quote form").
import { $, $$, SITE, store } from './util.js';
import { addHoneypot, tripped, guard, send, isLive, phoneFallback } from './forms.js';

(() => {
  const form = $('#quote-form'); if (!form) return;
  const done = $('#quote-done'), card = form.closest('.form-card');
  addHoneypot(form);
  const busy = guard($('button[type=submit]', form));
  const f = { name: $('#q-name'), phone: $('#q-phone'), suburb: $('#q-suburb'), service: $('#q-service'), msg: $('#q-msg'), photo: $('#q-photo') };

  /* ---------- Service cards jump here and preselect the problem and urgency ---------- */
  $$('a[data-service]').forEach((a) => a.addEventListener('click', () => {
    f.service.value = a.dataset.service;
    const u = form.elements.urgency; if (u && [...u.options].some((o) => o.value === a.dataset.urgency)) u.value = a.dataset.urgency;
    f.service.removeAttribute('aria-invalid'); $('#e-service').hidden = true;
    if (done && !done.hidden) reset();
  }));

  /* ---------- Validation ---------- */
  // Australian numbers: 04xx xxx xxx mobiles, 02/03/07/08 landlines, 13xx xxxx and 1300/1800 numbers; +61 is accepted.
  const normPhone = (v) => { let d = v.replace(/[\s().-]/g, ''); if (/^\+?61/.test(d)) d = '0' + d.replace(/^\+?61/, '').replace(/^0/, ''); return d; };
  const phoneOk = (v) => { const d = normPhone(v); return /^0[2-478]\d{8}$/.test(d) || /^13\d{4}$/.test(d) || /^1[38]00\d{6}$/.test(d); };
  const rules = {
    name: () => (f.name.value.trim().length >= 2 ? '' : 'Please tell us your name.'),
    phone: () => (!f.phone.value.trim() ? 'Please enter a phone number so we can call you.' : phoneOk(f.phone.value) ? '' : 'That does not look like an Australian phone number. Try 0412 345 678 or 03 5550 0142.'),
    suburb: () => (f.suburb.value.trim().length >= 3 ? '' : 'Please enter your suburb.'),
    service: () => (f.service.value ? '' : 'Please choose what the problem is.'),
  };
  const check = (key) => {
    const msg = rules[key](), el = f[key], out = $('#e-' + key);
    out.textContent = msg; out.hidden = !msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return !msg;
  };
  Object.keys(rules).forEach((k) => {
    f[k].addEventListener('blur', () => { if (f[k].value || f[k].getAttribute('aria-invalid')) check(k); });
    f[k].addEventListener('input', () => { if (f[k].getAttribute('aria-invalid') === 'true') check(k); });
    f[k].addEventListener('change', () => { if (f[k].getAttribute('aria-invalid') === 'true') check(k); });
  });

  /* ---------- Photo: shows the file name and a small preview. It is never uploaded in the demo. ---------- */
  const prev = $('#photo-preview'), thumb = $('#photo-thumb'), pname = $('#photo-name'), perr = $('#e-photo');
  let url = '';
  const clearPhoto = () => { if (url) URL.revokeObjectURL(url); url = ''; f.photo.value = ''; prev.hidden = true; thumb.removeAttribute('src'); pname.textContent = ''; perr.hidden = true; };
  f.photo.addEventListener('change', () => {
    const file = f.photo.files && f.photo.files[0];
    if (!file) { clearPhoto(); return; }
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name)) { clearPhoto(); perr.textContent = 'Please choose a photo (JPG, PNG or HEIC).'; perr.hidden = false; return; }
    if (file.size > 15 * 1024 * 1024) { clearPhoto(); perr.textContent = 'That photo is over 15 MB. Please choose a smaller one.'; perr.hidden = false; return; }
    perr.hidden = true;
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(file);
    thumb.src = url; thumb.hidden = false; thumb.onerror = () => { thumb.hidden = true; };
    pname.textContent = file.name; prev.hidden = false;
  });
  $('#photo-clear').addEventListener('click', () => { clearPhoto(); f.photo.focus(); });

  /* ---------- Submit ---------- */
  const serviceName = (id) => (SITE.services.find((s) => s.id === id) || {}).name || id;
  function confirm(rec) {
    const first = rec.name.trim().split(/\s+/)[0];
    $('#done-title').textContent = rec.urgency === 'emergency' ? 'Please call us now' : 'Request received';
    $('#done-text').textContent = rec.urgency === 'emergency'
      ? `Thanks ${first}. This is an emergency, so please call ${SITE.phone} now. Our emergency line is answered 24/7.`
      : `Thanks ${first}, we will call you within ${SITE.callbackMinutes} minutes ${SITE.callbackWindow}.`;
    $('#done-sub').textContent = rec.urgency === 'emergency'
      ? 'Water off at the mains if you can, and keep clear of any gas smell.'
      : `${SITE.weekendLine} Outside those hours, the emergency line is open 24/7 on ${SITE.phone}.`;
    form.hidden = true; done.hidden = false; done.focus();
  }
  function reset() { form.reset(); clearPhoto(); $$('[aria-invalid]', form).forEach((e) => e.removeAttribute('aria-invalid')); $$('.field-error', form).forEach((e) => { e.hidden = true; }); done.hidden = true; form.hidden = false; }
  $('#quote-again').addEventListener('click', () => { reset(); f.name.focus(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return; // a second click while the first is still being handled
    try {
      const results = Object.keys(rules).map(check);
      if (results.includes(false)) { f[Object.keys(rules)[results.indexOf(false)]].focus(); return; }
      const file = f.photo.files && f.photo.files[0];
      const rec = {
        name: f.name.value.trim(), phone: normPhone(f.phone.value), suburb: f.suburb.value.trim(), service: f.service.value, serviceName: serviceName(f.service.value),
        urgency: form.elements.urgency.value, when: form.elements.when.value, message: f.msg.value.trim(), photoName: file ? file.name : '', savedAt: new Date().toISOString(),
      };
      const err = $('#e-photo');
      if (!tripped(form)) { // a filled-in spam trap looks successful but sends nothing
        const res = await send({ type: 'quote', _subject: `Quote request: ${rec.serviceName} in ${rec.suburb}`, ...rec }, { file });
        if (!res.ok) { err.innerHTML = phoneFallback().replace(/^<p[^>]*>|<\/p>$/g, ''); err.hidden = false; return; }
        try { const all = JSON.parse(store.get('wp-quotes') || '[]'); all.push(rec); store.set('wp-quotes', JSON.stringify(all.slice(-20))); } catch (e2) { store.set('wp-quotes', JSON.stringify([rec])); }
      }
      confirm(rec);
    } finally { busy.stop(); }
  });
})();
