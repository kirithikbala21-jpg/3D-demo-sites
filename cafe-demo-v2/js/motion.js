// Smooth scrolling (Lenis, self-hosted) plus the scroll helpers every other module uses.
// Lenis starts only when the visitor has not asked for reduced motion; without it the browser's own scrolling is used.
import { $, $$, reduceMotion } from './util.js';

let lenis = null;
const root = document.documentElement;

if (!reduceMotion && typeof globalThis.Lenis === 'function') {
  try {
    lenis = new globalThis.Lenis({ duration: 1.05, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  } catch (_) { lenis = null; }
}

/** Offset used by anchors: the same space the CSS leaves for the sticky header (scroll-padding-top). */
const offset = () => parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;

/** Scroll the page to a vertical position (smoothly unless the visitor prefers reduced motion). */
export function scrollToY(y, { immediate = false } = {}) {
  y = Math.max(0, Math.round(y));
  if (lenis) lenis.scrollTo(y, { immediate, force: true });
  else window.scrollTo({ top: y, behavior: reduceMotion || immediate ? 'auto' : 'smooth' });
}

/** Scroll an element to the top (below the header) or the middle of the screen. */
export function scrollToEl(el, { block = 'start', immediate = false } = {}) {
  const r = el.getBoundingClientRect();
  const y = block === 'center' ? window.scrollY + r.top - (window.innerHeight / 2 - r.height / 2) : window.scrollY + r.top - offset();
  scrollToY(y, { immediate });
}

/** Move keyboard focus to a target without scrolling again (so the skip link and in-page links land properly). */
function focusTarget(el) {
  if (!el.matches('a[href], button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

/* In-page links (#top, #facts, #main, page.html#hash on the current page) scroll through the same helper. */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
  const id = decodeURIComponent(url.hash.slice(1));
  const el = id === 'top' ? document.body : document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  if (id === 'top') scrollToY(0); else scrollToEl(el);
  history.pushState(null, '', url.hash);
  if (id !== 'top') focusTarget(el);
  // Tab deep links (menu categories) listen for this.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
});

/* Pause smooth scrolling while a modal, the full-screen menu, search or the order drawer is open. */
if (lenis) {
  const locked = () => ['no-scroll', 'cart-open', 'search-open'].some((c) => document.body.classList.contains(c));
  const sync = () => { if (locked()) lenis.stop(); else lenis.start(); };
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  sync();
  // Scrollable panels keep their own wheel scrolling.
  $$('.chat-log, .cart-body, .mobile-nav, .search, .tablist').forEach((el) => el.setAttribute('data-lenis-prevent', ''));
}

/* Photos: a slow, subtle zoom as they cross the screen (skipped for reduced motion; the CSS also disables it). */
(() => {
  const photos = $$('[data-photo]');
  if (!photos.length || reduceMotion || !('IntersectionObserver' in window)) return;
  const live = new Set();
  const update = () => {
    live.forEach((el) => {
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
      el.style.setProperty('--pz', p.toFixed(3));
    });
  };
  const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) live.add(e.target); else live.delete(e.target); }); update(); }, { rootMargin: '10% 0px' });
  photos.forEach((el) => io.observe(el));
  let queued = false;
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } }, { passive: true });
})();

export const smooth = { get active() { return !!lenis; }, get lenis() { return lenis; } };
