// Small helpers shared by the page modules.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** localStorage that never throws (private windows, blocked storage). */
export const store = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) { /* ignore */ } },
};

/** Site settings written into the page by tools/build.py (phone, hours, services, stylists, booking settings). */
export const SITE = (() => { try { return JSON.parse(document.getElementById('site-data').textContent); } catch (e) { return { hours: [], services: [], stylists: [], booking: {}, vouchers: [] }; } })();

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const fmtHour = (h) => `${(h % 12) || 12}${h < 12 ? 'am' : 'pm'}`;
export const fmtTime = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
export const hoursFor = (day) => SITE.hours.find((h) => h.day === day);
export const isOpenDay = (day) => { const h = hoursFor(day); return !!h && h.open !== null && h.open !== undefined; };
export const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };

/** Opening status from the VISITOR's own clock (local time), using the hours in the page data. */
export function statusAt(now = new Date()) {
  const h = hoursFor(now.getDay());
  const mins = now.getHours() * 60 + now.getMinutes();
  const openToday = isOpenDay(now.getDay());
  if (openToday) {
    if (mins >= h.open * 60 && mins < h.close * 60) return { state: 'open', text: `Open today until ${fmtHour(h.close)}` };
    if (mins < h.open * 60) return { state: 'soon', text: `Opens today at ${fmtHour(h.open)}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (now.getDay() + i) % 7;
    if (isOpenDay(d)) { const n = hoursFor(d); return { state: 'closed', text: `${openToday ? 'Closed now' : 'Closed today'}. Opens ${n.name} at ${fmtHour(n.open)}` }; }
  }
  return { state: 'closed', text: 'Closed' };
}

/** Scroll the page to an element, below the sticky header. Uses Lenis when it is running. */
export function scrollToEl(el) {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -(header + 12), duration: 0.9 });
  else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}
