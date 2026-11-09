// tasteskill / type-deal — deal a type system from library/fonts.json.
//
// A model asked to choose type picks one big grotesk and one small grotesk every time. Here the script
// deals the kind of pairing, the faces, the weights, the case and the scale, all at random within what
// suits the tone, and avoids the faces of recent builds. Weights come from the font catalogues, so the
// sheet never asks for a weight a face does not have.

// How often each kind of pairing is dealt, by tone. Measured on professional and award sites: most set
// one sans family; about one in five pairs a serif with a sans; a characterful display face over a plain
// text face is the commonest way a page gets a voice.
const KINDS = {
  'sans-solo':         { w: 26, display: ['neo', 'humanist', 'geometric'], text: 'same', tones: { technical: 2, quiet: 1.4, editorial: 0.6, luxury: 0.5, playful: 0.6 } },
  'display-over-sans': { w: 22, display: ['display-sans', 'condensed', 'wide'], text: ['neo', 'humanist'], tones: { bold: 2, playful: 1.6, quiet: 0.4, luxury: 0.4 } },
  'serif-over-sans':   { w: 18, display: ['serif-display'], text: ['neo', 'humanist', 'geometric'], tones: { luxury: 1.8, editorial: 1.6, warm: 1.4, technical: 0.4 } },
  'serif-solo':        { w: 8,  display: ['serif-text'], text: 'same', tones: { editorial: 2.4, quiet: 1.4, luxury: 1.4, technical: 0.2, bold: 0.3 } },
  'sans-over-serif':   { w: 8,  display: ['neo', 'display-sans', 'geometric'], text: ['serif-text'], tones: { editorial: 1.8, warm: 1.4, technical: 0.4 } },
  'serif-pair':        { w: 4,  display: ['serif-display'], text: ['serif-text'], tones: { editorial: 2, luxury: 1.6, technical: 0.1, bold: 0.3 } },
  'slab':              { w: 5,  display: ['slab'], text: ['neo', 'humanist', 'same'], tones: { warm: 1.6, technical: 1.2, luxury: 0.2 } },
  'rounded':           { w: 4,  display: ['rounded'], text: ['same', 'neo', 'humanist'], tones: { playful: 3, warm: 1.4, luxury: 0.1, editorial: 0.2, technical: 0.3 } },
  'wide-solo':         { w: 3,  display: ['wide'], text: ['neo'], tones: { bold: 2, technical: 1.4, quiet: 0.3, warm: 0.4 } },
};
// display weights by class: what reads as designed, not default
const DISPLAY_WEIGHTS = {
  neo: [[300, 1], [400, 3], [500, 4], [600, 3], [700, 1.5], [800, 0.6]],
  humanist: [[300, 1], [400, 3], [500, 3], [600, 2], [700, 1]],
  geometric: [[300, 1.5], [400, 3], [500, 3], [600, 1.5], [700, 1]],
  'display-sans': [[400, 2], [500, 3], [600, 3], [700, 3], [800, 2], [900, 1.5]],
  condensed: [[400, 2], [500, 2], [600, 3], [700, 3], [800, 2], [900, 1]],
  wide: [[400, 2], [500, 3], [600, 2], [700, 2], [800, 1]],
  rounded: [[400, 2], [500, 3], [600, 3], [700, 2]],
  'serif-display': [[300, 2], [400, 4], [500, 2], [600, 1], [700, 0.6]],
  'serif-text': [[300, 1.5], [400, 4], [500, 2], [600, 0.8]],
  slab: [[400, 2], [500, 3], [600, 3], [700, 2], [800, 1]],
};
// how each class is set at display size
const SETTING = {
  neo: { track: [-0.045, -0.025], lead: [0.92, 1.02] },
  humanist: { track: [-0.03, -0.015], lead: [0.98, 1.06] },
  geometric: { track: [-0.04, -0.02], lead: [0.95, 1.04] },
  'display-sans': { track: [-0.04, -0.015], lead: [0.88, 1.0] },
  condensed: { track: [-0.01, 0.01], lead: [0.86, 0.95] },
  wide: { track: [-0.02, 0], lead: [0.95, 1.05] },
  rounded: { track: [-0.03, -0.01], lead: [0.95, 1.05] },
  'serif-display': { track: [-0.03, -0.005], lead: [0.94, 1.06] },
  'serif-text': { track: [-0.025, -0.01], lead: [1.0, 1.1] },
  slab: { track: [-0.03, -0.01], lead: [0.95, 1.05] },
};
const RATIOS = [[1.2, 1], [1.25, 2], [1.333, 3], [1.414, 2], [1.5, 1.5], [1.618, 0.6]];
// professional sites set body at 14-16px (median 15); generated pages drift to 19px, which reads as a children's book
const BODY = [[16, 5], [17, 2.5], [18, 1]];

