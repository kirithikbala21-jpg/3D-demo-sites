// Quiet motion: soft fade-up reveals (400-600 ms) and a very slow parallax on hero, gallery and photo blocks.
// Both are off for reduced-motion visitors, and everything stays visible if JavaScript or the observer fails.
import { $, $$, reduceMotion, clamp } from './util.js';

/* ---------- reveal ---------- */
(() => {
  const items = $$('.reveal'); if (!items.length || reduceMotion || !('IntersectionObserver' in window)) return;
  const vh = window.innerHeight;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -6% 0px' });
  items.forEach((el) => { if (el.getBoundingClientRect().top > vh * 0.92) { el.classList.add('pre'); io.observe(el); } });
  setTimeout(() => items.forEach((el) => el.classList.add('in')), 12000); // safety net
})();

/* ---------- parallax: one rAF-throttled handler, tiny translate only ---------- */
(() => {
  if (reduceMotion) return;
  const items = $$('[data-parallax]').map((el) => ({ el, px: $('.px', el), k: Number(el.dataset.parallax) || 8 })).filter((x) => x.px);
  if (!items.length) return;
  document.documentElement.classList.add('px-on');
  let queued = false;
  const update = () => {
    queued = false;
    const vh = window.innerHeight;
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) continue;
      const t = clamp(((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
      it.px.style.setProperty('--py', (-t * it.k).toFixed(1) + 'px');
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
})();
