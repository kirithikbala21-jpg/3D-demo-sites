// Growth features driven by site.config.json (flat keys, see README "Config reference"): Google review QR page, "best time to come"
// pattern, and the site-wide "Open now / Closed, opens at ..." banner. Everything hides itself when its config value is empty or off.
import { $, $$, site, nowShop, statusNow } from './util.js';
import { qrSvg } from './qr.js';
import { bestTimeLine, busySvg, hasBusyness, BUSY_LEGEND } from './busy.js';
import { tr } from './i18n.js';

const g = site.growth || {};

/* ---------- Google review QR (reviews.html) with a print button ---------- */
(() => {
  const host = $('#qr-host'); if (!host) return;
  const url = g.googleReviewUrl;
  if (!url) { const sec = $('#qr-section'); if (sec) sec.hidden = true; return; }
  host.innerHTML = qrSvg(url, { size: 320, label: 'QR code. Scan to leave a Google review for ' + site.name });
  const print = $('#print-qr');
  if (print) print.addEventListener('click', () => window.print());
})();

/* ---------- Best time to come: a TYPICAL weekly pattern, never live data ---------- */
(() => {
  const hosts = $$('[data-busy]'); if (!hosts.length) return;
  const show = g.busynessEnabled !== false && hasBusyness(g);
  const draw = () => {
    const dow = nowShop().dow;
    hosts.forEach((el) => {
      if (!show) { el.hidden = true; return; }
      el.innerHTML = `<h3 class="busy-title">Best time to come</h3><p class="busy-line">${bestTimeLine(g, dow)}</p>${busySvg(g, dow)}${BUSY_LEGEND}${g.busynessIsDemo ? '<p class="note">Example pattern for the demo. The shop will confirm its real quiet times.</p>' : ''}`;
      el.hidden = false;
    });
  };
  draw(); setInterval(draw, 600000);
})();

/* ---------- Opening-hours banner on every page: "Open now, closes at 7pm" / "Closed, opens tomorrow at 9am" ---------- */
(() => {
  const bar = $('#open-banner'); if (!bar) return;
  if (g.openBannerEnabled === false) { bar.hidden = true; return; }
  const draw = () => { const st = statusNow(); bar.dataset.state = st.state; $('.ob-text', bar).textContent = tr(st.text); bar.hidden = false; };
  draw(); setInterval(draw, 60000);
  document.addEventListener('langchange', draw);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) draw(); });
})();

/* ---------- QR code to book from a phone (book.html and visit.html) ---------- */
(() => {
  const host = $('#bookqr-host'); if (!host) return;
  const url = new URL('book.html', location.href).href.split('#')[0].split('?')[0];
  host.innerHTML = qrSvg(url, { size: 280, label: 'QR code. Scan to open the booking page for ' + site.name });
})();
