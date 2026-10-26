// Start-up sequence and the 3D barbell hero (with its SVG poster fallback).
import { $, reduceMotion } from './util.js';

/** Branded intro on the first visit to the home page in a session; otherwise start immediately. */
export async function startUp() {
  const html = document.documentElement, pre = $('#preloader');
  let seen = null;
  try { seen = sessionStorage.getItem('vc-seen'); } catch (_) { /* ignore */ }
  if (!pre || reduceMotion || seen) { if (pre) pre.remove(); html.classList.add('is-ready'); html.dataset.readyAt = String(Math.round(performance.now())); return; }
  try { sessionStorage.setItem('vc-seen', '1'); } catch (_) { /* ignore */ }
  const wait = new Promise((r) => setTimeout(r, 600));
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  await Promise.race([Promise.all([wait, fonts]), new Promise((r) => setTimeout(r, 1300))]);
  pre.classList.add('is-done');
  html.classList.add('is-ready');
  html.dataset.readyAt = String(Math.round(performance.now())); // ms since navigation start, used by the tests
  setTimeout(() => pre.remove(), 500);
}

export function initHero() {
  const stage = $('#stage'), canvas = $('#scene');
  if (!stage || !canvas) return;
  const video = $('.hero-video');
  if (video && reduceMotion) { video.removeAttribute('autoplay'); video.pause(); }

  let settled = false, handle = null;
  function useFallback() {
    if (settled && !handle) return;
    settled = true;
    if (handle) { try { handle.dispose(); } catch (_) { /* ignore */ } handle = null; }
    canvas.remove();
    stage.classList.remove('has-3d');
    stage.classList.add('is-fallback'); // the SVG barbell poster is already in the page
  }
  function webglAvailable() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (_) { return false; }
  }
  const conn = navigator.connection;
  // Low-powered phone: a small screen plus few CPU cores (or little memory) keeps the still poster and skips 3D entirely.
  const smallScreen = Math.min(screen.width || 9999, screen.height || 9999) <= 480 || window.innerWidth <= 480;
  const weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const forced = /[?&]3d=on\b/.test(location.search); // testing aid: ?3d=on turns 3D on even for a low-powered phone profile
  if (!webglAvailable() || (conn && conn.saveData) || (!forced && smallScreen && weak)) { useFallback(); return; } // Data Saver and weak phones get the light poster

  const timer = setTimeout(useFallback, 4000);
  // Start the 3D only after the page has loaded and the browser is idle, so text and images paint first.
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true }));
  const idle = () => new Promise((r) => ('requestIdleCallback' in window ? requestIdleCallback(r, { timeout: 900 }) : setTimeout(r, 150)));
  const lowEnd = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  loaded.then(idle)
    .then(() => import('../scene.js'))
    .then((m) => m.initScene(canvas, { reduceMotion, lowEnd, onLost: useFallback }))
    .then((h) => {
      clearTimeout(timer);
      if (settled) { h.dispose(); return; }
      settled = true; handle = h;
      stage.classList.add('has-3d');
      canvas.classList.add('is-ready');
    })
    .catch((err) => { clearTimeout(timer); console.info('3D unavailable, showing illustration.', err && err.message); settled = false; useFallback(); });
}

/** Subtle parallax: three layers (photo, barbell stage, text) drift a few pixels as the page scrolls. Skipped entirely with reduced motion:
 *  the hero then stays perfectly still (no class is added, so no transform is ever applied). */
export function initParallax() {
  const hero = $('.hero');
  if (!hero || reduceMotion) return;
  hero.classList.add('hero-px');
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = Math.max(0, Math.min(window.scrollY, hero.offsetHeight));
    hero.style.setProperty('--hp1', (y * 0.14).toFixed(1) + 'px');
    hero.style.setProperty('--hp2', (y * 0.07).toFixed(1) + 'px');
    hero.style.setProperty('--hp3', (y * -0.03).toFixed(1) + 'px');
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
