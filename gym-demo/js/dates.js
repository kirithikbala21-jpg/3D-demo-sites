// Tiny calendar helpers shared by the kit modules. A day is a "key" like "2026-10-19". No time zones in here: callers pass the business's own today.
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parts = (k) => k.split('-').map(Number);
const utc = (k) => { const [y, m, d] = parts(k); return new Date(Date.UTC(y, m - 1, d, 12)); };
export const dow = (k) => utc(k).getUTCDay();
export const addDays = (k, n) => { const t = utc(k); t.setUTCDate(t.getUTCDate() + n); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; };
export const dayLabel = (k) => { const [, m, d] = parts(k); return `${DAYS[dow(k)]} ${d} ${MONTHS[m - 1]}`; };
export const clock12 = (mins) => { const t = ((mins % 1440) + 1440) % 1440, h = Math.floor(t / 60), m = t % 60; return `${(h % 12) || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`; }; // always with minutes, like the rest of this site (7:00am)
