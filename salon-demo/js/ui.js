// Cookie notice (no tracking is loaded unless the visitor accepts).
import { $, store } from './util.js';

(() => {
  const box = $('#cookie'); if (!box) return;
  const KEY = 'ml-cookie';
  const show = () => { box.hidden = false; document.documentElement.classList.add('cookie-open'); };
  const hide = () => { box.hidden = true; document.documentElement.classList.remove('cookie-open'); };
  if (!store.get(KEY)) show();
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cookie]'); if (!b) return;
    store.set(KEY, b.dataset.cookie); hide();
    // DEMO ONLY: add your analytics snippet here. It must run only when b.dataset.cookie === 'yes'.
  });
})();
