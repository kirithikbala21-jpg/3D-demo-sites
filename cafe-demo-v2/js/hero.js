// Start-up sequence and the 3D hero (with its SVG fallback).
import { $, reduceMotion } from './util.js';

/** Branded intro on the first visit to the home page in a session; otherwise start immediately. */
export async function startUp() {
  const html = document.documentElement, pre = $('#preloader');
  let seen = null;
  try { seen = sessionStorage.getItem('eo-seen'); } catch (_) { /* ignore */ }
  if (!pre || reduceMotion || seen) { if (pre) pre.remove(); html.classList.add('is-ready'); return; }
  try { sessionStorage.setItem('eo-seen', '1'); } catch (_) { /* ignore */ }
  // Short on purpose: the whole intro (wordmark wipe, fade-out) finishes in about a second.
  const wait = new Promise((r) => setTimeout(r, 500));
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  await Promise.race([Promise.all([wait, fonts]), new Promise((r) => setTimeout(r, 900))]);
  pre.classList.add('is-done');
  html.classList.add('is-ready');
  setTimeout(() => pre.remove(), 400);
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
    stage.classList.add('is-fallback'); // the SVG illustration is already in the page
  }
  function webglAvailable() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (_) { return false; }
  }
  const conn = navigator.connection;
  // Data Saver, 2G connections and very weak devices keep the still illustration (the poster) instead of the 3D scene.
  const verySlow = (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) || (navigator.deviceMemory && navigator.deviceMemory <= 1) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 1);
  if (!webglAvailable() || verySlow) { useFallback(); return; }

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
