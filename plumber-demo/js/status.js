// "Open now" status, computed from the visitor's clock but read in Australia/Melbourne time.
import { $, $$, SITE } from './util.js';

const TZ = SITE.timezone || 'Australia/Melbourne';
const DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const fmtHour = (h) => `${(h % 12) || 12}${h < 12 ? 'am' : 'pm'}`;
const dayName = (d) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];

/** Melbourne wall-clock parts for a Date. */
function parts(date) {
  const f = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
  const o = {}; f.formatToParts(date).forEach((p) => { o[p.type] = p.value; });
  return { day: DAY[o.weekday], hour: Number(o.hour) % 24, minute: Number(o.minute) };
}

/** True when the visitor's own clock is on a different UTC offset from Melbourne right now. */
function zoneDiffers(date) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
  const o = {}; f.formatToParts(date).forEach((p) => { o[p.type] = Number(p.value); });
  const asUtc = Date.UTC(o.year, o.month - 1, o.day, o.hour % 24, o.minute, o.second);
  const melbOffset = Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  return melbOffset !== -date.getTimezoneOffset();
}

export function status(date = new Date()) {
  const { day, hour, minute } = parts(date);
  const t = hour + minute / 60;
  const today = SITE.hours.find((h) => h.day === day);
  const open = !!today && t >= today.open && t < today.close;
  let next = '';
  if (!open) {
    if (today && t < today.open) next = `opens ${fmtHour(today.open)} today`;
    else {
      const tomorrow = SITE.hours.find((h) => h.day === (day + 1) % 7);
      next = tomorrow ? `opens ${fmtHour(tomorrow.open)} tomorrow` : '';
    }
  }
  return { open, until: open ? fmtHour(today.close) : '', next, differs: zoneDiffers(date), day: dayName(day) };
}

function render() {
  const s = status();
  const note = s.differs ? ' (Melbourne time)' : '';
  const avail = $('#avail');
  if (avail) {
    avail.dataset.state = s.open ? 'open' : 'closed';
    $('[data-avail-text]', avail).textContent = (s.open ? `Plumbers available now, usually at your door within ${SITE.arriveMinutes} minutes` : 'Emergency line open 24/7') + (s.open ? note : '');
  }
  $$('[data-open-status]').forEach((el) => {
    el.dataset.state = s.open ? 'open' : 'closed';
    el.textContent = s.open
      ? `Office open now, until ${s.until}${note}`
      : `Office closed, ${s.next}${note}. Emergency line open 24/7`;
  });
}

render();
setInterval(render, 60000);
