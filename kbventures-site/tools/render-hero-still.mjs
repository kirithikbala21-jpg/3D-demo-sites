// Renders img/hero-object.webp: the hero's 3D object in its rest pose, with a transparent background,
// shown while the 3D loads and instead of it (no WebGL, reduced motion, Data Saver, low-powered phones).
// Run from the repo root while a static server is up:
//   python3 -m http.server 8123 --bind 127.0.0.1 &
//   node kbventures-site/tools/render-hero-still.mjs
// Needs Playwright with Chromium, and Python with Pillow for the WebP conversion.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8123/';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'img', 'hero-object.webp');
const png = path.join(mkdtempSync(path.join(tmpdir(), 'kb-hero-')), 'hero.png');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(`${BASE}kbventures-site/index.html?3d=on&capture`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__hero, null, { timeout: 30000 });
await page.addStyleTag({ content: '.hero-stage{transform:none!important} .hero-still{display:none!important} .spotlight,.hero-glow,.speck{display:none!important} #scene{opacity:1!important;animation:none!important} html,body{background:transparent!important} body::before,body::after{display:none!important} .hero-text,.nav{visibility:hidden!important}' });
await page.evaluate(() => window.__hero.still());
await page.waitForTimeout(300);
await page.locator('#scene').screenshot({ path: png, omitBackground: true });
await browser.close();

execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA')
im.resize((1200, round(1200 * im.height / im.width)), Image.LANCZOS).save(sys.argv[2], 'WEBP', quality=86, method=6)
print(im.size)
`, png, OUT], { stdio: 'inherit' });
console.log('saved', OUT);
