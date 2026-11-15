/* Footage kit (shared by every KB Web Designs footage site).
   A slot is any element with data-footage="name". If footage/manifest.json lists that clip, the slot gets a video;
   if not, whatever stand-in is already inside the slot stays. Clips are made ready by tools/prep-footage.py.
     loop-*    plays muted on a loop while it is on screen
     opener    plays once when the page opens (data-then="scroll-x" hands over to a scroll clip)
     scroll-*  never plays by itself: scrub(p) moves it to a point between 0 and 1 */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = () => matchMedia('(max-width: 760px)').matches;
const src = (name) => `footage/${name}${small() ? '-m' : ''}.mp4`;
const make = (name, loop) => { const v = document.createElement('video'); v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = loop; v.preload = 'none'; v.poster = `footage/${name}.jpg`; v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1; return v; };
const play = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };

export async function init() {
  let clips = [];
  try { clips = (await (await fetch('footage/manifest.json', { cache: 'no-cache' })).json()).clips || []; } catch (_) {}
  const has = (n) => clips.includes(n), api = { has, scrub() {} };
  document.querySelectorAll('[data-footage]').forEach((slot) => {
    const name = slot.dataset.footage, then = slot.dataset.then;
    if (!has(name) && !(then && has(then))) return;
    slot.classList.add('has-footage'); (slot.closest('.stage') || slot).classList.add('has-footage');
    if (reduce) { const im = new Image(); im.src = `footage/${has(name) ? name : then}.jpg`; im.alt = ''; im.className = 'on'; im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'; slot.append(im); return; }
    let main = null;
    if (has(name)) {
      main = make(name, !then && name !== 'opener'); slot.append(main);
      main.addEventListener('playing', () => main.classList.add('on'), { once: true });
      new IntersectionObserver(([e]) => { if (e.isIntersecting) { if (!main.src) main.src = src(name); if (!main.ended) play(main); } else main.pause(); }, { rootMargin: '200px 0px' }).observe(slot);
    }
    if (then && has(then)) {
      const sc = make(then, false); sc.preload = 'auto'; sc.src = `footage/${then}.mp4`; slot.append(sc);
      let want = 0, at = 0, raf = 0;
      const step = () => { raf = 0; at += (want - at) * 0.18; if (sc.duration) sc.currentTime = at * (sc.duration - 0.05); if (Math.abs(want - at) > 0.002) raf = requestAnimationFrame(step); };
      api.scrub = (p) => { want = Math.min(1, Math.max(0, p)); sc.classList.toggle('on', p > 0.02 || !main); if (main) main.classList.toggle('on', p <= 0.02 && main.readyState > 1); if (!raf) raf = requestAnimationFrame(step); };
    }
  });
  return api;
}
