// Smooth scrolling with Lenis (self-hosted, pinned to 1.1.18). Off for reduced-motion visitors; native scrolling stays as the fallback.
import { reduceMotion } from './util.js';

(() => {
  if (reduceMotion || typeof window.Lenis !== 'function') return;
  const lenis = new window.Lenis({ duration: 1.0, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true, syncTouch: false });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  window.__lenis = lenis;

  // Freeze page scrolling while the menu is open.
  const sync = () => (document.body.classList.contains('no-scroll') ? lenis.stop() : lenis.start());
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // In-page links glide instead of jumping.
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const target = id === 'top' || id === '' ? document.body : document.getElementById(id);
    if (!target) return;
    if (a.closest('.menu')) return; // the menu closes itself first, then the browser scrolls
    e.preventDefault();
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
    lenis.scrollTo(id === 'top' || id === '' ? 0 : target, { offset: -(header + 8), duration: 1.0 });
    if (id && id !== 'top') history.replaceState(null, '', '#' + id);
    if (target !== document.body) { target.setAttribute('tabindex', target.getAttribute('tabindex') || '-1'); target.focus({ preventScroll: true }); }
  });
})();
