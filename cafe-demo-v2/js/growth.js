// Review QR code, "Print this" button and the "best time to come" strip. Everything here is driven by site.config.json
// (googleReviewUrl, busynessEnabled, busyness); an empty value means the markup is never output, so nothing shows.
import { $, $$, site, nowCafe } from './util.js';
import { qrSvg } from './qr.js';
import { hasBusyness, bestTimeLine, busySvg, BUSY_LEGEND } from './busy.js';

/* ---------- QR code for the Google review link (generated here in the browser, no library, no request) ---------- */
$$('[data-qr]').forEach((box) => {
  const url = box.dataset.url; if (!url) return;
  try { box.innerHTML = qrSvg(url, { size: 360, label: box.dataset.label || 'QR code' }); box.classList.add('is-ready'); } catch (err) { console.error('[qr] could not draw the code:', err); }
});
$$('[data-print]').forEach((b) => { b.hidden = false; b.addEventListener('click', () => window.print()); });

/* ---------- Best time to come: a typical weekly pattern set by the owner. Never live data. ---------- */
function renderBusy() {
  const boxes = $$('[data-busy]');
  if (!boxes.length) return;
  const ok = site.busynessEnabled && hasBusyness(site);
  const dow = nowCafe().dow;
  boxes.forEach((box) => {
    if (!ok) { box.hidden = true; return; }
    const line = bestTimeLine(site, dow);
    $('[data-busy-line]', box).textContent = line;
    $('[data-busy-chart]', box).innerHTML = busySvg(site, dow) + BUSY_LEGEND;
    box.hidden = false;
  });
}
renderBusy();
setInterval(renderBusy, 3600000); // the highlighted "today" column follows midnight in the café's time zone
