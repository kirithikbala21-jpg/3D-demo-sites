// Automated checks for the Waverley Plumbing & Gas demo. Run:
//   cd plumber-demo && export CHROME_PATH=/path/to/chromium && ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf]
// Needs tests/node_modules (playwright-core + axe-core; a symlink to another demo's tests/node_modules works).
// In a sandbox without downloads, set CHROME_PATH to an installed Chromium. A full run takes a few minutes.
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
const rd = (f) => fs.readFileSync(path.join(SITE, f), 'utf8');
const cfg = JSON.parse(rd('site.config.json'));
const D = Object.fromEntries(['services', 'pricing', 'suburbs', 'reviews', 'team', 'jobs', 'faq', 'photos', 'badges', 'steps'].map((n) => [n, JSON.parse(rd(`data/${n}.json`))]));
const PAGES = cfg.pages.map((p) => p.file);
const PHONE = cfg.contact.phone, PHONE_HREF = cfg.contact.phoneHref;
const arg = (process.argv.find((a) => a.startsWith('--suite=')) || '--suite=all').slice(8).split(',');
const want = (n) => arg.includes('all') || arg.includes(n);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const formHits = [];

function serve(root, { prefix = '' } = {}) {
  return new Promise((res) => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]);
      if (u === '/__form' || u === '/__form-fail') { let b = ''; q.on('data', (c) => { b += c; }); q.on('end', () => { formHits.push({ url: u, len: b.length }); r.writeHead(u === '/__form' ? 200 : 500, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); r.end('{}'); }); return; }
      if (prefix && u.startsWith(prefix)) u = u.slice(prefix.length - 1);
      if (u.endsWith('/')) u += 'index.html';
      fs.readFile(path.join(root, u), (e, d) => {
        if (e) { fs.readFile(path.join(root, '404.html'), (e2, d2) => { r.writeHead(404, { 'content-type': 'text/html' }); r.end(d2 || 'not found'); }); return; }
        r.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); r.end(d);
      });
    }).listen(0, () => res(s));
  });
}
const server = await serve(SITE);
const base = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });

const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? '  ' + extra : ''}`); };
const QUIET = () => { try { localStorage.setItem('wp-cookie', 'no'); } catch (e) { /* ignore */ } };
async function newPage(opts = {}, { quiet = true, extraInit, host = base } = {}) {
  const ctx = await browser.newContext({ locale: 'en-AU', timezoneId: 'Australia/Melbourne', ...opts });
  if (quiet) await ctx.addInitScript(QUIET);
  if (extraInit) await ctx.addInitScript(extraInit);
  await ctx.route(/maps\.google\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' })); // the only third-party request is the lazy Google map; tests stub it
  const p = await ctx.newPage();
  p.logs = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) p.logs.push(m.text()); });
  p.on('pageerror', (e) => p.logs.push('pageerror: ' + e.message));
  p.base = host;
  return p;
}
const done = (p) => p.context().close();
const settle = async (p) => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(350); };
const open = async (p, f = 'index.html') => { await p.goto(p.base + f); await settle(p); };
// Reveal animations and smooth-scroll are quiet extras; tests look at the finished layout.
const force = '.js .reveal{opacity:1!important;transform:none!important;transition:none!important}';
const MOBILE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const DESKTOP = { viewport: { width: 1280, height: 800 } };
const rect = (p, sel) => p.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right, w: r.width, h: r.height, vtop: r.top, vbottom: r.bottom }; });
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const money = (n) => '$' + n.toLocaleString('en-US');

/** Elements that poke past the screen edge unless they sit in an intentional scroll/clip container. */
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
/** Text boxes that overlap each other (intentional overlays are skipped). */
const overlaps = () => {
  const skip = '.hero-chip, .ba-tag, .slot-label, .slot-empty, .gauge, .pipe, .sticky-bar, .cookie, .announce, .site-header, .menu, .skip-link, .em-bg, .btn-num, .ba-knob, .ba-line, .rating-num';
  const els = [...document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,label,summary,th,td,blockquote,legend,span.price-chip')]
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

/* ---------------------------------------------------------------- overflow at every width, no overlaps, section height rule */
if (want('overflow')) {
  for (const w of [360, 375, 390, 414, 600, 768, 1024, 1039, 1040, 1280, 1440, 1920]) {
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
  // Section-height rule: no <section> taller than about 1.5 phone screens (1,300px) at phone width, unless it is a marked swipe section
  for (const w of [360, 375, 390, 414]) {
    const p = await newPage({ viewport: { width: w, height: 844 }, hasTouch: true, isMobile: true });
    await open(p); await p.addStyleTag({ content: force }); await settle(p);
    const hs = await p.evaluate(() => [...document.querySelectorAll('main section')].map((s) => ({ id: s.id || s.className.split(' ')[0], h: Math.round(s.getBoundingClientRect().height), swipe: s.hasAttribute('data-swipe') })));
    const bad = hs.filter((s) => s.h > 1300 && !s.swipe);
    ok(`section height rule @${w}px: all ${hs.length} sections <= 1,300px (tallest ${Math.max(...hs.map((s) => s.h))}px)`, !bad.length && hs.length >= 12, bad.map((s) => `${s.id} ${s.h}`).join(', '));
    await done(p);
  }
}

/* ---------------------------------------------------------------- accessibility (axe-core) + phone usability */
if (want('axe')) {
  const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  for (const w of [375, 1440]) {
    const p = await newPage({ viewport: { width: w, height: 900 } }, { quiet: false });
    const bad = [];
    for (const f of PAGES) {
      await open(p, f); await p.addStyleTag({ content: force });
      await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      await p.evaluate(axeSrc);
      const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(' ')}`));
      if (r.length) bad.push(`${f}: ${r.join('; ')}`);
    }
    ok(`axe: no violations (WCAG 2.2 AA + best practice, contrast 4.5:1) @${w}px on all pages, cookie bar showing`, !bad.length, bad.join(' || '));
    await done(p);
  }
  // axe with the full-screen menu open and the form confirmation showing
  {
    const p = await newPage(MOBILE);
    await open(p); await p.addStyleTag({ content: force });
    await p.click('.nav-toggle'); await p.waitForTimeout(500); await p.evaluate(axeSrc);
    const r1 = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } })).violations.map((v) => `${v.id}: ${v.nodes[0].target.join(' ')}`));
    ok('axe: no violations with the phone menu open', !r1.length, r1.join('; '));
    await p.keyboard.press('Escape');
    await p.fill('#q-name', 'Sam Lee'); await p.fill('#q-phone', '0412 345 678'); await p.fill('#q-suburb', 'Clayton'); await p.selectOption('#q-service', 'blocked-drains'); await p.click('#quote-form button[type=submit]');
    const r2 = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } })).violations.map((v) => `${v.id}: ${v.nodes[0].target.join(' ')}`));
    ok('axe: no violations on the form confirmation screen', !r2.length, r2.join('; '));
    await p.reload(); await settle(p); await p.evaluate(axeSrc); await p.click('#quote-form button[type=submit]');
    const r3 = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } })).violations.map((v) => `${v.id}: ${v.nodes[0].target.join(' ')}`));
    ok('axe: no violations with the form error messages showing', !r3.length, r3.join('; '));
    await done(p);
  }
  // Structure: one h1, heading order never skips a level, alt on every image, labels on every field, landmarks
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
        return { h1: document.querySelectorAll('h1').length, skip, noAlt, noLabel, main: document.querySelectorAll('main').length, header: !!document.querySelector('header'), footer: !!document.querySelector('footer'), lang: document.documentElement.lang, title: document.title };
      });
      if (r.h1 !== 1 || r.skip || r.noAlt || r.noLabel.length || r.main !== 1 || !r.header || !r.footer || r.lang !== 'en-AU' || r.title.split('|').length < 2) bad.push(f + ' ' + JSON.stringify(r));
    }
    ok('every page: one h1, heading order never skips, alt on images, labels on every field, header/main/footer, lang en-AU', !bad.length, bad.join(' | '));
    // visible keyboard focus: tab through the first controls and check an outline is drawn
    await open(p);
    const outlines = [];
    for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); outlines.push(await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const next = getComputedStyle(e, ':focus-visible'); return e === document.body ? 'body' : (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== 'none' ? 'ok' : e.tagName + '.' + e.className; })); }
    ok('keyboard focus: the first 14 tab stops all show a visible outline', outlines.every((o) => o === 'ok' || o === 'body'), outlines.filter((o) => o !== 'ok').join(','));
    await done(p);
  }
  // Phone usability: tap targets 44px, readable text
  {
    const p = await newPage({ ...MOBILE, viewport: { width: 375, height: 812 } }, { quiet: false });
    const tap = [], tiny = [];
    for (const f of PAGES) {
      await open(p, f); await p.addStyleTag({ content: force });
      await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      const r = await p.evaluate(() => {
        const sentence = (a) => { const par = a.closest('p,li,address'); return par && par.textContent.trim().length > a.textContent.trim().length + 6 && getComputedStyle(a).display === 'inline'; };
        const small = [...document.querySelectorAll('a,button,summary,select,textarea,input:not([type=hidden]),[role=tab]')]
          .filter((e) => (e.offsetParent !== null || getComputedStyle(e).position === 'fixed') && !e.closest('[hidden]') && !e.closest('.sr-only') && !sentence(e) && !e.classList.contains('skip-link'))
          .map((e) => { const r = e.getBoundingClientRect(); return [(e.textContent.trim() || e.getAttribute('aria-label') || e.className || e.id).slice(0, 18), Math.round(r.width), Math.round(r.height)]; }).filter(([, w, h]) => h && (h < 44 || w < 44));
        const t = [...document.querySelectorAll('p,li,td,th,address,label,dd,span,a,button,summary,legend,blockquote')].filter((e) => e.offsetParent && !e.closest('[hidden],svg,noscript') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => e.textContent.trim().slice(0, 25));
        return { small: small.slice(0, 5), t: t.slice(0, 4), body: parseFloat(getComputedStyle(document.body).fontSize), lh: getComputedStyle(document.body).lineHeight };
      });
      if (r.small.length) tap.push(`${f}: ${JSON.stringify(r.small)}`);
      if (r.t.length) tiny.push(`${f}: ${JSON.stringify(r.t)}`);
      if (r.body < 17 || parseFloat(r.lh) / r.body < 1.55) tiny.push(`${f}: body ${r.body}px / ${r.lh}`);
    }
    ok('375px: every tap target is at least 44px (inline sentence links excepted)', !tap.length, tap.join(' | '));
    ok('375px: body text 17px+, line-height 1.6, no text under 14px', !tiny.length, tiny.join(' | '));
    await done(p);
  }
  // Type: exactly two font families, heading scale and measure
  {
    const p = await newPage(DESKTOP);
    await open(p);
    const fam = await p.evaluate(() => { const s = new Set(); document.querySelectorAll('body *').forEach((e) => { if (e.closest('svg') || e.closest('noscript')) return; s.add(getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim()); }); return [...s]; });
    ok('exactly two font families are used: Barlow Condensed and Inter', fam.length === 2 && fam.includes('Barlow Condensed') && fam.includes('Inter'), fam.join(','));
    const css = rd('styles.css');
    const ff = [...css.matchAll(/font-family:\s*"([^"]+)"/g)].map((m) => m[1]);
    ok('styles.css declares only the two families in @font-face', [...new Set(ff)].sort().join() === 'Barlow Condensed,Inter', [...new Set(ff)].join());
    const sizes = await p.evaluate(() => ['h1', '#services-title', '.job-meta h3', '.h-card'].map((s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize)));
    ok('desktop heading scale is 56 / 40 / 28 / 20px', sizes[0] === 56 && sizes[1] === 40 && sizes[2] === 28 && sizes[3] === 20, sizes.join('/'));
    const pw = await p.evaluate(() => Math.max(...[...document.querySelectorAll('main p')].filter((e) => e.offsetParent && !e.closest('.swipe')).map((e) => e.getBoundingClientRect().width / parseFloat(getComputedStyle(e).fontSize))));
    ok('paragraph measure is at most 68ch (about 68 x 0.5em wide or less)', pw <= 68 * 1.1, pw.toFixed(1) + ' em');
    await done(p);
    const m = await newPage({ viewport: { width: 390, height: 844 } });
    await open(m);
    const ms = await m.evaluate(() => ['h1', '#services-title', '.job-meta h3', '.h-card'].map((s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize)));
    ok('phone (390px) heading scale is about 36 / 30 / 24 / 19px', Math.abs(ms[0] - 36) < 1.5 && ms[1] === 30 && ms[2] === 24 && Math.abs(ms[3] - 19) < 0.8, ms.map((n) => n.toFixed(1)).join('/'));
    await done(m);
  }
  // Palette: the brand colours are used where the brief says
  {
    const p = await newPage(DESKTOP);
    await open(p);
    const t = await p.evaluate(() => { const s = getComputedStyle(document.documentElement); const cs = (sel) => getComputedStyle(document.querySelector(sel)); return { navy: s.getPropertyValue('--navy').trim().toLowerCase(), orange: s.getPropertyValue('--orange').trim().toLowerCase(), green: s.getPropertyValue('--green').trim().toLowerCase(), call: cs('.header-call').backgroundColor, callText: cs('.header-call').color, h1: cs('h1').color, bg: cs('body').backgroundColor }; });
    ok('palette: navy #0b2545, orange #ff6a13, green #1e9e5a tokens; orange call button with navy text; navy headings; white page', t.navy === '#0b2545' && t.orange === '#ff6a13' && t.green === '#1e9e5a' && t.call === 'rgb(255, 106, 19)' && t.callText === 'rgb(11, 37, 69)' && t.h1 === 'rgb(11, 37, 69)' && t.bg === 'rgb(255, 255, 255)', JSON.stringify(t));
    const bad = await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.offsetParent && !e.closest('svg') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).filter((e) => { const c = getComputedStyle(e).color; const bg = getComputedStyle(e).backgroundColor; return (c === 'rgb(255, 106, 19)' && !e.closest('.emergency')) || (bg === 'rgb(255, 106, 19)' && c === 'rgb(255, 255, 255)'); }).map((e) => e.tagName + '.' + e.className));
    ok('orange text appears only on the navy emergency strip, and white text is never placed on orange', !bad.length, bad.slice(0, 3).join(','));
    await done(p);
  }
}

