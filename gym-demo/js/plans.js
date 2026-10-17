// Membership: monthly / annual billing toggle. Both prices live in the HTML (data attributes), so the page reads fine without JavaScript.
import { $, $$ } from './util.js';

(() => {
  const btns = $$('[data-billing]');
  if (!btns.length) return;
  const set = (mode) => {
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.billing === mode)));
    $$('.price-amt').forEach((el) => { el.textContent = '$' + el.dataset[mode]; });
    $$('.plan-bill').forEach((el) => { el.textContent = el.dataset[mode]; });
    const s = $('#billing-status'); if (s) s.textContent = mode === 'annual' ? 'Showing annual prices, billed once a year.' : 'Showing monthly prices, billed monthly.';
  };
  btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.billing)));
})();
