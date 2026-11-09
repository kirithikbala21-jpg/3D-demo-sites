#!/usr/bin/env node
// tasteskill / scenes — photograph every scroll scene on a page at exact points of its progress.
//
//   node scenes.mjs <url | path/to/file.html> [--out DIR] [--steps 10] [--scene "#id"] [--wait 900]
//
// For each <section class="scene"> (references/scenes.md): the screen before it, 0, 10, … 100% of its
// hold, and the screen after it, on desktop (1440x900), a tablet (768x1024: the desktop plan on its
// narrowest screen) and a phone (390x844), as labelled contact sheets; then the reduced-motion page
// screen by screen. Prints each scene's height in screens, frame timing while the page is wheeled
// through its scenes, and console errors. Read every sheet it writes.
//
// At every step of a hold it also measures what the sheets show (rule 4 and rule 2 of the scenes):
//   scene-crosses-words  something that moves in the scene lies on more than 10% of a line of visible
//                        words (opacity over 0.25): a card over a heading, an ink edge through a line,
//                        two statements drawn over each other. Looked for at each step and three times
//                        in the second after the scroll reaches it, so a swap that runs on a timer is
//                        caught too (those moments are saved as <scene>-<width>-crossing-N.jpg). Words
//                        a moving ground covers whole are hidden, not crossed; a wipe that covers or
//                        uncovers them within one step is a page turn. Words on words always count, and
//                        so does an edge through words printed twice (the same words recoloured on the
//                        moving layer). A problem.
//   dead-hold            nothing visible changes for 30% or more of the hold. A warning.
//   end-frame            a line of display text (30px or more) is cut by the edge of the screen at 100%.
//                        A warning.
// A scene file may document a deliberate pass over words in its header, with the moving parts in
// backticks:   // crosses words: `.ws-echo` for one beat, as the letter drops
// A documented pass is not a problem while it lasts two steps or less and is over by 100%, or while it
// only recolours the words.
//
// Exit code 0 = every scene ran and crosses no words; 1 = a scene never started, fell back to rest on
// desktop, crossed its own words, or the page logged errors. Zero dependencies: drives an installed
// Chrome/Edge/Chromium. Node 22+.
import { existsSync, mkdirSync, statSync, createReadStream, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join, dirname, extname, sep, relative } from 'node:path';
import { createServer } from 'node:http';
import { Browser, sleep } from './lib/cdp.mjs';

const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf('--' + k); if (i === -1) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const outDir = resolve(flag('out', '.taste-skill/scenes'));
const STEPS = Math.max(2, +flag('steps', 10)), WAIT = +flag('wait', 900);
const STILL = 0.015;   // under 1.5% of the pixels changed between two steps: nothing visible happened
const only = flag('scene', '');
const target = args[0];
if (!target || target.startsWith('--')) { console.error('usage: node scenes.mjs <url | file.html> [--out DIR] [--steps 10] [--scene "#id"] [--wait 900]'); process.exit(2); }

