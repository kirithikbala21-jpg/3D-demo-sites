// "What's happening?" picker, plus the after-hours banner (based on the visitor's own clock).
import { $, $$ } from './util.js';

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

  // Outside 7am to 6pm on the visitor's own clock: show "On call tonight".
  const h = new Date().getHours(), bar = $('#oncall');
  if (bar && (h < 7 || h >= 18)) bar.hidden = false;
})();
