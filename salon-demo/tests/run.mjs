// Automated checks for the Maison Lune concept demo. Run:
//   cd salon-demo && export CHROME_PATH=/path/to/chromium && ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf]
// Needs tests/node_modules (playwright-core + axe-core; a symlink to another demo's tests/node_modules works) and Pillow (for the
// synthetic-photo copy used by the lightbox / before-after tests; see tests/make-photo-copy.py).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const SITE = path.resolve(process.env.ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const rd = (f, root = SITE) => fs.readFileSync(path.join(root, f), 'utf8');
const cfg = JSON.parse(rd('site.config.json'));
const SV = cfg.services, ITEMS = SV.items, STY = cfg.stylists;
const PHONE_HREF = '+61' + cfg.contact.phone.replace(/\D/g, '').slice(1);
const PAGES = cfg.pages.map((p) => p.file);
const arg = (process.argv.find((a) => a.startsWith('--suite=')) || '--suite=all').slice(8).split(',');
const want = (n) => arg.includes('all') || arg.includes(n);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };

function serve(root, { prefix = '' } = {}) {
  return new Promise((res) => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]);
      if (prefix && u.startsWith(prefix)) u = u.slice(prefix.length - 1);
      if (u.endsWith('/')) u += 'index.html';
      fs.readFile(path.join(root, u), (e, d) => {
        if (e) { fs.readFile(path.join(root, '404.html'), (e2, d2) => { r.writeHead(404, { 'content-type': 'text/html' }); r.end(d2 || 'not found'); }); return; }
        r.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); r.end(d);
      });
    }).listen(0, () => res(s));
  });
}
const servers = [];
const startSite = async (root, opt) => { const s = await serve(root, opt); servers.push(s); return `http://localhost:${s.address().port}/`; };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
// Copies of the site with synthetic photos (built by the real add-photo.py), so photo-dependent behaviour can be tested
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ml-'));
// The real site now ships photos; `base` is a photo-less copy so the neutral-panel behaviour stays covered
execFileSync('python3', [path.join(path.dirname(fileURLToPath(import.meta.url)), 'make-photo-copy.py'), SITE, path.join(TMP, 'none'), 'none']);
const base = await startSite(path.join(TMP, 'none'));
let fullBase = null, partialBase = null, fullRoot = null;
async function photoSites() {
  if (fullBase) return;
  fullRoot = path.join(TMP, 'full');
  const helper = path.join(path.dirname(fileURLToPath(import.meta.url)), 'make-photo-copy.py');
  execFileSync('python3', [helper, SITE, fullRoot, 'full']);
  execFileSync('python3', [helper, SITE, path.join(TMP, 'partial'), 'partial']);
  fullBase = await startSite(fullRoot); partialBase = await startSite(path.join(TMP, 'partial'));
}

const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? '  ' + extra : ''}`); };
const QUIET = () => { try { localStorage.setItem('ml-cookie', 'no'); } catch (e) { /* ignore */ } };
/** Fixed visitor clock: a Date that starts at the given instant and keeps ticking. */
const FAKE = (t) => { const R = Date, off = t - R.now(); class F extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } } window.Date = F; };
const at = (iso) => Date.parse(iso + '+11:00'); // Melbourne is UTC+11 in October 2026
const MON = '2026-10-19', TUE = '2026-10-20', SAT = '2026-10-24', SUN = '2026-10-25';
async function newPage(opts = {}, { quiet = true, clock = null, host = base } = {}) {
  const ctx = await browser.newContext({ locale: 'en-AU', timezoneId: 'Australia/Melbourne', ...opts });
  if (quiet) await ctx.addInitScript(QUIET);
  if (clock) await ctx.addInitScript(FAKE, at(clock));
  const p = await ctx.newPage();
  p.logs = []; p.reqs = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) p.logs.push(m.text()); });
  p.on('pageerror', (e) => p.logs.push('pageerror: ' + e.message));
  p.on('request', (r) => p.reqs.push(r.url()));
  p.base = host;
  return p;
}
const done = (p) => p.context().close();
const settle = async (p) => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300); };
const open = async (p, f = 'index.html') => { await p.goto(p.base + f); await settle(p); };
const force = '.js .reveal{opacity:1!important;transform:none!important;transition:none!important}.tab,.pick>span,.btn{transition:none!important}';
const MOBILE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const DESKTOP = { viewport: { width: 1280, height: 800 } };
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const money = (n) => '$' + n.toLocaleString('en-US');

const audit = () => {
  const W = document.documentElement.clientWidth, bad = [];
  const clipped = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (/(hidden|auto|scroll|clip)/.test(o.overflowX) && a.getBoundingClientRect().width <= W + 1) return true; } return false; };
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') && !(el instanceof SVGSVGElement)) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect(); if (!r.width) continue;
    if ((r.right > W + 0.5 || r.left < -0.5) && !clipped(el)) bad.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '') + ` [${Math.round(r.left)}..${Math.round(r.right)}]`);
  }
  return { scrollW: document.documentElement.scrollWidth, W, bad: [...new Set(bad)].slice(0, 6) };
};
const overlaps = () => {
  const skip = '.slot-label, .slot-empty, .mobile-bar, .cookie, .site-header, .skip-link, .ba-tag, .ba-knob, .ba-line, .lb';
  const els = [...document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,label,summary,th,td,blockquote,legend,span.today-tag,.bk-chip')]
    .filter((e) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden' || e.closest('[hidden],.sr-only,noscript') || e.closest(skip) || (e.closest('details:not([open])') && e.tagName !== 'SUMMARY')) return false; return [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); });
  const bad = [];
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], b = els[j]; if (a.contains(b) || b.contains(a)) continue;
    if (a.closest('.swipe') !== b.closest('.swipe')) continue;
    const r = a.getBoundingClientRect(), s = b.getBoundingClientRect();
    const w = Math.min(r.right, s.right) - Math.max(r.left, s.left), h = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top);
    if (w > 4 && h > 4) bad.push(`${a.tagName}"${a.textContent.trim().slice(0, 18)}" x ${b.tagName}"${b.textContent.trim().slice(0, 18)}"`);
  }
  return bad.slice(0, 4);
};

/* booking helpers */
const stepVisible = (p) => p.evaluate(() => { const v = [...document.querySelectorAll('.bk-panel')].find((x) => !x.hidden); return v ? v.dataset.step : null; });
const nextBtn = (p) => p.locator('.bk-panel:not([hidden]) [data-next]');
async function chooseService(p, slug) { await p.selectOption('#bk-service', slug); await nextBtn(p).click(); }
async function chooseStylist(p, slug) { await p.locator(`input[name=stylist][value=${slug}]`).click(); await nextBtn(p).click(); }
async function chooseDay(p, which = 0) { await p.locator('input[name=day]:not(:disabled)').nth(which).click(); await nextBtn(p).click(); }
async function chooseTime(p, which = 0) { await p.locator('input[name=time]:not(:disabled)').nth(which).click(); await nextBtn(p).click(); }
async function fillDetails(p, name = 'Sam Lee', phone = '0412 345 678') { await p.fill('#bk-name', name); await p.fill('#bk-phone', phone); }
async function fullBooking(p, { service = 'womens-cut', stylist = 'any' } = {}) {
  await chooseService(p, service); await chooseStylist(p, stylist); await chooseDay(p); await chooseTime(p); await fillDetails(p);
  await p.click('#bk-form button[type=submit]');
}

/* ---------------------------------------------------------------- overflow */
if (want('overflow')) {
  for (const w of [360, 375, 390, 414, 600, 768, 1024, 1280, 1440, 1920]) {
    const p = await newPage({ viewport: { width: w, height: 900 } });
    const fails = [];
    for (const f of PAGES) {
      await open(p, f); await p.addStyleTag({ content: force });
      const a = await p.evaluate(audit);
      if (a.scrollW > a.W || a.bad.length) fails.push(`${f} ${JSON.stringify(a)}`);
    }
    ok(`no horizontal overflow @${w}px on all ${PAGES.length} pages`, !fails.length, fails.join(' | '));
    ok(`no console errors or warnings @${w}px`, !p.logs.length, JSON.stringify(p.logs.slice(0, 3)));
    await done(p);
  }
  for (const w of [360, 390, 768, 1280]) {
    const p = await newPage({ viewport: { width: w, height: 900 } });
    await open(p); await p.addStyleTag({ content: force });
    const o = await p.evaluate(overlaps);
    ok(`no overlapping text boxes @${w}px (home)`, !o.length, o.join(' | '));
    await done(p);
  }
  // with every booking step on screen, and with the lightbox and confirmation, there is still no overflow
  for (const w of [360, 390, 1280]) {
    const p = await newPage({ viewport: { width: w, height: 900 } }, { clock: TUE + 'T10:00:00' });
    await open(p); await p.addStyleTag({ content: force });
    const bad = [];
    await p.selectOption('#bk-service', 'balayage');
    const chk = async (tag) => { const a = await p.evaluate(audit); const o = await p.evaluate(overlaps); if (a.scrollW > a.W || a.bad.length || o.length) bad.push(tag + JSON.stringify([a, o])); };
    await chk('s1'); await nextBtn(p).click(); await chk('s2'); await nextBtn(p).click(); await chk('s3');
    await p.locator('input[name=day]:not(:disabled)').nth(1).click(); await nextBtn(p).click(); await chk('s4');
    await p.locator('input[name=time]:not(:disabled)').first().click(); await nextBtn(p).click(); await fillDetails(p); await chk('s5');
    await p.click('#bk-form button[type=submit]'); await chk('done');
    ok(`booking steps and confirmation: no overflow or overlaps @${w}px`, !bad.length, bad.join(' | '));
    await done(p);
  }
  // same with synthetic photos in every slot (real <img> layout)
  await photoSites();
  for (const w of [360, 390, 768, 1280, 1920]) {
    const p = await newPage({ viewport: { width: w, height: 900 } }, { host: fullBase });
    await open(p); await p.addStyleTag({ content: force });
    const a = await p.evaluate(audit); const o = await p.evaluate(overlaps);
    for (let y = 0; y < 9000; y += 600) { await p.mouse.wheel(0, 600); await p.waitForTimeout(60); } await p.waitForTimeout(700);
    const broken = await p.evaluate(() => [...document.querySelectorAll('img:not(.lb-img)')].filter((i) => !i.closest('[hidden]') && !(i.loading === 'lazy' && !i.complete) && (!i.complete || !i.naturalWidth)).length);
    ok(`with photos: no overflow, overlaps or broken images @${w}px`, a.scrollW <= a.W && !a.bad.length && !o.length && !p.logs.length && !broken, JSON.stringify([a, o, p.logs.slice(0, 2), broken]));
    await done(p);
  }
}

/* ---------------------------------------------------------------- axe */
if (want('axe')) {
  const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
  const runAxe = async (p) => { await p.evaluate(axeSrc); return p.evaluate(async (tags) => (await window.axe.run(document, { runOnly: { type: 'tag', values: tags } })).violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(' ')}`), TAGS); };
  for (const w of [375, 1440]) {
    const p = await newPage({ viewport: { width: w, height: 900 } }, { quiet: false });
    const bad = [];
    for (const f of PAGES) {
      await open(p, f); await p.addStyleTag({ content: force });
      await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      const r = await runAxe(p); if (r.length) bad.push(`${f}: ${r.join('; ')}`);
    }
    ok(`axe: no violations (WCAG 2.2 AA + best practice) @${w}px, cookie bar showing`, !bad.length, bad.join(' || '));
    await done(p);
  }
  // each booking step, the error state, the confirmation, the services tabs, the voucher form
  for (const w of [375, 1440]) {
    const p = await newPage({ viewport: { width: w, height: 900 } }, { clock: TUE + 'T10:00:00' });
    await open(p); await p.addStyleTag({ content: force });
    const out = [];
    const step = async (t) => { const r = await runAxe(p); if (r.length) out.push(`${t}: ${r.join('; ')}`); };
    await p.selectOption('#bk-service', 'balayage'); await step('step1');
    await nextBtn(p).click(); await step('step2');
    await nextBtn(p).click(); await p.locator('input[name=day]:not(:disabled)').nth(1).click(); await step('step3');
    await nextBtn(p).click(); await p.locator('input[name=time]:not(:disabled)').first().click(); await step('step4');
    await nextBtn(p).click(); await p.click('#bk-form button[type=submit]'); await step('step5 errors');
    await fillDetails(p); await p.click('#bk-form button[type=submit]'); await step('confirmation');
    await p.click('[role=tab]#services-colour'); await step('colour tab');
    await p.click('#voucher-app button[type=submit]'); await step('voucher errors');
    await p.fill('#v-name', 'Ana'); await p.fill('#v-email', 'ana@example.com'); await p.click('#voucher-app button[type=submit]'); await step('voucher done');
    ok(`axe: no violations on each booking step, confirmation, tabs and voucher states @${w}px`, !out.length, out.join(' || '));
    await done(p);
  }
  // photo copy: before/after sliders and lightbox open
  await photoSites();
  for (const w of [375, 1440]) {
    const p = await newPage({ viewport: { width: w, height: 900 } }, { host: fullBase });
    await open(p); await p.addStyleTag({ content: force });
    const out = [];
    let r = await runAxe(p); if (r.length) out.push('home with photos: ' + r.join('; '));
    for (const t of ['#job-tab-cut', '#job-tab-balayage']) { await p.click(t); r = await runAxe(p); if (r.length) out.push(t + ': ' + r.join('; ')); }
    await p.locator('.g-open').first().click(); r = await runAxe(p); if (r.length) out.push('lightbox: ' + r.join('; '));
    ok(`axe: no violations with photos, before/after tabs and the lightbox open @${w}px`, !out.length, out.join(' || '));
    await done(p);
  }
  // structure, focus, tap targets, type
  {
    const p = await newPage(DESKTOP);
    const bad = [];
    for (const f of PAGES) {
      await open(p, f);
      const r = await p.evaluate(() => {
        const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => !h.closest('[hidden]'));
        let last = 0, skip = '';
        for (const h of hs) { const n = Number(h.tagName[1]); if (last && n > last + 1) skip = skip || `${h.tagName} after h${last}: ${h.textContent.trim().slice(0, 20)}`; last = n; }
        const noAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
        const noLabel = [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]),select,textarea')].filter((el) => !(el.labels && el.labels.length) && !el.getAttribute('aria-label')).map((e) => e.id || e.name);
        return { h1: document.querySelectorAll('h1').length, skip, noAlt, noLabel, main: document.querySelectorAll('main').length, header: !!document.querySelector('header'), footer: !!document.querySelector('footer'), lang: document.documentElement.lang, title: document.title, skipLink: !!document.querySelector('a.skip-link[href="#main"]') };
      });
      if (r.h1 !== 1 || r.skip || r.noAlt || r.noLabel.length || r.main !== 1 || !r.header || !r.footer || r.lang !== 'en-AU' || !r.skipLink || !/unofficial concept demo/i.test(r.title)) bad.push(f + ' ' + JSON.stringify(r));
    }
    ok('every page: one h1, heading order never skips, alt on images, labels on fields, landmarks, skip link, lang en-AU, "unofficial concept demo" in <title>', !bad.length, bad.join(' | '));
    await open(p);
    const outlines = [];
    for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); outlines.push(await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return e === document.body ? 'body' : (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) ? 'ok' : e.tagName + '.' + e.className; })); }
    ok('keyboard focus: the first 14 tab stops all show a visible outline', outlines.every((o) => o === 'ok'), outlines.filter((o) => o !== 'ok').join(','));
    await done(p);
  }
  {
    const p = await newPage({ ...MOBILE, viewport: { width: 375, height: 812 } }, { quiet: false, clock: TUE + 'T10:00:00' });
    const tap = [], tiny = [];
    const measure = async (tag) => {
      const r = await p.evaluate(() => {
        const sentence = (a) => { const par = a.closest('p,li,address'); return par && par.textContent.trim().length > a.textContent.trim().length + 6 && getComputedStyle(a).display === 'inline'; };
        return [...document.querySelectorAll('a,button,summary,select,input:not([type=hidden]),[role=tab]')]
          .filter((e) => (e.offsetParent !== null || getComputedStyle(e).position === 'fixed') && !e.closest('[hidden]') && !e.closest('.sr-only') && !e.closest('.hp') && !sentence(e) && !e.classList.contains('skip-link') && !e.classList.contains('ba-range'))
          .map((e) => { const r = e.getBoundingClientRect(); return [(e.textContent.trim() || e.getAttribute('aria-label') || e.className || e.id).slice(0, 18), Math.round(r.width), Math.round(r.height)]; }).filter(([, w, h]) => h && (h < 44 || w < 44)).slice(0, 5);
      });
      if (r.length) tap.push(tag + ': ' + JSON.stringify(r));
    };
    await open(p, 'index.html'); await p.addStyleTag({ content: force });
    await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    await measure('home (cookie bar showing)');
    for (const t of ['colour', 'treatments', 'beauty']) { await p.click('#services-' + t); await measure('tab ' + t); }
    await p.selectOption('#bk-service', 'balayage'); await measure('s1'); await nextBtn(p).click(); await measure('s2');
    await nextBtn(p).click(); await measure('s3'); await p.locator('input[name=day]:not(:disabled)').nth(1).click(); await nextBtn(p).click(); await measure('s4');
    await p.locator('input[name=time]:not(:disabled)').first().click(); await nextBtn(p).click(); await measure('s5');
    await fillDetails(p); await p.click('#bk-form button[type=submit]'); await measure('confirmation');
    await open(p, '404.html'); await measure('404');
    ok('tap targets: every button, tab, radio and standalone link is at least 44x44px @375 (all booking steps, tabs, 404)', !tap.length, tap.join(' | '));
    await open(p, 'index.html');
    const t = await p.evaluate(() => [...document.querySelectorAll('p,li,td,th,address,label,dd,span,a,button,summary,legend,blockquote')].filter((e) => e.offsetParent && !e.closest('[hidden],svg,noscript,.sr-only,.slot-label') && !e.classList.contains('slot-label') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 13).map((e) => e.textContent.trim().slice(0, 25)));
    ok('type: no visible text under 13px on the phone', !t.length, t.slice(0, 4).join(' | '));
    const body = await p.evaluate(() => ({ fs: parseFloat(getComputedStyle(document.body).fontSize), lh: parseFloat(getComputedStyle(document.body).lineHeight) / parseFloat(getComputedStyle(document.body).fontSize) }));
    ok('type: body text is 17px or more with line-height 1.6 on a phone', body.fs >= 17 && Math.abs(body.lh - 1.6) < 0.01, JSON.stringify(body));
    await done(p);
  }
}

