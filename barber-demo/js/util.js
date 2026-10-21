// Shared helpers used by every module.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Site facts (hours, phone, timezone ...) generated from site.config.json and embedded in every page. */
export const site = (() => {
  try { return JSON.parse($('#site-data').textContent); } catch (_) { return { hours: [], timezone: 'Australia/Sydney', locale: 'en-AU', currency: 'AUD', phone: '', phoneHref: '' }; }
})();

export const money = (n) => new Intl.NumberFormat(site.locale, { style: 'currency', currency: site.currency }).format(n);

export function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  } catch (_) { /* storage can be blocked: carry on without it */ }
  return null;
}

import * as clock from './clock.js';
export const { addDays, dayLabel, pad } = clock;
/** Opening hours (minutes since midnight), public holidays and closures: everything clock.js needs, from the page data. */
export const CLOCK_CFG = { region: site.region || 'NSW', hours: site.hours || [], closures: site.closures || [], holidays: site.holidays || { mode: 'closed' } };
/** The current date and time in the SHOP's time zone (not the visitor's): { y, m, d, dow, mins, key }. */
export const nowShop = (at = new Date()) => clock.nowIn(site.timezone, at);
export const resolveDay = (key) => clock.resolveDay(key, CLOCK_CFG);
export const statusNow = () => clock.statusAt(nowShop(), CLOCK_CFG);
export const hoursFor = (day) => site.hours.find((h) => h.day === day && h.open != null);
/** Minutes since midnight to "9:00am" (values past 24h wrap round). */
export const fmtHour = (mins) => { const t = ((mins % 1440) + 1440) % 1440, h = Math.floor(t / 60), m = t % 60; return `${(h % 12) || 12}:${pad(m)}${h < 12 ? 'am' : 'pm'}`; };

const toastEl = $('#toast');
let toastTimer = 0;
export function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4500);
}

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal helper: toggles `hidden`, locks body scroll, traps Tab, closes on Escape,
 * and returns focus to whatever opened it.
 */
export function modal(el, { bodyClass, onOpen, onClose, initialFocus } = {}) {
  let opener = null;
  const visible = () => $$(FOCUSABLE, el).filter((n) => n.offsetParent !== null);
  function open(from) {
    opener = from || document.activeElement;
    el.hidden = false;
    if (bodyClass) document.body.classList.add(bodyClass);
    if (onOpen) onOpen();
    const target = (typeof initialFocus === 'function' ? initialFocus() : initialFocus && $(initialFocus, el)) || visible()[0];
    if (target) target.focus();
  }
  function close() {
    if (el.hidden) return;
    el.hidden = true;
    if (bodyClass) document.body.classList.remove(bodyClass);
    if (onClose) onClose();
    if (opener && opener.focus) opener.focus();
  }
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = visible();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  return { open, close, isOpen: () => !el.hidden };
}
