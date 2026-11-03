// Site check: opens every page at 390, 768, 1280 and 1920 px wide and fails on
//   console errors, failed requests, broken internal links, sideways scrolling,
//   prices that do not match js/config.js, banned words, any link to the-one-barber, and the house-style bans in
//   CLAUDE.md section 6 (em dashes, icon libraries, corners over 6px, shadows, backdrop blur, Inter, Geist, Space Grotesk).
// Full-page screenshots go to tools/screens/ (ignored by git) for a visual review.
//
//   1. serve the repo root:   python3 -m http.server 8123 --bind 127.0.0.1
//   2. run:                   node black-crest-site/tools/check.mjs [--quick] [base URL]
//      --quick checks 390 and 1280 only, without screenshots.
// Never submits a form.
import { createRequire } from 'module';
import { readFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { chromium } = createRequire(import.meta.url)('playwright');
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.join(SITE, '..');
const args = process.argv.slice(2);
const QUICK = args.includes('--quick');
const BASE = (args.find((a) => a.startsWith('http')) || 'http://127.0.0.1:8123/') + 'black-crest-site/';
const WIDTHS = QUICK ? [390, 1280] : [390, 768, 1280, 1920];
const SHOTS = path.join(SITE, 'tools', 'screens');
if (!QUICK) mkdirSync(SHOTS, { recursive: true });

const CONFIG = JSON.parse(readFileSync(path.join(SITE, 'js', 'config.js'), 'utf8').split('/* CONFIG-START */')[1].split('/* CONFIG-END */')[0]);
const money = (n) => '$' + Number(n).toLocaleString('en-AU');
// every dollar amount the site may show: the packages, the care plan, the add-ons, the domain (about $20 a year),
// the concept homepage ($0), and the "often $3,000 or more" agency comparison on the pricing page
const ALLOWED = new Set([CONFIG.packages.onePage.price, CONFIG.packages.fullSite.price, CONFIG.carePlan.pricePerMonth, ...CONFIG.addOns.map((a) => a.from), 0, 20, 3000].map(money));
const BANNED = ['elevate', 'unlock', 'unleash', 'seamless', 'cutting-edge', 'game-changer', 'game changer', 'empower', 'journey', 'delve', 'robust', 'leverage', 'supercharge', 'next-level', 'world-class', 'revolutionise', 'revolutionize', 'transform your', "in today's digital age", 'look no further', 'take your business to the next level'];

const pages = [];
const walk = (dir) => readdirSync(dir).forEach((f) => {
  const full = path.join(dir, f), rel = path.relative(SITE, full);
  if (statSync(full).isDirectory()) { if (!['vendor', 'tools', 'node_modules', 'assets', 'img', 'fonts', 'js'].includes(f)) walk(full); }
  else if (f.endsWith('.html')) pages.push(rel.split(path.sep).join('/'));
});
walk(SITE);
pages.sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));

// pages that only forward elsewhere (a meta refresh) get the file checks, not a browser visit
const REDIRECTS = new Set(pages.filter((pg) => /http-equiv="refresh"/i.test(readFileSync(path.join(SITE, pg), 'utf8'))));
const problems = [];
const fail = (page, w, msg) => problems.push(`${page} @${w}: ${msg}`);

