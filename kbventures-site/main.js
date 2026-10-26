// Fills the businesses button and the demo cards from site.config.json. The page already contains the same content as plain HTML,
// so it still works when this file or the config cannot be loaded (for example when index.html is opened straight from disk).
(async () => {
  let cfg;
  try { const r = await fetch('site.config.json', { cache: 'no-cache' }); if (!r.ok) return; cfg = await r.json(); } catch (_) { return; }
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const grid = document.getElementById('demo-grid');
  if (grid && Array.isArray(cfg.demos) && cfg.demos.length) {
    grid.replaceChildren(...cfg.demos.map((d) => {
      const card = el('article', 'card'), a = el('a', 'btn alt', 'Open demo');
      a.href = d.url; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', `Open demo: ${d.name}`);
      card.append(el('span', 'tag', d.type), el('h3', '', d.name), el('p', '', d.line), a);
      return card;
    }));
  }
  const note = document.getElementById('demos-note'); if (note && cfg.demosNote) note.textContent = cfg.demosNote;
  const shop = document.getElementById('ace-actions');
  if (shop) {
    shop.replaceChildren();
    if (cfg.aceguidesShopUrl && /^https?:\/\//.test(cfg.aceguidesShopUrl)) { const a = el('a', 'btn', 'Visit the AceGuides shop'); a.href = cfg.aceguidesShopUrl; shop.append(a); }
  }
  const mail = document.getElementById('mail');
  if (mail && cfg.email) { mail.href = 'mailto:' + cfg.email; mail.textContent = cfg.email; }
})();
