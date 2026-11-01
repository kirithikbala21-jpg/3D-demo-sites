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

  // ---- magnetic primary buttons (desktop only, a small pull)
  if (fine) $$('.btn-gold, [data-magnetic]').forEach((b) => {
    const xTo = gsap.quickTo(b, 'x', { duration: 0.5 }), yTo = gsap.quickTo(b, 'y', { duration: 0.5 });
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.2); yTo((e.clientY - r.top - r.height / 2) * 0.3); });
    b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
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
  el.setAttribute('aria-label', text);
  el.textContent = '';
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
