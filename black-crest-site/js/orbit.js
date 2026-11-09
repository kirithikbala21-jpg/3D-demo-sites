/* Scroll-scrubbed hero: 90 frames of the 3D card (tools/render-orbit.mjs) drawn on a canvas as the page scrolls.
   Desktop only (wide, mouse, no reduced motion): everyone else keeps the still render and the loop video. */
const FRAMES = 90, DIR = 'assets/orbit/f-';
export function start(hero) {
  const media = hero.querySelector('[data-hero-media]'); if (!media) return;
  const canvas = document.createElement('canvas'); canvas.className = 'hero-orbit'; canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d'); media.append(canvas);
  const imgs = new Array(FRAMES), ok = new Array(FRAMES).fill(false);
  let shown = -1, want = 0, raf = 0;
  const size = () => { const r = media.getBoundingClientRect(), k = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.round(r.width * k); canvas.height = Math.round(r.height * k); shown = -1; draw(); };
  const nearest = (i) => { for (let d = 0; d < FRAMES; d++) { if (ok[i - d]) return i - d; if (ok[i + d]) return i + d; } return -1; };
  const draw = () => {
    raf = 0; const i = nearest(want); if (i < 0 || i === shown) return; shown = i;
    const im = imgs[i], w = canvas.width, h = canvas.height, k = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    const dw = im.naturalWidth * k, dh = im.naturalHeight * k;
    ctx.drawImage(im, (w - dw) * 0.74, (h - dh) * 0.5, dw, dh); // the card sits right of the words, like the render
    canvas.classList.add('is-on');
  };
  const progress = () => { const r = hero.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight), p = Math.min(1, Math.max(0, -r.top / span)); hero.style.setProperty('--orbit-p', p.toFixed(3)); want = Math.round(p * (FRAMES - 1)); if (!raf) raf = requestAnimationFrame(draw); };
  const load = (i) => new Promise((res) => { const im = new Image(); im.decoding = 'async'; im.onload = () => { imgs[i] = im; ok[i] = true; if (i === want || shown < 0) draw(); res(); }; im.onerror = res; im.src = DIR + String(i + 1).padStart(3, '0') + '.webp'; });
  hero.classList.add('orbit-on'); size();
  (async () => { await load(0); for (let i = FRAMES - 1; i > 0; i -= 9) await load(i); for (let i = 1; i < FRAMES; i++) if (!ok[i]) await load(i); })();
  addEventListener('scroll', progress, { passive: true }); addEventListener('resize', () => { size(); progress(); }, { passive: true }); progress();
}
