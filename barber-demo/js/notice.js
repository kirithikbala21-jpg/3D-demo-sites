// Notice bar under the announcement: holiday and closure warnings in the week before (worked out from the calendar and the
// closures list in site.config.json), plus any "notices" (specials, news) that are between their start and end dates.
import { $, site, CLOCK_CFG, nowShop } from './util.js';
import { upcomingChanges, changeText, liveNotices } from './clock.js';

const bar = $('#notice-bar');
function render() {
  if (!bar) return;
  const now = nowShop();
  const lines = [...upcomingChanges(now, CLOCK_CFG, 7).slice(0, 2).map(changeText), ...liveNotices(site.notices, now.key).map((n) => n.text)];
  bar.replaceChildren(...lines.map((t) => { const p = document.createElement('p'); p.textContent = t; return p; }));
  bar.hidden = !lines.length;
}
render();
setInterval(render, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
