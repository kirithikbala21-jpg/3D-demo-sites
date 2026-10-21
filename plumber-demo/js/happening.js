// "What's happening?" picker, plus the after-hours banner (based on the visitor's own clock).
import { $, $$, SITE, nowMel } from './util.js';

(() => {
  const panel = $('#happen-panel'); if (!panel) return;
  const btns = $$('[data-happen]');
  btns.forEach((b) => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') === 'true';
    btns.forEach((x) => x.setAttribute('aria-expanded', String(!open && x === b)));
    $$('.hp', panel).forEach((p) => { p.hidden = open || p.dataset.panel !== b.dataset.happen; });
    panel.hidden = open;
  }));
  const el = $('[data-happen-else]');
  if (el) el.addEventListener('click', () => { setTimeout(() => { const q = $('#quote'); if (q) q.focus({ preventScroll: true }); }, 50); });

  // Outside the day window (service.dayStart to dayEnd in site.config.json: 7am to 6pm) in MELBOURNE time, whatever the visitor's clock says:
  // show "On call tonight". Re-checked every minute so it appears at 6pm without a reload.
  const bar = $('#oncall');
  const tick = () => { if (!bar) return; const m = nowMel().mins; bar.hidden = m >= SITE.dayStart && m < SITE.dayEnd; };
  tick(); setInterval(tick, 60000);
})();