// A local file is served from 127.0.0.1 (the working directory when the file is inside it, else the
// file's folder), so relative assets and CDN scripts behave as they will when the page is hosted.
let url = target, server = null;
if (!/^https?:\/\//.test(target)) {
  const file = resolve(target);
  if (!existsSync(file)) { console.error('No such file: ' + file); process.exit(2); }
  const cwd = resolve('.');
  // serve from high enough that the page's ../ references resolve (a scene demo loads ../stage.js)
  const ups = Math.max(0, ...[...readFileSync(file, 'utf8').matchAll(/(?:src|href)\s*=\s*["']((?:\.\.\/)+)/g)].map((m) => m[1].length / 3));
  let base = dirname(file); for (let i = 0; i < ups; i++) base = dirname(base);
  const root = file.startsWith(cwd + sep) && (base === cwd || base.startsWith(cwd + sep)) ? cwd : base;
  const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2' };
  server = createServer((req, res) => {
    try {
      let f = resolve(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
      if (f !== root && !f.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
      if (statSync(f).isDirectory()) f = join(f, 'index.html');
      res.writeHead(200, { 'content-type': MIME[extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      createReadStream(f).pipe(res);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${server.address().port}/${relative(root, file).split(sep).map(encodeURIComponent).join('/')}`;
}
mkdirSync(outDir, { recursive: true });
const browser = await Browser.launch();
const helper = await browser.newPage({ width: 1600, height: 1000 });
const problems = [], warnings = [];

async function sheet(frames, labels, cellW, cellH, cols, path) {
  const rows = Math.ceil(frames.length / cols);
  await helper.setViewport({ width: cols * cellW, height: rows * (cellH + 22), dsf: 1 });
  await helper.eval((a) => {
    document.body.style.cssText = `margin:0;background:#777;display:grid;grid-template-columns:repeat(${a.cols},${a.cellW}px);font:12px/22px system-ui;color:#fff`;
    document.body.innerHTML = a.frames.map((s, i) => `<figure style="margin:0"><img src="data:image/jpeg;base64,${s}" style="width:${a.cellW}px;height:${a.cellH}px;display:block;outline:1px solid #777"><figcaption style="padding-left:6px;background:#111">${a.labels[i]}</figcaption></figure>`).join('');
    return Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  }, { frames, labels, cellW, cellH, cols });
  await helper.screenshot({ path, quality: 78 });
}

// The share of pixels that change between one frame and the next, measured on a 96px-wide thumbnail and
// at the best match within two of its pixels, so JPEG noise, a hairline and a slow drift of the same
// picture do not count as change: what a juror sees as "new".
async function changes(frames) {
  return helper.eval(async (list) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = 'data:image/jpeg;base64,' + s; });
    const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
    const out = []; let prev = null;
    for (const s of list) {
      const img = await load(s); if (!img) { out.push(1); prev = null; continue; }
      c.width = 96; c.height = Math.round((96 * img.height) / img.width);
      x.drawImage(img, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      if (prev && prev.length === d.length) {
        // the best match within two thumbnail pixels: a slow drift of the same picture is nothing new
        const w = c.width, h = c.height; let best = 1;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          let n = 0, all = 0;
          for (let y = Math.max(0, dy); y < Math.min(h, h + dy); y++) for (let x = Math.max(0, dx); x < Math.min(w, w + dx); x++) {
            const i = (y * w + x) * 4, j = ((y - dy) * w + (x - dx)) * 4; all++;
            if (Math.max(Math.abs(d[i] - prev[j]), Math.abs(d[i + 1] - prev[j + 1]), Math.abs(d[i + 2] - prev[j + 2])) > 40) n++;
          }
          best = Math.min(best, n / all);
        }
        out.push(best);
      } else if (prev) out.push(1);
      prev = d;
    }
    return out;
  }, frames);
}

// In the page, at one moment of a held scene. Notes every element of the scene and whether it has moved
// (position, transform, clip-path) or faded since the first look, then samples each line of visible words
// with hit-testing: what is painted on top of them there, and is it part of the scene? Everything is kept
// in window.__look, so verdict() can tell afterwards which of the things on top were moving.
function look(a) {
  const W = innerWidth, H = innerHeight;
  const root = document.querySelectorAll(a.sel)[a.index];
  if (!root) return { candidate: false };
  if (a.reset || !window.__look) window.__look = { els: [], state: [], op: [], moved: [], faded: [], hits: [], cut: [], vis: {}, finals: [] };
  const L = window.__look;
  if (a.final) L.finals.push(a.k);
  const vis = (L.vis[a.k] = {});
  const num = (s) => s.replace(/-?\d*\.?\d+(e-?\d+)?/g, (n) => String(Math.round(+n * 100) / 100));
  const op = new Map();
  const effOp = (el) => { if (!el || el.nodeType !== 1) return 1; if (op.has(el)) return op.get(el); const v = +getComputedStyle(el).opacity * effOp(el.parentElement); op.set(el, v); return v; };
  const id = (el) => (el.__look ?? (el.__look = L.els.push(el) - 1));
  // 1. where every element of the scene is: its own layout box, transform, clip-path and opacity
  for (const el of root.querySelectorAll('*')) {
    const i = id(el), cs = getComputedStyle(el);
    let box = '';
    if (el instanceof HTMLElement) box = [el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight].join(',');
    else if (el instanceof SVGGraphicsElement) { try { const b = el.getBBox(); box = [b.x, b.y, b.width, b.height].map(Math.round).join(',') + (el.getAttribute('transform') || ''); } catch {} }
    const st = box + '|' + num(cs.transform + cs.translate + cs.rotate + cs.scale) + '|' + num(cs.clipPath) + '|' + cs.display;
    const o = Math.round(+cs.opacity * 100) / 100;
    if (L.state[i] === undefined) { L.state[i] = st; L.op[i] = o; if (!a.reset) L.moved[i] = 1; }
    else { if (L.state[i] !== st) L.moved[i] = 1; if (Math.abs(L.op[i] - o) > 0.05) L.faded[i] = 1; }
  }
  // 2. the lines of visible words: grouped by their block (a heading, a paragraph, a split line)
  const blockOf = (el) => { for (let e = el; e && e !== root; e = e.parentElement) { const d = getComputedStyle(e).display; if (!/^inline/.test(d) && d !== 'contents') return e; } return el; };
  const words = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  // one text is the other, or the other with a letter or two missing (accents and case aside)
  const same = (p, q) => {
    const bare = (s) => s.normalize('NFD').replace(/[̀-ͯ\s]/g, '').toLowerCase();
    p = bare(p); q = bare(q);
    if (p.length < q.length) [p, q] = [q, p];
    if (!q.length || q.length < p.length * 0.6) return false;
    let i = 0; for (const ch of p) if (ch === q[i]) i++;
    return i === q.length;
  };
  // the words of a line as the reader sees them: the parts not masked away, in reading order, a space
  // where the glyphs leave a gap, and a second copy lying on the first (an animation copy) once
  const showing = (r) => {
    const x = (r.l + r.r) / 2, y = (r.t + r.b) / 2;
    return x < 0 || y < 0 || x >= W || y >= H || document.elementsFromPoint(x, y).some((e) => e === r.P || r.P.contains(e));
  };
  const say = (rects) => {
    let s = '', last = null; const used = new Set();
    for (const r of rects.filter(showing).sort((p, q) => p.l - q.l)) {
      const raw = r.n.nodeValue, t = raw.replace(/\s+/g, ' ').trim();
      if (used.has(r.n) || (last && t === last.t && r.l < last.r - 2)) continue;
      used.add(r.n);
      s += (last && (r.l - last.r > r.fs * 0.15 || /^\s/.test(raw) || last.space) ? ' ' : '') + t;
      last = { t, r: r.r, space: /\s$/.test(raw) };
    }
    return s.length > 60 ? s.slice(0, 56).replace(/\s+\S*$/, '') + ' …' : s;
  };
  const srOnly = (el) => { for (let p = el, i = 0; p && p !== root && i < 5; p = p.parentElement, i++) { const cs = getComputedStyle(p), r = p.getBoundingClientRect(); if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(cs.clipPath) || (r.width <= 2 && r.height <= 2 && cs.overflow !== 'visible')) return true; } return false; };
  const blocks = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim() || !n.parentElement) continue;
    const P = n.parentElement, cs = getComputedStyle(P);
    if (cs.visibility !== 'visible' || effOp(P) <= 0.25) continue;
    const ink = (cs.color.match(/\(([^)]+)\)/)?.[1] || '').split(/[,\s/]+/).filter(Boolean);
    if (ink.length === 4 && +ink[3] < 0.1 && parseFloat(cs.webkitTextStrokeWidth || '0') === 0) continue;
    if (srOnly(P)) continue;
    const B = blockOf(P), fs = parseFloat(cs.fontSize);
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 2 || r.height < 4) continue;
      if (!blocks.has(B)) blocks.set(B, []);
      blocks.get(B).push({ l: r.left, t: r.top, r: r.right, b: r.bottom, fs, P, n });
    }
  }
  // A cut-out picture (a PNG tree, a product on no ground) hides nothing where it is transparent: read its
  // alpha there, through its object-fit (same-origin pictures; anything unreadable counts as solid).
  const alphas = (window.__lookAlpha = window.__lookAlpha || new Map());
  const clearAt = (img, x, y) => {
    const src = img.currentSrc || img.src;
    if (/\.jpe?g(\?|#|$)|^data:image\/jpeg/i.test(src) || !img.naturalWidth) return false;
    if (!alphas.has(src)) {
      try {
        const k = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
        alphas.set(src, { k, w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data });
      } catch { alphas.set(src, null); }
    }
    const m = alphas.get(src); if (!m) return false;
    const r = img.getBoundingClientRect(), fit = getComputedStyle(img).objectFit, nw = img.naturalWidth, nh = img.naturalHeight;
    let sx = r.width / nw, sy = r.height / nh;
    if (fit === 'contain' || fit === 'scale-down') sx = sy = Math.min(sx, sy, fit === 'scale-down' ? 1 : Infinity);
    else if (fit === 'cover') sx = sy = Math.max(sx, sy);
    else if (fit === 'none') sx = sy = 1;
    const u = (x - r.left - (r.width - nw * sx) / 2) / sx, v = (y - r.top - (r.height - nh * sy) / 2) / sy;
    if (u < 0 || v < 0 || u >= nw || v >= nh) return true;
    const px = Math.min(m.w - 1, Math.floor(u * m.k)), py = Math.min(m.h - 1, Math.floor(v * m.k));
    return m.d[(py * m.w + px) * 4 + 3] < 77;
  };
  // Does the element found on top paint anything at this point? A transparent layout box hides nothing.
  const paints = (e, x, y) => {
    if (e.tagName === 'IMG') return clearAt(e, x, y) ? '' : 'solid';
    if (/^(VIDEO|CANVAS|IFRAME|PICTURE|OBJECT|EMBED)$/.test(e.tagName)) return 'solid';
    if (e instanceof SVGElement && e.ownerSVGElement) return /^(text|tspan|textPath)$/.test(e.tagName) ? 'text' : 'solid';
    const cs = getComputedStyle(e);
    if (cs.backgroundImage !== 'none') return 'solid';
    const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/); const parts = m ? m[1].split(/[,\s/]+/).filter(Boolean) : [];
    if (parts.length && (parts.length < 4 || parseFloat(parts[3]) > 0.15)) return 'solid';
    for (const c of e.childNodes) {
      if (c.nodeType !== 3 || !c.nodeValue.trim()) continue;
      range.selectNodeContents(c);
      for (const r of range.getClientRects()) if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return 'text';
    }
    return '';
  };
  // Hit-testing skips pointer-events: none and inert parts (a ghost copy usually is both); open them up
  // while sampling.
  const hit = document.createElement('style');
  hit.textContent = '*, *::before, *::after { pointer-events: auto !important; }';
  document.head.appendChild(hit);
  const inert = [...root.querySelectorAll('[inert]')];
  for (const e of inert) e.inert = false;
  let candidate = false;
  for (const [B, rects] of blocks) {
    const b = id(B);
    // one line = the rects of this block whose middles sit at one height
    const lines = [];
    for (const r of rects.sort((p, q) => p.t - q.t || p.l - q.l)) {
      const ln = lines.find((x) => Math.abs((x.t + x.b) / 2 - (r.t + r.b) / 2) < Math.min(x.b - x.t, r.b - r.t) / 2);
      if (ln) { ln.l = Math.min(ln.l, r.l); ln.r = Math.max(ln.r, r.r); ln.t = Math.min(ln.t, r.t); ln.b = Math.max(ln.b, r.b); ln.fs = Math.max(ln.fs, r.fs); ln.ps.add(r.P); ln.rects.push(r); }
      else lines.push({ ...r, ps: new Set([r.P]), rects: [r] });
    }
    lines.forEach((ln, li) => {
      const vl = Math.max(0, ln.l), vr = Math.min(W, ln.r), vt = Math.max(0, ln.t), vb = Math.min(H, ln.b);
      if (vr - vl < 4 || vb - vt < 4) return;
      const nx = Math.max(2, Math.min(16, Math.round((vr - vl) / Math.max(12, ln.fs * 0.7))));
      const ys = ln.fs >= 40 ? [0.3, 0.5, 0.7] : [0.3, 0.7];   // two heights at least: an edge can run along a line
      // the words show at a point when the element holding them is hit there (a mask or a clip-path
      // that hides them takes them out of the hit-test)
      const holds = (e) => { for (let x = e; x && x !== B.parentElement; x = x.parentElement) if (ln.ps.has(x)) return true; return false; };
      let seen = 0, twin = false; const cover = new Map(), shown = new Set();
      for (let i = 0; i < nx; i++) for (const fy of ys) {
        const x = vl + ((vr - vl) * (i + 0.5)) / nx, y = vt + (vb - vt) * fy;
        if (!ln.rects.some((r) => x >= r.l - 1 && x <= r.r + 1 && y >= r.t - 1 && y <= r.b + 1)) continue;   // a gap between words set apart
        const stack = document.elementsFromPoint(x, y);
        const at = stack.find(holds);
        if (!at) continue;
        seen++;
        for (let e = at; e && e !== B.parentElement; e = e.parentElement) if (ln.ps.has(e)) { shown.add(e); break; }
        // what lies on the words here: words, or a ground (a card, a picture) that hides them, perhaps
        // with words of its own on it
        let first = null, how1 = '', solid = null;
        for (const e of stack) {
          if (B.contains(e) || e.contains(B)) break;          // the words are on top
          if (!root.contains(e) || effOp(e) < 0.25) continue;
          let how = paints(e, x, y);
          if (!how) continue;
          if (how === 'text') {
            // two letters of one word set apart (on an arc, in a scatter) touching: the word's own spacing
            if (words(e).length <= 2 && words(B).length <= 2 && (e.parentElement === B.parentElement || e.parentElement?.parentElement === B.parentElement?.parentElement)) continue;
            // the same words printed in another colour on a layer above (an ink wipe, a front copy of a
            // wordmark that has lost a letter to the animation): a recolour; elsewhere, an echo of the
            // same words stacked on them (a strained wordmark): part of the one word, not a crossing
            const tb = blockOf(e), r1 = tb.getBoundingClientRect(), r2 = B.getBoundingClientRect();
            if (same(words(tb), words(B))) { if (Math.abs(r1.left - r2.left) < 6 && Math.abs(r1.top - r2.top) < 6) how = 'twin'; else continue; }
          }
          if (!first) { first = e; how1 = how; }
          if (how === 'solid') { solid = e; break; }
        }
        if (first) {
          if (how1 === 'twin') twin = true;
          const k = id(solid || first) + ':' + (solid ? 'solid' : how1); cover.set(k, (cover.get(k) || 0) + 1);
        }
      }
      if (seen >= 2) vis[b] = (vis[b] || 0) + 1;
      if (a.end && ln.fs >= 30 && seen) {
        // cut by a side of the screen; by the top or bottom only on a held stage (a flow layout scrolls)
        const out = { left: -ln.l, right: ln.r - W, top: -ln.t, bottom: ln.b - H };
        const held = (() => { for (let e = B; e && e !== document.body; e = e.parentElement) if (/sticky|fixed/.test(getComputedStyle(e).position)) return true; return false; })();
        const side = Object.keys(out).filter((s) => out[s] > Math.max(4, ln.fs * 0.12) && (held || s === 'left' || s === 'right'));
        if (side.length) {
          // the characters of this line that are on screen, … for the ones that are not
          let shows = '';
          const tw = document.createTreeWalker(B, NodeFilter.SHOW_TEXT);
          for (let n = tw.nextNode(); n; n = tw.nextNode()) for (let c = 0; c < n.nodeValue.length; c++) {
            const ch = n.nodeValue[c];
            if (/\s/.test(ch)) { shows += ' '; continue; }
            range.setStart(n, c); range.setEnd(n, c + 1);
            const r = range.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
            if (!r.width || cy < ln.t || cy > ln.b) continue;
            shows += cx >= 0 && cx <= W && cy >= 0 && cy <= H ? ch : '\u0000';
          }
          shows = shows.replace(/\s+/g, ' ').replace(/(\s*\u0000\s*)+/g, ' … ').trim();
          if (/[^\s…]/.test(shows)) L.cut.push({ text: say(ln.rects), shows, side: side.join(' and '), size: Math.round(ln.fs) });
        }
      }
      if (!cover.size || seen < 2) return;
      const covers = [...cover].map(([k, c]) => { const [d, how] = k.split(':'); return [+d, how, c]; });
      L.hits.push({ k: a.k, step: a.step, b, li, n: seen, covers, text: say(ln.rects) || words(B).slice(0, 60), twin });
      const all = covers.reduce((s, c) => s + c[2], 0), over = covers.filter((c) => c[1] === 'text').reduce((s, c) => s + c[2], 0);
      if (all / seen > 0.1 && (over / seen > 0.1 || all / seen < 0.95)) candidate = true;
    });
  }
  hit.remove();
  for (const e of inert) e.inert = true;
  // hold this moment still while it is photographed as evidence (thaw() lets it run on)
  if (candidate && a.freeze) {
    if (window.gsap) gsap.globalTimeline.pause();
    window.__frozen = document.getAnimations().filter((x) => x.playState === 'running');
    for (const x of window.__frozen) x.pause();
    return { candidate, frozen: true };
  }
  return { candidate };
}

// In the page, after the last look at a scene: which of the things lying on words moved during the hold
// (relative to the words: a card and its own caption moving together do not count), and what to report.
function verdict(a) {
  const L = window.__look;
  if (!L) return { crossings: [], cut: [] };
  const desc = (el) => el.tagName.toLowerCase() + (el.classList && el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  const chain = (from, stop) => { const c = []; for (let e = from; e && e !== stop; e = e.parentElement) c.push(e); return c; };
  const lca = (p, q) => { for (let e = p; e; e = e.parentElement) if (e.contains(q)) return e; return null; };
  const memo = new Map();
  // the element that carries the move: the highest moving or fading element between the cover and the
  // ancestor it shares with the words; null when the cover does not move against the words
  const mover = (d, b) => {
    const key = d + ':' + b; if (memo.has(key)) return memo.get(key);
    const D = L.els[d], B = L.els[b], top = lca(D, B);
    let m = null;
    for (const e of chain(D, top)) if (L.moved[e.__look] || L.faded[e.__look]) m = e;
    if (!m && chain(B, top).some((e) => L.moved[e.__look])) m = D;   // the words slide under it
    memo.set(key, m); return m;
  };
  // what the moving parts cover of one sampled line: how much, how much of it with words lying directly
  // on the words, and whether the moving layer carries the same words in place (a recolour)
  const cov = (h) => {
    let all = 0, text = 0; const by = new Set();
    for (const [d, how, c] of h.covers) { const m = mover(d, h.b); if (!m) continue; all += c; if (how === 'text') text += c; by.add(m); }
    return { all: all / h.n, text: text / h.n, twin: h.twin && all > 0, by };
  };
  const crosses = (c) => c.all > 0.1 && (c.text > 0.1 || c.all < 0.95);
  // A wipe is a page turn, not a crossing: a ground or picture (no words on words, no recolour) covers
  // clear words whole within one step, or uncovers them within one step; a sweep that runs on a timer
  // while the scene settles may also end with the words gone. Where the words stand at each settled
  // step: gone, clear, partly covered, wholly covered, or crossed in a way no wipe excuses.
  const state = (b, f) => {
    const lines = (L.vis[f] || {})[b] || 0;
    if (!lines) return 'gone';
    const cs = L.hits.filter((x) => x.k === f && x.b === b).map(cov);
    if (cs.some((c) => crosses(c) && (c.text > 0.1 || c.twin))) return 'over';
    if (cs.some(crosses)) return 'part';
    return cs.filter((c) => c.all >= 0.95).length >= lines ? 'whole' : 'clear';
  };
  const F = L.finals, at = (b, i) => (i < 0 || i >= F.length ? 'end' : state(b, F[i]));
  const wipe = (b, i) => at(b, i) === 'part' && ((at(b, i - 1) === 'clear' && at(b, i + 1) === 'whole') || (at(b, i - 1) === 'whole' && at(b, i + 1) === 'clear'));
  const excused = (h, c) => {
    if (c.text > 0.1 || c.twin) return false;
    const i = F.indexOf(h.k);
    if (i >= 0) return wipe(h.b, i);
    // while the scene settles on a step: the sweep runs between two settled steps
    const j = F.findIndex((f) => f > h.k); if (j < 0) return false;
    const before = at(h.b, j - 1), after = at(h.b, j);
    return /whole|gone/.test(after) || (/whole|gone/.test(before) && after === 'clear') || wipe(h.b, j) || wipe(h.b, j - 1);
  };
  const found = new Map();
  for (const h of L.hits) {
    const c = cov(h);
    if (!crosses(c) || excused(h, c)) continue;
    const key = h.text || '(words)';
    if (!found.has(key)) found.set(key, { text: key, steps: new Map(), by: new Set(), max: 0, documented: true, twin: true });
    const f = found.get(key);
    f.steps.set(h.step, h.k);
    f.max = Math.max(f.max, c.all);
    if (!c.twin) f.twin = false;
    for (const m of c.by) { f.by.add(desc(m)); if (!a.passes.some((s) => { try { return m.closest(s); } catch { return false; } })) f.documented = false; }
  }
  return {
    crossings: [...found.values()].map((f) => ({ text: f.text, steps: [...f.steps.keys()], probes: [...new Set(f.steps.values())], by: [...f.by].slice(0, 3), max: Math.round(f.max * 100), documented: f.documented && a.passes.length > 0, twin: f.twin })),
    cut: L.cut,
  };
}

// The moving parts a scene file says may pass over words: "// crosses words: `.sel` why" in its header.
const PASSES = (kind) => `(async () => { const s = [...document.scripts].find((s) => s.src && new URL(s.src).pathname.endsWith('/' + ${JSON.stringify(kind)} + '.js')); if (!s) return []; try { const t = await (await fetch(s.src)).text(); return [...t.matchAll(/^\\s*\\/\\/\\s*crosses words:(.*)$/gim)].flatMap((m) => [...m[1].matchAll(/\`([^\`]+)\`/g)].map((x) => x[1])); } catch { return []; } })()`;

const SCENES = `[...document.querySelectorAll(${JSON.stringify(only || 'section.scene, .scene[data-scene]')})].map((el, i) => { const r = el.getBoundingClientRect(); return { id: el.id || el.dataset.scene || ('scene-' + (i + 1)), index: i, kind: el.dataset.scene || '', top: Math.round(r.top + scrollY), height: Math.round(r.height), live: el.classList.contains('is-live'), rest: el.classList.contains('is-rest') }; })`;
const SEL = only || 'section.scene, .scene[data-scene]';
const go = (y) => `(() => { const y = ${y}; if (window.Stage && Stage.lenis) Stage.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); })()`;
const rel = (p) => relative(process.cwd(), p).split('\\').join('/');

async function run(label, vp) {
  const page = await browser.newPage(vp);
  await page.goto(url, { timeoutMs: 40000, settleMs: 1200 });
  await page.eval('document.fonts.ready.then(() => true)').catch(() => {});
  await sleep(500);
  const scenes = await page.eval(SCENES);
  if (!scenes.length) console.log(`${label}: no <section class="scene"> on the page`);
  const H = vp.height;
  for (const sc of scenes) {
    if (!sc.live && !sc.rest) problems.push(`${label} ${sc.id}: never started (stage.js, the scene file or Stage.init() missing)`);
    if (label === 'desktop' && sc.rest) problems.push(`${label} ${sc.id}: shows its finished composition instead of running (GSAP not loaded, or the scene threw)`);
    const frames = [], labels = [];
    const span = Math.max(0, sc.height - H);
    const pct = (k) => `${Math.round((k / STEPS) * 100)}%`;
    const points = [{ y: Math.max(0, sc.top - H * 0.5), l: 'before' }, ...Array.from({ length: STEPS + 1 }, (_, k) => ({ y: sc.top + (span * k) / STEPS, l: pct(k), k })), { y: sc.top + span + H * 0.6, l: 'after' }];
    const held = span >= H * 0.5 && !sc.rest;
    const passes = held ? await page.eval(PASSES(sc.kind)).catch(() => []) : [];
    const evidence = new Map();
    let n = 0;
    for (const p of points) {
      await page.eval(go(Math.round(p.y))).catch(() => {});
      const t0 = Date.now();
      if (held && p.k !== undefined) {
        // three looks while the scene settles on this step (a swap on a timer runs now), then the step
        for (const at of [90, 240, 480].filter((t) => t < WAIT - 120)) {
          await sleep(Math.max(0, t0 + at - Date.now()));
          const r = await page.eval(look, { sel: SEL, index: sc.index, k: n, step: p.k ? `${pct(p.k - 1)}→${p.l}` : `→${p.l}`, reset: n === 0, freeze: evidence.size < 8 }).catch(() => null);
          if (r?.frozen) {
            evidence.set(n, await page.screenshot({ quality: 72 }));
            await page.eval(`(() => { if (window.gsap) gsap.globalTimeline.resume(); for (const x of window.__frozen || []) x.play(); window.__frozen = null; })()`).catch(() => {});
          }
          n++;
        }
      }
      await sleep(Math.max(0, t0 + WAIT - Date.now()));
      if (held && p.k !== undefined) { await page.eval(look, { sel: SEL, index: sc.index, k: n, step: p.l, reset: n === 0, final: true, end: p.k === STEPS }).catch(() => null); n++; }
      frames.push(await page.screenshot({ quality: 72 }));
      labels.push(`${sc.id} ${p.l}`);
    }
    const cw = vp.width >= 1000 ? 480 : 240, ch = Math.round((cw * H) / vp.width);
    const path = join(outDir, `${sc.id}-${label}.jpg`);
    await sheet(frames, labels, cw, ch, vp.width >= 1000 ? 4 : 7, path);
    console.log(`${label.padEnd(8)} ${sc.id}: ${(sc.height / H).toFixed(1)} screens tall, ${sc.live ? 'running' : sc.rest ? 'finished composition' : 'not started'} → ${rel(path)}`);
    if (!held) continue;
    const where = `${label} ${sc.id}`;
    // scene-crosses-words: anything moving lying on the words, at a step or while it settles
    const v = await page.eval(verdict, { passes }).catch((e) => ({ crossings: [], cut: [], error: e.message }));
    // one entry per moving part, naming the words it lies on and when
    const groups = new Map();
    for (const c of v.crossings) {
      // a documented pass is fine while it is brief, or while it only recolours the words (the moving
      // layer prints the same words in place, so every glyph stays whole on its own ground)
      const finals = c.steps.filter((s) => !s.includes('→'));
      const brief = finals.length <= 2 && !finals.includes('0%') && !finals.includes('100%');
      const ok = c.documented && (brief || c.twin);
      const key = c.by.join(', ') + (ok ? ' (documented)' : '');
      if (!groups.has(key)) groups.set(key, { by: c.by.join(', '), ok, documented: c.documented, list: [], probes: [] });
      const g = groups.get(key);
      g.list.push({ s: `"${c.text}" at ${c.steps.join(', ')} (${c.max}% of a line)`, held: finals.length, n: c.steps.length });
      g.probes.push(...c.probes);
    }
    for (const g of groups.values()) {
      // the lines crossed at a step the sheet shows first, then the longest crossings
      g.list = g.list.sort((p, q) => (q.held > 0) - (p.held > 0) || q.n - p.n).map((x) => x.s);
      const shots = [];
      for (const k of new Set(g.probes)) if (evidence.has(k) && shots.length < 2) { const f = join(outDir, `${sc.id}-${label}-crossing-${k}.jpg`); writeFileSync(f, Buffer.from(evidence.get(k), 'base64')); shots.push(rel(f)); }
      const msg = `scene-crosses-words: ${g.by} lies on ${g.list.slice(0, 3).join('; ')}${g.list.length > 3 ? `; and ${g.list.length - 3} more line(s)` : ''}${shots.length ? ` → ${shots.join(', ')}` : ''}`;
      if (g.ok) console.log(`         documented pass: ${msg}`);
      else problems.push(`${where}: ${msg}${g.documented ? ' (documented in the scene file, but not brief)' : ''}`);
    }
    // end-frame: a display line the edge of the screen cuts at 100%
    for (const c of v.cut.slice(0, 3)) warnings.push(`${where}: end-frame at 100%: "${c.text}" (${c.size}px) runs past the ${c.side} edge${c.shows ? `, the screen shows "${c.shows}"` : ''}`);
    // dead-hold: the longest run of steps in which nothing visible changes
    const diff = await changes(frames.slice(1, STEPS + 2)).catch(() => []);
    let best = [0, 0];
    for (let i = 0, run = 0; i < diff.length; i++) { run = diff[i] < STILL ? run + 1 : 0; if (run > best[1]) best = [i + 1 - run, run]; }
    if (best[1] / STEPS >= 0.3) warnings.push(`${where}: dead-hold from ${pct(best[0])} to ${pct(best[0] + best[1])}: nothing visible changes for ${Math.round((best[1] / STEPS) * 100)}% of the hold`);
    // SCENES_DEBUG=1 prints the change between steps; =2 also keeps the raw frames
    if (process.env.SCENES_DEBUG) { console.log(`         changes ${diff.map((d) => (d * 100).toFixed(1)).join(' ')}${v.error ? '  verdict error: ' + v.error : ''}`); if (process.env.SCENES_DEBUG === '2') frames.forEach((f, i) => writeFileSync(join(outDir, `raw-${sc.id}-${label}-${i}.jpg`), Buffer.from(f, 'base64'))); }
  }
  if (label === 'desktop' && scenes.length) {
    // frame timing while the page is wheeled through its scenes
    await page.eval(go(Math.max(0, scenes[0].top - H))).catch(() => {});
    await sleep(400);
    await page.eval(`(() => { window.__f = []; let last = performance.now(); const tick = (t) => { window.__f.push(t - last); last = t; if (window.__f.length < 600) requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()`);
    await page.wheel(Math.min(scenes.reduce((a, s) => a + s.height, 0), 9000), { step: 120, pauseMs: 16 });
    await sleep(600);
    const f = await page.eval('window.__f.slice(2)');
    const sorted = f.slice().sort((a, b) => a - b);
    console.log(`smoothness: ${f.length} frames, median ${(sorted[Math.floor(f.length / 2)] || 0).toFixed(1)} ms, ${f.filter((d) => d > 34).length} over 34 ms (headless timing is rough; a handful is normal)`);
  }
  if (page.consoleErrors?.length) { problems.push(`${label} console: ${page.consoleErrors.slice(0, 3).join(' | ')}`); }
  await page.close();
}

try {
  await run('desktop', { width: 1440, height: 900, dsf: 1 });
  await run('tablet', { width: 768, height: 1024, dsf: 1 });
  await run('phone', { width: 390, height: 844, dsf: 1, mobile: true });
  const rp = await browser.newPage({ width: 1440, height: 900, dsf: 1, reducedMotion: true });
  await rp.goto(url, { timeoutMs: 40000, settleMs: 1200 });
  const h = await rp.eval('document.documentElement.scrollHeight');
  const frames = [], labels = [];
  for (let y = 0, k = 0; y < h && k < 16; y += 900, k++) { await rp.eval(`window.scrollTo(0, ${y})`); await sleep(350); frames.push(await rp.screenshot({ quality: 70 })); labels.push(`reduced motion, screen ${k + 1}`); }
  await sheet(frames, labels, 360, 225, 4, join(outDir, 'reduced-desktop.jpg'));
  console.log(`reduced  ${frames.length} screens → ${rel(join(outDir, 'reduced-desktop.jpg'))}`);
  await rp.close();
} finally {
  await browser.close();
  if (server) server.close();
}
if (problems.length || warnings.length) {
  console.log('\nPROBLEMS');
  for (const p of problems) console.log('  ' + p);
  for (const w of warnings) console.log('  WARN ' + w);
  const ids = (s) => problems.concat(warnings).some((p) => p.includes(s));
  if (ids('scene-crosses-words')) console.log('  → scene-crosses-words: nothing passes over words while they are read (references/scenes.md rule 4). Let the words leave before the moving part reaches them, keep its path and its resting place clear of them, or end its edge outside the copy.');
  if (ids('dead-hold')) console.log('  → dead-hold: a hold with nothing new to show is cut, not padded (rule 2). Shorten the hold so the last beat lands near 90%, or give the still stretch a beat.');
  if (ids('end-frame')) console.log('  → end-frame: the rest frame shows the line whole (rule 4). Fit it to the screen, set it on two lines, or end the move where the whole line reads.');
}
console.log(problems.length ? `\nRESULT: ${problems.length} problem(s)${warnings.length ? `, ${warnings.length} warning(s)` : ''}. Fix them, then look at every sheet.` : warnings.length ? `\nRESULT: every scene ran, ${warnings.length} warning(s): fix them or be able to defend them. Then look at every sheet.` : '\nRESULT: every scene ran. Now look at every sheet: does each frame read, and is the scene as bold as it should be?');
process.exit(problems.length ? 1 : 0);
