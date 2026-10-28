// Hero object: a pre-rendered still (img/hero-object.webp) is in the page from the start. The live Three.js version
// fades in over it once loaded, but only when WebGL works, the visitor hasn't asked for reduced motion, Data Saver is off
// and the device isn't a low-powered phone. Testing aids: ?3d=on forces 3D, ?3d=off keeps the still.
const stage = document.getElementById('stage'), canvas = document.getElementById('scene');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const q = new URLSearchParams(location.search);

function keepStill() { if (canvas && canvas.isConnected) canvas.remove(); stage.classList.add('is-still'); }
function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (_) { return false; }
}

if (stage && canvas) {
  const conn = navigator.connection;
  const small = Math.min(screen.width || 9999, screen.height || 9999) <= 480 || window.innerWidth <= 480;
  const weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const forced = q.get('3d') === 'on';
  if (q.get('3d') === 'off' || (!forced && (reduceMotion || (conn && conn.saveData) || (small && weak))) || !webglOK()) {
    keepStill();
  } else {
    let done = false, handle = null;
    const fail = (err) => { if (err) console.info('3D unavailable, keeping the still image.', err.message || err); done = true; if (handle) { try { handle.dispose(); } catch (_) { /* ignore */ } } keepStill(); };
    const timer = setTimeout(() => { if (!done) fail(new Error('timed out')); }, 8000);
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true }));
    const idle = () => new Promise((r) => ('requestIdleCallback' in window ? requestIdleCallback(r, { timeout: 900 }) : setTimeout(r, 150)));
    const lowEnd = !!((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2));
    loaded.then(idle)
      .then(() => (document.fonts ? document.fonts.ready : null)) // the mark on the glass uses Geist
      .then(() => import('./scene.js'))
      .then((m) => m.initScene(canvas, { lowEnd, onLost: () => fail(new Error('context lost')) }))
      .then((h) => {
        clearTimeout(timer);
        if (done) { h.dispose(); return; }
        done = true; handle = h;
        if (q.has('capture')) window.__hero = h; // used by tools/render-hero-still.mjs
        requestAnimationFrame(() => stage.classList.add('has-3d'));
      })
      .catch((err) => { clearTimeout(timer); fail(err); });
  }
}
