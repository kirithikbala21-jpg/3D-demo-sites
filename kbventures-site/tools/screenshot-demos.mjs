// Rebuilds the demo previews in ../img/: each demo's front page at 1440px (desktop) and 390px (phone),
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
  for (const [tag, viewport, dpr] of [['desktop', { width: 1440, height: 900 }, 1], ['mobile', { width: 390, height: 844 }, 2]]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, timezoneId: 'Australia/Melbourne', locale: 'en-AU', isMobile: tag === 'mobile', hasTouch: tag === 'mobile' });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date('2026-10-27T01:00:00Z')); // a weekday at midday in Melbourne
    await page.addInitScript(() => { try { sessionStorage.setItem('vc-seen', '1'); localStorage.setItem('vc-announce', 'off'); } catch (_) {} });
    await page.goto(`${BASE}${dir}/index.html${tag === 'desktop' ? '?3d=on' : ''}`, { waitUntil: 'load' });
    await page.addStyleTag({ content: HIDE });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(TMP, `${slug}-${tag}.png`) });
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
    Image.open(f'{tmp}/{slug}-desktop.png').convert('RGB').resize((1200, 750), Image.LANCZOS).save(f'{out}/{slug}-desktop.webp', 'WEBP', quality=74, method=6)
    Image.open(f'{tmp}/{slug}-mobile.png').convert('RGB').resize((600, 1299), Image.LANCZOS).save(f'{out}/{slug}-mobile.webp', 'WEBP', quality=72, method=6)
`, TMP, IMG, ...Object.keys(DEMOS)], { stdio: 'inherit' });
console.log('saved to', IMG);
