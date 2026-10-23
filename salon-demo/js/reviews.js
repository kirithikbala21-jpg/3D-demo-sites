// Google review QR (reviews.html): the code is drawn in the browser from googleReviewUrl, no library and no network request.
import { $ } from './util.js';
import { qrSvg } from './qr.js';

const box = $('#qr-box');
if (box && box.dataset.url) {
  try { box.innerHTML = qrSvg(box.dataset.url, { size: 320, label: box.dataset.label || 'QR code' }); } catch (e) { console.error('[reviews] could not draw the QR code', e); }
}
const printBtn = $('[data-print]');
if (printBtn) printBtn.addEventListener('click', () => window.print());
