// Legal pages: fills names, email, state, ABN and the date from ../site.config.json.
// The HTML already holds the same text, so the pages still read correctly without JavaScript.
(function () {
  'use strict';
  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  // ["AceGuides", "KB Websites"] -> "AceGuides and KB Websites"
  const list = (a) => { a = a.filter(filled); return a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`; };

  function apply(cfg) {
    document.querySelectorAll('[data-c]').forEach((node) => {
      let v = get(cfg, node.dataset.c);
      if (Array.isArray(v)) v = list(v);
      if (filled(v)) node.textContent = v;
    });
    const email = get(cfg, 'legal.contactEmail');
    if (filled(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.querySelectorAll('[data-email]').forEach((a) => { a.href = 'mailto:' + email.trim(); a.textContent = email.trim(); });
    }
    // the ABN line only appears once an ABN is filled in: no placeholder
    const abn = get(cfg, 'legal.abn');
    document.querySelectorAll('[data-abn]').forEach((p) => {
      if (filled(abn)) { p.textContent = `${get(cfg, 'footer.abnLabel') || 'ABN'} ${abn.trim()}`; p.hidden = false; } else p.hidden = true;
    });
  }

  fetch('../site.config.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((cfg) => { if (cfg) apply(cfg); }).catch(() => { /* keep the HTML copy */ });
  const year = document.getElementById('year'); if (year) year.textContent = String(Math.max(2026, new Date().getFullYear()));
})();
