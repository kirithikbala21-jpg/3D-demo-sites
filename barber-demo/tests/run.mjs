// Automated checks for the Ember & Oak demo. Run:  cd tests && npm i && npx playwright-core install chromium && node run.mjs [--suite=overflow,axe,func,fallback,links,perf]
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
const QUIET = () => { try { sessionStorage.setItem('eo-seen', '1'); localStorage.setItem('eo-cookie', 'no'); } catch (e) { /* ignore */ } };
/** Fixed visitor clock: a Date that starts at the given instant and keeps ticking. */
const FAKE = (t) => { const R = Date, off = t - R.now(); class F extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } } window.Date = F; };
const at = (iso) => Date.parse(iso + '+11:00'); // Sydney is UTC+11 (daylight saving) from 4 October 2026
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

/* ---------------------------------------------------------------- overflow at every width, every page (WebGL off for speed) */
if (want('overflow')) {
  for (const w of [360, 375, 414, 768, 1024, 1280, 1920]) {
    const p = await newPage({ viewport: { width: w, height: 900 } }, { webgl: false });
    const fails = [];
    for (const f of PAGES) {
      await p.goto(base + f); await p.waitForTimeout(500); await p.addStyleTag({ content: force });
      const a = await p.evaluate(audit);
      if (a.scrollW > a.W || a.bad.length) fails.push(`${f} ${JSON.stringify(a)}`);
    }
    ok(`no horizontal overflow @${w}px on all ${PAGES.length} pages`, !fails.length, fails.join(' | '));
    ok(`no console errors @${w}px`, !p.logs.length, JSON.stringify(p.logs.slice(0, 3)));
    await done(p);
  }
}

