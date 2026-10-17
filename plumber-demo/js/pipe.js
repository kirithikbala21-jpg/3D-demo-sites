// Signature touch: a copper pipe draws itself down the page as you scroll (stroke-dashoffset), with a joint where it
// meets each section heading, ending in a drop that fills the gauge in the footer.
// Tiny: one rAF-throttled scroll handler that sets one style property and toggles a few classes.
// Reduced motion, no JavaScript and print all get the fully drawn pipe and a full gauge.
import { $, $$, reduceMotion, clamp } from './util.js';

(() => {
  const heads = $$('[data-pipe]');
  const gauge = $('[data-pipe-end]');
  if (!heads.length || !gauge) return;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}) => { const el = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); return el; };

  const svg = mk('svg', { class: 'pipe', 'aria-hidden': 'true', focusable: 'false' });
  const track = mk('path', { class: 'pipe-track' });
  const main = mk('path', { class: 'pipe-main' });
  const g = mk('g');
  svg.append(track, main, g);
  document.body.append(svg);
  document.documentElement.classList.add('has-pipe');

  let nodes = [], y0 = 0, yEnd = 1, len = 1, docH = 1, fillEl = $('.gauge-fill', gauge), pctEl = $('[data-gauge-pct]', gauge);
  const gaugeSvg = $('.gauge-svg', gauge);

  function measure() {
    const sy = window.scrollY;
    docH = document.body.offsetHeight;
    svg.style.height = docH + 'px';
    const cont = $('.container');
    const left = cont ? cont.getBoundingClientRect().left : 20;
    const tx = Math.max(9, Math.round(left - 36));
    const hero = $('.hero') || $('main section');
    y0 = hero ? hero.getBoundingClientRect().top + sy : 0;
    nodes = heads.map((h) => {
      const r = h.getBoundingClientRect(), cs = getComputedStyle(h);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.1;
      return { y: Math.round(r.top + sy + lh / 2), x: Math.round(r.left) };
    });
    const gr = gaugeSvg.getBoundingClientRect();
    const ex = Math.round(gr.left + gr.width / 2), ey = Math.round(gr.top + sy + 2);
    yEnd = ey;
    const r = 14;
    const d = `M${tx} ${y0} V${ey - r} Q${tx} ${ey} ${tx + r} ${ey} H${ex}`;
    track.setAttribute('d', d); main.setAttribute('d', d);
    len = main.getTotalLength();
    main.style.strokeDasharray = len;
    g.textContent = '';
    nodes.forEach((n) => {
      const endX = n.x - 8;
      n.stub = null;
      if (endX - tx > 6) { n.stub = mk('path', { class: 'pipe-stub', d: `M${tx} ${n.y} H${endX}` }); g.append(n.stub); }
      n.dot = mk('circle', { class: 'pipe-node', cx: tx, cy: n.y, r: 6.5 });
      g.append(n.dot);
    });
    update();
  }

  let ticking = false;
  function update() {
    ticking = false;
    const vh = window.innerHeight, sy = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    const full = reduceMotion;
    const tip = full ? Infinity : sy + vh * (0.62 + 0.38 * clamp(sy / maxScroll, 0, 1));
    const p = full ? 1 : clamp((tip - y0) / Math.max(1, yEnd - y0), 0, 1);
    main.style.strokeDashoffset = String(len * (1 - p));
    nodes.forEach((n) => { const on = tip >= n.y; n.dot.classList.toggle('on', on); if (n.stub) n.stub.classList.toggle('on', on); });
    const fill = full ? 1 : clamp((p - 0.82) / 0.18, 0, 1);
    gauge.style.setProperty('--fill', String(fill));
    if (pctEl) pctEl.textContent = Math.round(fill * 100) + '%';
    gauge.classList.toggle('drop', !full && p >= 1);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  measure();
  if (!reduceMotion) window.addEventListener('scroll', onScroll, { passive: true });
  let t = 0;
  const remeasure = () => { clearTimeout(t); t = setTimeout(measure, 80); };
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
})();
