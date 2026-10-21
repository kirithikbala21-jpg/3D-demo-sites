// "Your visit" drawer (demo): chosen services and products live in localStorage, nothing is sent anywhere.
import { $, $$, site, money, store, toast, modal, nowShop, resolveDay, addDays, fmtHour, escapeHtml } from './util.js';
import { DAY_NAMES } from './clock.js';
import { addHoneypot, tripped, guard, send, isLive, phoneFallback, auPhone, PHONE_ERR } from './formkit.js';

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
const timeEl = $('#cart-time');

const dlg = modal(drawer, {
  bodyClass: 'cart-open',
  onOpen() { scrim.hidden = false; render(); fillTimes(); },
  onClose() { scrim.hidden = true; done.hidden = true; render(); },
});

const save = () => store(KEY, JSON.stringify(items));
const count = () => items.reduce((n, i) => n + i.qty, 0);
const total = () => items.reduce((n, i) => n + i.qty * i.price, 0);
const minutes = () => items.reduce((n, i) => n + i.qty * (i.mins || 0), 0);
const fmtMins = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);

function render() {
  const c = count();
  countEl.textContent = c;
  countEl.hidden = c === 0;
  openBtn.setAttribute('aria-label', c ? `Your visit, ${c} ${c === 1 ? 'item' : 'items'}, ${money(total())}` : 'Your visit, empty');
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
  const m = minutes();
  timeEl.hidden = !m;
  timeEl.textContent = m ? `Time in the chair: about ${fmtMins(m)}` : '';
}

function add(id, name, price, btn) {
  const found = items.find((i) => i.id === id);
  const mins = Number(btn && btn.dataset.mins) || 0;
  if (found) found.qty += 1; else items.push({ id, name, price: Number(price), qty: 1, mins });
  save(); render();
  if (btn) { btn.classList.add('is-added'); setTimeout(() => btn.classList.remove('is-added'), 700); }
  toast(`Added ${name}. ${count()} ${count() === 1 ? 'item' : 'items'} in your visit.`);
}

/** Visit times: "next available" plus the next slots inside opening hours (shop time zone, holidays and closures included). */
function fillTimes() {
  const sel = $('#cart-when');
  const n = nowShop(), today = resolveDay(n.key);
  const opts = [];
  const lab = (t) => { const h = Math.floor((t % 1440) / 60), m = t % 60; return `${(h % 12) || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`; };
  if (!today.closed && n.mins >= today.open && n.mins < today.close - 30) opts.push('<option value="asap">Next available chair (about 15 minutes)</option>');
  if (!today.closed) for (let t = Math.max(Math.ceil((n.mins + 30) / 15) * 15, today.open); t <= today.close - 30 && opts.length < 9; t += 30) opts.push(`<option value="${t}">Today at ${lab(t)}</option>`);
  if (!opts.length) {
    for (let i = 1; i <= 21; i++) {
      const key = addDays(n.key, i), r = resolveDay(key);
      if (!r.closed) { opts.push(`<option value="tomorrow">${i === 1 ? 'Tomorrow' : DAY_NAMES[new Date(key + 'T12:00:00Z').getUTCDay()]} at ${fmtHour(r.open)}</option>`); break; }
    }
  }
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
addHoneypot(form);
const submitBtn = $('button[type=submit]', form), busy = guard(submitBtn);
const failBox = document.createElement('div'); failBox.setAttribute('aria-live', 'assertive'); submitBtn.before(failBox);
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!busy.start()) return;
  try {
    failBox.innerHTML = '';
    const name = $('#cart-name'), phone = $('#cart-phone');
    const err = $('#e-cart-name'), perr = $('#e-cart-phone');
    err.textContent = perr.textContent = ''; name.setAttribute('aria-invalid', 'false'); phone.setAttribute('aria-invalid', 'false');
    let firstBad = null;
    if (name.value.trim().length < 2) { err.textContent = 'Please add a name so we can find your booking when you arrive.'; name.setAttribute('aria-invalid', 'true'); firstBad = name; }
    if (!phone.value.trim()) { perr.textContent = 'We need a phone number in case we have to reach you.'; phone.setAttribute('aria-invalid', 'true'); firstBad = firstBad || phone; }
    else if (!auPhone(phone.value)) { perr.textContent = PHONE_ERR; phone.setAttribute('aria-invalid', 'true'); firstBad = firstBad || phone; }
    if (firstBad) { firstBad.focus(); return; }
    const when = $('#cart-when').selectedOptions[0].textContent.toLowerCase();
    const barber = $('#cart-barber').value === 'any' ? 'the next available barber' : $('#cart-barber').value;
    if (!tripped(form)) {
      const res = await send({ type: 'visit', _subject: 'Visit request', name: name.value.trim(), phone: auPhone(phone.value), barber: $('#cart-barber').value, when, items: items.map((i) => `${i.qty} x ${i.name}`), total: total() });
      if (!res.ok) { failBox.innerHTML = phoneFallback(); return; }
    }
    $('#done-name').textContent = name.value.trim().split(' ')[0];
    $('#done-detail').textContent = `Your visit (${count()} ${count() === 1 ? 'item' : 'items'}, ${money(total())}${minutes() ? `, about ${fmtMins(minutes())}` : ''}) ${isLive() ? 'is requested' : 'would be pencilled in'} with ${barber}: ${when}.`;
    const note = $('.note', done); if (note) note.textContent = isLive() ? `We will confirm by phone or text. Questions? Call ${site.phone}.` : 'Demo only: nothing was booked and nothing was charged.';
    items = []; save();
    done.hidden = false; render();
    done.focus();
  } finally { busy.stop(); }
});
// keep several open tabs in sync
window.addEventListener('storage', (e) => { if (e.key === KEY) { try { items = JSON.parse(e.newValue || '[]'); } catch (_) { items = []; } render(); } });
render();
export { dlg as cartDialog };
