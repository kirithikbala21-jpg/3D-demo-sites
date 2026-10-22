// Opening hours in the café's own time zone (site.config.json > timezone), not the visitor's. Pure functions.
import { addDays, DAYS } from './dates.js';
const cache = {};
export function nowIn(tz, at = new Date()) {
  try {
    const f = cache[tz] || (cache[tz] = new Intl.DateTimeFormat('en-AU', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }));
    const p = {}; f.formatToParts(at).forEach((x) => { p[x.type] = x.value; });
    const key = `${p.year}-${p.month}-${p.day}`;
    return { key, mins: (+p.hour % 24) * 60 + +p.minute, dow: new Date(Date.UTC(+p.year, +p.month - 1, +p.day, 12)).getUTCDay(), y: +p.year };
  } catch (e) { const d = at, pad = (n) => String(n).padStart(2, '0'); return { key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, mins: d.getHours() * 60 + d.getMinutes(), dow: d.getDay(), y: d.getFullYear() }; }
}
const dowOf = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); };
/** { closed, open, close, name } for a day key: a dated closure wins, then the weekly hours. */
export function resolveDay(key, cfg) {
  const c = (cfg.closures || []).find((x) => x.date === key && x.status !== 'open');
  if (c) return { closed: true, name: c.name || '' };
  const h = (cfg.hours || []).find((x) => x.day === dowOf(key));
  return h && h.open !== null ? { closed: false, open: h.open, close: h.close } : { closed: true };
}
export const fmtClock = (mins) => { const t = ((mins % 1440) + 1440) % 1440, h = Math.floor(t / 60), m = t % 60; return `${(h % 12) || 12}${m ? ':' + String(m).padStart(2, '0') : ':00'}${h < 12 ? 'am' : 'pm'}`; };
/** "Open now · until 10:00pm" / "Closed · opens 7:00am tomorrow" / "Closed · opens 8:00am on Sunday". */
export function statusAt(now, cfg) {
  const today = resolveDay(now.key, cfg), yest = resolveDay(addDays(now.key, -1), cfg);
  if (!yest.closed && yest.close > 1440 && now.mins < yest.close - 1440) return { open: true, text: `Open now · until ${fmtClock(yest.close)}` };
  if (!today.closed) {
    if (now.mins >= today.open && now.mins < today.close) return { open: true, text: `Open now · until ${fmtClock(today.close)}` };
    if (now.mins < today.open) return { open: false, text: `Closed · opens ${fmtClock(today.open)} today` };
  }
  for (let i = 1; i <= 14; i++) {
    const key = addDays(now.key, i), r = resolveDay(key, cfg);
    if (!r.closed) return { open: false, text: `Closed · opens ${fmtClock(r.open)} ${i === 1 ? 'tomorrow' : 'on ' + DAYS[dowOf(key)]}` };
  }
  return { open: false, text: 'Closed' };
}
/** Start times (minutes) on a day, every `step` minutes inside opening hours; `after` = earliest allowed (minutes, same day) and `latestBeforeClose` keeps pick-ups away from closing. */
export function slotsFor(key, cfg, step, after = -1, latestBeforeClose = 0) {
  const r = resolveDay(key, cfg); if (r.closed) return [];
  const out = []; let m = Math.ceil(Math.max(r.open, after) / step) * step;
  for (; m <= r.close - latestBeforeClose; m += step) out.push(m);
  return out;
}
export { dowOf };
