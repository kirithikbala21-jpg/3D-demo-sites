// Checks for the cafe-demo (v1) growth features. Run:  cd cafe-demo && CHROME_PATH=/path/to/chromium node tests/run.mjs
// Needs tests/node_modules (playwright-core + axe-core): here a symlink to ../../cafe-demo-v2/tests/node_modules (listed in the repo .gitignore).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml' };
const servers = [];
const serve = (root) => new Promise((res) => {
  const s = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html'; fs.readFile(path.join(root, u), (e, d) => { if (e) { r.writeHead(404); r.end('nf'); return; } r.writeHead(200, { 'content-type': MIME[path.extname(u)] || 'application/octet-stream' }); r.end(d); }); }).listen(0, () => { servers.push(s); res(`http://localhost:${s.address().port}/`); });
});
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cv1-'));
const configured = async (mutate, name) => {
  const dir = path.join(TMP, name);
  fs.cpSync(SITE, dir, { recursive: true, filter: (src) => !/[\\/](tests|\.git)([\\/]|$)/.test(src.slice(SITE.length)) });
  const c = JSON.parse(fs.readFileSync(path.join(dir, 'site.config.json'), 'utf8')); mutate(c); fs.writeFileSync(path.join(dir, 'site.config.json'), JSON.stringify(c));
  return serve(dir);
};
const base = await serve(SITE);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const results = [];
const ok = (name, cond, extra = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? '  ' + extra : ''}`); };
const FAKE = (t) => { const R = Date, off = t - R.now(); class F extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } } window.Date = F; };
const at = (iso) => Date.parse(iso + '+11:00'); // Melbourne is UTC+11 in October 2026
const TUE = '2026-10-20', SAT = '2026-10-24', SUN = '2026-10-25';
const MOBILE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const NOISE = /ERR_TUNNEL|ERR_INTERNET|ERR_NAME|ERR_CONNECTION|Failed to load resource/; // fonts and Three.js come from a CDN that the sandbox blocks
async function page(opts = {}, { clock = null, host = base, tz = 'Australia/Melbourne', file = 'index.html' } = {}) {
  const ctx = await browser.newContext({ locale: 'en-AU', timezoneId: tz, ...opts });
  if (clock) await ctx.addInitScript(FAKE, at(clock));
  const p = await ctx.newPage(); p.logs = [];
  p.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) p.logs.push(m.text().slice(0, 150)); });
  p.on('pageerror', (e) => p.logs.push('pageerror: ' + e.message));
  await p.goto(host + file); await p.waitForTimeout(700);
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}.reveal{opacity:1!important;transform:none!important;transition:none!important}' });
  return p;
}
const done = (p) => p.context().close();
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
const audit = () => { const W = document.documentElement.clientWidth; const bad = []; for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.position === 'fixed') continue; const r = el.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1)) { let clipped = false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (/(hidden|auto|scroll|clip)/.test(o.overflowX)) { clipped = true; break; } } if (!clipped) bad.push(el.tagName + '.' + String(el.className).split(' ')[0]); } } return { scrollW: document.documentElement.scrollWidth, W, bad: [...new Set(bad)].slice(0, 5) }; };
const freeTime = (p, n = 0) => p.evaluate((n) => { const o = [...document.querySelectorAll('#f-time option')].filter((x) => x.value && !/full/.test(x.textContent))[n]; document.querySelector('#f-time').value = o.value; document.querySelector('#f-time').dispatchEvent(new Event('change', { bubbles: true })); return o.textContent; }, n);
async function axe(p) { await p.evaluate(AXE); return p.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['color-contrast', 'label', 'button-name', 'link-name', 'image-alt', 'aria-valid-attr', 'aria-required-attr'] }); return r.violations.map((v) => v.id + ' x' + v.nodes.length + ' ' + v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')); }); }

/* ---------- 1. basics at 390 and 1440 ---------- */
for (const [label, o] of [['390px', MOBILE], ['1440px', DESKTOP]]) {
  for (const file of ['index.html', 'reviews.html', '404.html']) {
    const p = await page(o, { clock: TUE + 'T12:00:00', file });
    const a = await p.evaluate(audit);
    const small = await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.offsetParent !== null && !e.closest('[hidden]') && parseFloat(getComputedStyle(e).fontSize) < 12 && !e.closest('svg')).map((e) => e.className + ' ' + getComputedStyle(e).fontSize).slice(0, 3));
    const broken = await p.evaluate(() => [...document.images].filter((i) => i.offsetParent && (!i.complete || !i.naturalWidth)).length);
    ok(`${file} @${label}: no sideways scroll, no broken images, no text under 12px, no JavaScript errors`, a.scrollW <= a.W && !a.bad.length && !broken && !small.length && !p.logs.length, JSON.stringify([a, small, p.logs]));
    if (o === MOBILE) {
      const tap = await p.evaluate(() => [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,summary')].filter((e) => { const r = e.getBoundingClientRect(); const lab = e.tagName === 'INPUT' && e.closest('label') ? e.closest('label').getBoundingClientRect() : r; return r.width && e.offsetParent !== null && !e.closest('[hidden],.sr-only,.hp,p,li:not([class]),address') && getComputedStyle(e).display !== 'inline' && lab.height < 43.5; }).map((e) => (e.className || e.tagName) + ' h' + Math.round(e.getBoundingClientRect().height)).slice(0, 5));
      ok(`${file} @390px: every button and control is at least 44px tall`, !tap.length, JSON.stringify(tap));
    }
    if (file !== '404.html') { const v = await axe(p); ok(`${file} @${label}: no contrast, label or name problems (axe)`, !v.length, v.join(' || ')); }
    await done(p);
  }
}

/* ---------- 8. open banner from config hours in the café's time zone ---------- */
{
  const cases = [[TUE + 'T12:00:00', 'Open now · until 4:00pm'], [TUE + 'T06:30:00', 'Closed · opens 7:00am today'], [TUE + 'T17:00:00', 'Closed · opens 7:00am tomorrow'], [SAT + 'T21:00:00', 'Open now · until 10:00pm'], [SAT + 'T22:30:00', 'Closed · opens 8:00am tomorrow'], [SUN + 'T16:30:00', 'Closed · opens 7:00am tomorrow']];
  const bad = [];
  for (const [t, want] of cases) { const p = await page(MOBILE, { clock: t }); const got = [norm(await p.textContent('#open-status')), norm(await p.textContent('#open-status-2'))]; if (got.some((g) => g !== want)) bad.push(`${t}: ${got.join(' / ')}`); await done(p); }
  ok('open banner (hero and visit): Open now / Closed, opens ... from config hours, including tomorrow and late nights', !bad.length, bad.join(' | '));
  const q = await page(MOBILE, { clock: TUE + 'T12:00:00', tz: 'America/Los_Angeles' });
  ok('a visitor in Los Angeles still sees the café\'s Melbourne hours', norm(await q.textContent('#open-status')) === 'Open now · until 4:00pm'); await done(q);
  const p = await page(DESKTOP, { clock: SAT + 'T10:00:00' });
  const row = await p.evaluate(() => { const r = document.querySelector('.hours tr.is-today'); return r && r.innerText.replace(/\s+/g, ' '); });
  ok('hours table is built from config and marks today (Saturday 7:00am – 10:00pm)', /Saturday/.test(row || '') && /7:00am – 10:00pm/.test(row || '') && /today/i.test(row || ''), row); await done(p);
}

/* ---------- 1. Google review button, QR page, print ---------- */
{
  const p = await page(MOBILE, { clock: TUE + 'T12:00:00' });
  const r = await p.evaluate(() => ({ sec: !document.querySelector('#review-us').hidden, btn: document.querySelector('#review-us-btn').href, foot: document.querySelector('#footer-review').href, footTarget: document.querySelector('#footer-review').target, footRel: document.querySelector('#footer-review').rel }));
  ok('"Loved your visit? Tell us" section and the footer "Leave us a Google review" button use googleReviewUrl (new tab, noopener)', r.sec && r.btn === 'https://g.page/r/DEMO/review' && r.foot === r.btn && r.footTarget === '_blank' && /noopener/.test(r.footRel), JSON.stringify(r));
  await done(p);
  const q = await page(DESKTOP, { file: 'reviews.html' });
  const vis = await q.evaluate(() => ({ svg: !!document.querySelector('#qr-box svg'), label: document.querySelector('#qr-box svg').getAttribute('aria-label'), w: document.querySelector('#qr-box svg').getBoundingClientRect().width, scan: document.querySelector('.qr-scan').textContent, btn: document.querySelector('#print-btn').textContent }));
  ok('reviews.html shows a large QR code, "Scan to leave a review" and a Print button', vis.svg && vis.w >= 280 && vis.scan === 'Scan to leave a review' && vis.btn === 'Print this' && /QR code/.test(vis.label), JSON.stringify(vis));
  await q.locator('#qr-box').screenshot({ path: path.join(TMP, 'qr.png') });
  let decoded = ''; try { decoded = execFileSync('python3', ['-c', `import cv2,sys;im=cv2.imread(sys.argv[1]);im=cv2.copyMakeBorder(im,40,40,40,40,cv2.BORDER_CONSTANT,value=(255,255,255));print(cv2.QRCodeDetector().detectAndDecode(im)[0])`, path.join(TMP, 'qr.png')]).toString().trim(); } catch (e) { decoded = 'decoder unavailable: ' + String(e.message).slice(0, 60); }
  ok('the QR code on the page decodes to googleReviewUrl', decoded === 'https://g.page/r/DEMO/review', decoded);
  await q.emulateMedia({ media: 'print' });
  const pv = await q.evaluate(() => { const shown = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; }; return { header: shown('.site-header'), footer: shown('.site-footer'), btns: shown('#print-btn'), note: shown('.note'), eyebrow: shown('.eyebrow'), h1: shown('#rv-title'), qr: shown('#qr-box svg'), scan: shown('.qr-scan') }; });
  ok('print view shows only the heading and the QR code (with "Scan to leave a review")', pv.h1 && pv.qr && pv.scan && !pv.header && !pv.footer && !pv.btns && !pv.note && !pv.eyebrow, JSON.stringify(pv));
  await done(q);
}

/* ---------- 3 and 5. social links and rating badge ---------- */
{
  const p = await page(MOBILE, { clock: TUE + 'T12:00:00' });
  const s = await p.evaluate(() => { const links = [...document.querySelectorAll('#footer-social a')].map((a) => [a.getAttribute('aria-label'), a.target, a.rel, a.getBoundingClientRect().width]); const btns = [...document.querySelectorAll('#visit-links a')].map((a) => a.textContent.trim()); return { links, btns }; });
  ok('footer icon links (Google Maps, Instagram) have accessible labels, open in a new tab with noopener and are 44px+; Facebook is hidden while empty', s.links.length === 2 && s.links.every((l) => /opens in a new tab/.test(l[0]) && l[1] === '_blank' && /noopener/.test(l[2]) && l[3] >= 44) && !s.links.some((l) => /Facebook/.test(l[0])), JSON.stringify(s.links));
  ok('contact section has "Find us on Google Maps" and "Follow us on Instagram" buttons', s.btns.some((b) => /Find us on Google Maps/.test(b)) && s.btns.some((b) => /Follow us on Instagram/.test(b)) && !s.btns.some((b) => /Facebook/.test(b)), s.btns.join(' | '));
  const g = await p.evaluate(() => ['#hero-rating', '#footer-rating'].map((sel) => { const a = document.querySelector(sel + ' a'); return a && { text: a.innerText.replace(/\s+/g, ' '), href: a.href, target: a.target, w: a.querySelector('clipPath rect').getAttribute('width'), stars: a.querySelectorAll('svg path').length }; }));
  ok('rating badge in the hero and footer: "Rated 4.9 on Google · 120 reviews", 5 SVG stars filled 98%, Demo number note, links to googleMapsUrl in a new tab', g.every((x) => x && /Rated 4\.9 on Google · 120 reviews Demo number/.test(x.text) && x.target === '_blank' && /google\.com\/maps/.test(x.href) && Math.round(Number(x.w)) === 98 && x.stars === 10), JSON.stringify(g));
  await done(p);
}

/* ---------- 7. best time to come ---------- */
{
  const p = await page(DESKTOP, { clock: TUE + 'T10:00:00' });
  const b = await p.evaluate(() => ({ line: document.querySelector('#busy-visit .busy-line').textContent, res: document.querySelector('#busy-line').textContent, cols: document.querySelectorAll('#busy-visit svg rect[fill-opacity]').length, today: document.querySelectorAll('#busy-visit svg rect[stroke-width="2"]').length, legend: document.querySelector('.busy-legend').textContent }));
  ok('best-time block: "Usually quiet on ..." line, 7-day SVG strip with today outlined, always "usually/typically", never live', /^Usually quiet on \w+ (mornings|at )/.test(b.line) && b.res === b.line && b.cols >= 20 && b.today === 1 && /Usually quiet/.test(b.legend) && /not live/.test(b.legend), JSON.stringify(b));
  await done(p);
}

/* ---------- 2 and 6. reservation: reminders and waitlist ---------- */
{
  const p = await page(DESKTOP, { clock: TUE + 'T10:00:00' });
  await p.locator('#reserve-form').scrollIntoViewIfNeeded();
  await p.click('#reserve-form .btn-block[type=submit]');
  ok('reservation form: empty submit shows the friendly errors (name, email, date) and no success', (await p.isVisible('#e-name')) && /Please tell us your name/.test(await p.textContent('#e-name')) && /Pick a date/.test(await p.textContent('#e-date')) && await p.isHidden('#form-success'));
  await p.fill('#f-name', 'Sam Lee'); await p.fill('#f-email', 'sam@example.com'); await p.fill('#f-date', '2026-10-27');
  const times = await p.evaluate(() => [...document.querySelectorAll('#f-time option')].map((o) => o.textContent));
  ok('time list follows the config hours (Tue 7:00am to 3:00pm, last table an hour before close) in 30-minute steps', times[1] === '7:00am' && /^3:00pm/.test(times[times.length - 1]) && times.length === 18, `${times.length} ${times[1]}..${times[times.length - 1]}`);
  const rm = await p.evaluate(() => ({ present: !!document.querySelector('.rm-field'), consent: (document.querySelector('.rm-consent') || {}).textContent, hidden: document.querySelector('.rm-contact').hidden, none: document.querySelector('input[name=rm-mode][value=none]').checked }));
  ok('"Remind me" control (None default, Email, Text) with the consent line; the contact field is hidden until chosen', rm.present && rm.none && rm.hidden && rm.consent === 'We will only use this to send your reminder.', JSON.stringify(rm));
  await freeTime(p, 2);
  await p.locator('.rm-choice', { hasText: 'Email' }).click();
  ok('choosing Email shows an email field', await p.isVisible('#rm-contact') && (await p.getAttribute('#rm-contact', 'type')) === 'email');
  await p.fill('#rm-contact', 'not-an-email'); await p.click('#reserve-form .btn-block[type=submit]');
  ok('invalid reminder email is rejected with a clear message and nothing is submitted', /valid email/.test(await p.textContent('#rm-err')) && await p.isHidden('#form-success'));
  await p.locator('.rm-choice', { hasText: 'Text' }).click();
  await p.fill('#rm-contact', '0312345678'); await p.click('#reserve-form .btn-block[type=submit]');
  ok('a landline is not accepted for text reminders (Australian mobile needed)', /mobile number/.test(await p.textContent('#rm-err')) && await p.isHidden('#form-success'));
  await p.fill('#rm-contact', '0412 345 678'); await p.click('#reserve-form .btn-block[type=submit]'); await p.waitForTimeout(300);
  const okTxt = norm(await p.textContent('#form-success'));
  ok('valid submit: confirmation says "Reminder set for Monday 26 October, 9am (by text)." and is still marked as a demo', /Reminder set for Monday 26 October, 9am \(by text\)\./.test(okTxt) && /Demo only: no email was sent/.test(okTxt) && /at \d+:\d\d(am|pm)/.test(okTxt), okTxt.slice(0, 220));
  await p.click('#form-reset');
  await p.fill('#f-name', 'Sam Lee'); await p.fill('#f-email', 'sam@example.com'); await p.fill('#f-date', '2026-10-27'); await freeTime(p, 1); await p.click('#reserve-form .btn-block[type=submit]'); await p.waitForTimeout(300);
  ok('with "None" chosen the confirmation has no reminder line', await p.isHidden('#ok-remind'));
  await p.click('#form-reset');
  // waitlist on a full time (Saturday lunch is always full in the demo)
  await p.fill('#f-name', 'Sam Lee'); await p.fill('#f-email', 'sam@example.com'); await p.fill('#f-date', SAT);
  const full = await p.evaluate(() => [...document.querySelectorAll('#f-time option')].filter((o) => /full, join the waitlist/.test(o.textContent)).map((o) => o.value + ':' + o.textContent));
  ok('some Saturday times are marked "full, join the waitlist" (demo pattern)', full.length >= 2, full.join(' | '));
  await p.selectOption('#f-time', '720');
  ok('picking a full time shows "Join the waitlist" with the consent line', await p.isVisible('.wl .wl-form') && /We will only contact you if a spot opens\./.test(await p.textContent('.wl')) && /12:00pm on Saturday 24 October is full/.test(await p.textContent('.wl-note')));
  await p.click('#reserve-form .btn-block[type=submit]');
  ok('the reservation cannot be sent for a full time', /full/.test(await p.textContent('#e-time')) && await p.isHidden('#form-success'));
  await p.click('.wl .wl-btn');
  ok('waitlist form: empty name and contact show errors', /tell us your name/.test(await p.textContent('.wl-err[data-for=name]')) && /mobile number or an email/.test(await p.textContent('.wl-err[data-for=contact]')));
  await p.fill('#wl-name', 'Sam'); await p.fill('#wl-contact', 'abc'); await p.click('.wl .wl-btn');
  ok('waitlist form: an invalid contact is rejected', /does not look like/.test(await p.textContent('.wl-err[data-for=contact]')));
  await p.fill('#wl-contact', 'sam@example.com'); await p.click('.wl .wl-btn');
  const wl = norm(await p.textContent('.wl-done'));
  ok('waitlist confirmation: "You\'re on the waitlist for Saturday 24 October, 12pm", marked as a demo', /You're on the waitlist for Saturday 24 October, 12pm/.test(wl) && /demo/.test(wl), wl);
  await done(p);
}

/* ---------- 4. click and collect, end to end ---------- */
{
  const p = await page(MOBILE, { clock: TUE + 'T12:00:00' });
  const bar = norm(await p.textContent('#order-bar'));
  ok('menu shows an Add button on every item (38) and the demo notice "orders are not sent anywhere"', (await p.locator('.add-btn').count()) === 38 && /not sent anywhere/.test(bar), bar.slice(0, 120));
  await p.locator('.add-btn').nth(0).click(); await p.locator('.add-btn').nth(0).click(); await p.locator('.add-btn').nth(2).click();
  const pill = norm(await p.textContent('#cart-pill'));
  ok('floating order pill shows the count and total (3 items)', /Pickup order · 3 · \$/.test(pill), pill);
  await p.click('#cart-pill');
  ok('cart drawer opens as a modal dialog with focus inside', await p.isVisible('#cart-drawer') && (await p.evaluate(() => document.querySelector('#cart-drawer').contains(document.activeElement))));
  const t0 = await p.evaluate(() => ({ rows: document.querySelectorAll('.cart-row').length, total: document.querySelector('.cart-total strong').textContent, qty: document.querySelector('.cart-row output').textContent }));
  await p.click('[data-inc]'); const t1 = await p.textContent('.cart-total strong'); await p.click('[data-dec]'); await p.click('[data-dec]'); const t2 = await p.evaluate(() => [document.querySelector('.cart-total strong').textContent, document.querySelector('.cart-row output').textContent]);
  ok('cart: items, quantity + and -, running total ($5.50 x2 + $6.50 = $17.50, then +1, then back to 1)', t0.rows === 2 && t0.total === '$17.50' && t0.qty === '2' && t1 === '$23.00' && t2[0] === '$12.00' && t2[1] === '1', JSON.stringify([t0, t1, t2]));
  const opts = await p.evaluate(() => [...document.querySelectorAll('#oc-time option')].map((o) => o.textContent));
  const steps = opts.map((t) => { const m = /^(\d+):(\d+)(am|pm)/.exec(t); return (Number(m[1]) % 12 + (m[3] === 'pm' ? 12 : 0)) * 60 + Number(m[2]); });
  ok('pickup times: every 10 minutes, first at least 15 minutes ahead (12:20pm at 12:00), last before closing (3:50pm)', opts[0] === '12:20pm' && opts[opts.length - 1] === '3:50pm' && steps.every((m, i) => i === 0 || m - steps[i - 1] === 10), `${opts[0]}..${opts[opts.length - 1]} (${opts.length})`);
  await p.click('#order-form button[type=submit]');
  ok('place order with empty name and phone: friendly errors, no order', /tell us your name/.test(await p.textContent('#oc-name-e')) && /Australian phone/.test(await p.textContent('#oc-phone-e')) && await p.isHidden('#order-done'));
  await p.fill('#oc-name', 'Sam Lee'); await p.fill('#oc-phone', '12345'); await p.click('#order-form button[type=submit]');
  ok('an invalid phone is rejected', /Australian phone/.test(await p.textContent('#oc-phone-e')));
  // survives a reload
  await p.fill('#oc-phone', '0412 345 678'); await p.keyboard.press('Escape');
  ok('Escape closes the drawer and returns focus to the button that opened it', await p.isHidden('#cart-drawer') && (await p.evaluate(() => document.activeElement.id)) === 'cart-pill');
  await p.reload(); await p.waitForTimeout(800);
  ok('the cart survives a reload (sessionStorage)', /Pickup order · 2 · \$12\.00/.test(norm(await p.textContent('#cart-pill'))));
  await p.click('#cart-pill');
  const saved = await p.evaluate(() => [document.querySelector('#oc-name').value, document.querySelector('#oc-phone').value]);
  ok('typed name and phone are kept after the reload', saved[0] === 'Sam Lee' && saved[1] === '0412 345 678', saved.join('|'));
  await p.click('#order-form button[type=submit]'); await p.waitForSelector('#order-done', { timeout: 4000 });
  const conf = norm(await p.textContent('#cart-drawer'));
  ok('confirmation: fake order number (EO-####), pickup time, "Pay in store", total and the demo note', /Order EO-\d{4}/.test(conf) && /Pay in store/.test(conf) && /Pickup today at 12:20pm/.test(conf) && /\$12\.00/.test(conf) && /not sent anywhere, the number is fake and no payment was taken/.test(conf), conf.slice(0, 260));
  await p.click('#cart-drawer [data-close]');
  ok('after placing the order the cart is empty and the pill is gone', await p.isHidden('#cart-pill') && (await p.evaluate(() => sessionStorage.getItem('eo-cart'))) === '{}');
  const v = await axe(p); ok('menu and drawer pass the contrast checks', !v.length, v.join(' || '));
  await done(p);
  const q = await page(MOBILE, { clock: TUE + 'T16:30:00' });
  await q.locator('.add-btn').first().click(); await q.click('#cart-pill');
  const closed = await q.evaluate(() => [document.querySelector('#oc-time optgroup').label, document.querySelector('#oc-time option').textContent, document.querySelector('#order-form .hint').textContent]);
  ok('when the café is closed, pickup times roll to the next opening day (Tomorrow from 7:00am)', closed[0] === 'Tomorrow' && closed[1] === '7:00am' && /closed for pick-ups right now/.test(closed[2]), JSON.stringify(closed));
  await done(q);
}

/* ---------- features switch off completely when their config value is empty ---------- */
{
  const off = await configured((c) => { c.googleReviewUrl = ''; c.googleRating = 0; c.instagramUrl = ''; c.googleMapsUrl = ''; c.orderingEnabled = false; c.remindersEnabled = false; c.waitlistEnabled = false; c.busyness = { blocks: [], week: {} }; }, 'off');
  const p = await page(DESKTOP, { clock: SAT + 'T10:00:00', host: off });
  await p.fill('#f-date', SAT); await p.selectOption('#f-time', '720');
  const r = await p.evaluate(() => ({ review: !document.querySelector('#review-us').hidden, footBtn: !document.querySelector('#footer-review').hidden, rating: !!document.querySelector('#hero-rating a') || !document.querySelector('#hero-rating').hidden, social: !document.querySelector('#footer-social').hidden || !document.querySelector('#visit-links').hidden, add: document.querySelectorAll('.add-btn').length, bar: !document.querySelector('#order-bar').hidden, pill: !!document.querySelector('#cart-pill'), rm: !!document.querySelector('.rm-field'), wl: !!document.querySelector('.wl'), busy: !document.querySelector('#busy-visit').hidden || !document.querySelector('#busy-line').hidden }));
  ok('with every value empty or switched off nothing is shown: no review section or button, badge, social links, Add buttons, reminders, waitlist or best-time block', Object.values(r).every((v) => !v), JSON.stringify(r));
  await done(p);
  const q = await page(DESKTOP, { host: off, file: 'reviews.html' });
  ok('reviews.html with no googleReviewUrl shows a "not set up" message instead of a QR code', await q.isVisible('#qr-off') && !(await q.locator('#qr-box svg').count()));
  await done(q);
  const c = await configured((c) => { c.phone = '03 9999 0000'; c.street = '99 Test Lane'; c.hours = c.hours.map((h) => ({ ...h, close: '18:00' })); }, 'edit');
  const e = await page(DESKTOP, { clock: TUE + 'T12:00:00', host: c });
  const d = await e.evaluate(() => ({ tel: [...new Set([...document.querySelectorAll('a[href^=tel]')].map((a) => a.getAttribute('href')))].join(), addr: document.querySelector('address').innerText, status: document.querySelector('#open-status').textContent }));
  ok('editing site.config.json changes the phone number (every link), the address and the hours with no other edits', d.tel === 'tel:+61399990000' && /99 Test Lane/.test(d.addr) && /until 6:00pm/.test(d.status), JSON.stringify(d));
  await done(e);
}

await browser.close(); servers.forEach((s) => s.close());
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ignore */ }
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
