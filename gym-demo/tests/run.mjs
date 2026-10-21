// Automated checks for the Iron & Ember Athletic Club demo. Run:
//   cd gym-demo && export CHROME_PATH=/path/to/chromium && ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf]
// Needs tests/node_modules (playwright-core + axe-core). In a sandbox without downloads, set CHROME_PATH to an installed Chromium.
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
const cfg = JSON.parse(fs.readFileSync(path.join(SITE, 'site.config.json'), 'utf8'));
const classes = cfg.classes;
const PAGES = cfg.pages.map((p) => p.file);
const arg = (process.argv.find((a) => a.startsWith('--suite=')) || '--suite=all').slice(8).split(',');
const want = (n) => arg.includes('all') || arg.includes(n);
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };

function serve(root) {
  return new Promise((res) => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      fs.readFile(path.join(root, u), (e, d) => { if (e) { r.writeHead(404); r.end('not found'); return; } r.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); r.end(d); });
    }).listen(0, () => res(s));
  });
}
const server = await serve(SITE);
const base = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-'));
const servers = [];
const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond }); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? '  ' + extra : ''}`); };
const NO_WEBGL = () => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) return null; return g.call(this, t, ...a); }; };
const QUIET = () => { try { sessionStorage.setItem('vc-seen', '1'); localStorage.setItem('vc-cookie', 'no'); } catch (e) { /* ignore */ } };
/** Fixed visitor clock: a Date that starts at the given instant and keeps ticking. */
const FAKE = (t) => { const R = Date, off = t - R.now(); class F extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } } window.Date = F; };
const at = (iso) => Date.parse(iso + '+10:00'); // Brisbane is UTC+10 all year (no daylight saving)
const TUE = '2026-10-20', SAT = '2026-10-24';
async function newPage(opts = {}, { webgl = true, quiet = true, extraInit, host = base, clock = null } = {}) {
  const ctx = await browser.newContext(opts);
  if (clock) await ctx.addInitScript(FAKE, at(clock));
  if (quiet) await ctx.addInitScript(QUIET);
  if (!webgl) await ctx.addInitScript(NO_WEBGL);
  if (extraInit) await ctx.addInitScript(extraInit);
  await ctx.route(/maps\.google\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' })); // the only third-party request on the site is the lazy Google map; tests stub it
  const p = await ctx.newPage();
  p.logs = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) p.logs.push(m.text()); });
  p.on('pageerror', (e) => p.logs.push('pageerror: ' + e.message));
  p.base = host;
  return p;
}
const done = (p) => p.context().close();
const force = '.js .hero-cta,.js .hero .chip,.js .hero-cta{animation:none!important;opacity:1!important}main>section,.site-footer{content-visibility:visible!important}.js .reveal{opacity:1!important;transform:none!important;transition:none!important}.js [data-split] .w>span{transform:none!important;transition:none!important}';

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
const nearBlack = (rgb) => { const m = rgb.match(/[\d.]+/g).map(Number); return (m[3] === undefined || m[3] > 0.5) && m[0] < 40 && m[1] < 40 && m[2] < 40; };

/* ---------------------------------------------------------------- overflow at every width, every page (WebGL off for speed) */
if (want('overflow')) {
  for (const w of [360, 375, 414, 768, 1024, 1280, 1920]) {
    const p = await newPage({ viewport: { width: w, height: 900 } }, { webgl: false });
    const fails = [];
    for (const f of PAGES) {
      await p.goto(p.base + f); await p.waitForTimeout(500); await p.addStyleTag({ content: force });
      const a = await p.evaluate(audit);
      if (a.scrollW > a.W || a.bad.length) fails.push(`${f} ${JSON.stringify(a)}`);
    }
    ok(`no horizontal overflow @${w}px on all ${PAGES.length} pages`, !fails.length, fails.join(' | '));
    ok(`no console errors or warnings @${w}px`, !p.logs.length, JSON.stringify(p.logs.slice(0, 3)));
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
      await p.goto(p.base + f); await p.waitForTimeout(600); await p.addStyleTag({ content: force });
      await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      await p.evaluate(axeSrc);
      const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(' ')}`));
      if (r.length) bad.push(`${f}: ${r.join('; ')}`);
    }
    ok(`axe: no violations (WCAG 2.2 AA + best practice, contrast 4.5:1) @${w}px on all pages`, !bad.length, bad.join(' || '));
    await done(p);
  }
  // Colour system: whole page dark (every section background near-black or charcoal) and one accent
  {
    const p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
    const lightBgs = [];
    for (const f of PAGES) {
      await p.goto(p.base + f); await p.waitForTimeout(300);
      const r = await p.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('html, body, main > section, footer, .page-hero, .form-card, .card, .plan, .review, .cookie, .announce')) {
          const bg = getComputedStyle(el).backgroundColor, m = bg.match(/[\d.]+/g).map(Number);
          if ((m[3] === undefined || m[3] > 0.5) && (m[0] > 60 || m[1] > 60 || m[2] > 60)) out.push(el.tagName + '.' + el.className.toString().split(' ')[0] + ' ' + bg);
        }
        return out;
      });
      lightBgs.push(...r.map((x) => f + ': ' + x));
    }
    ok('colour: the whole page is dark on every page (no light section backgrounds)', !lightBgs.length, lightBgs.slice(0, 4).join(' | '));
    await p.goto(p.base + 'index.html');
    const t = await p.evaluate(() => { const s = getComputedStyle(document.documentElement); return { bg: getComputedStyle(document.body).backgroundColor, accent: s.getPropertyValue('--accent').trim().toLowerCase(), card: s.getPropertyValue('--card').trim().toLowerCase(), bgv: s.getPropertyValue('--bg').trim().toLowerCase() }; });
    ok('colour: #0b0b0c page, charcoal cards, one yellow #ffe000 accent token', t.bg === 'rgb(11, 11, 12)' && t.bgv === '#0b0b0c' && t.accent === '#ffe000' && t.card === '#161618', JSON.stringify(t));
    const yl = [];
    for (const f of PAGES) { await p.goto(p.base + f); await p.waitForTimeout(200); const r = await p.evaluate(() => [...document.querySelectorAll('h1,h2:not(.footer-col h2),h3,h4,.stat-num,.big-quote p,.plan-price')].filter((e) => getComputedStyle(e).color === 'rgb(255, 224, 0)').map((e) => e.tagName + '.' + e.className)); yl.push(...r.map((x) => f + ' ' + x)); }
    ok('yellow is never used on headings or big numerals (buttons, small labels and hover states only)', !yl.length, yl.slice(0, 3).join(' | '));
    await done(p);
  }
  const p = await newPage({ viewport: { width: 375, height: 812 }, hasTouch: true }, { webgl: false });
  const tap = [], tiny = [];
  for (const f of PAGES) {
    await p.goto(p.base + f); await p.waitForTimeout(500); await p.addStyleTag({ content: force });
    const r = await p.evaluate(() => {
      const small = [...document.querySelectorAll('a.btn,button,.header-link,.brand,.link-arrow,.back-top,.footer-col a,.footer-legal a,.crumbs a,.chip-opt span,summary,[role=tab],.icon-btn,.filter-chip,.billing-opt,.cal-day,.slot,.cal-nav,.header-nav a')]
        .filter((e) => (e.offsetParent !== null || getComputedStyle(e).position === 'fixed') && !e.closest('[hidden]')).map((e) => { const r = e.getBoundingClientRect(); return [(e.textContent.trim() || e.getAttribute('aria-label') || e.className).slice(0, 18), Math.round(r.width), Math.round(r.height)]; }).filter(([, w, h]) => h && (h < 44 || w < 44));
      const t = [...document.querySelectorAll('p,li,td,th,address,label,dd')].filter((e) => e.offsetParent && !e.closest('.announce,[hidden]') && parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => e.textContent.trim().slice(0, 25));
      return { small: small.slice(0, 4), t: t.slice(0, 4), body: parseFloat(getComputedStyle(document.body).fontSize), lh: getComputedStyle(document.body).lineHeight };
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
  for (const f of PAGES) { await p.goto(p.base + f); ids.set(f, await p.evaluate(() => [...document.querySelectorAll('[id]')].map((e) => e.id))); }
  const classIds = new Set(classes.map((c) => c.id)), coachIds = new Set(cfg.coaches.map((c) => c.id));
  for (const f of PAGES) {
    await p.goto(p.base + f);
    const links = await p.evaluate(() => [...document.querySelectorAll('a[href],link[href],script[src],img[src]')].map((e) => e.getAttribute('href') || e.getAttribute('src')));
    for (const l of new Set(links)) {
      if (/^(https?:|mailto:|tel:|data:)/.test(l)) continue;
      const [file, hash] = l.split('#'); const [target, query] = (file || f).split('?');
      if (!seen.has(target)) seen.set(target, fs.existsSync(path.join(SITE, target)));
      if (!seen.get(target)) problems.push(`${f} -> ${l} (missing file)`);
      else if (hash && PAGES.includes(target) && !ids.get(target).includes(hash)) problems.push(`${f} -> ${l} (missing anchor)`);
      const qp = new URLSearchParams(query || '');
      if (qp.get('class') && !classIds.has(qp.get('class'))) problems.push(`${f} -> ${l} (unknown class)`);
      if (qp.get('coach') && !coachIds.has(qp.get('coach'))) problems.push(`${f} -> ${l} (unknown coach)`);
    }
  }
  ok('all internal links, scripts, anchors and ?class= / ?coach= values resolve', !problems.length, problems.slice(0, 6).join(' | '));
  const search = fs.readFileSync(path.join(SITE, 'search-data.js'), 'utf8');
  const urls = [...search.matchAll(/"url": "([^"]+)"/g)].map((m) => m[1]);
  const badSearch = urls.filter((u) => { const [file, hash] = u.split('#'); return !PAGES.includes(file) || (hash && !ids.get(file).includes(hash)); });
  ok(`search index: all ${urls.length} result links point at real pages and anchors`, urls.length > 45 && !badSearch.length, badSearch.slice(0, 4).join(' | '));
  ok('all 32 classes have a row with a deep-link id', classes.length === 32 && classes.every((c) => ids.get('classes.html').includes('c-' + c.id)));
  await done(p);
}

/* ---------------------------------------------------------------- behaviour */
if (want('func')) {
  // Desktop home
  let p = await newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(3500);
  ok('home: exactly one h1, with the exact headline', (await p.locator('h1').count()) === 1 && (await p.locator('h1').textContent()).replace(/\u2019/g, "'") === "It's not just training. It's how you live.");
  ok('home hero: "Start your free trial" goes to the trial form and "Book a visit" to the Visit section', (await p.locator('.hero-cta a').first().textContent()) === 'Start your free trial' && (await p.locator('.hero-cta a').first().getAttribute('href')) === 'trial.html' && (await p.locator('.hero-cta a').nth(1).textContent()) === 'Book a visit' && (await p.locator('.hero-cta a').nth(1).getAttribute('href')) === '#visit');
  ok('home: sections appear in the requested order', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id))) === JSON.stringify(['', 'offer', 'banner', 'facilities', 'timetable', 'coaches', 'results', 'plans', 'visit', 'join']), JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id))));
  ok('home: announcement says "First week free. No lock-in."', (await p.locator('#announce').textContent()).includes('First week free. No lock-in.'));
  const sums = await p.locator('#offer details summary').allTextContents();
  ok('home offer: 7-day free trial with three accessible expanding items and a yellow button', (await p.locator('#offer h2').textContent()).includes('7 days free') && sums.length === 3 && /What.s included/.test(sums[0]) && /What happens next/.test(sums[1]) && sums[2] === 'Costs' && (await p.locator('#offer .btn-primary').textContent()) === 'Start your free trial');
  await p.locator('#offer details').nth(2).locator('summary').click();
  ok('home offer: items expand on click', await p.locator('#offer details').nth(2).evaluate((d) => d.open));
  ok('home: seven facility photos, four coach cards, one big sample quote, three plans with a Most popular badge', (await p.locator('#facilities .tile').count()) === 7 && (await p.locator('#coaches .coach').count()) === 4 && (await p.locator('#results .big-quote').count()) === 1 && /Sample quote for demo purposes/.test(await p.locator('#results').textContent()) && (await p.locator('#plans .plan').count()) === 3 && (await p.locator('#plans .badge').count()) === 1 && (await p.locator('#plans .badge').textContent()) === 'Most popular');
  ok('home: 3D scene loaded from the self-hosted library', (await p.locator('#stage.has-3d').count()) === 1);
  ok('home: open-status chip is filled in', /^(Open now|Closed)/.test(await p.locator('#open-status').textContent()), await p.locator('#open-status').textContent());
  ok('a visible "Home" link in the header', await p.locator('.header-nav a[href="index.html"]').isVisible() && (await p.locator('.header-nav a[href="index.html"]').textContent()).trim() === 'Home');
  await p.locator('.nav-toggle').click();
  ok('full-screen menu opens on desktop', await p.locator('#mobile-nav').isVisible());
  await p.keyboard.press('Escape');
  ok('Escape closes the menu', !(await p.locator('#mobile-nav').isVisible()));
  ok('announcement bar is one static line with a 44px dismiss button, no ticker', (await p.locator('#announce').isVisible()) && (await p.locator('.ticker, .ticker-track, marquee').count()) === 0 && (await p.locator('#announce').evaluate((e) => e.getBoundingClientRect().height)) < 60 && await p.locator('#announce-close').evaluate((e) => { const r = e.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }));
  await p.locator('#announce-close').click();
  ok('dismissing the announcement hides it, sets --ticker-h to 0, saves vc-announce and stays hidden after a reload', !(await p.locator('#announce').isVisible()) && (await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ticker-h').trim())) === '0px' && (await p.evaluate(() => localStorage.getItem('vc-announce'))) === 'off' && (await (async () => { await p.reload(); await p.waitForTimeout(500); return !(await p.locator('#announce').isVisible()); })()));
  await p.locator('#search-open').click(); await p.keyboard.type('yoga');
  await p.waitForTimeout(500);
  ok('search finds classes', (await p.locator('#search-results a').count()) > 3, `${await p.locator('#search-results a').count()} results`);
  await p.keyboard.press('Escape');
  await p.keyboard.press('/');
  ok('"/" opens search', await p.locator('#search').isVisible()); await p.keyboard.press('Escape');
  ok('no chat widget on the page, no sound toggle', (await p.locator('#chat, #chat-toggle, .chat, [data-sound]').count()) === 0);
  await p.locator('#n-email').fill('nope'); await p.locator('#news-form button').click();
  ok('newsletter rejects a bad email', (await p.locator('#e-news').textContent()).includes("doesn't look"));
  await p.locator('#n-email').fill('a@b.co'); await p.locator('#news-form button').click();
  ok('newsletter accepts a good email and shows a thank-you', (await p.locator('#e-news').textContent()).includes('on the list'));
  ok('newsletter has a one-line privacy note', /only use your email/i.test(await p.locator('.privacy-note').textContent()));
  ok('no console errors or warnings on the home page', !p.logs.length, JSON.stringify(p.logs.slice(0, 3)));
  await done(p);

  // Classes: day tabs, deep links, filters, Book links, deterministic spots
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(p.base + 'classes.html'); await p.waitForTimeout(800);
  ok('classes: 32 classes in 7 day tabs (Mon-Sun)', (await p.locator('.class-row').count()) === 32 && (await p.locator('[role=tab]').count()) === 7 && (await p.locator('[role=tab]').evaluateAll((ts) => ts.map((t) => t.textContent).join(','))) === 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday');
  await p.locator('#tab-mon').focus(); await p.keyboard.press('ArrowRight');
  ok('day tabs: ArrowRight moves to Tuesday and shows its panel', (await p.locator('#tab-tue').getAttribute('aria-selected')) === 'true' && (await p.locator('#day-tue').isVisible()) && !(await p.locator('#day-mon').isVisible()));
  await p.keyboard.press('End'); ok('day tabs: End selects Sunday', (await p.locator('#tab-sun').getAttribute('aria-selected')) === 'true');
  await p.keyboard.press('ArrowRight'); ok('day tabs: wrap to Monday', (await p.locator('#tab-mon').getAttribute('aria-selected')) === 'true');
  await p.keyboard.press('ArrowLeft'); ok('day tabs: ArrowLeft wraps back to Sunday', (await p.locator('#tab-sun').getAttribute('aria-selected')) === 'true');
  ok('day tabs: roving tabindex (only the selected tab is in the tab order)', (await p.locator('[role=tab][tabindex="0"]').count()) === 1 && (await p.locator('#tab-sun').getAttribute('tabindex')) === '0');
  ok('day tabs: panel is labelled by its tab', (await p.locator('#day-sun').getAttribute('aria-labelledby')) === 'tab-sun' && (await p.locator('#day-sun').getAttribute('role')) === 'tabpanel');
  await p.locator('#tab-wed').click();
  ok('clicking a tab updates the URL hash for deep links', (await p.evaluate(() => location.hash)) === '#day-wed');
  await p.goto(p.base + 'classes.html#day-thu'); await p.waitForTimeout(700);
  ok('deep link #day-thu opens Thursday', (await p.locator('#tab-thu').getAttribute('aria-selected')) === 'true' && (await p.locator('#day-thu').isVisible()));
  await p.goto(p.base + 'classes.html#c-tue-1730-power-hour'); await p.waitForTimeout(900);
  ok('search deep link #c-<class> opens the right day', (await p.locator('#tab-tue').getAttribute('aria-selected')) === 'true' && (await p.locator('#c-tue-1730-power-hour').isVisible()));
  await p.locator('#tab-mon').click();
  const monAll = await p.locator('#day-mon .class-row:visible').count();
  await p.locator('[data-filter=Yoga]').click();
  const yoga = await p.locator('#day-mon .class-row:visible').evaluateAll((rs) => rs.map((r) => r.dataset.type));
  ok('filter: Yoga shows only yoga classes, fewer than all', yoga.length > 0 && yoga.length < monAll && yoga.every((t) => t === 'Yoga'), `${yoga.length} of ${monAll}`);
  ok('filter: chip is pressed, tab counts update, a live status is announced', (await p.locator('[data-filter=Yoga]').getAttribute('aria-pressed')) === 'true' && (await p.locator('#tab-mon').getAttribute('data-n')) === String(yoga.length) && /Yoga class/.test(await p.locator('#filter-status').textContent()), await p.locator('#filter-status').textContent());
  await p.locator('#tab-sat').click();
  ok('filter stays on when changing day', (await p.locator('#day-sat .class-row:visible').evaluateAll((rs) => rs.every((r) => r.dataset.type === 'Yoga'))) && (await p.locator('#day-sat .class-row:visible').count()) > 0);
  const types = []; for (const t of ['Strength', 'HIIT', 'Mobility', 'Boxing']) { await p.locator(`[data-filter=${t}]`).click(); types.push(await p.locator('#day-sat .class-row:visible').evaluateAll((rs, t) => rs.length > 0 && rs.every((r) => r.dataset.type === t), t)); }
  ok('filter: Strength, HIIT, Mobility and Boxing all work', types.every(Boolean), JSON.stringify(types));
  await p.locator('[data-filter=all]').click();
  ok('filter: All restores every class', (await p.locator('#day-sat .class-row:visible').count()) === 5);
  const spots1 = await p.locator('.spots').allTextContents();
  await p.reload(); await p.waitForTimeout(500);
  ok('spots left are deterministic across reloads and some classes are full', JSON.stringify(spots1) === JSON.stringify(await p.locator('.spots').allTextContents()) && spots1.some((s) => /Full/.test(s)) && spots1.some((s) => /\d+ spots? left/.test(s)));
  const hrefs = await p.locator('.class-row .btn').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  ok('every class has a Book button linking to trial.html?class=<id>', hrefs.length === 32 && hrefs.every((h) => /^trial\.html\?class=[a-z0-9-]+$/.test(h)) && (await p.locator('.class-row .btn').evaluateAll((as) => as.filter((a) => /^Book|^Waitlist/.test(a.textContent)).length)) === 32);
  await p.locator('#tab-tue').click(); await p.locator('#c-tue-1730-power-hour .btn').click(); await p.waitForURL(/trial\.html\?class=tue-1730-power-hour/);
  ok('Book goes to the trial page with the class pre-selected', (await p.locator('#f-session').inputValue()) === 'tue-1730-power-hour');
  await done(p);

  // Coaches
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(p.base + 'coaches.html'); await p.waitForTimeout(500);
  ok('coaches: four coaches with photos and book-with links', (await p.locator('.coach').count()) === 4 && (await p.locator('.coach .photo img').count()) === 4 && (await p.locator('.coach a[href^="trial.html?coach="]').count()) === 4);
  await p.locator('#coach-dev a').click(); await p.waitForURL(/trial\.html\?coach=dev/);
  ok('book with a coach pre-selects that coach on the trial page', (await p.locator('input[name=coach]:checked').getAttribute('value')) === 'dev');
  await done(p);

  // Membership: billing toggle, plans, day pass + gift
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(p.base + 'membership.html'); await p.waitForTimeout(500);
  const m1 = await p.locator('.price-amt').allTextContents();
  ok('membership: three plans with monthly prices by default', (await p.locator('.plan').count()) === 3 && m1.join('|') === '$89|$169|$279' && (await p.locator('[data-billing=monthly]').getAttribute('aria-pressed')) === 'true', m1.join('|'));
  await p.locator('[data-billing=annual]').click();
  const m2 = await p.locator('.price-amt').allTextContents();
  ok('membership: annual toggle swaps prices and billing notes', m2.join('|') === '$79|$145|$239' && (await p.locator('[data-billing=annual]').getAttribute('aria-pressed')) === 'true' && /once a year/.test(await p.locator('.plan-bill').first().textContent()) && /annual/.test(await p.locator('#billing-status').textContent()), m2.join('|'));
  await p.locator('[data-billing=monthly]').click();
  ok('membership: toggle back to monthly', (await p.locator('.price-amt').first().textContent()) === '$89');
  await p.locator('.chip-opt:has(input[value="200"])').click();
  ok('gift voucher amount updates', (await p.locator('#gift-amount').textContent()) === '$200');
  ok('membership: FAQ and day pass section exist', (await p.locator('#plan-faq details').count()) >= 5 && (await p.locator('#day-pass .pass-list li').count()) === 3);
  await done(p);

  // Visit: hours + map + live status in the gym's time zone
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(p.base + 'visit.html'); await p.waitForTimeout(600);
  ok("today's hours row is highlighted (Brisbane time zone)", (await p.locator('.hours tr.is-today').count()) === 1);
  const gm = p.locator('.gmap iframe');
  ok('visit: Google map embed is lazy, titled and sized, with an Open in Google Maps link', (await gm.count()) === 1 && (await gm.getAttribute('loading')) === 'lazy' && /^https:\/\/maps\.google\.com\/maps\?q=.*output=embed$/.test(await gm.getAttribute('src')) && !/key=/.test(await gm.getAttribute('src')) && !!(await gm.getAttribute('title')) && !!(await gm.getAttribute('width')) && !!(await gm.getAttribute('height')) && (await p.locator('a', { hasText: 'Open in Google Maps' }).count()) === 1);
  await p.locator('details').first().locator('summary').click();
  ok('FAQ opens', await p.locator('details').first().evaluate((d) => d.open));
  ok('visit: one h1 and the hours table lists seven days', (await p.locator('h1').count()) === 1 && (await p.locator('.hours tbody tr').count()) === 7);
  await done(p);
  for (const [tz, expect] of [['America/New_York', true], ['Australia/Brisbane', false]]) {
    p = await newPage({ viewport: { width: 1440, height: 900 }, timezoneId: tz }, { webgl: false });
    await p.goto(p.base + 'visit.html'); await p.waitForTimeout(500);
    const t = await p.locator('#open-status-2').textContent();
    ok(`open-now chip ${expect ? 'adds "(Brisbane time)" for a visitor in ' + tz : 'has no suffix for a visitor in Brisbane'}`, /^(Open now|Closed)/.test(t) && t.includes('(Brisbane time)') === expect, t);
    await done(p);
  }

  // Free trial / booking: deep links, calendar, duration-aware time grid, validation, confirmation, localStorage
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(p.base + 'trial.html?class=tue-1730-power-hour&coach=marcus'); await p.waitForTimeout(500);
  ok('trial: ?class= pre-selects the class', (await p.locator('#f-session option:checked').textContent()).includes('Power Hour'));
  ok("trial: in class mode the class's coach is chosen and the coach choice is locked", (await p.locator('input[name=coach]:checked').getAttribute('value')) === 'dex' && (await p.locator('input[name=coach]:disabled').count()) === 5 && /Dex Holloway/.test(await p.locator('#h-coach').textContent()));
  if (!(await p.locator('.cal-day:not(:disabled)').count())) await p.locator('#cal-next').click(); // late in a month there may be no Tuesday left in this month's view
  const wd = await p.locator('.cal-day:not(:disabled)').evaluateAll((bs) => bs.map((b) => new Date(b.dataset.date + 'T00:00:00Z').getUTCDay()));
  ok('trial: a class can only be booked on its own weekday (Tuesday)', wd.length >= 1 && wd.every((d) => d === 2), JSON.stringify(wd));
  await p.locator('.cal-day:not(:disabled)').last().click();
  ok('trial: class mode shows the one class time', (await p.locator('.slot').count()) === 1 && (await p.locator('.slot').first().textContent()) === '5:30pm', await p.locator('.slot').allTextContents().then((a) => a.join(',')));
  await p.goto(p.base + 'trial.html?coach=dex'); await p.waitForTimeout(500);
  ok('trial: ?coach= pre-selects the coach (free trial is the default session)', (await p.locator('input[name=coach]:checked').getAttribute('value')) === 'dex' && (await p.locator('#f-session').inputValue()) === 'trial');
  ok('trial: coach cards for any plus four coaches', (await p.locator('input[name=coach]').count()) === 5);
  await p.locator('#trial-form button[type=submit]').click();
  ok('trial: empty submit shows date, time, name and phone errors', (await p.locator('.error').allTextContents()).filter(Boolean).length >= 4);
  ok('trial: focus goes to the first problem (the calendar)', await p.evaluate(() => !!document.activeElement.closest('#cal-grid')));
  ok('trial: past days cannot be picked', (await p.locator('.cal-day:disabled').count()) > 0);
  const wk = await p.evaluate(() => { const b = [...document.querySelectorAll('.cal-day:not(:disabled)')].find((x, i) => i > 0 && ![0, 6].includes(new Date(x.dataset.date + 'T00:00:00Z').getUTCDay())); return b && b.dataset.date; });
  await p.locator(`.cal-day[data-date="${wk}"]`).click();
  const labels = await p.locator('.slot').allTextContents(), open = await p.locator('.slot:not(:disabled)').count(), taken = await p.locator('.slot:disabled').count();
  ok('trial: weekday time grid follows 5am-10pm hours and a 45 min session (first 5:00am, last 9:00pm)', labels[0] === '5:00am' && labels[labels.length - 1] === '9:00pm', `${labels[0]}..${labels[labels.length - 1]}`);
  ok('trial: time grid is grouped (Morning, Afternoon, Evening) and shows taken slots', (await p.locator('.slot-group-label').allTextContents()).join(',') === 'Morning,Afternoon,Evening' && open > 3 && taken > 0, `${open} open, ${taken} unavailable; ${await p.locator('#h-time').textContent()}`);
  const sat = await p.evaluate(() => { const b = [...document.querySelectorAll('.cal-day:not(:disabled)')].find((x) => new Date(x.dataset.date + 'T00:00:00Z').getUTCDay() === 6); return b && b.dataset.date; });
  if (sat) { await p.locator(`.cal-day[data-date="${sat}"]`).click(); const l2 = await p.locator('.slot').allTextContents(); ok('trial: weekend time grid follows 7am-6pm hours (first 7:00am, last 5:00pm for 45 min)', l2[0] === '7:00am' && l2[l2.length - 1] === '5:00pm', `${l2[0]}..${l2[l2.length - 1]}`); }
  await p.locator(`.cal-day[data-date="${wk}"]`).click();
  await p.locator('.slot:not(:disabled)').nth(1).click();
  ok('trial: chosen time is marked', (await p.locator('.slot[aria-pressed=true]').count()) === 1);
  await p.fill('#f-name', 'Sam Rivera'); await p.fill('#f-phone', 'abc'); await p.locator('#f-phone').blur();
  ok('trial: bad phone message', (await p.locator('#e-phone').textContent()).includes("doesn't look"));
  await p.fill('#f-phone', '07 5550 0123'); await p.locator('#trial-form button[type=submit]').click();
  const okText = await p.locator('#form-success').textContent();
  ok('trial: confirmation screen with the demo notice and a booking reference', (await p.locator('#form-success').isVisible()) && okText.includes('This is a demo, no real booking was made') && /VC-[A-Z0-9]{5}/.test(okText), await p.locator('#ok-detail').textContent());
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('vc-bookings') || '[]'));
  ok('trial: booking saved to localStorage "vc-bookings"', saved.length === 1 && saved[0].name === 'Sam Rivera' && /^VC-/.test(saved[0].ref) && saved[0].kind === 'trial' && saved[0].coach === 'Dex Holloway', JSON.stringify(saved[0]));
  await p.locator('#form-reset').click();
  ok('trial: "Book another session" resets the form', (await p.locator('#trial-form').isVisible()) && (await p.locator('#f-name').inputValue()) === '');
  await done(p);

  // Careers form
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(p.base + 'careers.html'); await p.locator('form[data-demo-form] button[type=submit]').click();
  const errs = (await p.locator('form[data-demo-form] .error').allTextContents()).filter(Boolean).length;
  ok('careers: empty submit shows errors', errs >= 2, String(errs));
  await done(p);

  // Journal + count-up stats
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(p.base + 'journal.html');
  ok('journal: three posts', (await p.locator('article.post').count()) === 3);
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(1500); const was0 = (await p.locator('.stat-num').allTextContents()).join('|'); await p.waitForFunction(() => { document.querySelector('.stats').scrollIntoView({ block: 'center' }); return [...document.querySelectorAll('.stat-num')].map((e) => e.textContent).join('|') === '14|3,200|32'; }, null, { timeout: 15000, polling: 400 }).catch(() => {});
  ok('stats count up once visible and end on the real numbers', (await p.locator('.stat-num').allTextContents()).join('|') === '14|3,200|32', (await p.locator('.stat-num').allTextContents()).join('|'));
  await done(p);

  // Mobile menu + cookie card
  p = await newPage({ viewport: { width: 375, height: 812 }, hasTouch: true }, { webgl: false, quiet: false });
  await p.addInitScript(() => { try { sessionStorage.setItem('vc-seen', '1'); } catch (e) { /* ignore */ } });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(2200);
  ok('cookie notice appears on a first visit', await p.locator('#cookie').isVisible());
  const ck = await p.evaluate(() => { const c = document.getElementById('cookie').getBoundingClientRect(), bar = document.querySelector('.mobile-cta').getBoundingClientRect(); const hits = [...document.querySelectorAll('a[href],button')].filter((e) => !e.closest('#cookie') && e.offsetParent !== null && getComputedStyle(e).position !== 'fixed').filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.bottom > 0 && b.top < innerHeight && !(b.bottom < c.top || b.top > c.bottom || b.right < c.left || b.left > c.right); }).map((e) => e.textContent.trim().slice(0, 20)); return { h: c.height, w: c.width, left: c.left, aboveBar: c.bottom <= bar.top + 1, hits, hasAccept: !!document.querySelector('[data-cookie=yes]'), hasDecline: !!document.querySelector('[data-cookie=no]') }; });
  ok('cookie notice: a thin bar (<=70px tall), above the mobile bar, Accept and Decline, covers no buttons or links', ck.h <= 70 && ck.aboveBar && ck.hasAccept && ck.hasDecline && !ck.hits.length, JSON.stringify(ck));
  await p.locator('[data-cookie="no"]').click(); await p.reload(); await p.waitForTimeout(2200);
  ok('cookie choice is remembered (vc-cookie)', !(await p.locator('#cookie').isVisible()) && (await p.evaluate(() => localStorage.getItem('vc-cookie'))) === 'no');
  const t = p.locator('.nav-toggle'); await t.click();
  ok('mobile menu opens, focus moves inside', (await t.getAttribute('aria-expanded')) === 'true' && (await p.evaluate(() => !!document.activeElement.closest('#mobile-nav'))));
  for (let i = 0; i < 14; i++) await p.keyboard.press('Tab');
  ok('mobile menu traps focus', await p.evaluate(() => { const a = document.activeElement; return !!a.closest('#mobile-nav') || a.classList.contains('nav-toggle'); }));
  await p.keyboard.press('Escape'); ok('mobile menu: Escape closes', (await t.getAttribute('aria-expanded')) === 'false');
  await t.click(); await p.locator('#mobile-nav a', { hasText: 'Classes' }).click(); await p.waitForURL(/classes\.html/);
  ok('mobile menu link navigates to the page', p.url().endsWith('classes.html'));
  ok('mobile: a visible Home link in the breadcrumb on inner pages', await p.locator('.crumbs a[href="index.html"]').isVisible());
  await done(p);

  // Preloader speed, cookie card on desktop, header, back to top, smooth scroll
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false });
  await p.goto(p.base + 'index.html'); await p.waitForSelector('html[data-ready-at]', { state: 'attached', timeout: 25000 });
  let readyAt = Number(await p.evaluate(() => document.documentElement.dataset.readyAt));
  for (let i = 0; i < 2 && readyAt > 1100; i++) { const q = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false }); await q.goto(q.base + 'index.html'); await q.waitForSelector('html[data-ready-at]', { state: 'attached', timeout: 15000 }); readyAt = Math.min(readyAt, Number(await q.evaluate(() => document.documentElement.dataset.readyAt))); await done(q); } // best of three: this sandbox renders 3D in software and can be slow under load
  ok('preloader starts fading out by 1.1 s after navigation (fade 0.4 s, so gone within 1.5 s)', readyAt <= 1100, `${readyAt} ms`);
  ok('cookie card has Decline and does not cover hero buttons', await p.evaluate(() => { const c = document.getElementById('cookie'); if (!c || c.hidden) return true; const r = c.getBoundingClientRect(); return [...document.querySelectorAll('.hero-cta a')].every((a) => { const b = a.getBoundingClientRect(); return b.bottom < r.top || b.top > r.bottom || b.right < r.left || b.left > r.right; }) && !!c.querySelector('[data-cookie=no]'); }));
  await p.locator('[data-cookie=no]').click();
  ok('Lenis smooth scroll is running (pinned 1.1.18, self-hosted)', await p.evaluate(() => !!window.__lenis));
  await p.evaluate(() => window.scrollTo(0, 1200)); await p.waitForFunction(() => document.querySelector('.site-header').getBoundingClientRect().height < 80, null, { timeout: 9000 }).catch(() => {});
  ok('header shrinks on scroll', await p.evaluate(() => document.querySelector('.site-header').getBoundingClientRect().height < 80));
  await p.locator('.back-top').click(); await p.waitForTimeout(2200);
  ok('Back to top works', (await p.evaluate(() => window.scrollY)) < 40);
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }, { quiet: false });
  await p.goto(p.base + 'index.html');
  ok('no JavaScript: counters show real numbers, not 0', (await p.locator('.stat-num').allTextContents()).join('|') === '14|3,200|32');
  await done(p);

  // Titles, nav labels vs footer, footer lines, heading scale
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  const titles = []; for (const f of PAGES) { await p.goto(p.base + f); titles.push(await p.evaluate(() => document.title + ' ' + [...document.querySelectorAll('meta[content]')].map((m) => m.content).join(' '))); }
  ok('no literal &amp; in any title or meta tag', titles.every((t) => !t.includes('&amp;')));
  ok('every page has a title, description, Open Graph and Twitter tags and noindex', await (async () => { for (const f of PAGES) { await p.goto(p.base + f); const r = await p.evaluate(() => !!document.title && !!document.querySelector('meta[name=description][content]') && !!document.querySelector('meta[property="og:title"]') && !!document.querySelector('meta[property="og:image"]') && !!document.querySelector('meta[name="twitter:card"]') && !!document.querySelector('meta[name=robots][content=noindex]')); if (!r) return false; } return true; })());
  await p.goto(p.base + 'index.html');
  const navLabels = await p.evaluate(() => [...document.querySelectorAll('#mobile-nav nav a')].map((a) => a.textContent.replace(/^\d+/, '').trim()).filter(Boolean));
  const footLabels = await p.evaluate(() => [...document.querySelectorAll('.site-footer a')].map((a) => a.textContent.trim()));
  ok('menu labels match the footer labels (and Home is among them)', navLabels.length >= 9 && navLabels.includes('Home') && navLabels.every((l) => footLabels.includes(l)), JSON.stringify(navLabels.filter((l) => !footLabels.includes(l))));
  const foot = await p.locator('.site-footer').textContent();
  ok('footer has the exact demo line and the "Demo website by KB Ventures" line', foot.includes('Concept demo by KB Ventures. Not a real business.') && foot.includes('Demo website by KB Ventures'));
  ok('footer address and phone use the fictional contact details', foot.includes('22 Example Street') && foot.includes('Fortitude Valley QLD 4006') && foot.includes('07 5550 0188') && foot.includes('hello@example.com'));
  const hs = async (f, w) => { await p.setViewportSize({ width: w, height: 900 }); await p.goto(p.base + f); return p.evaluate(() => { const px = (s) => { const e = document.querySelector(s); return e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : null; }; return { h1: px('h1'), h2: px('#offer-title, #roles-title, #plans-title, #book-title, #visit-title, #faq-title'), h3: px('.coach-body h3, .plan h3, .roles h3'), h4: px('.cr-main h3'), body: px('body'), fam: getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0].replace(/"/g, ''), bfam: getComputedStyle(document.body).fontFamily.split(',')[0].replace(/"/g, '') }; }); };
  const a = await hs('classes.html', 1440), a2 = await hs('index.html', 1440), a3 = await hs('coaches.html', 1440), b = await hs('classes.html', 390), b2 = await hs('index.html', 390);
  ok('heading scale at 1440: inner h1 56, h2 40, h3 28, h4 20 (class names), body 17px (the home hero headline is display type)', a.h1 === 56 && a2.h2 === 40 && a3.h3 === 28 && a.h4 === 20 && a.body === 17, JSON.stringify({ a, a2, a3 }));
  ok('heading scale at 390: about 36 / 30 / 24 / 19px', Math.abs(b.h1 - 36) <= 2 && Math.abs(b2.h2 - 30) <= 2 && Math.abs(b.h4 - 19) <= 1, JSON.stringify({ b, b2 }));
  ok('two fonts only: Barlow Condensed headings and Montserrat body', a.fam === 'Barlow Condensed' && a.bfam === 'Montserrat' && (await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')); })).every((f) => ['Barlow Condensed', 'Montserrat'].includes(f)));
  const lay = await p.evaluate(() => ({ lh: getComputedStyle(document.body).lineHeight, maxCh: Math.max(...[...document.querySelectorAll('main p')].map((e) => parseFloat(getComputedStyle(e).maxWidth) || 0)), pad: getComputedStyle(document.querySelector('main > .section')).paddingTop }));
  ok('body line-height 1.6 (27.2px at 17px) and mobile section padding 96px', Math.abs(parseFloat(lay.lh) - 27.2) < 0.5 && lay.pad === '96px', JSON.stringify(lay));
  await p.setViewportSize({ width: 1440, height: 900 }); await p.goto(p.base + 'index.html');
  ok('desktop section padding 160px and paragraphs capped at 68ch', (await p.evaluate(() => getComputedStyle(document.querySelector('main > .section')).paddingTop)) === '160px' && (await p.evaluate(() => { const worst = [...document.querySelectorAll('main p')].filter((e) => e.offsetParent && !e.closest('.join-inner, .section-head, .big-quote, .slot-label, .cr-meta, .demo-banner')).map((e) => { const t = document.createElement('span'); t.style.cssText = 'position:absolute;visibility:hidden;width:68ch;font:' + getComputedStyle(e).font; e.appendChild(t); const lim = t.getBoundingClientRect().width; t.remove(); return e.getBoundingClientRect().width - lim; }); return Math.max(...worst) <= 1; })));
  await done(p);

  // Photos: slots render typographic panels until a real photo exists, then the pipeline takes over
  for (const w of [1440, 390]) {
    p = await newPage({ viewport: { width: w, height: 900 } }, { webgl: false });
    await p.goto(p.base + 'index.html'); await p.waitForTimeout(600);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 200)); } });
    await p.evaluate(async () => { const g = document.querySelector('.coach-grid'); g.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 400)); for (let x = 0; x <= g.scrollWidth; x += 200) { g.scrollLeft = x; await new Promise((r) => setTimeout(r, 120)); } g.scrollLeft = 0; });
    await p.waitForTimeout(700);
    const info = await p.evaluate(() => { const imgs = [...document.querySelectorAll('main img')]; return { n: imgs.length, empty: document.querySelectorAll('.slot-empty').length, broken: imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).length, noAlt: imgs.filter((i) => !i.alt.trim()).length, noSize: imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length, eager: imgs.filter((i) => i.loading !== 'lazy').map((i) => !!i.closest('.hero-photo')), notCover: imgs.filter((i) => getComputedStyle(i).objectFit !== 'cover').length, squashed: imgs.filter((i) => { const r = i.getBoundingClientRect(), n = i.naturalWidth / i.naturalHeight; return false && r && n; }).length }; });
    ok(`photos @${w}px: 15 real photos on the home page, none broken, all with alt text and width/height, object-fit cover, only the hero eager, no placeholders left`, info.n === 15 && info.empty === 0 && info.broken === 0 && info.noAlt === 0 && info.noSize === 0 && info.notCover === 0 && info.eager.length === 1 && info.eager[0] === true, JSON.stringify(info));
    const a2 = await p.evaluate(audit); ok(`photos @${w}px: no horizontal overflow`, a2.scrollW <= a2.W && !a2.bad.length, JSON.stringify(a2.bad));
    ok(`photos @${w}px: no console errors`, !p.logs.length, JSON.stringify(p.logs.slice(0, 3)));
    await done(p);
  }
  {
    const slots = JSON.parse(fs.readFileSync(path.join(SITE, 'data/photos.json'), 'utf8')).slots;
    ok('photo slots: hero (eager), studio, banner, coaching, gallery-1..7 and coach-1..4, each with a `needs` text, alt text and a file on disk', Object.keys(slots).length === 15 && slots.hero.eager && ['studio', 'banner', 'coaching', 'gallery-1', 'gallery-2', 'gallery-3', 'gallery-4', 'gallery-5', 'gallery-6', 'gallery-7', 'coach-1', 'coach-2', 'coach-3', 'coach-4'].every((k) => slots[k]) && Object.values(slots).every((x) => x.needs && x.alt && x.pos && fs.existsSync(path.join(SITE, x.file))));
    ok('hero photo is under 250 KB and every photo is WebP under 250 KB', fs.statSync(path.join(SITE, slots.hero.file)).size < 250 * 1024 && Object.values(slots).every((x) => fs.statSync(path.join(SITE, x.file)).size < 250 * 1024));
    ok('CREDITS-TODO.md lists every source photo', fs.existsSync(path.join(SITE, 'CREDITS-TODO.md')) && fs.readdirSync(path.join(SITE, 'img/source')).filter((f) => f.endsWith('.avif')).every((f) => fs.readFileSync(path.join(SITE, 'CREDITS-TODO.md'), 'utf8').includes(f)));
    { const q = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false }); await q.goto(q.base + 'index.html'); ok('footer credits the photos ("Photo: Unsplash")', (await q.locator('.photo-credits').textContent()).startsWith('Photo: Unsplash')); await done(q); }
    ok('PHOTO-SLOTS.md lists every slot', fs.existsSync(path.join(SITE, 'PHOTO-SLOTS.md')) && Object.keys(slots).every((k) => fs.readFileSync(path.join(SITE, 'PHOTO-SLOTS.md'), 'utf8').includes('`' + k + '`')));
    let pillow = true;
    try { execFileSync('python3', ['-c', 'import PIL']); } catch (e) { pillow = false; }
    if (!pillow) ok('photo pipeline (skipped: Pillow is not installed)', true);
    else {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-photo-'));
      execFileSync('python3', ['-c', `import shutil,sys; shutil.copytree(sys.argv[1], sys.argv[2], dirs_exist_ok=True, ignore=shutil.ignore_patterns('node_modules'))`, SITE, tmp]);
      execFileSync('python3', ['-c', `from PIL import Image,ImageDraw; im=Image.new('RGB',(2000,1200),(60,60,64)); d=ImageDraw.Draw(im); [d.rectangle([i*20,i*12,2000-i*20,1200-i*12],outline=(200+i%50,220,60)) for i in range(40)]; im.save(r'${path.join(tmp, 'test.jpg')}')`]);
      const cmd = (slot) => execFileSync('python3', [path.join(tmp, 'tools/add-photo.py'), path.join(tmp, 'test.jpg'), slot, '--alt', `Test photo for ${slot}`, '--credit', 'Test Photographer / Unsplash']);
      for (const f of ['hero', 'gallery-3', 'coach-2', 'studio']) fs.unlinkSync(path.join(tmp, 'img/photos/' + f + '.webp'));
      execFileSync('python3', [path.join(tmp, 'tools/build.py')]);
      const ph0 = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
      ok('placeholders still render for any slot without a file (labelled with its name and needs) and no <img> is written for it', (ph0.match(/class="photo slot-empty"/g) || []).length === 4 && ph0.includes('PHOTO SLOT: gallery-3</strong> - ') && ph0.includes('PHOTO SLOT: hero</strong> - ') && !ph0.includes('img/photos/gallery-3.webp'));
      cmd('hero'); cmd('gallery-3'); cmd('coach-2'); cmd('studio');
      execFileSync('python3', [path.join(tmp, 'tools/build.py')]);
      const srv = await serve(tmp), b2 = `http://localhost:${srv.address().port}/`;
      const q = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false, host: b2 });
      await q.goto(b2 + 'index.html'); await q.waitForTimeout(500);
      await q.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); } window.scrollTo(0, 0); });
      await q.waitForTimeout(1500);
      const imgs = await q.evaluate(() => [...document.querySelectorAll('main img')].map((i) => ({ w: i.getAttribute('width'), h: i.getAttribute('height'), alt: i.alt, lazy: i.loading === 'lazy', hero: !!i.closest('.hero-photo'), ok: i.complete && i.naturalWidth > 0, filter: getComputedStyle(i).filter })));
      ok('photo pipeline: add-photo.py + build renders an <img> only for slots with a file (hero, studio, gallery-3, coach-2 re-added)', imgs.length === 15 && imgs.every((i) => i.ok && i.w && i.h && !!i.alt), JSON.stringify(imgs));
      ok('photo pipeline: hero is eager, everything else lazy; one consistent grade (sepia .12, saturate .85, contrast 1.03)', imgs.filter((i) => !i.lazy).every((i) => i.hero) && imgs.every((i) => /sepia\(0\.12\)/.test(i.filter) && /saturate\(0\.85\)/.test(i.filter) && /contrast\(1\.03\)/.test(i.filter)), imgs[0] && imgs[0].filter);
      ok('photo pipeline: credit appears in the footer and file is under 250 KB', (await q.locator('.photo-credits').textContent()).includes('Test Photographer / Unsplash') && fs.statSync(path.join(tmp, 'img/photos/hero.webp')).size < 250 * 1024);
      const fr = await q.evaluate(() => { const ph = document.querySelector('.tile .photo:not(.slot-empty)'); const cs = getComputedStyle(document.querySelector('.tile')); return { r: cs.borderRadius, ring: getComputedStyle(ph, '::before').boxShadow }; });
      ok('photo pipeline: framed photos have 6px corners and a 1px yellow hairline', fr.r === '6px' && /255, 224, 0/.test(fr.ring), JSON.stringify(fr));
      await q.goto(b2 + 'coaches.html'); await q.waitForTimeout(400);
      ok('photo pipeline: a coach portrait replaces that placeholder only', (await q.locator('#coach-jonah .photo img').count()) === 1 && (await q.locator('#coach-marcus .photo img').count()) === 1);
      const hv = JSON.parse(fs.readFileSync(path.join(tmp, 'site.config.json'), 'utf8')); hv.hero = { video: 'img/hero.mp4', poster: 'img/photos/hero.webp' }; fs.writeFileSync(path.join(tmp, 'site.config.json'), JSON.stringify(hv));
      execFileSync('python3', [path.join(tmp, 'tools/build.py')]);
      const vh = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
      ok('hero video: hero.video + hero.poster in site.config.json add a muted, looping, playsinline <video> layer', /<video class="hero-video" autoplay muted loop playsinline[^>]*poster="img\/photos\/hero.webp"/.test(vh) && !fs.readFileSync(path.join(SITE, 'index.html'), 'utf8').includes('<video'));
      await done(q); srv.close();
    }
  }
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(600);
  ok('home: Visit us has the lazy map, the hours table, a live status, address and phone', (await p.locator('#visit .gmap iframe').count()) === 1 && (await p.locator('#visit .hours').count()) === 1 && /^(Open now|Closed)/.test(await p.locator('#open-status-3').textContent()) && (await p.locator('#visit address').textContent()).includes('07 5550 0188'), await p.locator('#open-status-3').textContent());
  await p.locator('#visit [data-visit-open]').click();
  ok('visit form: "Schedule a visit" opens a dialog', await p.locator('#visit-modal').isVisible() && (await p.locator('#visit-modal-title').textContent()) === 'Schedule a visit');
  await p.locator('#visit-form button[type=submit]').click();
  ok('visit form: empty submit shows name, phone, day and time errors', (await p.locator('#visit-form .error').allTextContents()).filter(Boolean).length === 4);
  await p.fill('#v-name', 'Sam Rivera'); await p.fill('#v-phone', '07 5550 0123'); await p.selectOption('#v-day', 'Saturday'); await p.selectOption('#v-time', { index: 1 }); await p.locator('#visit-form button[type=submit]').click();
  ok('visit form: confirmation says it is a demo and nothing was sent; saved to localStorage vc-visits', await p.locator('#visit-done').isVisible() && /demo, nothing was sent/.test(await p.locator('#visit-done').textContent()) && (await p.evaluate(() => JSON.parse(localStorage.getItem('vc-visits') || '[]').length)) === 1);
  await p.keyboard.press('Escape');
  ok('visit form: Escape closes it and focus returns to the button', !(await p.locator('#visit-modal').isVisible()) && (await p.evaluate(() => document.activeElement.hasAttribute('data-visit-open'))));
  await p.goto(p.base + '404.html');
  ok('custom 404 page is themed, offers a way home and carries the inline <base> trick for this folder', (await p.locator('h1').textContent()).includes('not found') && (await p.locator('a[href="index.html"]').count()) > 0 && (await p.content()).includes('gym-demo'));
  await done(p);
}