// text faces too fine for running text on a dark ground (judges read them as grey and thin)
const THIN_TEXT = new Set(['Cardo', 'EB Garamond', 'Cormorant', 'Radley', 'Gentium Book Plus', 'Lusitana', 'Crimson Pro', 'Spectral', 'Libre Caslon Text', 'Castoro', 'Prata', 'Rufina']);

export function dealTypeSystem({ rnd, fonts, tone, dirClasses = [], recentFamilies = [], exclude = [], dark = false }) {
  const wpick = (pairs) => { const t = pairs.reduce((s, [, w]) => s + w, 0); let r = rnd() * t; for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; } return pairs.at(-1)[0]; };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const range = ([a, b], d = 3) => +(a + rnd() * (b - a)).toFixed(d);
  const inClass = (cls) => fonts.filter((f) => f.classes.includes(cls) && !exclude.includes(f.family));
  const freshOf = (pool) => { const f = pool.filter((x) => !recentFamilies.includes(x.family)); return f.length ? f : pool; };

  // the direction may lean the deal (a serif-led direction makes serif kinds likelier), never decide it
  const kinds = Object.entries(KINDS).map(([id, k]) => {
    let w = k.w * ((tone && k.tones[tone]) || 1);
    if (dirClasses.some((c) => /serif/.test(c)) && /serif/.test(id)) w *= 1.6;
    if (dirClasses.some((c) => /condensed|heavy|extended/.test(c)) && id === 'display-over-sans') w *= 1.5;
    return [id, w];
  });
  const kind = wpick(kinds); const K = KINDS[kind];

  // characterful sans most often; condensed and wide faces are loud and dealt more rarely
  const CLASS_W = { 'display-sans': 3, condensed: 1.4, wide: 0.6, neo: 3, humanist: 1.2, geometric: 1 };
  const dClass = wpick(K.display.filter((c) => inClass(c).length).map((c) => [c, CLASS_W[c] || 1]));
  const display = pick(freshOf(inClass(dClass)));
  let text, tClass;
  const textChoices = K.text === 'same' ? ['same'] : K.text;
  const tc = pick(textChoices);
  if (tc === 'same') { text = display; tClass = dClass; }
  else {
    tClass = tc;
    // a text face needs a regular and a bold, and must differ from the display face
    const pool = inClass(tc).filter((f) => f.family !== display.family && f.weights.includes(400) && f.weights.some((w) => w >= 600) && !(dark && THIN_TEXT.has(f.family)));
    text = pick(freshOf(pool.length ? pool : inClass('neo')));
  }
  // a display face with one weight can still set a whole page only if it is a real text face; otherwise pair it
  if (text === display && (!(display.weights.includes(400) && display.weights.some((w) => w >= 600)) || (dark && THIN_TEXT.has(display.family)))) {
    tClass = 'neo'; text = pick(freshOf(inClass('neo').filter((f) => f.family !== display.family)));
  }

  const avail = (f, pairs) => { const ok = pairs.filter(([w]) => f.weights.includes(w)); return ok.length ? ok : f.weights.map((w) => [w, 1]); };
  let dWeight = wpick(avail(display, DISPLAY_WEIGHTS[dClass] || DISPLAY_WEIGHTS.neo));
  const tWeight = text.weights.includes(400) ? 400 : text.weights.reduce((a, b) => (Math.abs(b - 400) < Math.abs(a - 400) ? b : a));
  const strong = [600, 700, 500].find((w) => text.weights.includes(w) && w > tWeight) || null;
  const caps = dClass === 'condensed' ? rnd() < 0.45 : dClass === 'wide' ? rnd() < 0.3 : false;
  const S = SETTING[dClass] || SETTING.neo;
  const track = caps ? range([0, 0.02]) : range(S.track);
  const lead = range(S.lead, 2);

  const ratio = wpick(RATIOS); const body = wpick(BODY);
  // the hero's display size, in vw at 1440: a wide span, so pages do not share one headline size
  // professional sites: largest type median 3.9vw (P75 4.5vw); award sites 5.6vw (P75 9.6vw); generated pages 14vw.
  // Most pages get a confident professional size; a giant headline is a rare, dealt event, never the default.
  const displayVw = wpick([[3.4, 2], [4, 3.5], [4.8, 3.5], [5.6, 2.5], [6.6, 1.6], [8, 1], [10, 0.5], [12.5, 0.2]]) * (dClass === 'condensed' ? 1.25 : dClass === 'wide' ? 0.8 : 1);
  // a light weight reads as thin below a large size: at a modest display size it steps up to regular
  if (dWeight < 400 && displayVw < 5.5 && display.weights.includes(400)) dWeight = 400;
  const px = (n) => Math.round(n * 10) / 10;
  const small = Math.max(13, px(body / ratio));
  const lead2 = px(body * Math.min(ratio, 1.333));
  // section headings at least 2.25 times the body and the headline at least three times it: on a 1.2 scale
  // the third step is only 1.7 times the body, and judges read such headings as timid
  const head = px(Math.max(body * ratio ** 3, body * 2.25));
  const sub = px(Math.max(body * ratio ** 2, Math.sqrt(head * lead2)));
  const disp = px(Math.max(1440 * displayVw / 100, body * 3, head * 1.3));
  const fluid = (min, max, vwAt1440) => `clamp(${(min / 16).toFixed(3)}rem, ${((min * 0.6) / 16).toFixed(3)}rem + ${vwAt1440.toFixed(2)}vw, ${(max / 16).toFixed(3)}rem)`;
  const scale = {
    'step-small': `${(small / 16).toFixed(4)}rem`,
    'step-body': `${(body / 16).toFixed(4)}rem`,
    'step-lead': fluid(Math.max(body + 1, lead2 * 0.9), lead2, (lead2 * 0.4 / 1440) * 100),
    'step-sub': fluid(Math.max(lead2, sub * 0.8), sub, (sub * 0.45 / 1440) * 100),
    'step-head': fluid(Math.max(sub, head * 0.62), head, (head * 0.5 / 1440) * 100),
    'step-display': fluid(Math.max(head * 0.8, Math.min(disp * 0.42, 64)), disp, (disp / 14.4) * 0.62),
  };

  const link = (f, ws, italic) => {
    ws = [...new Set(ws.filter(Boolean))].sort((a, b) => a - b);
    if (f.source === 'fontshare') return `<link href="https://api.fontshare.com/v2/css?f[]=${f.slug}@${ws.join(',')}${italic && f.italic ? ',' + ws.map((w) => w + 1).join(',') : ''}&display=swap" rel="stylesheet">`;
    const fam = f.family.replace(/ /g, '+');
    return `<link href="https://fonts.googleapis.com/css2?family=${fam}:${italic && f.italic ? 'ital,wght@' + [...ws.map((w) => '0,' + w), ...ws.map((w) => '1,' + w)].join(';') : 'wght@' + ws.join(';')}&display=swap" rel="stylesheet">`;
  };
  const same = display === text;
  const css = same ? [link(display, [dWeight, tWeight, strong], false)] : [link(display, [dWeight], false), link(text, [tWeight, strong], false)];
  const fallback = (cls) => (/serif/.test(cls) ? 'Georgia, serif' : cls === 'slab' ? 'Rockwell, Georgia, serif' : 'system-ui, sans-serif');
  const id = `${kind}:${display.family}${same ? '' : '+' + text.family}:${dWeight}`.toLowerCase().replace(/\s+/g, '-');
  const kindName = { 'sans-solo': 'one sans family', 'display-over-sans': 'a display face over a plain sans', 'serif-over-sans': 'a serif display over a sans', 'serif-solo': 'one serif family', 'sans-over-serif': 'a sans display over a serif text', 'serif-pair': 'a display serif over a text serif', slab: 'a slab', rounded: 'a rounded sans', 'wide-solo': 'a wide display over a plain sans' }[kind];
  return {
    id, kind, generated: true,
    name: same ? `${display.family}, ${kindName}` : `${display.family} over ${text.family}`,
    class: dClass,
    display: { family: display.family, cls: dClass, weight: dWeight, weights: display.weights, css: css[0], stack: `"${display.family}", ${fallback(dClass)}`, settings: `weight ${dWeight}${caps ? ', set in capitals' : ', sentence case'}, tracking ${track}em, leading ${lead}` },
    text: { family: text.family, cls: tClass, weight: tWeight, strong, weights: text.weights, css: css[1] || css[0], stack: `"${text.family}", ${fallback(tClass)}`, settings: `weight ${tWeight} for running text${strong ? `, ${strong} for emphasis and buttons` : ' (no bold cut: emphasis by size or colour, never faked bold)'}, leading 1.5, 60-72 characters a line` },
    caps, track, lead, ratio, body, displayVw: +displayVw.toFixed(1),
    scale,
    note: `${kindName[0].toUpperCase() + kindName.slice(1)}. A ${ratio} scale from a ${body}px body; the hero's display step is about ${+displayVw.toFixed(1)}vw at 1440. Six steps and no others: small, body, lead, sub, head, display. ${same ? `${display.family} does every job, told apart by size and weight (${dWeight} for display, ${tWeight} and ${strong || tWeight} in text).` : `${display.family} only for the display and head steps; ${text.family} for everything a visitor reads at length, buttons and navigation included.`} Load only the weights listed; a weight the face lacks is faked by the browser and the inspector fails it.`,
  };
}
