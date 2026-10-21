// Notice bar above the header: holiday and closure warnings in the week before (from the calendar and "closures" in
// site.config.json), plus any "notices" (specials, news) between their start and end dates. The emergency line stays open 24/7.
import { $, SITE, CLOCK_CFG, nowMel } from './util.js';
import { upcomingChanges, changeText, liveNotices } from './clock.js';

const bar = $('#notice-bar');
function render() {
  if (!bar) return;
  const now = nowMel();
  const lines = [...upcomingChanges(now, CLOCK_CFG, 7).slice(0, 2).map((c) => changeText(c).replace(/^(Closed|Open)/, (m) => 'Office ' + m.toLowerCase()).replace(/\.$/, '. Emergency line open 24/7.')), ...liveNotices(SITE.notices, now.key).map((n) => n.text)];
  bar.replaceChildren(...lines.map((t) => { const p = document.createElement('p'); p.textContent = t; return p; }));
  bar.hidden = !lines.length;
}
render();
setInterval(render, 60000);
