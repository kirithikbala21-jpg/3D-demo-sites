// Generates the binary assets that cannot be hand-written: PNG icons, the share image (og.png) and price-list.pdf.
// Usage (from the site folder):  node tools/make-assets.mjs     (needs tests/node_modules; set CHROME_PATH if Chromium is not auto-detected)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(pathToFileURL(path.join(SITE, 'tests/node_modules/playwright-core/index.mjs')).href);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const url = (f) => pathToFileURL(path.join(SITE, f)).href;

// PNG icons from img/icon.svg
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  await p.goto(url('img/icon.svg'));
  await p.screenshot({ path: path.join(SITE, 'img', name) });
  await p.close();
}
// Share image
{
  const p = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto(url('img/og-source.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(SITE, 'img/og.png') });
  await p.close();
}
// Printable price list
{
  const p = await browser.newPage();
  await p.goto(url('services.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(SITE, 'price-list.pdf'), format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' } });
  await p.close();
}
await browser.close();
for (const f of ['img/apple-touch-icon.png', 'img/icon-192.png', 'img/icon-512.png', 'img/og.png', 'price-list.pdf']) console.log(f, fs.statSync(path.join(SITE, f)).size, 'bytes');
