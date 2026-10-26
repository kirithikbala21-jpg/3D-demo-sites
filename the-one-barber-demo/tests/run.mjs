// Automated checks for The One Barber concept demo. Run:  cd tests && npm i && npx playwright-core install chromium && node run.mjs [--suite=overflow,axe,func,fallback,links,perf]
// In a sandbox without downloads, set CHROME_PATH to an installed Chromium.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(SITE, 'site.config.json'), 'utf8'));
const PAGES = cfg.pages.map((p) => p.file);
const arg = (process.argv.find((a) => a.startsWith('--suite=')) || '--suite=all').slice(8).split(',');
const want = (n) => arg.includes('all') || arg.includes(n);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

const server = await new Promise((res) => {
  const s = http.createServer((q, r) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    fs.readFile(path.join(SITE, u), (e, d) => { if (e) { r.writeHead(404); r.end('not found'); return; } r.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); r.end(d); });
  }).listen(0, () => res(s));
});
const base = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? '  ' + extra : ''}`); };
const NO_WEBGL = () => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) return null; return g.call(this, t, ...a); }; };
const QUIET = () => { try { sessionStorage.setItem('tob-seen', '1'); localStorage.setItem('tob-cookie', 'no'); localStorage.setItem('tob-announce', 'off'); } catch (e) { /* ignore */ } };
/** Fixed visitor clock: a Date that starts at the given instant and keeps ticking. */
const FAKE = (t) => { const R = Date, off = t - R.now(); class F extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } } window.Date = F; };
const at = (iso) => Date.parse(iso + '+11:00'); // Melbourne is UTC+11 (daylight saving) from 4 October 2026 to 3 April 2027
async function newPage(opts = {}, { webgl = true, quiet = true, extraInit, clock = null, host = null } = {}) {
  const ctx = await browser.newContext({ locale: 'en-AU', ...opts });
  if (clock) await ctx.addInitScript(FAKE, at(clock));
  if (quiet) await ctx.addInitScript(QUIET);
  if (!webgl) await ctx.addInitScript(NO_WEBGL);
  if (extraInit) await ctx.addInitScript(extraInit);
  await ctx.route(/openstreetmap\.org|maps\.google\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' }));
  const p = await ctx.newPage();
  p.base = host || base;
  p.logs = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) p.logs.push(m.text()); });
  p.on('pageerror', (e) => p.logs.push('pageerror: ' + e.message));
  return p;
}
const done = (p) => p.context().close();
const force = 'main>section,.site-footer{content-visibility:visible!important}.js .reveal{opacity:1!important;transform:none!important;transition:none!important}.js [data-split] .w>span{transform:none!important;transition:none!important}';

/** Elements that poke past the screen edge unless they sit in an intentional scroll/clip container. */
const audit = () => {
  const W = document.documentElement.clientWidth, bad = [];
  const clipped = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (/(hidden|auto|scroll|clip)/.test(o.overflowX) && a.getBoundingClientRect().width <= W + 1) return true; } return false; };
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect(); if (!r.width) continue;
    if ((r.right > W + 0.5 || r.left < -0.5) && !clipped(el)) bad.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '') + ` [${Math.round(r.left)}..${Math.round(r.right)}]`);
  }
  return { scrollW: document.documentElement.scrollWidth, W, bad: [...new Set(bad)].slice(0, 6) };
};

const txt = (p) => p.evaluate(() => document.body.innerText);
const FORBID = /brass (&|and) blade|\bember\b|\bnoah\b|sydney barber|fresha|booksy|\btreatwell\b|sample review/i;
const html = (f) => fs.readFileSync(path.join(SITE, f), 'utf8');

/* ---- overflow */
if (want('overflow')) {
  for (const w of [360, 390, 768, 1440, 1920]) {
    const p = await newPage({ viewport: { width: w, height: 900 } });
    for (const f of PAGES) {
      await p.goto(base + f, { waitUntil: 'load' }); await p.addStyleTag({ content: force }); await p.waitForTimeout(150);
      const r = await p.evaluate(audit);
      ok(`no sideways scroll ${f} @${w}`, r.scrollW <= r.W + 1 && !r.bad.length, JSON.stringify(r.bad));
    }
    await done(p);
  }
}

/* ---- axe in both languages */
if (want('axe')) {
  const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  for (const lang of ['en', 'zh']) for (const f of PAGES) {
    const p = await newPage({ viewport: { width: 390, height: 844 } }, { extraInit: `try{localStorage.setItem('tob-lang','${lang}')}catch(e){}` });
    await p.goto(base + f, { waitUntil: 'load' }); await p.addStyleTag({ content: force }); await p.waitForTimeout(300);
    await p.evaluate(axeSrc);
    const v = await p.evaluate(async () => (await axe.run(document, { rules: { 'color-contrast': { enabled: true } } })).violations.map((x) => x.id + ':' + x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join('|')));
    ok(`axe ${lang} ${f}`, !v.length, v.join('; '));
    await done(p);
  }
}

/* ---- real facts and forbidden names */
if (want('func')) {
  const all = PAGES.map(html).join('\n') + html('site.config.json') + fs.readdirSync(path.join(SITE, 'js')).map((f) => fs.readFileSync(path.join(SITE, 'js', f), 'utf8')).join('\n');
  ok('no Brass & Blade / competitor names anywhere in pages or code', !FORBID.test(all), (all.match(FORBID) || [])[0]);
  const p = await newPage({ viewport: { width: 1440, height: 900 } }, { clock: '2026-10-26T12:00:00' });
  await p.goto(base + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const t = await txt(p);
  for (const s of ['The One Barber', '270 Blackburn Road', 'Glen Waverley', '5.0', '30', 'open 6 days', 'Skin fade', 'Pensioner', 'Kids cut', 'Buzz cuts', 'Beard trim'])
    ok(`home shows "${s}"`, new RegExp(s.replace(/[.]/g, '\\.'), 'i').test(t));
  ok('never says 7 days', !/7 days/i.test(t));
  ok('call link is the real number', await p.locator('a[href="tel:+61432399303"]').count() > 0);
  ok('no invented review quotes', !/fair pricing|child friendly|newly opened/i.test(t));
  await p.goto(base + 'services.html', { waitUntil: 'load' }); await p.addStyleTag({ content: force }); await p.waitForTimeout(500);
  const st = await txt(p);
  ok('services show Chinese 男士理发 on the men\'s cut', /男士理发/.test(st));
  ok('prices are placeholders', /\[price\]/.test(st) && !/\$\s?\d/.test(st));
  await p.goto(base + 'index.html'); await p.waitForTimeout(400);
  ok('open banner (Mon 12:00) says open', /open now/i.test(await p.locator('#open-banner').innerText()));
  ok('no console errors on home', !p.logs.filter((l) => !/favicon|WebGL|GPU/i.test(l)).length, p.logs.join(' | '));
  await done(p);
  // Tuesday is closed; Thursday close time
  for (const [clock, re, label] of [['2026-10-27T12:00:00', /closed/i, 'Tuesday closed'], ['2026-10-29T18:15:00', /open now.*6:30pm/i, 'Thursday open until 6:30pm'], ['2026-10-31T17:00:00', /closed/i, 'Saturday after 4:30pm closed']]) {
    const q = await newPage({ viewport: { width: 390, height: 844 } }, { clock }); await q.goto(base + 'index.html'); await q.waitForTimeout(400);
    ok(`banner: ${label}`, re.test(await q.locator('#open-banner').innerText())); await done(q);
  }
  // i18n
  const z = await newPage({ viewport: { width: 390, height: 844 } }, { clock: '2026-10-26T12:00:00' });
  await z.goto(base + 'index.html'); await z.click('#lang-toggle'); await z.waitForTimeout(300);
  ok('中文 switch changes text and html lang', /[一-鿿]/.test(await z.locator('main').innerText()) && (await z.evaluate(() => document.documentElement.lang)).startsWith('zh'));
  await z.reload(); await z.waitForTimeout(300);
  ok('language choice is remembered', (await z.evaluate(() => document.documentElement.lang)).startsWith('zh'));
  await z.click('#lang-toggle'); await z.waitForTimeout(200);
  ok('switch back to English', (await z.evaluate(() => document.documentElement.lang)).startsWith('en'));
  await done(z);

  /* booking + manage + waitlist */
  const b = await newPage({ viewport: { width: 390, height: 844 } }, { clock: '2026-10-26T12:00:00' });
  await b.goto(base + 'book.html'); await b.waitForTimeout(400);
  await b.click('#f-name').catch(() => {});
  await b.click('#book-form button[type=submit]'); await b.waitForTimeout(200);
  ok('empty booking form shows errors', await b.locator('[aria-invalid=true]').count() > 0 || await b.locator('.error:not(:empty)').count() > 0);
  await b.evaluate(() => document.querySelector('#cal-next')?.scrollIntoView());
  const day = b.locator('#cal-grid button:not([disabled])').first(); await day.click(); await b.waitForTimeout(200);
  const slot = b.locator('#slots button.slot:not(.is-waitlist):not([disabled])').first(); await slot.click();
  await b.fill('#f-name', 'Test Person'); await b.fill('#f-phone', '0412 345 678');
  await b.click('#book-form button[type=submit]'); await b.waitForTimeout(400);
  const ref = (await b.locator('#form-success').innerText()).match(/TOB-[A-Z0-9]{4,8}/i);
  ok('booking confirms with a TOB- reference', !!ref);
  if (ref) {
    await b.goto(base + 'book.html#manage'); await b.fill('#m-ref', 'TOB-ZZZZ99'); await b.fill('#m-phone', '0412 345 678'); await b.click('#manage-form button[type=submit]');
    ok('manage: wrong reference not found', /could not find/i.test(await b.locator('#manage-result').innerText()));
    await b.fill('#m-ref', ref[0]); await b.click('#manage-form button[type=submit]');
    ok('manage: finds booking', new RegExp(ref[0], 'i').test(await b.locator('#manage-result').innerText()));
    await b.click('[data-cancel]'); await b.click('[data-yes]');
    ok('manage: cancel works', /cancelled/i.test(await b.locator('#manage-result').innerText()));
  }
  await done(b);
  const w = await newPage({ viewport: { width: 390, height: 844 } }, { clock: '2026-10-26T12:00:00' });
  await w.goto(base + 'book.html'); await w.waitForTimeout(400);
  let found = false;
  for (let i = 0; i < 6 && !found; i++) {
    const days = w.locator('#cal-grid button:not([disabled])');
    for (let d = 0; d < Math.min(await days.count(), 10) && !found; d++) { await days.nth(d).click(); if (await w.locator('#slots .slot.is-waitlist').count()) found = true; }
  }
  ok('a full slot offers the waitlist', found);
  if (found) {
    await w.locator('#slots .slot.is-waitlist').first().click(); await w.waitForTimeout(200);
    await w.fill('#wl-name', 'Wait Lister'); await w.locator('#waitlist-host input[type=tel],#waitlist-host input[name=contact]').first().fill('0412 345 678').catch(() => {});
    await w.locator('#waitlist-host input[type=checkbox]').check().catch(() => {});
    await w.locator('#waitlist-host button[type=submit]').click(); await w.waitForTimeout(300);
    ok('waitlist confirms', /on the waitlist/i.test(await w.locator('#waitlist-host').innerText()));
  }
  await done(w);

  /* QR + print */
  const r = await newPage({ viewport: { width: 390, height: 844 } }); await r.goto(base + 'reviews.html'); await r.waitForTimeout(300);
  ok('review page has QR svg', await r.locator('svg[aria-label*="QR" i], svg[role=img]').count() > 0);
  await r.emulateMedia({ media: 'print' });
  const vis = await r.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const c = getComputedStyle(e); const rc = e.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && rc.width > 0 && e.children.length === 0 && (e.textContent || '').trim().length > 40; }).length);
  ok('print view shows almost nothing besides the QR', vis <= 2, 'text nodes: ' + vis);
  await r.screenshot({ path: '/tmp/tob-qr.png' });
  try { const o = execFileSync('python3', ['-c', "import cv2,sys;im=cv2.imread('/tmp/tob-qr.png');d=cv2.QRCodeDetector();print(d.detectAndDecode(im)[0])"]).toString().trim(); ok('QR decodes to the review link', /^https:\/\//.test(o), o); } catch (e) { ok('QR decode ran', false, String(e).slice(0, 80)); }
  await done(r);

  /* hide switches */
  const cfgSocial = (u) => /instagram|facebook/i.test(u);
  const q = await newPage({ viewport: { width: 1440, height: 900 } }); await q.goto(base + 'visit.html');
  const links = await q.locator('a[href*="instagram.com"],a[href*="facebook.com"]').count();
  ok('Instagram/Facebook hidden while config is blank', links === (cfg.instagramUrl ? 1 : 0) + (cfg.facebookUrl ? 1 : 0));
  ok('Maps link present', await q.locator('a[href*="google.com/maps"]').count() > 0);
  await done(q);
}

await browser.close(); server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
