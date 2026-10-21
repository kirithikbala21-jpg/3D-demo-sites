// "Office open now" lines, the hours-table highlight, the footer year and "years of experience". Everything is read in
// Melbourne time (daylight saving included), so a visitor in another time zone still sees the right answer.
import { $, $$, SITE, nowMel, statusNow } from './util.js';

const note = () => {
  // say "(Melbourne time)" only when the visitor's own clock is on a different UTC offset right now
  try {
    const mel = nowMel(), d = new Date();
    const local = d.getHours() * 60 + d.getMinutes();
    return local !== mel.mins ? ' (Melbourne time)' : '';
  } catch (e) { return ''; }
};

function render() {
  const now = nowMel(), s = statusNow(), tz = note();
  const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const avail = $('#avail');
  if (avail) {
    avail.dataset.state = s.state === 'open' ? 'open' : 'closed';
    $('[data-avail-text]', avail).textContent = s.state === 'open' ? `Plumbers available now, usually at your door within ${SITE.arriveMinutes} minutes${tz}` : 'Emergency line open 24/7';
  }
  $$('[data-open-status]').forEach((el) => {
    el.dataset.state = s.state === 'open' ? 'open' : 'closed';
    el.textContent = s.state === 'open' ? `Office ${lower(s.text).replace('open now, closes at', 'open now, until')}${tz}` : `Office ${lower(s.text)}${tz}. Emergency line open 24/7`;
  });
  $$('[data-year]').forEach((el) => { el.textContent = String(now.y); });
  $$('[data-since]').forEach((el) => { el.textContent = String(now.y - Number(el.dataset.since)); });
  $$('.hours tr').forEach((tr) => {
    const today = Number(tr.dataset.day) === now.dow;
    tr.classList.toggle('today', today);
  });
}
render();
setInterval(render, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
