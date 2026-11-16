/* Footage slot (KB Web Designs footage kit). Does nothing until footage/manifest.json lists a clip.
   "opener" covers the hero picture; any element with data-footage="name" gets that clip.
   Clips are made ready by tools/prep-footage.py (see nightglass-demo/README.md). */
const base = new URL('../footage/', import.meta.url);
const HERO = '.hero-photo, .hero-media';
(async () => {
  let clips = [];
  try { clips = (await (await fetch(new URL('manifest.json', base), { cache: 'no-cache' })).json()).clips || []; } catch (_) {}
  if (!clips.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, small = matchMedia('(max-width: 760px)').matches;
  const fill = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
  const put = (el, name) => {
    if (!el || !clips.includes(name)) return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    if (reduce) { const im = new Image(); im.alt = ''; im.src = new URL(name + '.jpg', base); im.style.cssText = fill; el.append(im); return; }
    const v = document.createElement('video'); v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true; v.preload = 'none';
    v.poster = new URL(name + '.jpg', base); v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1; v.style.cssText = fill + 'opacity:0;transition:opacity 1.2s cubic-bezier(.16,1,.3,1)';
    v.addEventListener('playing', () => { v.style.opacity = 1; }, { once: true }); el.append(v);
    new IntersectionObserver(([e]) => { if (e.isIntersecting) { if (!v.src) v.src = new URL(name + (small ? '-m' : '') + '.mp4', base); const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); }, { rootMargin: '200px 0px' }).observe(el);
  };
  put(document.querySelector(HERO), 'opener');
  document.querySelectorAll('[data-footage]').forEach((el) => put(el, el.dataset.footage));
})();
