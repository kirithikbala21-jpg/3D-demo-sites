// Motion: GSAP (ScrollTrigger, SplitText), Lenis smooth scrolling on desktop, and the small interactions.
// Every reveal starts as soon as an element enters the viewport and is done within 0.9 s.
// If GSAP did not load, or motion is reduced, everything is simply shown.
import { CONFIG } from './config.js';

const EASE = 'expo.out'; // the house curve, cubic-bezier(.16,1,.3,1)
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initMotion({ reduce, tier, fine }) {
  const root = document.documentElement;
  const gsap = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
  if (!gsap || !ST || reduce) { root.classList.add('motion-off'); initStatic(); return { lenis: null }; }
  gsap.registerPlugin(ST); if (Split) gsap.registerPlugin(Split);
  gsap.defaults({ ease: EASE, duration: 0.8 });

  // ---- smooth scrolling: desktop mouse and trackpad only; touch keeps native scrolling
  let lenis = null;
  if (fine && window.Lenis && tier !== 'low') {
    lenis = new window.Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    root.classList.add('lenis', 'lenis-smooth');
    // in-page links scroll smoothly too
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -80 }); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
    }));
  }

  // ---- headlines: lines rise from behind a mask
  $$('[data-split]').forEach((el) => {
    if (!Split) { el.classList.add('is-in'); return; }
    Split.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
      onSplit(self) {
        el.classList.add('is-split');
        return gsap.from(self.lines, { yPercent: 105, duration: 0.8, stagger: 0.06, scrollTrigger: { trigger: el, start: 'top bottom', once: true } });
      }
    });
  });

  // ---- blocks fade and rise as they enter
  ST.batch('[data-reveal]', { start: 'top bottom', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.7, stagger: 0.05, overwrite: true }) });

  // ---- images: a wipe from the bottom plus a slow settle from 1.15 to 1
  $$('[data-wipe]').forEach((el) => {
    const img = el.querySelector('img, video, canvas, .wipe-inner');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top bottom', once: true } });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 });
    if (img) tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.2 }, 0);
  });

  // ---- gentle parallax (desktop, full tier only)
  if (tier === 'full' && fine) $$('[data-parallax]').forEach((el) => {
    const amt = Number(el.dataset.parallax || 0.08) * 100;
    gsap.fromTo(el, { yPercent: amt / 2 }, { yPercent: -amt / 2, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---- trade chapters (home): one pinned full-screen stage on desktop. Each scene wipes up over the last, its photo
  // slowly zooms from 1 to 1.12, the title rises and a gold hairline draws. Phones and tablets keep stacked cards.
  const ch = document.querySelector('[data-chapters]');
  if (ch && innerWidth >= 1024) {
    ch.classList.add('is-pinned');
    const stage = ch.querySelector('.chapters-stage'), scenes = $$('.chapter', stage), n = scenes.length;
    const count = stage.querySelector('.chapters-count b'), bar = stage.querySelector('.chapters-bar i');
    let cur = -1;
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
      trigger: stage, start: 'top top', end: () => '+=' + innerHeight * (n - 0.5), pin: true, scrub: 0.6, invalidateOnRefresh: true,
      onUpdate: (s) => {
        const i = Math.min(n - 1, Math.max(0, Math.round(s.progress * (n - 1))));
        if (i === cur) return; cur = i;
        count.textContent = String(i + 1).padStart(2, '0');
        gsap.to(bar, { scaleX: (i + 1) / n, duration: 0.6, ease: EASE, overwrite: true });
        scenes.forEach((sc, j) => sc.toggleAttribute('inert', j !== i));
      }
    } });
    scenes.forEach((sc, i) => {
      const at = Math.max(0, i - 0.5);
      const img = sc.querySelector('.chapter-media img'), title = sc.querySelector('.chapter-title'), rule = sc.querySelector('.chapter-rule');
      const rest = sc.querySelectorAll('.chapter-cap, .chapter-meta, .chapter-copy .link');
      if (i > 0) tl.fromTo(sc, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power2.inOut' }, at);
      tl.fromTo(img, { scale: 1 }, { scale: 1.12, duration: i === 0 ? 1 : 1.5 }, i === 0 ? 0 : at);
      if (i > 0) {
        tl.fromTo(title, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }, at + 0.2);
        tl.fromTo(rest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power3.out' }, at + 0.3);
      }
      tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power2.out' }, i === 0 ? 0.05 : at + 0.32);
      if (i < n - 1) {
        // no ghost text: this scene's words reach opacity 0 before the next scene starts to wipe in, and the scene is
        // hidden once the next one fully covers it (all of it scrubs back on the way up)
        const next = i + 0.5;
        tl.to([title, rule, ...rest], { opacity: 0, duration: 0.12, ease: 'power1.in' }, next - 0.14);
        tl.set(sc, { autoAlpha: 0 }, next + 0.5);
      }
    });
    tl.to({}, { duration: 0.4 }); // a short hold on the last scene before the page moves on
  }

  // ---- numbers that roll like an odometer
  $$('[data-odometer]').forEach((el) => odometer(el, gsap, ST));

  // ---- the trade marquee: steady drift that speeds up a little with scroll velocity
  $$('[data-marquee]').forEach((m) => {
    const track = m.querySelector('.marquee-track');
    const tween = gsap.to(track, { xPercent: -50, ease: 'none', duration: 40, repeat: -1 });
    ST.create({ trigger: m, start: 'top bottom', end: 'bottom top', onUpdate: (s) => {
      const v = Math.min(4, 1 + Math.abs(s.getVelocity()) / 900);
      gsap.to(tween, { timeScale: v * (s.direction < 0 ? -1 : 1), duration: 0.4, overwrite: true });
      gsap.to(tween, { timeScale: s.direction < 0 ? -1 : 1, duration: 1.2, delay: 0.4 });
    } });
    m.addEventListener('mouseenter', () => tween.pause()); m.addEventListener('mouseleave', () => tween.resume());
  });

  // safety net: anything still hidden that is already on screen (fast jumps) is shown at once
  const catchUp = () => { const vh = innerHeight; $$('[data-reveal]').forEach((el) => { if (el.getBoundingClientRect().top < vh && getComputedStyle(el).opacity === '0') gsap.to(el, { opacity: 1, y: 0, duration: 0.5, overwrite: true }); }); };
  ST.addEventListener('scrollEnd', catchUp);
  addEventListener('load', () => ST.refresh());
  return { lenis, gsap, ST };
}

// without GSAP or with reduced motion: show everything and set every number straight away
function initStatic() {
  $$('[data-odometer]').forEach((el) => { el.textContent = el.dataset.odometer; });
}

function odometer(el, gsap, ST) {
  const text = el.dataset.odometer; // e.g. "$300", "5", "100%"
  el.textContent = '';
  const said = document.createElement('span'); said.className = 'sr-only'; said.textContent = text; el.append(said); // what screen readers hear
  const cols = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    if (/\d/.test(ch)) {
      span.className = 'odo-col';
      const strip = document.createElement('span'); strip.className = 'odo-strip';
      for (let d = 0; d <= 9; d++) { const s = document.createElement('span'); s.textContent = d; strip.append(s); }
      span.append(strip); cols.push([strip, Number(ch)]);
    } else { span.className = 'odo-sym'; span.textContent = ch; }
    el.append(span);
  }
  cols.forEach(([strip]) => gsap.set(strip, { yPercent: 0 }));
  ST.create({ trigger: el, start: 'top bottom', once: true, onEnter: () => cols.forEach(([strip, n], i) => gsap.to(strip, { yPercent: -10 * n, duration: 0.85, delay: i * 0.04 })) });
}

export { CONFIG };
