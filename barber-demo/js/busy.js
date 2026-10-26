// "Best time to come": a typical weekly pattern set by the owner in site.config.json. NEVER live or real-time data; wording always says
// "usually" or "typically". Hidden entirely when the table is empty or `busynessEnabled` is false.
//
// Config shape:
//  "busyness": { "blocks": [ {"label":"Morning","from":"09:00","to":"12:00"}, {"label":"Lunch","from":"12:00","to":"14:00"}, {"label":"Afternoon","from":"14:00","to":"17:00"}, {"label":"Evening","from":"17:00","to":"21:00"} ],
//               "week": { "mon": ["quiet","quiet","medium","busy"], "tue": [...], ... "sun": [...] } }   (one level per block; quiet | medium | busy; "closed" or null for a closed block)
import { DAYS, clock12 } from './dates.js';
const KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], ORDER = [1, 2, 3, 4, 5, 6, 0];
const LEVEL = { quiet: 1, medium: 2, busy: 3 };
export const hasBusyness = (cfg) => !!(cfg && cfg.busyness && cfg.busyness.blocks && cfg.busyness.blocks.length && cfg.busyness.week && Object.values(cfg.busyness.week).some((a) => a && a.some((l) => LEVEL[l])));
const hm = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? clock12(+m[1] * 60 + +m[2]) : ''; };
/** "at 9am to 12pm on Tuesdays" (falls back to the block name, e.g. "on Tuesday mornings", when no times are set) */
const when = (day, block) => (hm(block.from) && hm(block.to) ? `at ${hm(block.from)} to ${hm(block.to)} on ${day}s` : `on ${day} ${block.label.toLowerCase()}s`);
/** One sentence such as "Usually quieter at 9am to 12pm on Tuesdays." for the quietest typical slot in the next 7 days (or today's pattern). */
export function bestTimeLine(cfg, todayDow) {
  if (!hasBusyness(cfg)) return '';
  const { blocks, week } = cfg.busyness; let best = null;
  for (let i = 0; i < 7; i++) { const d = (todayDow + i) % 7, row = week[KEYS[d]] || []; row.forEach((l, b) => { if (LEVEL[l] === 1 && !best) best = { d, b }; }); }
  if (!best) { for (let i = 0; i < 7 && !best; i++) { const d = (todayDow + i) % 7, row = week[KEYS[d]] || []; row.forEach((l, b) => { if (LEVEL[l] === 2 && !best) best = { d, b }; }); } if (!best) return ''; return `Typically a steady pace ${when(DAYS[best.d], blocks[best.b])}.`; }
  return `Usually quieter ${when(DAYS[best.d], blocks[best.b])}.`;
}
/** SVG strip: 7 columns (Mon to Sun) by one row per block; darker = busier. Today's column is outlined and labelled. Accessible via <title>/<desc>. */
export function busySvg(cfg, todayDow, { width = 360 } = {}) {
  if (!hasBusyness(cfg)) return '';
  const { blocks, week } = cfg.busyness, rows = blocks.length, lw = 74, cw = (width - lw) / 7, rh = 26, top = 24, h = top + rows * rh + 6;
  const shade = { 1: 0.22, 2: 0.55, 3: 0.95 };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${h}" width="100%" role="img" aria-labelledby="busy-t busy-d" class="busy-svg"><title id="busy-t">Typical busy times</title><desc id="busy-d">${ORDER.map((d) => { const row = week[KEYS[d]] || []; return DAYS[d] + ': ' + blocks.map((b, i) => `${b.label} ${LEVEL[row[i]] ? row[i] : 'closed'}`).join(', '); }).join('. ')}. Typical pattern only, not live.</desc>`;
  ORDER.forEach((d, i) => { const x = lw + i * cw; s += `<text x="${x + cw / 2}" y="15" text-anchor="middle" font-size="12" fill="currentColor" font-weight="${d === todayDow ? 700 : 500}">${DAYS[d].slice(0, 3)}</text>`; });
  blocks.forEach((b, r) => { s += `<text x="${lw - 8}" y="${top + r * rh + rh / 2 + 4}" text-anchor="end" font-size="12" fill="currentColor">${b.label}</text>`; ORDER.forEach((d, i) => { const l = (week[KEYS[d]] || [])[r], x = lw + i * cw + 2, y = top + r * rh + 2; s += LEVEL[l] ? `<rect x="${x}" y="${y}" width="${cw - 4}" height="${rh - 4}" rx="4" fill="currentColor" fill-opacity="${shade[LEVEL[l]]}"/>` : `<rect x="${x}" y="${y}" width="${cw - 4}" height="${rh - 4}" rx="4" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="3 3"/>`; }); });
  const ti = ORDER.indexOf(todayDow); s += `<rect x="${lw + ti * cw}" y="${top - 2}" width="${cw}" height="${rows * rh + 4}" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>`;
  return s + '</svg>';
}
export const BUSY_LEGEND = '<p class="busy-legend"><span class="busy-key k1"></span> Usually quiet <span class="busy-key k2"></span> Typically medium <span class="busy-key k3"></span> Usually busy. A typical pattern, not live.</p>';
