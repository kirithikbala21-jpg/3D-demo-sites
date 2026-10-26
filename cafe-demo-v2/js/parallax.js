// Subtle hero parallax: two background layers (the photo and the glow) drift slower than the page as you scroll.
// Skipped entirely when the visitor prefers reduced motion (the hero is then completely still), and never touches the text.
import { $, reduceMotion } from './util.js';

const hero = $('.hero');
const layers = [['.hero-photo', 0.06], ['.hero-glow', 0.12]].map(([sel, depth]) => [$(sel, hero || document), depth]).filter(([el]) => el);
if (hero && layers.length && !reduceMotion) {
  hero.classList.add('parallax-on'); // makes the photo a little taller so it never shows a gap while it drifts
  let raf = 0;
  const update = () => {
    raf = 0;
    const y = Math.min(Math.max(window.scrollY, 0), hero.offsetHeight);
    layers.forEach(([el, d]) => { el.style.transform = `translate3d(0, ${(y * d).toFixed(1)}px, 0)`; });
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}
