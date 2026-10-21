// Time and calendar logic. Pure functions (no DOM), so it also runs under Node for the unit tests (tests/unit.mjs).
// Everything is worked out in the business's own time zone (Australia/Melbourne, set in site.config.json), never in
// the visitor's, and never with a fixed UTC offset: Intl applies daylight saving for the date in question.
// A day is a "key" string like "2026-10-19". Day arithmetic uses UTC noon so it can never slip by an hour.

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

const fmtCache = {};
/** The wall-clock date and time in a time zone: { y, m (1-12), d, dow (0 = Sunday), mins (minutes since midnight), key }. */
export function nowIn(tz, at = new Date()) {
  try {
    const f = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat('en-AU', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }));
    const p = {}; f.formatToParts(at).forEach((x) => { p[x.type] = x.value; });
    const y = +p.year, m = +p.month, d = +p.day;
    return { y, m, d, dow: dowOf(ymd(y, m, d)), mins: (+p.hour % 24) * 60 + +p.minute, key: ymd(y, m, d) };
  } catch (e) { // no Intl time zone support: fall back to the device clock rather than failing
    const y = at.getFullYear(), m = at.getMonth() + 1, d = at.getDate();
    return { y, m, d, dow: at.getDay(), mins: at.getHours() * 60 + at.getMinutes(), key: ymd(y, m, d) };
  }
}
const parse = (key) => { const [y, m, d] = key.split('-').map(Number); return { y, m, d }; };
const utc = (key) => { const { y, m, d } = parse(key); return new Date(Date.UTC(y, m - 1, d, 12)); };
export const dowOf = (key) => utc(key).getUTCDay();
export const addDays = (key, n) => { const t = utc(key); t.setUTCDate(t.getUTCDate() + n); return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); };
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);
export const dayLabel = (key) => { const { y, m, d } = parse(key); return `${DAY_NAMES[dowOf(key)]} ${d} ${MONTHS[m - 1]}`; };

/** "9am", "9:30am", "7pm", "midnight" from minutes since midnight (values past 24h wrap round). */
export function fmtClock(mins) {
  const t = ((mins % 1440) + 1440) % 1440, h = Math.floor(t / 60), m = t % 60;
  if (mins === 1440 || (t === 0 && mins > 0)) return 'midnight';
  return `${(h % 12) || 12}${m ? ':' + pad(m) : ''}${h < 12 ? 'am' : 'pm'}`;
}
/** "9:30 am" style used on the booking time buttons. */
export function fmtTime(mins) { const t = ((mins % 1440) + 1440) % 1440, h = Math.floor(t / 60), m = t % 60; return `${(h % 12) || 12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`; }

/* ------------------------------------------------------------------ public holidays (Victoria) */
/** Easter Sunday (Gregorian "anonymous" algorithm), as a day key. Works for any year. */
export function easterSunday(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return ymd(y, month, day);
}
/** The nth (1-based) given weekday of a month, as a day key. */
export function nthWeekday(y, month, dow, n) {
  const first = dowOf(ymd(y, month, 1));
  return ymd(y, month, 1 + ((dow - first + 7) % 7) + (n - 1) * 7);
}
/** A fixed date that moves to the next Monday when it falls on a weekend (New Year's Day, Australia Day). */
const mondayised = (key) => { const w = dowOf(key); return w === 6 ? addDays(key, 2) : w === 0 ? addDays(key, 1) : key; };

/** Victorian public holidays for a year, worked out in code (so it never needs updating). The Friday before the AFL Grand Final
 *  is announced each year and cannot be calculated: add it to "closures" in site.config.json if you want it. */
export function vicHolidays(y) {
  const easter = easterSunday(y), out = [];
  const add = (date, name) => out.push({ date, name });
  add(mondayised(ymd(y, 1, 1)), "New Year's Day");
  add(mondayised(ymd(y, 1, 26)), 'Australia Day');
  add(nthWeekday(y, 3, 1, 2), 'Labour Day');
  add(addDays(easter, -2), 'Good Friday');
  add(addDays(easter, -1), 'Easter Saturday');
  add(easter, 'Easter Sunday');
  add(addDays(easter, 1), 'Easter Monday');
  add(ymd(y, 4, 25), 'Anzac Day');
  add(nthWeekday(y, 6, 1, 2), "King's Birthday");
  add(nthWeekday(y, 11, 2, 1), 'Melbourne Cup Day'); // first Tuesday of November (Melbourne metropolitan area)
  const xmas = dowOf(ymd(y, 12, 25)), box = dowOf(ymd(y, 12, 26));
  add(xmas === 6 || xmas === 0 ? ymd(y, 12, 27) : ymd(y, 12, 25), 'Christmas Day'); // Sat or Sun: the Monday or Tuesday 27th
  add(box === 6 || box === 0 ? ymd(y, 12, 28) : ymd(y, 12, 26), 'Boxing Day'); // Sat or Sun: Monday or Tuesday the 28th
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}
const holCache = {};
const holidayOn = (key) => { const y = parse(key).y; const list = holCache[y] || (holCache[y] = vicHolidays(y)); return list.find((h) => h.date === key) || null; };

