// Accessible tabs: roving tabindex, arrow keys, Home and End. Used by Services and Before/after.
import { $$ } from './util.js';

export function initTabs(root, onSelect) {
  const list = root.querySelector('[role="tablist"]');
  const tabs = $$('[role="tab"]', list);
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  let current = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
  function select(i, focus, user) {
    current = i;
    tabs.forEach((t, j) => { const on = i === j; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panels[j].hidden = !on; });
    if (focus) tabs[i].focus();
    const t = tabs[i], l = list;
    if (l.scrollWidth > l.clientWidth) l.scrollTo({ left: t.offsetLeft - (l.clientWidth - t.offsetWidth) / 2, behavior: 'auto' });
    if (onSelect) onSelect(i, panels[i], !!user);
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => select(i, false, true)));
  list.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let n = null;
    if (e.key in keys) n = (current + keys[e.key] + tabs.length) % tabs.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = tabs.length - 1;
    if (n === null) return;
    e.preventDefault(); select(n, true, true);
  });
  select(current, false);
  return { select, tabs, panels };
}
