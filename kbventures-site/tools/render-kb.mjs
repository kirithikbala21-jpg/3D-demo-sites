// Renders the KB Ventures stills (a still is what phones, low-power devices, reduced motion and browsers without
// WebGL see; the galleries always use stills):
//   (og.jpg and biz-black-crest.* are made by tools/make-renders.py from the hero renders)
//   img/niches/biz-aceguides.*, biz-black-crest.*: the two businesses, each in its lit niche
//   img/niches/<guide key>.*: every AceGuides guide that has a cover, as a book in its lit niche
//
//   1. serve the repo root:   python3 -m http.server 8123 --bind 127.0.0.1
//   2. run:                   node kbventures-site/tools/render-kb.mjs  [base URL, default http://127.0.0.1:8123/]
// Needs Playwright (Chromium) and Python 3 with Pillow.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync, mkdtempSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const { chromium } = createRequire(import.meta.url)('playwright');
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = (process.argv[2] || 'http://127.0.0.1:8123/'), BASE = ROOT + 'kbventures-site/';
const cfg = JSON.parse(readFileSync(path.join(SITE, 'site.config.json'), 'utf8'));
const tmp = mkdtempSync(path.join(os.tmpdir(), 'kb-render-'));
mkdirSync(path.join(SITE, 'img', 'niches'), { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function blank(w, h) {
  const p = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  await p.goto(BASE + 'robots.txt?still=1');
  await p.setContent(`<html><head><base href="${BASE}"><style>@font-face{font-family:Switzer;src:url(fonts/switzer-500.woff2);font-weight:500}@font-face{font-family:"Cormorant Garamond";src:url(fonts/cormorant-garamond.woff2);font-weight:300 700}</style></head><body style="margin:0"><div id="s" style="width:${w}px;height:${h}px"></div></body></html>`);
  await p.evaluate(() => history.replaceState(null, '', location.pathname.replace(/[^/]*$/, '') + 'robots.txt?still=1'));
  return p;
}
const save = (name, data) => writeFileSync(path.join(tmp, name + '.png'), Buffer.from(data.split(',')[1], 'base64'));

// (the hero is now a digital render: img/renders, made by tools/make-renders.py)
let p;
// the niches
// biz-black-crest comes from the Black Crest render (tools/make-renders.py), so it matches that site
const jobs = [['biz-aceguides', { object: 'book', cover: 'img/aceguides/vce34-english.webp' }]];
for (const g of cfg.aceguides.groups) for (const x of g.products) if (x.cover) jobs.push([x.key, { object: 'book', cover: x.cover }]);
for (const [name, opts] of jobs) {
  p = name.startsWith('biz-') ? await blank(560, 600) : await blank(360, 480);
  save(name, await p.evaluate((o) => import('./tools/niche-scene.js').then((m) => m.render(document.getElementById('s'), o)), opts));
  await p.close(); console.log('rendered', name);
}
await browser.close();

execFileSync('python3', ['-c', `
import glob, os
from PIL import Image, ImageDraw, ImageFont
tmp, site = ${JSON.stringify(tmp)}, ${JSON.stringify(SITE)}
VOID = (8, 9, 11, 255)
def out(im, stem, alpha=False):
    if alpha: im.save(stem + '.webp', quality=82, method=6); im.save(stem + '.avif', quality=60)
    flat = Image.new('RGBA', im.size, VOID); flat.alpha_composite(im); flat = flat.convert('RGB')
    if not alpha: flat.save(stem + '.webp', quality=80, method=6); flat.save(stem + '.avif', quality=58)
    flat.save(stem + '.jpg', quality=80, optimize=True, progressive=True)
for f in glob.glob(tmp + '/*.png'):
    n = os.path.basename(f)[:-4]
    out(Image.open(f).convert('RGBA'), site + '/img/niches/' + n)
# og.jpg now comes from the hero render (tools/make-renders.py), so it is not written here
print('saved', len(glob.glob(tmp + '/*.png')), 'renders')
`], { stdio: 'inherit' });