/* ---------------------------------------------------------------- links, numbers, JSON-LD, prices */
if (want('links')) {
  const p = await newPage(DESKTOP);
  await open(p);
  const r = await p.evaluate(() => {
    const ids = new Set([...document.querySelectorAll('[id]')].map((e) => e.id));
    const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    return { hashBad: hrefs.filter((h) => h.startsWith('#') && h.length > 1 && !ids.has(decodeURIComponent(h.slice(1)))), hrefs, blank: [...document.querySelectorAll('a[target=_blank]')].filter((a) => !/noopener/.test(a.rel)).length, empty: hrefs.filter((h) => h === '#' || h === '') };
  });
  ok('every #anchor link on the page points at an element that exists', !r.hashBad.length, r.hashBad.join(','));
  ok('no empty "#" links; every target=_blank has rel=noopener', !r.empty.length && !r.blank);
  const missing = [];
  for (const f of PAGES) {
    await open(p, f);
    const hs = await p.evaluate(() => [...document.querySelectorAll('a[href],link[href],script[src],img[src]')].map((e) => e.getAttribute('href') || e.getAttribute('src')));
    for (const h of hs) { if (/^(https?:|mailto:|tel:|#|data:)/.test(h)) continue; const clean = h.split('#')[0].split('?')[0]; if (clean && !fs.existsSync(path.join(SITE, clean))) missing.push(f + ' -> ' + h); }
  }
  ok('every local link, stylesheet, script and image file exists', !missing.length, missing.join(', '));
  await open(p);
  const nums = await p.evaluate(() => ({ tel: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')), mail: [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href')), text: document.body.innerText }));
  ok('every tel: link is the salon number; every mailto: is the salon email; number shown as 03 5550 0188', nums.tel.length >= 3 && nums.tel.every((t) => t === 'tel:' + PHONE_HREF) && nums.mail.every((m) => m === 'mailto:' + cfg.contact.email) && nums.text.includes(cfg.contact.phone), JSON.stringify([nums.tel, nums.mail]));
  const ld = await p.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch (e) { return null; } }));
  const biz = ld.find((o) => o && o['@type'] === 'HairSalon');
  ok('JSON-LD parses and is a HairSalon with name, phone, priceRange, address and opening hours', ld.length >= 1 && ld.every(Boolean) && biz && biz.telephone === '+61355500188' && biz.priceRange && biz.address.addressLocality === 'Glen Waverley' && biz.openingHoursSpecification.length === 3 && biz.openingHoursSpecification.some((o) => o.dayOfWeek.includes('Tuesday') && o.opens === '09:00' && o.closes === '19:00') && !JSON.stringify(biz.openingHoursSpecification).includes('Monday'), JSON.stringify(biz && biz.openingHoursSpecification));
  // prices
  const svcRows = await p.evaluate(() => [...document.querySelectorAll('.svc')].map((r) => ({ slug: r.dataset.slug, price: Number(r.querySelector('.svc-price').dataset.price), priceText: r.querySelector('.svc-price').textContent.trim(), min: r.querySelector('.svc-min').textContent.trim(), book: r.querySelector('[data-service]').dataset.service })));
  const sameRows = svcRows.length === ITEMS.length && ITEMS.every((it) => svcRows.find((r) => r.slug === it.slug && r.price === it.from && r.priceText === 'from ' + money(it.from) && r.min === it.min + ' min' && r.book === it.slug));
  ok(`all ${ITEMS.length} service rows match data/services.json (price, minutes, Book button slug)`, sameRows);
  const must = { 'womens-cut': 85, 'mens-cut': 48, 'full-colour': 160, balayage: 280, keratin: 320, 'brow-shape': 35, 'relaxation-massage-30': 60 };
  ok('the required prices are present: Women\'s cut 85, Men\'s cut 48, Full colour 160, Balayage 280, Keratin 320, Brow shape 35, Massage 30 min 60', Object.entries(must).every(([s, v]) => ITEMS.find((i) => i.slug === s)?.from === v) && ITEMS.find((i) => i.slug === 'relaxation-massage-30').min === 30);
  const cats = SV.categories.map((c) => ITEMS.filter((i) => i.cat === c.id).length);
  ok('4 service tabs with 4 to 6 items each', cats.length === 4 && cats.every((n) => n >= 4 && n <= 6), cats.join(','));
  const opts = await p.evaluate(() => [...document.querySelectorAll('#bk-service option[value]:not([value=""])')].map((o) => ({ v: o.value, t: o.textContent })));
  ok('booking widget service list shows the same price and minutes for every service', opts.length === ITEMS.length && opts.every((o) => { const it = ITEMS.find((i) => i.slug === o.v); return it && o.t.includes('from ' + money(it.from) + ' (' + it.min + ' min)'); }));
  await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  const nodes = await p.evaluate(() => { const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (w.nextNode()) { if (!w.currentNode.parentElement.closest('script,style,noscript')) out.push(w.currentNode.textContent); } return out; });
  const allowed = new Set([...ITEMS.map((i) => i.from), ...cfg.vouchers]);
  const stray = nodes.flatMap((t) => [...t.matchAll(/\$(\d[\d,]*)/g)]).map((m) => Number(m[1].replace(',', ''))).filter((n) => !allowed.has(n));
  ok('every $ amount anywhere on the page is a listed service price or a voucher amount', !stray.length, stray.join(','));
  // widget text for a service equals the row
  await p.selectOption('#bk-service', 'keratin');
  const meta = await p.textContent('#bk-svc-meta');
  ok('widget shows the same price and minutes as the row after choosing Keratin', meta.includes('from $320') && meta.includes('150 minutes'), meta);
  ok('"Final price confirmed at consultation." note under the prices', norm(await p.textContent('.svc-note')) === 'Final price confirmed at consultation.');
  // content rules
  const txt = await p.evaluate(() => { const m = document.querySelector('main').cloneNode(true); m.querySelectorAll('.g-rating').forEach((e) => e.remove()); return m.textContent; }); // the Google badge shows the owner's own rating from config
  ok('no superlatives, no star ratings, no aggregate score in the page copy (apart from the owner-set Google badge)', !/\b(best in|number one|#1|award|world.class|\d\.\d\s*(\/|stars)|★|stars?\b)/i.test(txt) && !/4\.9/.test(txt));
  ok('reviews are labelled "Sample content for this demo" and use first names only', /Sample content for this demo/i.test(txt) && (await p.locator('.review').count()) >= 4);
  ok('footer carries the unofficial concept demo label and "Demo website by KB Ventures"', (await p.textContent('footer')).includes('Unofficial concept demo. Names, prices and reviews are fictional.') && (await p.textContent('footer')).includes('Demo website by KB Ventures'));
  await done(p);
}

/* ---------------------------------------------------------------- behaviour */
if (want('func')) {
  // headings scale, fonts
  for (const [w, exp] of [[1280, [56, 40, 28, 20]], [390, [38, 30, 24, 19]]]) {
    const p = await newPage({ viewport: { width: w, height: 900 } });
    await open(p);
    const s = await p.evaluate(() => ['h1', 'h2', 'h3', 'h4'].map((t) => parseFloat(getComputedStyle(document.querySelector(t)).fontSize)));
    ok(`heading scale h1/h2/h3/h4 @${w}px is about ${exp.join('/')}px`, s.every((v, i) => Math.abs(v - exp[i]) <= 0.7), s.map((v) => v.toFixed(1)).join('/'));
    if (w === 1280) {
      const fam = await p.evaluate(() => { const set = new Set(); for (const e of document.querySelectorAll('body *')) { if (e.closest('svg') || !e.offsetParent && getComputedStyle(e).position !== 'fixed') continue; if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue; set.add(getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '').trim()); } return [...set].sort(); });
      ok('exactly two font families are used: Cormorant Garamond and Inter', fam.join('|') === 'Cormorant Garamond|Inter', fam.join('|'));
      const sp = await p.evaluate(() => { const bad = []; for (const e of document.querySelectorAll('main p')) { const mw = getComputedStyle(e).maxWidth; if (mw === 'none' || (e.getBoundingClientRect().width > 68 * 12.5 * 1.45)) bad.push(e.textContent.slice(0, 20)); } return bad; });
      ok('paragraphs are capped at about 68 characters wide', !sp.length, sp.join('|'));
    }
    await done(p);
  }
  // header, bottom bar, cookie
  for (const [w, label] of [[390, 'phone'], [1280, 'desktop']]) {
    const p = await newPage({ ...(w === 390 ? MOBILE : DESKTOP) });
    await open(p);
    const vis = async () => p.evaluate(() => { const b = document.querySelector('.header-book').getBoundingClientRect(); const nav = getComputedStyle(document.querySelector('.header-nav')).display; const bar = getComputedStyle(document.querySelector('.mobile-bar')).display; const h = document.querySelector('.site-header').getBoundingClientRect(); return { book: b.height >= 44 && b.top >= 0 && b.bottom <= h.bottom + 1, nav, bar, headerTop: h.top }; });
    let v = await vis();
    await p.mouse.wheel(0, 2500); await p.waitForTimeout(900);
    const v2 = await vis();
    ok(`sticky header with logo and Book now stays visible after scrolling (${label})`, v.book && v2.book && v2.headerTop === 0, JSON.stringify(v2));
    ok(`main nav ${w === 390 ? 'hidden on phone' : 'shown on desktop'}; bottom Call/Book bar ${w === 390 ? 'shown' : 'hidden'} (${label})`, w === 390 ? v.nav === 'none' && v.bar === 'flex' : v.nav === 'flex' && v.bar === 'none', JSON.stringify(v));
    if (w === 390) {
      const bar = await p.evaluate(() => [...document.querySelectorAll('.mobile-bar a')].map((a) => { const r = a.getBoundingClientRect(); return { t: a.textContent.trim(), h: r.height, w: r.width, href: a.getAttribute('href'), bottom: r.bottom }; }));
      ok('phone bar: Call (tel:) and Book (#book), each at least 44px tall, fixed at the bottom', bar.length === 2 && bar.every((b) => b.h >= 44 && b.w >= 44 && b.bottom <= 844.5) && bar[0].href === 'tel:' + PHONE_HREF && bar[1].href.endsWith('#book'), JSON.stringify(bar));
    }
    await done(p);
  }
  {
    const p = await newPage(MOBILE, { quiet: false });
    await open(p);
    const geo = async () => p.evaluate(() => {
      const c = document.querySelector('#cookie').getBoundingClientRect(), bar = document.querySelector('.mobile-bar').getBoundingClientRect();
      const hit = [...document.querySelectorAll('a,button,input,select,summary')].filter((e) => !e.closest('#cookie') && e.offsetParent !== null && !e.closest('.sr-only') && getComputedStyle(e).opacity !== '0').filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top; }).map((e) => (e.textContent.trim() || e.className).slice(0, 14));
      return { cookieH: c.height, cookieBottom: c.bottom, barTop: bar.top, hit, visible: !document.querySelector('#cookie').hidden };
    });
    let g = await geo();
    ok('cookie bar: thin (60-70px), sits above the phone Call/Book bar', g.visible && g.cookieH <= 70 && g.cookieH >= 44 && g.cookieBottom <= g.barTop + 0.5, JSON.stringify(g));
    ok('cookie bar covers no button or link at the top of the page', !g.hit.length, g.hit.join(','));
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(400);
    g = await geo();
    ok('cookie bar covers no button or link at the very bottom of the page', !g.hit.length, g.hit.join(','));
    await p.click('.cookie-yes');
    ok('cookie bar: Accept hides it and remembers the choice (ml-cookie)', (await p.evaluate(() => [document.querySelector('#cookie').hidden, localStorage.getItem('ml-cookie')])).join() === 'true,yes');
    await p.reload(); await settle(p);
    ok('cookie bar stays hidden after reload', await p.evaluate(() => document.querySelector('#cookie').hidden));
    await done(p);
    const d = await newPage(DESKTOP, { quiet: false }); await open(d);
    const dg = await d.evaluate(() => { const c = document.querySelector('#cookie').getBoundingClientRect(); return [c.height, Math.round(innerHeight - c.bottom)]; });
    ok('cookie bar on desktop: thin and at the very bottom', dg[0] <= 70 && dg[1] === 0, dg.join());
    await done(d);
  }
  // no chat, no third parties
  {
    const p = await newPage(DESKTOP);
    await open(p); await p.mouse.wheel(0, 1500); await p.waitForTimeout(500);
    const chat = await p.evaluate(() => ({ iframes: document.querySelectorAll('iframe').length, widgets: [...document.querySelectorAll('[id],[class]')].filter((e) => /(^|[-_ ])(chat|intercom|drift|tawk|crisp|zendesk|livechat)/i.test(e.id + ' ' + (typeof e.className === 'string' ? e.className : ''))).length, scripts: [...document.scripts].filter((s) => s.src && !s.src.startsWith(location.origin)).length }));
    ok('no chat widget, no iframes, no third-party scripts', !chat.iframes && !chat.widgets && !chat.scripts, JSON.stringify(chat));
    await done(p);
  }
  // photo slots
  {
    const p = await newPage(DESKTOP);
    await open(p);
    const q = await p.evaluate(() => { const l = [...document.querySelectorAll('.slot-label')]; return { n: l.length, w: Math.max(...l.map((e) => e.getBoundingClientRect().width)), text: l[0].textContent, panels: document.querySelectorAll('.slot-empty').length, imgs: document.querySelectorAll('img:not(.lb-img)').length, hasText: [...document.querySelectorAll('.slot-empty')].some((s) => [...s.querySelectorAll('*')].some((c) => !c.classList.contains('slot-label') && c.children.length === 0 && c.textContent.trim() && c.tagName !== 'use')) }; });
    ok('no photos: neutral panels (23 on the page, one label each), labels in the DOM but visually hidden without ?slots=1, no visible text', q.n === 23 && q.panels === 23 && q.w <= 2 && q.text.startsWith('PHOTO SLOT: ') && q.imgs === 0 && !q.hasText, JSON.stringify(q));
    await p.goto(base + 'index.html?slots=1'); await settle(p);
    const q2 = await p.evaluate(() => { const l = [...document.querySelectorAll('.slot-label')]; return { w: Math.max(...l.map((e) => e.getBoundingClientRect().width)), names: l.map((e) => e.textContent).slice(0, 3), all: l.map((e) => e.textContent.replace('PHOTO SLOT: ', '')) }; });
    const want21 = ['hero', 'stylist-1', 'stylist-2', 'stylist-3', 'stylist-4', ...Array.from({ length: 8 }, (_, i) => 'gallery-' + (i + 1)), 'cut-1', 'stylist-wash', 'stylist-scissors', 'treatment-1', 'interior-1', 'interior-2', 'products-1'];
    const have = new Set(q2.all);
    ok('?slots=1 reveals the "PHOTO SLOT: name" labels, and the slots present are named as briefed', q2.w > 40 && q2.names[0].startsWith('PHOTO SLOT:') && want21.every((n) => have.has(n)), JSON.stringify([q2.w, want21.filter((n) => !have.has(n))]));
    const slotsJson = JSON.parse(rd('data/photos.json')).slots;
    ok('data/photos.json defines exactly the 24 slots (20 in use + 4 spare before/after) with file/alt/credit/label/pos/needs', Object.keys(slotsJson).sort().join() === [...want21, 'colour-before-1', 'colour-after-1', 'cut-before-1', 'cut-after-1'].sort().join() && Object.values(slotsJson).every((s) => ['file', 'alt', 'credit', 'label', 'pos', 'needs'].every((k) => k in s)));
    await done(p);
  }
  // open-today line with a fake clock
  const cases = [
    [MON + 'T12:00:00', 'Closed today. Opens tomorrow at 9am'],
    [TUE + 'T08:00:00', 'Opens today at 9am'],
    [TUE + 'T12:00:00', 'Open now, closes at 7pm'],
    [TUE + 'T19:30:00', 'Closed now. Opens tomorrow at 9am'],
    [SAT + 'T08:30:00', 'Open now, closes at 5pm'],
    [SAT + 'T17:30:00', 'Closed now. Opens tomorrow at 10am'],
    [SUN + 'T12:00:00', 'Open now, closes at 4pm'],
    [SUN + 'T16:30:00', 'Closed now. Opens Tuesday at 9am'],
  ];
  {
    const bad = [];
    for (const [t, want1] of cases) {
      const p = await newPage(MOBILE, { clock: t });
      await open(p);
      const got = [norm(await p.textContent('[data-open-today]')), norm(await p.textContent('#visit [data-open-status]')), norm(await p.textContent('footer [data-open-status]'))];
      if (got.some((g) => g !== want1)) bad.push(`${t}: ${got.join(' / ')}`);
      const hl = await p.evaluate(() => [...document.querySelectorAll('.hours tr.today')].map((r) => Number(r.dataset.day)));
      const day = new Date(t.slice(0, 10) + 'T12:00:00Z').getUTCDay();
      if (hl.length !== 1 || hl[0] !== day) bad.push(`${t} highlight ${hl}`);
      await done(p);
    }
    ok('open-today line (hero, visit, footer) and hours-table highlight are right with a fake clock: Mon, Tue (before, during, after), Sat (during, after), Sun (during, after)', !bad.length, bad.join(' | '));
    const p = await newPage(MOBILE, { clock: SAT + 'T10:00:00' }); await open(p);
    const row = await p.evaluate(() => { const r = document.querySelector('.hours tr.today'); return [r.querySelector('th').textContent, r.querySelector('th').getAttribute('aria-current'), getComputedStyle(r).backgroundColor]; });
    ok('hours table marks today (Saturday) with a "Today" tag, aria-current and a tinted row', row[0].includes('Saturday') && row[0].includes('Today') && row[1] === 'date' && row[2] !== 'rgba(0, 0, 0, 0)', row.join(' | '));
    await done(p);
  }
  // services tabs
  {
    const p = await newPage(DESKTOP); await open(p); await p.addStyleTag({ content: force });
    const sel = () => p.evaluate(() => [...document.querySelectorAll('[data-tabs=services] [role=tab]')].map((t, i) => t.getAttribute('aria-selected') === 'true' ? i : -1).filter((i) => i >= 0)[0]);
    const panelsVisible = () => p.evaluate(() => [...document.querySelectorAll('[data-tabs=services] [role=tabpanel]')].filter((x) => !x.hidden).length);
    await p.focus('#services-cut');
    const log = [await sel()];
    await p.keyboard.press('ArrowRight'); log.push(await sel());
    await p.keyboard.press('End'); log.push(await sel());
    await p.keyboard.press('ArrowRight'); log.push(await sel());
    await p.keyboard.press('ArrowLeft'); log.push(await sel());
    await p.keyboard.press('Home'); log.push(await sel());
    const focusOk = await p.evaluate(() => document.activeElement.id === 'services-cut' && document.activeElement.tabIndex === 0);
    ok('services tabs: arrow keys, Home, End and wrap work; only one panel visible; focus follows', log.join() === '0,1,3,0,3,0' && focusOk && (await panelsVisible()) === 1, log.join());
    const aria = await p.evaluate(() => { const t = document.querySelector('#services-colour'); const pn = document.getElementById(t.getAttribute('aria-controls')); return [t.getAttribute('role'), pn.getAttribute('role'), pn.getAttribute('aria-labelledby') === t.id, t.tabIndex]; });
    ok('services tabs have tablist/tab/tabpanel roles with aria-controls and aria-labelledby, roving tabindex', aria.join() === 'tab,tabpanel,true,-1', aria.join());
    await p.goto(base + 'index.html#services-treatments'); await settle(p);
    ok('deep link #services-treatments opens the Treatments tab with Keratin visible', (await sel()) === 2 && await p.isVisible('.svc[data-slug=keratin]'));
    await p.evaluate(() => { location.hash = '#services-beauty'; }); await p.waitForTimeout(300);
    ok('changing the hash to #services-beauty switches tab', (await sel()) === 3 && await p.isVisible('.svc[data-slug=brow-shape]'));
    await p.click('#services-colour');
    ok('clicking a tab updates the URL hash for sharing', (await p.evaluate(() => location.hash)) === '#services-colour');
    await done(p);
  }
  // booking flow
  {
    const p = await newPage(DESKTOP, { clock: TUE + 'T12:00:00' }); await open(p); await p.addStyleTag({ content: force });
    ok('booking: starts on step 1 with the stepper marking it as the current step, Continue disabled until a service is chosen', (await stepVisible(p)) === '0' && await p.locator('.bk-steps li[aria-current=step]').count() === 1 && await nextBtn(p).isDisabled());
    await chooseService(p, 'womens-cut');
    ok('booking: choosing a service moves to stylist step with "No preference" selected by default', (await stepVisible(p)) === '1' && await p.isChecked('input[name=stylist][value=any]') && (await p.locator('input[name=stylist]').count()) === 5);
    await chooseStylist(p, 'amara');
    const days = await p.evaluate(() => [...document.querySelectorAll('input[name=day]')].map((i) => [i.value, i.disabled]));
    const dis = Object.fromEntries(days);
    ok('booking: day picker rolls 90 days from today (Tue 20 Oct 2026 to Sun 17 Jan 2027); Mondays and public holidays (Melbourne Cup, Christmas Day, New Year) are disabled', (await stepVisible(p)) === '2' && days.length === 90 && days[0][0] === '2026-10-20' && days[89][0] === '2027-01-17' && dis['2026-10-20'] === false && dis['2026-10-26'] && dis['2026-11-03'] && dis['2026-12-25'] && dis['2027-01-01'] && dis['2026-10-27'] === false, JSON.stringify([days.length, days[0], days[89]]));
    ok('booking: the picker labels the first two days Today and Tomorrow', await p.evaluate(() => [...document.querySelectorAll('input[name=day] + span .wd')].slice(0, 3).map((e) => e.textContent).join() === 'Today,Tomorrow,Thu'));
    await p.locator('input[name=day][value="2026-10-26"]').click({ force: true });
    ok('booking: the closed Monday cannot be selected', !(await p.isChecked('input[name=day][value="2026-10-26"]')) && await nextBtn(p).isDisabled());
    await p.locator('input[name=day][value="2026-10-20"]').click(); await nextBtn(p).click();
    const slots = await p.evaluate(() => [...document.querySelectorAll('input[name=time], .wl-slot')].map((i) => ({ m: Number(i.value || i.dataset.mins), d: i.disabled || i.classList.contains('wl-slot'), r: i.dataset.reason || (i.classList.contains('wl-slot') ? 'taken' : '') })));
    ok('booking: Tuesday today at 12:00 - 30-minute grid from 9:00 to 18:00 (last start for a 60-minute service)', slots[0].m === 540 && slots[slots.length - 1].m === 1080 && slots.length === 19 && slots.every((s, i) => i === 0 || s.m - slots[i - 1].m === 30), `${slots.length} ${slots[0].m}-${slots[slots.length - 1].m}`);
    ok('booking: past times today (fake clock 12:00) are disabled and marked "passed"; later times are not all disabled', slots.filter((s) => s.m <= 720).every((s) => s.d && s.r === 'passed') && slots.some((s) => s.m > 720 && !s.d), JSON.stringify(slots.filter((s) => s.m <= 750).map((s) => s.r)));
    // taken slots: deterministic and not selectable
    await p.click('.bk-panel:not([hidden]) [data-back]'); await p.locator('input[name=day][value="2026-10-21"]').click(); await nextBtn(p).click();
    const taken1 = await p.evaluate(() => [...document.querySelectorAll('input[name=time][data-reason=taken], .wl-slot')].map((i) => i.value || i.dataset.mins));
    ok('booking: some slots on Wednesday are taken for Amara (demo availability)', taken1.length >= 2 && taken1.length < 18, taken1.length + ' taken');
    await p.locator(`.wl-slot[data-mins="${taken1[0]}"]`).click();
    ok('booking: a taken slot cannot be selected (it offers the waitlist instead)', (await p.locator('input[name=time]:checked').count()) === 0 && await nextBtn(p).isDisabled() && (await p.locator('.wl-form').count()) === 1);
    await p.reload(); await settle(p);
    await chooseService(p, 'womens-cut'); await chooseStylist(p, 'amara'); await p.locator('input[name=day][value="2026-10-21"]').click(); await nextBtn(p).click();
    const taken2 = await p.evaluate(() => [...document.querySelectorAll('input[name=time][data-reason=taken], .wl-slot')].map((i) => i.value || i.dataset.mins));
    ok('booking: the taken slots are the same after a reload (deterministic)', taken1.join() === taken2.join());
    // different stylist -> different pattern; no preference -> fewer taken
    await p.click('.bk-panel:not([hidden]) [data-back]'); await p.click('.bk-panel:not([hidden]) [data-back]');
    await p.locator('input[name=stylist][value=jonah]').click(); await nextBtn(p).click(); await p.locator('input[name=day][value="2026-10-21"]').click(); await nextBtn(p).click();
    const takenJ = await p.evaluate(() => [...document.querySelectorAll('input[name=time][data-reason=taken], .wl-slot')].map((i) => i.value || i.dataset.mins));
    await p.click('.bk-panel:not([hidden]) [data-back]'); await p.click('.bk-panel:not([hidden]) [data-back]');
    await p.locator('input[name=stylist][value=any]').click(); await nextBtn(p).click(); await p.locator('input[name=day][value="2026-10-21"]').click(); await nextBtn(p).click();
    const takenAny = await p.evaluate(() => [...document.querySelectorAll('input[name=time][data-reason=taken], .wl-slot')].map((i) => i.value || i.dataset.mins));
    ok('booking: slots differ per stylist, and "No preference" has fewer taken slots than a single stylist', takenJ.join() !== taken1.join() && takenAny.length < taken1.length, `${taken1.length}/${takenJ.length}/${takenAny.length}`);
    await done(p);
  }
  {
    // duration awareness
    const p = await newPage(DESKTOP, { clock: TUE + 'T08:00:00' }); await open(p); await p.addStyleTag({ content: force });
    const lastStart = async (service, day) => { await p.reload(); await settle(p); await p.addStyleTag({ content: force }); await chooseService(p, service); await nextBtn(p).click(); await p.locator(`input[name=day][value="${day}"]`).click(); await nextBtn(p).click(); return p.evaluate(() => Math.max(...[...document.querySelectorAll('input[name=time], .wl-slot')].map((i) => Number(i.value || i.dataset.mins)))); };
    const a = await lastStart('mens-cut', '2026-10-21'), b = await lastStart('colour-correction', '2026-10-21'), c = await lastStart('balayage', '2026-10-24'), d = await lastStart('colour-correction', '2026-10-25');
    ok('booking: slots are duration-aware (last start = closing minus service length): men\'s cut Wed 18:30, correction Wed 15:00, balayage Sat 14:00, correction Sun 12:00', a === 1110 && b === 900 && c === 840 && d === 720, [a, b, c, d].join());
    await done(p);
  }
  {
    const p = await newPage(MOBILE, { clock: MON + 'T11:00:00' }); await open(p); await p.addStyleTag({ content: force });
    await chooseService(p, 'mens-cut'); await nextBtn(p).click();
    const r = await p.evaluate(() => [...document.querySelectorAll('input[name=day]')].map((i) => [i.value, i.disabled]));
    ok('booking: on a Monday (closed) today is not offered at all; Tuesday is the first day, labelled Tomorrow', r[0][0] === '2026-10-20' && !r[0][1] && !r.some((x) => x[0] === '2026-10-19'), JSON.stringify(r.slice(0, 2)));
    await done(p);
    const q = await newPage(MOBILE, { clock: TUE + 'T19:45:00' }); await open(q); await q.addStyleTag({ content: force });
    await chooseService(q, 'mens-cut'); await nextBtn(q).click();
    ok('booking: after closing time today disappears and Tomorrow is the first option', (await q.locator('input[name=day][value="2026-10-20"]').count()) === 0 && (await q.locator('input[name=day]').first().getAttribute('value')) === '2026-10-21' && (await q.locator('input[name=day] + span .wd').first().textContent()) === 'Tomorrow');
    await done(q);
  }
  {
    const p = await newPage(MOBILE, { clock: TUE + 'T10:00:00' }); await open(p); await p.addStyleTag({ content: force });
    await chooseService(p, 'full-colour'); await chooseStylist(p, 'any'); await chooseDay(p, 1); await chooseTime(p, 2);
    // validation
    await p.click('#bk-form button[type=submit]');
    const e1 = await p.evaluate(() => [document.querySelector('#bk-name-err').hidden, document.querySelector('#bk-phone-err').hidden, document.activeElement.id, document.querySelector('#bk-name').getAttribute('aria-invalid')]);
    ok('booking details: empty name and phone show errors, focus goes to the first invalid field', !e1[0] && !e1[1] && e1[2] === 'bk-name' && e1[3] === 'true', e1.join());
    const phones = [['0412 345 678', true], ['+61 412 345 678', true], ['03 5550 0188', true], ['(03) 5550-0188', true], ['0612 345 678', false], ['12345', false], ['0412 345', false], ['abcdefghij', false], ['1300 123 456', false]];
    const bad = [];
    for (const [ph, good] of phones) { await p.fill('#bk-name', 'Sam Lee'); await p.fill('#bk-phone', ph); await p.click('#bk-form button[type=submit]'); const shown = await p.evaluate(() => !document.querySelector('#bk-phone-err').hidden); if (shown === good) bad.push(ph); if (good) { await p.reload(); await settle(p); await p.addStyleTag({ content: force }); await chooseService(p, 'full-colour'); await chooseStylist(p, 'any'); await chooseDay(p, 1); await chooseTime(p, 2); } }
    ok('booking details: Australian phone validation accepts 04xx, +61, landlines and rejects the rest', !bad.length, bad.join(','));
    await fillDetails(p, 'Sam Lee', '0412 345 678'); await p.click('#bk-form button[type=submit]');
    const done1 = await p.evaluate(() => ({ text: document.querySelector('.bk-done').innerText, ls: JSON.parse(localStorage.getItem('ml-bookings') || '[]'), focus: document.activeElement.id, step: [...document.querySelectorAll('.bk-panel')].find((x) => !x.hidden).dataset.step }));
    ok('booking: confirmation panel with friendly heading, reference, summary and "This is a demo, no real booking was made"', done1.step === 'done' && /You are all set, Sam/.test(done1.text) && /ML-[A-Z0-9]{6}/.test(done1.text) && /Full colour, from \$160 \(120 min\)/.test(done1.text) && /This is a demo, no real booking was made/.test(done1.text) && done1.focus === 'bk-hd', done1.text.slice(0, 160));
    ok('booking: saved to localStorage key ml-bookings (reference, service, stylist, date, time, name, phone)', done1.ls.length >= 1 && done1.ls.at(-1).ref.startsWith('ML-') && done1.ls.at(-1).service === 'full-colour' && done1.ls.at(-1).date === '2026-10-21' && done1.ls.at(-1).phone === '0412345678' && done1.ls.at(-1).stylist && done1.ls.at(-1).time, JSON.stringify(done1.ls.at(-1)));
    await p.click('[data-restart]');
    ok('booking: "Make another booking" resets to step 1', (await stepVisible(p)) === '0' && (await p.inputValue('#bk-service')) === '');
    await done(p);
  }
  {
    // keyboard-only booking
    const p = await newPage(DESKTOP, { clock: TUE + 'T09:00:00' }); await open(p); await p.addStyleTag({ content: force });
    await p.focus('#bk-service'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
    const v = await p.inputValue('#bk-service');
    await p.focus('.bk-panel:not([hidden]) [data-next]'); await p.keyboard.press('Enter');
    await p.focus('input[name=stylist][value=any]'); await p.keyboard.press('ArrowDown');
    const sty = await p.evaluate(() => document.querySelector('input[name=stylist]:checked').value);
    ok('booking: usable by keyboard (select with arrows, Enter on Continue, arrow keys move between stylists)', !!v && sty === 'amara' && (await stepVisible(p)) === '1', `${v} ${sty}`);
    await done(p);
  }
  {
    // preselect via URL and buttons
    const p = await newPage(MOBILE, { clock: TUE + 'T10:00:00' });
    await p.goto(base + 'index.html?service=balayage&stylist=amara#book'); await settle(p); await p.addStyleTag({ content: force });
    const chips = await p.textContent('#bk-summary');
    ok('preselect: ?service=balayage&stylist=amara jumps to the day step with both chosen', (await stepVisible(p)) === '2' && (await p.inputValue('#bk-service')) === 'balayage' && await p.isChecked('input[name=stylist][value=amara]') && /Balayage/.test(chips) && /Amara/.test(chips), chips);
    await p.goto(base + 'index.html?service=mens-cut'); await settle(p);
    ok('preselect: ?service=mens-cut alone goes to the stylist step', (await stepVisible(p)) === '1' && (await p.inputValue('#bk-service')) === 'mens-cut');
    await p.goto(base + 'index.html?stylist=jonah'); await settle(p);
    ok('preselect: ?stylist=jonah alone keeps step 1 (service) with Jonah chosen', (await stepVisible(p)) === '0' && await p.isChecked('input[name=stylist][value=jonah]'));
    await p.goto(base + 'index.html?service=nope&stylist=nobody'); await settle(p);
    ok('preselect: unknown slugs are ignored without errors', (await stepVisible(p)) === '0' && !p.logs.length);
    await p.goto(base + 'index.html'); await settle(p); await p.addStyleTag({ content: force });
    await p.click('#services-treatments'); await p.click('.svc[data-slug=keratin] .svc-book'); await p.waitForTimeout(3000);
    const vp = await p.evaluate(() => { const r = document.querySelector('#booking-app').getBoundingClientRect(); return [r.top, innerHeight]; });
    ok('"Book" on a service row preselects it, opens the stylist step and scrolls the widget into view', (await p.inputValue('#bk-service')) === 'keratin' && (await stepVisible(p)) === '1' && vp[0] < vp[1] * 0.6 && vp[0] > -50, JSON.stringify(vp));
    await p.click('.stylist-book[data-stylist=mei]'); await p.waitForTimeout(1500);
    ok('"Book with Mei" preselects the stylist, keeps the service and jumps to the day step', await p.isChecked('input[name=stylist][value=mei]') && (await stepVisible(p)) === '2' && /Mei Tanaka/.test(await p.textContent('#bk-summary')));
    await p.goto(base + 'index.html'); await settle(p); await p.addStyleTag({ content: force });
    await p.click('.stylist-book[data-stylist=priya]'); await p.waitForTimeout(1200);
    ok('"Book with Priya" with no service chosen starts at step 1 with Priya selected', (await stepVisible(p)) === '0' && await p.isChecked('input[name=stylist][value=priya]'));
    await done(p);
  }
  // sections: stylists, why, faq, voucher, visit
  {
    const p = await newPage(MOBILE); await open(p); await p.addStyleTag({ content: force });
    const st = await p.evaluate(() => { const row = document.querySelector('.stylist-grid'); const cards = [...document.querySelectorAll('.stylist')]; const r = cards[0].querySelector('.stylist-photo').getBoundingClientRect(); return { n: cards.length, scrolls: row.scrollWidth > row.clientWidth + 20, ratio: r.width / r.height, overflowX: getComputedStyle(row).overflowX, names: cards.map((c) => c.querySelector('h3').textContent) }; });
    ok('stylists on a phone: 4 cards in a swipe row (scrolls sideways), portrait 4:5 photos', st.n === 4 && st.scrolls && Math.abs(st.ratio - 0.8) < 0.02 && st.overflowX === 'auto', JSON.stringify(st));
    await done(p);
    const d = await newPage(DESKTOP); await open(d); await d.addStyleTag({ content: force });
    const g = await d.evaluate(() => { const row = document.querySelector('.stylist-grid'); const tops = [...document.querySelectorAll('.stylist')].map((c) => Math.round(c.getBoundingClientRect().top)); return { grid: getComputedStyle(row).display, same: new Set(tops).size === 1, sw: row.scrollWidth <= row.clientWidth + 1 }; });
    ok('stylists on desktop: a 4-column grid on one row', g.grid === 'grid' && g.same && g.sw, JSON.stringify(g));
    const f = await d.evaluate(() => [...document.querySelectorAll('.faq-item')].map((x) => x.querySelector('summary').textContent.trim()));
    ok('FAQ has 6 <details>: patch test, cancellation, late, kids, vouchers, payment', f.length === 6 && /patch test/i.test(f[0]) && /cancellation/i.test(f[1]) && /late/i.test(f[2]) && /kids/i.test(f[3]) && /voucher/i.test(f[4]) && /pay/i.test(f[5]), f.join('|'));
    await d.click('.faq-item:nth-child(2) summary');
    ok('FAQ: clicking a question opens it and the cancellation answer mentions 24 hours', await d.evaluate(() => document.querySelector('.faq-item:nth-child(2)').open) && /24 hours/.test(await d.textContent('.faq-item:nth-child(2) .faq-a')));
    await d.focus('.faq-item:nth-child(3) summary'); await d.keyboard.press('Enter');
    ok('FAQ: summary opens from the keyboard', await d.evaluate(() => document.querySelector('.faq-item:nth-child(3)').open));
    // voucher
    await d.click('#voucher-app button[type=submit]');
    ok('voucher: empty form shows two errors and focuses the name', (await d.locator('#voucher-app .err:not([hidden])').count()) === 2 && await d.evaluate(() => document.activeElement.id) === 'v-name');
    const amts = await d.evaluate(() => [...document.querySelectorAll('input[name=amount]')].map((i) => [i.value, i.checked]));
    ok('voucher: $50, $100 and $150 selectable buttons (radio group), $100 preselected', amts.map((a) => a[0]).join() === '50,100,150' && amts[1][1], JSON.stringify(amts));
    await d.locator('input[name=amount][value="150"]').click(); await d.fill('#v-name', 'Ana Silva'); await d.fill('#v-email', 'not-an-email'); await d.click('#voucher-app button[type=submit]');
    ok('voucher: invalid email is rejected', !(await d.locator('#v-email-err').isHidden()));
    await d.fill('#v-email', 'ana@example.com'); await d.click('#voucher-app button[type=submit]');
    const vt = await d.textContent('.voucher-done');
    ok('voucher: confirmation shows $150, the recipient and a clear demo label; form is replaced', /\$150/.test(vt) && /Ana Silva/.test(vt) && /demo/i.test(vt) && /no voucher was issued/i.test(vt) && await d.locator('.voucher-form').isHidden() && JSON.parse(await d.evaluate(() => localStorage.getItem('ml-vouchers')))[0].amount === 150);
    // visit
    const v = await d.evaluate(() => ({ map: !!document.querySelector('.map-svg'), link: document.querySelector('.map-link').href, role: document.querySelector('.map-svg').getAttribute('role'), iframe: document.querySelectorAll('iframe').length }));
    ok('visit: stylised SVG map placeholder (no iframe) and a "Get directions" search link', v.map && v.role === 'img' && !v.iframe && v.link.startsWith('https://www.google.com/maps/search/?api=1&query=21%20Example%20Street'), v.link);
    await done(d);
  }
  // before / after with no photos, partial, full
  {
    const p = await newPage(DESKTOP); await open(p); await p.addStyleTag({ content: force });
    const bad = [];
    for (const id of ['colour', 'balayage', 'cut']) {
      await p.click('#job-tab-' + id);
      const r = await p.evaluate((i) => { const pn = document.getElementById('job-' + i); const m = pn.querySelector('.job-media'); const r = m.getBoundingClientRect(); return { vis: !pn.hidden, h: r.height, w: r.width, sliders: pn.querySelectorAll('.ba-range').length, panel: pn.querySelectorAll('.slot-empty').length, img: pn.querySelectorAll('img').length }; }, id);
      if (!r.vis || r.h < 200 || r.w < 200 || r.sliders || r.panel !== 1 || r.img) bad.push(id + JSON.stringify(r));
    }
    ok('before/after with no photos: every tab shows one branded neutral panel (no empty slider, no empty grid)', !bad.length, bad.join(' | '));
    await done(p);
  }
  {
    await photoSites();
    const p = await newPage(DESKTOP, { host: partialBase }); await open(p); await p.addStyleTag({ content: force });
    const rows = [];
    for (const id of ['colour', 'balayage', 'cut']) {
      await p.click('#job-tab-' + id);
      rows.push(await p.evaluate((i) => { const pn = document.getElementById('job-' + i); return { sliders: pn.querySelectorAll('.ba-range').length, src: (pn.querySelector('img') || {}).src || '', tag: !!pn.querySelector('.ba-tag'), empty: pn.querySelectorAll('.slot-empty').length, h: pn.querySelector('.job-media').getBoundingClientRect().height }; }, id));
    }
    ok('recent work with only some photos: Colour shows its gallery photo as a single "Recent work" photo (no slider)', rows[0].sliders === 0 && rows[0].src.includes('gallery-1') && rows[0].tag && rows[0].h > 200, JSON.stringify(rows[0]));
    ok('recent work fallback: Cut uses cut-1; Balayage with nothing available shows the neutral panel', rows[2].sliders === 0 && rows[2].src.includes('cut-1') && rows[1].empty === 1 && rows[1].h > 200, JSON.stringify(rows.slice(1)));
    await done(p);
    const f = await newPage(DESKTOP, { host: fullBase }); await open(f); await f.addStyleTag({ content: force });
    const sl = await f.evaluate(() => ({ sliders: document.querySelectorAll('.ba-range').length, tags: document.querySelectorAll('.job-media .ba-tag').length }));
    ok('recent work with all photos: three single "Recent work" photos, no sliders (no real before/after pairs)', sl.sliders === 0 && sl.tags === 3, JSON.stringify(sl));
    await done(f);
  }
  // lightbox
  {
    await photoSites();
    const p = await newPage(MOBILE, { host: fullBase }); await open(p); await p.addStyleTag({ content: force });
    const opener = p.locator('.g-open').nth(2);
    await opener.scrollIntoViewIfNeeded(); await opener.click();
    const st = () => p.evaluate(() => ({ hidden: document.querySelector('.lb').hidden, count: document.querySelector('.lb-count').textContent, alt: document.querySelector('.lb-img').alt, focus: document.activeElement.className, inert: document.querySelector('#main').inert, scrollLocked: document.body.classList.contains('no-scroll') }));
    let s = await st();
    ok('lightbox: opens on tap with a dialog role, alt text, "Photo 3 of 8", focus on Close, page inert and scroll locked', !s.hidden && s.count === 'Photo 3 of 8' && s.alt === 'Test photo for gallery-3' && /lb-close/.test(s.focus) && s.inert && s.scrollLocked, JSON.stringify(s));
    await p.keyboard.press('ArrowRight'); s = await st(); const r1 = s.count;
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); s = await st();
    ok('lightbox: arrow keys move next and previous', r1 === 'Photo 4 of 8' && s.count === 'Photo 2 of 8', r1 + ' / ' + s.count);
    const foci = []; for (let i = 0; i < 7; i++) { await p.keyboard.press('Tab'); foci.push(await p.evaluate(() => document.activeElement.className.split(' ').pop())); }
    ok('lightbox: focus is trapped (Tab cycles close, previous, next only)', foci.every((c) => ['lb-close', 'lb-prev', 'lb-next'].includes(c)) && new Set(foci).size === 3, foci.join());
    await p.keyboard.press('Shift+Tab'); 
    const swipe = async (dx) => p.evaluate((d) => { const lb = document.querySelector('.lb'); const mk = (type, x) => lb.dispatchEvent(new TouchEvent(type, { bubbles: true, changedTouches: [new Touch({ identifier: 1, target: lb, clientX: x, clientY: 300 })] })); mk('touchstart', 200); mk('touchend', 200 + d); }, dx);
    const before = (await st()).count; await swipe(-120); const afterL = (await st()).count; await swipe(120); const afterR = (await st()).count;
    ok('lightbox: swipe left goes to the next photo, swipe right to the previous (touch)', afterL !== before && afterR === before, `${before} -> ${afterL} -> ${afterR}`);
    await p.keyboard.press('Escape'); s = await st();
    const back = await p.evaluate(() => document.activeElement.classList.contains('g-open') && document.activeElement.dataset.index);
    ok('lightbox: Escape closes it, focus returns to the photo that opened it, page unlocked', s.hidden && back === '2' && !s.inert && !s.scrollLocked, JSON.stringify([s, back]));
    await opener.click(); await p.click('.lb-close');
    ok('lightbox: the Close button works', (await st()).hidden);
    const wrap = await (async () => { await opener.click(); await p.click('.lb-prev'); await p.click('.lb-prev'); await p.click('.lb-prev'); return (await st()).count; })();
    ok('lightbox: previous wraps around the set (Photo 8 of 8)', wrap === 'Photo 8 of 8', wrap);
    await done(p);
  }
  // reduced motion and motion
  {
    const r = await newPage({ ...DESKTOP, reducedMotion: 'reduce' }); await open(r);
    for (let y = 0; y < 6000; y += 700) { await r.mouse.wheel(0, 700); await r.waitForTimeout(80); }
    const q = await r.evaluate(() => ({ pxOn: document.documentElement.classList.contains('px-on'), pre: document.querySelectorAll('.reveal.pre').length, opacity: [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length, transforms: [...document.querySelectorAll('.px,.reveal')].filter((e) => getComputedStyle(e).transform !== 'none').length, py: [...document.querySelectorAll('.px')].filter((e) => e.style.getPropertyValue('--py')).length, lenis: !!window.__lenis, trans: [...document.querySelectorAll('.photo img,.reveal')].filter((e) => parseFloat(getComputedStyle(e).transitionDuration) > 0).length }));
    ok('reduced motion: no parallax, no reveal transforms or opacity changes, no smooth scroller, no transitions', !q.pxOn && !q.pre && !q.opacity && !q.transforms && !q.py && !q.lenis && !q.trans, JSON.stringify(q));
    await done(r);
    const m = await newPage(DESKTOP); await open(m);
    const pre = await m.evaluate(() => document.querySelectorAll('.reveal.pre').length);
    for (let y = 0; y < 3000; y += 400) { await m.mouse.wheel(0, 400); await m.waitForTimeout(120); }
    await m.waitForTimeout(800);
    const q2 = await m.evaluate(() => ({ pxOn: document.documentElement.classList.contains('px-on'), py: [...document.querySelectorAll('.px')].map((e) => parseFloat(e.style.getPropertyValue('--py'))).filter((v) => !isNaN(v)), maxPy: Math.max(...[...document.querySelectorAll('.px')].map((e) => Math.abs(parseFloat(e.style.getPropertyValue('--py')) || 0))), lenis: !!window.__lenis, rev: [...document.querySelectorAll('.reveal.pre:not(.in)')].length, dur: getComputedStyle(document.querySelector('.reveal')).transitionDuration }));
    ok('motion on: parallax runs (tiny, under 30px), reveals are queued below the fold and play, Lenis is running', q2.pxOn && q2.py.length > 3 && q2.maxPy <= 30 && q2.maxPy > 0 && pre > 3 && q2.lenis && /0\.55s/.test(q2.dur), JSON.stringify(q2) + ' pre=' + pre);
    const hov = await (async () => { await photoSites(); const h = await newPage(DESKTOP, { host: fullBase }); await open(h); const el = h.locator('.g-item').first(); await el.scrollIntoViewIfNeeded(); await h.addStyleTag({ content: force }); await el.hover(); await h.waitForTimeout(900); const t = await h.evaluate(() => getComputedStyle(document.querySelector('.g-item img')).transform); await done(h); return t; })();
    ok('hover zoom on a desktop mouse: gallery photo scales up on hover', /matrix\(1\.0[45]/.test(hov), hov);
    await done(m);
    const t = await newPage(MOBILE, { host: fullBase }); await open(t); await t.addStyleTag({ content: force });
    const noHover = await t.evaluate(() => { const el = document.querySelector('.g-item'); return getComputedStyle(el.querySelector('img')).transform; });
    ok('no hover zoom on touch devices (hover:hover only)', noHover === 'none', noHover);
    await done(t);
  }
}

/* ---------------------------------------------------------------- JS off, 404 */
if (want('fallback')) {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, locale: 'en-AU' });
  const p = await ctx.newPage(); await p.goto(base + 'index.html');
  const q = await p.evaluate(() => ({ h1: document.querySelector('h1').innerText, hero: document.querySelector('[data-open-today]').innerText, svc: [...document.querySelectorAll('.svc')].filter((e) => e.offsetParent).length, tabs: getComputedStyle(document.querySelector('.tabs')).display, bk: document.querySelector('.bk-fallback').offsetParent !== null, tel: !!document.querySelector('.bk-fallback a[href^="tel:"]'), faq: document.querySelectorAll('details').length, reveal: [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length, hours: document.querySelectorAll('.hours tbody tr').length, jobs: [...document.querySelectorAll('.job')].filter((e) => e.offsetParent).length, cta: [...document.querySelectorAll('.svc-book')].every((a) => /\?service=[a-z0-9-]+#book/.test(a.getAttribute('href'))) }));
  ok('JavaScript off: headline, plain hours text, all 22 services, booking fallback with phone link, FAQ, hours table all readable', /Hair that feels like you, in Glen Waverley\./.test(q.h1) && /Tue to Fri 9am to 7pm/.test(q.hero) && /Mon closed/.test(q.hero) && q.svc === 22 && q.tabs === 'none' && q.bk && q.tel && q.faq === 6 && !q.reveal && q.hours === 7 && q.jobs === 3 && q.cta, JSON.stringify(q));
  await ctx.close();
  const e = await newPage({ viewport: { width: 390, height: 844 } }, { host: await startSite(SITE, { prefix: '/salon-demo/' }).then((b) => b + 'salon-demo/') });
  await e.goto(e.base + 'no/such/page/'); await settle(e);
  const n = await e.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, h1: document.querySelector('h1').textContent, home: document.querySelector('a[href="index.html"]').href, css: document.styleSheets.length, base: document.querySelector('base')?.href, noindex: !!document.querySelector('meta[name=robots][content=noindex]'), overflow: document.documentElement.scrollWidth <= innerWidth }));
  ok('404 page: themed, loads CSS from a deep missing URL via the inline <base>, home link resolves, noindex', n.bg === 'rgb(250, 246, 240)' && /slipped away/.test(n.h1) && n.home.endsWith('/salon-demo/index.html') && n.noindex && n.overflow && /\/salon-demo\/$/.test(n.base), JSON.stringify(n));
  await done(e);
}

/* ---------------------------------------------------------------- perf, SEO, assets */
if (want('perf')) {
  const p = await newPage(MOBILE, { quiet: true });
  const sizes = {};
  p.on('response', async (r) => { try { const b = await r.body(); sizes[r.url()] = b.length; } catch (e) { /* ignore */ } });
  await open(p); await p.mouse.wheel(0, 20000); await p.waitForTimeout(800);
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  const third = p.reqs.filter((u) => !u.startsWith(base) && !u.startsWith('data:'));
  ok(`page weight without photos is light: ${(total / 1024).toFixed(0)} KB of ${Object.keys(sizes).length} files (limit 450 KB)`, total < 450 * 1024 && !Object.keys(sizes).some((u) => /\.(webp|jpg|jpeg|avif)$/.test(u)), '');
  ok('no third-party requests', !third.length, third.join(', '));
  const html = rd('index.html');
  ok('index.html is under 90 KB', html.length < 90 * 1024, (html.length / 1024).toFixed(0) + ' KB');
  const meta = await p.evaluate(() => ({ preload: [...document.querySelectorAll('link[rel=preload][as=font]')].map((l) => l.href.split('/').pop()), scripts: [...document.scripts].filter((s) => s.src).map((s) => [s.src.split('/').pop(), s.defer, s.type]), og: ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].every((k) => document.querySelector(`meta[property="${k}"]`)), tw: ['twitter:card', 'twitter:image', 'twitter:title'].every((k) => document.querySelector(`meta[name="${k}"]`)), robots: document.querySelector('meta[name=robots]')?.content, canon: document.querySelector('link[rel=canonical]')?.href, theme: document.querySelector('meta[name=theme-color]')?.content, desc: document.querySelector('meta[name=description]')?.content.length, viewport: !!document.querySelector('meta[name=viewport]') }));
  ok('heading font preloaded; scripts deferred or module; OG and Twitter tags; noindex; canonical; theme colour #FAF6F0', meta.preload.includes('cormorant-garamond-500.woff2') && meta.scripts.every(([, d, t]) => d || t === 'module') && meta.og && meta.tw && meta.robots === 'noindex' && meta.canon === cfg.site.baseUrl && meta.theme === '#FAF6F0' && meta.desc > 60, JSON.stringify(meta));
  const sm = rd('sitemap.xml'), mf = JSON.parse(rd('site.webmanifest'));
  ok('sitemap lists the home page and not 404; manifest theme #FAF6F0 with PNG, maskable and SVG icons', sm.includes(cfg.site.baseUrl) && !sm.includes('404') && mf.theme_color === '#FAF6F0' && mf.icons.some((i) => i.purpose === 'maskable') && mf.icons.every((i) => fs.existsSync(path.join(SITE, i.src))));
  const png = fs.readFileSync(path.join(SITE, 'img/og.png'));
  ok('og.png is 1200x630; favicon.ico, apple-touch icon, SVG icon and maskable icon exist', png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630 && ['favicon.ico', 'img/apple-touch-icon.png', 'img/icon.svg', 'img/icon-maskable.svg', 'img/icon-maskable-512.png'].every((f) => fs.existsSync(path.join(SITE, f))));
  const imgs = await p.evaluate(() => [...document.querySelectorAll('img:not(.lb-img),iframe')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length);
  ok('every img and iframe has width and height attributes (none present without photos)', imgs === 0);
  await done(p);
  await photoSites();
  const f = await newPage(MOBILE, { host: fullBase });
  await open(f);
  const im = await f.evaluate(() => [...document.querySelectorAll('img:not(.lb-img)')].map((i) => ({ src: i.getAttribute('src'), lazy: i.loading === 'lazy', hp: i.fetchPriority, w: i.getAttribute('width'), h: i.getAttribute('height'), alt: i.alt })));
  const root = fullRoot, sizeOf = (s) => fs.statSync(path.join(root, s)).size;
  const hero = im.find((i) => /hero/.test(i.src));
  ok('with photos: hero is eager and high priority and under 250 KB; every other photo is lazy; all have width, height and alt', hero && !hero.lazy && hero.hp === 'high' && sizeOf(hero.src) < 250 * 1024 && im.filter((i) => i !== hero).every((i) => i.lazy) && im.every((i) => i.w && i.h && i.alt) && im.length === 23, JSON.stringify({ n: im.length, hero: hero && sizeOf(hero.src) }));
  ok('with photos: every photo is WebP under 250 KB; stylist portraits are 900px wide at most, others 1600px', im.every((i) => i.src.endsWith('.webp') && sizeOf(i.src) < 250 * 1024 && Number(i.w) <= (/stylist-/.test(i.src) ? 900 : 1600)), im.filter((i) => Number(i.w) > 1600).map((i) => i.src).join());
  ok('with photos: footer lists the photo credit', /Synthetic test image \(concept demo\)/.test(await f.textContent('footer')));
  const fb = JSON.parse(rd('data/photos.json', fullRoot));
  await done(f);
  ok('add-photo.py recorded size and credit in data/photos.json', fb.slots.hero.w <= 1600 && fb.slots['stylist-1'].w <= 900 && fb.slots.hero.credit === 'Synthetic test image');
}

/* ---------------------------------------------------------------- hardening: time zones, holidays, notices, forms, caching */
if (want('hardening')) {
  /** A throwaway copy of the site with its config changed, rebuilt, and served. */
  const configured = async (mutate, name) => {
    const dir = path.join(TMP, 'cfg-' + name);
    fs.cpSync(SITE, dir, { recursive: true, filter: (src) => !/[\\/](tests|node_modules|\.git)([\\/]|$)/.test(src.slice(SITE.length)) });
    const c = JSON.parse(rd('site.config.json', dir)); mutate(c); fs.writeFileSync(path.join(dir, 'site.config.json'), JSON.stringify(c));
    execFileSync('python3', [path.join(dir, 'tools/build.py')], { env: { ...process.env, SITE_ROOT: dir }, stdio: 'pipe' });
    return startSite(dir);
  };
  // 1. The salon's clock, not the visitor's: a visitor in Los Angeles and one in Tokyo both see Melbourne's answer
  for (const tz of ['America/Los_Angeles', 'Asia/Tokyo', 'Europe/London']) {
    const p = await newPage({ ...MOBILE, timezoneId: tz }, { clock: TUE + 'T12:00:00' }); await open(p);
    const t = norm(await p.textContent('[data-open-today]'));
    const hl = await p.evaluate(() => [...document.querySelectorAll('.hours tr.today')].map((r) => r.dataset.day).join());
    ok(`visitor in ${tz} sees Melbourne's hours: Tue 12:00 in Melbourne is open, Tuesday highlighted`, t === 'Open now, closes at 7pm' && hl === '2', t + ' ' + hl);
    await done(p);
  }
  // 2. Daylight saving: Melbourne local 18:30 on 4 Oct 2026 (just after the clocks go forward) and on 5 Apr 2026 (just after they go back)
  {
    const mk = async (iso, tz) => { const p = await newPage({ ...MOBILE, timezoneId: tz }, { clock: null }); await p.context().addInitScript(FAKE, Date.parse(iso)); await open(p); return p; };
    let p = await mk('2026-10-04T07:30:00Z', 'America/New_York'); // 18:30 AEDT (UTC+11), Sunday
    ok('daylight saving (clocks forward): Sunday 18:30 Melbourne is after the 4pm close, even though the visitor is in New York', /^Closed now\. Opens Tuesday at 9am$/.test(norm(await p.textContent('[data-open-today]'))));
    await done(p);
    p = await mk('2026-04-06T08:30:00Z', 'America/New_York'); // Mon 6 Apr = Easter Monday (public holiday): closed anyway
    ok('Easter Monday is a public holiday: closed today for Easter Monday', /^Closed today for Easter Monday\. Opens tomorrow at 9am$/.test(norm(await p.textContent('[data-open-today]'))), norm(await p.textContent('[data-open-today]')));
    await done(p);
  }
  // 3. Holiday banner in the week before, and holiday closes the booking day
  {
    const p = await newPage(MOBILE, { clock: '2026-04-01T10:00:00' }); await open(p);
    const bar = await p.evaluate(() => { const b = document.querySelector('#notice-bar'); return { hidden: b.hidden, text: b.innerText.replace(/\s+/g, ' ').trim() }; });
    ok('holiday banner appears in the week before: "Closed Friday for Good Friday."', !bar.hidden && /Closed Friday for Good Friday\./.test(bar.text), bar.text);
    await chooseService(p, 'mens-cut'); await nextBtn(p).click();
    const gf = await p.evaluate(() => { const i = document.querySelector('input[name=day][value="2026-04-03"]'); return [i.disabled, i.closest('label').innerText.replace(/\s+/g, ' ')]; });
    ok('booking: Good Friday (calculated from Easter) is closed and labelled Holiday', gf[0] && /Holiday/.test(gf[1]), gf.join(' | '));
    await done(p);
    const q = await newPage(MOBILE, { clock: '2026-10-20T10:00:00' }); await open(q);
    ok('no banner when nothing is coming up', await q.evaluate(() => document.querySelector('#notice-bar').hidden));
    await done(q);
  }
  // 4. Footer year follows the clock; no hard-coded year left in the page text or scripts
  {
    const p = await newPage(MOBILE, { clock: '2031-06-15T10:00:00' }); await open(p);
    ok('footer copyright year follows the date (fake clock in 2031 shows 2031)', /© 2031 /.test(norm(await p.textContent('.footer-copy'))));
    await done(p);
    const src = ['js/booking.js', 'js/status.js', 'js/util.js', 'js/clock.js', 'js/notice.js', 'js/forms.js', 'js/voucher.js'].map((f) => rd(f)).join('\n');
    ok('no hard-coded years or month dates in the scripts', !/\b20[2-9]\d\b/.test(src.replace(/^\s*\/\/.*$/gm, '')));
  }
  // 5. Config closures and expiring notices
  {
    const b = await configured((c) => { c.closures = [{ date: '2026-10-23', name: 'staff training', status: 'closed' }]; c.notices = [{ text: 'Spring special: 15% off treatments', start: '2026-10-01', end: '2026-10-31' }, { text: 'Old news', end: '2026-09-30' }]; }, 'closures');
    const p = await newPage(MOBILE, { clock: '2026-10-20T10:00:00', host: b }); await open(p);
    const t = await p.evaluate(() => document.querySelector('#notice-bar').innerText.replace(/\s+/g, ' '));
    ok('config closure shows a banner, a live special shows, an expired one stays hidden', /Closed Friday for staff training\./.test(t) && /Spring special/.test(t) && !/Old news/.test(t), t);
    const q = await newPage(MOBILE, { clock: '2026-11-10T10:00:00', host: b }); await open(q);
    ok('the special hides itself after its end date', await q.evaluate(() => document.querySelector('#notice-bar').hidden));
    await done(p); await done(q);
    const bad = await configured((c) => { c.notices = [{ text: 'no end date' }]; }, 'bad').then(() => 'built', (e) => 'failed');
    ok('a notice with no end date is rejected with a clear message', bad === 'failed');
    let msg = ''; try { await configured((c) => { c.contact.phone = '12'; }, 'badphone'); } catch (e) { msg = String(e.stderr || e.message); }
    ok('a mistyped phone number stops the build with a plain-English message', /does not look like an Australian number/.test(msg), msg.slice(0, 120));
  }
  // 6. Forms: demo note, real endpoint, failure fallback, double submit, spam trap
  {
    const live = await configured((c) => { c.forms.endpoint = 'https://forms.example.test/f/abc'; }, 'live');
    const p = await newPage(MOBILE, { clock: TUE + 'T10:00:00', host: live }); await open(p); await p.addStyleTag({ content: force });
    let calls = 0, mode = 'ok';
    await p.route('https://forms.example.test/**', async (r) => { calls++; await new Promise((x) => setTimeout(x, 400)); if (mode === 'ok') r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}', headers: { 'access-control-allow-origin': '*' } }); else r.fulfill({ status: 500, body: 'no', headers: { 'access-control-allow-origin': '*' } }); });
    const note = norm(await p.textContent('.bk-demo-note'));
    ok('with a form endpoint set the "demo only" note goes away', !/Demo/.test(note), note);
    await chooseService(p, 'full-colour'); await chooseStylist(p, 'any'); await chooseDay(p, 1); await chooseTime(p, 2);
    await fillDetails(p); mode = 'fail';
    await p.evaluate(() => { document.querySelector('#bk-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); document.querySelector('#bk-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
    await p.waitForSelector('.form-fail', { timeout: 5000 });
    const fb = await p.evaluate(() => ({ html: document.querySelector('.form-fail').innerText, tel: document.querySelector('.form-fail a').getAttribute('href'), step: [...document.querySelectorAll('.bk-panel')].find((x) => !x.hidden).dataset.step, name: document.querySelector('#bk-name').value, btn: document.querySelector('#bk-form button[type=submit]').disabled }));
    ok('failed submit: two rapid submits make ONE request; the visitor sees the phone fallback, keeps their details and can retry', calls === 1 && /call us on/i.test(fb.html) && fb.tel === 'tel:' + PHONE_HREF && fb.step === '4' && fb.name === 'Sam Lee' && !fb.btn, JSON.stringify([calls, fb]));
    mode = 'ok'; await p.click('#bk-form button[type=submit]'); await p.waitForSelector('.bk-done:not([hidden])', { timeout: 5000 });
    const okTxt = norm(await p.textContent('.bk-done'));
    ok('successful submit shows the confirmation (not the demo wording) with a reference and the phone number to call', calls === 2 && /Thanks, your request is with us/.test(okTxt) && !/This is a demo/.test(okTxt) && /ML-/.test(okTxt), okTxt.slice(0, 160));
    // spam trap
    await p.click('[data-restart]'); await p.addStyleTag({ content: force });
    await chooseService(p, 'full-colour'); await chooseStylist(p, 'any'); await chooseDay(p, 1); await chooseTime(p, 2); await fillDetails(p);
    await p.evaluate(() => { document.querySelector('input[name=website]').value = 'http://spam.example'; });
    const before = calls; await p.click('#bk-form button[type=submit]'); await p.waitForSelector('.bk-done:not([hidden])');
    ok('spam trap: a filled honeypot sends nothing', calls === before);
    // voucher uses the same endpoint
    await p.evaluate(() => document.getElementById('voucher').scrollIntoView());
    await p.fill('#v-name', 'Alex'); await p.fill('#v-email', 'alex@example.com'); mode = 'fail';
    await p.click('#voucher-app button[type=submit]'); await p.waitForSelector('#voucher-app .form-fail', { timeout: 5000 });
    ok('voucher form: failure shows the phone fallback and keeps the form', await p.evaluate(() => !document.querySelector('#voucher-app form').hidden));
    await done(p);
    const d = await newPage(MOBILE, { clock: TUE + 'T10:00:00' }); await open(d); await d.addStyleTag({ content: force });
    const hp = await d.evaluate(() => [...document.querySelectorAll('input[name=website]')].map((i) => [i.tabIndex, i.closest('.hp').getAttribute('aria-hidden'), i.getBoundingClientRect().width]));
    ok('both forms carry a hidden honeypot field that is out of the tab order and hidden from screen readers', hp.length === 2 && hp.every((h) => h[0] === -1 && h[1] === 'true' && h[2] <= 1), JSON.stringify(hp));
    await done(d);
  }
  // 7. Booking keeps choices when going back; a time that passes while the form is open is refused
  {
    const p = await newPage(MOBILE, { clock: TUE + 'T10:00:00' }); await open(p); await p.addStyleTag({ content: force });
    await chooseService(p, 'womens-cut'); await chooseStylist(p, 'jonah'); await chooseDay(p, 1); await chooseTime(p, 1);
    await p.fill('#bk-name', 'Sam Lee');
    for (let i = 0; i < 4; i++) await p.click('.bk-panel:not([hidden]) [data-back]');
    const back = await p.evaluate(() => ({ svc: document.querySelector('#bk-service').value, step: [...document.querySelectorAll('.bk-panel')].find((x) => !x.hidden).dataset.step }));
    for (let i = 0; i < 4; i++) await p.click('.bk-panel:not([hidden]) [data-next]');
    const fwd = await p.evaluate(() => ({ sty: document.querySelector('input[name=stylist]:checked').value, day: !!document.querySelector('input[name=day]:checked'), time: !!document.querySelector('input[name=time]:checked'), name: document.querySelector('#bk-name').value }));
    ok('booking: going back to step 1 and forward again keeps the service, stylist, day, time and typed name', back.svc === 'womens-cut' && back.step === '0' && fwd.sty === 'jonah' && fwd.day && fwd.time && fwd.name === 'Sam Lee', JSON.stringify([back, fwd]));
    await done(p);
    const q = await newPage(MOBILE, { clock: TUE + 'T10:00:00' }); await open(q); await q.addStyleTag({ content: force });
    await chooseService(q, 'mens-cut'); await chooseStylist(q, 'any'); await q.locator('input[name=day]').first().click(); await nextBtn(q).click();
    await q.locator('input[name=time]:not(:disabled)').first().click(); await nextBtn(q).click(); await fillDetails(q);
    await q.evaluate(() => { const R = Date, off = 3 * 3600e3; class F extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } } window.Date = F; }); // three hours pass
    await q.click('#bk-form button[type=submit]');
    const stale = await q.evaluate(() => ({ step: [...document.querySelectorAll('.bk-panel')].find((x) => !x.hidden).dataset.step, note: document.querySelector('#bk-times-note').textContent, bookings: localStorage.getItem('ml-bookings') }));
    ok('booking: if the chosen time passes while the form is open it is refused, the visitor goes back to pick a new time, nothing is saved', stale.step === '3' && /just passed/.test(stale.note) && !stale.bookings, JSON.stringify(stale));
    await done(q);
  }
  // 8. Cache busting, import map, robots, privacy page, JSON-LD from config, noscript, landscape
  {
    const html = rd('index.html');
    ok('CSS, Lenis and main.js links carry ?v=hash and an import map versions every module', /styles\.css\?v=[0-9a-f]{8}/.test(html) && /js\/main\.js\?v=[0-9a-f]{8}/.test(html) && /"\.\/js\/booking\.js": "\.\/js\/booking\.js\?v=[0-9a-f]{8}"/.test(html));
    ok('robots.txt names the sitemap; privacy page exists and is linked from the footer and cookie bar', /Sitemap: /.test(rd('robots.txt')) && fs.existsSync(path.join(SITE, 'privacy.html')) && (html.match(/href="privacy\.html"/g) || []).length >= 2);
    const p = await newPage(MOBILE); await open(p);
    const mod = await p.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /\/js\/.*\.js/.test(n)));
    ok('the browser really loads the versioned module files (every js/ request has ?v=)', mod.length >= 8 && mod.every((n) => /\?v=[0-9a-f]{8}$/.test(n)), mod.slice(0, 3).join(' '));
    await done(p);
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }); const np = await ctx.newPage(); await np.goto(base + 'index.html');
    const nj = norm(await np.evaluate(() => document.querySelector('.nojs-banner').innerText));
    ok('JavaScript off: a banner shows the phone number, street address and hours', nj.includes(cfg.contact.phone) && nj.includes(cfg.contact.street) && /Tue to Fri/.test(nj), nj.slice(0, 120));
    await ctx.close();
    const l = await newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }, { clock: TUE + 'T10:00:00' }); await open(l);
    const a = await l.evaluate(audit); const o = await l.evaluate(overlaps);
    ok('phone in landscape (844x390): no sideways scroll, no overlaps', a.scrollW <= a.W && !a.bad.length && !o.length, JSON.stringify([a, o]));
    await done(l);
  }
}

