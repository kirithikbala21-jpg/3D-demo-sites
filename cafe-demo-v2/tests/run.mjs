// Automated checks for the Ember & Oak demo. Run:  cd tests && npm i && npx playwright-core install chromium && node run.mjs [--suite=overflow,axe,func,fallback,links,perf]
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
async function newPage(opts = {}, { webgl = true, quiet = true, extraInit } = {}) {
  const ctx = await browser.newContext(opts);
  if (quiet) await ctx.addInitScript(QUIET);
  if (!webgl) await ctx.addInitScript(NO_WEBGL);
  if (extraInit) await ctx.addInitScript(extraInit);
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
    await p.goto(base + f); await p.waitForTimeout(500); await p.addStyleTag({ content: force + '.cursor{display:none}' });
    const r = await p.evaluate(() => {
      const small = [...document.querySelectorAll('a.btn,button,.header-link,.brand,.link-arrow,.exp-link,.back-top,.footer-col a,.footer-legal a,.crumbs a,.chip-opt span,summary,[role=tab],.icon-btn,.add-btn,.ci-qty button')]
        .filter((e) => (e.offsetParent !== null || getComputedStyle(e).position === 'fixed') && !e.closest('[hidden]')).map((e) => { const r = e.getBoundingClientRect(); return [(e.textContent.trim() || e.getAttribute('aria-label') || e.className).slice(0, 18), Math.round(r.width), Math.round(r.height)]; }).filter(([, w, h]) => h && (h < 44 || w < 44));
      const t = [...document.querySelectorAll('p,li,td,th,address,label,dd')].filter((e) => e.offsetParent && !e.closest('.ticker,[hidden]') && parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => e.textContent.trim().slice(0, 25));
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
  const pause = p.locator('.ticker-pause'); await pause.click();
  ok('ticker can be paused (WCAG 2.2.2)', (await pause.getAttribute('aria-pressed')) === 'true' && (await p.locator('.ticker.is-paused').count()) === 1);
  // search
  await p.locator('#search-open').click(); await p.keyboard.type('gluten');
  await p.waitForTimeout(500);
  ok('search finds menu items', (await p.locator('#search-results a').count()) > 2, `${await p.locator('#search-results a').count()} results`);
  await p.keyboard.press('Escape');
  await p.keyboard.press('/');
  ok('"/" opens search', await p.locator('#search').isVisible()); await p.keyboard.press('Escape');
  // chat
  await p.locator('#chat-toggle').click(); await p.locator('#chat-quick button', { hasText: 'Opening hours' }).click(); await p.waitForTimeout(800);
  ok('chat answers from the shared hours data', (await p.locator('#chat-log .bot').last().textContent()).includes('7am') || (await p.locator('#chat-log .bot').last().textContent()).includes('7:00am'));
  await p.keyboard.press('Escape');
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
  await p.goto(base + 'menu.html'); await p.waitForTimeout(800);
  ok('menu: 38 items', (await p.locator('.menu-item').count()) === 38);
  await p.locator('#tab-coffee').focus(); await p.keyboard.press('ArrowRight');
  ok('menu tabs: ArrowRight', (await p.locator('#tab-breakfast').getAttribute('aria-selected')) === 'true' && (await p.locator('#panel-breakfast').isVisible()));
  await p.keyboard.press('End'); ok('menu tabs: End', (await p.locator('#tab-evening').getAttribute('aria-selected')) === 'true');
  await p.keyboard.press('ArrowRight'); ok('menu tabs: wrap to first', (await p.locator('#tab-coffee').getAttribute('aria-selected')) === 'true');
  await p.locator('#panel-coffee .add-btn').first().click(); await p.locator('#panel-coffee .add-btn').first().click(); await p.locator('#panel-coffee .add-btn').nth(1).click();
  ok('cart badge counts items', (await p.locator('#cart-count').textContent()) === '3');
  await p.locator('#cart-open').click();
  ok('cart shows 2 lines and a total', (await p.locator('#cart-list li').count()) === 2 && /\$/.test(await p.locator('#cart-total').textContent()), await p.locator('#cart-total').textContent());
  await p.locator('#cart-list [data-qty="1"]').first().click();
  ok('cart quantity buttons work', (await p.locator('#cart-count').textContent()) === '4');
  await p.locator('#cart-form button[type=submit]').click();
  ok('cart asks for a name', (await p.locator('#e-cart-name').textContent()).includes('name'));
  await p.fill('#cart-name', 'Sam Rivera'); await p.locator('#cart-form button[type=submit]').click();
  ok('order confirmation appears and empties the cart', await p.locator('#cart-done').isVisible() && !(await p.locator('#cart-count').isVisible()));
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
  ok('reserve: success panel', await p.locator('#form-success').isVisible(), await p.locator('#ok-detail').textContent());
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
  ok('stats count up once visible', (await p.locator('.stat-num').allTextContents()).join('|') === '9|1,800+|14');
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
  await p.goto(base + 'index.html'); await p.waitForTimeout(4800);
  ok('slow load (over 4s): fallback shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.cup-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 } }, { extraInit: () => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }) });
  await p.goto(base + 'index.html'); await p.waitForTimeout(1200);
  ok('Data Saver: 3D skipped, light illustration shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.cup-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(base + 'index.html'); await p.waitForTimeout(3500);
  const s1 = await p.locator('#stage').screenshot(); await p.waitForTimeout(1500); const s2 = await p.locator('#stage').screenshot();
  ok('reduced motion: 3D shows a still frame', Buffer.compare(s1, s2) === 0 && (await p.locator('#scene.is-ready').count()) === 1);
  ok('reduced motion: no preloader, hero text visible', (await p.locator('#preloader').count()) === 0 && (await p.evaluate(() => getComputedStyle(document.querySelector('.hero-tag')).opacity)) === '1');
  ok('reduced motion: no custom cursor', (await p.evaluate(() => getComputedStyle(document.querySelector('.cursor')).display)) === 'none');
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
  ok('home has CafeOrCoffeeShop structured data', ld.includes('CafeOrCoffeeShop'), JSON.stringify(ld));
  await done(p);
}

await browser.close(); server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? '. FAILED: ' + failed.map((f) => f.name).join('; ') : ''}`);
process.exit(failed.length ? 1 : 0);
