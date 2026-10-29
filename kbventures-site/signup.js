// "Get updates" sign-up on Home: one email address and the Privacy Policy tick, sent to Web3Forms exactly like the
// contact form (the same "formAccessKey" from site.config.json), with the subject and topic from the "signup" block.
// While that key is empty, it opens the visitor's email app instead, so nothing is lost. No page reload.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#signup-form');
  if (!form) return;
  const KB = window.KB || {};
  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  const esc = KB.esc || ((s) => String(s));
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ENDPOINT = 'https://api.web3forms.com/submit';
  const input = $('#s-email'), agree = $('#s-agree'), send = $('#s-send'), sendLabel = $('.btn-label', send), status = $('#s-status');

  // text, until the config arrives (the config's "signup" block replaces it)
  let T = {
    button: 'Notify me', sending: 'Sending…', subject: 'New update sign-up', topic: 'Updates sign-up',
    success: 'Thanks. We will email you when there is news.',
    error: 'Sorry, that did not go through. Please try again, or email us at {email}.',
    fallback: 'Your email app should open with your sign-up ready to send. If it did not, email us at {email}.',
    fallbackLink: 'Open the email again',
    errors: { email: 'Please enter your email address.', emailFormat: 'Please enter a valid email address, like name@example.com.', agree: 'Please tick the box to agree to the Privacy Policy.' }
  };
  let accessKey = '', fromName = 'KB Ventures Website', email = 'kb.ventures@outlook.com';
  if (KB.config) KB.config.then((c) => {
    if (!c) return;
    const sg = c.signup || {};
    T = Object.assign({}, T, sg, { errors: Object.assign({}, T.errors, sg.errors || {}) });
    accessKey = filled(c.formAccessKey) ? c.formAccessKey.trim() : '';
    if (c.contactPage && filled(c.contactPage.fromName)) fromName = c.contactPage.fromName;
    if (filled(c.company && c.company.email)) email = c.company.email.trim();
  });

  /* ---------- Checking the two fields ---------- */
  const checks = {
    'email': [input, () => (!filled(input.value) ? T.errors.email : EMAIL_RE.test(input.value.trim()) ? '' : T.errors.emailFormat)],
    'agree': [agree, () => (agree.checked ? '' : T.errors.agree)]
  };
  let tried = false;
  function validate(key) {
    const [field, check] = checks[key], msg = check(), out = $('#e-s-' + key);
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    out.textContent = msg; out.hidden = !msg;
    return !msg;
  }
  input.addEventListener('input', () => { if (tried) validate('email'); });
  agree.addEventListener('change', () => { if (tried) validate('agree'); });

  const emailLink = () => `<a href="mailto:${esc(email)}">${esc(email)}</a>`;
  const withEmail = (s) => esc(s).replace('{email}', emailLink());
  function setStatus(kind, html) { status.className = 'form-status' + (kind ? ' is-' + kind : ''); status.innerHTML = html || ''; }
  function busy(on) { send.disabled = on; send.setAttribute('aria-busy', String(on)); sendLabel.textContent = on ? T.sending : T.button; }
  function success() {
    const box = $('#signup-box'), done = document.createElement('p');
    done.className = 'signup-done'; done.setAttribute('role', 'status'); done.tabIndex = -1; done.textContent = T.success;
    box.replaceChildren(done); done.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (send.disabled) return;
    tried = true;
    const okEmail = validate('email'), okAgree = validate('agree');
    if (!okEmail || !okAgree) { (okEmail ? agree : input).focus(); return; }
    // the hidden spam trap: people never tick it, bots often do. Pretend it worked and send nothing.
    if ($('#s-botcheck').checked) { success(); return; }
    if (KB.config) await KB.config; // the key comes from the config: never fall back just because it is still loading
    const address = input.value.trim();
    if (!accessKey) {
      const url = `mailto:${email}?subject=${encodeURIComponent(T.subject)}&body=${encodeURIComponent(`Please add me to the KB Ventures updates: ${address}`)}`;
      setStatus('note', `${withEmail(T.fallback)} <a class="mailto-again" href="${url.replace(/"/g, '%22')}">${esc(T.fallbackLink)}</a>`);
      window.location.href = url;
      return;
    }
    busy(true); setStatus('');
    const ctl = 'AbortController' in window ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 15000);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: accessKey, subject: T.subject, from_name: fromName, email: address, topic: $('#s-topic').value || T.topic, botcheck: $('#s-botcheck').checked }),
        signal: ctl ? ctl.signal : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'HTTP ' + res.status);
      success();
    } catch (err) {
      busy(false);
      setStatus('error', withEmail(T.error));
      send.focus();
    } finally { clearTimeout(timer); }
  });
})();
