// Click and collect for the menu: Add buttons, a cart drawer (items, quantity +/-, total), a pick-up time every 10 minutes from 15 minutes
// ahead inside opening hours (from site.config.json, in the café's time zone), name and phone, "Place pickup order".
// DEMO ONLY: the order is NOT sent anywhere and no payment is taken ("Pay in store"). To make it real, send `order` (see place()) to your
// own endpoint or ordering service and only then show the confirmation. The cart survives a reload through sessionStorage.
import { nowIn, slotsFor, fmtClock } from './clock.js';
import { addDays, dayLabel } from './dates.js';
import { auPhone, nameOk, prettyPhone } from './growth.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (c) => '$' + (c / 100).toFixed(2);
const KEY = 'eo-cart', FORM = 'eo-order-form';
const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* storage blocked: the cart simply will not survive a reload */ } } };

export function initOrdering(cfg, { toast } = {}) {
  if (cfg.orderingEnabled !== true) return; // switched off in config: no buttons, no cart, no bar
  const tz = cfg.timezone || 'Australia/Melbourne';
  const items = new Map();
  $$('.menu-item').forEach((art, i) => {
    const name = $('h3', art), price = $('.price', art); if (!name || !price) return;
    const cents = Math.round(parseFloat(price.textContent.replace(/[^0-9.]/g, '')) * 100); if (!(cents > 0)) return;
    const id = 'i' + i, nm = name.textContent.trim();
    items.set(id, { id, name: nm, cents });
    art.insertAdjacentHTML('beforeend', `<button type="button" class="add-btn" data-add="${id}">Add<span class="sr-only"> ${esc(nm)} to your pickup order</span></button>`);
  });
  if (!items.size) return;

  let cart = {};
  try { const raw = JSON.parse(ss.get(KEY) || '{}'); Object.keys(raw).forEach((k) => { if (items.has(k) && raw[k] > 0) cart[k] = Math.min(20, raw[k] | 0); }); } catch (e) { cart = {}; }
  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const total = () => Object.entries(cart).reduce((s, [k, q]) => s + items.get(k).cents * q, 0);
  const save = () => ss.set(KEY, JSON.stringify(cart));

  /* order bar in the menu + floating pill */
  const bar = $('#order-bar');
  if (bar) { bar.hidden = false; bar.innerHTML = '<p><strong>Order for pickup.</strong> Add items, choose a time and pay in store. Demo only: orders are not sent anywhere.</p><button type="button" class="btn btn-secondary btn-on-light" id="open-cart">View pickup order <span class="cart-count" id="cart-count-bar">0</span></button>'; }
  const live = document.createElement('p'); live.className = 'sr-only'; live.setAttribute('role', 'status'); document.body.append(live);
  const pill = document.createElement('button'); pill.type = 'button'; pill.className = 'cart-pill'; pill.id = 'cart-pill'; pill.hidden = true; document.body.append(pill);

  /* drawer */
  const scrim = document.createElement('div'); scrim.className = 'drawer-scrim'; scrim.hidden = true;
  const dr = document.createElement('aside'); dr.className = 'cart-drawer'; dr.id = 'cart-drawer'; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-modal', 'true'); dr.setAttribute('aria-labelledby', 'cart-title'); dr.hidden = true;
  document.body.append(scrim, dr);
  let opener = null;

  function pickupOptions() {
    const now = nowIn(tz); let key = now.key, mins = slotsFor(key, cfg, 10, now.mins + 15, 10);
    for (let i = 1; !mins.length && i <= 8; i++) { key = addDays(now.key, i); mins = slotsFor(key, cfg, 10, -1, 10); }
    const label = key === now.key ? 'Today' : key === addDays(now.key, 1) ? 'Tomorrow' : dayLabel(key);
    return { key, label, mins, today: key === now.key };
  }
  function saveForm() { ss.set(FORM, JSON.stringify({ name: $('#oc-name') ? $('#oc-name').value : '', phone: $('#oc-phone') ? $('#oc-phone').value : '', time: $('#oc-time') ? $('#oc-time').value : '' })); }
  function render(done) {
    const n = count();
    $$('#cart-count-bar').forEach((e) => { e.textContent = n; });
    pill.hidden = n === 0 || !!done; pill.textContent = `Pickup order · ${n} · ${money(total())}`;
    if (done) { dr.innerHTML = confirmation(done); return; }
    const saved = (() => { try { return JSON.parse(ss.get(FORM) || '{}'); } catch (e) { return {}; } })();
    const opt = pickupOptions();
    const rows = Object.entries(cart).map(([k, q]) => { const it = items.get(k); return `<li class="cart-row"><span class="cart-name">${esc(it.name)}</span><span class="cart-qty" role="group" aria-label="Quantity for ${esc(it.name)}"><button type="button" class="qty-btn" data-dec="${k}" aria-label="Remove one ${esc(it.name)}">&minus;</button><output aria-live="polite">${q}</output><button type="button" class="qty-btn" data-inc="${k}" aria-label="Add one ${esc(it.name)}">+</button></span><span class="cart-price">${money(it.cents * q)}</span></li>`; }).join('');
    dr.innerHTML = `<div class="drawer-head"><h2 id="cart-title">Your pickup order</h2><button type="button" class="drawer-close" data-close aria-label="Close pickup order">&times;</button></div>
      ${n ? `<ul class="cart-list" role="list">${rows}</ul><p class="cart-total"><span>Total</span><strong>${money(total())}</strong></p>
      <form id="order-form" novalidate>
        <div class="field"><label for="oc-time">Pickup time</label>
          <select id="oc-time" name="time" aria-describedby="oc-time-e">${opt.mins.length ? `<optgroup label="${esc(opt.label)}">${opt.mins.map((m) => `<option value="${opt.key}|${m}">${fmtClock(m)}</option>`).join('')}</optgroup>` : '<option value="">No pickup times available</option>'}</select>
          <p class="hint">${opt.today ? 'Times start 15 minutes from now, every 10 minutes, while we are open.' : `We are closed for pick-ups right now. Next available: ${esc(opt.label)}.`}</p><p class="error" id="oc-time-e" aria-live="polite"></p></div>
        <div class="field"><label for="oc-name">Name</label><input id="oc-name" name="name" autocomplete="name" aria-describedby="oc-name-e"><p class="error" id="oc-name-e" aria-live="polite"></p></div>
        <div class="field"><label for="oc-phone">Phone</label><input id="oc-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0412 345 678" aria-describedby="oc-phone-e"><p class="error" id="oc-phone-e" aria-live="polite"></p></div>
        <p class="hint">Pay in store when you collect. Demo only: this order is not sent anywhere and nothing is charged.</p>
        <div class="hp" aria-hidden="true"><label>Leave empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <button class="btn btn-primary btn-block" type="submit">Place pickup order</button>
        <button class="btn btn-secondary btn-on-light btn-block" type="button" data-clear>Clear order</button>
      </form>` : '<p class="cart-empty">Your order is empty. Press <strong>Add</strong> next to anything on the menu.</p><button class="btn btn-primary" type="button" data-close>Back to the menu</button>'}`;
    if (n) {
      if (saved.name) $('#oc-name').value = saved.name; if (saved.phone) $('#oc-phone').value = saved.phone;
      if (saved.time && $(`#oc-time option[value="${saved.time}"]`)) $('#oc-time').value = saved.time;
    }
  }
  function confirmation(o) {
    return `<div class="drawer-head"><h2 id="cart-title">Order placed (demo)</h2><button type="button" class="drawer-close" data-close aria-label="Close">&times;</button></div>
      <div class="order-done" tabindex="-1" id="order-done"><p class="order-number">Order <strong>${esc(o.number)}</strong></p>
      <p>Thanks, ${esc(o.name.split(/\s+/)[0])}. Pickup <strong>${esc(o.when)}</strong>. <strong>Pay in store.</strong></p>
      <ul class="cart-list" role="list">${o.lines.map((l) => `<li class="cart-row"><span class="cart-name">${esc(l.name)} &times; ${l.qty}</span><span class="cart-price">${money(l.cents * l.qty)}</span></li>`).join('')}</ul>
      <p class="cart-total"><span>Total to pay in store</span><strong>${money(o.total)}</strong></p>
      <p class="hint"><strong>Demo only:</strong> this order was not sent anywhere, the number is fake and no payment was taken.</p>
      <button class="btn btn-primary" type="button" data-close>Done</button></div>`;
  }

  function openDrawer(trigger) { opener = trigger || document.activeElement; render(); scrim.hidden = false; dr.hidden = false; document.body.classList.add('no-scroll'); const f = $('#order-form input, #order-form select', dr) || $('[data-close]', dr); if (f) f.focus(); }
  function closeDrawer() { dr.hidden = true; scrim.hidden = true; document.body.classList.remove('no-scroll'); render(); if (opener && opener.focus) opener.focus(); }
  const change = (k, d) => { cart[k] = Math.max(0, Math.min(20, (cart[k] || 0) + d)); if (!cart[k]) delete cart[k]; save(); const t = $('#oc-time') && $('#oc-time').value; render(); if (t && $('#oc-time') && $(`#oc-time option[value="${t}"]`)) $('#oc-time').value = t; };

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { const it = items.get(add.dataset.add); change(it.id, 1); add.classList.add('is-added'); setTimeout(() => add.classList.remove('is-added'), 900); live.textContent = `Added ${it.name}. ${count()} in your pickup order.`; return; } // announced to screen readers; the order pill shows the count (no toast, it would cover the pill)
    if (e.target.closest('#open-cart, #cart-pill')) { openDrawer(e.target.closest('button')); return; }
    if (dr.hidden) return;
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
    if (inc) { change(inc.dataset.inc, 1); const b = $(`[data-inc="${inc.dataset.inc}"]`, dr); if (b) b.focus(); return; }
    if (dec) { const k = dec.dataset.dec; change(k, -1); const b = $(`[data-dec="${k}"]`, dr) || $('#oc-time', dr) || $('[data-close]', dr); if (b) b.focus(); return; }
    if (e.target.closest('[data-close]') || e.target === scrim) { closeDrawer(); return; }
    if (e.target.closest('[data-clear]')) { cart = {}; save(); ss.set(FORM, null); closeDrawer(); return; }
  });
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (dr.hidden) return;
    if (e.key === 'Escape') { closeDrawer(); return; }
    if (e.key === 'Tab') { const f = $$('button:not([disabled]), input:not([tabindex="-1"]), select, a[href]', dr).filter((x) => x.offsetParent !== null); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  dr.addEventListener('input', saveForm); dr.addEventListener('change', saveForm);
  let busy = false;
  dr.addEventListener('submit', (e) => {
    e.preventDefault(); if (busy) return;
    const form = e.target, set = (id, msg) => { const el = $('#' + id + '-e', dr), inp = $('#' + id, dr); el.textContent = msg; inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; };
    const nm = $('#oc-name').value, ph = auPhone($('#oc-phone').value), tv = $('#oc-time').value;
    const okName = set('oc-name', nameOk(nm) ? '' : 'Please tell us your name so we can call it out at the counter.');
    const okPhone = set('oc-phone', ph ? '' : 'Please enter an Australian phone number, like 0412 345 678.');
    let okTime = set('oc-time', tv ? '' : 'There are no pickup times available right now. Please try again when we are open.');
    if (tv) { const [key, m] = tv.split('|'), now = nowIn(tz); if (key === now.key && Number(m) < now.mins + 15) { okTime = set('oc-time', 'That pickup time is too soon now. Please choose a later one.'); render(); } }
    if (!okName) { $('#oc-name').focus(); return; } if (!okPhone) { $('#oc-phone').focus(); return; } if (!okTime) { $('#oc-time').focus(); return; }
    busy = true;
    try {
      const [key, m] = tv.split('|'), now = nowIn(tz);
      const lines = Object.entries(cart).map(([k, q]) => ({ name: items.get(k).name, cents: items.get(k).cents, qty: q }));
      const number = 'EO-' + String(1000 + (Math.abs(Array.from(nm + ph + Date.now()).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 9000));
      const order = { number, name: nm.trim(), phone: prettyPhone(ph), when: `${key === now.key ? 'today' : key === addDays(now.key, 1) ? 'tomorrow' : dayLabel(key)} at ${fmtClock(Number(m))}`, lines, total: total() };
      // DEMO ONLY: nothing is sent. A real shop would POST `order` to its own endpoint here and wait for a success response.
      cart = {}; save(); ss.set(FORM, null); render(order);
      const d = $('#order-done'); if (d) d.focus();
    } finally { busy = false; }
  });
  render();
  if (!bar) return;
}