/* ---------------------------------------------------------------- links, anchors, consistency */
if (want('links')) {
  const p = await newPage(DESKTOP);
  const bad = [], tels = new Set(), seen = new Set();
  for (const f of PAGES) {
    await open(p, f);
    const links = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
    const ids = await p.evaluate(() => new Set([...document.querySelectorAll('[id]')].map((e) => e.id)).size === document.querySelectorAll('[id]').length);
    if (!ids) bad.push(f + ': duplicate ids');
    for (const h of links) {
      seen.add(h);
      if (h.startsWith('tel:')) { tels.add(h); continue; }
      if (h.startsWith('mailto:')) { if (!/^mailto:[^@]+@[^@]+\.[a-z]+$/.test(h)) bad.push(f + ' ' + h); continue; }
      if (/^https?:/.test(h)) { if (!/google\.com\/maps/.test(h)) bad.push(f + ' external ' + h); continue; }
      const [file, hash] = h.split('#');
      const target = file || f;
      if (!fs.existsSync(path.join(SITE, target))) { bad.push(`${f}: missing file ${h}`); continue; }
      if (hash) { const html = rd(target); if (!new RegExp(`id="${hash}"`).test(html)) bad.push(`${f}: missing anchor ${h}`); }
    }
    const imgs = await p.evaluate(() => [...document.images].filter((i) => i.getAttribute('src')).map((i) => [i.getAttribute('src'), i.complete && i.naturalWidth > 0]));
    imgs.forEach(([s, okk]) => { if (!okk) bad.push(`${f}: broken image ${s}`); });
  }
  ok(`links: every internal link, anchor, image and mailto resolves (${seen.size} distinct hrefs)`, !bad.length, bad.slice(0, 4).join(' | '));
  ok('links: every tel: link is the one phone number', tels.size === 1 && [...tels][0] === 'tel:' + PHONE_HREF, [...tels].join(','));
  // the number written out anywhere is always the same
  const texts = [];
  for (const f of PAGES) { await open(p, f); texts.push(await p.evaluate(() => document.body.innerText)); }
  const all = texts.join('\n');
  const phones = [...all.matchAll(/\b0\d\s?\d{4}\s?\d{4}\b/g)].map((m) => m[0]);
  ok(`consistency: the phone number is always ${PHONE} (${phones.length} mentions)`, phones.length >= 8 && phones.every((x) => x === PHONE), [...new Set(phones)].join(','));
  // numbers that must agree
  await open(p);
  const body = await p.evaluate(() => document.body.textContent.replace(/\s+/g, ' '));
  const fix = (re) => [...body.matchAll(re)].map((m) => m[1]);
  const yrs = fix(/(?:since|Est\.?) (\d{4})/gi), plum = fix(/\b(\d+) licensed plumbers/gi).concat(fix(/of our (\d+) plumbers/gi)), mon = fix(/\b(\d+)[- ]months?\b/gi), subs = fix(/cover (\d+) suburbs/gi);
  ok('consistency: established year, plumber count, warranty months and suburb count agree everywhere', yrs.length >= 2 && yrs.every((x) => x === String(cfg.brand.established)) && plum.length >= 2 && plum.every((x) => x === String(cfg.brand.plumbers)) && mon.length >= 2 && mon.every((x) => x === String(cfg.service.warrantyMonths)) && subs.every((x) => Number(x) === D.suburbs.length), JSON.stringify({ yrs, plum, mon, subs }));
  ok('consistency: review summary matches config and says the reviews are fictional', body.includes(cfg.reviewsSummary.rating) && body.includes(`${cfg.reviewsSummary.count} sample reviews`) && body.includes('Sample reviews. Fictional.'));
  const mins = [...body.matchAll(/within (\d+) minutes/g)].map((m) => Number(m[1]));
  const etaMax = Math.max(...D.suburbs.map((s) => Number(s.eta.split(' to ')[1])));
  ok('consistency: every response-time claim is 60 minutes and no suburb ETA is slower', mins.length >= 2 && mins.every((n) => n === cfg.service.arriveMinutes || n === cfg.service.callbackMinutes) && etaMax <= cfg.service.arriveMinutes, mins.join(','));
  ok('consistency: licence, ABN, address, email and hours appear in the footer', ['Lic. 000000', 'ABN 00 000 000 000', cfg.contact.street, cfg.contact.email, 'Mon to Fri 7am to 8pm', 'Sat to Sun 8am to 5pm'].every((s) => body.includes(s)));
  for (const f of PAGES) {
    await open(p, f);
    const t = await p.evaluate(() => ({ a: document.querySelector('.footer-end').innerText, robots: document.querySelector('meta[name=robots]')?.content }));
    if (!t.a.includes('Demo website by KB Ventures') || !t.a.includes('Concept demo. Names, prices and reviews are fictional.') || t.robots !== 'noindex') { ok(`footer demo lines and noindex on ${f}`, false, JSON.stringify(t)); }
  }
  ok('footer has both demo lines and every page is noindex', true);
  // prices on the cards and in the table agree (one source: data/services.json)
  await open(p);
  const cards = await p.evaluate(() => [...document.querySelectorAll('.svc-card')].map((c) => ({ id: c.dataset.service, price: c.querySelector('.pc-num').textContent.trim(), label: c.querySelector('.pc-label').textContent.trim() })));
  const rows = await p.evaluate(() => [...document.querySelectorAll('.price-table tbody tr')].map((r) => ({ price: r.dataset.price, text: r.querySelector('td').textContent.trim(), name: r.querySelector('th').childNodes[0].textContent.trim() })));
  const mism = [];
  for (const s of D.services) {
    const c = cards.find((x) => x.id === s.id);
    if (!c) { mism.push('no card ' + s.id); continue; }
    if (s.from === null) { if (c.price !== 'Free') mism.push('card ' + s.id); continue; }
    if (c.price !== money(s.from)) mism.push(`card ${s.id} ${c.price}`);
    if (!rows.some((r) => r.price === String(s.from) && r.text === 'from ' + money(s.from))) mism.push('table lacks ' + s.id);
  }
  ok('consistency: every price on a service card also appears in the pricing table, and both match data/services.json', !mism.length && cards.length === 6, mism.join(','));
  const need = { 'Blocked drain clearing': 149, 'Tap washer replacement': 129, 'Hot water system repair': 199, 'New electric hot water system': 1490, 'Gas leak check': 169 };
  ok('pricing table has the required rows and prices', Object.entries(need).every(([n, v]) => rows.some((r) => r.name === n && r.text === 'from ' + money(v))) && rows.length >= 7, JSON.stringify(rows.map((r) => r.name + ':' + r.text)));
  const sm = rd('sitemap.xml');
  ok('sitemap lists every page except 404', PAGES.filter((f) => f !== '404.html').every((f) => sm.includes(f === 'index.html' ? 'plumber-demo/</loc>' : f)) && !sm.includes('404'));
  await done(p);
}

