// Growth features for the Ember & Oak demo, all driven by site.config.json and the café's own time zone (Australia/Melbourne).
// Everything here is front end only and clearly a demo: nothing is sent anywhere and nothing shown is live data.
// A feature whose config value is empty (or switched off) is hidden completely: no empty box, no broken link.
import { nowIn, resolveDay, statusAt, fmtClock, slotsFor, dowOf } from './clock.js';
import { dayLabel, addDays, DAYS } from './dates.js';
import { mountReminder } from './reminder.js';
import { waitlistForm } from './waitlist.js';
import { socialItems, socialButtons } from './social.js';
import { ratingBadge } from './rating.js';
import { hasBusyness, bestTimeLine, busySvg, BUSY_LEGEND } from './busy.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const digits = (phone) => String(phone).replace(/\D/g, '');
/** tel: link in international format: 03 5550 0123 -> tel:+61355500123 */
export const telHref = (phone) => { const d = digits(phone); return 'tel:' + (d.startsWith('0') ? '+61' + d.slice(1) : '+' + d); };
/** Australian phone number: mobile (04), landline (02/03/07/08) or +61 forms. Returns the cleaned 10 digits or null. */
export function auPhone(v) {
  let d = String(v).replace(/[\s\-().]/g, '');
  if (/^\+61/.test(d)) d = '0' + d.slice(3); else if (/^61\d{9}$/.test(d)) d = '0' + d.slice(2);
  return /^04\d{8}$/.test(d) || /^0[2378]\d{8}$/.test(d) ? d : null;
}
export const nameOk = (v) => /^[\p{L}][\p{L} '’.-]{1,59}$/u.test(v.trim());
export const prettyPhone = (d) => (d.startsWith('04') ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`);

/** Demo "full" times: a deterministic pattern (never random per visit) plus Friday and Saturday lunch, so the waitlist can be seen working. */
export function isFullSlot(key, mins) {
  const dow = dowOf(key);
  if ((dow === 5 || dow === 6) && mins >= 12 * 60 && mins <= 13 * 60 + 30) return true;
  return hash(`${key}|${mins}`) % 100 < 22;
}

export function initGrowth(cfg, { toast } = {}) {
  const tz = cfg.timezone || 'Australia/Melbourne';

  /* ---- 0. business details from the config (the HTML keeps the same text as a no-JavaScript fallback) ---- */
  const parts = (cfg.locality || '').split(' ');
  const suburb = parts.length > 2 ? parts.slice(0, -2).join(' ') : cfg.locality;
  const vals = { phone: cfg.phone, email: cfg.email, street: cfg.street, locality: cfg.locality, suburb, name: cfg.name };
  $$('[data-cfg]').forEach((el) => { const v = vals[el.dataset.cfg]; if (v) el.textContent = v; });
  $$('[data-cfg-href="maps"]').forEach((el) => { if (cfg.googleMapsUrl) { el.href = cfg.googleMapsUrl; el.hidden = false; } else el.hidden = true; });
  $$('[data-cfg-href]').forEach((el) => { if (el.dataset.cfgHref === 'tel' && cfg.phone) el.href = telHref(cfg.phone); if (el.dataset.cfgHref === 'mailto' && cfg.email) el.href = 'mailto:' + cfg.email; });

  /* ---- 8. opening-hours table, "Open now / Closed, opens ..." chips, today highlight (all from config, in the café's time zone) ---- */
  const tbody = $('.hours tbody');
  if (tbody && cfg.hours.length) {
    const order = [1, 2, 3, 4, 5, 6, 0];
    tbody.innerHTML = order.map((d) => { const h = cfg.hours.find((x) => x.day === d); if (!h) return ''; return `<tr data-day="${d}"><th scope="row">${h.name}</th><td>${h.open === null ? 'Closed' : `${fmtClock(h.open)} &ndash; ${fmtClock(h.close)}`}</td></tr>`; }).join('');
  }
  const tick = () => {
    const now = nowIn(tz), st = statusAt(now, cfg);
    ['#open-status', '#open-status-2'].forEach((sel) => { const el = $(sel); if (!el) return; el.textContent = st.text; const chip = el.closest('.chip'); if (chip) chip.classList.toggle('is-closed', !st.open); });
    $$('.hours tr').forEach((tr) => {
      const today = Number(tr.dataset.day) === now.dow, th = $('th', tr), badge = $('.today-badge', th);
      tr.classList.toggle('is-today', today);
      if (today && !badge) th.insertAdjacentHTML('beforeend', ' <span class="today-badge">Today</span>'); else if (!today && badge) badge.remove();
    });
  };
  tick(); setInterval(tick, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

  /* ---- 1. Google review button (home section + footer) ---- */
  const reviewUrl = cfg.googleReviewUrl;
  const sec = $('#review-us'); if (sec) sec.hidden = !reviewUrl;
  const rb = $('#review-us-btn'); if (rb && reviewUrl) rb.href = reviewUrl;
  const fr = $('#footer-review'); if (fr) { fr.hidden = !reviewUrl; if (reviewUrl) { fr.href = reviewUrl; fr.target = '_blank'; fr.rel = 'noopener'; } }

  /* ---- 3. icon links (footer) and buttons (contact / visit section) ---- */
  const si = $('#footer-social'); if (si) { const html = socialItems(cfg); si.innerHTML = html; si.hidden = !html; }
  const vl = $('#visit-links'); if (vl) { const html = socialButtons(cfg, 'btn btn-secondary btn-on-light'); vl.innerHTML = html; vl.hidden = !html; }

  /* ---- 5. Google rating badge (hero and footer). Real numbers only: the demo shows a "Demo number" note. ---- */
  [['#hero-rating'], ['#footer-rating']].forEach(([sel]) => { const el = $(sel); if (!el) return; const html = ratingBadge(cfg); el.innerHTML = html; el.hidden = !html; });

  /* ---- 7. best time to come: typical pattern from the config (never live) ---- */
  const on = cfg.busynessEnabled !== false && hasBusyness(cfg);
  const line = on ? bestTimeLine(cfg, nowIn(tz).dow) : '';
  const bl = $('#busy-line'); if (bl) { bl.textContent = line; bl.hidden = !line; }
  const bv = $('#busy-visit');
  if (bv) {
    if (on) { bv.innerHTML = `<h3>Best time to come</h3>${line ? `<p class="busy-line">${line}</p>` : ''}${busySvg(cfg, nowIn(tz).dow)}${BUSY_LEGEND}`; bv.hidden = false; } else bv.hidden = true;
  }
}

/** Reservation form extras: time slots (with demo-full times and the waitlist), the "Remind me" control. */
export function initReserve(cfg) {
  const tz = cfg.timezone || 'Australia/Melbourne';
  const form = $('#reserve-form'), dateEl = $('#f-date'), timeEl = $('#f-time'), host = $('#wl-host'), typeEl = $('#f-type');
  const submit = $('button[type=submit]', form);
  const reminder = mountReminder(submit, cfg, 'rm');
  let wl = null;
  const clearWl = () => { if (wl) { wl.remove(); wl = null; } if (host) host.innerHTML = ''; };

  function buildTimes() {
    clearWl();
    const key = dateEl.value, prev = timeEl.value;
    if (!key) { timeEl.innerHTML = '<option value="">Choose a date first</option>'; return; }
    const now = nowIn(tz), r = resolveDay(key, cfg);
    if (r.closed) { timeEl.innerHTML = `<option value="">Closed that day${r.name ? ' (' + r.name + ')' : ''}</option>`; return; }
    const mins = slotsFor(key, cfg, 30, key === now.key ? now.mins + 1 : -1, 60);
    if (!mins.length) { timeEl.innerHTML = '<option value="">No times left that day</option>'; return; }
    timeEl.innerHTML = '<option value="">Choose a time</option>' + mins.map((m) => `<option value="${m}">${fmtClock(m)}${cfg.waitlistEnabled !== false && isFullSlot(key, m) ? ' · full, join the waitlist' : isFullSlot(key, m) ? ' · full' : ''}</option>`).join('');
    if (prev && mins.includes(Number(prev))) timeEl.value = prev;
  }
  function onTime() {
    clearWl();
    const key = dateEl.value, m = Number(timeEl.value);
    if (!key || !timeEl.value || !isFullSlot(key, m) || cfg.waitlistEnabled === false) return;
    const note = document.createElement('p'); note.className = 'wl-note'; note.innerHTML = `<strong>${fmtClock(m)} on ${dayLabel(key)} is full.</strong> Join the waitlist and we will only contact you if a spot opens, or pick another time.`;
    wl = document.createElement('div'); wl.className = 'wl-wrap'; wl.append(note, waitlistForm({ dayKey: key, mins: m, what: 'Table', kind: 'waitlist' }));
    host.append(wl);
  }
  dateEl.addEventListener('change', buildTimes); dateEl.addEventListener('input', buildTimes);
  timeEl.addEventListener('change', onTime);
  buildTimes();
  return {
    reminder,
    /** Error text for the time field ('' when fine). Tables need a time; a full time needs the waitlist instead. */
    timeError() {
      const key = dateEl.value, v = timeEl.value;
      if (typeEl.value !== 'table') return '';
      if (!key) return '';
      if (!v) return resolveDay(key, cfg).closed ? 'We are closed that day. Please pick another date.' : 'Please pick a time for your table.';
      const now = nowIn(tz);
      if (key === now.key && Number(v) <= now.mins) { buildTimes(); return 'That time has just passed. Please choose another.'; }
      if (isFullSlot(key, Number(v))) return cfg.waitlistEnabled === false ? 'That time is full. Please pick another.' : 'That time is full. Join the waitlist below, or pick another time.';
      return '';
    },
    dateClosed(key) { const r = key ? resolveDay(key, cfg) : null; return r && r.closed ? `We are closed that day${r.name ? ' (' + r.name + ')' : ''}. Please pick another date.` : ''; },
    time12: (v) => (v ? fmtClock(Number(v)) : ''),
    reset() { clearWl(); if (reminder) reminder.reset(); timeEl.innerHTML = '<option value="">Choose a date first</option>'; },
  };
}
export { DAYS, addDays };
