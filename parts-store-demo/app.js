// Torque & Co. concept: all demo logic, front-end only. State lives in memory (and the cookie choice in localStorage).
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => '$' + n.toFixed(2).replace(/\.00$/, '');
  const state = { car: null, store: null, cart: {}, compare: new Set() };
  let toastT;
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); };
  const ico = (id, cls = '') => `<svg class="${cls}" width="48" height="48" aria-hidden="true"><use href="#${id}"/></svg>`;

  /* ---------- data ---------- */
  const CATS = [['Oils and fluids', 'i-oil'], ['Parts and service', 'i-gear'], ['4WD and adventure', 'i-4wd'], ['Paint and panel', 'i-paint'], ['Car care', 'i-care'], ['In-car tech', 'i-tech'], ['Lighting', 'i-light'], ['Tools and garage', 'i-tool'], ['Batteries', 'i-bat'], ['Towing', 'i-tow'], ['Wipers', 'i-wipe'], ['Seat covers', 'i-seat']];
  const art = {
    oil: '<svg viewBox="0 0 60 90" aria-hidden="true"><rect x="22" y="2" width="16" height="12" rx="2" fill="#1a1a1a"/><path d="M14 18h32v64a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" fill="#fff" stroke="#1a1a1a" stroke-width="3"/><rect x="14" y="36" width="32" height="26" fill="#EE3123"/><path d="M30 42c4 5 6 8 0 14-6-6-4-9 0-14z" fill="#fff"/></svg>',
    filter: '<svg viewBox="0 0 70 80" aria-hidden="true"><rect x="8" y="12" width="54" height="62" rx="6" fill="#1a1a1a"/><rect x="8" y="30" width="54" height="22" fill="#EE3123"/><rect x="18" y="4" width="34" height="10" rx="2" fill="#777"/></svg>',
    battery: '<svg viewBox="0 0 100 70" aria-hidden="true"><rect x="4" y="16" width="92" height="50" rx="4" fill="#1a1a1a"/><rect x="14" y="6" width="14" height="10" fill="#777"/><rect x="72" y="6" width="14" height="10" fill="#777"/><rect x="18" y="30" width="64" height="22" fill="#EE3123"/><path d="M52 32l-10 10h8l-4 8 12-12h-8z" fill="#fff"/></svg>',
    tool: '<svg viewBox="0 0 100 60" aria-hidden="true"><rect x="6" y="24" width="64" height="12" rx="5" fill="#777"/><circle cx="80" cy="30" r="14" fill="none" stroke="#1a1a1a" stroke-width="9"/><rect x="6" y="24" width="30" height="12" rx="5" fill="#EE3123"/></svg>',
    wiper: '<svg viewBox="0 0 100 40" aria-hidden="true"><path d="M6 30Q50 -2 94 30" fill="none" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/><path d="M6 34Q50 4 94 34" fill="none" stroke="#EE3123" stroke-width="3"/></svg>',
    pads: '<svg viewBox="0 0 100 60" aria-hidden="true"><path d="M8 40Q50 -4 92 40v12H8z" fill="#1a1a1a"/><path d="M18 40Q50 8 82 40v6H18z" fill="#EE3123"/></svg>',
    spark: '<svg viewBox="0 0 40 90" aria-hidden="true"><rect x="13" y="2" width="14" height="24" rx="3" fill="#fff" stroke="#1a1a1a" stroke-width="3"/><rect x="9" y="26" width="22" height="22" fill="#777"/><rect x="16" y="48" width="8" height="34" fill="#EE3123"/></svg>',
    wax: '<svg viewBox="0 0 70 70" aria-hidden="true"><circle cx="35" cy="38" r="28" fill="#1a1a1a"/><rect x="8" y="26" width="54" height="22" fill="#EE3123"/><rect x="14" y="8" width="42" height="10" rx="3" fill="#777"/></svg>'
  };
  const P = [
    { id: 'p1', n: 'Full synthetic engine oil 5W-30, 5L', b: 'Veloce', now: 37, was: 74, a: 'oil' },
    { id: 'p2', n: 'Oil filter, spin-on', b: 'ClearFlow', now: 14, was: 22, a: 'filter' },
    { id: 'p3', n: 'Battery 12V 600CCA', b: 'Voltix', now: 189, was: 239, a: 'battery' },
    { id: 'p4', n: 'Front brake pads, ceramic', b: 'StopTech Pro', now: 59, was: 89, a: 'pads' },
    { id: 'p5', n: 'Wiper blades, pair', b: 'Aquaglide', now: 24, was: 36, a: 'wiper' },
    { id: 'p6', n: 'Socket and ratchet set, 40 piece', b: 'Garagehand', now: 49, was: 98, a: 'tool' },
    { id: 'p7', n: 'Iridium spark plug', b: 'Ignis', now: 17, was: 24, a: 'spark' },
    { id: 'p8', n: 'Wash and wax kit, 1L', b: 'Gloss Lab', now: 29, was: 45, a: 'wax' }
  ];
  const PR = Object.fromEntries(P.map((p) => [p.id, p]));
  const EXTRA = { sump: ['Sump plug washer, 5 pack', 5], pads2: ['Brake cleaner, 500ml', 9], fluid: ['Brake fluid DOT 4, 500ml', 14], rot: ['Brake grease', 8], terms: ['Battery terminal protector', 7], cloth: ['Microfibre cloths, 6 pack', 12], shampoo: ['Car wash shampoo, 2L', 15] };
  const JOBS = [
    { id: 'oil', t: 'Oil change', d: 'Oil, filter and washer', i: 'i-oil', parts: [['p1', 'p1'], ['p2', 'p2'], ['sump']] },
    { id: 'brake', t: 'Brake job', d: 'Pads, fluid and cleaner', i: 'i-gear', parts: [['p4', 'p4'], ['fluid'], ['pads2'], ['rot']] },
    { id: 'battery', t: 'Battery swap', d: 'Battery and protector', i: 'i-bat', parts: [['p3', 'p3'], ['terms']] },
    { id: 'wash', t: 'Wash and wax', d: 'Shampoo, wax, cloths', i: 'i-care', parts: [['p8', 'p8'], ['shampoo'], ['cloth']] }
  ];
  const partInfo = (k) => (PR[k] ? { n: PR[k].n, p: PR[k].now } : { n: EXTRA[k][0], p: EXTRA[k][1] });
  const CARS = { Toyota: { HiLux: [2015, 2016, 2017, 2018, 2019, 2020, 2021], Corolla: [2016, 2018, 2020, 2022], Camry: [2015, 2018, 2021] }, Ford: { Ranger: [2016, 2018, 2020, 2022], Focus: [2014, 2016, 2018] }, Mazda: { 'CX-5': [2016, 2018, 2020, 2022], Mazda3: [2015, 2017, 2019, 2021] }, Hyundai: { i30: [2015, 2017, 2019, 2021], Tucson: [2016, 2018, 2020] } };
  const OIL = { Petrol: ['5W-30', '5W-30', 'Full synthetic'], Diesel: ['5W-40', '7L', 'Diesel synthetic'], Hybrid: ['0W-20', '4.5L', 'Low-viscosity synthetic'] };
  const STORES = { 3: 'Clayton', 2: 'Parramatta', 4: 'Springwood', 5: 'Mile End', 6: 'Osborne Park', 0: 'Canberra City', 7: 'Moonah' };
  const STORE = () => state.store || 'Clayton';

  /* ---------- static render ---------- */
  $('#cat-strip').innerHTML = CATS.map(([n]) => `<li><a href="#cats">${n}</a></li>`).join('');
  $('#cat-tiles').innerHTML = CATS.map(([n, i]) => `<li><a href="#featured">${ico(i)}<span>${n}</span></a></li>`).join('');
  $('#trust').innerHTML = [['Find a store', 'i-pin'], ['Click and Collect', 'i-bat'], ['Home delivery', 'i-4wd'], ['Rego search', 'i-car'], ['Gift cards', 'i-seat'], ['Buy now pay later', 'i-tech']].map(([n, i]) => `<li><svg width="28" height="28" aria-hidden="true"><use href="#${i}"/></svg>${n}</li>`).join('');
  $('#job-cards').innerHTML = JOBS.map((j) => `<li><button class="job" type="button" data-job="${j.id}">${ico(j.i)}<strong>${j.t}</strong><small>${j.d}</small><em>Build my list &rarr;</em></button></li>`).join('');
  function renderProducts() {
    $('#products').innerHTML = P.map((p) => `<li class="pc"><div class="pc-art">${art[p.a]}<span class="fit"><svg width="14" height="14" aria-hidden="true"><use href="#i-check"/></svg>Fits your car</span></div><div class="pc-b"><span class="brandn">${p.b}</span><h3>${p.n}</h3><span class="price">${money(p.now)} <small class="was">now, was ${money(p.was)}</small></span><span class="save">Save ${money(p.was - p.now)}</span><span class="stock">Ready in 30 min at ${STORE()}</span><label class="cmpl"><input type="checkbox" data-cmp="${p.id}" ${state.compare.has(p.id) ? 'checked' : ''}> Compare</label><button class="btn" type="button" data-add="${p.id}">Add to cart</button></div></li>`).join('');
  }
  renderProducts();
  const stores = () => { $('#store-label').textContent = state.store ? `Store: ${state.store}` : 'Set my store'; renderProducts(); };

  /* ---------- fits-your-car ---------- */
  function setCar(txt) {
    state.car = txt;
    $('#fits-car').textContent = txt; $('#fits-bar').hidden = false; document.body.classList.add('has-car');
    $('#garage-btn span').textContent = 'My garage (1)';
    const sel = $('#o-car'); if (![...sel.options].some((o) => o.value === txt)) sel.add(new Option(txt, txt)); sel.value = txt;
    toast('Showing parts that fit your ' + txt);
  }
  $('#fits-clear').onclick = () => { state.car = null; $('#fits-bar').hidden = true; document.body.classList.remove('has-car'); $('#garage-btn span').textContent = 'My garage'; $('#t-rego').focus(); };

  /* ---------- finder tabs ---------- */
  const tabs = $$('[role=tab]');
  const pick = (t, focus) => tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; if (on && focus) x.focus(); });
  tabs.forEach((t, i) => { t.onclick = () => pick(t); t.onkeydown = (e) => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); pick(tabs[(i + k + tabs.length) % tabs.length], true); } }; });
  $('#p-rego').onsubmit = (e) => { e.preventDefault(); const v = $('#r-plate').value.trim(); if (v.length < 2) { $('#r-err').textContent = 'Enter your number plate.'; $('#r-plate').focus(); return; } $('#r-err').textContent = ''; setCar('2019 Toyota HiLux SR5'); };
  const mk = $('#m-make'), mo = $('#m-model'), yr = $('#m-year');
  mk.innerHTML = '<option value="">Choose make</option>' + Object.keys(CARS).map((m) => `<option>${m}</option>`).join('');
  mo.innerHTML = '<option value="">Choose model</option>'; yr.innerHTML = '<option value="">Choose year</option>';
  mk.onchange = () => { mo.innerHTML = '<option value="">Choose model</option>' + Object.keys(CARS[mk.value] || {}).map((m) => `<option>${m}</option>`).join(''); mo.disabled = !mk.value; yr.innerHTML = '<option value="">Choose year</option>'; yr.disabled = true; };
  mo.onchange = () => { yr.innerHTML = '<option value="">Choose year</option>' + ((CARS[mk.value] || {})[mo.value] || []).map((y) => `<option>${y}</option>`).join(''); yr.disabled = !mo.value; };
  $('#p-mmy').onsubmit = (e) => { e.preventDefault(); if (!mk.value || !mo.value || !yr.value) { $('#m-err').textContent = 'Choose a make, model and year.'; return; } $('#m-err').textContent = ''; setCar(`${yr.value} ${mk.value} ${mo.value}`); };
  $('#p-part').onsubmit = (e) => { e.preventDefault(); if (!$('#pt-type').value) { $('#pt-err').textContent = 'Choose a part type.'; return; } $('#pt-err').textContent = ''; toast('Showing ' + $('#pt-type').value.toLowerCase() + (state.car ? ' for your ' + state.car : '')); location.hash = '#featured'; };

  /* ---------- cart + drawer ---------- */
  const drawer = $('#drawer'); let lastFocus;
  function openDrawer(title, body, foot, trigger) { lastFocus = trigger || document.activeElement; $('#dr-title').textContent = title; $('#dr-body').innerHTML = body; $('#dr-foot').innerHTML = foot; drawer.hidden = $('#scrim').hidden = false; document.body.style.overflow = 'hidden'; $('#dr-close').focus(); }
  function closeDrawer() { drawer.hidden = $('#scrim').hidden = true; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $('#dr-close').onclick = closeDrawer; $('#scrim').onclick = closeDrawer;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!drawer.hidden) closeDrawer(); $('#store-pop').hidden = true; }
    if (e.key === 'Tab' && !drawer.hidden) { const f = $$('button,input,a[href]', drawer).filter((x) => !x.disabled); const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } } });
  const cartCount = () => Object.values(state.cart).reduce((a, b) => a + b, 0);
  const upd = () => { $('#cart-count').textContent = $('#cart-count2').textContent = cartCount(); };
  const addKey = (k, q = 1) => { state.cart[k] = (state.cart[k] || 0) + q; upd(); };
  function openCart(trigger) {
    const keys = Object.keys(state.cart);
    const total = keys.reduce((s, k) => s + partInfo(k).p * state.cart[k], 0);
    openDrawer('Your cart', keys.length ? `<ul class="chk">${keys.map((k) => `<li><label><span class="nm">${partInfo(k).n} &times; ${state.cart[k]}</span><span class="pr">${money(partInfo(k).p * state.cart[k])}</span></label></li>`).join('')}</ul>` : '<p>Your cart is empty. Add a part or pick a job.</p>',
      keys.length ? `<div class="tot"><span>Total</span><span>${money(total)}</span></div><p class="small">Concept only: there is no checkout.</p><button class="btn btn-lg" type="button" id="cart-clear">Clear cart</button>` : '', trigger);
    const c = $('#cart-clear'); if (c) c.onclick = () => { state.cart = {}; upd(); closeDrawer(); };
  }
  $$('#cart-btn,#mb-cart').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openCart(e.currentTarget); }));
  { const cs = $('#cart'); if (cs) cs.hidden = true; if (location.hash === '#cart') openCart($('#cart-btn')); } // the #cart section is only the no-JavaScript fallback; with JavaScript the link opens the cart panel
  function openJob(id, trigger) {
    const j = JOBS.find((x) => x.id === id);
    const rows = j.parts.map(([k]) => `<li><label><input type="checkbox" checked data-k="${k}" data-p="${partInfo(k).p}"><span class="nm">${partInfo(k).n}</span><span class="pr">${money(partInfo(k).p)}</span></label></li>`).join('');
    openDrawer(j.t, `<p>${state.car ? 'Checked for your ' + state.car + '.' : 'Tick what you need.'}</p><ul class="chk">${rows}</ul>`, `<div class="tot"><span>Total</span><span id="job-total"></span></div><button class="btn btn-lg" type="button" id="job-add">Add all to cart</button>`, trigger);
    const calc = () => { const t = $$('input:checked', drawer).reduce((s, i) => s + +i.dataset.p, 0); $('#job-total').textContent = money(t); $('#job-add').disabled = !t; };
    $$('input', drawer).forEach((i) => i.onchange = calc); calc();
    $('#job-add').onclick = () => { const ch = $$('input:checked', drawer); ch.forEach((i) => addKey(i.dataset.k)); closeDrawer(); toast(`${ch.length} parts added to your cart`); };
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]'); if (a) { addKey(a.dataset.add); toast(PR[a.dataset.add].n + ' added'); return; }
    const j = e.target.closest('[data-job]'); if (j) openJob(j.dataset.job, j);
  });
  $('#improve-open').onclick = (e) => openDrawer('What I improved', '<ol class="imp"><li>Slim top bar with Click &amp; Collect and a one-tap store picker.</li><li>One wide search bar with a clear garage and cart.</li><li>Hero finder: rego, make/model/year or part type.</li><li>A green "Fits your car" bar and ticks across the whole page.</li><li>One deal banner with a live countdown.</li><li>Shop by job: every part for a job in one tick-list.</li><li>Oil finder: viscosity, quantity and three matching oils.</li><li>Product cards with price, saving, fit and pick-up time.</li><li>Twelve category tiles with simple icons.</li><li>Oil change in four visual steps with one-tap add.</li><li>A 4WD banner with strong contrast.</li><li>Ask a mechanic with sample answers.</li><li>A simple rewards card.</li><li>Rego and service reminders.</li><li>A trust strip for stores, collection, delivery and pay later.</li></ol>', '<button class="btn btn-lg" type="button" id="imp-ok">Close</button>', e.currentTarget);
  document.addEventListener('click', (e) => { if (e.target.id === 'imp-ok') closeDrawer(); });

  /* ---------- compare ---------- */
  document.addEventListener('change', (e) => { const c = e.target.dataset && e.target.dataset.cmp; if (!c) return; e.target.checked ? state.compare.add(c) : state.compare.delete(c); const el = $('#cmp'); el.hidden = !state.compare.size; el.textContent = state.compare.size ? `Comparing ${state.compare.size}: ${[...state.compare].map((i) => PR[i].n.split(',')[0]).join(' vs ')}` + (state.compare.size < 2 ? ' (tick one more)' : '') : ''; });

  /* ---------- oil finder ---------- */
  ['2019 Toyota HiLux SR5', '2018 Ford Ranger', '2020 Mazda CX-5', '2017 Hyundai i30'].forEach((c) => $('#o-car').add(new Option(c, c)));
  $('#oil-form').onsubmit = (e) => {
    e.preventDefault(); const f = $('#o-fuel').value, [v, q, kind] = OIL[f], car = $('#o-car').value, vis = f === 'Petrol' ? '5W-30' : v, qty = f === 'Petrol' ? '5L' : q;
    const list = [['Veloce ' + kind + ' ' + vis, 'p1', 37], ['ClearFlow ' + vis + ' semi-synthetic', null, 29], ['Garagehand ' + vis + ' value', null, 21]];
    $('#oil-out').innerHTML = `<p><strong>${car}, ${f.toLowerCase()}:</strong></p><div class="rec"><div><b>${vis}</b><span>Viscosity</span></div><div><b>${qty}</b><span>Quantity</span></div></div><ul class="oils">${list.map(([n, id, p], i) => `<li><strong>${n}</strong><span class="price">${money(p)}</span>${i === 0 ? '<span class="save">Best match</span>' : ''}<button class="btn btn-sm" type="button" ${id ? `data-add="${id}"` : `data-oiltoast="${n}"`}>Add to cart</button></li>`).join('')}</ul>`;
  };
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-oiltoast]'); if (t) { EXTRA['oil:' + t.dataset.oiltoast] = [t.dataset.oiltoast, 25]; addKey('oil:' + t.dataset.oiltoast); toast('Added to cart'); } });

  /* ---------- store ---------- */
  const pop = $('#store-pop');
  const toggleStore = () => { pop.hidden = !pop.hidden; if (!pop.hidden) { $('#store-pc').focus(); window.scrollTo({ top: 0 }); } };
  $('#store-open').onclick = toggleStore; $('#mb-store').onclick = toggleStore;
  $('#store-form').onsubmit = (e) => { e.preventDefault(); const v = $('#store-pc').value.trim(); if (!/^\d{4}$/.test(v)) { $('#store-err').textContent = 'Enter a 4 digit postcode.'; return; } $('#store-err').textContent = ''; state.store = STORES[+v[0]] || 'Clayton'; pop.hidden = true; stores(); toast('Store set to ' + state.store + ' (fictional)'); };

  /* ---------- search ---------- */
  $('#search-form').onsubmit = (e) => { e.preventDefault(); const q = $('#q').value.trim().toLowerCase(); if (!q) { $('#q').focus(); return; } const hit = P.filter((p) => (p.n + p.b).toLowerCase().includes(q)); toast(hit.length ? `${hit.length} match${hit.length > 1 ? 'es' : ''}: ${hit.map((h) => h.n.split(',')[0]).slice(0, 2).join(', ')}` : 'No match in this demo. Try "oil" or "battery".'); if (hit.length) location.hash = '#featured'; };

  /* ---------- countdown ---------- */
  const end = Date.now() + (5 * 3600 + 42 * 60) * 1000;
  const tick = () => { let s = Math.max(0, Math.floor((end - Date.now()) / 1000)); const p = (n) => String(n).padStart(2, '0'); $('#cd-h').textContent = p(Math.floor(s / 3600)); $('#cd-m').textContent = p(Math.floor(s % 3600 / 60)); $('#cd-s').textContent = p(s % 60); };
  tick(); setInterval(tick, 1000);

  /* ---------- simple forms ---------- */
  const em = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  $('#ask-form').onsubmit = (e) => { e.preventDefault(); const ok = $('#a-ok'); ok.hidden = true; if (!$('#a-car').value.trim() || $('#a-q').value.trim().length < 8) { $('#a-err').textContent = 'Add your vehicle and a short question.'; return; } $('#a-err').textContent = ''; ok.hidden = false; ok.textContent = 'Thanks. A mechanic will reply by email within one business day. (Demo: nothing was sent.)'; };
  $('#rw-form').onsubmit = (e) => { e.preventDefault(); if (!em.test($('#rw-email').value.trim())) { $('#rw-err').textContent = 'That email does not look right.'; return; } $('#rw-err').textContent = ''; $('#rw-ok').hidden = false; $('#rw-ok').textContent = 'You are in. 100 welcome points added. (Demo.)'; };
  $('#rem-form').onsubmit = (e) => { e.preventDefault(); if (!em.test($('#rem-email').value.trim()) || (!$('#rem-rego').value && !$('#rem-svc').value)) { $('#rem-err').textContent = 'Add a valid email and at least one date.'; return; } $('#rem-err').textContent = ''; $('#rem-ok').hidden = false; $('#rem-ok').textContent = 'Done. We will email you two weeks before. (Demo.)'; };

  /* ---------- cookie ---------- */
  const ck = $('#cookie'); let seen = null; try { seen = localStorage.getItem('tc-cookie'); } catch (_) {}
  if (!seen) ck.hidden = false;
  $$('[data-cookie]', ck).forEach((b) => b.onclick = () => { ck.hidden = true; try { localStorage.setItem('tc-cookie', b.dataset.cookie); } catch (_) {} });
})();