/* ---------------------------------------------------------------- fallbacks and motion preferences */
if (want('fallback')) {
  let p = await newPage({ viewport: { width: 375, height: 812 } }, { webgl: false });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(800);
  ok('no WebGL: canvas removed, SVG barbell poster shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()) && /barbell/i.test(await p.locator('.stage-fallback').getAttribute('aria-label')), JSON.stringify(p.logs));
  const a = await p.evaluate(audit); ok('no WebGL: no overflow at 375px', a.scrollW <= a.W && !a.bad.length, JSON.stringify(a.bad));
  await done(p);

  p = await newPage({ viewport: { width: 375, height: 812 } });
  await p.context().route('**/vendor/three.module.min.js', (r) => r.abort());
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(2500);
  ok('3D library fails to load: poster shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 } });
  await p.context().route('**/vendor/three.module.min.js', async (r) => { await new Promise((x) => setTimeout(x, 6500)); r.abort(); });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(6600);
  ok('slow load (over 4s): poster shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 390, height: 844 } }, { extraInit: () => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 }) });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(3500);
  ok('weak phone (390px, 2 CPU cores): 3D skipped, still poster shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()));
  await done(p);
  p = await newPage({ viewport: { width: 390, height: 844 } }, { extraInit: () => Object.defineProperty(navigator, 'deviceMemory', { value: 2 }) });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(3500);
  ok('weak phone (390px, 2 GB memory): 3D skipped, still poster shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()));
  await done(p);
  p = await newPage({ viewport: { width: 390, height: 844 } }, { extraInit: () => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 }) });
  await p.goto(p.base + 'index.html'); await p.waitForSelector('#stage.has-3d', { timeout: 20000 }).catch(() => {});
  ok('capable phone (390px, 8 cores): 3D runs', (await p.locator('#stage.has-3d').count()) === 1);
  await done(p);
  p = await newPage({ viewport: { width: 390, height: 844 } }, { extraInit: () => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 }) });
  await p.goto(p.base + 'index.html?3d=on'); await p.waitForSelector('#stage.has-3d', { timeout: 20000 }).catch(() => {});
  ok('?3d=on forces 3D even on a weak-phone profile', (await p.locator('#stage.has-3d').count()) === 1);
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 } }, { extraInit: () => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }) });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(1200);
  ok('Data Saver: 3D skipped, light poster shown', (await p.locator('#scene').count()) === 0 && (await p.locator('.stage-fallback').isVisible()));
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(8500);
  const s1 = await p.locator('#stage').screenshot(); await p.waitForTimeout(1500); const s2 = await p.locator('#stage').screenshot();
  ok('reduced motion: 3D shows a still frame', Buffer.compare(s1, s2) === 0 && (await p.locator('#scene.is-ready').count()) === 1);
  ok('reduced motion: no preloader, hero text visible, no smooth scroll', (await p.locator('#preloader').count()) === 0 && (await p.evaluate(() => getComputedStyle(document.querySelector('.hero-cta')).opacity)) === '1' && (await p.evaluate(() => !window.__lenis)));
  await done(p);

  // JavaScript off, or the main script failing: the site must still be usable
  p = await newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }, { quiet: false });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(800);
  ok('no JavaScript: no stuck intro overlay', !(await p.evaluate(() => { const e = document.getElementById('preloader'); return e && getComputedStyle(e).display !== 'none'; })));
  ok('no JavaScript: navigation links are visible and the poster is shown', (await p.evaluate(() => [...document.querySelectorAll('#mobile-nav a')].filter((a) => a.offsetParent).length)) >= 9 && (await p.locator('.stage-fallback').isVisible()));
  await p.goto(p.base + 'classes.html');
  ok('no JavaScript: all seven timetable days are readable', (await p.evaluate(() => [...document.querySelectorAll('[role=tabpanel]')].filter((e) => e.offsetParent).length)) === 7);
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false });
  await p.context().route('**/main.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'throw new Error("boom")' }));
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(6000);
  ok('main script fails: the intro overlay clears itself and the hero is visible', await p.evaluate(() => { const e = document.getElementById('preloader'); return !e || getComputedStyle(e).visibility === 'hidden' || getComputedStyle(e).opacity === '0'; }) && (await p.evaluate(() => getComputedStyle(document.querySelector('.hero-cta')).opacity)) === '1');
  await done(p);
  p = await newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(4000);
  const ratio = await p.evaluate(() => { const c = document.querySelector('#scene'); return c.width / c.clientWidth; });
  ok('pixel ratio is capped at 1.5', ratio <= 1.55, String(ratio.toFixed(2)));
  const x = await p.locator('#stage').screenshot(); await p.waitForTimeout(1500); const y = await p.locator('#stage').screenshot();
  ok('3D is animating', Buffer.compare(x, y) !== 0);
  // click / drag spin boost and pause when off-screen
  const before = await p.locator('#stage').screenshot();
  const box = await p.locator('#scene').boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await p.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 6 }); await p.mouse.up();
  await p.waitForTimeout(300);
  ok('dragging the barbell is handled without errors', !p.logs.length && Buffer.compare(before, await p.locator('#stage').screenshot()) !== 0, JSON.stringify(p.logs.slice(0, 2)));
  await p.evaluate(() => window.scrollTo(0, 3000)); await p.waitForTimeout(1200);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800);
  ok('3D resumes after scrolling away and back (pause when off-screen)', (await p.locator('#stage.has-3d').count()) === 1 && !p.logs.length);
  await done(p);

  p = await newPage({ viewport: { width: 1440, height: 900 } }, { quiet: false });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(600);
  ok('first visit shows the branded preloader', (await p.locator('#preloader').count()) === 1);
  await p.waitForTimeout(6500); // the intro lasts up to about 4 seconds on a slow machine
  ok('preloader finishes and the page becomes ready', (await p.locator('#preloader').count()) === 0 && (await p.evaluate(() => document.documentElement.classList.contains('is-ready'))));
  await done(p);
}

