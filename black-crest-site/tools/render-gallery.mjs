// Renders the stills for "The concept collection" (js/gallery3d.js):
//   assets/gallery/wall.{avif,webp,jpg}      the whole wall (2400 x 1021), for desktops without real-time 3D
//   assets/gallery/niche-<slug>.{avif,webp,jpg}  each niche close up (840 x 1120), the two-column grid on phones
//   assets/gallery/detail-<slug>.{avif,webp,jpg} each niche with its laptop and phone (1040 x 1280), for the case studies
//   tools/gallery.json                       where each niche sits on the wall, as percentages, for the links on top
//
//   1. serve the repo root:   python3 -m http.server 8123 --bind 127.0.0.1
//   2. run:                   node black-crest-site/tools/render-gallery.mjs  [base URL, default http://127.0.0.1:8123/]
// Needs Playwright (Chromium) and Python 3 with Pillow.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync, mkdtempSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const { chromium } = createRequire(import.meta.url)('playwright');
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'http://127.0.0.1:8123/') + 'black-crest-site/';
const SLUGS = ['barber', 'cafe', 'gym', 'plumber', 'salon', 'parts'];
const tmp = mkdtempSync(path.join(os.tmpdir(), 'bc-gallery-'));
mkdirSync(path.join(SITE, 'assets', 'gallery'), { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function shot(query, w, h, file) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  await page.addInitScript(() => { try { sessionStorage.setItem('bc-pre', '1'); } catch (_) {} });
  await page.goto(BASE + query, { waitUntil: 'load' });
  const pos = await page.evaluate(([w, h]) => import('./js/gallery3d.js').then((m) => {
    const d = document.createElement('div'); d.dataset.base = ''; d.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:9999`;
    document.body.append(d); window.__g = d; return m.start(d, {});
  }), [w, h]);
  const data = await page.evaluate(() => window.__g.querySelector('canvas').toDataURL('image/png'));
  writeFileSync(path.join(tmp, file), Buffer.from(data.split(',')[1], 'base64'));
  await page.close();
  return pos;
}
const positions = await shot('?still=wall', 1200, Math.round(1200 / 2.35), 'wall.png');
writeFileSync(path.join(SITE, 'tools', 'gallery.json'), JSON.stringify(positions.map((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, +v.toFixed(2)]))), null, 1));
for (const [i, slug] of SLUGS.entries()) {
  await shot(`?still=niche&n=${i}`, 420, 560, `niche-${slug}.png`);
  await shot(`?still=detail&n=${i}`, 520, 640, `detail-${slug}.png`); // the case study's lit niche: laptop and phone
}
await browser.close();

execFileSync('python3', ['-c', `
import glob, os
from PIL import Image
tmp, out = ${JSON.stringify(tmp)}, ${JSON.stringify(path.join(SITE, 'assets', 'gallery'))}
for f in sorted(glob.glob(tmp + '/*.png')):
    stem = os.path.join(out, os.path.basename(f)[:-4])
    im = Image.open(f).convert('RGBA'); flat = Image.new('RGBA', im.size, (13, 14, 18, 255)); flat.alpha_composite(im); flat = flat.convert('RGB')
    flat.save(stem + '.avif', quality=58); flat.save(stem + '.webp', quality=80, method=6); flat.save(stem + '.jpg', quality=80, optimize=True, progressive=True)
    print(os.path.basename(stem), flat.size, os.path.getsize(stem + '.avif') // 1024, 'KB avif')
`], { stdio: 'inherit' });