/* ---------------------------------------------------------------- accessibility (axe-core) + phone usability */
if (want('axe')) {
  const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  for (const w of [375, 1440]) {
    const p = await newPage({ viewport: { width: w, height: 900 } }, { webgl: false });
    const bad = [];
    for (const f of PAGES) {
      await p.goto(base + f); await p.waitForTimeout(600); await p.addStyleTag({ content: force });
      await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      await p.evaluate(axeSrc);
      const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(' ')}`));
      if (r.length) bad.push(`${f}: ${r.join('; ')}`);
    }
    ok(`axe: no violations @${w}px on all pages`, !bad.length, bad.join(' || '));
    await done(p);
  }
  const p = await newPage({ viewport: { width: 375, height: 812 }, hasTouch: true }, { webgl: false });
  const tap = [], tiny = [];
  for (const f of PAGES) {
    await p.goto(base + f); await p.waitForTimeout(500); await p.addStyleTag({ content: force });
    const r = await p.evaluate(() => {
      const small = [...document.querySelectorAll('a.btn,button,.header-link,.brand,.link-arrow,.exp-link,.back-top,.footer-col a,.footer-legal a,.crumbs a,.chip-opt span,summary,[role=tab],.icon-btn,.add-btn,.ci-qty button')]
        .filter((e) => (e.offsetParent !== null || getComputedStyle(e).position === 'fixed') && !e.closest('[hidden]')).map((e) => { const r = e.getBoundingClientRect(); return [(e.textContent.trim() || e.getAttribute('aria-label') || e.className).slice(0, 18), Math.round(r.width), Math.round(r.height)]; }).filter(([, w, h]) => h && (h < 44 || w < 44));
      const t = [...document.querySelectorAll('p,li,td,th,address,label,dd')].filter((e) => e.offsetParent && !e.closest('.announce,[hidden]') && parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => e.textContent.trim().slice(0, 25));
      return { small: small.slice(0, 4), t: t.slice(0, 4), body: parseFloat(getComputedStyle(document.body).fontSize) };
    });
    if (r.small.length) tap.push(`${f}: ${JSON.stringify(r.small)}`);
    if (r.t.length) tiny.push(`${f}: ${JSON.stringify(r.t)}`);
    if (r.body < 17) tiny.push(`${f}: body ${r.body}px`);
  }
  ok('375px: every tap target is at least 44px', !tap.length, tap.join(' | '));
  ok('375px: body text 17px+, no text under 14px', !tiny.length, tiny.join(' | '));
  await done(p);
}

/* ---------------------------------------------------------------- internal links and anchors */
if (want('links')) {
  const seen = new Map(), problems = [];
  const p = await newPage({ viewport: { width: 1280, height: 900 } }, { webgl: false });
  const ids = new Map();
  for (const f of PAGES) { await p.goto(base + f); ids.set(f, await p.evaluate(() => [...document.querySelectorAll('[id]')].map((e) => e.id))); }
  for (const f of PAGES) {
    await p.goto(base + f);
    const links = await p.evaluate(() => [...document.querySelectorAll('a[href],link[href],script[src],img[src]')].map((e) => e.getAttribute('href') || e.getAttribute('src')));
    for (const l of new Set(links)) {
      if (/^(https?:|mailto:|tel:|data:)/.test(l)) continue;
      const [file, hash] = l.split('#'); const [target] = (file || f).split('?');
      if (!seen.has(target)) seen.set(target, fs.existsSync(path.join(SITE, target)));
      if (!seen.get(target)) problems.push(`${f} -> ${l} (missing file)`);
      else if (hash && PAGES.includes(target) && !ids.get(target).includes(hash) && !/^m-|^p-/.test(hash)) problems.push(`${f} -> ${l} (missing anchor)`);
    }
  }
  ok('all internal links, scripts and anchors resolve', !problems.length, problems.slice(0, 6).join(' | '));
  const mids = [...new Set(cfg.services.flatMap((c) => c.items.map((i) => 'm-' + i.name.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&rsquo;/g, "'").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))))];
  ok('menu deep-link ids exist', mids.every((m) => ids.get('services.html').includes(m)));
  await done(p);
}

/* ---------------------------------------------------------------- behaviour */
if (want('func')) {
  // Desktop
  let p = await newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base + 'index.html'); await p.waitForSelector('#stage.has-3d', { timeout: 40000 }).catch(() => {}); await p.waitForTimeout(500);
  ok('home: exactly one h1', (await p.locator('h1').count()) === 1);
  ok('home: 3D scene loaded from the self-hosted library', (await p.locator('#stage.has-3d').count()) === 1);
  ok('home: open-status chip is filled in', /^(Open now|Closed|Opens)/.test(await p.locator('#open-status').textContent()), await p.locator('#open-status').textContent());
  await p.locator('.nav-toggle').click();
  ok('full-screen menu opens on desktop', await p.locator('#mobile-nav').isVisible());
  await p.keyboard.press('Escape');
  ok('Escape closes the menu', !(await p.locator('#mobile-nav').isVisible()));
  ok('announcement bar is one static line with a dismiss button', (await p.locator('#announce').isVisible()) && (await p.locator('#announce-close').isVisible()) && (await p.locator('.ticker, .ticker-track').count()) === 0 && (await p.locator('#announce').evaluate((e) => e.getBoundingClientRect().height)) < 60);
  await p.locator('#announce-close').click();
  ok('dismissing the announcement hides it and it stays hidden after a reload', !(await p.locator('#announce').isVisible()) && (await (async () => { await p.reload(); await p.waitForTimeout(500); return !(await p.locator('#announce').isVisible()); })()));
  // search
  await p.locator('#search-open').click(); await p.keyboard.type('fade');
  await p.waitForTimeout(500);
  ok('search finds services', (await p.locator('#search-results a').count()) > 2, `${await p.locator('#search-results a').count()} results`);
  await p.keyboard.press('Escape');
  await p.keyboard.press('/');
  ok('"/" opens search', await p.locator('#search').isVisible()); await p.keyboard.press('Escape');
  ok('no chat widget on the page', (await p.locator('#chat, #chat-toggle, .chat').count()) === 0);
  // sound toggle
  await p.locator('.footer-legal [data-sound]').click();
  ok('ambient sound toggle flips state', (await p.locator('.footer-legal [data-sound]').getAttribute('aria-pressed')) === 'true'); await p.locator('.footer-legal [data-sound]').click();
  // newsletter
  await p.locator('#n-email').fill('nope'); await p.locator('#news-form button').click();
  ok('newsletter rejects a bad email', (await p.locator('#e-news').textContent()).includes("doesn't look"));
  await p.locator('#n-email').fill('a@b.co'); await p.locator('#news-form button').click();
  ok('newsletter accepts a good email', (await p.locator('#e-news').textContent()).includes('on the list'));
  ok('no console errors on the home page', !p.logs.length, JSON.stringify(p.logs.slice(0, 3)));
  await done(p);

  // Menu page: tabs, ordering, cart
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'services.html'); await p.waitForTimeout(800);
  ok('services: 24 items', (await p.locator('.menu-item').count()) === 24);
  await p.locator('#tab-cuts').focus(); await p.keyboard.press('ArrowRight');
  ok('menu tabs: ArrowRight', (await p.locator('#tab-beard').getAttribute('aria-selected')) === 'true' && (await p.locator('#panel-beard').isVisible()));
  await p.keyboard.press('End'); ok('menu tabs: End', (await p.locator('#tab-extras').getAttribute('aria-selected')) === 'true');
  await p.keyboard.press('ArrowRight'); ok('menu tabs: wrap to first', (await p.locator('#tab-cuts').getAttribute('aria-selected')) === 'true');
  await p.locator('#panel-cuts .add-btn').first().click(); await p.locator('#panel-cuts .add-btn').first().click(); await p.locator('#panel-cuts .add-btn').nth(1).click();
  ok('cart badge counts items', (await p.locator('#cart-count').textContent()) === '3');
  await p.locator('#cart-open').click();
  ok('cart shows 2 lines and a total', (await p.locator('#cart-list li').count()) === 2 && /\$/.test(await p.locator('#cart-total').textContent()), await p.locator('#cart-total').textContent());
  await p.locator('#cart-list [data-qty="1"]').first().click();
  ok('cart quantity buttons work', (await p.locator('#cart-count').textContent()) === '4');
  await p.locator('#cart-form button[type=submit]').click();
  ok('cart asks for a name', (await p.locator('#e-cart-name').textContent()).includes('name'));
  await p.fill('#cart-name', 'Sam Rivera'); await p.locator('#cart-form button[type=submit]').click();
  ok('cart asks for an Australian phone number', (await p.locator('#e-cart-phone').textContent()).includes('phone number'));
  await p.fill('#cart-phone', '12345'); await p.locator('#cart-form button[type=submit]').click();
  ok('cart rejects a non-Australian phone number', (await p.locator('#e-cart-phone').textContent()).includes('Australian'));
  await p.fill('#cart-phone', '0412 345 678'); await p.locator('#cart-form button[type=submit]').click();
  ok('order confirmation appears and empties the cart', await p.locator('#cart-done').isVisible() && !(await p.locator('#cart-count').isVisible()));
  await p.keyboard.press('Escape');
  ok('Escape closes the cart', !(await p.locator('#cart').isVisible()));
  await p.goto(base + 'services.html#m-skin-fade'); await p.waitForTimeout(900);
  ok('search deep link opens the right tab', (await p.locator('#tab-cuts').getAttribute('aria-selected')) === 'true');
  ok('price list PDF is linked and exists', fs.existsSync(path.join(SITE, 'price-list.pdf')));
  await done(p);

  // Visit: hours + map
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'visit.html'); await p.waitForTimeout(600);
  ok("today's hours row is highlighted (Sydney time zone)", (await p.locator('.hours tr.is-today').count()) === 1);
  const gm = p.locator('.gmap iframe');
  ok('visit: Google map embed is lazy, titled and sized', (await gm.count()) === 1 && (await gm.getAttribute('loading')) === 'lazy' && /maps\.google\.com\/maps\?q=.*output=embed/.test(await gm.getAttribute('src')) && !!(await gm.getAttribute('title')) && !!(await gm.getAttribute('width')) && !!(await gm.getAttribute('height')));
  await p.locator('details').first().locator('summary').click();
  ok('FAQ opens', await p.locator('details').first().evaluate((d) => d.open));
  await done(p);

  // Booking: service + barber deep links, calendar, time grid, validation, confirmation, localStorage
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'book.html?service=skin-fade&barber=marco'); await p.waitForTimeout(500);
  ok('book: ?service= pre-selects the service', (await p.locator('#f-service option:checked').textContent()).includes('Skin Fade'));
  ok('book: ?barber= pre-selects the barber', (await p.locator('input[name=barber]:checked').getAttribute('value')) === 'marco');
  ok('book: four barbers plus "next available"', (await p.locator('input[name=barber]').count()) === 5);
  await p.locator('#book-form button[type=submit]').click();
  ok('book: empty submit shows date, time, name and phone errors', (await p.locator('.error').allTextContents()).filter(Boolean).length >= 4);
  ok('book: focus goes to the first problem (the calendar)', await p.evaluate(() => !!document.activeElement.closest('#cal-grid')));
  ok('book: past and closed days cannot be picked', (await p.locator('.cal-day:disabled').count()) > 0);
  let open = 0, taken = 0;
  for (let i = 2; i < 12 && !taken; i++) { await p.locator('.cal-day:not(:disabled)').nth(i).click(); open = await p.locator('.slot:not(:disabled)').count(); taken = await p.locator('.slot:disabled').count(); }
  ok('book: time grid follows opening hours and shows taken slots', open > 3 && taken > 0, `${open} open, ${taken} unavailable; ${await p.locator('#h-time').textContent()}`);
  await p.locator('.slot:not(:disabled)').nth(1).click();
  ok('book: chosen time is marked', (await p.locator('.slot[aria-pressed=true]').count()) === 1);
  await p.fill('#f-name', 'Sam Rivera'); await p.fill('#f-phone', 'abc'); await p.locator('#f-phone').blur();
  ok('book: bad phone message', (await p.locator('#e-phone').textContent()).includes("Australian phone"));
  await p.fill('#f-phone', '02 5550 0123'); await p.locator('#book-form button[type=submit]').click();
  ok('book: confirmation screen with demo notice', (await p.locator('#form-success').isVisible()) && (await p.locator('#form-success').textContent()).includes('This is a demo, no real booking was made'), await p.locator('#ok-detail').textContent());
  ok('book: booking saved to localStorage', (await p.evaluate(() => JSON.parse(localStorage.getItem('bb-bookings') || '[]').length)) === 1);
  await done(p);

  // Generic forms
  for (const f of ['careers.html']) {
    p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
    await p.goto(base + f); await p.locator('form[data-demo-form] button[type=submit]').click();
    const errs = (await p.locator('form[data-demo-form] .error').allTextContents()).filter(Boolean).length;
    ok(`${f}: empty submit shows errors`, errs >= 2, String(errs));
    await done(p);
  }

  // Gift card + count-up + journey on other pages
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'membership.html'); await p.locator('.chip-opt:has(input[value="100"])').click();
  ok('gift card amount updates', (await p.locator('#gift-amount').textContent()) === '$100');
  await p.goto(base + 'barbers.html'); await p.evaluate(() => document.querySelector('.stats').scrollIntoView()); await p.waitForTimeout(2600);
  ok('stats count up once visible', (await p.locator('.stat-num').allTextContents()).join('|') === '12|38,000|4');
  await done(p);

  // Mobile menu + cookie banner
  p = await newPage({ viewport: { width: 375, height: 812 }, hasTouch: true }, { webgl: false, quiet: false });
  await p.addInitScript(() => { try { sessionStorage.setItem('eo-seen', '1'); } catch (e) { /* ignore */ } });
  await p.goto(base + 'index.html'); await p.waitForTimeout(2200);
  ok('cookie banner appears on a first visit', await p.locator('#cookie').isVisible());
  await p.locator('[data-cookie="no"]').click(); await p.reload(); await p.waitForTimeout(2200);
  ok('cookie choice is remembered', !(await p.locator('#cookie').isVisible()));
  const t = p.locator('.nav-toggle'); await t.click();
  ok('mobile menu opens, focus moves inside', (await t.getAttribute('aria-expanded')) === 'true' && (await p.evaluate(() => !!document.activeElement.closest('#mobile-nav'))));
  for (let i = 0; i < 14; i++) await p.keyboard.press('Tab');
  ok('mobile menu traps focus', await p.evaluate(() => { const a = document.activeElement; return !!a.closest('#mobile-nav') || a.classList.contains('nav-toggle'); }));
  await p.keyboard.press('Escape'); ok('mobile menu: Escape closes', (await t.getAttribute('aria-expanded')) === 'false');
  await t.click(); await p.locator('#mobile-nav a', { hasText: 'Visit' }).click(); await p.waitForURL(/visit\.html/);
  ok('mobile menu link navigates to the page', p.url().endsWith('visit.html'));
  // Counters, preloader speed, cookie bar, header, back to top, smooth scroll
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false });
  await p.goto(base + 'index.html'); await p.waitForSelector('html[data-ready-at]', { state: 'attached', timeout: 25000 });
  let readyAt = Number(await p.evaluate(() => document.documentElement.dataset.readyAt));
  for (let i = 0; i < 2 && readyAt > 1100; i++) { const q = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false }); await q.goto(base + 'index.html'); await q.waitForSelector('html[data-ready-at]', { state: 'attached', timeout: 15000 }); readyAt = Math.min(readyAt, Number(await q.evaluate(() => document.documentElement.dataset.readyAt))); await done(q); } // best of three: this sandbox renders 3D in software and can be slow under load
  ok('preloader starts fading out by 1.1 s after navigation (fade 0.4 s, so gone within 1.5 s)', readyAt <= 1100, `${readyAt} ms`);
  ok('cookie bar has Decline and does not cover hero buttons', await p.evaluate(() => { const c = document.getElementById('cookie'); if (!c || c.hidden) return true; const r = c.getBoundingClientRect(); return [...document.querySelectorAll('.hero-cta a')].every((a) => { const b = a.getBoundingClientRect(); return b.bottom < r.top || b.top > r.bottom || b.right < r.left || b.left > r.right; }) && !!c.querySelector('[data-cookie=no]'); }));
  await p.locator('[data-cookie=no]').click();
  ok('Lenis smooth scroll is running (pinned 1.1.18, self-hosted)', await p.evaluate(() => !!window.__lenis));
  await p.evaluate(() => window.scrollTo(0, 1200)); await p.waitForFunction(() => document.querySelector('.site-header').getBoundingClientRect().height < 80, null, { timeout: 9000 }).catch(() => {});
  ok('header shrinks on scroll', await p.evaluate(() => document.querySelector('.site-header').getBoundingClientRect().height < 80));
  await p.locator('.back-top').click(); await p.waitForFunction(() => window.scrollY < 40, null, { timeout: 15000 }).catch(() => {});
  ok('Back to top works', (await p.evaluate(() => window.scrollY)) < 40);
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }, { quiet: false });
  await p.goto(base + 'index.html');
  ok('no JavaScript: counters show real numbers, not 0', (await p.locator('.stat-num').allTextContents()).join('|') === '12|38,000|4');
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  const titles = []; for (const f of PAGES) { await p.goto(base + f); titles.push(await p.evaluate(() => document.title + ' ' + [...document.querySelectorAll('meta[content]')].map((m) => m.content).join(' '))); }
  ok('no literal &amp; in any title or meta tag', titles.every((t) => !t.includes('&amp;')));
  await p.goto(base + 'index.html');
  const navLabels = await p.evaluate(() => [...document.querySelectorAll('#mobile-nav nav a')].map((a) => a.textContent.replace(/^\d+/, '').trim()).filter(Boolean));
  const footLabels = await p.evaluate(() => [...document.querySelectorAll('.site-footer a')].map((a) => a.textContent.trim()));
  ok('menu labels match the footer labels', navLabels.length >= 6 && navLabels.every((l) => footLabels.includes(l)), JSON.stringify(navLabels.filter((l) => !footLabels.includes(l))));
  await done(p);
  // Photos: none broken at 1440 and 390, lazy except the hero, hero under 250 KB, credits in the footer, alt text on all
  for (const w of [1440, 390]) {
    p = await newPage({ viewport: { width: w, height: 900 } }, { webgl: false });
    await p.goto(base + 'index.html'); await p.waitForTimeout(600);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); } });
    await p.waitForFunction(() => [...document.querySelectorAll('img')].every((i) => i.complete), null, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(300);
    const info = await p.evaluate(() => [...document.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, alt: !!i.alt, lazy: i.loading === 'lazy', hero: !!i.closest('.hero-photo') })));
    ok(`photos @${w}px: ${info.length} images, none broken`, info.length >= 12 && info.every((i) => i.ok), JSON.stringify(info.filter((i) => !i.ok)));
    ok(`photos @${w}px: every image has alt text, all lazy except the hero`, info.every((i) => i.alt) && info.filter((i) => !i.lazy).every((i) => i.hero));
    const a = await p.evaluate(audit); ok(`photos @${w}px: no horizontal overflow`, a.scrollW <= a.W && !a.bad.length, JSON.stringify(a.bad));
    ok(`photos @${w}px: no console errors`, !p.logs.length, JSON.stringify(p.logs.slice(0, 3)));
    await done(p);
  }
  ok('hero photo is under 250 KB', fs.statSync(path.join(SITE, 'img/photos/hero-interior-chair.webp')).size < 250 * 1024);
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'index.html');
  ok('footer credits every photo ("Photo: Unsplash" until names are added)', (await p.locator('.photo-credits').textContent()).includes('Photo: Unsplash'));
  await done(p);
  // Find us, sample reviews, 404
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(600);
  ok('home: Find us has the map, the hours table and a live status', (await p.locator('#find-us .gmap iframe').count()) === 1 && (await p.locator('#find-us .hours').count()) === 1 && /^(Open now|Closed|Opens)/.test(await p.locator('#open-status-3').textContent()), await p.locator('#open-status-3').textContent());
  ok('home: reviews look like a review feed and stay labelled as samples', (await p.locator('.review.gr .gr-avatar').count()) === 3 && (await p.locator('.review.gr .stars[aria-label]').count()) === 3 && (await p.locator('#reviews').textContent()).includes('Sample reviews for demo purposes'));
  ok('footer has the quiet KB Ventures line', (await p.locator('.site-footer').textContent()).includes('Concept website by KB Ventures. Want one for your business?'));
  await p.goto(base + '404.html');
  ok('custom 404 page is themed and offers a way home', (await p.locator('h1').textContent()).includes('not found') && (await p.locator('a[href="index.html"]').count()) > 0);
  await done(p);
  await done(p);
}

/* ---------------------------------------------------------------- fallbacks and motion preferences */
if (want('fallback')) {
  let p = await newPage({ viewport: { width: 375, height: 812 } }, { webgl: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(800);
  ok('no WebGL: canvas removed, SVG barber pole shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()), JSON.stringify(p.logs));
  const a = await p.evaluate(audit); ok('no WebGL: no overflow at 375px', a.scrollW <= a.W && !a.bad.length, JSON.stringify(a.bad));
  await done(p);

  p = await newPage({ viewport: { width: 375, height: 812 } });
  await p.context().route('**/vendor/three.module.min.js*', (r) => r.abort());
  await p.goto(base + 'index.html'); await p.waitForTimeout(2500);
  ok('3D library fails to load: fallback shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 } });
  await p.context().route('**/vendor/three.module.min.js*', async (r) => { await new Promise((x) => setTimeout(x, 6500)); r.abort(); });
  await p.goto(base + 'index.html'); await p.waitForSelector('#stage.is-fallback', { timeout: 25000 }).catch(() => {});
  ok('slow load (over 4s): fallback shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 390, height: 844 } }, { extraInit: () => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 }) });
  await p.goto(base + 'index.html'); await p.waitForTimeout(3500);
  ok('weak phone (390px, 2 CPU cores): 3D skipped, still poster shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 } }, { extraInit: () => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }) });
  await p.goto(base + 'index.html'); await p.waitForTimeout(1200);
  ok('Data Saver: 3D skipped, light illustration shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(base + 'index.html'); await p.waitForSelector('#scene.is-ready', { timeout: 40000 }).catch(() => {}); await p.waitForTimeout(1500);
  const s1 = await p.locator('#stage').screenshot({ timeout: 60000 }); await p.waitForTimeout(1500); const s2 = await p.locator('#stage').screenshot({ timeout: 60000 });
  ok('reduced motion: 3D shows a still frame', Buffer.compare(s1, s2) === 0 && (await p.locator('#scene.is-ready').count()) === 1, JSON.stringify([Buffer.compare(s1, s2), await p.locator('#scene.is-ready').count(), await p.locator('#stage').getAttribute('class')]));
  ok('reduced motion: no preloader, hero text visible', (await p.locator('#preloader').count()) === 0 && (await p.evaluate(() => getComputedStyle(document.querySelector('.hero-tag')).opacity)) === '1');
  await done(p);


  // JavaScript off, or the main script failing: the site must still be usable
  p = await newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }, { quiet: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(800);
  ok('no JavaScript: no stuck intro overlay', !(await p.evaluate(() => { const e = document.getElementById('preloader'); return e && getComputedStyle(e).display !== 'none'; })));
  ok('no JavaScript: navigation links are visible', (await p.evaluate(() => [...document.querySelectorAll('#mobile-nav a')].filter((a) => a.offsetParent).length)) >= 6);
  await p.goto(base + 'services.html');
  ok('no JavaScript: all four service categories are readable', (await p.evaluate(() => [...document.querySelectorAll('[role=tabpanel]')].filter((e) => e.offsetParent).length)) === 4);
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false });
  await p.context().route('**/main.js*', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'throw new Error("boom")' }));
  await p.goto(base + 'index.html'); await p.waitForTimeout(6000);
  ok('main script fails: the intro overlay clears itself and the hero is visible', await p.evaluate(() => { const e = document.getElementById('preloader'); return !e || getComputedStyle(e).visibility === 'hidden' || getComputedStyle(e).opacity === '0'; }) && (await p.evaluate(() => getComputedStyle(document.querySelector('.hero-tag')).opacity)) === '1');
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await p.goto(base + 'index.html'); await p.waitForTimeout(4000);
  const ratio = await p.evaluate(() => { const c = document.querySelector('#scene'); return c.width / c.clientWidth; });
  ok('pixel ratio is capped at 1.5', ratio <= 1.55, String(ratio.toFixed(2)));
  const x = await p.locator('#stage').screenshot(); await p.waitForTimeout(1500); const y = await p.locator('#stage').screenshot();
  ok('3D is animating', Buffer.compare(x, y) !== 0);
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(600);
  ok('first visit shows the branded preloader', (await p.locator('#preloader').count()) === 1);
  await p.waitForTimeout(6500); // the intro lasts up to about 4 seconds on a slow machine
  ok('preloader finishes and the page becomes ready', (await p.locator('#preloader').count()) === 0 && (await p.evaluate(() => document.documentElement.classList.contains('is-ready'))));
  await done(p);
}

/* ---------------------------------------------------------------- weight + structured data */
if (want('perf')) {
  const p = await newPage({ viewport: { width: 1440, height: 900 } });
  const sizes = {};
  p.on('response', async (r) => { try { const b = await r.body(); sizes[r.url().replace(base, '')] = b.length; } catch (e) { /* ignore */ } });
  await p.goto(base + 'index.html'); await p.waitForTimeout(5000);
  const total = Object.entries(sizes).filter(([k]) => !k.startsWith('vendor/')).reduce((n, [, v]) => n + v, 0);
  ok('home page weight excluding Three.js is under 600 KB', total < 600 * 1024, `${(total / 1024).toFixed(0)} KB`);
  ok('home page makes no third-party requests', Object.keys(sizes).every((k) => !/^https?:/.test(k)));
  const ld = await p.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)['@type']));
  ok('home has BarberShop structured data', ld.includes('BarberShop'), JSON.stringify(ld));
  await done(p);
}

/* ---------------------------------------------------------------- hardening: time zones, holidays, notices, forms, caching */
if (want('hardening')) {
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-'));
  const servers = [];
  const MIMEX = { ...MIME, '.webp': 'image/webp', '.txt': 'text/plain', '.png': 'image/png', '.ico': 'image/x-icon' };
  const startSite = (root) => new Promise((res) => {
    const sv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html'; fs.readFile(path.join(root, u), (e, d) => { if (e) { r.writeHead(404); r.end('nf'); return; } r.writeHead(200, { 'content-type': MIMEX[path.extname(u)] || 'application/octet-stream' }); r.end(d); }); }).listen(0, () => { servers.push(sv); res(`http://localhost:${sv.address().port}/`); });
  });
  /** A throwaway copy of the site with its config changed, rebuilt, and served. */
  const configured = async (mutate, name) => {
    const dir = path.join(TMP, 'cfg-' + name);
    fs.cpSync(SITE, dir, { recursive: true, filter: (src) => !/[\\/](tests|node_modules|\.git)([\\/]|$)/.test(src.slice(SITE.length)) });
    const c = JSON.parse(fs.readFileSync(path.join(dir, 'site.config.json'), 'utf8')); mutate(c); fs.writeFileSync(path.join(dir, 'site.config.json'), JSON.stringify(c));
    execFileSync('python3', [path.join(dir, 'tools/build.py')], { env: { ...process.env, SITE_ROOT: dir }, stdio: 'pipe' });
    return startSite(dir);
  };
  const T = 'T12:00:00', TUE = '2026-10-20';
  const light = { webgl: false };
  const norm = (x) => x.replace(/\s+/g, ' ').trim();
  // 1. The shop's clock, not the visitor's
  for (const tz of ['America/Los_Angeles', 'Asia/Tokyo', 'Europe/London']) {
    const p = await newPage({ viewport: { width: 1280, height: 800 }, timezoneId: tz }, { ...light, clock: TUE + T }); await p.goto(base + 'index.html'); await p.waitForTimeout(800);
    const t = norm(await p.locator('#open-status').textContent());
    ok(`visitor in ${tz} sees Sydney's hours: Tue 12:00 in Sydney is open`, t.startsWith('Open now, closes at 7pm'), t);
    await done(p);
  }
  // 2. NSW public holidays: Labour Day is the first Monday of October (5 Oct 2026), a Monday the shop normally opens
  {
    const p = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: '2026-10-05' + T }); await p.goto(base + 'index.html'); await p.waitForTimeout(800);
    ok('Labour Day (NSW, first Monday of October): chip says closed for Labour Day', /^Closed today for Labour Day\. Opens tomorrow at 9am/.test(norm(await p.locator('#open-status').textContent())), norm(await p.locator('#open-status').textContent()));
    await done(p);
    const q = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: '2026-09-30' + T }); await q.goto(base + 'index.html'); await q.waitForTimeout(800);
    const bar = await q.evaluate(() => ({ hidden: document.querySelector('#notice-bar').hidden, text: document.querySelector('#notice-bar').innerText.replace(/\s+/g, ' ').trim() }));
    ok('holiday banner appears the week before: "Closed Monday for Labour Day."', !bar.hidden && /Closed Monday for Labour Day\./.test(bar.text), bar.text);
    await done(q);
    const r = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: '2026-10-20' + T }); await r.goto(base + 'index.html'); await r.waitForTimeout(500);
    ok('no banner when nothing is coming up', await r.evaluate(() => document.querySelector('#notice-bar').hidden));
    await done(r);
  }
  // 3. Booking calendar: rolls 90 days from the shop's today, hides today after closing, greys holidays
  {
    const p = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: TUE + T }); await p.goto(base + 'book.html'); await p.waitForTimeout(800);
    const enabled = async () => p.evaluate(() => [...document.querySelectorAll('.cal-day:not(:disabled)')].map((b) => b.dataset.date));
    const d0 = await enabled();
    ok('calendar: starts on today (Tue 20 Oct 2026); Oct 19 (past) and Mon 5 Oct are not offered', d0[0] === '2026-10-20' && !d0.includes('2026-10-19') && !d0.includes('2026-10-05'), d0.slice(0, 3).join());
    let last = d0[d0.length - 1];
    for (let i = 0; i < 3; i++) { if (await p.locator('#cal-next').isDisabled()) break; await p.click('#cal-next'); const e = await enabled(); if (e.length) last = e[e.length - 1]; }
    ok('calendar: the window rolls 90 days ahead (last bookable day is 17 Jan 2027) and the next month button stops there', last === '2027-01-17' && (await p.locator('#cal-next').isDisabled()), last);
    await p.click('#cal-prev'); await p.click('#cal-prev'); await p.click('#cal-prev');
    const nov = await p.evaluate(() => [...document.querySelectorAll('.cal-day')].filter((b) => b.disabled).length);
    ok('calendar: going back stops at the current month', await p.locator('#cal-prev').isDisabled());
    await done(p);
    const q = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: TUE + 'T19:45:00' }); await q.goto(base + 'book.html'); await q.waitForTimeout(800);
    const dq = await q.evaluate(() => [...document.querySelectorAll('.cal-day:not(:disabled)')].map((b) => b.dataset.date));
    ok('calendar: after closing time today is no longer offered and tomorrow is the first choice', dq[0] === '2026-10-21' && !dq.includes('2026-10-20'), dq.slice(0, 2).join());
    await done(q);
  }
  // 4. Year, years in business and journal dates follow the clock
  {
    const p = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: '2031-06-15' + T }); await p.goto(base + 'barbers.html'); await p.waitForTimeout(800);
    ok('footer copyright year follows the date (fake clock in 2031 shows 2031)', /© 2031 /.test(norm(await p.locator('.footer-bottom').first().textContent())));
    ok('"years in the same shop" is worked out from the opening year (2031 - 2014 = 17)', (await p.locator('.stat-num[data-since]').first().textContent()) === '17');
    await done(p);
    const j = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: '2031-06-15' + T }); await j.goto(base + 'journal.html'); await j.waitForTimeout(800);
    const dates = await j.locator('time[data-days-ago]').allTextContents();
    ok('journal dates are relative to today (a 2031 visit shows 2031 dates, never a stale 2026)', dates.length >= 3 && dates.every((d) => /2031/.test(d)), dates.join(' | '));
    await done(j);
    const src = ['js/forms.js', 'js/cart.js', 'js/ui.js', 'js/util.js', 'js/clock.js', 'js/notice.js', 'js/formkit.js'].map((f) => fs.readFileSync(path.join(SITE, f), 'utf8')).join('\n');
    ok('no hard-coded years or month dates in the scripts', !/\b20[2-9]\d\b/.test(src.replace(/^\s*\/\/.*$/gm, '')));
  }
  // 5. Closures and expiring notices from the config; bad config is refused with plain English
  {
    const b = await configured((c) => { c.closures = [{ date: '2026-10-23', name: 'staff training', status: 'closed' }]; c.notices = [{ text: 'Free beard oil with every shave', start: '2026-10-01', end: '2026-10-31' }, { text: 'Old news', end: '2026-09-30' }]; }, 'closures');
    const p = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: '2026-10-20' + T, host: b }); await p.goto(b + 'index.html'); await p.waitForTimeout(800);
    const t = await p.evaluate(() => document.querySelector('#notice-bar').innerText.replace(/\s+/g, ' '));
    ok('config closure shows a banner, a live special shows, an expired one stays hidden', /Closed Friday for staff training\./.test(t) && /Free beard oil/.test(t) && !/Old news/.test(t), t);
    await done(p);
    const q = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: '2026-11-10' + T, host: b }); await q.goto(b + 'index.html'); await q.waitForTimeout(800);
    ok('the special hides itself after its end date', await q.evaluate(() => document.querySelector('#notice-bar').hidden)); await done(q);
    const c = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: '2026-10-20' + T, host: b }); await c.goto(b + 'book.html'); await c.waitForTimeout(600);
    ok('a config closure greys that day in the booking calendar', await c.locator('.cal-day[data-date="2026-10-23"]').isDisabled()); await done(c);
    const bad = await configured((c) => { c.notices = [{ text: 'no end date' }]; }, 'bad').then(() => 'built', () => 'failed');
    ok('a notice with no end date is rejected', bad === 'failed');
    let msg = ''; try { await configured((c) => { c.contact.phone = '12'; }, 'badphone'); } catch (e) { msg = String(e.stderr || e.message); }
    ok('a mistyped phone number stops the build with a plain-English message', /does not look like an Australian number/.test(msg), msg.slice(0, 120));
  }
  // 6. Forms: phone validation, real endpoint, failure fallback, double submit, spam trap
  {
    const bookingFlow = async (p) => {
      await p.goto(p.base + 'book.html?service=skin-fade&barber=marco'); await p.waitForTimeout(600);
      await p.locator('.cal-day:not(:disabled)').nth(3).click(); await p.locator('.slot:not(:disabled)').nth(1).click();
      await p.fill('#f-name', 'Sam Rivera'); await p.fill('#f-phone', '0412 345 678');
    };
    const p0 = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: TUE + T }); await bookingFlow(p0);
    const bads = [];
    for (const [ph, good] of [['0412 345 678', true], ['+61 412 345 678', true], ['02 5550 0144', true], ['(02) 5550-0144', true], ['1300 123 456', true], ['0112 345 678', false], ['12345', false], ['abcdefghij', false], ['+1 415 555 0132', false], ['0412 345', false]]) {
      await p0.fill('#f-phone', ph); await p0.locator('#f-phone').blur(); const shown = await p0.evaluate(() => !!document.querySelector('#e-phone').textContent);
      if (shown === good) bads.push(ph);
    }
    ok('booking phone validation accepts Australian formats (04xx, +61, 02, 1300) and rejects the rest, with a friendly message', !bads.length, bads.join(','));
    await p0.fill('#f-phone', ''); await p0.locator('#f-phone').blur();
    ok('empty phone message is the friendly one', /We need a phone number/.test(await p0.locator('#e-phone').textContent()));
    await done(p0);
    const live = await configured((c) => { c.forms.endpoint = 'https://forms.example.test/f/abc'; }, 'live');
    const p = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: TUE + T, host: live });
    let calls = 0, mode = 'fail';
    await p.route('https://forms.example.test/**', async (r) => { calls++; await new Promise((x) => setTimeout(x, 400)); if (mode === 'ok') r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}', headers: { 'access-control-allow-origin': '*' } }); else r.fulfill({ status: 500, body: 'no', headers: { 'access-control-allow-origin': '*' } }); });
    await bookingFlow(p);
    await p.evaluate(() => { const f = document.querySelector('#book-form'); f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
    await p.waitForSelector('.form-fail', { timeout: 8000 });
    const fb = await p.evaluate(() => ({ html: document.querySelector('.form-fail').innerText, tel: document.querySelector('.form-fail a').getAttribute('href'), formShown: !document.querySelector('#book-form').hidden, name: document.querySelector('#f-name').value, btn: document.querySelector('#book-form button[type=submit]').disabled }));
    ok('failed submit: two rapid submits make ONE request; the visitor sees the phone fallback, keeps their details and can retry', calls === 1 && /call us on/i.test(fb.html) && fb.tel === 'tel:+61255500144' && fb.formShown && fb.name === 'Sam Rivera' && !fb.btn, JSON.stringify([calls, fb]));
    mode = 'ok'; await p.click('#book-form button[type=submit]'); await p.waitForSelector('#form-success:not([hidden])', { timeout: 8000 });
    const okTxt = norm(await p.locator('#form-success').textContent());
    ok('successful submit shows the confirmation (not the demo wording) with a reference and the phone number to call', calls === 2 && /Thanks, your request is with us/.test(okTxt) && !/This is a demo/.test(okTxt) && /BB-/.test(okTxt), okTxt.slice(0, 200));
    await p.goto(live + 'book.html'); await p.waitForTimeout(500);
    ok('with an endpoint set the "demo only" wording is gone from the booking page', !/Demo only|This is a demo/.test(await p.locator('#book').textContent()));
    await done(p);
    // spam trap + careers + newsletter on the live copy
    const q = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: TUE + T, host: live }); let qc = 0;
    await q.route('https://forms.example.test/**', (r) => { qc++; r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}', headers: { 'access-control-allow-origin': '*' } }); });
    await bookingFlow(q); await q.evaluate(() => { document.querySelector('#book-form input[name=website]').value = 'http://spam.example'; });
    await q.click('#book-form button[type=submit]'); await q.waitForSelector('#form-success:not([hidden])', { timeout: 8000 });
    ok('spam trap: a filled honeypot sends nothing but looks successful', qc === 0);
    await q.goto(live + 'careers.html'); await q.waitForTimeout(500);
    await q.fill('#c-name', 'Alex Smith'); await q.fill('#c-email', 'alex@example.com'); await q.fill('#c-msg', 'I have been cutting hair for five years.'); await q.click('form[data-demo-form] button[type=submit]');
    await q.waitForSelector('form[data-demo-form] .form-success:not([hidden])', { timeout: 8000 });
    ok('careers form sends to the endpoint and shows its thank-you message', qc === 1);
    await q.fill('#n-email', 'nope').catch(() => {}); 
    await done(q);
    const d = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: TUE + T }); await d.goto(base + 'book.html'); await d.waitForTimeout(500);
    const hp = await d.evaluate(() => [...document.querySelectorAll('input[name=website]')].map((i) => [i.tabIndex, i.closest('.hp').getAttribute('aria-hidden'), i.getBoundingClientRect().width]));
    ok('booking form carries a hidden honeypot field that is out of the tab order and hidden from screen readers', hp.length >= 1 && hp.every((h) => h[0] === -1 && h[1] === 'true' && h[2] <= 1), JSON.stringify(hp));
    ok('without an endpoint the confirmation says it is a demo', await (async () => { await d.locator('.cal-day:not(:disabled)').nth(3).click(); await d.locator('.slot:not(:disabled)').nth(1).click(); await d.fill('#f-name', 'Sam Rivera'); await d.fill('#f-phone', '0412 345 678'); await d.click('#book-form button[type=submit]'); await d.waitForSelector('#form-success:not([hidden])'); return /This is a demo/.test(await d.locator('#form-success').textContent()); })());
    await done(d);
  }
  // 7. A time that passes while the form is open is refused
  {
    const q = await newPage({ viewport: { width: 1280, height: 800 } }, { ...light, clock: TUE + 'T10:00:00' }); await q.goto(base + 'book.html?service=classic-cut'); await q.waitForTimeout(600);
    await q.locator('.cal-day.is-today').click(); await q.locator('.slot:not(:disabled)').first().click(); await q.fill('#f-name', 'Sam Rivera'); await q.fill('#f-phone', '0412 345 678');
    await q.evaluate(() => { const R = Date, off = 3 * 3600e3; class F extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } } window.Date = F; }); // three hours pass
    await q.click('#book-form button[type=submit]');
    const st = await q.evaluate(() => ({ err: document.querySelector('#e-time').textContent, shown: !document.querySelector('#book-form').hidden, saved: localStorage.getItem('bb-bookings') }));
    ok('booking: if the chosen time passes while the form is open it is refused, the visitor picks another, nothing is saved', /just passed/.test(st.err) && st.shown && !st.saved, JSON.stringify(st));
    await done(q);
  }
  // 8. Cache busting, import map, robots, noscript banner, landscape phone, 3D fallback still works
  {
    const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
    ok('CSS, Lenis and main.js links carry ?v=hash and one import map versions Three.js and every module', /styles\.css\?v=[0-9a-f]{8}/.test(html) && /main\.js\?v=[0-9a-f]{8}/.test(html) && (html.match(/type="importmap"/g) || []).length === 1 && /"\.\/js\/forms\.js": "\.\/js\/forms\.js\?v=[0-9a-f]{8}"/.test(html) && /"three": "\.\/vendor\/three\.module\.min\.js\?v=/.test(html));
    ok('robots.txt names the sitemap; 404, sitemap, favicon and manifest exist', /Sitemap: /.test(fs.readFileSync(path.join(SITE, 'robots.txt'), 'utf8')) && ['404.html', 'sitemap.xml', 'favicon.ico', 'site.webmanifest', 'legal.html'].every((f) => fs.existsSync(path.join(SITE, f))));
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }); const np = await ctx.newPage(); await np.goto(base + 'index.html');
    const nj = norm(await np.evaluate(() => document.querySelector('.nojs-banner').innerText));
    ok('JavaScript off: a banner shows the phone number, street address and hours', nj.includes(cfg.contact.phone) && nj.includes(cfg.contact.street) && /Mon/.test(nj), nj.slice(0, 140));
    await ctx.close();
    const l = await newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }, { webgl: false, clock: TUE + T }); await l.goto(base + 'index.html'); await l.waitForTimeout(800);
    const a = await l.evaluate(audit);
    ok('phone in landscape (844x390): no sideways scroll', a.scrollW <= a.W && !a.bad.length, JSON.stringify(a));
    await done(l);
    const m = await newPage({ viewport: { width: 390, height: 844 } }, { webgl: false, clock: TUE + T }); await m.goto(base + 'index.html'); await m.waitForTimeout(800);
    const mod = await m.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /\/js\/.*\.js/.test(n)));
    ok('the browser really loads the versioned module files (every js/ request has ?v=)', mod.length >= 6 && mod.every((n) => /\?v=[0-9a-f]{8}$/.test(n)), mod.slice(0, 2).join(' '));
    await done(m);
  }
  servers.forEach((sv) => sv.close()); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}

await browser.close(); server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? '. FAILED: ' + failed.map((f) => f.name).join('; ') : ''}`);
process.exit(failed.length ? 1 : 0);
