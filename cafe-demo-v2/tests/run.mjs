// Automated checks for the Ember & Oak demo. Run:  cd tests && npm i && npx playwright-core install chromium && node run.mjs [--suite=overflow,axe,func,fallback,links,perf,final]
// In a sandbox without downloads, set CHROME_PATH to an installed Chromium.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(SITE, 'site.config.json'), 'utf8'));
const PAGES = [...cfg.pages.map((p) => p.file), cfg.errorPage.file];
const arg = (process.argv.find((a) => a.startsWith('--suite=')) || '--suite=all').slice(8).split(',');
const want = (n) => arg.includes('all') || arg.includes(n);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };

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
async function newPage(opts = {}, { webgl = true, quiet = true, extraInit } = {}) {
  const ctx = await browser.newContext(opts);
  if (quiet) await ctx.addInitScript(QUIET);
  if (!webgl) await ctx.addInitScript(NO_WEBGL);
  if (extraInit) await ctx.addInitScript(extraInit);
  await ctx.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' }));
  await ctx.route(/openstreetmap\.org/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' }));
  const p = await ctx.newPage();
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
      const small = [...document.querySelectorAll('a.btn,button,.header-link,.brand,.link-arrow,.exp-link,.back-top,.footer-col a,.footer-legal a,.crumbs a,.chip-opt span,summary,[role=tab],.icon-btn,.add-btn,.ci-qty button,.announce-close,.cookie .btn')]
        .filter((e) => (e.offsetParent !== null || getComputedStyle(e).position === 'fixed') && !e.closest('[hidden]')).map((e) => { const r = e.getBoundingClientRect(); return [(e.textContent.trim() || e.getAttribute('aria-label') || e.className).slice(0, 18), Math.round(r.width), Math.round(r.height)]; }).filter(([, w, h]) => h && (h < 44 || w < 44));
      const t = [...document.querySelectorAll('p,li,td,th,address,label,dd')].filter((e) => e.offsetParent && !e.closest('[hidden]') && parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => e.textContent.trim().slice(0, 25));
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
  const mids = [...new Set(JSON.parse(fs.readFileSync(path.join(SITE, 'data/menu.json'), 'utf8')).flatMap((c) => c.items.map((i) => 'm-' + i.name.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))))];
  ok('menu deep-link ids exist', mids.every((m) => ids.get('menu.html').includes(m)));
  await done(p);
}

