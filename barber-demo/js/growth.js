// Growth features driven by site.config.json (flat keys, see README "Config reference"): Google review QR page, "best time to come"
// pattern, and the site-wide "Open now / Closed, opens at ..." banner. Everything hides itself when its config value is empty or off.
import { $, $$, site, nowShop, statusNow } from './util.js';
import { qrSvg } from './qr.js';
import { bestTimeLine, busySvg, hasBusyness, BUSY_LEGEND } from './busy.js';

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
      el.innerHTML = `<h3 class="busy-title">Best time to come</h3><p class="busy-line">${bestTimeLine(g, dow)}</p>${busySvg(g, dow)}${BUSY_LEGEND}`;
      el.hidden = false;
    });
  };
  draw(); setInterval(draw, 600000);
})();

/* ---------- Opening-hours banner on every page: "Open now, closes at 7pm" / "Closed, opens tomorrow at 9am" ---------- */
(() => {
  const bar = $('#open-banner'); if (!bar) return;
  if (g.openBannerEnabled === false) { bar.hidden = true; return; }
  const draw = () => { const st = statusNow(); bar.dataset.state = st.state; $('.ob-text', bar).textContent = st.text; bar.hidden = false; };
  draw(); setInterval(draw, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) draw(); });
})();
