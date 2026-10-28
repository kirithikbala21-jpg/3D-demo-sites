// Legal pages: site.js fills names, email, state and the date from site.config.json; this adds the two legal-only
// pieces: the list of brands ("AceGuides and Shopfront") and the ABN line in the Contact section (shown only when
// company.abn is filled in). The HTML already holds the same text, so the pages still read correctly without JavaScript.
(() => {
  'use strict';
  const KB = window.KB;
  if (!KB) return;
  const list = (a) => { a = a.filter(KB.filled); return a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`; };
  KB.config.then((cfg) => {
    if (!cfg) return;
    document.querySelectorAll('[data-c]').forEach((node) => {
      const v = KB.get(cfg, node.dataset.c);
      if (Array.isArray(v) && v.some(KB.filled)) node.textContent = list(v);
    });
    const abn = KB.get(cfg, 'company.abn');
    document.querySelectorAll('[data-abn]').forEach((p) => {
      if (KB.filled(abn)) { p.textContent = `${KB.get(cfg, 'footer.abnLabel') || 'ABN'} ${abn.trim()}`; p.hidden = false; } else p.hidden = true;
    });
  });
})();
