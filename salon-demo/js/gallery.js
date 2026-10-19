// Gallery lightbox: opens from a tapped photo; arrow keys, swipe, Escape, focus trap, focus returns to the photo.
import { $, $$ } from './util.js';

const openers = $$('.g-open');
if (openers.length) {
  const items = openers.map((b) => ({ src: b.dataset.src, alt: b.dataset.alt, w: b.dataset.w, h: b.dataset.h }));
  const lb = document.createElement('div');
  lb.className = 'lb'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
  lb.setAttribute('data-lenis-prevent', '');
  lb.innerHTML = `<button type="button" class="lb-btn lb-close" aria-label="Close photo viewer"><svg width="24" height="24" aria-hidden="true" focusable="false"><use href="#i-close"/></svg></button>
    <figure class="lb-fig"><img class="lb-img" alt="" width="1000" height="1000"><figcaption class="lb-cap"></figcaption></figure>
    <p class="lb-count" aria-live="polite"></p>
    <button type="button" class="lb-btn lb-prev" aria-label="Previous photo"><svg width="24" height="24" aria-hidden="true" focusable="false"><use href="#i-left"/></svg></button>
    <button type="button" class="lb-btn lb-next" aria-label="Next photo"><svg width="24" height="24" aria-hidden="true" focusable="false"><use href="#i-right"/></svg></button>`;
  document.body.append(lb);
  const img = $('.lb-img', lb), cap = $('.lb-cap', lb), count = $('.lb-count', lb), close = $('.lb-close', lb), prev = $('.lb-prev', lb), next = $('.lb-next', lb);
  let idx = 0, opener = null;
  const inertEls = () => ['.site-header', '#main', '#footer', '#mobile-bar', '#cookie'].map((s) => $(s)).filter(Boolean);
  const show = (i) => {
    idx = (i + items.length) % items.length;
    const it = items[idx];
    img.src = it.src; img.alt = it.alt; img.width = it.w; img.height = it.h;
    cap.textContent = it.alt; count.textContent = `Photo ${idx + 1} of ${items.length}`;
    const pre = new Image(); pre.src = items[(idx + 1) % items.length].src;
  };
  const open = (i, from) => {
    opener = from; show(i); lb.hidden = false;
    document.body.classList.add('no-scroll'); inertEls().forEach((el) => { el.inert = true; });
    close.focus();
  };
  const shut = () => {
    lb.hidden = true; document.body.classList.remove('no-scroll'); inertEls().forEach((el) => { el.inert = false; });
    if (opener) opener.focus({ preventScroll: true });
  };
  openers.forEach((b, i) => b.addEventListener('click', () => open(i, b)));
  close.addEventListener('click', shut);
  prev.addEventListener('click', () => show(idx - 1));
  next.addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) shut(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); shut(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    else if (e.key === 'Tab') {
      const f = [close, prev, next], i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      else if (i === -1) { e.preventDefault(); close.focus(); }
    }
  });
  // swipe (touch)
  let sx = 0, sy = 0, t0 = 0;
  lb.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; t0 = Date.now(); }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - t0 < 900) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });
}
