// Timetable: accessible day tabs (arrow keys, Home/End, roving tabindex, deep links) + class-type filter.
import { $, $$, reduceMotion, gymNow } from './util.js';
import { addDays } from './dates.js';
import { waitlistForm } from './waitlist.js';

(() => {
  const tabs = $$('[role="tab"]');
  if (!tabs.length) return;
  const panels = $$('.day-panel');
  const chips = $$('[data-filter]');
  const status = $('#filter-status') || { textContent: '' };
  let type = 'all';
  const KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  /* ----- filter ----- */
  function applyFilter() {
    panels.forEach((panel) => {
      let shown = 0;
      $$('.class-row', panel).forEach((row) => { const hide = type !== 'all' && row.dataset.type !== type; row.hidden = hide; if (!hide) shown++; });
      $('.empty-note', panel).hidden = shown > 0;
      $(`#tab-${panel.dataset.day}`).dataset.n = String(shown);
    });
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === type)));
    announce();
  }
  function announce() {
    const panel = panels.find((p) => !p.hidden);
    const n = $$('.class-row', panel).filter((r) => !r.hidden).length;
    status.textContent = `${n} ${type === 'all' ? '' : type + ' '}${n === 1 ? 'class' : 'classes'} on ${panel.dataset.label}.`;
  }
  chips.forEach((c) => c.addEventListener('click', () => { type = c.dataset.filter; applyFilter(); }));

  /* ----- tabs ----- */
  function select(tab, { focus = false, hash = false } = {}) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    if (hash) history.replaceState(null, '', '#' + tab.getAttribute('aria-controls'));
    announce();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, { hash: true }));
    tab.addEventListener('keydown', (e) => {
      const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      select(tabs[(map[e.key] + tabs.length) % tabs.length], { focus: true, hash: true });
    });
  });

  /* ----- deep links: #day-tue selects Tuesday; #c-<class id> (from search) opens that class's day and highlights it ----- */
  function goto() {
    const id = decodeURIComponent(location.hash.slice(1));
    const el = id && document.getElementById(id);
    const panel = el && el.closest('[role="tabpanel"]');
    if (!panel) return false;
    if (el.classList.contains('class-row') && el.hidden) { type = 'all'; applyFilter(); }
    select($(`[aria-controls="${panel.id}"]`));
    const target = el === panel ? $('.tablist-wrap') : el;
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: el === panel ? 'start' : 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      if (el !== panel) el.animate([{ background: 'rgba(200,241,53,.28)' }, { background: 'transparent' }], { duration: 2200 });
    });
    return true;
  }
  if (!goto()) {
    const today = $(`#tab-${KEYS[gymNow().day]}`); // open on today's classes, in the gym's own time zone
    if (today) { today.classList.add('is-today'); select(today); }
  }
  window.addEventListener('hashchange', goto);
  applyFilter();
})();

/* ---------- Full classes: "Join the waitlist" opens a small form under the class (demo: nothing is sent) ---------- */
(() => {
  const KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-waitlist-class]'); if (!btn) return;
    const row = btn.closest('.class-row'), open = row.querySelector('.wl'), was = btn.getAttribute('aria-expanded') === 'true';
    $$('.class-row .wl').forEach((w) => w.remove()); $$('[data-waitlist-class]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (was && open) return; // second tap closes it
    const t = gymNow(), diff = (KEYS.indexOf(btn.dataset.day) - t.day + 7) % 7;
    const [h, m] = btn.dataset.start.split(':').map(Number), startMins = h * 60 + m;
    const dayKey = addDays(t.key, diff === 0 && startMins <= t.mins ? 7 : diff); // the next time this class runs
    const form = waitlistForm({ dayKey, mins: startMins, what: `${btn.dataset.name} with ${btn.dataset.coach}`, kind: 'waitlist' });
    row.appendChild(form); btn.setAttribute('aria-expanded', 'true');
    const f = $('#wl-name', form); if (f) f.focus({ preventScroll: true });
    form.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();
