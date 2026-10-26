// Click and collect (demo): the order drawer. Items live in sessionStorage (they survive a reload of this tab), nothing is sent anywhere,
// and payment is in store. Switch the whole thing off with orderingEnabled: false in site.config.json (the markup is then never output).
import { $, $$, site, money, store, sstore, toast, modal, nowCafe, resolveDay, fmtHour, escapeHtml, CLOCK_CFG } from './util.js';
import { addDays, dayLabel, pickupTimes, pickupDays, PICKUP_STEP, PICKUP_NOTICE } from './clock.js';
import { addHoneypot, tripped, guard, send, phoneFallback, auPhone } from './formtools.js';
import { mountReminder } from './reminder.js';

const KEY = 'eo-cart';
const STEP = PICKUP_STEP, NOTICE = PICKUP_NOTICE;
const pickupTimesFor = (k, now) => pickupTimes(k, now, CLOCK_CFG);
const pickupDaysFor = (now) => pickupDays(now, CLOCK_CFG);

let items = [];
try { items = JSON.parse(sstore(KEY) || '[]'); if (!Array.isArray(items)) items = []; } catch (_) { items = []; }
const drawer = $('#cart');

if (drawer && site.orderingEnabled !== false) {
  const scrim = $('#scrim'), countEl = $('#cart-count'), openBtn = $('#cart-open'), list = $('#cart-list'), empty = $('#cart-empty');
  const form = $('#cart-form'), done = $('#cart-done'), totalEl = $('#cart-total');
  const daySel = $('#cart-day'), timeSel = $('#cart-when'), hint = $('#h-cart-when');

  const dlg = modal(drawer, {
    bodyClass: 'cart-open',
    onOpen() { scrim.hidden = false; render(); fillDays(); },
    onClose() { scrim.hidden = true; done.hidden = true; render(); },
  });

  const save = () => sstore(KEY, JSON.stringify(items));
  /** DEMO ONLY: a confirmed order is kept in this browser (localStorage 'eo-orders'); nothing is sent anywhere. */
  function saveOrder(order) {
    let all = [];
    try { all = JSON.parse(store('eo-orders') || '[]'); if (!Array.isArray(all)) all = []; } catch (_) { all = []; }
    all.push({ placed: new Date().toISOString(), ...order });
    store('eo-orders', JSON.stringify(all.slice(-20)));
  }
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

  /* ---------- pick-up day and time ---------- */
  const dayName = (k, now) => (k === now.key ? 'Today' : k === addDays(now.key, 1) ? 'Tomorrow' : dayLabel(k));
  function fillDays() {
    const now = nowCafe(), days = pickupDaysFor(now), keep = daySel.value;
    daySel.innerHTML = days.map((k) => `<option value="${k}">${dayName(k, now)}</option>`).join('');
    if (!days.length) { daySel.innerHTML = '<option value="">No pick-up times available</option>'; }
    if (days.includes(keep)) daySel.value = keep;
    fillTimes();
  }
  function fillTimes() {
    const now = nowCafe(), key = daySel.value, times = key ? pickupTimesFor(key, now) : [], keep = timeSel.value;
    timeSel.innerHTML = times.map((t) => `<option value="${t}">${fmtHour(t)}</option>`).join('');
    if (times.map(String).includes(keep)) timeSel.value = keep;
    const r = key ? resolveDay(key) : null;
    hint.textContent = !times.length ? 'Sorry, there are no pick-up times left. Please try again when we are open.'
      : `Open ${fmtHour(r.open)} to ${fmtHour(r.close)}. Times are every ${STEP} minutes, with at least ${NOTICE} minutes' notice.`;
  }
  daySel.addEventListener('change', fillTimes);

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

  /* ---------- placing the order ---------- */
  addHoneypot(form);
  const placeBtn = $('button[type=submit]', form), busy = guard(placeBtn);
  const reminder = mountReminder($('#cart-demo-note', form), site, 'cart-rm');
  const orderFail = document.createElement('div'); orderFail.setAttribute('aria-live', 'assertive'); placeBtn.after(orderFail);
  const nameEl = $('#cart-name'), phoneEl = $('#cart-phone'), nameErr = $('#e-cart-name'), phoneErr = $('#e-cart-phone');
  const fail = (el, err, msg) => { err.textContent = msg; el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; };
  nameEl.addEventListener('input', () => { if (nameEl.getAttribute('aria-invalid') === 'true') nameEl.value.trim().length >= 2 && fail(nameEl, nameErr, ''); });
  phoneEl.addEventListener('input', () => { if (phoneEl.getAttribute('aria-invalid') === 'true' && auPhone(phoneEl.value)) fail(phoneEl, phoneErr, ''); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!busy.start()) return; // a second click while the first is still being handled
    try {
      orderFail.innerHTML = '';
      const a = fail(nameEl, nameErr, nameEl.value.trim().length < 2 ? 'Please add a name so we can call it out when your order is ready.' : '');
      const ph = auPhone(phoneEl.value);
      const b = fail(phoneEl, phoneErr, !phoneEl.value.trim() ? 'We need a phone number in case there is a problem with your order.' : ph ? '' : 'Please enter an Australian phone number, like 0412 345 678.');
      let c = true;
      if (reminder) c = reminder.read().ok;
      if (!a) { nameEl.focus(); return; }
      if (!b) { phoneEl.focus(); return; }
      if (!c) { reminder.read().input.focus(); return; }
      // the clock keeps moving: make sure the chosen time is still at least 15 minutes away and still inside opening hours
      const now = nowCafe(), key = daySel.value, mins = Number(timeSel.value);
      if (!key || !pickupTimesFor(key, now).includes(mins)) { fillDays(); hint.textContent = 'That pick-up time has just passed. Please choose another.'; timeSel.focus(); return; }
      const when = `${dayName(key, now).toLowerCase() === 'today' ? 'today' : dayName(key, now)} at ${fmtHour(mins)}`;
      const orderNo = 'EO-' + String(Math.floor(1000 + Math.random() * 9000)); // made up: nothing is created anywhere
      const order = { orderNo, name: nameEl.value.trim(), phone: ph, pickup: when, pickupDay: key, pickupMins: mins, payment: 'pay in store', items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })), total: Number(total().toFixed(2)) };
      if (!tripped(form)) {
        const rm = reminder ? reminder.read() : { mode: 'none' };
        const res = await send({ formType: 'pickup-order', _subject: `Pick-up order ${orderNo} for ${order.name}`, ...order, reminder: rm.mode === 'none' ? 'none' : { mode: rm.mode, contact: rm.contact } });
        if (!res.ok) { orderFail.innerHTML = phoneFallback(); return; }
        saveOrder(order);
      }
      $('#done-name').textContent = nameEl.value.trim().split(' ')[0];
      $('#done-no').textContent = orderNo;
      $('#done-detail').textContent = `Your order of ${count()} ${count() === 1 ? 'item' : 'items'} (${money(total())}) will be ready ${when}.`;
      const rline = reminder ? reminder.confirmation(key, { now, startMins: mins }) : '';
      const rEl = $('#done-reminder'); rEl.textContent = rline; rEl.hidden = !rline;
      // Preview of the reminder message (SENDING IS NOT CONNECTED: this only shows what it would say)
      const pv = reminder ? reminder.preview(`Hi ${nameEl.value.trim().split(' ')[0]}, a reminder that your pick-up order ${orderNo} is ready to collect ${when} at ${site.name}. Pay in store.`) : '';
      const pEl = $('#done-preview'); pEl.textContent = pv; pEl.hidden = !pv;
      if (reminder) reminder.reset();
      items = []; save(); form.reset();
      done.hidden = false; render();
      done.focus();
    } finally { busy.stop(); }
  });
  render();
}
