// Recent jobs: tabs (arrow keys work) and the before/after slider (a real range input: keyboard, mouse and touch).
import { $, $$ } from './util.js';

(() => {
  const root = $('#jobs-widget'); if (!root) return;
  const tabs = $$('[role="tab"]', root), panels = $$('[role="tabpanel"]', root);
  const select = (tab, focus) => {
    tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    panels.forEach((p) => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t, false));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
      else if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
      else if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
  });
  panels.forEach((p) => p.removeAttribute('tabindex'));

  $$('[data-ba]', root).forEach((ba) => {
    const range = $('.ba-range', ba);
    const sync = () => { ba.style.setProperty('--pos', range.value + '%'); range.setAttribute('aria-valuetext', `Showing ${range.value}% before, ${100 - range.value}% after`); };
    range.addEventListener('input', sync);
    sync();
  });
})();
