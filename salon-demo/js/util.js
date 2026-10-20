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

import * as clock from './clock.js';
export const { DAY_NAMES, MONTHS, fmtTime, fmtClock, pad, dayLabel, addDays } = clock;
/** Opening hours, public holidays, closures: what clock.js needs, from the page data. */
export const CLOCK_CFG = { hours: SITE.hours || [], closures: SITE.closures || [], holidays: SITE.holidays || { mode: 'closed' } };
export const TZ = SITE.timezone || 'Australia/Melbourne';
/** The current date and time in the BUSINESS's time zone (Melbourne), not the visitor's. */
export const nowMel = () => clock.nowIn(TZ);
export const resolveDay = (key) => clock.resolveDay(key, CLOCK_CFG);
export const statusNow = () => clock.statusAt(nowMel(), CLOCK_CFG);

/** Scroll the page to an element, below the sticky header. Uses Lenis when it is running. */
export function scrollToEl(el) {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
  if (window.__lenis) {
    window.__lenis.scrollTo(el, { offset: -(header + 12), duration: 0.9 });
    // lazy photos above the target can change the page height mid-scroll, so check the landing spot and correct it once
    setTimeout(() => { if (Math.abs(el.getBoundingClientRect().top - (header + 12)) > 40) window.__lenis.scrollTo(el, { offset: -(header + 12), duration: 0.5 }); }, 1200);
  } else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}
