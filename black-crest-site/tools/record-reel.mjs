// Records the home page showreel: each of the six concept sites (never any other folder) at 1440 x 900, scrolled
// slowly from the top, captured frame by frame for crisp text, then joined with crossfades by ffmpeg.
// Output: assets/reel.mp4 (H.264, no audio), assets/reel.webm (VP9) and assets/reel-poster.webp/.avif.
// Last run: 1 Nov 2026, 23.4 s at 1280 x 800, reel.mp4 2.6 MB.
//
//   1. serve the repo root:   python3 -m http.server 8123 --bind 127.0.0.1
//   2. run:                   node black-crest-site/tools/record-reel.mjs  [base URL, default http://127.0.0.1:8123/]
// Needs Playwright (Chromium), ffmpeg and Python 3 with Pillow (for the poster).
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync, existsSync, statSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const { chromium } = createRequire(import.meta.url)('playwright'); // works with a global install too
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(SITE, 'assets');
const BASE = process.argv[2] || 'http://127.0.0.1:8123/';
const THREE = path.join(SITE, 'vendor', 'three', 'three.module.min.js');
// the six concepts, in reel order. Nothing else is ever recorded.
const DEMOS = ['barber-demo', 'cafe-demo-v2', 'gym-demo', 'plumber-demo', 'salon-demo', 'parts-store-demo'];
const FPS = 24, CLIP = 4.4, HOLD = 0.7, FADE = 0.6, W = 1440, H = 900;
const tmp = path.join(os.tmpdir(), 'bc-reel'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
for (const [n, demo] of DEMOS.entries()) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  // the demos' own Three.js import is served from this folder's vendored copy; other outside requests are dropped
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => (/three(\.module)?(\.min)?\.js$/.test(r.request().url()) ? r.fulfill({ path: THREE, contentType: 'text/javascript' }) : r.abort()));
  const page = await ctx.newPage();
  await page.goto(BASE + demo + '/', { waitUntil: 'load' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(1500);
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const dist = Math.min(max, H * 1.7);
  const dir = path.join(tmp, String(n)); mkdirSync(dir);
  const frames = Math.round(CLIP * FPS);
  for (let f = 0; f < frames; f++) {
    const t = f / FPS, k = t < HOLD ? 0 : ease(Math.min(1, (t - HOLD) / (CLIP - HOLD - 0.3)));
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(dist * k));
    await page.waitForTimeout(1000 / FPS);
    await page.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  await ctx.close();
  console.log('recorded', demo, frames, 'frames');
}
await browser.close();

// join: each clip is a frame sequence, crossfaded into the next
const inputs = DEMOS.flatMap((_, n) => ['-framerate', String(FPS), '-i', path.join(tmp, String(n), '%04d.jpg')]);
let chain = '', prev = '[0:v]', offset = 0;
for (let n = 1; n < DEMOS.length; n++) {
  offset += CLIP - FADE;
  const out = n === DEMOS.length - 1 ? '[v]' : `[x${n}]`;
  chain += `${prev}[${n}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}${out};`;
  prev = out;
}
const filter = chain + '[v]scale=1280:-2:flags=lanczos,format=yuv420p[o]';
const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[o]', '-an', ...args], { stdio: 'inherit' });
ff(['-c:v', 'libx264', '-crf', '28', '-preset', 'veryfast', '-movflags', '+faststart', path.join(OUT, 'reel.mp4')]);
ff(['-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', path.join(OUT, 'reel.webm')]);
// poster: the first frame of the first concept
const first = path.join(tmp, '0', '0000.jpg');
execFileSync('python3', ['-c', `from PIL import Image
im = Image.open(${JSON.stringify(first)}).convert('RGB').resize((1280, 800), Image.LANCZOS)
im.save(${JSON.stringify(path.join(OUT, 'reel-poster.webp'))}, quality=78, method=6)
im.save(${JSON.stringify(path.join(OUT, 'reel-poster.avif'))}, quality=55)`]);
for (const f of ['reel.mp4', 'reel.webm', 'reel-poster.webp', 'reel-poster.avif']) console.log(f, (statSync(path.join(OUT, f)).size / 1024).toFixed(0) + ' KB');
rmSync(tmp, { recursive: true, force: true });
