// In-page measurements added in v2.5 for what reviewers kept finding and the first probe did not see:
// pictures inside headlines and sentences, giant footers and credit walls, upscaled pictures, colour
// sprawl, drag rails, pages built from boxes, label clutter, walls of text, rows empty on the left.
// Runs once at the top of the page after the walk, so every reveal has fired. Returns plain JSON.
export function extra() {
  const W = innerWidth, H = innerHeight, D = document.documentElement, B = document.body || D;
  const sy = scrollY || 0;
  const r2 = Math.round;
  const visible = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  const inUI = (el) => !!el.closest('[data-ui], table, pre, code, form, dialog, [role=dialog], [role=table], [role=grid], svg');
  const rgb = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return p.length > 3 && p[3] < 0.5 ? null : p.slice(0, 3); };
  const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return { h, s, l }; };
  const chromatic = (c) => { if (!c) return null; const x = hsl(c); if (x.s < 0.3 || x.l < 0.12 || x.l > 0.94) return null; if (x.s * (1 - Math.abs(2 * x.l - 1)) < 0.14) return null; return x.h; };
  const groundOf = (el) => { for (let e = el; e && e !== D.parentNode; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c) return c; } return [255, 255, 255]; };
  const words = (t) => (t.trim().match(/\S+/g) || []).length;
  const textOf = (el) => (el.innerText || '').trim().replace(/\s+/g, ' ');
  const out = {};

  // --- pictures inside headlines: a photograph or clip set into the words, or letters filled with a picture
  const media = 'img, picture, video, canvas, svg image, [style*="background-image"]';
  out.imageInHeadline = [];
  for (const h of document.querySelectorAll('h1, h2, h3, [role=heading]')) {
    if (!visible(h) || inUI(h)) continue;
    const pics = [...h.querySelectorAll(media)].filter((p) => { const r = p.getBoundingClientRect(); return r.width >= 24 && r.height >= 16 && visible(p); });
    const cs = getComputedStyle(h);
    const clipped = (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') && /url\(/.test(cs.backgroundImage);
    if (pics.length || clipped) out.imageInHeadline.push({ text: textOf(h).slice(0, 60), how: clipped ? 'letters filled with a picture' : `${pics.length} picture(s) inside the heading` });
  }
  // a picture placed over a headline's line box (absolutely positioned into the words) counts too
  const heads = [...document.querySelectorAll('h1, h2')].filter((h) => visible(h) && !inUI(h)).map((h) => ({ h, r: h.getBoundingClientRect() })).filter((x) => x.r.height >= 40);
  for (const img of document.querySelectorAll('img, video')) {
    if (!visible(img) || inUI(img)) continue;
    const r = img.getBoundingClientRect();
    if (r.width * r.height > W * H * 0.2 || r.width < 40) continue; // a full picture behind a headline is the hero, not an inset
    for (const { h, r: hr } of heads) {
      if (h.contains(img)) continue;
      const ix = Math.min(r.right, hr.right) - Math.max(r.left, hr.left), iy = Math.min(r.bottom, hr.bottom) - Math.max(r.top, hr.top);
      if (ix > r.width * 0.6 && iy > r.height * 0.6 && r.height <= hr.height * 0.9) { out.imageInHeadline.push({ text: textOf(h).slice(0, 60), how: 'a small picture placed among the words' }); break; }
    }
  }

  // --- small pictures inside running text ("mini images in sentences")
  out.inlinePictures = [];
  for (const img of document.querySelectorAll('p img, p video, p picture, li img, span img, a img')) {
    if (!visible(img) || inUI(img) || img.closest('nav, header, footer, button, h1, h2, h3')) continue;
    const r = img.getBoundingClientRect(); const p = img.closest('p, li, span');
    if (!p || r.height > 120 || r.width < 18) continue;
    const t = textOf(p); if (words(t) < 4) continue; // a logo with a name is fine
    out.inlinePictures.push({ text: t.slice(0, 60), size: `${r2(r.width)}x${r2(r.height)}` });
  }

  // --- the footer: its largest type, and credits spread across it
  const foot = document.querySelector('footer') || [...B.children].filter(visible).at(-1);
  if (foot) {
    let big = { size: 0, text: '' };
    for (const el of foot.querySelectorAll('*')) { if (!el.childElementCount && textOf(el) && visible(el)) { const s = parseFloat(getComputedStyle(el).fontSize); if (s > big.size) big = { size: s, text: textOf(el).slice(0, 50) }; } }
    // a single text node can sit in an element with children (a wordmark with a span); check text nodes too
    const tw = document.createTreeWalker(foot, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const el = n.parentElement; if (!n.nodeValue.trim() || !el || !visible(el)) continue; const s = parseFloat(getComputedStyle(el).fontSize); if (s > big.size) big = { size: s, text: n.nodeValue.trim().slice(0, 50) }; }
    const creditRe = /wikimedia|openverse|flickr\.com|unsplash\.com\/@|pexels\.com\/@|creativecommons|\bCC[ -]BY|public domain|\bvia\b.*\b(commons|archive)|photo(graph)?s? by|licen[cs]ed under|\bcourtesy\b/i;
    const creditLinks = [...foot.querySelectorAll('a')].filter((a) => creditRe.test(a.href + ' ' + textOf(a)) && visible(a)).length;
    const creditText = (textOf(foot).match(new RegExp(creditRe.source, 'gi')) || []).length;
    out.footer = { size: r2(big.size), vw: +(big.size / W * 100).toFixed(1), text: big.text, creditLinks, creditMentions: creditText, words: words(textOf(foot)) };
  }

  // --- pictures shown larger than they were made (blurry upscales in big slots)
  out.upscaled = [];
  for (const img of document.querySelectorAll('img')) {
    if (!visible(img) || !img.naturalWidth || /\.svg(\?|$)/i.test(img.currentSrc || img.src)) continue;
    const r = img.getBoundingClientRect();
    if (r.width * r.height < W * H * 0.12) continue;
    const cs = getComputedStyle(img);
    // object-fit: cover shows the natural image scaled to cover the box
    const scale = cs.objectFit === 'cover' ? Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight) : cs.objectFit === 'contain' ? Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight) : r.width / img.naturalWidth;
    if (scale > 1.0) out.upscaled.push({ src: (img.currentSrc || img.src).split('/').pop().split('?')[0].slice(0, 50), shown: `${r2(r.width)}x${r2(r.height)}`, natural: `${img.naturalWidth}x${img.naturalHeight}`, scale: +scale.toFixed(2) });
  }
  for (const v of document.querySelectorAll('video')) {
    if (!visible(v) || !v.videoWidth) continue; const r = v.getBoundingClientRect();
    if (r.width * r.height < W * H * 0.2) continue;
    const scale = Math.max(r.width / v.videoWidth, r.height / v.videoHeight);
    if (scale > 1.25) out.upscaled.push({ src: (v.currentSrc || '').split('/').pop().split('?')[0].slice(0, 50), shown: `${r2(r.width)}x${r2(r.height)}`, natural: `${v.videoWidth}x${v.videoHeight}`, scale: +scale.toFixed(2), video: true });
  }

  // --- colour: the hues a visitor sees on grounds, headings and buttons, and how much page is on colour
  const bins = new Map(); let colouredArea = 0; const pageArea = W * Math.max(H, D.scrollHeight);
  const addHue = (h, why) => { if (h == null) return; const k = Math.floor(((h + 15) % 360) / 30); if (!bins.has(k)) bins.set(k, why); };
  let scanned = 0;
  for (const el of B.querySelectorAll('*')) {
    if (++scanned > 6000) break;
    if (inUI(el)) continue;
    const cs = getComputedStyle(el); const c = rgb(cs.backgroundColor); if (!c) continue;
    const r = el.getBoundingClientRect(); const a = r.width * r.height; if (a < 12000 || !visible(el)) continue;
    const h = chromatic(c);
    if (h != null) { const parent = el.parentElement ? chromatic(groundOf(el.parentElement)) : null; if (parent == null || Math.abs(parent - h) > 20) colouredArea += a; addHue(h, a > W * 200 ? 'a ground' : 'a box or button'); }
  }
  for (const el of document.querySelectorAll('h1, h2, h3, a, button')) { if (!visible(el) || inUI(el)) continue; addHue(chromatic(rgb(getComputedStyle(el).color)), 'type'); }
  out.colour = { hues: bins.size, how: [...bins.values()], colouredShare: +Math.min(1, colouredArea / pageArea).toFixed(2) };

  // --- drag rails: sideways scrollers and progress bars outside a working interface
  out.rails = [];
  scanned = 0;
  for (const el of B.querySelectorAll('div, section, ul, ol, figure, article')) {
    if (++scanned > 5000) break;
    if (inUI(el)) continue;
    const cs = getComputedStyle(el);
    if (!/(auto|scroll)/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 40 || !visible(el)) continue;
    const r = el.getBoundingClientRect(); if (r.width < W * 0.5 || r.height < 120) continue;
    out.rails.push({ what: 'a sideways scroller', size: `${r2(r.width)}x${r2(r.height)}`, text: textOf(el).slice(0, 40) });
  }
  for (const el of document.querySelectorAll('input[type=range], progress, [role=progressbar], [class*=progress i], [class*=scrollbar i], [class*=drag i]')) {
    if (inUI(el) || !visible(el)) continue; const r = el.getBoundingClientRect(); if (r.width < 120) continue;
    out.rails.push({ what: el.matches('input[type=range]') ? 'a slider' : 'a progress or drag bar', size: `${r2(r.width)}x${r2(r.height)}`, text: (el.className && String(el.className).slice(0, 40)) || '' });
    if (out.rails.length > 8) break;
  }

  // --- boxes: share of running text that sits inside a filled or outlined box
  let inBox = 0, allText = 0;
  for (const p of document.querySelectorAll('p, li, h3')) {
    if (!visible(p) || inUI(p) || p.closest('nav, header, footer')) continue;
    const t = words(textOf(p)); if (t < 4) continue; allText += t;
    for (let e = p.parentElement, d = 0; e && e !== B && d < 5; e = e.parentElement, d++) {
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      if (r.width > W * 0.8) break; // a full-width band is a section ground, not a box
      const filled = rgb(cs.backgroundColor) && String(rgb(cs.backgroundColor)) !== String(groundOf(e.parentElement || B));
      const outlined = parseFloat(cs.borderTopWidth) >= 1 && parseFloat(cs.borderLeftWidth) >= 1 && cs.borderTopStyle !== 'none';
      if ((filled || outlined) && parseFloat(cs.paddingLeft) >= 8) { inBox += t; break; }
    }
  }
  out.boxed = { share: allText ? +(inBox / allText).toFixed(2) : 0, words: allText };

  // --- labels: little standalone texts (timestamps, chips, tags, captions of two words) outside nav, footer and controls
  out.labels = [];
  for (const el of B.querySelectorAll('span, p, div, small, time, figcaption, li, dt, dd')) {
    if (el.childElementCount || !visible(el) || inUI(el) || el.closest('nav, header, footer, button, a, label, h1, h2, h3, h4, [aria-hidden=true]')) continue;
    const t = textOf(el); const n = words(t); if (!t || n > 5) continue;
    const s = parseFloat(getComputedStyle(el).fontSize); if (s > 15.5) continue;
    const r = el.getBoundingClientRect();
    out.labels.push({ text: t.slice(0, 30), y: r2(r.top + sy) });
    if (out.labels.length > 120) break;
  }

  // --- walls of text: long paragraphs, and stretches of words with nothing else in them
  out.walls = [];
  for (const p of document.querySelectorAll('p')) { if (!visible(p) || inUI(p)) continue; const n = words(textOf(p)); if (n > 70) out.walls.push({ text: textOf(p).slice(0, 50), words: n }); }

  // --- rows empty on the left: content of a band huddled in its right part, nothing on the left
  out.rightHuddled = [];
  if (W >= 1100) {
    const bands = [...document.querySelectorAll('section, main > div, body > div > div, article')].filter((s) => { const r = s.getBoundingClientRect(); return r.width >= W * 0.9 && r.height >= 220 && r.height <= H * 2.5 && visible(s); }).slice(0, 40);
    for (const s of bands) {
      const r = s.getBoundingClientRect(); const top = r.top + sy;
      const boxes = [...s.querySelectorAll('h1, h2, h3, p, img, video, a, button, li, figure')].filter(visible).map((e) => e.getBoundingClientRect()).filter((b) => b.width > 20 && b.height > 8);
      if (boxes.length < 2) continue;
      const left = Math.min(...boxes.map((b) => b.left));
      if (left > W * 0.42) out.rightHuddled.push({ y: r2(top), h: r2(r.height), from: r2((left / W) * 100), text: textOf(s).slice(0, 50) });
    }
  }
  // --- words in interfaces: sentence-long titles, and mock-ups that talk too much
  out.longTitles = [];
  for (const h of document.querySelectorAll('h1, h2, h3, h4')) { if (!visible(h)) continue; const n = words(textOf(h)); if (n > 5) out.longTitles.push({ text: textOf(h).slice(0, 60), words: n, ui: !!h.closest('[data-ui]'), level: h.tagName }); }
  out.uiWords = [...document.querySelectorAll('[data-ui]')].filter((u) => !u.parentElement?.closest('[data-ui]') && visible(u)).map((u) => ({ words: words(textOf(u)), text: textOf(u).slice(0, 40) }));
  out.sentences = [...document.querySelectorAll('p, li, td, dd, figcaption')].filter((p) => visible(p) && words(textOf(p)) > 12).length;

  // --- text inside mock-ups too small to read, placeholder contacts, notes the builder left for the client
  out.tinyUi = 0; out.placeholders = []; out.builderNotes = [];
  {
    const tw = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); let n, k = 0;
    const noteRe = /\b(until|once)\b[^.]{0,40}\b(are|is|have been|has been|get|gets)\s+(photographed|shot|supplied)|\bplaceholder (image|photo|picture|text|copy)|\bstand-?in (picture|photo|image|drawing)|\bto be replaced\b|\breplace (this|these) (picture|photo|image)s?\b|\bsample (content|copy|text)\b|\blorem ipsum\b/i;
    while ((n = tw.nextNode()) && k < 6000) {
      const t = n.nodeValue.trim(); if (!t) continue; k++;
      const el = n.parentElement; if (!el || !visible(el)) continue;
      if (el.closest('[data-ui]') && parseFloat(getComputedStyle(el).fontSize) < 11.5) out.tinyUi++;
      if (noteRe.test(t) && out.builderNotes.length < 4) out.builderNotes.push(t.slice(0, 70));
      if (/[\w.-]+@[\w-]+\.example\b|\bexample\.(com|org)\b|\b555-0\d{3}\b/i.test(t) && out.placeholders.length < 4) out.placeholders.push(t.slice(0, 50));
    }
    for (const a of document.querySelectorAll('a[href]')) { const h = a.getAttribute('href') || ''; if (/\.example\b|example\.(com|org)/i.test(h) && out.placeholders.length < 4) out.placeholders.push(h.slice(0, 50)); }
  }

  // --- breakage at narrow widths (most of the reviewed pages' high-severity faults were phone or tablet only)
  // text cut by the screen edge or by a clipping box, mock-ups included: a 520px sheet in a 390px screen reads "Sub"
  out.cutText = [];
  {
    const tw = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); let n, seen = 0;
    const clipOf = (el) => { for (let e = el.parentElement; e && e !== B; e = e.parentElement) { const cs = getComputedStyle(e); if (/(hidden|clip)/.test(cs.overflowX) || /(hidden|clip)/.test(cs.overflow)) return e; } return null; };
    while ((n = tw.nextNode()) && seen < 4000) {
      const t = n.nodeValue.trim(); if (t.length < 3) continue; seen++;
      const el = n.parentElement; if (!el || !visible(el) || el.closest('[aria-hidden=true], .marquee, [class*=marquee i], [class*=ticker i]')) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 8 || r.bottom < 0 || r.top > H * 6) continue;
        let cut = null;
        if (r.right > W + 4 || r.left < -4) cut = 'the screen edge';
        else { const c = clipOf(el); if (c) { const cr = c.getBoundingClientRect(); if (r.right > cr.right + 4 || r.left < cr.left - 4) { const scroller = /(auto|scroll)/.test(getComputedStyle(c).overflowX); if (!scroller) cut = 'a clipping box'; } } }
        if (cut) { out.cutText.push({ text: t.slice(0, 40), by: cut, ui: !!el.closest('[data-ui]') }); break; }
      }
      if (out.cutText.length >= 12) break;
    }
  }
  // text shortened with an ellipsis: the number or name that matters, cut to "$1,..."
  out.truncated = [];
  for (const el of B.querySelectorAll('*')) {
    if (out.truncated.length >= 8) break;
    const cs = getComputedStyle(el); if (cs.textOverflow !== 'ellipsis' || !visible(el)) continue;
    if (el.scrollWidth > el.clientWidth + 1) out.truncated.push({ text: textOf(el).slice(0, 40), ui: !!el.closest('[data-ui]') });
  }
  // sticky or fixed bands that eat the screen on a phone or tablet (navigation and scroll scenes excepted)
  out.stickyBands = [];
  for (const el of B.querySelectorAll('*')) {
    const cs = getComputedStyle(el); if (cs.position !== 'sticky' && cs.position !== 'fixed') continue;
    if (!visible(el) || el.closest('header, nav, [role=banner], .scene, [data-scene], dialog, [role=dialog]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width >= W * 0.8 && r.height >= H * 0.33 && r.height < H * 0.97) out.stickyBands.push({ what: textOf(el).slice(0, 40) || el.tagName.toLowerCase(), h: Math.round((r.height / H) * 100) });
    if (out.stickyBands.length >= 4) break;
  }
  // a form field set inside a headline or sentence ("Send [you@work.dev] a free key")
  out.formInSentence = [];
  for (const i of document.querySelectorAll('h1 input, h2 input, h3 input, p input, h1 select, h2 select, p select')) { if (visible(i)) out.formInSentence.push({ text: textOf(i.closest('h1, h2, h3, p')).slice(0, 50) }); }
  // a navigation at the top: links to the page's parts or a menu button
  {
    const top = [...B.querySelectorAll('a[href], button')].filter((a) => { const r = a.getBoundingClientRect(); return r.top + sy < 160 && r.bottom > 0 && visible(a) && r.width > 8; });
    const menu = top.some((b) => /menu|navigation/i.test((b.getAttribute('aria-label') || '') + ' ' + textOf(b)) || b.getAttribute('aria-expanded') != null);
    out.nav = { links: top.length, menu };
  }
  return out;
}
