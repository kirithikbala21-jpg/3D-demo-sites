// "Open now, closes at 7pm" lines, the hours-table highlight and the footer year. All from the business's own clock
// (Melbourne time, daylight saving included), so a visitor abroad still sees the right answer.
import { $, $$, nowMel, statusNow } from './util.js';

function tick() {
  const now = nowMel();
  const s = statusNow();
  $$('[data-open-today]').forEach((el) => { el.dataset.state = s.state; const t = $('[data-open-text]', el); if (t) t.textContent = s.text; });
  $$('[data-open-status]').forEach((el) => { el.dataset.state = s.state; el.textContent = s.text; });
  $$('[data-year]').forEach((el) => { el.textContent = String(now.y); });
  $$('.hours tr').forEach((tr) => {
    const today = Number(tr.dataset.day) === now.dow;
    tr.classList.toggle('today', today);
    const th = $('th', tr); const tag = $('.today-tag', tr);
    if (today) { th.setAttribute('aria-current', 'date'); if (!tag) { const s2 = document.createElement('span'); s2.className = 'today-tag'; s2.textContent = 'Today'; th.append(s2); } }
    else { th.removeAttribute('aria-current'); if (tag) tag.remove(); }
  });
}
tick();
setInterval(tick, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); }); // phone woke up: refresh straight away
