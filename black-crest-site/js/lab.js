// The Concept Lab: pick a trade, a business name, a mood and features, and a phone (plus a laptop on desktop)
// preview redraws as you go. Layout changes animate with GSAP Flip. Nothing leaves the browser until the visitor
// presses "Send me this concept": then the choices go to the contact page in this tab's sessionStorage, never the URL.
import { store } from './forms.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const TRADES = {
  barber: { label: 'Barber', name: 'Your Barbershop', img: 'barbers', h: 'Sharp cuts, no waiting.', cta: 'Book a chair', list: 'Prices', items: ['Haircut', 'Skin fade', 'Beard trim', 'Hot towel shave'] },
  cafe: { label: 'Café', name: 'Your Café', img: 'cafes', h: 'Good coffee, all day.', cta: 'Order ahead', list: 'Menu', items: ['Espresso', 'Filter', 'Breakfast', 'Lunch'] },
  gym: { label: 'Gym', name: 'Your Gym', img: 'gyms', h: 'Train with people who care.', cta: 'Free trial', list: 'Classes', items: ['Strength', 'Conditioning', 'Boxing', 'Open gym'] },
  trades: { label: 'Trades', name: 'Your Trade Co.', img: 'trades', h: 'Fast, tidy and on time.', cta: 'Call now', list: 'Services', items: ['Blocked drains', 'Hot water', 'Leaks', 'Gas fitting'] },
  salon: { label: 'Salon', name: 'Your Salon', img: 'salons', h: 'Calm, careful colour.', cta: 'Book online', list: 'Services', items: ['Cut and style', 'Colour', 'Treatments', 'Blow-dry'] }
};
const MOODS = {
  obsidian: { label: 'Obsidian & Gold', bg: '#0D0E12', ink: '#E4E6ED', card: '#1A1C23', line: 'rgba(228,230,237,.14)', accent: '#D4AF37', on: '#0D0E12', font: 'var(--serif)' },
  espresso: { label: 'Espresso & Cream', bg: '#2B1E17', ink: '#F3E9DC', card: '#3A2A20', line: 'rgba(243,233,220,.16)', accent: '#E9D9C2', on: '#2B1E17', font: 'var(--serif)' },
  stone: { label: 'Stone & Sage', bg: '#E7E4DC', ink: '#23271F', card: '#F4F2EC', line: 'rgba(35,39,31,.14)', accent: '#6F7F63', on: '#F4F2EC', font: 'var(--sans)' }
};
const FEATURES = { booking: 'Online booking', menu: 'Menu or price list', gallery: 'Gallery', reviews: 'Reviews section', map: 'Map and hours' };

// one mock homepage; every section exists once and is shown or hidden, so Flip can move it
function mock() {
  const el = (tag, cls, html = '') => Object.assign(document.createElement(tag), { className: cls, innerHTML: html });
  const m = el('div', 'm');
  m.append(el('div', 'm-nav', '<span class="m-logo"></span><span class="m-btn" data-cta></span>'));
  const body = el('div', 'm-body');
  body.append(
    el('div', 'm-hero', '<img alt="" decoding="async"><div class="m-hero-copy"><p class="m-h"></p><span class="m-btn" data-cta></span></div>'),
    el('section', 'm-sec', '<h4>Pick a time</h4><div class="m-slots"><span>Morning</span><span>Afternoon</span><span>Evening</span></div>'),
    el('section', 'm-sec', '<h4 data-list></h4><ul class="m-rows"></ul>'),
    el('section', 'm-sec', '<h4>Gallery</h4><div class="m-gallery"><i></i><i></i><i></i></div>'),
    el('section', 'm-sec', '<h4>Reviews</h4><p class="m-quote">Your real Google reviews, shown here.</p>'),
    el('section', 'm-sec', '<h4>Find us</h4><div class="m-map"><i></i><p class="m-open"><b>Open now</b><br>Your hours, your address</p></div>')
  );
  [...body.children].slice(1).forEach((s, i) => { s.dataset.feature = ['booking', 'menu', 'gallery', 'reviews', 'map'][i]; });
  m.append(body);
  return m;
}

export function initLab({ reduce }) {
  const lab = $('[data-lab]'); if (!lab) return;
  const form = $('[data-lab-form]', lab), status = $('[data-lab-status]', lab), base = lab.dataset.base || '';
  const screens = $$('[data-lab-screen]', lab).map((s) => { const m = mock(); s.append(m); return m; });
  const Flip = window.Flip, gsap = window.gsap;
  if (Flip && gsap) gsap.registerPlugin(Flip);

  const read = () => ({
    trade: ($('input[name=lab-trade]:checked', form) || {}).value || 'barber',
    name: $('#lab-name', form).value.trim(),
    mood: ($('input[name=lab-mood]:checked', form) || {}).value || 'obsidian',
    features: $$('input[name=lab-feature]:checked', form).map((i) => i.value)
  });

  let lastTrade = null;
  const render = (animate) => {
    const c = read(), t = TRADES[c.trade], mo = MOODS[c.mood];
    const secs = screens.flatMap((m) => $$('.m-sec, .m-hero', m));
    const state = animate && Flip && !reduce ? Flip.getState(secs) : null;
    screens.forEach((m) => {
      const scr = m.parentElement;
      Object.entries({ bg: mo.bg, ink: mo.ink, card: mo.card, line: mo.line, accent: mo.accent, on: mo.on, font: mo.font }).forEach(([k, v]) => scr.style.setProperty('--m-' + k, v));
      $('.m-logo', m).textContent = c.name || t.name;
      $$('[data-cta]', m).forEach((b) => { b.textContent = t.cta; });
      $('.m-h', m).textContent = t.h;
      $('[data-list]', m).textContent = t.list;
      $('.m-rows', m).innerHTML = t.items.map((x) => `<li><span>${x}</span><span>Your price</span></li>`).join('');
      const img = $('.m-hero img', m);
      if (lastTrade !== c.trade) img.src = `${base}assets/chapters/${t.img}-${t.img === 'trades' || t.img === 'salons' ? 's' : 'l'}.webp`;
      $$('.m-gallery i', m).forEach((g, i) => { g.style.backgroundImage = `url("${base}assets/chapters/${['barbers', 'cafes', 'gyms', 'trades', 'salons'].filter((x) => x !== t.img)[i]}-l.webp")`; });
      $$('[data-feature]', m).forEach((s) => { s.hidden = !c.features.includes(s.dataset.feature); });
    });
    lastTrade = c.trade;
    if (state) Flip.from(state, { duration: 0.6, ease: 'expo.out', nested: true, onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.5 }), onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.25 }) });
    status.textContent = `Preview updated: ${t.label}, ${c.name || 'no name yet'}, ${mo.label}, ${c.features.length ? c.features.map((f) => FEATURES[f]).join(', ') : 'no extra features'}.`;
  };

  let typing = 0;
  form.addEventListener('change', (e) => { if (e.target.id !== 'lab-name') render(true); });
  $('#lab-name', form).addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(() => render(false), 250); });
  form.addEventListener('submit', (e) => e.preventDefault());
  render(false);
  status.textContent = ''; // stay quiet until the visitor changes something

  $('[data-lab-send]', lab).addEventListener('click', () => {
    const c = read();
    store.set('bc-lab', JSON.stringify({ trade: TRADES[c.trade].label, name: c.name || 'not set yet', mood: MOODS[c.mood].label, features: c.features.map((f) => FEATURES[f]) }));
    location.href = base + 'contact.html#lab';
  });
}
