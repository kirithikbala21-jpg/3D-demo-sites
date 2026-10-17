// Generates the binary assets that cannot be hand-written: PNG icons (plain, apple-touch and maskable), favicon.ico (via Pillow), the share image (og.png, a screenshot of the real hero) and menu.pdf.
// Usage (from the site folder):  node tools/make-assets.mjs     (needs tests/node_modules; set CHROME_PATH if Chromium is not auto-detected)
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(pathToFileURL(path.join(SITE, 'tests/node_modules/playwright-core/index.mjs')).href);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const url = (f) => pathToFileURL(path.join(SITE, f)).href;

// PNG icons from img/icon.svg
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  await p.goto(url('img/icon.svg'));
  await p.screenshot({ path: path.join(SITE, 'img', name) });
  await p.close();
}
// Maskable icon: the same art at 80% on a full-bleed espresso square, so it survives any circle / squircle crop (safe zone).
{
  const p = await browser.newPage({ viewport: { width: 512, height: 512 } });
  await p.goto(url('img/icon.svg'));
  await p.evaluate(() => { const svg = document.documentElement; svg.setAttribute('viewBox', '-8 -8 80 80'); svg.style.background = '#120D0A'; });
  await p.screenshot({ path: path.join(SITE, 'img', 'icon-maskable-512.png') });
  await p.close();
}
// favicon.ico (16, 32 and 48 px) from the 512 px icon, with Pillow
execFileSync('python3', [path.join(SITE, 'tools', 'make-favicon.py')], { stdio: 'inherit' });
// Share image: a real screenshot of the home page hero (3D cup + wordmark), 1200x630.
// The page is served from a throwaway local server (the 3D scene is an ES module, which file:// cannot load).
{
  const server = await new Promise((res) => {
    const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      fs.readFile(path.join(SITE, u), (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); r.end(d); });
    }).listen(0, () => res(s));
  });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('eo-seen', '1'); localStorage.setItem('eo-cookie', 'no'); } catch (e) { /* ignore */ } });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${server.address().port}/index.html`);
  await p.waitForSelector('#stage.has-3d', { timeout: 20000 }); // fail loudly rather than ship a fallback image
  await p.addStyleTag({ content: '.announce,.site-header,.cookie,.mobile-cta,.scroll-cue,.progress,.toast,.hero-tag,.chip,.hero-cta{display:none!important}.hero{min-height:630px!important;height:630px}.hero-inner{padding-bottom:0!important}.hero-stage{height:600px!important;max-height:none!important}' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2500); // let the steam and the wordmark wipe settle
  await p.screenshot({ path: path.join(SITE, 'img/og.png') });
  await ctx.close(); server.close();
}
// Printable menu
{
  const p = await browser.newPage();
  await p.goto(url('menu.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(SITE, 'menu.pdf'), format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' } });
  await p.close();
}
await browser.close();
for (const f of ['favicon.ico', 'img/apple-touch-icon.png', 'img/icon-192.png', 'img/icon-512.png', 'img/icon-maskable-512.png', 'img/og.png', 'menu.pdf']) console.log(f, fs.statSync(path.join(SITE, f)).size, 'bytes');