/* ---------------------------------------------------------------- behaviour */
if (want('func')) {
  /* ---- header, menu, sticky bar, announcement, cookie ---- */
  {
    const p = await newPage({ ...DESKTOP, viewport: { width: 1280, height: 800 } });
    await open(p);
    const h = await p.evaluate(() => ({ nav: [...document.querySelectorAll('.header-nav a')].map((a) => a.textContent.trim() + '>' + a.getAttribute('href')), call: document.querySelector('.header-call').textContent.trim(), href: document.querySelector('.header-call').getAttribute('href'), toggle: getComputedStyle(document.querySelector('.nav-toggle')).display, sticky: getComputedStyle(document.querySelector('.sticky-bar')).display, brand: document.querySelector('.brand').getAttribute('aria-label') }));
    ok('desktop header: Services, Areas, Pricing, Reviews, Contact + orange call button; no menu button; sticky phone bar hidden', h.nav.join() === 'Services>#services,Areas>#areas,Pricing>#pricing,Reviews>#reviews,Contact>#contact' && h.call === 'Call ' + PHONE && h.href === 'tel:' + PHONE_HREF && h.toggle === 'none' && h.sticky === 'none' && /home$/.test(h.brand), JSON.stringify(h));
    const hb = await rect(p, '.site-header');
    await p.evaluate(() => window.scrollTo(0, 2500)); await p.waitForTimeout(300);
    const hb2 = await rect(p, '.site-header');
    ok('header is sticky (stays at the top while scrolling)', hb2.vtop === 0 && hb.h > 60, JSON.stringify([hb2.vtop, hb.h]));
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.click('.header-nav a[href="#pricing"]'); await p.waitForTimeout(1500);
    const pr = await rect(p, '#pricing');
    ok('nav link scrolls to its section, below the sticky header', Math.abs(pr.vtop - 88) < 60, 'top ' + pr.vtop);
    await done(p);
  }
  {
    const p = await newPage(MOBILE);
    await open(p);
    const s = await p.evaluate(() => { const b = document.querySelector('.sticky-bar'), r = b.getBoundingClientRect(), cs = getComputedStyle(b); const [a, q] = [...b.querySelectorAll('a')]; const ra = a.getBoundingClientRect(), rq = q.getBoundingClientRect(); return { pos: cs.position, bottom: Math.round(innerHeight - r.bottom), ta: a.textContent.trim(), ha: a.getAttribute('href'), tq: q.textContent.trim(), hq: q.getAttribute('href'), ha_h: ra.height, hq_h: rq.height, ca: getComputedStyle(a).backgroundColor, cq: getComputedStyle(q).backgroundColor, cqt: getComputedStyle(q).color }; });
    ok('phone sticky bar: orange "Call 03 5550 0142" and white "Get quote" (navy text), both 44px+ tall, fixed to the bottom', s.pos === 'fixed' && s.bottom === 0 && s.ta === 'Call ' + PHONE && s.ha === 'tel:' + PHONE_HREF && s.tq === 'Get quote' && s.hq === '#quote' && s.ha_h >= 44 && s.hq_h >= 44 && s.ca === 'rgb(255, 106, 19)' && s.cq === 'rgb(255, 255, 255)' && s.cqt === 'rgb(11, 37, 69)', JSON.stringify(s));
    await p.click('.sticky-bar a[href="#quote"]'); await p.waitForTimeout(1500);
    const q = await rect(p, '#quote');
    ok('"Get quote" scrolls to the quote form', q.vtop < 200 && q.vtop > -50, 'top ' + q.vtop);
    // menu overlay
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
    const vis = await p.evaluate(() => ({ toggle: getComputedStyle(document.querySelector('.nav-toggle')).display, nav: getComputedStyle(document.querySelector('.header-nav')).display, brand: document.querySelector('.brand').getBoundingClientRect().height }));
    ok('phone header: menu button visible, inline nav hidden, logo/home link visible', vis.toggle !== 'none' && vis.nav === 'none' && vis.brand >= 44, JSON.stringify(vis));
    await p.click('.nav-toggle');
    const m = await p.evaluate(() => { const m = document.querySelector('#menu'), r = m.getBoundingClientRect(); return { w: r.width, h: r.height, links: [...m.querySelectorAll('a')].map((a) => a.textContent.trim()), expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'), focus: document.activeElement.textContent.trim(), noscroll: document.body.classList.contains('no-scroll') }; });
    ok('menu overlay is full screen with Home, the five links, a quote link and the call button', m.w === 390 && m.h === 844 && ['Home', 'Services', 'Areas', 'Pricing', 'Reviews', 'Contact', 'Get a free quote', 'Call ' + PHONE].every((l) => m.links.includes(l)) && m.expanded === 'true' && m.focus === 'Home' && m.noscroll, JSON.stringify(m));
    await p.keyboard.press('Escape');
    ok('Escape closes the menu and returns focus to the button', (await p.locator('#menu').isHidden()) && (await p.evaluate(() => document.activeElement.className.includes('nav-toggle'))));
    await p.click('.nav-toggle'); await p.click('#menu a[href="#reviews"]'); await p.waitForTimeout(1200);
    const rv = await rect(p, '#reviews');
    ok('choosing a menu link closes the menu and scrolls to that section', (await p.locator('#menu').isHidden()) && rv.vtop < 300 && rv.vtop > -100, 'top ' + rv.vtop);
    await done(p);
  }
  {
    // announcement bar
    const p = await newPage({ viewport: { width: 390, height: 844 } });
    await open(p);
    const a = await p.evaluate(() => { const b = document.querySelector('#announce'), x = document.querySelector('#announce-close'), l = b.querySelector('a'); return { h: b.getBoundingClientRect().height, line: b.querySelector('p').getBoundingClientRect().height, xw: x.getBoundingClientRect().width, xh: x.getBoundingClientRect().height, link: l.getAttribute('href'), text: b.textContent.replace(/\s+/g, ' ').trim() }; });
    ok('announcement bar: one thin line on a phone, 44px close button, tel link', a.h <= 48 && a.line < 50 && a.xw >= 44 && a.xh >= 44 && a.link === 'tel:' + PHONE_HREF && a.text.includes('We answer 24/7') && a.text.includes('Call ' + PHONE), JSON.stringify(a));
    await p.setViewportSize({ width: 1280, height: 800 });
    ok('announcement bar on desktop carries the full line', (await p.locator('#announce').innerText()).replace(/\s+/g, ' ').includes('Burst pipe? Blocked drain? We answer 24/7. Call ' + PHONE));
    await p.click('#announce-close');
    ok('dismissing hides the bar and stores wp-announce=off', (await p.locator('#announce').isHidden()) && (await p.evaluate(() => localStorage.getItem('wp-announce'))) === 'off');
    await p.reload({ waitUntil: 'domcontentloaded' });
    ok('the dismissal is applied before first paint after a reload (class set by the inline head script)', (await p.evaluate(() => document.documentElement.classList.contains('no-announce') && getComputedStyle(document.querySelector('#announce')).display === 'none')) && /wp-announce/.test(rd('index.html').split('</head>')[0]));
    await done(p);
  }
  {
    // cookie bar
    const p = await newPage(MOBILE, { quiet: false });
    await open(p);
    const c = await p.evaluate(() => { const c = document.querySelector('#cookie'), r = c.getBoundingClientRect(), s = document.querySelector('.sticky-bar').getBoundingClientRect(); const b = [...c.querySelectorAll('button')].map((x) => { const q = x.getBoundingClientRect(); return [x.textContent.trim(), Math.round(q.height), Math.round(q.width)]; }); return { h: r.height, bottom: r.bottom, stickyTop: s.top, bg: getComputedStyle(c).backgroundColor, line: c.querySelector('p').getBoundingClientRect().height, b, pos: getComputedStyle(c).position }; });
    ok('cookie bar: thin (<=70px), one line, solid, fixed above the phone sticky bar, Accept + Decline 44px+', c.h <= 70 && c.line < 24 && c.bottom <= c.stickyTop + 1 && /rgb\(\d+, \d+, \d+\)$/.test(c.bg) && c.b.length === 2 && c.b.every(([, h, w]) => h >= 44 && w >= 44) && c.pos === 'fixed', JSON.stringify(c));
    const cover = await p.evaluate(() => { const c = document.querySelector('#cookie').getBoundingClientRect(); const hit = [...document.querySelectorAll('main a, main button, header a, header button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.top < innerHeight && r.bottom > c.top && r.top < c.bottom; }); return hit.map((e) => e.textContent.trim().slice(0, 20)); });
    ok('cookie bar covers no button or link at first load', !cover.length, cover.join(','));
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500);
    const end = await p.evaluate(() => { const l = document.querySelector('.footer-links a'), r = l.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { ok: hit === l, bottom: r.bottom, cookieTop: document.querySelector('#cookie').getBoundingClientRect().top }; });
    ok('at the end of the page nothing is hidden behind the cookie or phone bars', end.ok && end.bottom <= end.cookieTop + 1, JSON.stringify(end));
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.click('[data-cookie="yes"]');
    ok('Accept hides the bar, stores wp-cookie=yes and the page padding shrinks', (await p.locator('#cookie').isHidden()) && (await p.evaluate(() => localStorage.getItem('wp-cookie'))) === 'yes' && !(await p.evaluate(() => document.documentElement.classList.contains('cookie-open'))));
    await p.reload(); await settle(p);
    ok('the cookie choice is remembered', await p.locator('#cookie').isHidden());
    await p.evaluate(() => localStorage.removeItem('wp-cookie')); await p.reload(); await settle(p);
    await p.click('[data-cookie="no"]');
    ok('Decline hides the bar and stores wp-cookie=no', (await p.locator('#cookie').isHidden()) && (await p.evaluate(() => localStorage.getItem('wp-cookie'))) === 'no');
    await done(p);
    const d = await newPage({ viewport: { width: 1280, height: 800 } }, { quiet: false });
    await open(d);
    const dc = await d.evaluate(() => { const r = document.querySelector('#cookie').getBoundingClientRect(); return { h: r.height, bottom: Math.round(innerHeight - r.bottom) }; });
    ok('cookie bar on desktop: thin and at the bottom edge', dc.h <= 70 && dc.bottom === 0, JSON.stringify(dc));
    await done(d);
  }

  /* ---- hero ---- */
  {
    const p = await newPage(MOBILE);
    await open(p);
    const h = await p.evaluate(() => { const g = (s) => document.querySelector(s).getBoundingClientRect(); const btns = [...document.querySelectorAll('.hero-cta a')]; return { h1: document.querySelector('h1').textContent.trim(), sub: document.querySelector('.hero .lead').textContent.trim(), b1: btns[0].textContent.replace(/\s+/g, ' ').trim(), href1: btns[0].getAttribute('href'), b2: btns[1].textContent.trim(), href2: btns[1].getAttribute('href'), c1: getComputedStyle(btns[0]).backgroundColor, h1b: g('h1').bottom, ctaB: g('.hero-cta').bottom, imgT: g('.hero-visual').top, badges: [...document.querySelectorAll('.badges li')].map((l) => l.textContent.trim()), pill: document.querySelector('#avail').textContent.trim() }; });
    ok('hero: exact headline, subline and two buttons (orange Call now tel link, outlined Get a free quote)', h.h1 === 'Plumbers who turn up when they say they will.' && h.sub === 'Licensed, insured, 24/7 emergency across south-east Melbourne. Upfront prices before we start.' && h.b1.startsWith('Call now') && h.href1 === 'tel:' + PHONE_HREF && h.b2 === 'Get a free quote' && h.href2 === '#quote' && h.c1 === 'rgb(255, 106, 19)', JSON.stringify(h));
    ok('hero: four trust badges', h.badges.join('|') === 'Licensed and insured|Upfront pricing|Fixed-price quotes|12-month workmanship guarantee', h.badges.join('|'));
    ok('hero on a phone: headline and buttons come before the image, the buttons are on the first screen', h.h1b < h.imgT && h.ctaB < h.imgT && h.ctaB < 760, JSON.stringify([h.h1b, h.ctaB, h.imgT]));
    await done(p);
  }

  /* ---- open-now logic with a fake clock ---- */
  {
    // Melbourne is on AEDT (UTC+11) in October 2026. Wed 14 Oct, Sat 17 Oct.
    const cases = [
      ['Wed 10:00 Melbourne (office open)', '2026-10-13T23:00:00Z', 'Australia/Melbourne', true, false],
      ['Wed 22:00 Melbourne (closed)', '2026-10-14T11:00:00Z', 'Australia/Melbourne', false, false],
      ['Wed 06:30 Melbourne (before 7am)', '2026-10-13T19:30:00Z', 'Australia/Melbourne', false, false],
      ['Sat 07:30 Melbourne (weekend opens at 8am)', '2026-10-16T20:30:00Z', 'Australia/Melbourne', false, false],
      ['Sat 08:30 Melbourne (weekend open)', '2026-10-16T21:30:00Z', 'Australia/Melbourne', true, false],
      ['Sat 17:30 Melbourne (weekend closed at 5pm)', '2026-10-17T06:30:00Z', 'Australia/Melbourne', false, false],
      ['Sun 12:00 Melbourne (open)', '2026-10-17T22:00:00Z', 'Australia/Melbourne', true, false],
      ['visitor in Sydney, Wed 10:00 Melbourne (same clock, no note)', '2026-10-13T23:00:00Z', 'Australia/Sydney', true, false],
      ['visitor in New York, Wed 10:00 Melbourne (note)', '2026-10-13T23:00:00Z', 'America/New_York', true, true],
      ['visitor in London, Wed 22:00 Melbourne (closed + note)', '2026-10-14T11:00:00Z', 'Europe/London', false, true],
      ['visitor in Perth, Wed 10:00 Melbourne (note)', '2026-10-13T23:00:00Z', 'Australia/Perth', true, true],
    ];
    const res = [];
    for (const [label, iso, tz, open_, note] of cases) {
      const p = await newPage({ viewport: { width: 1280, height: 800 }, timezoneId: tz });
      await p.clock.setFixedTime(new Date(iso));
      await open(p);
      const r = await p.evaluate(() => ({ state: document.querySelector('#avail').dataset.state, pill: document.querySelector('#avail').textContent.trim(), foot: document.querySelector('.site-footer [data-open-status]').textContent.trim(), find: document.querySelector('#contact [data-open-status]').textContent.trim(), green: getComputedStyle(document.querySelector('#avail .dot')).backgroundColor }));
      const goodText = open_ ? r.pill.startsWith('Plumbers available now, usually at your door within 60 minutes') && r.green === 'rgb(30, 158, 90)' && /^Office open now, until /.test(r.find) : r.pill.startsWith('Emergency line open 24/7') && /^Office closed, opens \d+am (today|tomorrow)( \(Melbourne time\))?\. Emergency line open 24\/7/.test(r.find);
      const goodNote = note ? r.pill.includes('(Melbourne time)') === open_ && r.find.includes('(Melbourne time)') && r.foot.includes('(Melbourne time)') : !r.pill.includes('Melbourne time') && !r.find.includes('Melbourne time');
      if (!(r.state === (open_ ? 'open' : 'closed') && goodText && goodNote)) res.push(label + ' => ' + JSON.stringify(r));
      await done(p);
    }
    ok(`open-now logic with a fake clock: ${cases.length} cases (weekday, weekend edges, other time zones, "(Melbourne time)" note)`, !res.length, res.join(' || '));
    const p = await newPage({ viewport: { width: 1280, height: 800 } });
    await p.clock.setFixedTime(new Date('2026-10-14T11:00:00Z')); await open(p);
    ok('closed state says when the office reopens', /opens 7am tomorrow/.test(await p.locator('#contact [data-open-status]').innerText()));
    await done(p);
  }

  /* ---- service cards -> quote form ---- */
  {
    const p = await newPage(MOBILE);
    await open(p);
    const fails = [];
    for (const s of D.services) {
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.locator(`.svc-card[data-service="${s.id}"]`).scrollIntoViewIfNeeded();
      await p.click(`.svc-card[data-service="${s.id}"]`); await p.waitForTimeout(1300);
      const r = await p.evaluate(() => ({ v: document.querySelector('#q-service').value, u: document.querySelector('input[name=urgency]:checked').value, top: document.querySelector('#quote').getBoundingClientRect().top }));
      if (r.v !== s.id || r.u !== s.urgency || r.top > 300 || r.top < -100) fails.push(s.id + ' ' + JSON.stringify(r));
    }
    ok('each of the six service cards jumps to the quote form and preselects the problem and urgency', !fails.length && D.services.length === 6, fails.join(' | '));
    const sizes = await p.evaluate(() => [...document.querySelectorAll('.svc-card')].map((c) => Math.round(c.getBoundingClientRect().width)));
    ok('services are a compact two-column grid on a phone', new Set(sizes).size === 1 && sizes[0] < 200, sizes.join(','));
    await done(p);
  }

  /* ---- quote form ---- */
  {
    const p = await newPage({ ...MOBILE });
    await open(p);
    await p.locator('#quote').scrollIntoViewIfNeeded();
    await p.click('#quote-form button[type=submit]');
    const e1 = await p.evaluate(() => ({ errs: ['name', 'phone', 'suburb', 'service'].map((k) => { const e = document.querySelector('#e-' + k); return !e.hidden && e.textContent.trim().length > 5; }), focus: document.activeElement.id, invalid: document.querySelectorAll('[aria-invalid=true]').length, done: !document.querySelector('#quote-done').hidden }));
    ok('empty submit shows four friendly errors, focuses the first bad field and sends nothing', e1.errs.every(Boolean) && e1.focus === 'q-name' && e1.invalid === 4 && !e1.done, JSON.stringify(e1));
    await p.fill('#q-name', 'Sam Lee');
    const badPhones = ['123', '0412 345 67', '1234567890', '04123456789', 'abc', '05 5550 0142'], goodPhones = ['0412 345 678', '03 5550 0142', '+61 412 345 678', '(03) 5550 0142', '0412345678', '1300 555 014', '13 12 34'];
    const rej = [], acc = [];
    for (const v of badPhones) { await p.fill('#q-phone', v); await p.click('#quote-form button[type=submit]'); if (await p.locator('#e-phone').isHidden()) rej.push(v); }
    for (const v of goodPhones) { await p.fill('#q-phone', v); await p.click('#quote-form button[type=submit]'); if (!(await p.locator('#e-phone').isHidden())) acc.push(v); }
    ok('Australian phone validation rejects bad numbers and accepts mobiles, landlines, +61, 13/1300 numbers', !rej.length && !acc.length, `wrongly accepted: ${rej.join(',')}; wrongly rejected: ${acc.join(',')}`);
    await p.fill('#q-phone', '0412 345 678');
    await p.click('#quote-form button[type=submit]');
    ok('fixing a field clears its error and focus moves to the next problem', (await p.locator('#e-phone').isHidden()) && (await p.evaluate(() => document.activeElement.id)) === 'q-suburb');
    // photo
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFUlEQVR4nGP8z8Dwn4EIwESMolGFxAEA6PkCEf8ZP8kAAAAASUVORK5CYII=', 'base64');
    await p.setInputFiles('#q-photo', { name: 'leak-under-sink.png', mimeType: 'image/png', buffer: png });
    await p.waitForTimeout(200);
    const ph = await p.evaluate(() => { const t = document.querySelector('#photo-thumb'); return { shown: !document.querySelector('#photo-preview').hidden, name: document.querySelector('#photo-name').textContent, w: t.naturalWidth, alt: t.alt, src: t.src.slice(0, 5), wh: [t.getAttribute('width'), t.getAttribute('height')] }; });
    ok('photo upload: shows the file name and a small preview (stays on the device)', ph.shown && ph.name === 'leak-under-sink.png' && ph.w === 8 && ph.alt.length > 5 && ph.src === 'blob:' && ph.wh[0] === '72', JSON.stringify(ph));
    await p.click('#photo-clear');
    ok('Remove clears the photo', (await p.locator('#photo-preview').isHidden()) && (await p.evaluate(() => document.querySelector('#q-photo').files.length)) === 0);
    await p.setInputFiles('#q-photo', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    ok('a non-image file is refused with a friendly message', (await p.locator('#e-photo').isVisible()) && (await p.locator('#photo-preview').isHidden()));
    await p.setInputFiles('#q-photo', { name: 'leak-under-sink.png', mimeType: 'image/png', buffer: png });
    await p.fill('#q-suburb', 'Clayton'); await p.selectOption('#q-service', 'blocked-drains'); await p.fill('#q-msg', 'Kitchen sink is blocked.');
    await p.check('input[name=urgency][value=week]');
    await p.click('#quote-form button[type=submit]');
    const d = await p.evaluate(() => ({ done: !document.querySelector('#quote-done').hidden, form: document.querySelector('#quote-form').hidden, text: document.querySelector('#done-text').textContent, sub: document.querySelector('#done-sub').textContent, focus: document.activeElement.id, rec: JSON.parse(localStorage.getItem('wp-quotes') || '[]'), demo: document.querySelector('#quote-done .demo-note').textContent }));
    ok('confirmation: "Thanks Sam, we will call you within 15 minutes between 7am and 8pm."', d.done && d.form && d.text === 'Thanks Sam, we will call you within 15 minutes between 7am and 8pm.' && d.focus === 'quote-done' && /Weekends: 8am to 5pm/.test(d.sub) && /Demo form/.test(d.demo), JSON.stringify(d));
    ok('request saved to localStorage wp-quotes (no photo data, just its name)', d.rec.length === 1 && d.rec[0].name === 'Sam Lee' && d.rec[0].phone === '0412345678' && d.rec[0].suburb === 'Clayton' && d.rec[0].service === 'blocked-drains' && d.rec[0].urgency === 'week' && d.rec[0].photoName === 'leak-under-sink.png' && d.rec[0].message === 'Kitchen sink is blocked.' && JSON.stringify(d.rec).length < 800);
    await p.click('#quote-again');
    const again = await p.evaluate(() => ({ form: !document.querySelector('#quote-form').hidden, name: document.querySelector('#q-name').value, focus: document.activeElement.id, u: document.querySelector('input[name=urgency]:checked').value }));
    ok('"Send another" resets the form', again.form && again.name === '' && again.focus === 'q-name' && again.u === 'today', JSON.stringify(again));
    // emergency
    await p.fill('#q-name', 'Priya Shah'); await p.fill('#q-phone', '03 5550 0142'); await p.fill('#q-suburb', 'Oakleigh'); await p.selectOption('#q-service', 'emergency'); await p.check('input[name=urgency][value=emergency]');
    await p.click('#quote-form button[type=submit]');
    const em = await p.evaluate(() => ({ text: document.querySelector('#done-text').textContent, title: document.querySelector('#done-title').textContent, n: JSON.parse(localStorage.getItem('wp-quotes')).length }));
    ok('emergency urgency: the confirmation tells them to call 03 5550 0142 now', em.text.includes('Thanks Priya') && em.text.includes('call ' + PHONE + ' now') && em.title === 'Please call us now' && em.n === 2, JSON.stringify(em));
    const labels = await p.evaluate(() => [...document.querySelectorAll('#quote-form input:not([type=radio]), #quote-form select, #quote-form textarea')].map((e) => [e.id, e.labels.length && e.labels[0].textContent.trim()]));
    ok('every quote form field has a visible label; the urgency options are in a fieldset with a legend', labels.every(([, l]) => l) && (await p.locator('#quote-form fieldset legend').innerText()) === 'How urgent is it?' && (await p.locator('input[name=urgency]').count()) === 4, JSON.stringify(labels));
    ok('the form states it is a demo and nothing is sent', /Demo form/.test(await p.locator('#quote .demo-note').first().innerText()));
    await done(p);
  }

  /* ---- suburb checker ---- */
  {
    const p = await newPage(MOBILE);
    await open(p);
    await p.locator('#areas').scrollIntoViewIfNeeded();
    const live = await p.getAttribute('#area-result', 'aria-live');
    const q = async (v) => { await p.fill('#area-input', v); await p.click('#area-form button[type=submit]'); return norm(await p.locator('#area-result').innerText()); };
    const fails = [];
    for (const s of D.suburbs) { const t = await q(s.name); if (t !== `Yes, we service ${s.name}, usually within ${s.eta} minutes.` && !(s.postcode === '3150' && t.startsWith('Yes, we service'))) fails.push(s.name + ': ' + t); }
    ok('suburb checker: every suburb gets "Yes, we service <suburb>, usually within X to Y minutes."', !fails.length, fails.join(' | '));
    ok('suburb checker: Glen Waverley answer uses its ETA from config', (await q('glen waverley')) === 'Yes, we service Glen Waverley, usually within 30 to 45 minutes.');
    ok('suburb checker: postcode 3168 finds Clayton; 3150 finds Glen Waverley and Wheelers Hill', (await q('3168')) === 'Yes, we service Clayton, usually within 40 to 55 minutes.' && (await q('3150')) === 'Yes, we service Glen Waverley and Wheelers Hill, usually within 30 to 45 minutes.');
    ok('suburb checker: "Mt Waverley" and extra spaces are understood', (await q('  mt   waverley ')).startsWith('Yes, we service Mount Waverley'));
    const no = await q('Melton');
    ok('suburb checker: unknown suburb says "Not yet. Call us on 03 5550 0142 and we will see what we can do." with a tel link', no === 'Not yet. Call us on 03 5550 0142 and we will see what we can do.' && (await p.getAttribute('#area-result a', 'href')) === 'tel:' + PHONE_HREF && (await p.getAttribute('#area-result', 'data-state')) === 'no' && (await q('9999')).startsWith('Not yet.'));
    ok('suburb checker result is an aria-live region and the field has a label', live === 'polite' && (await p.getAttribute('#area-result', 'role')) === 'status' && (await p.locator('label[for=area-input]').innerText()).includes('suburb or postcode'));
    await p.fill('#area-input', 'Cla');
    ok('typing a prefix updates live as you type', (await p.locator('#area-result').innerText()).startsWith('Yes, we service Clayton'));
    const chips = await p.evaluate(() => [...document.querySelectorAll('.chip')].map((c) => c.textContent.trim()));
    await p.click('.chip[data-suburb="Box Hill"]');
    ok('8 suburb chips; tapping one fills the checker and answers', chips.length === 8 && (await p.inputValue('#area-input')) === 'Box Hill' && (await p.locator('#area-result').innerText()).startsWith('Yes, we service Box Hill, usually within 45 to 60 minutes') && (await p.getAttribute('.chip[data-suburb="Box Hill"]', 'aria-pressed')) === 'true', chips.join('|'));
    await done(p);
  }

  /* ---- before / after slider ---- */
  {
    const p = await newPage(DESKTOP);
    await open(p);
    await p.locator('#jobs').scrollIntoViewIfNeeded();
    const t0 = await p.evaluate(() => ({ tabs: [...document.querySelectorAll('[role=tab]')].map((t) => t.textContent.trim()), vis: [...document.querySelectorAll('[role=tabpanel]')].map((e) => !e.hidden), roles: document.querySelector('[role=tablist]').getAttribute('aria-label') }));
    ok('recent jobs: three tabs (leaking tap, hot water unit, bathroom reno), one job visible at a time', t0.tabs.length === 3 && t0.vis.join() === 'true,false,false', JSON.stringify(t0));
    await p.click('#tab-hws');
    ok('clicking a tab shows that job only', (await p.evaluate(() => [...document.querySelectorAll('[role=tabpanel]')].map((e) => !e.hidden).join())) === 'false,true,false');
    await p.focus('#tab-hws'); await p.keyboard.press('ArrowRight');
    ok('arrow keys move between tabs', (await p.evaluate(() => document.activeElement.id)) === 'tab-bath' && !(await p.locator('#job-bath').isHidden()));
    await p.keyboard.press('Home');
    const range = p.locator('#job-tap .ba-range');
    ok('Home key goes to the first tab', (await p.evaluate(() => document.activeElement.id)) === 'tab-tap');
    await range.focus();
    for (let i = 0; i < 5; i++) await p.keyboard.press('ArrowRight');
    const k = await p.evaluate(() => { const r = document.querySelector('#job-tap .ba-range'); return { v: r.value, pos: document.querySelector('#job-tap .ba').style.getPropertyValue('--pos'), vt: r.getAttribute('aria-valuetext'), type: r.type, label: r.getAttribute('aria-label') }; });
    ok('slider is a real range input, keyboard operable: 5 x Right moves 50% to 55%', k.v === '55' && k.pos === '55%' && k.type === 'range' && /Before and after/.test(k.label) && /55% before/.test(k.vt), JSON.stringify(k));
    await p.keyboard.press('Home'); await p.keyboard.press('End');
    ok('Home and End jump to the ends', (await range.inputValue()) === '100');
    const box = await p.locator('#job-tap .ba-frame').boundingBox();
    await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5, { steps: 6 }); await p.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 4 }); await p.mouse.up();
    const dv = Number(await range.inputValue());
    ok('dragging the handle with the mouse moves the divider (to about 20%)', dv >= 12 && dv <= 28, 'value ' + dv);
    const clip = await p.evaluate(() => getComputedStyle(document.querySelector('#job-tap .ba-before')).clipPath);
    ok('the before image is clipped at the divider', /inset/.test(clip), clip);
    await done(p);
    const m = await newPage(MOBILE);
    await open(m); await m.locator('#jobs').scrollIntoViewIfNeeded();
    const b2 = await m.locator('#job-tap .ba-frame').boundingBox();
    await m.touchscreen.tap(b2.x + b2.width * 0.8, b2.y + b2.height * 0.5);
    const tv = Number(await m.locator('#job-tap .ba-range').inputValue());
    ok('touch: tapping the image on a phone moves the divider (to about 80%)', tv >= 70 && tv <= 90, 'value ' + tv);
    const tabs = await m.evaluate(() => [...document.querySelectorAll('[role=tab]')].map((t) => Math.round(t.getBoundingClientRect().height)));
    ok('job tabs are 44px+ tall on a phone', tabs.every((h) => h >= 44), tabs.join());
    await done(m);
  }

  /* ---- FAQ ---- */
  {
    const p = await newPage(DESKTOP);
    await open(p);
    await p.locator('#faq').scrollIntoViewIfNeeded();
    const n = await p.evaluate(() => ({ n: document.querySelectorAll('details.faq').length, open: document.querySelectorAll('details.faq[open]').length, q: [...document.querySelectorAll('.faq summary')].map((s) => s.textContent.trim()) }));
    ok('FAQ: eight collapsed accordion questions', n.n === 8 && n.open === 0 && /charge a call-out fee/.test(n.q[0]) && /licensed/.test(n.q[1]) && /weekends/.test(n.q[2]) && /gas/.test(n.q[3]) && /How fast/.test(n.q[4]) && /warranty/.test(n.q[5]) && /insurers/.test(n.q[6]) && /card/.test(n.q[7]), JSON.stringify(n.q));
    ok('answers are hidden until opened', !(await p.locator('.faq p').first().isVisible()));
    await p.click('.faq summary >> nth=0');
    ok('clicking a question opens its answer', (await p.locator('.faq p').first().isVisible()) && (await p.locator('.faq').first().evaluate((e) => e.open)));
    await p.focus('.faq summary >> nth=2'); await p.keyboard.press('Enter');
    ok('keyboard: Enter toggles a question', await p.locator('.faq').nth(2).evaluate((e) => e.open));
    await p.keyboard.press('Enter');
    ok('keyboard: Enter closes it again', !(await p.locator('.faq').nth(2).evaluate((e) => e.open)));
    const ans = await p.evaluate(() => [...document.querySelectorAll('.faq p')].map((e) => e.textContent));
    ok('FAQ answers agree with the rest of the site ($199 call-out, $169 gas check, 12 months, 60 minutes, 8am to 5pm weekends)', /\$199/.test(ans[0]) && /Lic\. 000000/.test(ans[1]) && /8am to 5pm/.test(ans[2]) && /\$169/.test(ans[3]) && /60 minutes/.test(ans[4]) && /12-month/.test(ans[5]) && /Afterpay/.test(ans[7]));
    await done(p);
  }

  /* ---- reviews and team swipe rows ---- */
  {
    const p = await newPage(MOBILE);
    await open(p);
    const r = await p.evaluate(() => { const row = document.querySelector('.reviews-row'), t = document.querySelector('.team-row'); const cs = getComputedStyle(row), ts = getComputedStyle(t); const c0 = row.children[0].getBoundingClientRect(); return { rn: row.children.length, snap: cs.scrollSnapType, ox: cs.overflowX, scroll: row.scrollWidth > row.clientWidth, peek: c0.right < innerWidth - 20 && row.children[1].getBoundingClientRect().left < innerWidth - 8, tn: t.children.length, tsnap: ts.scrollSnapType, tscroll: t.scrollWidth > t.clientWidth, rating: document.querySelector('.rating-num').textContent.trim(), stars: document.querySelectorAll('.review .stars').length, tag: document.querySelector('.sample-tag').textContent.trim(), tabindex: row.getAttribute('tabindex'), team: [...document.querySelectorAll('.member')].map((m) => m.textContent.replace(/\s+/g, ' ').trim()) }; });
    ok('reviews: six reviews in a snap-scrolling swipe row with the next card peeking; 4.9 summary labelled "Sample reviews. Fictional."', r.rn === 6 && /x/.test(r.snap) && r.scroll && r.peek && r.rating === cfg.reviewsSummary.rating && r.stars === 6 && r.tag === 'Sample reviews. Fictional.', JSON.stringify(r));
    ok('team: four plumbers in a swipe row, each with role, years and the licence placeholder', r.tn === 4 && /x/.test(r.tsnap) && r.tscroll && r.team.every((t) => /years experience/.test(t) && /Lic\. 000000/.test(t)), JSON.stringify(r.team));
    await done(p);
    const d = await newPage(DESKTOP);
    await open(d);
    const g = await d.evaluate(() => ({ rv: getComputedStyle(document.querySelector('.reviews-row')).display, cols: getComputedStyle(document.querySelector('.reviews-row')).gridTemplateColumns.split(' ').length, tcols: getComputedStyle(document.querySelector('.team-row')).gridTemplateColumns.split(' ').length, sw: getComputedStyle(document.querySelector('.reviews-row')).overflowX }));
    ok('desktop: reviews are a 3-column grid and the team a 4-column grid (no swipe)', g.rv === 'grid' && g.cols === 3 && g.tcols === 4 && g.sw === 'visible', JSON.stringify(g));
    await done(d);
    const lines = D.reviews.map((x) => x.text); ok('six reviews, each with first name + suburb', D.reviews.length === 6 && D.reviews.every((x) => x.name && x.suburb && x.text.length > 40) && lines.some((t) => t.startsWith('Came out at 9pm on a Sunday')));
  }

  /* ---- no chat, hero pipe, placeholders ---- */
  {
    const p = await newPage(DESKTOP);
    const reqs = [];
    p.on('request', (r) => reqs.push(r.url()));
    for (const f of PAGES) await open(p, f);
    await open(p);
    const chat = await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => /chat|intercom|drift|tawk|crisp|zendesk|livechat|messenger|whatsapp/i.test((e.id || '') + ' ' + (typeof e.className === 'string' ? e.className : '') + ' ' + (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('src') || ''))).map((e) => e.tagName + '#' + e.id));
    ok('no chat button or widget anywhere (no chat markup, no third-party scripts)', !chat.length && reqs.every((u) => u.startsWith(base) || /maps\.google\.com/.test(u)), chat.join(',') + reqs.filter((u) => !u.startsWith(base)).join(','));
    await done(p);
  }
  {
    // the pipe draws with scroll
    for (const [label, opts] of [['desktop', DESKTOP], ['phone', MOBILE]]) {
      const p = await newPage(opts);
      await open(p);
      const read = () => p.evaluate(() => { const m = document.querySelector('.pipe-main'); const nodes = [...document.querySelectorAll('.pipe-node')]; return { off: parseFloat(m.style.strokeDashoffset), len: m.getTotalLength(), on: nodes.filter((n) => n.classList.contains('on')).length, total: nodes.length, fill: parseFloat(document.querySelector('#gauge').style.getPropertyValue('--fill')), pct: document.querySelector('[data-gauge-pct]').textContent, heads: document.querySelectorAll('[data-pipe]').length, w: document.querySelector('.pipe').getBoundingClientRect().width, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }; });
      const a = await read();
      await p.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2)); await p.waitForTimeout(400);
      const b = await read();
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(900);
      const c = await read();
      ok(`pipe @${label}: a copper SVG path with ${a.total} joints (one per heading), drawn by scroll via stroke-dashoffset (${Math.round(a.off)} -> ${Math.round(b.off)} -> ${Math.round(c.off)} of ${Math.round(a.len)})`, a.total === a.heads && a.total >= 12 && a.off > a.len * 0.85 && b.off > a.len * 0.15 && b.off < a.len * 0.85 && c.off < 1, JSON.stringify([a, b, c]));
      ok(`pipe @${label}: joints light up as the pipe reaches them (${a.on} -> ${b.on} -> ${c.on} of ${c.total})`, a.on < b.on && b.on < c.on && c.on === c.total);
      ok(`pipe @${label}: the footer gauge is empty at the top, partly full on the way, full at the end (${a.pct} / ${b.pct} / ${c.pct})`, a.fill === 0 && b.fill < 1 && c.fill === 1 && c.pct === '100%' && a.pct === '0%');
      ok(`pipe @${label}: adds no horizontal scroll`, c.sw <= c.cw);
      await done(p);
    }
    const rm = await newPage({ ...DESKTOP, reducedMotion: 'reduce' });
    await open(rm);
    const r = await rm.evaluate(() => { const m = document.querySelector('.pipe-main'); const nodes = [...document.querySelectorAll('.pipe-node')]; return { off: parseFloat(m.style.strokeDashoffset), on: nodes.filter((n) => n.classList.contains('on')).length, total: nodes.length, pct: document.querySelector('[data-gauge-pct]').textContent, lenis: !!window.__lenis, pre: document.querySelectorAll('.reveal.pre').length, tr: getComputedStyle(document.querySelector('.svc-card')).transitionDuration }; });
    await rm.evaluate(() => window.scrollTo(0, 1500)); await rm.waitForTimeout(300);
    const r2 = await rm.evaluate(() => parseFloat(document.querySelector('.pipe-main').style.strokeDashoffset));
    ok('reduced motion: the pipe is static and fully drawn, every joint lit, gauge full, no smooth-scroll, no reveals', r.off === 0 && r2 === 0 && r.on === r.total && r.pct === '100%' && !r.lenis && r.pre === 0 && /^0s/.test(r.tr), JSON.stringify(r));
    await done(rm);
    const pr = await newPage(DESKTOP);
    await open(pr); await pr.emulateMedia({ media: 'print' });
    const pp = await pr.evaluate(() => { const m = document.querySelector('.pipe-main'); return { off: getComputedStyle(m).strokeDashoffset, fill: getComputedStyle(document.querySelector('.gauge-fill')).transform, ann: getComputedStyle(document.querySelector('.sticky-bar')).display, nodes: getComputedStyle(document.querySelector('.pipe-node')).fill }; });
    ok('print: the pipe is fully drawn, the gauge full, the phone bar hidden', pp.off === '0px' && /matrix\(1,/.test(pp.fill) && pp.ann === 'none' && pp.nodes === 'rgb(196, 122, 61)', JSON.stringify(pp));
    await done(pr);
    const sz = fs.statSync(path.join(SITE, 'js/pipe.js')).size;
    ok(`pipe script is tiny (${sz} bytes) and scroll work is rAF-throttled`, sz < 6000 && /requestAnimationFrame/.test(rd('js/pipe.js')) && /passive: true/.test(rd('js/pipe.js')));
  }
  {
    // photo slots: placeholders and real photos
    const p = await newPage(DESKTOP);
    await open(p);
    const slots = Object.keys(D.photos.slots);
    const found = await p.evaluate(() => [...document.querySelectorAll('.slot-empty')].map((e) => ({ slot: e.dataset.slot, text: e.textContent })));
    const missing = slots.filter((s) => !found.some((f) => f.slot === s && f.text.includes('PHOTO SLOT: ' + s)) && !(fs.existsSync(path.join(SITE, D.photos.slots[s].file))));
    const exact = ['hero-plumber-van', 'plumber-at-work-1', 'plumber-at-work-2', 'tools-closeup', 'hot-water-unit', 'bathroom-clean', 'blocked-drain-work', 'team-1', 'team-2', 'team-3', 'team-4', 'before-after-1-before', 'before-after-1-after', 'before-after-2-before', 'before-after-2-after', 'before-after-3-before', 'before-after-3-after', 'emergency-night-van'];
    ok(`photo slots: all ${exact.length} named slots exist, and each renders a labelled placeholder ("PHOTO SLOT: name - ...") while it has no file`, slots.length === exact.length && exact.every((s) => slots.includes(s)) && !missing.length, missing.join(','));
    const md = rd('PHOTO-SLOTS.md');
    ok('PHOTO-SLOTS.md documents every slot', exact.every((s) => md.includes('`' + s + '`')) && /CREDITS-TODO/.test(md) || exact.every((s) => md.includes('`' + s + '`')));
    ok('CREDITS-TODO.md exists', fs.existsSync(path.join(SITE, 'CREDITS-TODO.md')));
    const real = fs.existsSync(path.join(SITE, 'img/photos')) ? fs.readdirSync(path.join(SITE, 'img/photos')) : [];
    const big = real.filter((f) => fs.statSync(path.join(SITE, 'img/photos', f)).size > (f.startsWith('hero') ? 250 : 400) * 1024);
    ok(`photo budget: hero under 250KB, other photos under 400KB (${real.length} photo files present)`, !big.length, big.join(','));
    await done(p);
    // real photo renders when a file exists (temp copy, built with the real build script)
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-photos-'));
    for (const f of fs.readdirSync(SITE)) { if (['tests', '.git'].includes(f)) continue; fs.cpSync(path.join(SITE, f), path.join(tmp, f), { recursive: true }); }
    const mk = await browser.newPage({ viewport: { width: 1600, height: 1067 } });
    await mk.setContent('<body style="margin:0;background:linear-gradient(135deg,#0b2545,#ff6a13)"></body>');
    fs.mkdirSync(path.join(tmp, 'img/photos'), { recursive: true });
    const pngBuf = await mk.screenshot({ type: 'png' }); await mk.close();
    for (const s of ['hero-plumber-van', 'team-1', 'before-after-1-before']) { fs.writeFileSync(path.join(tmp, D.photos.slots[s].file), pngBuf); }
    const pj = JSON.parse(fs.readFileSync(path.join(tmp, 'data/photos.json'), 'utf8'));
    pj.slots['hero-plumber-van'].credit = 'Jane Doe / Unsplash'; pj.slots['hero-plumber-van'].w = 1600; pj.slots['hero-plumber-van'].h = 1067;
    fs.writeFileSync(path.join(tmp, 'data/photos.json'), JSON.stringify(pj));
    execFileSync('python3', [path.join(tmp, 'tools/build.py')], { env: { ...process.env, SITE_ROOT: tmp } });
    const ts = await serve(tmp); const tb = `http://localhost:${ts.address().port}/`;
    const tp = await newPage(DESKTOP, { host: tb });
    await open(tp);
    const rp = await tp.evaluate(() => { const i = document.querySelector('.frame-hero img'); return { ok: !!i && i.complete && i.naturalWidth === 1600, alt: i && i.alt, w: i && i.getAttribute('width'), h: i && i.getAttribute('height'), fp: i && i.getAttribute('fetchpriority'), fit: i && getComputedStyle(i).objectFit, pos: i && i.style.objectPosition, heroPlaceholder: !!document.querySelector('[data-slot="hero-plumber-van"]'), teamImg: !!document.querySelector('.frame-team img'), team1Ph: !!document.querySelector('[data-slot="team-1"]'), team2Ph: !!document.querySelector('[data-slot="team-2"]'), ba: !!document.querySelector('.ba-before img'), baAfterPh: !!document.querySelector('[data-slot="before-after-1-after"]'), credit: document.querySelector('.footer-credit')?.textContent || '', teamLazy: document.querySelector('.frame-team img')?.getAttribute('loading') }; });
    ok('a real photo renders as an <img> (alt, width+height, object-fit cover, focal point, eager+high priority hero) while other slots stay placeholders; credit shows in the footer', rp.ok && rp.alt.length > 10 && rp.w === '1600' && rp.h === '1067' && rp.fp === 'high' && rp.fit === 'cover' && rp.pos === '50% 55%' && !rp.heroPlaceholder && rp.teamImg && !rp.team1Ph && rp.team2Ph && rp.ba && rp.baAfterPh && /Jane Doe/.test(rp.credit) && rp.teamLazy === 'lazy', JSON.stringify(rp));
    const lazy = await tp.evaluate(() => [...document.querySelectorAll('img[src]')].filter((i) => !i.closest('.hero') && i.loading !== 'lazy').length);
    ok('every below-the-fold image is lazy-loaded', lazy === 0);
    await tp.setViewportSize({ width: 390, height: 844 }); await tp.reload(); await settle(tp);
    const ov = await tp.evaluate(audit);
    ok('with real photos in place there is still no horizontal overflow on a phone', ov.scrollW <= ov.W && !ov.bad.length, JSON.stringify(ov));
    await done(tp); ts.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  {
    // form endpoint: connected mode posts, failure is friendly (temp copy with endpoint set)
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-form-'));
    for (const f of fs.readdirSync(SITE)) { if (['tests', '.git'].includes(f)) continue; fs.cpSync(path.join(SITE, f), path.join(tmp, f), { recursive: true }); }
    const ts = await serve(tmp); const tb = `http://localhost:${ts.address().port}/`;
    for (const [ep, expect] of [['/__form', 'ok'], ['/__form-fail', 'fail']]) {
      const c = JSON.parse(fs.readFileSync(path.join(tmp, 'site.config.json'), 'utf8')); c.form.endpoint = tb.slice(0, -1) + ep; fs.writeFileSync(path.join(tmp, 'site.config.json'), JSON.stringify(c));
      execFileSync('python3', [path.join(tmp, 'tools/build.py')], { env: { ...process.env, SITE_ROOT: tmp } });
      const p = await newPage(DESKTOP, { host: tb }); const before = formHits.length;
      await open(p);
      await p.fill('#q-name', 'Sam'); await p.fill('#q-phone', '0412 345 678'); await p.fill('#q-suburb', 'Clayton'); await p.selectOption('#q-service', 'leaks-taps');
      await p.click('#quote-form button[type=submit]'); await p.waitForTimeout(700);
      const st = await p.evaluate(() => ({ done: !document.querySelector('#quote-done').hidden, err: document.querySelector('#e-photo').textContent }));
      ok(`quote endpoint (${ep}): ${expect === 'ok' ? 'POSTs the request and then shows the confirmation' : 'a failed POST shows a friendly "please call" message and no confirmation'}`, formHits.length === before + 1 && (expect === 'ok' ? st.done : !st.done && /call 03 5550 0142/.test(st.err)), JSON.stringify(st));
      await done(p);
    }
    ts.close(); fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/* ---------------------------------------------------------------- JavaScript off / no-JS fallbacks */
if (want('fallback')) {
  const p = await newPage({ ...DESKTOP, javaScriptEnabled: false });
  await open(p);
  const r = await p.evaluate(() => { const vis = (s) => [...document.querySelectorAll(s)].every((e) => getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).opacity !== '0'); return { h1: document.querySelector('h1').textContent.trim(), cards: document.querySelectorAll('.svc-card').length, cardsVis: vis('.svc-card'), reveal: vis('.reveal:not(.area-form-js)'), jobs: [...document.querySelectorAll('.job-panel')].map((e) => getComputedStyle(e).display), tabs: getComputedStyle(document.querySelector('.tabs')).display, range: getComputedStyle(document.querySelector('.ba-range')).display, pill: document.querySelector('#avail').textContent.trim(), area: getComputedStyle(document.querySelector('.checker')).display, noscriptArea: document.querySelector('#areas noscript').textContent, form: document.querySelector('#quote-form noscript').textContent, faq: document.querySelectorAll('details.faq').length, fill: getComputedStyle(document.querySelector('.gauge-fill')).transform, pipe: getComputedStyle(document.body, '::before').width, pipeBg: getComputedStyle(document.body, '::before').backgroundColor, svgPipe: !!document.querySelector('.pipe'), status: document.querySelector('.site-footer [data-open-status]').textContent.trim(), nav: getComputedStyle(document.querySelector('.header-nav')).display, toggle: getComputedStyle(document.querySelector('.nav-toggle')).display, cookie: getComputedStyle(document.querySelector('#cookie')).display, ann: document.querySelector('#announce').getBoundingClientRect().height }; });
  ok('no JS: headline, six service cards, pricing and reviews are all readable (nothing hidden by animation)', r.h1.startsWith('Plumbers who turn up') && r.cards === 6 && r.cardsVis && r.reveal);
  ok('no JS: all three recent jobs show (tabs hidden), slider handle hidden', r.jobs.every((d) => d === 'block') && r.tabs === 'none' && r.range === 'none', JSON.stringify([r.jobs, r.tabs, r.range]));
  ok('no JS: availability falls back to plain "Emergency line open 24/7"; footer status text is plain', r.pill === 'Emergency line open 24/7' && /24\/7/.test(r.status), r.pill);
  ok('no JS: the suburb checker is replaced by a plain list and the phone number; the quote form shows a "needs JavaScript, call us" note', r.area === 'none' && /30 to 60 minutes/.test(r.noscriptArea) && /needs JavaScript/.test(r.form), JSON.stringify([r.area, r.form]));
  ok('no JS: the pipe is a static, fully drawn copper line and the gauge is full', r.pipe === '4px' && r.pipeBg === 'rgb(196, 122, 61)' && !r.svgPipe && (r.fill === 'none' || /matrix\(1,/.test(r.fill)), JSON.stringify([r.pipe, r.pipeBg, r.fill]));
  ok('no JS: desktop navigation links still work; cookie bar and menu button hidden', r.nav !== 'none' && r.toggle === 'none' && r.cookie === 'none');
  await done(p);
  const m = await newPage({ ...MOBILE, javaScriptEnabled: false });
  await open(m);
  const mr = await m.evaluate(() => ({ nav: getComputedStyle(document.querySelector('.header-nav')).display, toggle: getComputedStyle(document.querySelector('.nav-toggle')).display, sw: document.documentElement.scrollWidth, sticky: getComputedStyle(document.querySelector('.sticky-bar')).display }));
  ok('no JS on a phone: a plain scrolling nav row replaces the menu button, the call bar still shows, no horizontal overflow', mr.nav === 'flex' && mr.toggle === 'none' && mr.sw <= 390 && mr.sticky !== 'none', JSON.stringify(mr));
  await done(m);
  // 404 page: works when served from a nested missing URL (the inline <base> trick)
  const s404 = await serve(SITE, { prefix: '/plumber-demo/' }); const b404 = `http://localhost:${s404.address().port}/plumber-demo/`;
  const q = await newPage(DESKTOP, { host: b404 });
  const failed = [];
  // the browser's preload scanner may fetch the stylesheet from the wrong folder once before the inline <base> applies; those speculative 404s are ignored
  q.on('requestfailed', (r) => { if (!/nope\/deep/.test(r.url())) failed.push(r.url()); }); q.on('response', (r) => { if (r.status() >= 400 && !/nope\/deep/.test(r.url())) failed.push(r.status() + ' ' + r.url()); });
  await q.goto(b404 + 'nope/deep/page'); await settle(q);
  const n = await q.evaluate(() => ({ h1: document.querySelector('h1').textContent, font: getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0], base: document.querySelector('base')?.href, img: document.querySelector('.brand-mark').getBoundingClientRect().width, noindex: document.querySelector('meta[name=robots]')?.content, call: document.querySelector('.notfound-actions a').getAttribute('href') }));
  ok('404.html: themed page works from a nested missing URL (inline <base>), styled, noindex, with call and home buttons', /gone down the drain/.test(n.h1) && /Barlow/.test(n.font) && /plumber-demo\/$/.test(n.base) && n.img > 30 && n.noindex === 'noindex' && n.call === 'tel:' + PHONE_HREF && !failed.length, JSON.stringify([n, failed.slice(0, 3)]));
  await done(q); s404.close();
}

/* ---------------------------------------------------------------- weight, structured data, SEO + asset checks */
if (want('perf')) {
  const p = await newPage(DESKTOP);
  const sizes = {}, hosts = new Set();
  p.on('response', async (r) => { try { const b = await r.body(); sizes[r.url().replace(base, '')] = b.length; } catch (e) { /* ignore */ } });
  p.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) hosts.add(new URL(r.url()).host); });
  await open(p);
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1500);
  const total = Object.entries(sizes).reduce((n, [, v]) => n + v, 0);
  ok(`home page weight is under 450 KB without the map (${(total / 1024).toFixed(0)} KB)`, total < 450 * 1024);
  ok('the only third-party host contacted is maps.google.com (the lazy map, stubbed in tests)', [...hosts].every((h) => h === 'maps.google.com'), [...hosts].join(','));
  const heavy = Object.entries(sizes).filter(([k, v]) => /\.js$/.test(k) && v > 30 * 1024).map(([k]) => k);
  ok('no heavy libraries: every script is under 30 KB (Lenis 13 KB is the largest)', !heavy.length && Object.keys(sizes).filter((k) => /\.js$/.test(k)).length >= 8, heavy.join(','));
  ok('fonts: self-hosted woff2 only (Barlow Condensed 700 + Inter)', Object.keys(sizes).filter((k) => k.startsWith('fonts/')).every((k) => k.endsWith('.woff2')) && fs.existsSync(path.join(SITE, 'fonts/inter-latin.woff2')) && fs.existsSync(path.join(SITE, 'fonts/barlow-condensed-700.woff2')));
  const ld = await p.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)['@type']));
  ok('home has Plumber and FAQPage structured data', ld.includes('Plumber') && ld.includes('FAQPage'), JSON.stringify(ld));
  const bad = [];
  for (const f of PAGES) {
    await open(p, f);
    const r = await p.evaluate(() => ({
      imgNoSize: [...document.querySelectorAll('img,iframe')].filter((e) => !e.getAttribute('width') || !e.getAttribute('height')).length,
      iframeEager: [...document.querySelectorAll('iframe')].filter((e) => e.loading !== 'lazy').length,
      iframeTitle: [...document.querySelectorAll('iframe')].filter((e) => !e.title).length,
      sync: [...document.querySelectorAll('script[src]')].filter((s) => !s.defer && s.type !== 'module').length,
      h1: document.querySelectorAll('h1').length,
      skip: !!document.querySelector('a.skip-link[href="#main"]') && !!document.querySelector('main#main'),
      lang: document.documentElement.lang, canonical: !!document.querySelector('link[rel=canonical]'),
      preload: !!document.querySelector('link[rel=preload][as=font][href*="barlow-condensed-700"]'),
      manifest: !!document.querySelector('link[rel=manifest]'), icons: document.querySelectorAll('link[rel~=icon],link[rel=apple-touch-icon]').length,
      og: ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].every((k) => document.querySelector(`meta[property="${k}"]`)), tw: ['twitter:card', 'twitter:title', 'twitter:image'].every((k) => document.querySelector(`meta[name="${k}"]`)),
      desc: (document.querySelector('meta[name=description]')?.content || '').length, theme: document.querySelector('meta[name=theme-color]')?.content,
      viewport: !!document.querySelector('meta[name=viewport]'),
    }));
    if (r.imgNoSize || r.iframeEager || r.iframeTitle || r.sync || r.h1 !== 1 || !r.skip || r.lang !== 'en-AU' || !r.canonical || !r.preload || !r.manifest || r.icons < 3 || !r.og || !r.tw || r.desc < 50 || r.theme !== '#0b2545') bad.push(f + ' ' + JSON.stringify(r));
  }
  ok('every page: one h1, skip link, width+height on images/iframes, titled lazy iframe, deferred scripts, canonical, font preload, manifest, icons, OG + Twitter tags, description, theme colour', !bad.length, bad.slice(0, 2).join(' | '));
  const map = await p.evaluate(() => null); await open(p);
  const mp = await p.evaluate(() => { const i = document.querySelector('iframe'); return { src: i.src, count: document.querySelectorAll('iframe').length, link: document.querySelector('.map-link a').href, target: document.querySelector('.map-link a').target }; });
  ok('map: lazy Google Maps embed with no API key, plus an "Open in Google Maps" link', mp.count === 1 && /^https:\/\/maps\.google\.com\/maps\?q=.+&output=embed$/.test(mp.src) && !/key=/.test(mp.src) && /google\.com\/maps/.test(mp.link) && mp.target === '_blank');
  const png = (f) => { const b = fs.readFileSync(path.join(SITE, f)); return b.slice(1, 4).toString() === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; };
  const og = png('img/og.png');
  ok('og.png is a 1200x630 PNG (a screenshot of the real hero)', og && og[0] === 1200 && og[1] === 630 && fs.statSync(path.join(SITE, 'img/og.png')).size > 40000);
  ok('icons: icon.svg + favicon.ico + apple-touch 180 + 192 + 512 + maskable 512', fs.existsSync(path.join(SITE, 'img/icon.svg')) && fs.readFileSync(path.join(SITE, 'favicon.ico')).readUInt16LE(2) === 1 && png('img/apple-touch-icon.png')[0] === 180 && png('img/icon-192.png')[0] === 192 && png('img/icon-512.png')[0] === 512 && png('img/icon-maskable-512.png')[0] === 512 && fs.statSync(path.join(SITE, 'img/apple-touch-icon.png')).size > 1500);
  const mf = JSON.parse(rd('site.webmanifest'));
  ok('site.webmanifest is generated with theme #0b2545 and a maskable icon', mf.theme_color === '#0b2545' && mf.background_color === '#0b2545' && mf.icons.some((i) => i.purpose === 'maskable') && mf.lang === 'en-AU');
  ok('site.config baseUrl, time zone and noindex are set for the demo', cfg.site.baseUrl === 'https://kirithikbala21-jpg.github.io/3D-demo-sites/plumber-demo/' && cfg.site.timezone === 'Australia/Melbourne' && cfg.site.noindex === true);
  ok('no preloader, intro or 3D code: none in the folder', !/preloader|three\.module/.test(rd('index.html')) && !fs.existsSync(path.join(SITE, 'scene.js')));
  const gen = execFileSync('python3', [path.join(SITE, 'tools/build.py')], { env: { ...process.env } }).toString();
  const same = PAGES.every((f) => fs.existsSync(path.join(SITE, f)));
  ok('python3 tools/build.py runs clean (standard library only) and every page exists', /wrote index\.html/.test(gen) && same && !/import (requests|jinja2|yaml)/.test(rd('tools/build.py')));
  await done(p);
}

await browser.close(); server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? '. FAILED: ' + failed.map((f) => f.name).join('; ') : ''}`);
process.exit(failed.length ? 1 : 0);
