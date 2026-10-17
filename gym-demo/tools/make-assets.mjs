// Generates the binary assets that cannot be hand-written: PNG icons, favicon.ico and the share image (img/og.png).
// Usage (from the site folder):  node tools/make-assets.mjs     (needs tests/node_modules; set CHROME_PATH if Chromium is not auto-detected)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(pathToFileURL(path.join(SITE, 'tests/node_modules/playwright-core/index.mjs')).href);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const url = (f) => pathToFileURL(path.join(SITE, f)).href;

// PNG icons from the SVG masters: icon.svg (rounded, any) and icon-maskable.svg (full bleed with a safe zone)
const targets = [['icon.svg', 'icon-192.png', 192], ['icon.svg', 'icon-512.png', 512], ['icon-maskable.svg', 'icon-maskable-512.png', 512], ['icon-maskable.svg', 'apple-touch-icon.png', 180], ['icon.svg', '_ico48.png', 48]];
for (const [svg, name, size] of targets) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  await p.goto(url('img/' + svg));
  await p.screenshot({ path: path.join(SITE, 'img', name), omitBackground: true });
  await p.close();
}
// favicon.ico: a single 48x48 PNG wrapped in an ICO container
{
  const png = fs.readFileSync(path.join(SITE, 'img/_ico48.png'));
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head.writeUInt8(48, 6); head.writeUInt8(48, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(SITE, 'favicon.ico'), Buffer.concat([head, png]));
  fs.unlinkSync(path.join(SITE, 'img/_ico48.png'));
}
// Share image: a real screenshot of the live hero (3D barbell + headline), taken from a local static server
{
  const http = await import('node:http');
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
  const server = http.createServer((q, r) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    fs.readFile(path.join(SITE, u), (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); r.end(d); });
  }).listen(0);
  const gl = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await gl.newContext({ viewport: { width: 1200, height: 630 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('vc-seen', '1'); localStorage.setItem('vc-cookie', 'no'); localStorage.setItem('vc-announce', 'off'); } catch (e) { /* ignore */ } });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${server.address().port}/index.html?3d=on`);
  await p.addStyleTag({ content: '.announce,.cookie,.mobile-cta,.scroll-cue,.hero .chip,.hero-tag{display:none!important}' });
  await p.waitForSelector('#scene.is-ready', { timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(3500);
  await p.screenshot({ path: path.join(SITE, 'img/og.png') });
  await gl.close(); server.close();
}
await browser.close();
for (const f of ['img/apple-touch-icon.png', 'img/icon-192.png', 'img/icon-512.png', 'img/icon-maskable-512.png', 'favicon.ico', 'img/og.png']) console.log(f, fs.statSync(path.join(SITE, f)).size, 'bytes');
