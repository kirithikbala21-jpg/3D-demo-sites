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
// Share image: a real screenshot of the live hero (3D pole + wordmark), taken from a local static server
{
  const http = await import('node:http');
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
  const server = http.createServer((q, r) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    fs.readFile(path.join(SITE, u), (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); r.end(d); });
  }).listen(0);
  const gl = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await gl.newContext({ viewport: { width: 1200, height: 630 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('eo-seen', '1'); localStorage.setItem('eo-cookie', 'no'); } catch (e) { /* ignore */ } });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${server.address().port}/index.html`);
  await p.addStyleTag({ content: '.announce,.chat,.cookie,.mobile-cta,.scroll-cue,.hero .chip{display:none!important}' });
  await p.waitForSelector('#scene.is-ready', { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(3500);
  await p.screenshot({ path: path.join(SITE, 'img/og.png') });
  await gl.close(); server.close();
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
