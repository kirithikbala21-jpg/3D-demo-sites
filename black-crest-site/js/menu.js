// The header (transparent over the hero, dark glass after scrolling, hides on the way down) and the full-screen menu.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initMenu({ reduce, lenis }) {
  const header = $('.site-header'), btn = $('.menu-btn'), menu = $('#menu');

  // ---- header state
  if (header) {
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY, open = menu && !menu.hidden;
      header.classList.toggle('is-scrolled', y > 24);
      if (!open && !header.contains(document.activeElement)) header.classList.toggle('is-hidden', y > last && y > 240);
      if (y < last - 4) header.classList.remove('is-hidden');
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
    onScroll();
  }
  if (!btn || !menu) return;

  // ---- open and close
  const label = $('.menu-label', btn);
  const focusables = () => [btn].concat($$('a[href], button:not([disabled])', menu).filter((el) => el.getClientRects().length > 0));
  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close' : 'Menu';
    $('.sr-only', btn).textContent = open ? 'Close menu' : 'Open menu';
    document.documentElement.classList.toggle('menu-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      ($('a', menu) || menu).focus();
    } else {
      menu.classList.remove('is-open');
      const done = () => { if (!menu.classList.contains('is-open')) menu.hidden = true; };
      reduce ? done() : setTimeout(done, 450);
    }
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { setOpen(false); btn.focus(); return; }
    if (e.key === 'Tab') { // keep focus inside the menu while it is open: the close button, then the menu's own links
      const f = focusables(); if (!f.length) return;
      e.preventDefault();
      const i = f.indexOf(document.activeElement);
      f[i === -1 ? 0 : (i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  // ---- desktop: a small image preview follows the hovered link
  const preview = $('.menu-preview img', menu);
  if (preview) $$('[data-preview]', menu).forEach((a) => {
    const show = () => { preview.src = a.dataset.preview; preview.alt = ''; preview.parentElement.classList.add('is-on'); };
    a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
  });
}
