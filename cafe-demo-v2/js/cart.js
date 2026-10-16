// Pick-up / shop order drawer (demo): items live in localStorage, nothing is sent anywhere.
import { $, $$, site, money, store, toast, modal, cafeNow, hoursFor, fmtHour, escapeHtml } from './util.js';

const KEY = 'eo-cart';
let items = [];
try { items = JSON.parse(store(KEY) || '[]'); if (!Array.isArray(items)) items = []; } catch (_) { items = []; }

const drawer = $('#cart');
const scrim = $('#scrim');
const countEl = $('#cart-count');
const openBtn = $('#cart-open');
const list = $('#cart-list');
const empty = $('#cart-empty');
const form = $('#cart-form');
const done = $('#cart-done');
const totalEl = $('#cart-total');

const dlg = modal(drawer, {
  bodyClass: 'cart-open',
  onOpen() { scrim.hidden = false; render(); fillTimes(); },
  onClose() { scrim.hidden = true; done.hidden = true; render(); },
});

const save = () => store(KEY, JSON.stringify(items));
const count = () => items.reduce((n, i) => n + i.qty, 0);
const total = () => items.reduce((n, i) => n + i.qty * i.price, 0);

function render() {
  const c = count();
  countEl.textContent = c;
  countEl.hidden = c === 0;
  openBtn.setAttribute('aria-label', c ? `Your order, ${c} ${c === 1 ? 'item' : 'items'}, ${money(total())}` : 'Your order, empty');
  empty.hidden = c > 0;
  list.hidden = c === 0;
  if (!done.hidden) { form.hidden = true; return; }
  form.hidden = c === 0;
  list.innerHTML = items.map((i) => `
    <li data-id="${escapeHtml(i.id)}">
      <span class="ci-name">${escapeHtml(i.name)}</span>
      <span class="ci-price">${money(i.price * i.qty)}</span>
      <div class="ci-qty">
        <button type="button" data-qty="-1" aria-label="Remove one ${escapeHtml(i.name)}"><span aria-hidden="true">&minus;</span></button>
        <span class="q" aria-live="polite">${i.qty}</span>
        <button type="button" data-qty="1" aria-label="Add one more ${escapeHtml(i.name)}"><span aria-hidden="true">+</span></button>
        <button type="button" class="ci-remove" data-remove>Remove<span class="sr-only"> ${escapeHtml(i.name)}</span></button>
      </div>
    </li>`).join('');
  totalEl.textContent = money(total());
}

function add(id, name, price, btn) {
  const found = items.find((i) => i.id === id);
  if (found) found.qty += 1; else items.push({ id, name, price: Number(price), qty: 1 });
  save(); render();
  if (btn) { btn.classList.add('is-added'); setTimeout(() => btn.classList.remove('is-added'), 700); }
  toast(`Added ${name}. ${count()} ${count() === 1 ? 'item' : 'items'} in your order.`);
}

/** Pick-up times: ASAP plus the next slots inside opening hours (in the café's time zone). */
function fillTimes() {
  const sel = $('#cart-when');
  const { day, hour } = cafeNow();
  const today = hoursFor(day);
  const opts = [];
  if (today && hour >= today.open && hour < today.close - 0.5) opts.push('<option value="asap">As soon as possible (about 15 minutes)</option>');
  const start = Math.max(Math.ceil((hour + 0.5) * 4) / 4, today ? today.open : 0);
  if (today) for (let t = start; t <= today.close - 0.5 && opts.length < 9; t += 0.5) {
    const h = Math.floor(t), m = Math.round((t - h) * 60);
    opts.push(`<option value="${h}:${m}">Today at ${(h % 12) || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}</option>`);
  }
  if (!opts.length) { const nd = hoursFor((day + 1) % 7); opts.push(`<option value="tomorrow">Tomorrow at ${fmtHour(nd.open)}</option>`); }
  sel.innerHTML = opts.join('');
}

document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add]');
  if (addBtn) { add(addBtn.dataset.id, addBtn.dataset.name, addBtn.dataset.price, addBtn); return; }
  const opener = e.target.closest('[data-cart-open]');
  if (opener) dlg.open(opener);
});
openBtn.addEventListener('click', () => dlg.open(openBtn));
$('#cart-close').addEventListener('click', () => dlg.close());
scrim.addEventListener('click', () => dlg.close());
$('#done-close').addEventListener('click', () => dlg.close());
$('#cart-clear').addEventListener('click', () => { items = []; save(); render(); });
list.addEventListener('click', (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const it = items.find((i) => i.id === li.dataset.id); if (!it) return;
  if (e.target.closest('[data-remove]')) items = items.filter((i) => i !== it);
  else { const q = e.target.closest('[data-qty]'); if (!q) return; it.qty += Number(q.dataset.qty); if (it.qty < 1) items = items.filter((i) => i !== it); }
  save(); render();
  if (items.length) { const again = $(`[data-id="${CSS.escape(li.dataset.id)}"] [data-qty="1"]`, list); if (again) again.focus(); } else $('#cart-close').focus();
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#cart-name');
  const err = $('#e-cart-name');
  if (name.value.trim().length < 2) {
    err.textContent = 'Please add a name so we can call it out when your order is ready.';
    name.setAttribute('aria-invalid', 'true'); name.focus(); return;
  }
  err.textContent = ''; name.setAttribute('aria-invalid', 'false');
  const when = $('#cart-when').selectedOptions[0].textContent.toLowerCase();
  $('#done-name').textContent = name.value.trim().split(' ')[0];
  $('#done-detail').textContent = `Your order of ${count()} ${count() === 1 ? 'item' : 'items'} (${money(total())}) would be ready ${when}.`;
  items = []; save();
  done.hidden = false; render();
  done.focus();
});
// keep several open tabs in sync
window.addEventListener('storage', (e) => { if (e.key === KEY) { try { items = JSON.parse(e.newValue || '[]'); } catch (_) { items = []; } render(); } });
render();
export { dlg as cartDialog };
