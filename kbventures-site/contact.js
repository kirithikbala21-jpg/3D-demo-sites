// Contact form: checks each field, then sends the message to Web3Forms (https://web3forms.com) with the access key from
// "formAccessKey" in site.config.json. While that key is empty, it opens the visitor's email app with the message filled
// in instead, so nothing is lost. No page reload; the result is announced to screen readers.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#contact-form');
  if (!form) return;
  const KB = window.KB || {};
  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ENDPOINT = 'https://api.web3forms.com/submit';
  const status = $('#form-status'), send = $('#f-send'), sendLabel = $('.btn-label', send);

  // text, until the config arrives (the config's contactPage block replaces it)
  let T = {
    send: 'Send', sending: 'Sending…', success: 'Thanks, we’ll reply soon.', successText: 'Your message has been sent.',
    error: 'Sorry, your message didn’t send. Please try again, or email us at {email}.',
    fallback: 'Your email app should open with your message ready to send. If it didn’t, email us at {email}.',
    fallbackLink: 'Open the email again', subject: 'New message from KB Ventures website', fromName: 'KB Ventures site',
    errors: { name: 'Please enter your name.', email: 'Please enter your email address.', emailFormat: 'Please enter a valid email address, like name@example.com.', message: 'Please write a message.', messageShort: 'Please write at least 10 characters.', agree: 'Please tick the box to agree to the Privacy Policy.', summary: 'Please fix the highlighted fields.' }
  };
  let accessKey = '', email = 'kb.ventures@outlook.com', cfg = null;

  // contact.html?topic=partnership preselects "Partnership" (letters and digits are compared, so "shopfront" finds
  // "Shopfront" and "general" finds "General question")
  const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
  function preselect() {
    const want = norm(new URLSearchParams(location.search).get('topic') || '');
    if (!want) return;
    const sel = $('#f-topic'), opts = [...sel.options];
    const hit = opts.find((o) => norm(o.value) === want) || opts.find((o) => norm(o.value).startsWith(want));
    if (hit) sel.value = hit.value;
  }
  preselect();

  if (KB.config) KB.config.then((c) => {
    if (!c) return;
    cfg = c;
    const p = c.contactPage || {};
    T = Object.assign({}, T, p, { errors: Object.assign({}, T.errors, p.errors || {}) });
    accessKey = filled(c.formAccessKey) ? c.formAccessKey.trim() : '';
    if (filled(c.company && c.company.email)) email = c.company.email.trim();
    // the topic list
    const sel = $('#f-topic');
    if (Array.isArray(p.topics) && p.topics.filter(filled).length) {
      const keep = sel.value;
      sel.replaceChildren(...p.topics.filter(filled).map((t) => { const o = document.createElement('option'); o.value = o.textContent = t; return o; }));
      if (p.topics.includes(keep)) sel.value = keep;
      preselect();
    }
    if (!send.disabled) sendLabel.textContent = T.send;
  });

  /* ---------- Checking the fields ---------- */
  const fields = {
    name: { el: $('#f-name'), check: (v) => (filled(v) ? '' : T.errors.name) },
    email: { el: $('#f-email'), check: (v) => (!filled(v) ? T.errors.email : EMAIL_RE.test(v.trim()) ? '' : T.errors.emailFormat) },
    message: { el: $('#f-message'), check: (v) => (!filled(v) ? T.errors.message : v.trim().length < 10 ? T.errors.messageShort : '') },
    agree: { el: $('#f-agree'), check: (v, el) => (el.checked ? '' : T.errors.agree) }
  };
  let tried = false;
  function validate(key) {
    const f = fields[key], msg = f.check(f.el.value, f.el), out = $('#e-' + key);
    f.el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    out.textContent = msg; out.hidden = !msg;
    return !msg;
  }
  Object.keys(fields).forEach((key) => {
    const f = fields[key];
    // quiet until the first send; after that each field re-checks as it is fixed
    f.el.addEventListener(f.el.type === 'checkbox' ? 'change' : 'input', () => { if (tried || f.el.getAttribute('aria-invalid') === 'true') validate(key); });
    f.el.addEventListener('blur', () => { if (tried && f.el.type !== 'checkbox') validate(key); });
  });

  function setStatus(msg, kind, html) {
    status.className = 'form-status' + (kind ? ' is-' + kind : '');
    if (html) status.innerHTML = html; else status.textContent = msg || '';
  }
  function busy(on) {
    send.disabled = on;
    send.setAttribute('aria-busy', String(on));
    sendLabel.textContent = on ? T.sending : T.send;
  }
  const values = () => ({
    name: $('#f-name').value.trim(), email: $('#f-email').value.trim(), phone: $('#f-phone').value.trim(),
    business: $('#f-business').value.trim(), topic: $('#f-topic').value, message: $('#f-message').value.trim()
  });
  const emailLink = () => `<a href="mailto:${KB.esc ? KB.esc(email) : email}">${KB.esc ? KB.esc(email) : email}</a>`;
  const withEmail = (s) => (KB.esc ? KB.esc(s) : s).replace('{email}', emailLink());

  function success() {
    const box = $('#form-box');
    box.innerHTML = '';
    const done = document.createElement('div');
    done.className = 'form-success';
    done.setAttribute('role', 'status');
    done.innerHTML = '<span class="success-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>';
    const h = document.createElement('h2'); h.className = 'success-title'; h.tabIndex = -1; h.textContent = T.success;
    const p = document.createElement('p'); p.className = 'lead'; p.textContent = T.successText;
    done.append(h, p); box.append(done);
    h.focus();
  }
  function mailtoFallback(v) {
    const lines = [`Name: ${v.name}`, `Email: ${v.email}`];
    if (v.phone) lines.push(`Phone: ${v.phone}`);
    if (v.business) lines.push(`Business: ${v.business}`);
    lines.push(`About: ${v.topic}`, '', v.message);
    const url = `mailto:${email}?subject=${encodeURIComponent(`${T.subject}: ${v.topic}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
    setStatus('', 'note', `${withEmail(T.fallback)} <a class="mailto-again" href="${url.replace(/"/g, '%22')}">${KB.esc ? KB.esc(T.fallbackLink) : T.fallbackLink}</a>`);
    window.location.href = url;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (send.disabled) return;
    tried = true;
    const bad = Object.keys(fields).filter((k) => !validate(k));
    if (bad.length) { setStatus(T.errors.summary, 'error'); fields[bad[0]].el.focus(); return; }
    // the hidden spam trap: people never tick it, bots often do. Pretend it worked and send nothing.
    if ($('#f-botcheck').checked) { success(); return; }
    const v = values();
    if (KB.config) await KB.config; // the key comes from the config: never fall back just because it is still loading
    if (!accessKey) { mailtoFallback(v); return; }
    busy(true); setStatus('');
    const ctl = 'AbortController' in window ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 15000);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: accessKey, subject: T.subject, from_name: T.fromName, name: v.name, email: v.email, phone: v.phone, business: v.business, topic: v.topic, message: v.message }),
        signal: ctl ? ctl.signal : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'HTTP ' + res.status);
      success();
    } catch (err) {
      busy(false);
      setStatus('', 'error', withEmail(T.error));
      send.focus();
    } finally { clearTimeout(timer); }
  });
})();
