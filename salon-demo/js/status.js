// "Open today until 7pm" lines and the hours-table highlight, both from the visitor's own clock.
import { $, $$, statusAt } from './util.js';

function tick() {
  const now = new Date();
  const s = statusAt(now);
  $$('[data-open-today]').forEach((el) => { el.dataset.state = s.state; const t = $('[data-open-text]', el); if (t) t.textContent = s.text; });
  $$('[data-open-status]').forEach((el) => { el.dataset.state = s.state; el.textContent = s.text; });
  $$('.hours tr').forEach((tr) => {
    const today = Number(tr.dataset.day) === now.getDay();
    tr.classList.toggle('today', today);
    const th = $('th', tr); const tag = $('.today-tag', tr);
    if (today) { th.setAttribute('aria-current', 'date'); if (!tag) { const s2 = document.createElement('span'); s2.className = 'today-tag'; s2.textContent = 'Today'; th.append(s2); } }
    else { th.removeAttribute('aria-current'); if (tag) tag.remove(); }
  });
}
tick();
setInterval(tick, 60000);