/* ------------------------------------------------------------------ opening hours */
/** What the business does on a day: { closed, open, close (minutes; close may pass 1440 for late nights), name, why }.
 *  Order of precedence: a dated entry in cfg.closures, then a public holiday (cfg.holidays), then the weekly hours (cfg.hours).
 *  cfg = { hours: [{ day, open, close }], closures: [{ date, name, status, open, close }], holidays: { mode, overrides } } with times in minutes. */
export function resolveDay(key, cfg) {
  const week = (cfg.hours || []).find((h) => h.day === dowOf(key));
  const normal = week && week.open != null ? { closed: false, open: week.open, close: week.close } : { closed: true, open: null, close: null };
  const fromRule = (r, name, why) => {
    if (r.status === 'closed' || r.closed) return { closed: true, open: null, close: null, name, why };
    if (r.open != null && r.close != null) return { closed: false, open: r.open, close: r.close, name, why, special: true };
    return { ...normal, name, why };
  };
  const c = (cfg.closures || []).find((x) => x.date === key);
  if (c) return fromRule(c, c.name, 'closure');
  const h = holidayOn(key);
  if (h && cfg.holidays !== false) {
    const hc = cfg.holidays || {}, o = (hc.overrides || {})[h.name];
    if (o) return fromRule(o, h.name, 'holiday');
    if ((hc.mode || 'closed') === 'closed') return { closed: true, open: null, close: null, name: h.name, why: 'holiday' };
    return { ...normal, name: h.name, why: 'holiday' };
  }
  return { ...normal, name: null, why: null };
}

/** Opening status at a moment: { state: 'open' | 'soon' | 'closed', text }. `now` is { key, mins } in the business's time zone. */
export function statusAt(now, cfg) {
  const today = resolveDay(now.key, cfg), yest = resolveDay(addDays(now.key, -1), cfg);
  // a late night that started yesterday and runs past midnight
  if (!yest.closed && yest.close > 1440 && now.mins < yest.close - 1440) return { state: 'open', text: `Open now, closes at ${fmtClock(yest.close)}`, closesAt: yest.close - 1440 };
  if (!today.closed) {
    if (now.mins >= today.open && now.mins < today.close) return { state: 'open', text: `Open now, closes at ${fmtClock(today.close)}`, closesAt: today.close };
    if (now.mins < today.open) return { state: 'soon', text: `Opens today at ${fmtClock(today.open)}` };
  }
  for (let i = 1; i <= 21; i++) {
    const key = addDays(now.key, i), r = resolveDay(key, cfg);
    if (!r.closed) {
      const when = i === 1 ? 'tomorrow' : DAY_NAMES[dowOf(key)];
      const lead = today.closed ? (today.name ? `Closed today for ${today.name}` : 'Closed today') : 'Closed now';
      return { state: 'closed', text: `${lead}. Opens ${when} at ${fmtClock(r.open)}` };
    }
  }
  return { state: 'closed', text: 'Closed' };
}

/** Can anything still be booked on this day? (false for a closed day, or once today's last start time has passed) */
export function hasFutureSlot(key, now, cfg, minutesNeeded, slot) {
  const r = resolveDay(key, cfg); if (r.closed) return false;
  for (let m = r.open; m + minutesNeeded <= r.close; m += slot) if (!(key === now.key && m <= now.mins)) return true;
  return false;
}

/* ------------------------------------------------------------------ notices (holiday banner and expiring specials) */
/** Holidays and closures in the next `ahead` days that change the hours (skips ones that fall on a day already closed). */
export function upcomingChanges(now, cfg, ahead = 7) {
  const out = [];
  for (let i = 0; i <= ahead; i++) {
    const key = addDays(now.key, i), r = resolveDay(key, cfg);
    if (!r.why) continue;
    const week = (cfg.hours || []).find((h) => h.day === dowOf(key)), normallyOpen = week && week.open != null;
    if (r.closed && !normallyOpen) continue; // already closed that day, nothing to announce
    if (!r.closed && !r.special) continue;    // holiday with normal hours
    if (i === 0 && r.closed === false && r.open != null && now.mins >= r.close) continue;
    out.push({ key, i, ...r });
  }
  return out;
}
export function changeText(c) {
  const when = c.i === 0 ? 'today' : c.i === 1 ? 'tomorrow' : DAY_NAMES[dowOf(c.key)];
  const why = c.name ? ` for ${c.name}` : '';
  return c.closed ? `Closed ${when}${why}.` : `Open ${when}${why}, ${fmtClock(c.open)} to ${fmtClock(c.close)}.`;
}
/** Specials/news that are live today: start <= today <= end (inclusive). An entry with no end date never shows. */
export function liveNotices(list, todayKey) {
  return (list || []).filter((n) => n && n.text && n.end && (!n.start || n.start <= todayKey) && n.end >= todayKey);
}
