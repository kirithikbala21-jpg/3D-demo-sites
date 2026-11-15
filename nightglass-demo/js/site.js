import { init } from './footage.js';
const S = window.SITE || {}, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* reveals: start the moment an element enters the screen */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
$$('.rise').forEach((el) => io.observe(el));

/* hero: scroll position drives the tint sweep, on the footage when it exists and on the drawn car when it does not */
const hero = $('.hero'), stage = $('.stage');
const footage = await init();
if (stage.classList.contains('has-footage')) $('.scene').hidden = true;
const tick = () => {
  const r = hero.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight), p = Math.min(1, Math.max(0, -r.top / span));
  const sweep = Math.min(1, Math.max(0, (p - 0.14) / 0.7));
  stage.style.setProperty('--p', p.toFixed(3)); stage.style.setProperty('--tint', (sweep * 0.86).toFixed(3)); stage.style.setProperty('--beam', (sweep * 1.3 - 0.15).toFixed(3));
  footage.scrub(sweep);
};
if (!reduce) { addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick, { passive: true }); tick(); }
requestAnimationFrame(() => stage.style.setProperty('--lamp', 1));

/* shade picker */
const door = $('[data-door]'), box = $('[data-shades]');
(S.shades || []).forEach((sh, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = sh.label; b.setAttribute('aria-pressed', i === 1);
  b.addEventListener('click', () => { $$('button', box).forEach((x) => x.setAttribute('aria-pressed', x === b)); door.style.setProperty('--tint', sh.dark); });
  box.append(b); if (i === 1) door.style.setProperty('--tint', sh.dark);
});

/* quote form: a concept site sends nothing */
const sel = $('[data-services]'); (S.services || []).forEach((t) => sel.add(new Option(t)));
$$('[data-suburb]').forEach((el) => { if (S.suburb) el.textContent = S.suburb; });
$('[data-quote]').addEventListener('submit', (e) => {
  e.preventDefault(); const f = e.currentTarget, out = $('.sent', f);
  const bad = $$('[required]', f).find((i) => !i.value.trim());
  if (bad) { out.textContent = 'Please fill in your car and your mobile.'; bad.focus(); return; }
  out.textContent = S.quoteNote || 'Nothing was sent.';
});
