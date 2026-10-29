// Makes the small website previews shown in the Black Crest Web Designs card ("See inside"): the top of three demo
// sites, captured at 1440px wide with the clock frozen and the live banners hidden, cropped to the first screen and
// saved as small WebP files in ../img/previews/ (640 x 400). The demo folders are only opened, never changed.
// Run from the repo root while a static server is up:
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   node kbventures-site/tools/make-previews.mjs
// Needs Playwright with Chromium, and Python with Pillow for the WebP conversion.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8123/';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'img', 'previews');
const TMP = mkdtempSync(path.join(tmpdir(), 'kb-previews-'));
const DEMOS = { barber: 'barber-demo', cafe: 'cafe-demo-v2', gym: 'gym-demo' };
const HIDE = '.announce,.notice-bar,.open-bar,.open-banner,.open-strip,.cookie,#cookie,.nojs-banner,.preloader,.toast,.progress{display:none!important}html{--ticker-h:0px!important}';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [slug, dir] of Object.entries(DEMOS)) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Australia/Melbourne', locale: 'en-AU' });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-10-27T01:00:00Z')); // a weekday at midday in Melbourne
  await page.addInitScript(() => { try { sessionStorage.setItem('vc-seen', '1'); localStorage.setItem('vc-announce', 'off'); } catch (_) {} });
  await page.goto(`${BASE}${dir}/index.html?3d=on`, { waitUntil: 'load' });
  await page.addStyleTag({ content: HIDE });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(8000); // 3D heroes, reveals and images settle
  await page.screenshot({ path: path.join(TMP, `${slug}.png`), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await ctx.close();
  console.log('captured', slug);
}
await browser.close();

execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
tmp, out = sys.argv[1], sys.argv[2]
for slug in sys.argv[3:]:
    Image.open(f'{tmp}/{slug}.png').convert('RGB').resize((640, 400), Image.LANCZOS).save(f'{out}/{slug}.webp', 'WEBP', quality=72, method=6)
    print('saved', slug + '.webp')
`, TMP, OUT, ...Object.keys(DEMOS)], { stdio: 'inherit' });
