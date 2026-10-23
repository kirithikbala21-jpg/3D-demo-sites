// "Best time to come": a TYPICAL weekly pattern from site.config.json (busyness). Never live data; the wording always says "usually"/"typically".
import { $, SITE, nowMel } from './util.js';
import { hasBusyness, bestTimeLine, busySvg, BUSY_LEGEND } from './busy.js';

const host = $('[data-busy]');
if (host && SITE.busyness && hasBusyness({ busyness: SITE.busyness })) {
  const cfg = { busyness: SITE.busyness };
  const dow = nowMel().dow;
  const line = bestTimeLine(cfg, dow);
  $('[data-busy-line]', host).textContent = line || 'Typically a steady pace through the week.';
  $('[data-busy-chart]', host).innerHTML = busySvg(cfg, dow, { width: 420 }) + BUSY_LEGEND;
  host.hidden = false;
}
