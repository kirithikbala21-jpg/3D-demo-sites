// Renders the stills that stand in for the real-time 3D on phones, low-power devices, reduced motion and
// browsers without WebGL. It opens the home page with ?still=1, which makes js/hero3d.js and js/globe3d.js draw
// one fixed frame on a transparent background, and saves that frame at 2x as AVIF and WebP (plus a JPEG
// fallback on the page's own background colour). Also renders img/og.jpg (1200 x 630), the app icons and
// favicon.ico from the same 3D crest.
//
//   1. serve the repo root:   python3 -m http.server 8123 --bind 127.0.0.1
//   2. run:                   node black-crest-site/tools/render-still.mjs  [base URL, default http://127.0.0.1:8123/]
// Needs Playwright (Chromium) and Python 3 with Pillow.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const { chromium } = createRequire(import.meta.url)('playwright');
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'http://127.0.0.1:8123/') + 'black-crest-site/';
const tmp = mkdtempSync(path.join(os.tmpdir(), 'bc-still-'));

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.addInitScript(() => { try { sessionStorage.setItem('bc-pre', '1'); } catch (_) {} });
await page.goto(BASE + '?still=1', { waitUntil: 'load' });

// the crest, drawn once at a fixed size (core.js may have started one already: it is replaced)
await page.evaluate(() => { window.__crestReady = false; });
await page.evaluate(() => import('./js/hero3d.js').then((m) => { const s = document.querySelector('.hero-stage'); s.style.cssText = 'position:fixed;left:0;top:0;width:640px;height:760px;z-index:9999'; s.querySelectorAll('canvas').forEach((c) => c.remove()); m.start(s, {}); }));
await page.waitForFunction(() => window.__crestReady, null, { timeout: 120000 });
writeFileSync(path.join(tmp, 'crest.png'), Buffer.from((await page.evaluate(() => document.querySelector('.hero-stage canvas').toDataURL('image/png'))).split(',')[1], 'base64'));

// the globe
await page.evaluate(() => import('./js/globe3d.js').then((m) => { const g = document.querySelector('[data-globe]'); g.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:600px;z-index:9999;max-width:none'; m.start(g, {}); }));
await page.waitForFunction(() => window.__globeReady, null, { timeout: 120000 });
writeFileSync(path.join(tmp, 'globe.png'), Buffer.from((await page.evaluate(() => document.querySelector('[data-globe] canvas').toDataURL('image/png'))).split(',')[1], 'base64'));
await browser.close();

const out = (p) => path.join(SITE, p);
execFileSync('python3', ['-c', `
from PIL import Image, ImageDraw, ImageFont, ImageFilter
BG = (13, 14, 18, 255)
def save(src, stem, size):
    im = Image.open(src).convert('RGBA')
    im.save(stem + '.webp', quality=82, method=6)
    im.save(stem + '.avif', quality=60)
    flat = Image.new('RGBA', im.size, BG); flat.alpha_composite(im)
    flat.convert('RGB').save(stem + '.jpg', quality=82, optimize=True, progressive=True)
    if 'crest' in stem:  # a half-size copy for phones
        sm = im.resize((im.width // 2, im.height // 2), Image.LANCZOS); sm.save(stem + '-s.webp', quality=82, method=6); sm.save(stem + '-s.avif', quality=60)
        fs = Image.new('RGBA', sm.size, BG); fs.alpha_composite(sm); fs.convert('RGB').save(stem + '-s.jpg', quality=82, optimize=True, progressive=True)
    print(stem, im.size)
save(${JSON.stringify(path.join(tmp, 'crest.png'))}, ${JSON.stringify(out('assets/crest-still'))}, None)
save(${JSON.stringify(path.join(tmp, 'globe.png'))}, ${JSON.stringify(out('assets/globe-still'))}, None)

# og.jpg: the 3D crest on the right, the line on the left
crest = Image.open(${JSON.stringify(path.join(tmp, 'crest.png'))}).convert('RGBA')
og = Image.new('RGBA', (1200, 630), BG)
glow = Image.new('RGBA', (1200, 630), (0, 0, 0, 0)); d = ImageDraw.Draw(glow)
d.ellipse((700, 40, 1180, 600), fill=(212, 175, 55, 34)); glow = glow.filter(ImageFilter.GaussianBlur(90)); og.alpha_composite(glow)
h = 560; c = crest.resize((round(crest.width * h / crest.height), h), Image.LANCZOS)
og.alpha_composite(c, (1200 - c.width - 70, 35))
d = ImageDraw.Draw(og)
serif = ImageFont.truetype(${JSON.stringify(out('fonts/cormorant-garamond.woff2'))}, 76); serif.set_variation_by_name('Medium')
sans = ImageFont.truetype(${JSON.stringify(out('fonts/inter.woff2'))}, 22); sans.set_variation_by_name('Medium')
d.text((80, 150), 'BLACK CREST WEB DESIGNS', font=sans, fill=(169, 174, 186))
d.line((80, 196, 140, 196), fill=(212, 175, 55), width=2)
for i, line in enumerate(['Premium sites', 'for local', 'businesses']):
    d.text((80, 230 + i * 82), line, font=serif, fill=(228, 230, 237))
d.text((80, 520), 'Melbourne  ·  A free concept homepage first', font=sans, fill=(138, 143, 158))
og.convert('RGB').save(${JSON.stringify(out('img/og.jpg'))}, quality=86, optimize=True, progressive=True)
print('og.jpg')

# app icons and the favicon, from the same crest
cc = crest.crop(crest.getbbox())
def icon(size, frac):
    im = Image.new('RGBA', (size, size), BG); h = round(size * frac); w = round(cc.width * h / cc.height)
    im.alpha_composite(cc.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2)); return im.convert('RGB')
for size, frac, name in [(512, .78, 'img/icon-512.png'), (192, .78, 'img/icon-192.png'), (512, .56, 'img/icon-maskable-512.png'), (180, .74, 'img/apple-touch-icon.png')]:
    icon(size, frac).save(${JSON.stringify(SITE)} + '/' + name, optimize=True)
icon(256, .86).save(${JSON.stringify(out('favicon.ico'))}, sizes=[(16, 16), (32, 32), (48, 48)])
print('icons')
`], { stdio: 'inherit' });
