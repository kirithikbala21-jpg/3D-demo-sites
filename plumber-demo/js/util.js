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

/** Site settings written into the page by tools/build.py (phone, hours, suburbs, services, form endpoint). */
export const SITE = (() => { try { return JSON.parse(document.getElementById('site-data').textContent); } catch (e) { return { hours: [], suburbs: [], services: [] }; } })();
