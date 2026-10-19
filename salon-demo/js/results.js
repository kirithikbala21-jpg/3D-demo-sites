// Before/after: tabs for the three jobs, and the comparison slider (a real range input, so keyboard and touch both work).
import { $, $$ } from './util.js';
import { initTabs } from './tabs.js';

const root = $('[data-tabs="results"]');
if (root) initTabs(root);
$$('[data-ba]').forEach((ba) => {
  const stage = $('.ba-stage', ba), range = $('.ba-range', ba);
  const set = () => {
    const v = Number(range.value);
    stage.style.setProperty('--pos', v + '%');
    range.setAttribute('aria-valuetext', `Before on the left, after on the right, handle at ${v}%`);
  };
  range.addEventListener('input', set);
  set();
});
