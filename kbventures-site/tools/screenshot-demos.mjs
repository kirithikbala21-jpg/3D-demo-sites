// Rebuilds the demo previews in ../img/ as one matching set: each demo's front page at 1440x900 (saved 1280x800)
// 1440x2200 (saved 1280x1956, for the slow scroll inside the frame) and 390x844 (saved 480x1039),
// with the clock frozen at Tuesday 27 October 2026, 12:00 Melbourne time and the live banners hidden.
// Run from the repo root while a static server is up:
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   node kbventures-site/tools/screenshot-demos.mjs
// Needs Playwright with Chromium, and Python with Pillow for the WebP conversion.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8123/';
const IMG = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'img');
const TMP = mkdtempSync(path.join(tmpdir(), 'kb-shots-'));
const DEMOS = { gym: 'gym-demo', barber: 'barber-demo', cafe: 'cafe-demo-v2', plumber: 'plumber-demo', salon: 'salon-demo' };
const HIDE = '.announce,.notice-bar,.open-bar,.open-banner,.open-strip,.cookie,#cookie,.nojs-banner,.preloader,.toast,.progress{display:none!important}html{--ticker-h:0px!important}';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [slug, dir] of Object.entries(DEMOS)) {
  // 'tall' is the top 1440x2200 of the page, taken from a normal 1440x900 window (a 2200px-tall window would stretch the
  // full-screen heroes): the long screenshot that scrolls slowly inside the browser frame on hover
  for (const [tag, viewport, dpr] of [['desktop', { width: 1440, height: 900 }, 1], ['tall', { width: 1440, height: 900 }, 1], ['mobile', { width: 390, height: 844 }, 2]]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, timezoneId: 'Australia/Melbourne', locale: 'en-AU', isMobile: tag === 'mobile', hasTouch: tag === 'mobile' });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date('2026-10-27T01:00:00Z')); // a weekday at midday in Melbourne
    await page.addInitScript(() => { try { sessionStorage.setItem('vc-seen', '1'); localStorage.setItem('vc-announce', 'off'); } catch (_) {} });
    await page.goto(`${BASE}${dir}/index.html${tag !== 'mobile' ? '?3d=on' : ''}`, { waitUntil: 'load' });
    await page.addStyleTag({ content: HIDE });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(8000); // 3D heroes, reveals and lazy images settle
    if (tag === 'tall') { // scroll down 2200px so the scroll reveals and lazy images run, then come back to the top
      for (let y = 0; y <= 2200; y += 300) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(250); }
      await page.waitForTimeout(1500);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(tag === 'tall' ? 1500 : 400);
    await page.screenshot(tag === 'tall' ? { path: path.join(TMP, `${slug}-${tag}.png`), fullPage: true, clip: { x: 0, y: 0, width: 1440, height: 2200 }, timeout: 180000 } : { path: path.join(TMP, `${slug}-${tag}.png`) });
    await ctx.close();
    console.log('captured', slug, tag);
  }
}
await browser.close();

execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
tmp, out = sys.argv[1], sys.argv[2]
for slug in sys.argv[3:]:
    Image.open(f'{tmp}/{slug}-desktop.png').convert('RGB').resize((1280, 800), Image.LANCZOS).save(f'{out}/{slug}-desktop.webp', 'WEBP', quality=76, method=6)
    Image.open(f'{tmp}/{slug}-tall.png').convert('RGB').resize((1280, 1956), Image.LANCZOS).save(f'{out}/{slug}-tall.webp', 'WEBP', quality=72, method=6)
    Image.open(f'{tmp}/{slug}-mobile.png').convert('RGB').resize((480, 1039), Image.LANCZOS).save(f'{out}/{slug}-mobile.webp', 'WEBP', quality=74, method=6)
`, TMP, IMG, ...Object.keys(DEMOS)], { stdio: 'inherit' });
console.log('saved to', IMG);
