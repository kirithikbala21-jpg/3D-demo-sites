// Suburb checker: type a suburb or postcode, or tap a chip. The result is announced politely (aria-live).
import { $, $$, SITE } from './util.js';

(() => {
  const form = $('#area-form'); if (!form) return;
  const input = $('#area-input'), out = $('#area-result'), chips = $$('.chip');
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\bmt\b/g, 'mount').replace(/\s+/g, ' ').trim();
  const phoneLink = `<a href="tel:${SITE.phoneHref}">${SITE.phone}</a>`;

  function find(q) {
    if (/^\d{4}$/.test(q)) return SITE.suburbs.filter((s) => s.postcode === q);
    const exact = SITE.suburbs.filter((s) => norm(s.name) === q);
    if (exact.length) return exact;
    return q.length >= 3 ? SITE.suburbs.filter((s) => norm(s.name).startsWith(q)) : [];
  }
  const names = (list) => list.length === 1 ? list[0].name : list.slice(0, -1).map((s) => s.name).join(', ') + ' and ' + list[list.length - 1].name;

  function show(raw, { final }) {
    const q = norm(raw);
    if (!q) { out.dataset.state = 'idle'; out.textContent = 'Type a suburb or postcode to check.'; return; }
    const hits = find(q);
    if (hits.length) {
      out.dataset.state = 'yes';
      const etas = [...new Set(hits.map((s) => s.eta))];
      out.textContent = etas.length === 1
        ? `Yes, we cover ${names(hits)}, usually within ${etas[0]} minutes.`
        : 'Yes, we cover ' + hits.map((s) => `${s.name} (usually within ${s.eta} minutes)`).join(' and ') + '.';
      out.insertAdjacentHTML('beforeend', ` <a class="btn btn-call btn-sm area-call" href="tel:${SITE.phoneHref}">Call ${SITE.phone}</a>`);
    } else if (final || q.length >= 4) {
      out.dataset.state = 'no';
      out.innerHTML = `Not yet, leave your details and we will tell you. <a class="btn btn-outline btn-sm area-call" href="#quote">Leave my details</a>`;
    } else {
      out.dataset.state = 'idle'; out.textContent = 'Keep typing, or tap your suburb below.';
    }
    const lit = hits.length === 1 ? hits[0].name : '';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.suburb === lit)));
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); show(input.value, { final: true }); });
  input.addEventListener('input', () => show(input.value, { final: false }));
  chips.forEach((c) => { c.setAttribute('aria-pressed', 'false'); c.addEventListener('click', () => { input.value = c.dataset.suburb; show(input.value, { final: true }); }); });
})();