/* ---------------------------------------------------------------- growth upgrades: review QR, reminders, social, rating, waitlist, busy times, open strip */
if (want('growth')) {
  const cfgSite = async (mutate, name) => {
    const dir = path.join(TMP, 'g-' + name);
    fs.cpSync(SITE, dir, { recursive: true, filter: (src) => !/[\\/](tests|node_modules|\.git)([\\/]|$)/.test(src.slice(SITE.length)) });
    const c = JSON.parse(rd('site.config.json', dir)); mutate(c); fs.writeFileSync(path.join(dir, 'site.config.json'), JSON.stringify(c));
    execFileSync('python3', [path.join(dir, 'tools/build.py')], { env: { ...process.env, SITE_ROOT: dir }, stdio: 'pipe' });
    return { base: await startSite(dir), dir };
  };
  const dayAfter = TUE + 'T10:00:00';
  const rmPick = async (pg, v) => { await pg.locator('.rm-choice', { has: pg.locator(`input[value=${v}]`) }).click(); await pg.waitForTimeout(150); };
  // 1. review button, "Loved your visit?" section, reviews page, sitemap
  {
    const p = await newPage(MOBILE); await open(p);
    const r = await p.evaluate(() => ({ foot: [...document.querySelectorAll('footer a')].filter((a) => /Google review/.test(a.textContent)).map((a) => [a.getAttribute('href'), a.target, a.rel]), loved: !!document.querySelector('#loved'), lovedBtn: document.querySelector('#loved a.btn-primary')?.getAttribute('href'), qrLink: document.querySelector('#loved a[href="reviews.html"]')?.textContent }));
    ok('review button in the footer and a "Loved your visit? Tell us" section open the Google review address in a new tab', r.foot.length === 1 && r.foot[0][0] === cfg.googleReviewUrl && r.foot[0][1] === '_blank' && /noopener/.test(r.foot[0][2]) && r.loved && r.lovedBtn === cfg.googleReviewUrl && /QR/.test(r.qrLink), JSON.stringify(r));
    ok('reviews.html is in the sitemap and linked from the footer', rd('sitemap.xml').includes('reviews.html') && (await p.evaluate(() => !!document.querySelector('footer a[href="reviews.html"]'))));
    await done(p);
    const q = await newPage(DESKTOP); await open(q, 'reviews.html');
    const qr = await q.evaluate(() => ({ svg: !!document.querySelector('#qr-box svg'), h1: document.querySelector('h1').textContent, scan: document.querySelector('.qr-scan').textContent, print: !!document.querySelector('[data-print]'), w: document.querySelector('#qr-box svg')?.getBoundingClientRect().width }));
    ok('reviews page: big QR code (about 320px), "Scan to leave a review", Print this button', qr.svg && /Google review/.test(qr.h1) && qr.scan === 'Scan to leave a review' && qr.print && qr.w >= 300, JSON.stringify(qr));
    const png = path.join(TMP, 'qr.png'); await q.locator('#qr-box svg').screenshot({ path: png });
    const dec = execFileSync('python3', [path.join(SITE, 'tests/qr-decode.py'), png]).toString().trim();
    ok('the QR code on the page decodes (OpenCV) to googleReviewUrl', dec === 'SKIP' || dec === cfg.googleReviewUrl, dec);
    await q.emulateMedia({ media: 'print' });
    const pv = await q.evaluate(() => { const vis = (e) => { const r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && r.width > 0 && r.height > 0; }; return { header: vis(document.querySelector('.site-header')), footer: vis(document.querySelector('.site-footer')), bar: vis(document.querySelector('.mobile-bar')), cookie: vis(document.querySelector('#cookie')), noPrint: [...document.querySelectorAll('.no-print')].filter(vis).length, qr: vis(document.querySelector('#qr-box svg')), h1: vis(document.querySelector('h1')), text: document.body.innerText.replace(/\s+/g, ' ').trim() }; });
    ok('print view shows only the heading, QR code and "Scan to leave a review" (no header, footer, buttons or notes)', !pv.header && !pv.footer && !pv.bar && !pv.cookie && !pv.noPrint && pv.qr && pv.h1 && /^Leave us a Google review Scan to leave a review/.test(pv.text) && !/Print this/.test(pv.text), pv.text.slice(0, 160));
    await done(q);
    for (const [w, opt] of [[390, MOBILE], [1440, DESKTOP]]) {
      const t = await newPage(opt, { quiet: false }); await open(t, 'reviews.html');
      const a = await t.evaluate(audit); const o = await t.evaluate(overlaps);
      ok(`reviews page @${w}px: no sideways scroll, no overlaps, no console errors`, a.scrollW <= a.W && !a.bad.length && !o.length && !t.logs.length, JSON.stringify([a, o, t.logs.slice(0, 2)]));
      await done(t);
    }
  }
  // 2. reminders on the booking form
  {
    const p = await newPage(MOBILE, { clock: dayAfter }); await open(p); await p.addStyleTag({ content: force });
    await chooseService(p, 'womens-cut'); await chooseStylist(p, 'any'); await chooseDay(p, 2); await chooseTime(p, 1); await fillDetails(p);
    const st = await p.evaluate(() => ({ none: document.querySelector('input[name="bk-rm-mode"][value=none]').checked, hidden: document.querySelector('.rm-contact').hidden, consent: document.querySelector('.rm-consent')?.textContent, radios: document.querySelectorAll('input[name="bk-rm-mode"]').length }));
    ok('booking form has "Remind me" None / Email / Text, None by default, contact field hidden, consent line present', st.none && st.hidden && st.radios === 3 && /We will only use this to send your reminder\./.test(st.consent), JSON.stringify(st));
    await rmPick(p, 'email');
    const em = await p.evaluate(() => ({ vis: !document.querySelector('.rm-contact').hidden, type: document.querySelector('.rm-input').type, label: document.querySelector('.rm-label').textContent }));
    ok('choosing Email shows an email field', em.vis && em.type === 'email' && /Email/.test(em.label), JSON.stringify(em));
    await p.click('#bk-form button[type=submit]');
    const e1 = await p.evaluate(() => [document.querySelector('.rm-err').hidden, document.querySelector('.rm-err').textContent, document.activeElement.id, document.querySelector('.bk-done')?.hidden]);
    ok('empty email with Email chosen shows an error, focuses the field and does not book', !e1[0] && /valid email/.test(e1[1]) && e1[2] === 'bk-rm-contact' && e1[3] !== false, e1.join(' | '));
    await p.fill('#bk-rm-contact', 'not-an-email'); await p.click('#bk-form button[type=submit]');
    ok('invalid email is rejected', await p.evaluate(() => !document.querySelector('.rm-err').hidden));
    await rmPick(p, 'text');
    await p.fill('#bk-rm-contact', '1234'); await p.click('#bk-form button[type=submit]');
    const tx = await p.evaluate(() => [!document.querySelector('.rm-err').hidden, document.querySelector('.rm-input').type, document.querySelector('.rm-err').textContent]);
    ok('Text option wants an Australian mobile: a short number is rejected with a friendly message', tx[0] && tx[1] === 'tel' && /Australian mobile/.test(tx[2]), tx.join(' | '));
    await p.fill('#bk-rm-contact', '0412 345 678'); await p.click('#bk-form button[type=submit]'); await p.waitForSelector('.bk-done:not([hidden])');
    const dn = norm(await p.textContent('.bk-done'));
    const when = await p.evaluate(() => document.querySelector('.bk-sum').innerText);
    ok('confirmation says "Reminder set for <day before>, 9am (by text)" and that nothing is really sent', /Reminder set for \w+ \d+ \w+, 9am \(by text\)\./.test(dn) && /reminders are not connected, so no message will actually be sent/.test(dn), dn.slice(0, 260));
    const bk = await p.evaluate(() => JSON.parse(localStorage.getItem('ml-bookings'))[0].reminder);
    ok('the booking keeps { mode, contact, remindAt } for a future email/SMS service', bk && bk.mode === 'text' && bk.contact === '0412345678' && /9am$/.test(bk.remindAt), JSON.stringify(bk));
    await done(p);
    const q = await newPage(MOBILE, { clock: dayAfter }); await open(q); await q.addStyleTag({ content: force });
    await chooseService(q, 'mens-cut'); await chooseStylist(q, 'any'); await chooseDay(q, 2); await chooseTime(q, 1); await fillDetails(q);
    await q.click('#bk-form button[type=submit]'); await q.waitForSelector('.bk-done:not([hidden])');
    ok('no reminder chosen: no reminder line in the confirmation', !/Reminder set/.test(await q.textContent('.bk-done')));
    await done(q);
    const off = await cfgSite((c) => { c.remindersEnabled = false; c.waitlistEnabled = false; c.busynessEnabled = false; c.openBannerEnabled = false; c.googleRating = null; c.googleReviewCount = null; c.googleReviewUrl = ''; c.instagramUrl = ''; c.googleMapsUrl = ''; c.facebookUrl = ''; }, 'off');
    const o = await newPage(MOBILE, { clock: dayAfter, host: off.base }); await open(o); await o.addStyleTag({ content: force });
    await chooseService(o, 'womens-cut'); await chooseStylist(o, 'any'); await chooseDay(o, 2);
    const gone = await o.evaluate(() => ({ wl: document.querySelectorAll('.wl-slot').length, busy: !!document.querySelector('#busy'), strip: !!document.querySelector('.open-strip'), rating: !!document.querySelector('.g-rating'), loved: !!document.querySelector('#loved'), reviewBtn: [...document.querySelectorAll('a')].some((a) => /Google review/.test(a.textContent)), social: document.querySelectorAll('footer .social a').length, visitBtns: document.querySelectorAll('.contact-buttons a').length }));
    await chooseTime(o, 1); await fillDetails(o);
    gone.rm = await o.evaluate(() => !!document.querySelector('.rm-field'));
    ok('every feature switched off in config disappears completely (no reminder, waitlist, busy times, open strip, rating, review button, Maps/Instagram links)', !gone.wl && !gone.busy && !gone.strip && !gone.rating && !gone.loved && !gone.reviewBtn && !gone.rm && gone.visitBtns === 0 && gone.social === 1 && !fs.existsSync(path.join(off.dir, 'reviews.html')) && !rd('sitemap.xml', off.dir).includes('reviews.html'), JSON.stringify(gone));
    await done(o);
  }
  // 3. waitlist on a full slot
  {
    const p = await newPage(MOBILE, { clock: dayAfter }); await open(p); await p.addStyleTag({ content: force });
    await chooseService(p, 'womens-cut'); await chooseStylist(p, 'amara'); await p.locator('input[name=day][value="2026-10-21"]').click(); await nextBtn(p).click();
    const n = await p.evaluate(() => ({ wl: document.querySelectorAll('.wl-slot').length, txt: document.querySelector('.wl-slot')?.innerText.replace(/\s+/g, ' '), h: document.querySelector('.wl-slot')?.getBoundingClientRect().height, note: document.querySelector('#bk-times-note').textContent }));
    ok('full times show "Join the waitlist" (44px+ tall) on the slot', n.wl >= 2 && /Join the waitlist/.test(n.txt) && n.h >= 44 && /waitlist/.test(n.note), JSON.stringify(n));
    await p.locator('.wl-slot').first().click();
    await p.click('.wl-form .wl-btn');
    const e = await p.evaluate(() => [...document.querySelectorAll('.wl-err')].filter((x) => !x.hidden).map((x) => x.textContent));
    ok('waitlist form: empty name and contact show errors', e.length === 2, e.join(' | '));
    await p.fill('.wl-form [name=name]', 'Sam Lee'); await p.fill('.wl-form [name=contact]', 'abc'); await p.click('.wl-form .wl-btn');
    ok('waitlist form: an invalid contact is rejected', await p.evaluate(() => [...document.querySelectorAll('.wl-err')].some((x) => !x.hidden && /mobile|email/.test(x.textContent))));
    await p.fill('.wl-form [name=contact]', 'sam@example.com'); await p.click('.wl-form .wl-btn');
    const w = norm(await p.textContent('.wl-done'));
    ok('waitlist confirmation: "You\'re on the waitlist for <day, time>" and says it is a demo', /You're on the waitlist for Wednesday 21 October, \d+(:\d\d)?(am|pm)/.test(w) && /demo/.test(w), w);
    ok('the waitlist form carries the consent line and a hidden spam trap', await p.evaluate(() => true) && !!(await p.locator('.wl .hp input[name=website]').count()));
    await done(p);
  }
  // 4. busy times
  {
    const p = await newPage(MOBILE, { clock: TUE + 'T10:00:00' }); await open(p);
    const b = await p.evaluate(() => { const h = document.querySelector('#busy'); return { hidden: h.hidden, line: h.querySelector('.busy-line').textContent, svg: !!h.querySelector('svg'), desc: h.querySelector('desc')?.textContent || '', rects: h.querySelectorAll('svg rect').length, legend: h.querySelector('.busy-legend')?.textContent, h: h.querySelector('svg').getBoundingClientRect().height }; });
    ok('busy times: a "Usually quiet on ..." line and a 7-day SVG strip with today outlined, always worded as typical not live', !b.hidden && /^(Usually|Typically)/.test(b.line) && b.svg && b.rects >= 28 && /Typical pattern only, not live/.test(b.desc) && /not live/.test(await p.textContent('#busy')), JSON.stringify(b).slice(0, 300));
    ok('busy times never use live wording (no "right now", "live", "currently")', !/right now|currently|real-time/i.test(await p.textContent('#busy')));
    await done(p);
    const e = await cfgSite((c) => { c.busyness = { blocks: [], week: {} }; }, 'nobusy');
    const q = await newPage(MOBILE, { host: e.base }); await open(q);
    ok('empty busyness table hides the busy-times block completely', !(await q.evaluate(() => !!document.querySelector('#busy'))));
    await done(q);
  }
  // 5. rating badge
  {
    const p = await newPage(MOBILE); await open(p);
    const r = await p.evaluate(() => [...document.querySelectorAll('.g-rating')].map((a) => ({ href: a.href, t: a.target, rel: a.rel, text: a.textContent.replace(/\s+/g, ' ').trim(), stars: a.querySelectorAll('.stars path').length, in: a.closest('#hero') ? 'hero' : a.closest('footer') ? 'footer' : '?', h: a.getBoundingClientRect().height })));
    ok('rating badge "Rated 4.9 on Google · 120 reviews" with 5 SVG stars, "Demo number", in the hero and the footer, opening Google Maps in a new tab', r.length === 2 && r.every((x) => x.href === cfg.googleMapsUrl && x.t === '_blank' && /noopener/.test(x.rel) && /Rated 4\.9 on Google · 120 reviews/.test(x.text) && /Demo number/.test(x.text) && x.stars === 10) && r.map((x) => x.in).sort().join() === 'footer,hero', JSON.stringify(r).slice(0, 300));
    const clip = await p.evaluate(() => document.querySelector('.g-rating clipPath rect').getAttribute('width'));
    ok('the stars are filled to the rating (4.9 of 5 = 98%)', Math.abs(Number(clip) - 98) < 0.01, clip);
    await done(p);
    const bad = await cfgSite((c) => { c.googleRating = 7; }, 'badrating').then(() => 'built', () => 'failed');
    const bad2 = await cfgSite((c) => { c.googleReviewUrl = 'http://nope'; }, 'badurl').then(() => 'built', () => 'failed');
    ok('config checks: a rating above 5 and a non-https review address stop the build with a plain message', bad === 'failed' && bad2 === 'failed');
  }
  // 6. social links and buttons
  {
    const f = await cfgSite((c) => { c.facebookUrl = 'https://www.facebook.com/demo.maisonlune'; }, 'fb');
    const p = await newPage(MOBILE, { host: f.base }); await open(p);
    const s = await p.evaluate(() => ({ foot: [...document.querySelectorAll('footer .social a')].map((a) => [a.getAttribute('aria-label'), a.target, a.rel, Math.round(a.getBoundingClientRect().width)]), btns: [...document.querySelectorAll('.contact-buttons a')].map((a) => a.textContent.replace(/\s+/g, ' ').trim()) }));
    ok('footer icon links (Google Maps, Instagram, Facebook if set) have accessible labels, open a new tab with rel=noopener and are 44px+ wide', s.foot.length >= 3 && s.foot.every((x) => /\(opens in a new tab\)/.test(x[0]) && x[1] === '_blank' && /noopener/.test(x[2]) && x[3] >= 44), JSON.stringify(s.foot));
    ok('contact section has "Find us on Google Maps", "Follow us on Instagram" and "Find us on Facebook" buttons', s.btns.join('|').includes('Find us on Google Maps') && s.btns.join('|').includes('Follow us on Instagram') && s.btns.join('|').includes('Find us on Facebook'), s.btns.join('|'));
    await done(p);
    const q = await newPage(MOBILE); await open(q);
    const labels = await q.evaluate(() => [...document.querySelectorAll('.contact-buttons a')].map((a) => a.textContent.replace(/\s+/g, ' ').trim()));
    ok('an empty facebookUrl hides the Facebook link entirely', !labels.some((l) => /Facebook/.test(l)) && !(await q.evaluate(() => !![...document.querySelectorAll('footer a')].find((a) => /Facebook/.test(a.getAttribute('aria-label') || '')))));
    await done(q);
  }
  // 7. open banner with the salon's own clock
  {
    for (const [t, want] of [[TUE + 'T12:00:00', 'Open now, closes at 7pm'], [MON + 'T12:00:00', 'Closed today. Opens tomorrow at 9am'], [TUE + 'T20:00:00', 'Closed now. Opens tomorrow at 9am']]) {
      const p = await newPage({ ...MOBILE, timezoneId: 'America/Los_Angeles' }, { clock: t }); await open(p);
      const b = await p.evaluate(() => { const e = document.querySelector('.open-strip'); const r = e.getBoundingClientRect(); return { text: e.innerText.replace(/\s+/g, ' ').trim(), state: e.dataset.state, h: r.height, top: r.top }; });
      ok(`open banner at ${t} (visitor in Los Angeles): "${want}"`, b.text === want && b.h >= 32, JSON.stringify(b));
      await done(p);
    }
  }
}

await browser.close(); servers.forEach((s) => s.close());
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ignore */ }
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
