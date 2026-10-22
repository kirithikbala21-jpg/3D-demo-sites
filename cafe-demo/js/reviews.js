// QR code page: draws a QR for googleReviewUrl (site.config.json) in the browser. Nothing is sent anywhere.
import { loadConfig } from './config.js';
import { qrSvg } from './qr.js';
const cfg = await loadConfig();
const sheet = document.getElementById('qr-sheet'), off = document.getElementById('qr-off');
if (cfg.googleReviewUrl) {
  document.getElementById('qr-box').innerHTML = qrSvg(cfg.googleReviewUrl, { size: 360, label: `QR code: scan to leave ${cfg.name} a Google review` });
  document.getElementById('qr-link').href = cfg.googleReviewUrl;
  sheet.hidden = false;
  document.getElementById('print-btn').addEventListener('click', () => window.print());
} else off.hidden = false;
