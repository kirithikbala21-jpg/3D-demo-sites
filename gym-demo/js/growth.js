// Typical busy times ("Best time to come"). The pattern is set by the owner in site.config.json > busyness and is NEVER live data:
// every line says "usually" or "typically". Hidden entirely when the table is empty or busynessEnabled is false.
import { $$, site, gymNow } from './util.js';
import { bestTimeLine, busySvg, hasBusyness, BUSY_LEGEND } from './busy.js';

const hosts = $$('[data-busy]');
function render() {
  if (!hosts.length) return;
  const cfg = { busyness: site.busyness };
  if (!hasBusyness(cfg)) { hosts.forEach((h) => { h.hidden = true; }); return; }
  const today = gymNow().day, line = bestTimeLine(cfg, today);
  hosts.forEach((h) => {
    h.innerHTML = `<h3 class="busy-title">Best time to come</h3>${line ? `<p class="busy-line">${line}</p>` : ''}${busySvg(cfg, today)}${BUSY_LEGEND}`;
    h.hidden = false;
  });
}
render();
setInterval(render, 5 * 60000);