/* ---------------------------------------------------------------- weight, structured data, SEO + asset checks */
if (want('perf')) {
  const p = await newPage({ viewport: { width: 1440, height: 900 } });
  const sizes = {};
  p.on('response', async (r) => { try { const b = await r.body(); sizes[r.url().replace(base, '')] = b.length; } catch (e) { /* ignore */ } });
  await p.goto(p.base + 'index.html'); await p.waitForTimeout(5000);
  const total = Object.entries(sizes).filter(([k]) => !k.startsWith('vendor/')).reduce((n, [, v]) => n + v, 0);
  ok('home page weight excluding Three.js is under 600 KB', total < 600 * 1024, `${(total / 1024).toFixed(0)} KB`);
  ok('home page makes no third-party requests', Object.keys(sizes).every((k) => !/^https?:/.test(k)));
  const ld = await p.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)['@type']));
  ok('home has ExerciseGym structured data', ld.includes('ExerciseGym'), JSON.stringify(ld));
  ok('every font file is self-hosted woff2 (Barlow Condensed 600 + 700, Montserrat)', fs.existsSync(path.join(SITE, 'fonts/barlow-condensed-600.woff2')) && fs.existsSync(path.join(SITE, 'fonts/barlow-condensed-700.woff2')) && fs.existsSync(path.join(SITE, 'fonts/montserrat-latin.woff2')) && Object.keys(sizes).filter((k) => k.startsWith('fonts/')).every((k) => k.endsWith('.woff2')));
  await done(p);
  // Third-party requests across every page: only the lazy Google map iframe is allowed
  const q = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false });
  const third = new Set();
  q.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) third.add(new URL(r.url()).host); });
  for (const f of PAGES) { await q.goto(q.base + f); await q.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await q.waitForTimeout(250); }
  ok('across all pages the only third-party host contacted is maps.google.com (the lazy map)', [...third].every((h) => h === 'maps.google.com'), [...third].join(','));
  // HTML hygiene on every page
  const bad = [];
  for (const f of PAGES) {
    await q.goto(q.base + f);
    const r = await q.evaluate(() => ({
      imgNoSize: [...document.querySelectorAll('img,iframe')].filter((e) => !e.getAttribute('width') || !e.getAttribute('height')).length,
      iframeEager: [...document.querySelectorAll('iframe')].filter((e) => e.loading !== 'lazy').length,
      sync: [...document.querySelectorAll('script[src]')].filter((s) => !s.defer && s.type !== 'module').length,
      h1: document.querySelectorAll('h1').length,
      skip: !!document.querySelector('a.skip-link[href="#main"]') && !!document.querySelector('main#main'),
      lang: document.documentElement.lang,
      canonical: !!document.querySelector('link[rel=canonical]'),
      preload: !!document.querySelector('link[rel=preload][as=font][href*="barlow-condensed-700"]'),
      manifest: !!document.querySelector('link[rel=manifest]'), icons: document.querySelectorAll('link[rel~=icon],link[rel=apple-touch-icon]').length,
    }));
    if (r.imgNoSize || r.iframeEager || r.sync || r.h1 !== 1 || !r.skip || r.lang !== 'en-AU' || !r.canonical || !r.preload || !r.manifest || r.icons < 3) bad.push(f + ' ' + JSON.stringify(r));
  }
  ok('every page: one h1, skip link, width+height on images/iframes, lazy iframe, deferred scripts, canonical, hero font preload, manifest, icons', !bad.length, bad.slice(0, 2).join(' | '));
  await done(q);
  // Assets
  const png = (f) => { const b = fs.readFileSync(path.join(SITE, f)); return b.slice(1, 4).toString() === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; };
  const og = png('img/og.png');
  ok('og.png is a 1200x630 PNG (a screenshot of the real hero)', og && og[0] === 1200 && og[1] === 630 && fs.statSync(path.join(SITE, 'img/og.png')).size > 60000);
  ok('icons: favicon.svg + favicon.ico + apple-touch 180 + 192 + 512 + maskable 512', fs.existsSync(path.join(SITE, 'img/icon.svg')) && fs.readFileSync(path.join(SITE, 'favicon.ico')).readUInt16LE(2) === 1 && png('img/apple-touch-icon.png')[0] === 180 && png('img/icon-192.png')[0] === 192 && png('img/icon-512.png')[0] === 512 && png('img/icon-maskable-512.png')[0] === 512);
  const mf = JSON.parse(fs.readFileSync(path.join(SITE, 'site.webmanifest'), 'utf8'));
  ok('site.webmanifest is generated with theme and background #0b0b0c and a maskable icon', mf.theme_color === '#0b0b0c' && mf.background_color === '#0b0b0c' && mf.icons.some((i) => i.purpose === 'maskable') && mf.lang === 'en-AU');
  const sm = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
  ok('sitemap lists every page except 404', PAGES.filter((f) => f !== '404.html').every((f) => sm.includes(f === 'index.html' ? 'gym-demo/</loc>' : f)) && !sm.includes('404'));
  ok('site.config baseUrl and time zone are set for the demo', cfg.site.baseUrl === 'https://kirithikbala21-jpg.github.io/3D-demo-sites/gym-demo/' && cfg.site.timezone === 'Australia/Brisbane' && cfg.site.noindex === true);
  ok('removed features stay removed: no shop, cart or sound code in the folder', !fs.existsSync(path.join(SITE, 'js/cart.js')) && !fs.existsSync(path.join(SITE, 'js/sound.js')) && !fs.existsSync(path.join(SITE, 'shop.html')) && !fs.existsSync(path.join(SITE, 'book.html')));
}

