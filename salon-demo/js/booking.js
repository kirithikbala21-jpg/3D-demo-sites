// Booking widget. FRONT END ONLY: nothing is sent anywhere. Steps: service, stylist, day, time, details, confirmation.
// Availability is a deterministic demo (a hash of day + stylist + slot), so it looks the same on every visit.
// Bookings are saved in this browser only (localStorage key "ml-bookings").
import { $, $$, SITE, store, DAY_NAMES, MONTHS, fmtTime, hoursFor, isOpenDay, dateKey, parseKey, scrollToEl, reduceMotion } from './util.js';

const root = $('#booking-app');
if (root) {
  const B = SITE.booking || {};
  const SLOT = B.slotMinutes || 30, AHEAD = B.daysAhead || 7, TAKEN = B.takenPercent || 38;
  const STEP_NAMES = ['Service', 'Stylist', 'Day', 'Time', 'Details'];
  const svcBySlug = Object.fromEntries(SITE.services.map((s) => [s.slug, s]));
  const styBySlug = Object.fromEntries(SITE.stylists.map((s) => [s.slug, s]));
  const money = (n) => '$' + n.toLocaleString('en-AU');
  const state = { step: 0, service: null, stylist: 'any', stylistChosen: false, date: null, time: null, done: null };

  /* ---------- availability (deterministic demo) ---------- */
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };
  // busy blocks are an hour long (two 30-minute slots), as a real diary would be
  const isTaken = (slug, key, mins) => hash(`${key}|${slug}|${Math.floor(mins / 60)}`) % 100 < TAKEN;
  const need = () => Math.ceil(svcBySlug[state.service].min / SLOT);
  const freeStylists = (key, mins, n) => {
    const pool = state.stylist === 'any' ? SITE.stylists.map((s) => s.slug) : [state.stylist];
    return pool.filter((slug) => { for (let j = 0; j < n; j++) if (isTaken(slug, key, mins + j * SLOT)) return false; return true; });
  };
  const nowInfo = () => { const n = new Date(); return { key: dateKey(n), mins: n.getHours() * 60 + n.getMinutes(), date: n }; };
  /** Start times offered on a day for the chosen service (those that finish before closing), each with a state. */
  function slotsOn(key) {
    const d = parseKey(key), h = hoursFor(d.getDay()), n = need(), now = nowInfo();
    if (!isOpenDay(d.getDay())) return [];
    const out = [];
    for (let m = h.open * 60; m + n * SLOT <= h.close * 60; m += SLOT) {
      let reason = null;
      if (key === now.key && m <= now.mins) reason = 'passed';
      else if (!freeStylists(key, m, n).length) reason = 'taken';
      out.push({ mins: m, reason });
    }
    return out;
  }
  const dayHasFuture = (key) => {
    const d = parseKey(key), h = hoursFor(d.getDay()), now = nowInfo();
    if (!isOpenDay(d.getDay())) return false;
    const n = need();
    for (let m = h.open * 60; m + n * SLOT <= h.close * 60; m += SLOT) if (!(key === now.key && m <= now.mins)) return true;
    return false;
  };

  /* ---------- phone and name checks ---------- */
  function auPhone(v) {
    let d = v.replace(/[\s\-().]/g, '');
    if (/^\+61/.test(d)) d = '0' + d.slice(3); else if (/^61\d{9}$/.test(d)) d = '0' + d.slice(2);
    if (!/^\d+$/.test(d)) return null;
    return (/^04\d{8}$/.test(d) || /^0[2378]\d{8}$/.test(d)) ? d : null;
  }
  const prettyPhone = (d) => (d.startsWith('04') ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`);

  /* ---------- markup ---------- */
  const optg = SITE.categories.map((c) => `<optgroup label="${c.name}">${SITE.services.filter((s) => s.cat === c.id).map((s) => `<option value="${s.slug}">${s.name}, from ${money(s.from)} (${s.min} min)</option>`).join('')}</optgroup>`).join('');
  const stylistOpts = [{ slug: 'any', name: 'No preference', speciality: 'First available stylist' }, ...SITE.stylists].map((s, i) =>
    `<label class="pick"><input type="radio" name="stylist" value="${s.slug}"${i === 0 ? ' checked' : ''}><span><strong>${s.name}</strong><small>${s.speciality}</small></span></label>`).join('');
  root.insertAdjacentHTML('beforeend', `
    <div class="bk-js">
      <ol class="bk-steps" aria-label="Booking steps">${STEP_NAMES.map((n, i) => `<li data-i="${i}"><span class="n" aria-hidden="true">${i + 1}</span><span class="t">${n}</span><span class="sr-only"> step ${i + 1} of 5</span></li>`).join('')}</ol>
      <div class="bk-summary" id="bk-summary"></div>
      <p class="sr-only" role="status" id="bk-live"></p>
      <section class="bk-panel" data-step="0" aria-labelledby="bk-h0">
        <h3 class="bk-h" id="bk-h0" tabindex="-1">Choose a service</h3>
        <label class="lbl" for="bk-service">Service</label>
        <select id="bk-service" name="service"><option value="">Select a service</option>${optg}</select>
        <p class="bk-meta" id="bk-svc-meta" aria-live="polite"></p>
        <div class="bk-nav"><button type="button" class="btn btn-primary btn-lg" data-next disabled>Continue</button></div>
      </section>
      <section class="bk-panel" data-step="1" aria-labelledby="bk-h1" hidden>
        <fieldset><legend id="bk-h1" tabindex="-1">Choose a stylist</legend><div class="pick-grid">${stylistOpts}</div></fieldset>
        <div class="bk-nav"><button type="button" class="btn btn-ghost btn-lg" data-back>Back</button><button type="button" class="btn btn-primary btn-lg" data-next>Continue</button></div>
      </section>
      <section class="bk-panel" data-step="2" aria-labelledby="bk-h2" hidden>
        <fieldset><legend id="bk-h2" tabindex="-1">Choose a day</legend><div class="days" id="bk-days"></div></fieldset>
        <p class="small">Closed days cannot be selected. Swipe to see more days.</p>
        <div class="bk-nav"><button type="button" class="btn btn-ghost btn-lg" data-back>Back</button><button type="button" class="btn btn-primary btn-lg" data-next disabled>Continue</button></div>
      </section>
      <section class="bk-panel" data-step="3" aria-labelledby="bk-h3" hidden>
        <fieldset><legend id="bk-h3" tabindex="-1">Choose a time</legend><div class="times" id="bk-times"></div></fieldset>
        <p class="small times-note" id="bk-times-note"></p>
        <div class="bk-nav"><button type="button" class="btn btn-ghost btn-lg" data-back>Back</button><button type="button" class="btn btn-primary btn-lg" data-next disabled>Continue</button></div>
      </section>
      <section class="bk-panel" data-step="4" aria-labelledby="bk-h4" hidden>
        <h3 class="bk-h" id="bk-h4" tabindex="-1">Your details</h3>
        <form id="bk-form" novalidate>
          <div class="field"><label for="bk-name">Full name</label><input id="bk-name" name="name" type="text" autocomplete="name" required aria-describedby="bk-name-err"><p class="err" id="bk-name-err" hidden></p></div>
          <div class="field"><label for="bk-phone">Mobile or phone number</label><input id="bk-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0412 345 678" required aria-describedby="bk-phone-err"><p class="err" id="bk-phone-err" hidden></p></div>
          <p class="small">Demo only: your details stay in this browser and are not sent anywhere.</p>
          <div class="bk-nav"><button type="button" class="btn btn-ghost btn-lg" data-back>Back</button><button type="submit" class="btn btn-primary btn-lg">Confirm booking</button></div>
        </form>
      </section>
      <section class="bk-panel bk-done" data-step="done" aria-labelledby="bk-hd" hidden></section>
    </div>`);
  const $svc = $('#bk-service'), panels = $$('.bk-panel', root);
  const live = $('#bk-live');

  /* ---------- rendering ---------- */
  const dayLabel = (d) => `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  function renderDays() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const html = [];
    for (let i = 0; i < AHEAD; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const key = dateKey(d), open = state.service ? dayHasFuture(key) : isOpenDay(d.getDay());
      const closedWord = isOpenDay(d.getDay()) ? 'Full' : 'Closed';
      html.push(`<label class="pick"><input type="radio" name="day" value="${key}"${open ? '' : ' disabled'}${state.date === key ? ' checked' : ''}${open ? '' : ' data-reason="closed"'}><span><span class="wd">${i === 0 ? 'Today' : DAY_NAMES[d.getDay()].slice(0, 3)}</span><span class="dn">${d.getDate()}</span><span class="mo">${MONTHS[d.getMonth()].slice(0, 3)}</span>${open ? '' : `<span class="cl">${closedWord}</span>`}<span class="sr-only">, ${dayLabel(d)}${open ? '' : ', unavailable'}</span></span></label>`);
    }
    $('#bk-days').innerHTML = html.join('');
    if (state.date && !$(`input[name=day][value="${state.date}"]:not(:disabled)`, root)) { state.date = null; state.time = null; }
    nextBtn(2).disabled = !state.date;
  }
  function renderTimes() {
    if (!state.date) return;
    const slots = slotsOn(state.date);
    const grid = $('#bk-times');
    $('#bk-h3').textContent = `Choose a time on ${dayLabel(parseKey(state.date))}`;
    if (state.time !== null && !slots.some((s) => s.mins === state.time && !s.reason)) state.time = null;
    grid.innerHTML = slots.map((s) => `<label class="pick"><input type="radio" name="time" value="${s.mins}"${s.reason ? ` disabled data-reason="${s.reason}"` : ''}${state.time === s.mins ? ' checked' : ''}><span>${fmtTime(s.mins)}${s.reason ? `<span class="sr-only">, ${s.reason}</span>` : ''}</span></label>`).join('');
    const free = slots.filter((s) => !s.reason).length;
    $('#bk-times-note').textContent = free ? 'Crossed-out times are taken or have passed.' : 'No times left on this day. Please go back and choose another day.';
    nextBtn(3).disabled = state.time === null;
  }
  const nextBtn = (i) => $('[data-next]', panels[i]);
  function chips() {
    const out = [];
    if (state.service) { const s = svcBySlug[state.service]; out.push(`${s.name}, from ${money(s.from)}`); }
    if (state.step >= 2 && state.service) out.push(state.stylist === 'any' ? 'No preference' : styBySlug[state.stylist].name);
    if (state.date && state.step >= 3) out.push(dayLabel(parseKey(state.date)));
    if (state.time !== null && state.step >= 4) out.push(fmtTime(state.time));
    $('#bk-summary').innerHTML = out.map((t) => `<span class="bk-chip">${t}</span>`).join('');
  }
  function syncService() {
    $svc.value = state.service || '';
    const meta = $('#bk-svc-meta');
    if (state.service) { const s = svcBySlug[state.service]; meta.textContent = `${s.name}: from ${money(s.from)}, about ${s.min} minutes. Final price confirmed at consultation.`; } else meta.textContent = '';
    nextBtn(0).disabled = !state.service;
    const r = $(`input[name=stylist][value="${state.stylist}"]`, root); if (r) r.checked = true;
  }
  function go(step, { focus = true, scroll = true } = {}) {
    state.step = step;
    panels.forEach((p) => { p.hidden = p.dataset.step !== String(step); });
    $$('.bk-steps li', root).forEach((li) => {
      const i = Number(li.dataset.i);
      if (i === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.classList.toggle('done', i < step || step === 'done');
    });
    if (step === 2) renderDays();
    if (step === 3) renderTimes();
    chips();
    const panel = panels.find((p) => p.dataset.step === String(step));
    if (typeof step === 'number') live.textContent = `Step ${step + 1} of 5: ${STEP_NAMES[step]}`;
    if (focus) { const h = $('[tabindex="-1"]', panel); if (h) h.focus({ preventScroll: true }); }
    if (scroll) scrollToEl(root);
  }

  /* ---------- events ---------- */
  $svc.addEventListener('change', () => { state.service = $svc.value || null; syncService(); chips(); });
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'stylist') { state.stylist = t.value; state.stylistChosen = true; }
    if (t.name === 'day') { state.date = t.value; state.time = null; nextBtn(2).disabled = false; }
    if (t.name === 'time') { state.time = Number(t.value); nextBtn(3).disabled = false; }
  });
  root.addEventListener('click', (e) => {
    const nx = e.target.closest('[data-next]'), bk = e.target.closest('[data-back]');
    if (nx && !nx.disabled) go(state.step + 1);
    if (bk) go(state.step - 1);
  });
  const fail = (input, errEl, msg) => { errEl.textContent = msg; errEl.hidden = false; input.setAttribute('aria-invalid', 'true'); };
  const clear = (input, errEl) => { errEl.hidden = true; input.removeAttribute('aria-invalid'); };
  $('#bk-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#bk-name'), phone = $('#bk-phone'), ne = $('#bk-name-err'), pe = $('#bk-phone-err');
    clear(name, ne); clear(phone, pe);
    let first = null;
    if (!/^[A-Za-z][A-Za-z '’.-]{1,59}$/.test(name.value.trim())) { fail(name, ne, 'Please enter your name (letters only, at least 2).'); first = first || name; }
    const ph = auPhone(phone.value);
    if (!ph) { fail(phone, pe, 'Please enter an Australian phone number, like 0412 345 678 or 03 5550 0188.'); first = first || phone; }
    if (first) { first.focus(); return; }
    // pick the stylist who is free (first available when "No preference")
    const free = freeStylists(state.date, state.time, need());
    const assigned = free[0] || (state.stylist === 'any' ? SITE.stylists[0].slug : state.stylist);
    const ref = 'ML-' + hash(name.value + ph + Date.now() + Math.random()).toString(36).toUpperCase().slice(0, 6).padStart(6, '0');
    const s = svcBySlug[state.service];
    const booking = { ref, service: s.slug, serviceName: s.name, from: s.from, minutes: s.min, stylist: assigned, stylistName: styBySlug[assigned].name, date: state.date, time: fmtTime(state.time), name: name.value.trim(), phone: ph, created: new Date().toISOString(), demo: true };
    try { const all = JSON.parse(store.get('ml-bookings') || '[]'); all.push(booking); store.set('ml-bookings', JSON.stringify(all.slice(-25))); } catch (err) { store.set('ml-bookings', JSON.stringify([booking])); }
    state.done = booking;
    const first1 = booking.name.split(/\s+/)[0];
    const end = fmtTime(state.time + Math.ceil(s.min / SLOT) * SLOT);
    const done = $('.bk-done', root);
    done.innerHTML = `<h3 class="bk-h" id="bk-hd" tabindex="-1">You are all set, ${first1.replace(/[<>&]/g, '')}.</h3>
      <p class="bk-ref" aria-label="Booking reference ${ref}">${ref}</p>
      <dl class="bk-sum">
        <div><dt>Service</dt><dd>${s.name}, from ${money(s.from)} (${s.min} min)</dd></div>
        <div><dt>Stylist</dt><dd>${booking.stylistName}${state.stylist === 'any' ? ' (first available)' : ''}</dd></div>
        <div><dt>When</dt><dd>${dayLabel(parseKey(state.date))}, ${booking.time} to ${end}</dd></div>
        <div><dt>Name</dt><dd>${booking.name.replace(/[<>&]/g, '')}</dd></div>
        <div><dt>Phone</dt><dd>${prettyPhone(ph)}</dd></div>
      </dl>
      <p class="bk-demo"><strong>This is a demo, no real booking was made.</strong> Nothing was sent to a salon. Final price confirmed at consultation.</p>
      <button type="button" class="btn btn-ghost btn-lg" data-restart>Make another booking</button>`;
    go('done');
  });
  root.addEventListener('click', (e) => { if (e.target.closest('[data-restart]')) reset(); });
  function reset() {
    Object.assign(state, { service: null, stylist: 'any', stylistChosen: false, date: null, time: null, done: null });
    $('#bk-form').reset(); $$('.err', root).forEach((x) => { x.hidden = true; }); $$('[aria-invalid]', root).forEach((x) => x.removeAttribute('aria-invalid'));
    syncService(); go(0);
  }

  /* ---------- preselect: "Book" buttons, "Book with ..." buttons and ?service=&stylist= ---------- */
  function preselect({ service, stylist }, opts) {
    if (state.step === 'done') { Object.assign(state, { date: null, time: null, done: null }); $('#bk-form').reset(); }
    if (service && svcBySlug[service]) state.service = service;
    if (stylist && styBySlug[stylist]) { state.stylist = stylist; state.stylistChosen = true; }
    state.date = null; state.time = null;
    syncService();
    const step = !state.service ? 0 : (state.stylistChosen ? 2 : 1);
    go(step, opts);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-service], a[data-stylist]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    preselect({ service: a.dataset.service, stylist: a.dataset.stylist }, { focus: true, scroll: true });
    const hint = a.dataset.service ? 'service=' + a.dataset.service : 'stylist=' + a.dataset.stylist;
    try { history.replaceState(null, '', '?' + hint + '#book'); } catch (err) { /* ignore */ }
  });
  const params = new URLSearchParams(location.search);
  syncService();
  if (params.get('service') || params.get('stylist')) preselect({ service: params.get('service'), stylist: params.get('stylist') }, { focus: false, scroll: false });
  else go(0, { focus: false, scroll: false });
}
