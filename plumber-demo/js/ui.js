// Announcement bar, full-screen menu, cookie notice and the quiet reveal animation.
import { $, $$, reduceMotion, store } from './util.js';

/* ---------- Announcement bar (localStorage wp-announce; the <head> script has already hidden it if dismissed) ---------- */
(() => {
  const btn = $('#announce-close'); if (!btn) return;
  btn.addEventListener('click', () => { document.documentElement.classList.add('no-announce'); store.set('wp-announce', 'off'); });
})();

/* ---------- Full-screen menu ---------- */
(() => {
  const toggle = $('.nav-toggle'), menu = $('#menu'); if (!toggle || !menu) return;
  const inertTargets = () => ['#main', '#footer', '#sticky-bar', '#announce', '#cookie'].map((s) => $(s)).filter(Boolean);
  const set = (open) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('no-scroll', open);
    inertTargets().forEach((el) => { el.inert = open; });
    if (open) $('a', menu).focus();
  };
  toggle.addEventListener('click', () => set(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { set(false); toggle.focus(); return; }
    if (e.key === 'Tab') { // keep focus inside the menu and its toggle button
      const items = [toggle, ...$$('a', menu)];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
  window.matchMedia('(min-width: 1040px)').addEventListener('change', (m) => { if (m.matches && !menu.hidden) set(false); });
})();

/* ---------- Cookie notice (no tracking is loaded unless the visitor accepts) ---------- */
(() => {
  const box = $('#cookie'); if (!box) return;
  const KEY = 'wp-cookie';
  const show = () => { box.hidden = false; document.documentElement.classList.add('cookie-open'); };
  const hide = () => { box.hidden = true; document.documentElement.classList.remove('cookie-open'); };
  if (!store.get(KEY)) show();
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cookie]'); if (!b) return;
    store.set(KEY, b.dataset.cookie); hide();
    // DEMO ONLY: add your analytics snippet here. It must run only when b.dataset.cookie === 'yes'.
  });
})();

/* ---------- Reveal: sections below the fold fade and rise once (400-600 ms). Off for reduced motion. ---------- */
(() => {
  const items = $$('.reveal'); if (!items.length || reduceMotion || !('IntersectionObserver' in window)) return;
  const vh = window.innerHeight;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -6% 0px' });
  items.forEach((el) => { if (el.getBoundingClientRect().top > vh * 0.92) { el.classList.add('pre'); io.observe(el); } });
  // Safety net: never leave content hidden if the observer does not fire.
  setTimeout(() => items.forEach((el) => el.classList.add('in')), 12000);
})();
