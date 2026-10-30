// Makes every image the Black Crest site uses, in ../img/:
//   work/<demo>.webp      phone screenshots of the six concept demos (the demo folders are only opened, never changed)
//   compare-before.webp   a deliberately dated, generic homepage mockup (made here, not a real site)
//   compare-after.webp    the Brass & Blade concept homepage
//   og.jpg                1200x630 share image with the crest and tagline
//   icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png, ../favicon.ico
// Run from the repo root while a static server is up:
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   node black-crest-site/tools/make-images.mjs
// Needs Playwright with Chromium, and Python with Pillow (for WebP, JPEG and ICO).
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8123/';
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG = path.join(SITE, 'img');
const TMP = mkdtempSync(path.join(tmpdir(), 'bc-img-'));
mkdirSync(path.join(IMG, 'work'), { recursive: true });
const DEMOS = { barber: 'barber-demo', cafe: 'cafe-demo-v2', gym: 'gym-demo', plumber: 'plumber-demo', salon: 'salon-demo', parts: 'parts-store-demo' };
const HIDE = '.announce,.notice-bar,.open-bar,.open-banner,.open-strip,.cookie,#cookie,.nojs-banner,.preloader,.toast,.progress,.demo-bar,.demo-banner,.g-rating,.g-rating-text,.g-rating-demo,.hero-rating,.footer-rating,.rating-summary,.stars{display:none!important}html{--ticker-h:0px!important}';
// made-up ratings inside the demos are hidden in these screenshots: the Black Crest site never shows ratings or reviews
// fonts embedded as data URLs (setContent pages have no origin, so a font URL would be blocked)
const font = (f) => `url(data:font/woff2;base64,${readFileSync(path.join(SITE, 'fonts', f)).toString('base64')})`;
const FONTS = `@font-face{font-family:CG;src:${font('cormorant-garamond.woff2')};font-weight:300 700}@font-face{font-family:IN;src:${font('inter.woff2')};font-weight:100 900}`;
const CREST = (w) => `<svg viewBox="0 0 48 56" width="${w}" style="overflow:visible"><path d="M24 2.5 43.5 9.2V26c0 12.6-8.1 21.6-19.5 27.5C12.6 47.6 4.5 38.6 4.5 26V9.2Z" fill="none" stroke="#D4AF37" stroke-width="1.6" stroke-linejoin="round"/><path d="M24 7.6 38.6 12.6V26c0 9.6-6 16.6-14.6 21.4C15.4 42.6 9.4 35.6 9.4 26V12.6Z" fill="none" stroke="#D4AF37" stroke-width=".8" opacity=".45"/><text x="24" y="32.6" text-anchor="middle" fill="#E4E6ED" style="font:600 17px CG">BC</text></svg>`;

// A deliberately dated, generic homepage for the "before" side. Made up for the comparison: not a real site.
const BEFORE = `<!doctype html><html><head><style>
body{margin:0;background:#c9c9c9 linear-gradient(#e8e8e8,#a9a9a9);font:15px "Times New Roman",Times,serif;color:#222}
.wrap{width:900px;margin:0 auto;background:#f4f1e8;border:3px ridge #888;min-height:900px}
.top{background:linear-gradient(#5a2a12,#2b1206);color:#ffd84d;text-align:center;padding:18px 0 10px;border-bottom:4px double #c49a1c}
.top h1{margin:0;font:bold 40px "Comic Sans MS","Comic Neue",cursive;text-shadow:3px 3px 0 #000}
.top p{margin:6px 0 0;color:#fff;font-style:italic}
.nav{background:#1b3a8a;padding:6px;text-align:center;border-bottom:2px outset #6f8fd8}
.nav a{color:#fff;margin:0 10px;font:bold 13px Arial;text-decoration:underline}
.cols{display:flex;gap:14px;padding:14px}
.side{width:200px;background:#e2dccb;border:2px inset #aaa;padding:8px;font:12px Arial}
.side a{color:#00e;display:block;margin:6px 0}
.main{flex:1}
.main h2{color:#8b0000;font:bold 24px "Times New Roman";margin:4px 0 8px;text-align:center}
.blink{color:red;font:bold 14px Arial;text-align:center}
.photo{height:230px;background:repeating-linear-gradient(45deg,#bbb 0 10px,#c8c8c8 10px 20px);border:2px solid #777;display:grid;place-items:center;color:#555;font:italic 14px Arial;margin:10px 0}
.small{font:11px Verdana;color:#444}
table{border-collapse:collapse;width:100%;font:13px Arial;background:#fff}td{border:1px solid #999;padding:4px 6px}
.foot{margin:14px;padding:8px;border-top:1px dashed #999;font:10px Verdana;color:#666;text-align:center}
</style></head><body><div class="wrap">
<div class="top"><h1>Welcome to Brass &amp; Blade Barbershop!!!</h1><p>~ Haircuts ~ Shaves ~ Beards ~ And More ~</p></div>
<div class="nav"><a>HOME</a><a>ABOUT US</a><a>SERVICES</a><a>GALLERY</a><a>LINKS</a><a>CONTACT US</a><a>GUESTBOOK</a></div>
<div class="cols"><div class="side"><b>Quick Links</b><a>Click here for prices</a><a>Click here for hours</a><a>Our Facebook page</a><a>Directions (PDF)</a><a>Sign our guestbook!</a><br><b>Opening Hours</b><br>Please call for opening hours.<br><br><b>Call Us</b><br><span class="small">Phone number on our Facebook page</span></div>
<div class="main"><h2>Your Friendly Local Barbershop</h2><p class="blink">*** NEW WEBSITE COMING SOON ***</p>
<div class="photo">[ photo of shop ]</div>
<p>Welcome to our website. We are a barbershop offering a wide range of services for men and boys. Please browse our website using the links above and on the left. For bookings please call us or come in during opening hours. Thank you for visiting our website and we hope to see you soon!!</p>
<table><tr><td><b>Service</b></td><td><b>Price</b></td></tr><tr><td>Haircut</td><td>Please ask</td></tr><tr><td>Beard</td><td>Please ask</td></tr><tr><td>Shave</td><td>Please ask</td></tr></table>
<p class="small">Best viewed in Internet Explorer at 1024x768.</p></div></div>
<div class="foot">Copyright Brass &amp; Blade. All rights reserved. Site designed with a free website builder.</div></div></body></html>`;

