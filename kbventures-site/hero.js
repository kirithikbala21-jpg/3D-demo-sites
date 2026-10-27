// Hero 3D: two floating glass tiles, one per business. The still CSS version is already in the page and stays when
// JavaScript is off, WebGL is missing, Data Saver is on, the phone is low-powered, or the visitor prefers reduced motion.
const stage = document.getElementById('stage'), canvas = document.getElementById('scene');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useFallback() {
  if (canvas.isConnected) canvas.remove();
  stage.classList.remove('has-3d');
  stage.classList.add('is-fallback');
}
function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (_) { return false; }
}

if (stage && canvas) {
  const conn = navigator.connection;
  const smallScreen = Math.min(screen.width || 9999, screen.height || 9999) <= 480 || window.innerWidth <= 480;
  const weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const forced = /[?&]3d=on\b/.test(location.search); // testing aid: ?3d=on turns 3D on for a low-powered phone profile
  const forcedOff = /[?&]3d=off\b/.test(location.search); // testing aid: ?3d=off shows the still version
  if (forcedOff || reduceMotion || !webglAvailable() || (conn && conn.saveData) || (!forced && smallScreen && weak)) {
    useFallback();
  } else {
    let settled = false, handle = null;
    const fail = (err) => { if (err) console.info('3D unavailable, showing the still tiles.', err.message || err); settled = true; if (handle) { try { handle.dispose(); } catch (_) { /* ignore */ } handle = null; } useFallback(); };
    const timer = setTimeout(() => { if (!settled) fail(new Error('timed out')); }, 6000);
    // Start only after the page has loaded and the browser is idle, so text and images paint first.
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true }));
    const idle = () => new Promise((r) => ('requestIdleCallback' in window ? requestIdleCallback(r, { timeout: 900 }) : setTimeout(r, 150)));
    const lowEnd = !!((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || smallScreen);
    loaded.then(idle)
      .then(() => (document.fonts ? document.fonts.ready : null))
      .then(() => import('./scene.js'))
      .then((m) => m.initScene(canvas, { lowEnd, onLost: () => fail(new Error('context lost')) }))
      .then((h) => {
        clearTimeout(timer);
        if (settled) { h.dispose(); return; }
        settled = true; handle = h;
        stage.classList.add('has-3d');
        canvas.classList.add('is-ready');
      })
      .catch((err) => { clearTimeout(timer); fail(err); });
  }
}