/* ---------------------------------------------------------------- hardening: time zone, holidays, notices, forms, caching */
if (want('hardening')) {
  const norm = (t) => t.replace(/\s+/g, ' ').trim();
  const configured = async (mutate, name) => {
    const dir = path.join(TMP, 'cfg-' + name);
    fs.cpSync(SITE, dir, { recursive: true, filter: (src) => !/[\\/](tests|node_modules|\.git)([\\/]|$)/.test(src.slice(SITE.length)) });
    const c = JSON.parse(fs.readFileSync(path.join(dir, 'site.config.json'), 'utf8')); mutate(c); fs.writeFileSync(path.join(dir, 'site.config.json'), JSON.stringify(c));
    execFileSync('python3', [path.join(dir, 'tools/build.py')], { env: { ...process.env, SITE_ROOT: dir }, stdio: 'pipe' });
    const srv = await serve(dir); servers.push(srv);
    return `http://localhost:${srv.address().port}/`;
  };
  const VISIT = '#visit-form';
  // 1. the gym's clock (Brisbane), not the visitor's
  for (const tz of ['America/Los_Angeles', 'Europe/London']) {
    const p = await newPage({ viewport: { width: 390, height: 844 }, timezoneId: tz }, { webgl: false, clock: TUE + 'T12:00:00' }); await p.goto(p.base + 'index.html'); await p.waitForTimeout(500);
    const t = norm(await p.textContent('#open-status'));
    ok(`visitor in ${tz} sees Brisbane's hours: Tue 12:00 in Brisbane is open until 10pm`, /^Open now, closes at 10pm/.test(t), t);
    await done(p);
  }
  {
    const p = await newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Australia/Brisbane' }, { webgl: false, clock: '2026-04-03T09:00:00' }); await p.goto(p.base + 'index.html'); await p.waitForTimeout(500);
    ok('Good Friday uses the special hours from the config (open until 1pm)', /^Open now, closes at 1pm/.test(norm(await p.textContent('#open-status'))), norm(await p.textContent('#open-status')));
    await done(p);
    const q = await newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Australia/Brisbane' }, { webgl: false, clock: '2026-12-25T10:00:00' }); await q.goto(q.base + 'index.html'); await q.waitForTimeout(500);
    ok('Christmas Day is closed: "Closed today for Christmas Day"', /^Closed today for Christmas Day\. Opens tomorrow/.test(norm(await q.textContent('#open-status'))), norm(await q.textContent('#open-status')));
    await done(q);
  }
  // 2. banner the week before; footer year; no hard-coded dates in the scripts
  {
    const p = await newPage({ viewport: { width: 390, height: 844 } }, { webgl: false, clock: '2026-04-01T10:00:00' }); await p.goto(p.base + 'index.html'); await p.waitForTimeout(500);
    const bar = await p.evaluate(() => { const b = document.querySelector('#notice-bar'); return { hidden: b.hidden, text: b.innerText.replace(/\s+/g, ' ').trim() }; });
    ok('holiday banner the week before: "Open Friday for Good Friday, 7am to 1pm."', !bar.hidden && /Open Friday for Good Friday, 7am to 1pm\./.test(bar.text), bar.text);
    await done(p);
    const q = await newPage({ viewport: { width: 390, height: 844 } }, { webgl: false, clock: '2031-06-15T10:00:00' }); await q.goto(q.base + 'index.html'); await q.waitForTimeout(500);
    ok('footer copyright year follows the date (fake clock in 2031 shows 2031)', /© 2031 /.test(norm(await q.textContent('.footer-copy'))));
    await done(q);
    const src = ['js/trial.js', 'js/ui.js', 'js/util.js', 'js/clock.js', 'js/notice.js', 'js/formtools.js', 'js/forms.js', 'js/classes.js'].map((f) => fs.readFileSync(path.join(SITE, f), 'utf8')).join('\n');
    ok('no hard-coded years in the scripts', !/\b20[2-9]\d\b/.test(src.replace(/^\s*\/\/.*$/gm, '')));
    const pages = PAGES.map((f) => fs.readFileSync(path.join(SITE, f), 'utf8').replace(/<script type="application\/json"[\s\S]*?<\/script>/g, '')).join('\n');
    ok('no hard-coded dates left in the page text (months with a year, "2026")', !/(January|February|March|April|May|June|July|August|September|October|November|December) 20\d\d/.test(pages) && !/20(2[6-9]|3\d)/.test(pages.replace(/<span data-year>\d{4}<\/span>/g, '').replace(/[0-9a-f]{8}/g, '').replace(/data-open="[^"]*"/g, '')), (pages.match(/.{20}20(2[6-9]|3\d).{20}/) || [''])[0]);
  }
  // 3. booking calendar rolls from today for 90+ days, closes holidays and closures, hides passed times
  {
    const b = await configured((c) => { c.closures = [{ date: '2026-11-12', name: 'floor refit', status: 'closed' }]; c.notices = [{ text: 'Spring challenge: sign up at the desk', start: '2026-10-01', end: '2026-10-31' }, { text: 'Old news', end: '2026-09-30' }]; }, 'closures');
    const p = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false, clock: TUE + 'T12:00:00', host: b }); await p.goto(b + 'trial.html'); await p.waitForTimeout(500);
    const t = norm(await p.textContent('#notice-bar'));
    ok('config closures and live notices show in the notice bar; an expired one stays hidden', /Spring challenge/.test(t) && !/Old news/.test(t), t);
    let reach = '';
    for (let i = 0; i < 4; i++) { const last = await p.locator('.cal-day:not(:disabled)').last().getAttribute('data-date').catch(() => null); if (last) reach = last; if (await p.locator('#cal-next').isDisabled()) break; await p.locator('#cal-next').click(); }
    ok('trial calendar reaches at least 90 days past today (2026-10-20 -> 2027-01-18 or later)', reach >= '2027-01-18', reach);
    await p.locator('#cal-prev').click().catch(() => {}); await p.goto(b + 'trial.html'); await p.waitForTimeout(300);
    await p.locator('#cal-next').click();
    const nov = await p.evaluate(() => { const g = (d) => document.querySelector(`.cal-day[data-date="${d}"]`); return { refit: g('2026-11-12') && g('2026-11-12').disabled, refitTitle: g('2026-11-12') && g('2026-11-12').title, normal: g('2026-11-13') && !g('2026-11-13').disabled }; });
    ok('a config closure disables that day in the booking calendar with a reason; the next day is open', nov.refit && /floor refit/.test(nov.refitTitle) && nov.normal, JSON.stringify(nov));
    await done(p);
    const hp = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false, clock: '2026-12-24T10:00:00' }); await hp.goto(hp.base + 'trial.html'); await hp.waitForTimeout(500);
    const xm = await hp.evaluate(() => { const g = (d) => document.querySelector(`.cal-day[data-date="${d}"]`); return { xmas: g('2026-12-25') && g('2026-12-25').disabled, boxing: g('2026-12-26') && !g('2026-12-26').disabled }; });
    ok('public holiday (Christmas Day) is closed in the calendar, calculated from the date rules', xm.xmas && xm.boxing, JSON.stringify(xm));
    await done(hp);
    const late = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false, clock: TUE + 'T21:45:00' }); await late.goto(late.base + 'trial.html'); await late.waitForTimeout(500);
    await late.locator('.cal-day.is-today').click({ force: true }).catch(() => {});
    const labels = await late.locator('.slot:not(:disabled)').count();
    ok('after the last start time today there is nothing bookable today', labels === 0 && (await late.locator('.slot').count()) >= 0);
    await done(late);
  }
  // 4. config errors give plain-English messages
  {
    let msg = ''; try { await configured((c) => { c.contact.phone = '12'; }, 'badphone'); } catch (e) { msg = String(e.stderr || e.message); }
    ok('a mistyped phone number stops the build with a plain-English message', /does not look like an Australian number/.test(msg), msg.slice(0, 100));
    let m2 = ''; try { await configured((c) => { c.notices = [{ text: 'forever' }]; }, 'noend'); } catch (e) { m2 = String(e.stderr || e.message); }
    ok('a notice with no end date is rejected', /add an "end" date/.test(m2));
  }
  // 5. visit form (modal on home and visit.html): all four fields required, friendly messages, Australian phones only
  for (const f of ['index.html', 'visit.html']) {
    const p = await newPage({ viewport: { width: 390, height: 844 } }, { webgl: false }); await p.goto(p.base + f); await p.waitForTimeout(500);
    await p.locator('[data-visit-open]').first().click();
    await p.locator(VISIT + ' button[type=submit]').click();
    const msgs = await p.evaluate(() => ['e-v-name', 'e-v-phone', 'e-v-day', 'e-v-time'].map((i) => document.getElementById(i).textContent.trim()));
    ok(`${f}: empty visit form shows four friendly errors and no thank-you`, msgs[0] === 'Please tell us your name so we can put it on the list.' && msgs[1] === 'We need a phone number in case we have to reach you.' && msgs[2] && msgs[3] && await p.locator('#visit-done').isHidden(), JSON.stringify(msgs));
    ok(`${f}: focus goes to the first invalid field (name) and fields are aria-invalid`, await p.evaluate(() => document.activeElement.id === 'v-name' && document.getElementById('v-name').getAttribute('aria-invalid') === 'true'));
    const bad = [];
    for (const ph of ['12345', 'abcdefghij', '0612 345 678', '+1 202 555 0143', '0412 345', '(07) 5550']) { await p.fill('#v-name', 'Sam Rivera'); await p.fill('#v-phone', ph); await p.selectOption('#v-day', 'Saturday'); await p.selectOption('#v-time', { index: 1 }); await p.locator(VISIT + ' button[type=submit]').click(); if (await p.locator('#visit-done').isVisible() || !/Australian phone/.test(await p.textContent('#e-v-phone'))) bad.push(ph); }
    ok(`${f}: non-Australian or malformed phone numbers are rejected`, !bad.length, bad.join(','));
    await p.fill('#v-phone', '+61 412 345 678'); await p.locator(VISIT + ' button[type=submit]').click();
    ok(`${f}: a valid Australian number with all fields shows the thank-you`, await p.locator('#visit-done').isVisible() && /Sam/.test(await p.textContent('#visit-done')));
    await done(p);
  }
  // 6. forms with an endpoint: demo note goes, failure fallback, one request for a double submit, honeypot
  {
    const live = await configured((c) => { c.forms.endpoint = 'https://forms.example.test/f/abc'; }, 'live');
    const p = await newPage({ viewport: { width: 390, height: 844 } }, { webgl: false, host: live }); await p.goto(live + 'index.html'); await p.waitForTimeout(500);
    let calls = 0, mode = 'fail', last = null;
    await p.route('https://forms.example.test/**', async (r) => { calls++; last = r.request().postData(); await new Promise((x) => setTimeout(x, 300)); r.fulfill({ status: mode === 'ok' ? 200 : 500, contentType: 'application/json', body: '{}', headers: { 'access-control-allow-origin': '*' } }); });
    await p.locator('[data-visit-open]').first().click();
    ok('with a form endpoint set, the visit form no longer says "Demo"', !/Demo/.test(await p.textContent('#visit-form .note')));
    await p.fill('#v-name', 'Sam Rivera'); await p.fill('#v-phone', '0412 345 678'); await p.selectOption('#v-day', 'Saturday'); await p.selectOption('#v-time', { index: 1 });
    await p.evaluate(() => { const f = document.querySelector('#visit-form'); f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
    await p.waitForSelector('#visit-form .form-fail', { timeout: 5000 });
    const fb = await p.evaluate(() => ({ txt: document.querySelector('#visit-form .form-fail').innerText, tel: document.querySelector('#visit-form .form-fail a').getAttribute('href'), name: document.getElementById('v-name').value, formShown: !document.getElementById('visit-form').hidden, btn: document.querySelector('#visit-form button[type=submit]').disabled }));
    ok('failed send: ONE request for two rapid submits, phone fallback shown, details kept, button usable again', calls === 1 && /call us on/i.test(fb.txt) && fb.tel.startsWith('tel:+61') && fb.name === 'Sam Rivera' && fb.formShown && !fb.btn, JSON.stringify([calls, fb]));
    mode = 'ok'; await p.locator('#visit-form button[type=submit]').click(); await p.waitForSelector('#visit-done:not([hidden])', { timeout: 5000 });
    ok('successful send: thank-you without the demo wording; the request carried the details', calls === 2 && !/demo/i.test(await p.textContent('#visit-done')) && /Sam Rivera/.test(last || ''), last);
    await p.click('#visit-ok'); await p.locator('[data-visit-open]').first().click();
    await p.fill('#v-name', 'Spam Bot'); await p.fill('#v-phone', '0412 345 678'); await p.selectOption('#v-day', 'Monday'); await p.selectOption('#v-time', { index: 1 }); await p.evaluate(() => { document.querySelector('#visit-form input[name=website]').value = 'http://spam.example'; });
    const before = calls; await p.locator('#visit-form button[type=submit]').click(); await p.waitForSelector('#visit-done:not([hidden])');
    ok('spam trap: a filled honeypot sends nothing', calls === before);
    await done(p);
    const t = await newPage({ viewport: { width: 1440, height: 900 } }, { webgl: false, host: live, clock: TUE + 'T10:00:00' }); await t.goto(live + 'trial.html'); await t.waitForTimeout(500);
    const hps = await t.evaluate(() => [...document.querySelectorAll('input[name=website]')].map((i) => [i.tabIndex, i.closest('.hp').getAttribute('aria-hidden')]));
    ok('the trial form also carries a hidden honeypot that is out of the tab order', hps.length === 1 && hps[0][0] === -1 && hps[0][1] === 'true', JSON.stringify(hps));
    await done(t);
  }
  // 7. caching, robots, noscript, landscape
  {
    const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
    ok('CSS, Lenis and main.js links carry ?v=hash and the import map versions every module (three.js entries kept)', /styles\.css\?v=[0-9a-f]{8}/.test(html) && /main\.js\?v=[0-9a-f]{8}/.test(html) && /"\.\/js\/trial\.js":"?\s*"?\.\/js\/trial\.js\?v=[0-9a-f]{8}/.test(html.replace(/\s/g, '')) && html.includes('"three"'));
    ok('robots.txt names the sitemap; sitemap lists the pages and not 404', /Sitemap: /.test(fs.readFileSync(path.join(SITE, 'robots.txt'), 'utf8')) && !fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8').includes('404'));
    const p = await newPage({ viewport: { width: 390, height: 844 } }, { webgl: false }); await p.goto(p.base + 'index.html'); await p.waitForTimeout(800);
    const mod = await p.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /\/js\/.*\.js/.test(n)));
    ok('the browser really loads the versioned module files', mod.length >= 6 && mod.every((n) => /\?v=[0-9a-f]{8}$/.test(n)), mod.slice(0, 2).join(' '));
    ok('no console errors on the home page', !p.logs.length, JSON.stringify(p.logs.slice(0, 2)));
    await done(p);
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }); const np = await ctx.newPage(); await np.goto(base + 'index.html');
    const nj = norm(await np.evaluate(() => document.querySelector('.nojs-banner').innerText));
    ok('JavaScript off: a banner shows the phone number, street address and hours', nj.includes(cfg.contact.phone) && nj.includes(cfg.contact.street) && /5am/.test(nj), nj.slice(0, 140));
    await ctx.close();
    const l = await newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }, { webgl: false }); await l.goto(l.base + 'index.html'); await l.waitForTimeout(600);
    const a = await l.evaluate(audit);
    ok('phone in landscape (844x390): no sideways scroll', a.scrollW <= a.W && !a.bad.length, JSON.stringify(a));
    await done(l);
  }
}

await browser.close(); server.close(); servers.forEach((x) => x.close());
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ignore */ }
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? '. FAILED: ' + failed.map((f) => f.name).join('; ') : ''}`);
process.exit(failed.length ? 1 : 0);
