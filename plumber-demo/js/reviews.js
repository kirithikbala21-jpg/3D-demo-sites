// Reviews page: draws the QR code for site.config.json > googleReviewUrl (generated here in the browser, no library, no network)
// and wires the "Print this" button. The print stylesheet (styles.css, @media print) shows only the heading and the QR code.
import { $ } from './util.js';

(() => {
  const box = $('#qr'); if (!box) return;
  const url = box.dataset.url; if (!url) return;
  import('./qr.js').then(({ qrSvg }) => {
    box.innerHTML = qrSvg(url, { size: 320, label: 'QR code. Scan to leave a Google review.' });
  }).catch(() => { box.innerHTML = `<p>Open this link to leave a review: <a href="${url.replace(/"/g, '&quot;')}">${url.replace(/[<&]/g, '')}</a></p>`; });
  const btn = $('#qr-print-btn');
  if (btn) { btn.hidden = false; btn.addEventListener('click', () => window.print()); }
})();
