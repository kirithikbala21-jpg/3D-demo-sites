// Reviews page: draws the QR code for googleReviewUrl in the browser (js/qr.js, no library, no network) and wires the Print button.
import { $, $$ } from './util.js';
import { qrSvg } from './qr.js';

const host = $('[data-qr]');
if (host) {
  const url = host.dataset.qr;
  try { host.innerHTML = qrSvg(url, { size: 320, label: 'QR code: scan to leave a Google review' }); host.hidden = false; } catch (e) { console.error('[qr] could not draw the code', e); }
}
$$('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
