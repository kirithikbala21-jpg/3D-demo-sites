// Renders the stills and images made from the 3D card and the hallmark:
//   assets/card-still.{avif,webp,jpg} (1800 x 1400) and card-still-s.* (900 x 700): what phones, low-power devices,
//     reduced motion and browsers without WebGL see in place of the real-time card (js/hero3d.js with ?still=1)
//   img/og.jpg (1200 x 630): the share image, from the same card
//   img/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png and favicon.ico: the hallmark
//
//   1. serve the repo root:   python3 -m http.server 8123 --bind 127.0.0.1
//   2. run:                   node black-crest-site/tools/render-still.mjs  [base URL, default http://127.0.0.1:8123/]
// Needs Playwright (Chromium) and Python 3 with Pillow.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const { chromium } = createRequire(import.meta.url)('playwright');
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'http://127.0.0.1:8123/') + 'black-crest-site/';
const tmp = mkdtempSync(path.join(os.tmpdir(), 'bc-still-'));
const LOGO = JSON.parse(readFileSync(path.join(SITE, 'tools', 'logo.json'), 'utf8'));

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.addInitScript(() => { try { sessionStorage.setItem('bc-pre', '1'); } catch (_) {} });
await page.goto(BASE + '?still=1', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
// the card, drawn once at 900 x 700 css px (core.js may have started one already: it is replaced)
await page.evaluate(() => import('./js/hero3d.js').then((m) => {
  const s = document.querySelector('.hero-stage'); s.querySelectorAll('canvas').forEach((c) => c.remove());
  s.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:700px;z-index:9999'; window.__cardReady = false; return m.start(s, {});
}));
await page.waitForFunction(() => window.__cardReady, null, { timeout: 180000 });
const data = await page.evaluate(() => [...document.querySelectorAll('.hero-stage canvas')].pop().toDataURL('image/png'));
writeFileSync(path.join(tmp, 'card.png'), Buffer.from(data.split(',')[1], 'base64'));
// the hallmark at icon sizes (outline thicker at small sizes so it stays visible)
const icon = (size, frac, stroke) => `<!doctype html><body style="margin:0;background:#0D0E12;width:${size}px;height:${size}px;display:grid;place-items:center">
  <svg viewBox="0 0 40 48" style="height:${Math.round(size * frac)}px"><path d="${LOGO.crest}" fill="none" stroke="#D4AF37" stroke-width="${stroke}" stroke-linejoin="round"/><path d="${LOGO.letters}" fill="#E4E6ED"/></svg></body>`;
for (const [name, size, frac, stroke] of [['icon-512', 512, 0.72, 0.9], ['icon-192', 192, 0.72, 1.1], ['icon-maskable-512', 512, 0.52, 1.1], ['apple-touch-icon', 180, 0.7, 1.2], ['favicon-64', 64, 0.86, 2]]) {
  await page.setViewportSize({ width: size, height: size }); await page.setContent(icon(size, frac, stroke));
  await page.screenshot({ path: path.join(tmp, name + '.png') });
}
await browser.close();

const out = (p) => path.join(SITE, p);
execFileSync('python3', ['-c', `
from PIL import Image, ImageDraw, ImageFont, ImageFilter
BG = (13, 14, 18, 255)
tmp, site = ${JSON.stringify(tmp)}, ${JSON.stringify(SITE)}
card = Image.open(tmp + '/card.png').convert('RGBA')
def save(im, stem):
    im.save(stem + '.webp', quality=82, method=6); im.save(stem + '.avif', quality=60)
    flat = Image.new('RGBA', im.size, BG); flat.alpha_composite(im); flat.convert('RGB').save(stem + '.jpg', quality=82, optimize=True, progressive=True)
save(card, site + '/assets/card-still'); save(card.resize((card.width // 2, card.height // 2), Image.LANCZOS), site + '/assets/card-still-s')
print('card still', card.size)

# og.jpg: the words on the left, the card on the right
og = Image.new('RGBA', (1200, 630), BG)
c = card.crop(card.getbbox()); h = 520; c = c.resize((round(c.width * h / c.height), h), Image.LANCZOS)
og.alpha_composite(c, (1200 - c.width + 40, 70))
d = ImageDraw.Draw(og)
serif = ImageFont.truetype(site + '/fonts/cormorant-garamond.woff2', 74); serif.set_variation_by_name('Medium')
sans = ImageFont.truetype(site + '/fonts/switzer-500.woff2', 20)
d.text((80, 150), 'BLACK CREST WEB DESIGNS', font=sans, fill=(169, 174, 186))
d.line((80, 192, 136, 192), fill=(212, 175, 55), width=2)
for i, line in enumerate(['Premium sites', 'for local', 'businesses']):
    d.text((80, 222 + i * 80), line, font=serif, fill=(228, 230, 237))
d.text((80, 520), 'Melbourne  ·  A free concept homepage first', font=sans, fill=(138, 143, 158))
og.convert('RGB').save(site + '/img/og.jpg', quality=86, optimize=True, progressive=True)
for n in ('icon-512', 'icon-192', 'icon-maskable-512', 'apple-touch-icon'):
    Image.open(f'{tmp}/{n}.png').convert('RGB').save(f'{site}/img/{n}.png', optimize=True)
Image.open(f'{tmp}/favicon-64.png').convert('RGB').save(site + '/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('og.jpg and icons')
`], { stdio: 'inherit' });
