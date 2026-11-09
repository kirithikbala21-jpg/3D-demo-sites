// tasteskill / colour-deal — deal a restrained palette: one ground, one ink, one accent.
//
// Measured on professional and award sites: most pages stand on white, an off-white or a near-black,
// use one chromatic hue (often none beyond the action) and rarely put whole sections on colour. Generated
// pages do the opposite (pink ground, lime button, yellow cards). This deals the restrained kind most of
// the time, in OKLCH so lightness and contrast are under control, and checks contrast before it returns.

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function oklchToRgb(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(fromLin);
}
function inGamut(rgb) { return rgb.every((v) => v >= -0.0005 && v <= 1.0005); }
// reduce chroma until the colour exists in sRGB
function oklch(L, C, h) { let c = C; let rgb = oklchToRgb(L, c, h); while (!inGamut(rgb) && c > 0) { c = Math.max(0, c - 0.004); rgb = oklchToRgb(L, c, h); } return rgb; }
const hex = (rgb) => '#' + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
const lum = (h) => { const n = [1, 3, 5].map((i) => toLin(parseInt(h.slice(i, i + 2), 16) / 255)); return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// grounds: [id, weight, light?, L range, C range, words]
const GROUNDS = [
  ['white', 20, true, [1, 1], [0, 0], 'White'],
  ['off-white', 22, true, [0.965, 0.985], [0.004, 0.014], 'Off-white'],
  ['stone', 10, true, [0.9, 0.935], [0.005, 0.018], 'Stone'],
  ['pale-tint', 5, true, [0.92, 0.955], [0.025, 0.05], 'Pale'],
  ['near-black', 18, false, [0.16, 0.2], [0.004, 0.016], 'Near-black'],
  ['black', 7, false, [0.11, 0.135], [0, 0.006], 'Black'],
  ['deep', 8, false, [0.22, 0.31], [0.035, 0.075], 'Deep'],
  ['field', 2, true, [0.62, 0.8], [0.1, 0.16], 'Coloured'],
];
// accent hues in OKLCH degrees; violet and indigo (about 265-315) are never dealt
const HUES = [
  ['blue', 255, 3], ['cobalt', 263, 1.6], ['red', 27, 2.4], ['vermilion', 38, 1.2], ['orange', 55, 1.2], ['yellow', 100, 0.7],
  ['olive', 118, 0.8], ['green', 148, 2.4], ['emerald', 160, 1.2], ['teal', 190, 1.4], ['cyan', 218, 0.7], ['pink', 355, 0.6], ['magenta', 340, 0.3],
];
const TINT_HUES = [['warm', 70], ['sand', 85], ['green', 140], ['cool', 235], ['blue', 255], ['rose', 20], ['neutral', 0]];

export function dealPaletteV25({ rnd, tone, recent = [] }) {
  const wpick = (pairs) => { const t = pairs.reduce((s, x) => s + x[1], 0); let r = rnd() * t; for (const x of pairs) { r -= x[1]; if (r <= 0) return x; } return pairs.at(-1); };
  const range = ([a, b]) => a + rnd() * (b - a);
  const toneW = { quiet: { field: 0.2, 'pale-tint': 0.6, deep: 0.6 }, luxury: { 'near-black': 1.5, black: 1.4, deep: 1.4, field: 0.1, 'pale-tint': 0.5 }, bold: { field: 3, black: 1.4, 'pale-tint': 1.4 }, playful: { field: 3, 'pale-tint': 2 }, technical: { 'near-black': 1.5, black: 1.3, field: 0.2 }, editorial: { 'off-white': 1.4, white: 1.2, field: 0.4 }, warm: { 'off-white': 1.4, stone: 1.4, deep: 1.3, field: 0.6 } }[tone] || {};
  const g = wpick(GROUNDS.map((x) => [x, x[1] * (toneW[x[0]] ?? 1) * (recent.includes(x[0]) ? 0.5 : 1)]))[0];
  const [gid, , light, gL, gC, gWord] = g;
  // the ground's tint: a hue the ground leans toward, not a colour
  const tint = TINT_HUES[Math.floor(rnd() * TINT_HUES.length)];
  const accentHue = wpick(HUES.map((x) => [x, x[2] * (recent.includes(x[0]) ? 0.4 : 1)]))[0];
  const groundHue = gid === 'deep' || gid === 'field' || gid === 'pale-tint' ? (rnd() < 0.6 ? accentHue[1] : tint[1] || 250) : tint[1];
  const bgL = range(gL), bgC = tint[0] === 'neutral' && !['deep', 'field', 'pale-tint'].includes(gid) ? 0 : range(gC);
  const bg = hex(oklch(bgL, bgC, groundHue));
  const surface = hex(oklch(light ? bgL - (gid === 'white' ? 0.035 : 0.03) : bgL + 0.05, bgC, groundHue));
  // ink and muted carry a trace of the ground's hue so the page holds together
  const inkC = Math.min(0.02, bgC * 0.8 + 0.004);
  let ink = hex(oklch(light ? range([0.17, 0.24]) : range([0.95, 0.985]), inkC, groundHue));
  let muted = hex(oklch(light ? range([0.44, 0.5]) : range([0.74, 0.8]), inkC, groundHue));
  if (gid === 'field' && contrast(ink, bg) < 7) ink = hex(oklch(0.14, 0.01, groundHue));
  // accent: chroma level dealt; vivid is rare. A monochrome page (the ink is the accent) is dealt too.
  // a page on a coloured ground keeps that one hue: its action is set in the ink
  const mono = gid === 'field' || rnd() < (tone === 'luxury' || tone === 'quiet' ? 0.3 : 0.16);
  const chroma = wpick([[['muted', [0.07, 0.1]], 2], [['rich', [0.12, 0.16]], 3], [['vivid', [0.18, 0.23]], tone === 'bold' || tone === 'playful' ? 2 : 0.6]])[0];
  let accent, accentInk, accentWord;
  if (mono) { accent = ink; accentInk = bg; accentWord = 'no colour but the ink'; }
  else {
    let aL = light ? range([0.45, 0.6]) : range([0.68, 0.82]);
    if (accentHue[0] === 'yellow') aL = light ? range([0.82, 0.88]) : range([0.86, 0.9]);
    accent = hex(oklch(aL, range(chroma[1]), accentHue[1]));
    accentInk = contrast('#ffffff', accent) >= 4.5 ? '#ffffff' : hex(oklch(0.16, 0.01, accentHue[1]));
    if (contrast(accentInk, accent) < 4.5) accentInk = contrast('#ffffff', accent) > contrast('#111111', accent) ? '#ffffff' : '#111111';
    // the accent must be visible against the ground (3:1) to be used as a link or a mark
    let tries = 0; while (contrast(accent, bg) < 3 && tries++ < 12) { aL += light ? -0.03 : 0.03; accent = hex(oklch(aL, range(chroma[1]), accentHue[1])); }
    accentWord = `${chroma[0]} ${accentHue[0]}`;
  }
  // fields: most pages have none or one
  const fields = [];
  const nf = wpick([[0, 5], [1, 4], [2, tone === 'bold' || tone === 'playful' ? 1.2 : 0.4]])[0];
  const fieldKinds = shuffleW(rnd, [['invert', 3], ['accent-deep', 1.5], ['tint', 1.2], ['accent', tone === 'bold' || tone === 'playful' ? 1.5 : 0.3]]);
  for (let i = 0; i < nf; i++) {
    const k = fieldKinds[i];
    if (k === 'invert') fields.push({ bg: ink, ink: bg, kind: 'the ink as ground' });
    else if (k === 'accent-deep' && !mono) { const f = hex(oklch(light ? 0.28 : 0.26, 0.06, accentHue[1])); fields.push({ bg: f, ink: contrast('#ffffff', f) > 7 ? '#ffffff' : '#f3f3f3', kind: `deep ${accentHue[0]}` }); }
    else if (k === 'tint') { const f = hex(oklch(light ? bgL - 0.07 : bgL + 0.08, Math.max(bgC, 0.02), groundHue)); fields.push({ bg: f, ink, kind: 'a darker step of the ground' }); }
    else if (k === 'accent' && !mono) fields.push({ bg: accent, ink: accentInk, kind: `the ${accentHue[0]} accent` });
  }
  const name = `${gWord}${tint[0] !== 'neutral' && ['off-white', 'stone', 'near-black'].includes(gid) ? ` (${tint[0]})` : ''}, ${mono ? 'ink only' : accentWord}`;
  const checks = { inkOnBg: +contrast(ink, bg).toFixed(1), mutedOnBg: +contrast(muted, bg).toFixed(1), accentInk: +contrast(accentInk, accent).toFixed(1), accentOnBg: +contrast(accent, bg).toFixed(1) };
  if (checks.mutedOnBg < 4.5) muted = hex(oklch(light ? 0.42 : 0.8, inkC, groundHue));
  const note = [
    `${gWord} ground${gid === 'white' ? '' : ` (${bg})`}, ${light ? 'dark' : 'light'} ink, ${mono ? 'and no accent hue: the action is set in the ink, solid' : `one ${accentWord} accent`}.`,
    mono ? 'Colour comes only from the pictures.' : 'The accent is for the primary action, links and at most one other thing on a screen; it is never a ground for text blocks, never a second headline colour and never spread across cards.',
    nf ? `Fields: ${fields.map((f) => f.kind).join(' and ')}, each used for one section at most.` : 'No coloured fields: sections are told apart by space, size and pictures, with at most one change to --surface.',
    'Every other colour on the page comes from photographs or the product, never from added tints, badges or chips.',
  ].join(' ');
  return { id: `gen:${gid}:${accentHue[0]}:${mono ? 'mono' : chroma[0]}`, name, generated: true, ground: gid, hue: mono ? null : accentHue[0], tags: [light ? 'light' : 'dark', gid], bg, surface, ink, muted, accent, accentInk, fields, note, checks };
}
function shuffleW(rnd, pairs) { const out = []; const p = [...pairs]; while (p.length) { const t = p.reduce((s, x) => s + x[1], 0); let r = rnd() * t; let i = 0; for (; i < p.length; i++) { r -= p[i][1]; if (r <= 0) break; } out.push(p.splice(Math.min(i, p.length - 1), 1)[0][0]); } return out; }