// The 1200x630 share image: obsidian, the crest and the tagline. Gold stays to the crest and two hairlines.
const OG = `<!doctype html><html><head><style>${FONTS}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#0D0E12}
body{position:relative;font-family:IN;color:#E4E6ED;background:radial-gradient(60% 80% at 82% 10%,rgba(212,175,55,.10),transparent 60%),radial-gradient(60% 70% at 0% 100%,rgba(120,128,150,.16),transparent 65%),#0D0E12}
.frame{position:absolute;inset:28px;border:1px solid rgba(228,230,237,.10);border-radius:28px}
.row{position:absolute;left:96px;right:96px;top:0;bottom:0;display:flex;align-items:center;gap:72px}
.mark{flex:none;width:230px}
h1{margin:0;font:600 104px/0.95 CG;letter-spacing:-.01em}
.sub{margin-top:14px;font:500 17px IN;letter-spacing:.42em;text-transform:uppercase;color:#8A8F9E}
.line{width:72px;height:1px;background:#D4AF37;margin:34px 0 26px}
.tag{font:italic 500 44px/1.15 CG;color:#E4E6ED}
.foot{position:absolute;left:96px;bottom:58px;font:500 15px IN;letter-spacing:.26em;text-transform:uppercase;color:#8A8F9E}
</style></head><body><div class="frame"></div><div class="row"><div class="mark">${CREST(230)}</div><div><h1>Black Crest</h1><div class="sub">Web Designs</div><div class="line"></div><div class="tag">Premium sites for local businesses</div></div></div><div class="foot">A KB Ventures company &middot; Melbourne</div></body></html>`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const shot = async (opts, fn, file) => {
  const ctx = await browser.newContext({ timezoneId: 'Australia/Melbourne', locale: 'en-AU', ...opts });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-10-27T01:00:00Z')); // a weekday at midday in Melbourne
  await page.addInitScript(() => { try { sessionStorage.setItem('vc-seen', '1'); localStorage.setItem('vc-announce', 'off'); } catch (_) {} });
  await fn(page);
  await page.screenshot({ path: path.join(TMP, file), timeout: 120000 });
  await ctx.close();
  console.log('captured', file);
};
const demo = (dir, threeD = 'on') => async (page) => {
  await page.goto(`${BASE}${dir}/index.html?3d=${threeD}`, { waitUntil: 'load' });
  await page.addStyleTag({ content: HIDE });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(7000);
};
// phone screenshots
for (const [slug, dir] of Object.entries(DEMOS)) await shot({ viewport: { width: 390, height: 845 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true }, demo(dir, 'off'), `work-${slug}.png`); // phones: the demos' still-image hero
// before/after (desktop)
await shot({ viewport: { width: 1440, height: 900 } }, demo('barber-demo'), 'after.png');
await shot({ viewport: { width: 1440, height: 900 } }, async (page) => { await page.setContent(BEFORE); await page.waitForTimeout(300); }, 'before.png');
// share image
await shot({ viewport: { width: 1200, height: 630 } }, async (page) => { await page.setContent(OG); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400); }, 'og.png');
// icons
for (const [name, size, pad] of [['icon-512', 512, 0.2], ['icon-192', 192, 0.2], ['icon-maskable-512', 512, 0.3], ['apple-touch-icon', 180, 0.18], ['favicon-64', 64, 0.1]]) {
  await shot({ viewport: { width: size, height: size } }, async (page) => {
    await page.setContent(`<style>${FONTS}html,body{margin:0;width:${size}px;height:${size}px;background:#0D0E12;display:grid;place-items:center}</style>${CREST(Math.round(size * (1 - 2 * pad) * 48 / 56))}`);
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
  }, `${name}.png`);
}
await browser.close();

execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
tmp, img, site, *slugs = sys.argv[1:]
for s in slugs:
    im = Image.open(f'{tmp}/work-{s}.png').convert('RGB')          # 585 x 1268
    im = im.crop((0, 0, im.width, int(im.width * 19.5 / 9))).resize((540, 1170), Image.LANCZOS)
    im.save(f'{img}/work/{s}.webp', 'WEBP', quality=68, method=6)
for n in ('before', 'after'):
    Image.open(f'{tmp}/{n}.png').convert('RGB').resize((1200, 750), Image.LANCZOS).save(f'{img}/compare-{n}.webp', 'WEBP', quality=72, method=6)
Image.open(f'{tmp}/og.png').convert('RGB').save(f'{img}/og.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
for n in ('icon-512', 'icon-192', 'icon-maskable-512', 'apple-touch-icon'):
    Image.open(f'{tmp}/{n}.png').convert('RGB').save(f'{img}/{n}.png', optimize=True)
Image.open(f'{tmp}/favicon-64.png').convert('RGBA').save(f'{site}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('saved images')
`, TMP, IMG, SITE, ...Object.keys(DEMOS)], { stdio: 'inherit' });