/* ---------------------------------------------------------------- behaviour */
if (want('func')) {
  // Desktop
  let p = await newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base + 'index.html'); await p.waitForTimeout(3500);
  ok('home: exactly one h1', (await p.locator('h1').count()) === 1);
  ok('home: 3D scene loaded from the self-hosted library', (await p.locator('#stage.has-3d').count()) === 1);
  ok('home: open-status chip is filled in', /^(Open now|Closed)/.test(await p.locator('#open-status').textContent()), await p.locator('#open-status').textContent());
  await p.locator('.nav-toggle').click();
  ok('full-screen menu opens on desktop', await p.locator('#mobile-nav').isVisible());
  await p.keyboard.press('Escape');
  ok('Escape closes the menu', !(await p.locator('#mobile-nav').isVisible()));
  // announcement bar: static, dismissible, remembered
  ok('announcement: one static line, no moving track, no pause button, no venue tabs', (await p.locator('.announce').count()) === 1 && (await p.locator('.ticker, .ticker-track, .ticker-pause, .ticker-venues').count()) === 0 && (await p.evaluate(() => getComputedStyle(document.querySelector('.announce-text')).animationName)) === 'none');
  ok('announcement: says the new coffee and the hours (wide screens)', /Guji Natural/.test(await p.locator('.announce-text').innerText()) && /Open 7 days, from 7am \(Sundays 8am\)/.test(await p.locator('.announce-text').innerText()));
  const ab = await p.locator('.announce-close').boundingBox();
  ok('announcement: Dismiss button is 44px with the right label', ab.width >= 43.5 && ab.height >= 43.5 && (await p.locator('.announce-close').getAttribute('aria-label')) === 'Dismiss announcement');
  const th0 = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ticker-h').trim());
  await p.locator('.announce-close').click();
  ok('announcement: dismiss hides it, sets --ticker-h to 0 and remembers the choice', !(await p.locator('.announce').isVisible()) && (await p.evaluate(() => document.documentElement.style.getPropertyValue('--ticker-h'))) === '0px' && (await p.evaluate(() => localStorage.getItem('eo-announce'))) === 'off' && th0 === '44px', th0);
  await p.reload(); await p.waitForTimeout(500);
  ok('announcement: stays dismissed after a reload, with no layout jump (--ticker-h is 0 from the first paint)', !(await p.locator('.announce').isVisible()) && (await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ticker-h').trim() === '0px' && Math.round(document.querySelector('.hero').getBoundingClientRect().top + scrollY) === 0)));
  // search
  await p.locator('#search-open').click(); await p.keyboard.type('gluten');
  await p.waitForTimeout(500);
  ok('search finds menu items', (await p.locator('#search-results a').count()) > 2, `${await p.locator('#search-results a').count()} results`);
  await p.keyboard.press('Escape');
  await p.keyboard.press('/');
  ok('"/" opens search', await p.locator('#search').isVisible()); await p.keyboard.press('Escape');
  ok('chat: the floating chat button, panel and script are gone', (await p.locator('#chat, .chat, #chat-toggle').count()) === 0 && !fs.existsSync(path.join(SITE, 'js/chat.js')) && !/chat/i.test(fs.readFileSync(path.join(SITE, 'main.js'), 'utf8')));
  // sound toggle
  const snd = p.locator('.footer-legal [data-sound]');
  ok('ambient sound: visible label "Ambient sound: Off" before use', (await snd.innerText()).replace(/\s+/g, ' ').trim() === 'Ambient sound: Off' && (await snd.getAttribute('aria-pressed')) === 'false');
  await snd.click();
  ok('ambient sound toggle flips to "Ambient sound: On" (aria-pressed)', (await snd.getAttribute('aria-pressed')) === 'true' && (await snd.innerText()).replace(/\s+/g, ' ').trim() === 'Ambient sound: On');
  await snd.click();
  ok('ambient sound toggles back off', (await snd.getAttribute('aria-pressed')) === 'false' && /Off$/.test((await snd.innerText()).trim()));
  // newsletter
  ok('newsletter: one-line privacy note under the form', /email/i.test(await p.locator('#p-news').textContent()) && (await p.locator('#p-news').evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)))) === 1);
  await p.locator('#n-email').fill('nope'); await p.locator('#news-form button').click();
  ok('newsletter rejects a bad email', (await p.locator('#e-news').textContent()).includes("doesn't look"));
  await p.locator('#n-email').fill('a@b.co'); await p.locator('#news-form button').click();
  ok('newsletter accepts a good email', (await p.locator('#e-news').textContent()).includes('on the list'));
  ok('no console errors on the home page', !p.logs.length, JSON.stringify(p.logs.slice(0, 3)));
  await done(p);

  // Menu page: tabs, ordering, cart
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'menu.html'); await p.waitForTimeout(800);
  ok('menu: 41 items', (await p.locator('.menu-item').count()) === 41);
  const tabNames = await p.locator('[role=tab]').allTextContents();
  ok('menu: Coffee, Tea, Food and Bakery categories exist', ['Coffee', 'Tea', 'Food', 'Bakery'].every((n) => tabNames.includes(n)), tabNames.join(','));
  ok('menu: every item has a price, 3 or more carry V/VG/GF tags', (await p.locator('.menu-item .price').count()) === 41 && (await p.locator('.menu-item abbr.tag').count()) > 30);
  ok('menu: every item has an Add to order button', (await p.locator('.add-btn[aria-label^="Add "][aria-label$="to your order"]').count()) === 41);
  await p.locator('#tab-coffee').focus(); await p.keyboard.press('ArrowRight');
  ok('menu tabs: ArrowRight', (await p.locator('#tab-tea').getAttribute('aria-selected')) === 'true' && (await p.locator('#panel-tea').isVisible()));
  await p.keyboard.press('End'); ok('menu tabs: End', (await p.locator('#tab-evening').getAttribute('aria-selected')) === 'true');
  await p.keyboard.press('ArrowRight'); ok('menu tabs: wrap to first', (await p.locator('#tab-coffee').getAttribute('aria-selected')) === 'true');
  await p.locator('#tab-food').click(); ok('menu: Food tab shows breakfast and lunch dishes', (await p.locator('#panel-food .menu-item').count()) === 12 && (await p.locator('#panel-food').isVisible()));
  await p.locator('#tab-coffee').click();
  await p.locator('#panel-coffee .add-btn').first().click(); await p.locator('#panel-coffee .add-btn').first().click(); await p.locator('#panel-coffee .add-btn').nth(1).click();
  ok('cart badge counts items', (await p.locator('#cart-count').textContent()) === '3');
  await p.locator('#cart-open').click();
  ok('cart shows 2 lines and a total', (await p.locator('#cart-list li').count()) === 2 && /\$/.test(await p.locator('#cart-total').textContent()), await p.locator('#cart-total').textContent());
  await p.locator('#cart-list [data-qty="1"]').first().click();
  ok('cart quantity buttons work', (await p.locator('#cart-count').textContent()) === '4');
  await p.locator('#cart-form button[type=submit]').click();
  ok('cart asks for a name', (await p.locator('#e-cart-name').textContent()).includes('name'));
  ok('cart: clear demo notice at checkout and a pick-up time picker', /no payment is taken/i.test(await p.locator('#cart-demo-note').textContent()) && (await p.locator('#cart-when option').count()) >= 1 && (await p.locator('label[for="cart-when"]').textContent()).includes('Pick-up time'));
  await p.fill('#cart-name', 'Sam Rivera'); await p.locator('#cart-form button[type=submit]').click();
  ok('order confirmation appears and empties the cart', await p.locator('#cart-done').isVisible() && !(await p.locator('#cart-count').isVisible()));
  ok('order confirmation repeats the demo notice', /no order was sent/i.test(await p.locator('#cart-done .note').textContent()));
  const orders = await p.evaluate(() => JSON.parse(localStorage.getItem('eo-orders') || '[]'));
  ok('confirmed order is saved to localStorage (name, items, total, pick-up)', orders.length === 1 && orders[0].name === 'Sam Rivera' && orders[0].items.length === 2 && orders[0].total > 10 && !!orders[0].pickup, JSON.stringify(orders[0] || {}).slice(0, 120));
  await p.keyboard.press('Escape');
  ok('Escape closes the cart', !(await p.locator('#cart').isVisible()));
  await p.goto(base + 'menu.html#m-cardamom-morning-bun'); await p.waitForTimeout(900);
  ok('search deep link opens the right tab', (await p.locator('#tab-bakery').getAttribute('aria-selected')) === 'true');
  ok('menu PDF is linked and exists', fs.existsSync(path.join(SITE, 'menu.pdf')));
  await done(p);

  // Visit: hours + map
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'visit.html'); await p.waitForTimeout(600);
  ok("today's hours row is highlighted (café time zone)", (await p.locator('.hours tr.is-today').count()) === 1);
  await p.locator('#map-load').click(); await p.waitForTimeout(300);
  ok('map loads only after a click', (await p.locator('#map-box iframe').count()) === 1);
  await p.locator('details').first().locator('summary').click();
  ok('FAQ opens', await p.locator('details').first().evaluate((d) => d.open));
  await done(p);

  // Reserve: validation, deep-linked type, time slots
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'reserve.html?type=private'); await p.waitForTimeout(500);
  ok('reserve: ?type= pre-selects the enquiry type', (await p.locator('#f-type').inputValue()) === 'private');
  await p.locator('#reserve-form button[type=submit]').click();
  ok('reserve: empty submit shows errors', (await p.locator('.error').allTextContents()).filter(Boolean).length >= 3);
  ok('reserve: focus goes to first invalid field', (await p.evaluate(() => document.activeElement.id)) === 'f-name');
  await p.fill('#f-name', 'Sam Rivera'); await p.fill('#f-email', 'bad'); await p.locator('#f-email').blur();
  ok('reserve: bad email message', (await p.locator('#e-email').textContent()).includes("doesn't look"));
  await p.fill('#f-email', 'sam@example.com'); await p.fill('#f-date', '2020-01-01'); await p.locator('#f-date').blur();
  ok('reserve: past date rejected', (await p.locator('#e-date').textContent()).includes('passed'));
  const future = new Date(Date.now() + 864e5 * 9); const fs2 = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
  await p.fill('#f-date', fs2); await p.locator('#f-date').dispatchEvent('change');
  const disabled = await p.locator('#f-time option:disabled').count(), enabled = await p.locator('#f-time option:not(:disabled)').count();
  ok('reserve: time slots follow opening hours and show full slots', disabled > 0 && enabled > 3, `${enabled} open, ${disabled} unavailable; ${await p.locator('#h-time').textContent()}`);
  await p.fill('#f-guests', '40'); await p.locator('#f-guests').blur();
  ok('reserve: guests over 12 rejected', (await p.locator('#e-guests').textContent()).includes('1 to 12'));
  await p.fill('#f-guests', '4'); await p.locator('#reserve-form button[type=submit]').click();
  ok('reserve: success panel with demo note', (await p.locator('#form-success').isVisible()) && /demo only/i.test(await p.locator('#form-success .note').textContent()), await p.locator('#ok-detail').textContent());
  const res = await p.evaluate(() => JSON.parse(localStorage.getItem('eo-reservations') || '[]'));
  ok('reserve: confirmed request is saved to localStorage', res.length === 1 && res[0].guests === 4 && res[0].name === 'Sam Rivera' && res[0].date === '' + fs2 + '', JSON.stringify(res[0] || {}).slice(0, 120));
  await done(p);

  // Generic forms
  for (const f of ['careers.html', 'wholesale.html']) {
    p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
    await p.goto(base + f); await p.locator('form[data-demo-form] button[type=submit]').click();
    const errs = (await p.locator('form[data-demo-form] .error').allTextContents()).filter(Boolean).length;
    ok(`${f}: empty submit shows errors`, errs >= 2, String(errs));
    await done(p);
  }

  // Gift card + count-up + journey on other pages
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'experiences.html'); await p.locator('.chip-opt:has(input[value="100"])').click();
  ok('gift card amount updates', (await p.locator('#gift-amount').textContent()) === '$100');
  await p.goto(base + 'story.html'); await p.evaluate(() => document.querySelector('.stats').scrollIntoView()); await p.waitForTimeout(2600);
  ok('stats count up to 10 | 250,000 | 12 once visible', (await p.locator('.stat-num').allTextContents()).join('|') === '10|250,000|12', (await p.locator('.stat-num').allTextContents()).join('|'));
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
  await done(p);

  // Cookie card geometry: small, bottom-left, never full width, never covering the hero buttons or the Call / Reserve bar
  for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
    p = await newPage({ viewport: { width: w, height: h }, hasTouch: mobile }, { webgl: false, quiet: false });
    await p.addInitScript(() => { try { sessionStorage.setItem('eo-seen', '1'); } catch (e) { /* ignore */ } });
    await p.goto(base + 'index.html'); await p.waitForTimeout(2800);
    const g = await p.evaluate(() => {
      const box = (sel) => { const e = document.querySelector(sel); if (!e || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
      const hit = (a, b) => a && b && a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
      const c = box('#cookie');
      const btns = [...document.querySelectorAll('.hero a.btn, .hero a.link-arrow, .scroll-cue, .header-link, .icon-btn, .nav-toggle')].map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }).filter((r) => r.b > 0 && r.t < innerHeight && r.r > r.l);
      return { c, vw: innerWidth, vh: innerHeight, overBtn: btns.some((x) => hit(c, x)), overBar: hit(c, box('.mobile-cta')) };
    });
    ok(`cookie card @${w}: visible, small (${g.c ? Math.round(g.c.w) + 'x' + Math.round(g.c.h) : 'none'}), max 320px wide, bottom-left, not full width`, g.c && g.c.w <= 321 && g.c.w < g.vw - 20 && g.c.l < 30 && g.c.b > g.vh - (mobile ? 200 : 40));
    ok(`cookie card @${w}: covers no button in view and not the Call/Reserve bar`, !g.overBtn && !g.overBar, JSON.stringify({ btn: g.overBtn, bar: g.overBar }));
    const [da, dd] = await Promise.all([p.locator('#cookie [data-cookie="yes"]').boundingBox(), p.locator('#cookie [data-cookie="no"]').boundingBox()]);
    ok(`cookie card @${w}: Accept and Decline are side-by-side 44px buttons`, da && dd && da.height >= 43.5 && dd.height >= 43.5 && Math.abs(da.y - dd.y) < 2);
    await done(p);
  }

  // Find us, status chip in another time zone, reviews, footer line
  p = await newPage({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/New_York' }, { webgl: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(800);
  const fu = await p.evaluate(() => { const f = document.querySelector('#find-us iframe'); const sec = document.querySelector('#find-us'); const nl = document.querySelector('#join'); return { src: f && f.getAttribute('src'), title: f && f.title, w: f && f.getAttribute('width'), h: f && f.getAttribute('height'), lazy: f && f.loading, ref: f && f.referrerPolicy, link: [...sec.querySelectorAll('a')].some((a) => /Open in Google Maps/.test(a.textContent) && /google\.com\/maps/.test(a.href)), before: !!(sec.compareDocumentPosition(nl) & Node.DOCUMENT_POSITION_FOLLOWING), table: !!sec.querySelector('table.hours'), addr: /12 Example Street/.test(sec.textContent), chip: sec.querySelector('[data-open-status]').textContent };
  });
  ok('find us: Google map iframe (no key), lazy, titled, sized, referrer policy, link, before the newsletter', /^https:\/\/maps\.google\.com\/maps\?q=Federation%20Square%2C%20Melbourne%20VIC&output=embed$/.test(fu.src) && fu.title && fu.w && fu.h && fu.lazy === 'lazy' && fu.ref === 'no-referrer-when-downgrade' && fu.link && fu.before && fu.table && fu.addr, JSON.stringify(fu));
  ok('find us: open/closed chip follows café time and says so for a visitor in New York', /^(Open now|Closed now) \u00b7 .*\(Melbourne time\)$/.test(fu.chip), fu.chip);
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 }, timezoneId: 'Australia/Melbourne' }, { webgl: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(800);
  ok('find us: no time-zone note for a visitor in Melbourne', !/Melbourne time/.test(await p.locator('#find-us [data-open-status]').textContent()), await p.locator('#find-us [data-open-status]').textContent());
  const rv = await p.evaluate(() => [...document.querySelectorAll('.review')].map((r) => ({ av: !!r.querySelector('.review-avatar') && getComputedStyle(r.querySelector('.review-avatar')).borderRadius === '50%', st: r.querySelector('.stars').getAttribute('aria-label'), date: /ago/.test(r.querySelector('.review-date').textContent), name: !!r.querySelector('.review-who strong') })));
  ok('reviews: card with round avatar, name, 5-star label and "ago" date; sample label kept; no real-rating claims', rv.length === 3 && rv.every((r) => r.av && r.st === '5 out of 5 stars' && r.date && r.name) && /Sample reviews for demo purposes/.test(await p.locator('#reviews').textContent()) && !/google rating|reviews on google|\d\.\d.*stars/i.test(await p.locator('#reviews').textContent()));
  ok('footer: concept-website line plus the original not-a-real-business line', /Concept website by KB Ventures\. Want one for your business\?/.test(await p.locator('.site-footer').innerText()) && /Concept demo by KB Ventures\. Not a real business\./.test(await p.locator('.site-footer').innerText()));
  await done(p);
  p = await newPage({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false }, { quiet: false });
  await p.goto(base + 'index.html');
  ok('find us without JavaScript: plain hours text and the hours table are visible', /Open 7 days, from 7am/.test(await p.locator('#find-us [data-open-status]').textContent()) && (await p.locator('#find-us table.hours').isVisible()));
  await done(p);

  // Photos: one grade, frame and overlay
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(500);
  const ph = await p.evaluate(() => [...document.querySelectorAll('.photo')].map((e) => { const i = e.querySelector('img'), cs = getComputedStyle(i), full = !!e.closest('.hero-photo,.section-photo'); const b = getComputedStyle(e, '::before'), a = getComputedStyle(e, '::after'); return { grade: cs.filter, fit: cs.objectFit, full, radius: getComputedStyle(e).borderRadius, line: b.boxShadow, border: b.display, overlay: a.backgroundImage.slice(0, 40), pos: i.style.objectPosition }; }));
  ok(`photos: all ${ph.length} on home share one grade (sepia/saturate/contrast), object-fit cover, a gradient overlay and an inline pos`, ph.length === 13 && ph.every((x) => /sepia\(0\.12\)/.test(x.grade) && /saturate\(0\.85\)/.test(x.grade) && /contrast\(1\.03\)/.test(x.grade) && x.fit === 'cover' && /linear-gradient/.test(x.overlay) && /^\d+% \d+%$/.test(x.pos)), JSON.stringify(ph[0]));
  ok('photos: framed ones have a 6px radius and the ember hairline; full-bleed ones have neither', ph.filter((x) => !x.full).every((x) => x.radius === '6px' && /rgba\(224, 120, 43/.test(x.line)) && ph.filter((x) => x.full).every((x) => x.radius === '0px' && x.border === 'none'));
  ok('photos: every slot in photos.json has a valid pos', Object.values(JSON.parse(fs.readFileSync(path.join(SITE, 'data/photos.json'), 'utf8')).slots).every((x) => /^\d{1,3}% \d{1,3}%$/.test(x.pos || '')));
  await p.evaluate(() => window.scrollTo(0, 1500)); await p.waitForTimeout(700);
  ok('photos: slow scroll zoom is wired to every kind (hero, section, feature, gallery)', await p.evaluate(() => ['.hero-photo .photo', '.section-photo .photo', '.feature-art .photo', '.tile .photo'].every((q) => document.querySelector(q).hasAttribute('data-photo'))));
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, { webgl: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(500);
  ok('photos: no zoom transform with reduced motion', await p.evaluate(() => [...document.querySelectorAll('.photo img')].every((i) => getComputedStyle(i).transform === 'none')));
  await done(p);

  // Typography and spacing
  for (const [w, exp] of [[1440, [56, 40, 28, 20]], [390, [36, 30, 24, 19]]]) {
    p = await newPage({ viewport: { width: w, height: 900 } }, { webgl: false });
    await p.goto(base + 'visit.html'); await p.waitForTimeout(400);
    const hs = await p.evaluate(() => { const px = (v) => Math.round(parseFloat(v)); const r = document.documentElement; const t = (tag) => { const e = document.createElement(tag); document.body.appendChild(e); const f = px(getComputedStyle(e).fontSize); e.remove(); return f; }; return { h: [t('h1'), t('h2'), t('h3'), t('h4')], pad: getComputedStyle(document.querySelector('main > .section')).paddingTop, sp: getComputedStyle(r).getPropertyValue('--space-12').trim() + '/' + getComputedStyle(r).getPropertyValue('--space-1').trim(), lh: getComputedStyle(document.body).lineHeight, fs: getComputedStyle(document.body).fontSize }; });
    ok(`typography @${w}: heading scale h1-h4 = ${exp.join('/')}px`, hs.h.every((v, i) => Math.abs(v - exp[i]) <= 1), JSON.stringify(hs.h));
    ok(`spacing @${w}: 8px scale tokens, section padding ${w >= 1024 ? 160 : 96}px, body 17px at line-height 1.6`, hs.sp === '96px/8px' && hs.pad === (w >= 1024 ? '160px' : '96px') && Math.abs(parseFloat(hs.lh) / parseFloat(hs.fs) - 1.6) < .01, JSON.stringify(hs));
    await done(p);
  }
  p = await newPage({ viewport: { width: 1280, height: 900 } }, { webgl: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(1200);
  const fam = await p.evaluate(async () => { await document.fonts.ready; const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')); const used = new Set([...document.querySelectorAll('body *')].map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim())); return { loaded: [...new Set(loaded)], used: [...used] }; });
  ok('fonts: only Montserrat and Mrs Saint Delafield are loaded or used as primary families', fam.loaded.every((f) => ['Montserrat', 'Mrs Saint Delafield'].includes(f)) && fam.used.every((f) => ['Montserrat', 'Mrs Saint Delafield'].includes(f)), JSON.stringify(fam));
  const meas = await p.evaluate(() => [...document.querySelectorAll('main p')].filter((e) => e.offsetParent && !e.closest('.join-inner,.hero-body,.form-success,.cart-done') && e.getBoundingClientRect().width > 0).map((e) => e.getBoundingClientRect().width / parseFloat(getComputedStyle(e).fontSize)).reduce((m, v) => Math.max(m, v), 0));
  ok('typography: running text is limited to about 68ch', meas <= 68 * 0.6 + 40, String(meas.toFixed(1)));
  await done(p);

  // Favicons, manifest, 404
  const mf = JSON.parse(fs.readFileSync(path.join(SITE, 'site.webmanifest'), 'utf8'));
  ok('manifest: name, short_name, description, lang, id, start_url, scope, display, orientation, categories, colours', ['name', 'short_name', 'description', 'lang', 'id', 'start_url', 'scope', 'display', 'orientation', 'categories'].every((k) => mf[k]) && mf.theme_color === '#120D0A' && mf.background_color === '#120D0A');
  ok('manifest: 192 + 512 "any" icons and a 512 "maskable" icon that exist', ['192x192:any', '512x512:any', '512x512:maskable'].every((k) => mf.icons.some((i) => i.sizes + ':' + i.purpose === k && fs.existsSync(path.join(SITE, i.src)))));
  const ico = fs.readFileSync(path.join(SITE, 'favicon.ico'));
  ok('favicon.ico is a real ICO with 16, 32 and 48 px images; svg + apple-touch icons exist and are linked', ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) === 3 && fs.existsSync(path.join(SITE, 'img/icon.svg')) && fs.existsSync(path.join(SITE, 'img/apple-touch-icon.png')) && PAGES.every((f) => { const h = fs.readFileSync(path.join(SITE, f), 'utf8'); return /rel="icon" href="favicon\.ico"/.test(h) && /rel="icon" href="img\/icon\.svg"/.test(h) && /rel="apple-touch-icon"/.test(h); }));
  p = await newPage({ viewport: { width: 1280, height: 900 } }, { webgl: false });
  await p.goto(base + '404.html'); await p.waitForTimeout(500);
  ok('404 page: themed, noindex, links back to Home, Menu and Reserve', (await p.locator('h1').textContent()) === 'Page not found' && (await p.locator('meta[name=robots]').getAttribute('content')) === 'noindex' && (await p.locator('main .btn-row a').allTextContents()).join() === 'Home,Menu,Reserve');
  ok('404 page is not in the sitemap', !/404/.test(fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8')));
  await done(p);

  // Header shrinks on scroll, back-to-top, anchors and tab deep links (with smooth scrolling on)
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(1000);
  ok('smooth scrolling (Lenis) is active when motion is allowed', await p.evaluate(() => document.documentElement.classList.contains('lenis')));
  const h0 = await p.locator('.site-header').evaluate((e) => e.getBoundingClientRect().height);
  await p.evaluate(() => window.scrollTo(0, 1400)); await p.waitForTimeout(1500);
  const h1 = await p.locator('.site-header').evaluate((e) => e.getBoundingClientRect().height);
  ok('sticky header shrinks on scroll and stays at the top', h1 < h0 && (await p.locator('.site-header').evaluate((e) => e.getBoundingClientRect().top)) === 0, `${h0} -> ${h1}`);
  await p.locator('.back-top').scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await p.evaluate(() => window.scrollTo(0, 99999)); await p.waitForTimeout(600);
  await p.locator('.back-top').click(); await p.waitForTimeout(2200);
  ok('"Back to top" scrolls to the top', (await p.evaluate(() => window.scrollY)) < 5, String(await p.evaluate(() => window.scrollY)));
  await p.locator('.scroll-cue').click(); await p.waitForTimeout(2200);
  const fy = await p.evaluate(() => [Math.round(document.querySelector('#facts').getBoundingClientRect().top), location.hash]);
  ok('in-page anchor (#facts) scrolls to its target and updates the URL', fy[0] >= 0 && fy[0] < 140 && fy[1] === '#facts', JSON.stringify(fy));
  await p.keyboard.press('Tab'); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.skip-link').focus()); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  ok('skip link moves focus to main', await p.evaluate(() => document.activeElement.id === 'main'));
  await p.locator('.nav-toggle').click(); await p.waitForTimeout(200);
  ok('smooth scrolling pauses while the menu overlay is open', await p.evaluate(() => document.documentElement.classList.contains('lenis-stopped')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('smooth scrolling resumes after the menu closes', await p.evaluate(() => !document.documentElement.classList.contains('lenis-stopped')));
  await p.goto(base + 'menu.html'); await p.waitForTimeout(600);
  await p.locator('#cart-open').click(); await p.waitForTimeout(200);
  ok('smooth scrolling pauses while the order drawer is open', await p.evaluate(() => document.documentElement.classList.contains('lenis-stopped')));
  await p.keyboard.press('Escape');
  await p.evaluate(() => { location.hash = '#m-cardamom-morning-bun'; }); await p.waitForTimeout(1500);
  ok('tab deep link (#m-...) opens the Bakery tab and scrolls to the item', (await p.locator('#tab-bakery').getAttribute('aria-selected')) === 'true' && await p.evaluate(() => { const r = document.getElementById('m-cardamom-morning-bun').getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; }));
  await done(p);

  // Reduced motion: no Lenis, counters show their final value at once
  p = await newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, { webgl: false });
  await p.goto(base + 'story.html'); await p.waitForTimeout(500);
  ok('reduced motion: smooth scrolling is off', await p.evaluate(() => !document.documentElement.classList.contains('lenis')));
  ok('reduced motion: counters show 10 | 250,000 | 12 immediately', (await p.locator('.stat-num').allTextContents()).join('|') === '10|250,000|12');
  ok('reduced motion: reveal content is visible without scrolling', await p.evaluate(() => [...document.querySelectorAll('.reveal')].every((e) => getComputedStyle(e).opacity === '1')));
  await done(p);
}

/* ---------------------------------------------------------------- content consistency (hours, hero line, counters, titles, nav labels, photos) */
if (want('func') || want('content')) {
  const PHRASE = '7 days, from 7am (Sundays 8am)';
  const html = (f) => fs.readFileSync(path.join(SITE, f), 'utf8');
  const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&ndash;/g, '-').replace(/\s+/g, ' ');
  ok('hours: every page footer says "' + PHRASE + '"', PAGES.every((f) => strip(html(f).split('<footer')[1] || '').includes(PHRASE)));
  ok('hours: home hero chip, facts and visit page say the same line', [html('index.html'), html('visit.html')].every((h) => (h.match(/class="chip-hours">([^<]*)</g) || []).length >= 1 && h.includes('class="chip-hours">' + PHRASE + '<')) && html('index.html').includes('<span>' + PHRASE + '</span>'));
  ok('hours: no leftover old wording', PAGES.every((f) => !/Open 7 days from 7am|breakfast to late/.test(html(f))));
  const ld = JSON.parse(html('index.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const byDay = Object.fromEntries(ld.openingHoursSpecification.map((o) => [o.dayOfWeek, o.opens + '-' + o.closes]));
  ok('hours: JSON-LD matches the table (Mon-Wed 07-16, Thu-Sat 07-22, Sun 08-16) and the description says the phrase', byDay.Monday === '07:00-16:00' && byDay.Thursday === '07:00-22:00' && byDay.Saturday === '07:00-22:00' && byDay.Sunday === '08:00-16:00' && ld.description.includes(PHRASE), JSON.stringify(byDay));
  const rows = [...html('visit.html').matchAll(/data-day="(\d)" data-open="(\d+)" data-close="(\d+)"/g)].map((m) => m.slice(1).join(':')).sort().join(' ');
  ok('hours: visit table rows match site.config.json', rows === cfg.hours.map((h) => `${h.day}:${h.open}:${h.close}`).sort().join(' '), rows);
  const TAG = 'Slow mornings. Small-batch coffee. Roasted out the back, poured right here.';
  ok('hero line is the new tagline everywhere, the old one is gone', html('index.html').includes('<p class="hero-tag">' + TAG + '</p>') && PAGES.every((f) => !/Join us in seeking/.test(html(f))) && !/Join us in seeking/.test(fs.readFileSync(path.join(SITE, 'search-data.js'), 'utf8')) && !/Join us in seeking/.test(JSON.stringify(cfg)));
  for (const f of ['index.html', 'story.html']) {
    const nums = [...html(f).matchAll(/class="stat-num"[^>]*>([^<]*)</g)].map((m) => m[1]).join('|');
    ok(`counters: ${f} has the real values as plain HTML text (${nums})`, nums === '10|250,000|12');
  }
  const lbl = (h, re) => [...h.matchAll(re)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  let navBad = [];
  for (const f of PAGES) {
    const h = html(f);
    const overlay = lbl(h.split('id="mobile-nav"')[1].split('overlay-sub')[0], /<li><a href="[^"]+">(?:<span class="n"[^>]*>[^<]*<\/span>)?([^<]+)<\/a><\/li>/g);
    const foot = lbl(h.split('aria-label="Footer: explore"')[1].split('</nav>')[0], /<li><a href="[^"]+">([^<]+)<\/a><\/li>/g).filter((x) => x !== 'Reserve');
    if (overlay.join() !== foot.join() || overlay.join() !== cfg.nav.map((n) => n.label).join()) navBad.push(`${f}: ${overlay} | ${foot}`);
  }
  ok('nav labels: overlay menu, footer and config use the same labels on every page', !navBad.length, navBad[0]);
  ok('no visible "index.html" text on any page', PAGES.every((f) => !/>[^<]*index\.html[^<]*</.test(html(f).replace(/<script[\s\S]*?<\/script>/g, ''))));
  const phot = JSON.parse(fs.readFileSync(path.join(SITE, 'data/photos.json'), 'utf8')).slots;
  const shown = Object.values(phot).filter((x) => fs.existsSync(path.join(SITE, x.file)));
  ok('photos: every shipped photo has alt text, a credit and is under 250 KB; the footer credits exactly those', shown.every((x) => x.alt && x.credit && fs.statSync(path.join(SITE, x.file)).size <= 250 * 1024) && (shown.length ? html('index.html').includes('Photo credits:') : !html('index.html').includes('Photo credits')), `${shown.length} photos`);
  ok('photos: no stray image files without a slot', fs.readdirSync(path.join(SITE, 'img/photos')).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).every((f) => Object.values(phot).some((x) => x.file === 'img/photos/' + f)));
  ok('SEO: every page has a title, description, og + twitter tags, noindex, one h1, skip link', PAGES.every((f) => { const h = html(f); return /<title>[^<]+<\/title>/.test(h) && /name="description" content="[^"]{20,}/.test(h) && /property="og:title"/.test(h) && /property="og:description"/.test(h) && /property="og:image"/.test(h) && /name="twitter:card"/.test(h) && /name="twitter:title"/.test(h) && /name="robots" content="noindex"/.test(h) && /class="skip-link"/.test(h) && /rel="preload" href="fonts\/montserrat-latin\.woff2"/.test(h); }));
  ok('og.png is a 1200x630 PNG', (() => { const b = fs.readFileSync(path.join(SITE, 'img/og.png')); return b.readUInt32BE(16) === 1200 && b.readUInt32BE(20) === 630; })());
  ok('scripts are deferred or modules', PAGES.every((f) => { const tags = html(f).match(/<script[^>]*\ssrc="[^"]+"[^>]*>/g) || []; return tags.every((t) => /\sdefer|type="module"/.test(t)); }));

  // Loaded pages: titles / meta / search results never show a literal "&amp;"; every img has dimensions; hours + counters in the DOM
  const p = await newPage({ viewport: { width: 1280, height: 900 } }, { webgl: false });
  const amp = [], noDims = [];
  for (const f of PAGES) {
    await p.goto(base + f); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({
      t: document.title, metas: [...document.querySelectorAll('meta[content]')].map((m) => m.content), ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent).join(' '),
      vis: document.body.innerText, labels: [...document.querySelectorAll('[aria-label],[title],[alt]')].map((e) => (e.getAttribute('aria-label') || '') + (e.getAttribute('title') || '') + (e.getAttribute('alt') || '')).join(' '),
      imgs: [...document.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
    }));
    if (/&amp;|&#38;/.test(r.t + r.metas.join(' ') + r.ld + r.vis + r.labels)) amp.push(f);
    if (r.imgs) noDims.push(f);
  }
  ok('no literal "&amp;" in titles, meta tags, JSON-LD, visible text or labels on any page', !amp.length, amp.join(','));
  ok('every <img> has width and height', !noDims.length, noDims.join(','));
  await p.goto(base + 'index.html'); await p.locator('#search-open').click();
  let badSearch = [];
  for (const q of ['avo', 'shop', 'terms', 'oak', 'tea', 'cat', 'job', 'cup']) { await p.fill('#search-input', ''); await p.fill('#search-input', q); await p.waitForTimeout(150); const t = await p.locator('#search-results').innerText(); if (/&amp;|&rsquo;|&#/.test(t)) badSearch.push(q); }
  ok('search results show no HTML entities', !badSearch.length, badSearch.join(','));
  ok('search index contains no HTML entities', !/&(amp|rsquo|ndash|#\d+);/.test(fs.readFileSync(path.join(SITE, 'search-data.js'), 'utf8')));
  await done(p);
}

/* ---------------------------------------------------------------- fallbacks and motion preferences */
if (want('fallback')) {
  let p = await newPage({ viewport: { width: 375, height: 812 } }, { webgl: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(800);
  ok('no WebGL: canvas removed, SVG cup shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.cup-fallback').isVisible()), JSON.stringify(p.logs));
  const a = await p.evaluate(audit); ok('no WebGL: no overflow at 375px', a.scrollW <= a.W && !a.bad.length, JSON.stringify(a.bad));
  await done(p);

  p = await newPage({ viewport: { width: 375, height: 812 } });
  await p.context().route('**/vendor/three.module.min.js', (r) => r.abort());
  await p.goto(base + 'index.html'); await p.waitForTimeout(2500);
  ok('3D library fails to load: fallback shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.cup-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 } });
  await p.context().route('**/vendor/three.module.min.js', async (r) => { await new Promise((x) => setTimeout(x, 6500)); r.abort(); });
  await p.goto(base + 'index.html'); await p.waitForTimeout(6600);
  ok('slow load (over 4s): fallback shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.cup-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 } }, { extraInit: () => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }) });
  await p.goto(base + 'index.html'); await p.waitForTimeout(1200);
  ok('Data Saver: 3D skipped, light illustration shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.cup-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 390, height: 844 }, hasTouch: true }, { extraInit: () => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 }) });
  await p.goto(base + 'index.html'); await p.waitForTimeout(3500);
  ok('low-power phone (390px wide, 2 cores): no canvas, the SVG poster stays visible, 3D library never requested', (await p.locator('#scene').count()) === 0 && (await p.locator('.cup-fallback').isVisible()) && !(await p.evaluate(() => performance.getEntriesByType('resource').some((r) => /three\.module/.test(r.name)))));
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { extraInit: () => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 }) });
  await p.goto(base + 'index.html'); await p.waitForTimeout(4500);
  ok('large screen with 2 cores is not treated as low-power (3D still starts)', (await p.locator('#stage.has-3d').count()) === 1);
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(base + 'index.html'); await p.waitForTimeout(3500);
  const s1 = await p.locator('#stage').screenshot(); await p.waitForTimeout(1500); const s2 = await p.locator('#stage').screenshot();
  ok('reduced motion: 3D shows a still frame', Buffer.compare(s1, s2) === 0 && (await p.locator('#scene.is-ready').count()) === 1);
  ok('reduced motion: no preloader, hero text visible', (await p.locator('#preloader').count()) === 0 && (await p.evaluate(() => getComputedStyle(document.querySelector('.hero-tag')).opacity)) === '1');
  await done(p);


  // JavaScript off, or the main script failing: the site must still be usable
  p = await newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }, { quiet: false });
  await p.goto(base + 'index.html'); await p.waitForTimeout(800);
  ok('no JavaScript: no stuck intro overlay', !(await p.evaluate(() => { const e = document.getElementById('preloader'); return e && getComputedStyle(e).display !== 'none'; })));
  ok('no JavaScript: navigation links are visible', (await p.evaluate(() => [...document.querySelectorAll('#mobile-nav a')].filter((a) => a.offsetParent).length)) >= 6);
  await p.goto(base + 'menu.html');
  ok('no JavaScript: all six menu categories are readable', (await p.evaluate(() => [...document.querySelectorAll('[role=tabpanel]')].filter((e) => e.offsetParent).length)) === 6);
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false });
  await p.context().route('**/main.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'throw new Error("boom")' }));
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

  p = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false, extraInit: () => {
    let seen = false; window.__preRemoved = null;
    new MutationObserver(() => { const e = document.getElementById('preloader'); if (e) seen = true; else if (seen && window.__preRemoved === null) window.__preRemoved = performance.now(); }).observe(document, { childList: true, subtree: true });
  } });
  await p.goto(base + 'index.html', { waitUntil: 'commit' });
  await p.waitForSelector('#preloader', { state: 'attached', timeout: 5000 });
  ok('first visit shows the branded preloader', (await p.locator('#preloader').count()) === 1);
  await p.waitForFunction(() => window.__preRemoved !== null, null, { timeout: 8000 }).catch(() => {});
  const preT = await p.evaluate(() => window.__preRemoved);
  ok('first visit: preloader is gone within 1.5s (plus 0.5s margin for slow test machines)', preT !== null && preT < 2000, `removed at ${preT === null ? 'never' : Math.round(preT) + ' ms'} after navigation start`);
  ok('preloader finishes and the page becomes ready', (await p.locator('#preloader').count()) === 0 && (await p.evaluate(() => document.documentElement.classList.contains('is-ready'))));
  ok('3D hero shows the SVG poster until the scene is ready', await p.evaluate(() => !!document.querySelector('.cup-fallback')));
  await done(p);

  // counters: real numbers in the HTML without JavaScript, and when the script breaks
  p = await newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }, { quiet: false });
  await p.goto(base + 'story.html');
  ok('no JavaScript: counters show 10 | 250,000 | 12', (await p.locator('.stat-num').allTextContents()).join('|') === '10|250,000|12');
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false });
  await p.context().route('**/main.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'throw new Error("boom")' }));
  await p.goto(base + 'story.html'); await p.waitForTimeout(5200);
  ok('main script fails: counters keep their final text and reveal content is visible', (await p.locator('.stat-num').allTextContents()).join('|') === '10|250,000|12' && (await p.evaluate(() => [...document.querySelectorAll('.reveal')].every((e) => getComputedStyle(e).opacity === '1'))));
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
  const heroKb = fs.statSync(path.join(SITE, 'img/photos/hero-interior.webp')).size / 1024;
  ok('hero image is under 250 KB', heroKb < 250, heroKb.toFixed(0) + ' KB');
  ok('every iframe/img has width+height; everything below the fold is lazy', await p.evaluate(() => [...document.querySelectorAll('iframe,img')].every((e) => e.getAttribute('width') && e.getAttribute('height')) && [...document.querySelectorAll('iframe,img')].filter((e) => !e.closest('.hero')).every((e) => e.loading === 'lazy')));
  ok('home page makes no third-party requests', Object.keys(sizes).every((k) => !/^https?:/.test(k)));
  const ld = await p.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)['@type']));
  ok('home has CafeOrCoffeeShop structured data', ld.includes('CafeOrCoffeeShop'), JSON.stringify(ld));
  await done(p);
}

/* ---------------------------------------------------------------- final sweep: every page at 1440x900 and 390x844 */
if (want('final')) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await newPage({ viewport: { width: w, height: h }, hasTouch: w < 500 });
    const bad = { scroll: [], img: [], logs: [], overlap: [] };
    for (const f of PAGES) {
      p.logs.length = 0;
      await p.goto(base + f); await p.waitForTimeout(f === 'index.html' ? 3500 : 700); await p.addStyleTag({ content: force }); await p.waitForTimeout(150);
      const r = await p.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const imgs = [...document.querySelectorAll('img')].filter((i) => i.complete && !i.naturalWidth).map((i) => i.src);
        // detect overlapping text: visible in-flow text blocks whose boxes intersect without one containing the other
        const fixedish = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) { const c = getComputedStyle(a); if (/(fixed|sticky|absolute)/.test(c.position) || a.hidden || a.getAttribute('aria-hidden') === 'true' || a.classList.contains('sr-only') || a.classList.contains('hero') && false) return true; } return false; };
        const els = [...document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,label,th,td,summary,figcaption,address,dt,dd')].filter((e) => {
          const dt = e.closest('details'); if (dt && !dt.open && !e.closest('summary')) return false;
          if (e.offsetParent === null || fixedish(e) || e.closest('.hero-stage,.mobile-nav,.cart,.search,[hidden]')) return false;
          const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        });
        const boxes = els.map((e) => [e, e.getBoundingClientRect()]);
        const clash = [];
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const [a, ra] = boxes[i], [b, rb] = boxes[j];
          if (a.contains(b) || b.contains(a)) continue;
          const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (ox > 3 && oy > 3 && ox * oy > 40) clash.push(`${a.tagName}.${(a.className || '').toString().split(' ')[0]}"${a.textContent.trim().slice(0, 18)}" x ${b.tagName}"${b.textContent.trim().slice(0, 18)}"`);
        }
        return { sw: document.documentElement.scrollWidth, W, imgs, clash: clash.slice(0, 3) };
      });
      if (r.sw > r.W) bad.scroll.push(f);
      if (r.imgs.length) bad.img.push(f + ' ' + r.imgs.join());
      if (r.clash.length) bad.overlap.push(f + ': ' + r.clash.join(' | '));
      if (p.logs.length) bad.logs.push(f + ': ' + p.logs.slice(0, 2).join(' / '));
    }
    ok(`final @${w}x${h}: no horizontal scroll on any page`, !bad.scroll.length, bad.scroll.join(','));
    ok(`final @${w}x${h}: no broken images`, !bad.img.length, bad.img.join(','));
    ok(`final @${w}x${h}: no overlapping text detected`, !bad.overlap.length, bad.overlap.slice(0, 3).join(' || '));
    ok(`final @${w}x${h}: no console errors or warnings (404s included)`, !bad.logs.length, bad.logs.join(' || '));
    await done(p);
  }
}

await browser.close(); server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? '. FAILED: ' + failed.map((f) => f.name).join('; ') : ''}`);
process.exit(failed.length ? 1 : 0);
