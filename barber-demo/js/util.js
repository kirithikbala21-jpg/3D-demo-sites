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

/** Current day (0 = Sunday) and decimal hour in the café's own time zone, not the visitor's. */
export function cafeNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: site.timezone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, hour: Number(get('hour')) % 24 + Number(get('minute')) / 60 };
}
export const hoursFor = (day) => site.hours.find((h) => h.day === day);
export const fmtHour = (h) => `${(h % 12) || 12}:00${h < 12 ? 'am' : 'pm'}`;

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