// links and words are checked once per page, from the HTML on disk
for (const pg of pages) {
  const html = readFileSync(path.join(SITE, pg), 'utf8');
  if (/the-one-barber/i.test(html)) fail(pg, '-', 'mentions the-one-barber');
  const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&rsquo;|&#39;|’/g, "'").replace(/\s+/g, ' ').toLowerCase();
  if (text.includes('\u2014')) fail(pg, '-', 'em dash in the copy');
  if (/lucide|heroicons?|feather-icons|font-?awesome|material-icons/i.test(html)) fail(pg, '-', 'a generic icon library');
  BANNED.forEach((b) => { if (new RegExp(`\\b${b.replace(/[-']/g, (c) => '\\' + c)}\\b`).test(text)) fail(pg, '-', `banned word "${b}"`); });
  (text.match(/\$\d{1,3}(?:,\d{3})*/g) || []).forEach((m) => { if (!ALLOWED.has(m)) fail(pg, '-', `price ${m} is not in js/config.js`); });
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|#|javascript:)/.test(href)) continue;
    const clean = href.split('#')[0].split('?')[0]; if (!clean) continue;
    let target = path.resolve(path.dirname(path.join(SITE, pg)), clean);
    if (clean.endsWith('/')) target = path.join(target, 'index.html');
    if (!target.startsWith(REPO)) { fail(pg, '-', `link leaves the repo: ${href}`); continue; }
    if (!existsSync(target)) fail(pg, '-', `broken link: ${href}`);
  }
}

const browser = await chromium.launch();
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, isMobile: w < 800, hasTouch: w < 800 });
  await ctx.addInitScript((desk) => {
    try { sessionStorage.setItem('bc-pre', '1'); } catch (_) {}
    if (desk) { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }); Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 }); }
  }, w >= 1280);
  // forms are never submitted: any request to the form service fails the check
  await ctx.route('**/api.web3forms.com/**', (r) => { fail('-', w, 'a form tried to submit'); r.abort(); });
  for (const pg of pages) {
    if (REDIRECTS.has(pg)) continue;
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') fail(pg, w, 'console: ' + m.text().slice(0, 140)); });
    page.on('pageerror', (e) => fail(pg, w, 'script error: ' + e.message.slice(0, 140)));
    page.on('requestfailed', (r) => { if (!/\.(mp4|webm)$/.test(r.url())) fail(pg, w, 'request failed: ' + r.url()); });
    page.on('response', (r) => { if (r.status() >= 400) fail(pg, w, `HTTP ${r.status()}: ${r.url()}`); });
    try {
      await page.goto(BASE + pg, { waitUntil: 'load', timeout: 45000 });
      // scroll through so every reveal runs, then back to the top
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 700) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(90); }
      await page.waitForTimeout(700);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      // house style (CLAUDE.md section 6), read from the computed styles of every element on the page
      if (w === WIDTHS[0] || w === 1280) {
        const style = await page.evaluate(() => {
          const out = [];
          for (const el of document.querySelectorAll('body *')) {
            if (!el.getClientRects().length) continue;
            const cs = getComputedStyle(el), tag = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
            const r = Math.max(...['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'].map((k) => parseFloat(cs[k]) || 0));
            if (r > 6) out.push(`radius ${r}px on ${tag}`);
            if (cs.boxShadow !== 'none') out.push(`box-shadow on ${tag}`);
            if ((cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none')) out.push(`backdrop-filter on ${tag}`);
            if (/\b(Inter|Geist|Space Grotesk)\b/i.test(cs.fontFamily)) out.push(`banned font on ${tag}`);
          }
          return [...new Set(out)].slice(0, 6);
        });
        style.forEach((x) => fail(pg, w, 'house style: ' + x));
      }
      if (over > 0) fail(pg, w, `sideways scroll of ${over}px`);
      if (!QUICK) {
        await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SHOTS, `${pg.replace(/\//g, '_').replace('.html', '')}-${w}.jpg`), type: 'jpeg', quality: 60, fullPage: true, timeout: 90000 });
      }
    } catch (e) { fail(pg, w, 'did not load: ' + e.message.split('\n')[0]); }
    await page.close();
  }
  await ctx.close();
  console.log(`checked ${pages.length} pages at ${w}px`);
}
await browser.close();

if (problems.length) { console.log(`\n${problems.length} problem(s):\n` + [...new Set(problems)].join('\n')); process.exit(1); }
console.log(`\nAll clear: ${pages.length} pages at ${WIDTHS.join(', ')} px. No console errors, failed requests, broken links, sideways scrolling, wrong prices, banned words or the-one-barber links.`);
