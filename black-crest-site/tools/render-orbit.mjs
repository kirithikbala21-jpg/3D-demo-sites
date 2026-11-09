// Renders the scroll-scrubbed hero frames: assets/orbit/f-001.webp ... (the 3D card, camera slowly circling and pushing in).
//   1. serve this folder (python3 -m http.server 8123 --bind 127.0.0.1 inside it)
//   2. node tools/render-orbit.mjs [base URL] [frames] [width] [height] [outdir]
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync, mkdtempSync } from 'fs';
import path from 'path'; import os from 'os';
import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [BASE = 'http://127.0.0.1:8123/', N = '90', W = '1280', H = '720', OUT = 'assets/orbit'] = process.argv.slice(2);
const n = +N, w = +W, h = +H, tmp = mkdtempSync(path.join(os.tmpdir(), 'orbit-'));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.addInitScript(() => { try { sessionStorage.setItem('bc-pre', '1'); } catch (_) {} });
await page.goto(BASE + '?frames=1', { waitUntil: 'load' });
await page.evaluate(([w, h]) => import('./js/hero3d.js').then((m) => {
  const s = document.createElement('div'); s.className = 'hero-stage'; document.body.append(s);
  s.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:9999`; window.__cardReady = false; return m.start(s, {});
}), [w, h]);
await page.waitForFunction(() => window.__cardReady, null, { timeout: 180000 });
for (let i = 0; i < n; i++) {
  const data = await page.evaluate((u) => { window.__setU(u); return [...document.querySelectorAll('.hero-stage canvas')].pop().toDataURL('image/png'); }, i / (n - 1));
  writeFileSync(path.join(tmp, `f-${String(i + 1).padStart(3, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
}
await browser.close();
const out = path.join(SITE, OUT); mkdirSync(out, { recursive: true });
execFileSync('python3', ['-c', `
import glob,os
from PIL import Image
for f in sorted(glob.glob(${JSON.stringify(tmp)}+'/f-*.png')):
    im=Image.open(f).convert('RGBA'); bg=Image.new('RGBA',im.size,(13,14,18,255)); bg.alpha_composite(im)
    bg.convert('RGB').save(${JSON.stringify(out)}+'/'+os.path.basename(f)[:-4]+'.webp',quality=74,method=6)
print('frames',len(glob.glob(${JSON.stringify(out)}+'/f-*.webp')))
`], { stdio: 'inherit' });
