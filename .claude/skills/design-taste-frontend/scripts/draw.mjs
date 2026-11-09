#!/usr/bin/env node
// tasteskill / draw — deal an art direction from the research library.
//
// The script chooses, not the model: a model asked to pick a direction returns the category
// default every time. The draw is random within what fits the brief, and it remembers recent
// draws so consecutive projects do not look alike.
//
//   node draw.mjs --sector <sector> --brief "one line" [--sections hero,showcase,pricing,footer]
//                 [--tone quiet|bold|warm|technical|playful|luxury|editorial]
//                 [--have photography,product-photo,product-ui,illustration,video]   assets you really have
//                 [--keep palette,type]        the brand already fixes these; draw the rest
//                 [--avoid id,id] [--seed N] [--out DIR]
//                 [--options 3]                show three dealt directions to choose from, write nothing
//                 [--direction <id>]           deal the full sheet for the chosen direction
//   node draw.mjs --show                       reprint the saved direction sheet
//   node draw.mjs --redraw hero|type|palette|photos|scenes|section:<role>|direction   re-deal one slot
//   node draw.mjs --list sectors|directions|roles|tones|scenes
//   node draw.mjs --site <id>                  print one studied reference site in full
//   node draw.mjs --app --kind <kind> ...      deal a style for an app screen instead (see lib/app-draw.mjs)
//
// Zero dependencies. Node 18+.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';
import { homedir } from 'node:os';
import { dealTypeSystem } from './lib/type-deal.mjs';
import { dealPaletteV25 } from './lib/colour-deal.mjs';
import { dealFrame } from './lib/frame-deal.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = join(HERE, '..', 'library');
const ASSETS_PATH = join(HERE, 'assets.mjs').split('\\').join('/');
const ASSETS_CMD = `node ${/\s/.test(ASSETS_PATH) ? `"${ASSETS_PATH}"` : ASSETS_PATH}`;
const load = (name) => JSON.parse(readFileSync(join(LIB, name + '.json'), 'utf8'));

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf('--' + name); if (i === -1) return def; const v = argv[i + 1]; return v === undefined || v.startsWith('--') ? true : v; };
const list = (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const outDir = resolve(String(opt('out', '.taste-skill')));
const sheetPath = join(outDir, 'direction.json');

const SECTORS = ['saas', 'dev-tool', 'ai-product', 'consumer-app', 'finance', 'agency', 'studio-portfolio', 'personal-portfolio', 'ecommerce', 'physical-product', 'fashion', 'hospitality', 'restaurant', 'real-estate', 'architecture', 'event', 'health', 'education', 'nonprofit', 'culture', 'music', 'other'];
const TONES = ['quiet', 'bold', 'warm', 'technical', 'playful', 'luxury', 'editorial'];
const DEFAULT_SECTIONS = {
  saas: ['hero', 'showcase', 'features', 'how-it-works', 'testimonial', 'pricing', 'faq', 'cta', 'footer'],
  'dev-tool': ['hero', 'showcase', 'features', 'how-it-works', 'pricing', 'faq', 'cta', 'footer'],
  'ai-product': ['hero', 'showcase', 'features', 'how-it-works', 'testimonial', 'pricing', 'cta', 'footer'],
  'consumer-app': ['hero', 'showcase', 'features', 'testimonial', 'cta', 'footer'],
  finance: ['hero', 'showcase', 'features', 'stats', 'testimonial', 'faq', 'cta', 'footer'],
  agency: ['hero', 'intro', 'work', 'services', 'about', 'cta', 'footer'],
  'studio-portfolio': ['hero', 'work', 'intro', 'services', 'about', 'cta', 'footer'],
  'personal-portfolio': ['hero', 'work', 'about', 'cta', 'footer'],
  ecommerce: ['hero', 'gallery', 'features', 'intro', 'testimonial', 'cta', 'footer'],
  'physical-product': ['hero', 'showcase', 'features', 'gallery', 'intro', 'pricing', 'cta', 'footer'],
  fashion: ['hero', 'gallery', 'intro', 'work', 'cta', 'footer'],
  hospitality: ['hero', 'intro', 'gallery', 'features', 'list', 'contact', 'footer'],
  restaurant: ['hero', 'intro', 'list', 'gallery', 'contact', 'footer'],
  'real-estate': ['hero', 'intro', 'gallery', 'features', 'stats', 'contact', 'footer'],
  architecture: ['hero', 'work', 'intro', 'about', 'contact', 'footer'],
  event: ['hero', 'intro', 'list', 'features', 'pricing', 'faq', 'cta', 'footer'],
  health: ['hero', 'intro', 'features', 'how-it-works', 'testimonial', 'faq', 'cta', 'footer'],
  education: ['hero', 'intro', 'features', 'how-it-works', 'testimonial', 'pricing', 'faq', 'cta', 'footer'],
  nonprofit: ['hero', 'intro', 'stats', 'features', 'about', 'cta', 'footer'],
  culture: ['hero', 'intro', 'gallery', 'list', 'about', 'cta', 'footer'],
  music: ['hero', 'list', 'gallery', 'about', 'cta', 'footer'],
  other: ['hero', 'intro', 'features', 'showcase', 'cta', 'footer'],
};
// requested role names → the role vocabulary used by library/sections.json
const ROLE_ALIAS = { features: 'features', feature: 'features', benefits: 'features', services: 'features', showcase: 'showcase', product: 'showcase', demo: 'showcase', 'how-it-works': 'how-it-works', how: 'how-it-works', process: 'how-it-works', steps: 'how-it-works', testimonial: 'testimonial', testimonials: 'testimonial', quotes: 'testimonial', proof: 'proof', logos: 'proof', press: 'proof', stats: 'stats', numbers: 'stats', pricing: 'pricing', plans: 'pricing', faq: 'faq', cta: 'cta', footer: 'footer', intro: 'intro', manifesto: 'intro', about: 'about', team: 'about', work: 'work', projects: 'work', index: 'work', 'case-studies': 'work', gallery: 'gallery', images: 'gallery', list: 'list', menu: 'list', schedule: 'list', lineup: 'list', 'line-up': 'list', speakers: 'list', agenda: 'list', programme: 'list', program: 'list', timetable: 'list', rooms: 'list', tickets: 'pricing', price: 'pricing', contact: 'contact', booking: 'contact', newsletter: 'contact', signup: 'contact' };

// App screens (dashboards, admin, settings) have their own library and sheet: scripts/lib/app-draw.mjs.
const savedKind = (() => { try { return JSON.parse(readFileSync(sheetPath, 'utf8')).kind; } catch { return null; } })();
if (opt('app') || ((opt('show') || opt('redraw')) && savedKind === 'app')) await import('./lib/app-draw.mjs');

if (opt('list')) {
  const what = opt('list');
  if (what === 'sectors') console.log(SECTORS.join('\n'));
  else if (what === 'tones') console.log(TONES.join('\n'));
  else if (what === 'roles') console.log([...new Set(Object.values(ROLE_ALIAS))].join('\n'));
  else if (what === 'scenes') { const all = existsSync(join(LIB, 'scenes.json')) ? load('scenes') : []; for (const sc of all) console.log(`${sc.id.padEnd(34)} ${sc.name} — ${sc.family}; ${sc.summary.split(/(?<=\.)\s/)[0]}`); if (!all.length) console.log('No scene library yet.'); }
  else for (const d of load('directions')) console.log(`${d.id.padEnd(30)} ${d.name} — ${d.sectors.join(', ')}`);
  process.exit(0);
}
if (opt('photos')) {
  const lib = load('photos'); const q = String(opt('photos'));
  const line = (ph) => `- https://picsum.photos/id/${ph.id}/1600/1000 — ${ph.alt} · ${ph.tone} tone · ${(ph.colours || []).join(', ')}${ph.mono ? ' · black-and-white' : ''}${ph.calm && ph.calm !== 'none' ? ` · calm area: ${ph.calm}` : ''} · photo: ${ph.by}`;
  if (q === 'list' || q === 'true') { for (const [id, set] of Object.entries(lib.sets)) console.log(`${id.padEnd(22)} ${String(set.photos.length).padStart(3)} photos — ${set.note}`); }
  else if (lib.sets[q]) { console.log(`# ${lib.sets[q].title} — ${lib.sets[q].note}`); for (const ph of lib.sets[q].photos) console.log(line(ph)); }
  else { // free-text search across all descriptions
    const words = q.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 3);
    const hits = Object.values(lib.sets).flatMap((s) => s.photos).filter((ph) => words.some((w) => (ph.alt + ' ' + (ph.colours || []).join(' ')).toLowerCase().includes(w)));
    if (!hits.length) console.log('No photograph matches. `--photos list` shows the sets.'); else for (const ph of hits.slice(0, 24)) console.log(line(ph));
  }
  console.log('\nPath numbers are width/height; add ?grayscale to desaturate. Photographs are atmosphere, never a stand-in for a specific product or person.');
  process.exit(0);
}
if (opt('site')) {
  const s = load('sites').find((x) => x.id === opt('site') || x.name.toLowerCase() === String(opt('site')).toLowerCase());
  if (!s) { console.error('No studied site with that id. Ids appear in the direction sheet under "Real references".'); process.exit(2); }
  console.log(siteCard(s, true)); process.exit(0);
}

// ---------- randomness (seedable) ----------
let seed = opt('seed') !== undefined && opt('seed') !== true ? Number(opt('seed')) : randomInt(1, 2 ** 31 - 1);
const startSeed = seed;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const wpick = (pairs) => { const t = pairs.reduce((s, [, w]) => s + w, 0); let r = rnd() * t; for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; } return pairs.at(-1)[0]; };
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// prefer items not used recently, without ever emptying the pool
const fresh = (pool, recent) => { const f = pool.filter((x) => !recent.includes(x.id)); return f.length ? f : pool; };

// ---------- history (project + user level) ----------
const userHist = process.env.TASTE_SKILL_HISTORY || join(homedir(), '.taste-skill', 'history.json');
const readHist = () => { for (const p of [userHist]) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch {} } return []; };
const writeHist = (entry) => { try { mkdirSync(dirname(userHist), { recursive: true }); const h = readHist(); h.unshift(entry); writeFileSync(userHist, JSON.stringify(h.slice(0, 24), null, 1)); } catch {} };

// ---------- show / redraw ----------
const saved = existsSync(sheetPath) ? JSON.parse(readFileSync(sheetPath, 'utf8')) : null;
if (opt('show')) {
  if (!saved) { console.error('No saved direction. Run a draw first.'); process.exit(2); }
  console.log(render(saved)); process.exit(0);
}

const L = { directions: load('directions'), heroes: load('heroes'), sections: load('sections'), type: load('type'), palettes: load('palettes'), photos: load('photos'), sites: load('sites'), motions: load('motions'), fonts: load('fonts').fonts, scenes: existsSync(join(LIB, 'scenes.json')) ? load('scenes') : [] };
const hist = readHist();
const recent = (key, n) => hist.slice(0, n).map((h) => h[key]).filter(Boolean);

let sheet;
if (opt('alternatives')) {
  // The other blueprints of one role that suit the saved direction: for when the dealt one cannot hold
  // the real content (it assumes three plans and there is one; it needs five quotes and there are none).
  if (!saved) { console.error('Run a draw first.'); process.exit(2); }
  const role = ROLE_ALIAS[String(opt('alternatives'))] || String(opt('alternatives'));
  const dir = L.directions.find((d) => d.id === saved.direction.id);
  const current = saved.sections.find((s) => s.role === role)?.id;
  const pool = sectionPool(dir, role, saved.input);
  if (!pool.length) { console.error('No blueprints for role ' + role + '. Roles: --list roles'); process.exit(2); }
  const line = (s) => `- \`${s.id}\`${s.id === current ? ' (dealt)' : ''} — **${s.name}** (${s.shape}). ${s.blueprint.split(/(?<=\.)\s/).slice(0, 2).join(' ')}\n`;
  console.log(`# ${role}: blueprints that suit "${dir.name}"\n`);
  for (const s of pool) console.log(line(s));
  const software = imageryMode(saved.input) === 'interface';
  const others = L.sections.filter((s) => s.role === role && !s.banned && !pool.includes(s) && (software || !softwareOnly(s)) && (s.needs || []).every((n) => saved.input.have.includes(n) || (n === 'product-ui' && software)));
  if (others.length) {
    console.log(`# Other ${role} blueprints (written for other directions; if one fits the content better, take its geometry and set it in this direction's type, colour and manner)\n`);
    for (const s of others) console.log(line(s));
  }
  console.log(`Choose by what the content really is (how many plans, quotes, items exist), then: node draw.mjs --redraw section:${role}=<id>   and say why in your report.`);
  process.exit(0);
}
if (opt('redraw')) {
  if (!saved) { console.error('Nothing to redraw. Run a draw first.'); process.exit(2); }
  sheet = saved; sheet.redraws = (sheet.redraws || 0) + 1; // the sheet keeps its original seed; slot redraws are counted
  const what = String(opt('redraw'));
  const dir = L.directions.find((d) => d.id === sheet.direction.id);
  if (what === 'direction') sheet = deal({ ...sheet.input, direction: null, avoid: [...(sheet.input.avoid || []), sheet.direction.id] }, sheet.redraws);
  else if (what === 'hero') sheet.hero = dealHero(dir, sheet.input, [sheet.hero?.id]);
  else if (what === 'type') sheet.type = dealType(dir, [sheet.type?.id], sheet.input.tone, isDark(sheet.palette));
  else if (what === 'palette') sheet.palette = dealPalette(dir, sheet.input, [sheet.palette?.id]);
  else if (what === 'photos') sheet.photos = dealPhotos(dir, sheet.input);
  else if (what === 'scenes') sheet.scenes = dealScenes(dir, sheet.input, (sheet.scenes || []).map((x) => x.id));
  else if (what.startsWith('section:')) {
    // section:<role> re-deals at random; section:<role>=<id> takes a named alternative (see --alternatives)
    const [roleRaw, wanted] = what.slice(8).split('=');
    const role = ROLE_ALIAS[roleRaw] || roleRaw;
    const i = sheet.sections.findIndex((s) => s.role === role);
    if (i === -1) { console.error('No section with role ' + role + ' in this sheet.'); process.exit(2); }
    const used = sheet.sections.map((s) => s.id);
    if (wanted) {
      // a blueprint written for another role may be borrowed when its geometry fits the content better
      const chosen = L.sections.find((s) => s.id === wanted);
      if (!chosen) { console.error(`No blueprint with id ${wanted}. List them with --alternatives <role>.`); process.exit(2); }
      sheet.sections[i] = chosen.role === role ? chosen : { ...chosen, role, name: `${chosen.name} (borrowed from ${chosen.role})` };
    } else sheet.sections[i] = dealSection(dir, role, used, sheet.sections[i - 1]?.shape, sheet.sections[i + 1]?.shape, sheet.input) || sheet.sections[i];
  } else { console.error('Unknown slot. Use hero, type, palette, photos, scenes, section:<role>, section:<role>=<id> or direction.'); process.exit(2); }
} else {
  const sector = String(opt('sector', ''));
  if (!SECTORS.includes(sector)) {
    console.error(`--sector is required. One of:\n  ${SECTORS.join(', ')}\nPick the closest; use "other" only when nothing fits.`);
    process.exit(2);
  }
  const requested = list(opt('sections'));
  const input = {
    brief: typeof opt('brief') === 'string' ? opt('brief') : '', sector,
    tone: TONES.includes(opt('tone')) ? opt('tone') : null,
    have: list(opt('have')), keep: list(opt('keep')), avoid: list(opt('avoid')),
    sections: (requested.length ? requested : DEFAULT_SECTIONS[sector]).map((r) => ROLE_ALIAS[r] || r).filter((r) => r !== 'hero'),
    direction: typeof opt('direction') === 'string' ? opt('direction') : null,
  };
  if (input.direction && !L.directions.some((d) => d.id === input.direction)) { console.error(`No direction with id ${input.direction}. List them with --list directions.`); process.exit(2); }
  if (opt('options')) {
    const n = Math.max(2, Math.min(5, Number(opt('options')) || 3));
    const options = dealOptions(input, n);
    console.log(`# ${n} directions dealt for this brief\n`);
    console.log('Choose the one whose way of composing can best carry an idea from your inventory (SKILL.md steps 1 and 4), not the');
    console.log('most familiar one. Then deal it in full with the same command plus `--direction <id>` (and without --options).\n');
    for (const d of options) {
      console.log(`## \`${d.id}\` — ${d.name}`);
      console.log(`Idea engine: ${d.idea.split(/(?<=\.)\s/).slice(0, 2).join(' ')}`);
      console.log(`Composition: ${d.composition.split(/(?<=\.)\s/).slice(0, 2).join(' ')}`);
      if (d.needsPictures) console.log('Needs: many pictures. Without photographs of its own, each is a real picture of the subject\'s world found with scripts/assets.mjs, or a drawing you make.');
      console.log('');
    }
    process.exit(0);
  }
  sheet = deal(input, 0);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(sheetPath, JSON.stringify(sheet, null, 1));
if (!opt('redraw') || String(opt('redraw')) === 'direction') writeHist({ at: sheet.at, direction: sheet.direction.id, type: sheet.type?.id, families: sheet.type ? [...new Set([sheet.type.display.family, sheet.type.text.family])] : [], palette: sheet.palette?.id, ground: sheet.palette?.ground || null, hue: sheet.palette?.hue || null, frame: sheet.frame ? Object.fromEntries(Object.entries(sheet.frame).map(([k, v]) => [k, v.id])) : null, hero: sheet.hero?.id, sector: sheet.input.sector, scenes: (sheet.scenes || []).map((x) => x.id) });
console.log(render(sheet));

// ---------- dealing ----------
// What kind of pictures this build can honestly have. It decides which blueprints are dealt and how the
// sheet tells the agent to fill picture slots.
function imageryMode(input) {
  if (input.have.includes('product-photo') || input.have.includes('photography')) return 'own';
  if (['saas', 'dev-tool', 'ai-product', 'consumer-app', 'finance'].includes(input.sector)) return 'interface';
  if (['physical-product', 'ecommerce'].includes(input.sector)) return 'no-product-photo';
  return 'atmosphere';
}
function pictureLed(x) { return (x.tags || []).includes('photo-led') || (x.tags || []).includes('object-led'); }
function worksWithoutPictures(x) { return !pictureLed(x) || (x.tags || []).some((t) => ['ui-led', 'type-led', 'colour-field'].includes(t)); }

// The directions that suit this brief and the assets it really has.
function directionPool(input) {
  const has = (need) => input.have.includes(need) || need === 'photography'; // the photo library covers photography
  let pool = L.directions.filter((d) => (d.sectors.includes(input.sector) || d.sectors.includes('*')) && !input.avoid.includes(d.id));
  const feasible = pool.filter((d) => (d.needs || []).every(has));
  if (feasible.length) pool = feasible;
  // directions built on photographs of the subject are not dealt when the subject cannot be photographed honestly
  const mode = imageryMode(input);
  if (mode === 'interface' || mode === 'no-product-photo') { const plain = pool.filter((d) => !d.needsPictures); if (plain.length >= 3) pool = plain; }
  if (input.tone) { const toned = pool.filter((d) => (d.tones || []).includes(input.tone)); if (toned.length >= 2) pool = toned; }
  // directions that put whole pages on loud colour are dealt only when the brief asks for a loud tone
  if (!['bold', 'playful'].includes(input.tone)) { const calm = pool.filter((d) => !d.loud); if (calm.length >= 2) pool = calm; }
  if (!pool.length) pool = L.directions.filter((d) => !input.avoid.includes(d.id));
  return pool;
}
// Three directions dealt at random from the pool, for the builder to choose the one that carries its idea.
function dealOptions(input, n) {
  const pool = directionPool(input); const out = [];
  let rest = fresh(pool, recent('direction', Math.min(5, pool.length - n)));
  while (out.length < n && pool.length > out.length) {
    if (!rest.length) rest = pool.filter((d) => !out.includes(d));
    const d = pick(rest); out.push(d); rest = rest.filter((x) => x !== d);
  }
  return out;
}
function deal(input, redraws) {
  const pool = directionPool(input);
  const forced = input.direction ? L.directions.find((d) => d.id === input.direction) : null;
  // weighted: the directions every model already reaches for carry a weight under 1 in the library
  const dir = forced || wpick(fresh(pool, recent('direction', Math.min(5, pool.length - 1))).map((d) => [d, d.weight ?? 1]));
  const s = { version: 1, at: new Date().toISOString(), seed: startSeed, redraws, input, imagery: imageryMode(input), allow: dir.allow || [], direction: dir };
  s.hero = dealHero(dir, input, []);
  // colour first, so a dark ground never gets a hairline text face
  s.palette = input.keep.includes('palette') ? null : dealPalette(dir, input, []);
  s.type = input.keep.includes('type') ? null : dealType(dir, [], input.tone, isDark(s.palette));
  s.photos = dealPhotos(dir, input);
  // signature moves that built the reviewed pages' worst parts (drag rails, a scaling giant name, colour
  // chapters) are not dealt; another move is drawn instead
  const NO_MOTION = new Set(['drag-row', 'scaling-wordmark', 'colour-on-scroll', 'curtain-footer']);
  // the hero's own move most of the time; otherwise any allowed move, so the same few do not repeat
  const wanted = rnd() < 0.4 ? null : [s.hero?.motion, dir.motion].find((id) => id && !NO_MOTION.has(id));
  s.motion = L.motions.find((m) => m.id === wanted) || wpick(L.motions.filter((m) => !NO_MOTION.has(m.id) && !['carried-picture', 'index-preview'].includes(m.id)).map((m) => [m, m.id === 'stillness' ? 0.5 : 1]));
  s.sections = [];
  for (const role of input.sections) {
    const sec = dealSection(dir, role, s.sections.map((x) => x.id), s.sections.at(-1)?.shape, null, input);
    if (sec) s.sections.push(sec); else s.sections.push({ id: null, role, shape: null, name: role, blueprint: null });
  }
  s.references = dealReferences(dir, input);
  s.scenes = dealScenes(dir, input, []);
  const last = hist[0]?.frame || {};
  s.frame = dealFrame({ rnd, input, imagery: s.imagery, recent: last });
  return s;
}
// The page's big scroll moments (references/scenes.md): two tested scenes from different families, each
// placed on a section of the argument it can carry; three only on a long, loud page (eight sections or
// more, with a bold or playful tone, or a loud sector when no tone is given). A page with scenes keeps its
// length budget (about 12-16 screens at 1440), so the scenes hold about six screens in all.
function dealScenes(dir, input, exclude) {
  if (!L.scenes.length) return [];
  const BUDGET = 6.5; // screens of hold for all the page's scenes together
  const LONG = 3;     // a scene over this is the page's one long scene, and never carries the work
  const has = (need) => input.have.includes(need) || need === 'photography';
  const fits = (sc) => !exclude.includes(sc.id) && (sc.sectors || ['*']).some((x) => x === '*' || x === input.sector) && (sc.needs || []).every(has);
  // Atmosphere scenes (light, a burst of lines, letters) carry one line and no information. In round 1 of the
  // v2.5 tests every one of them was the stretch judges called dead scroll on a product page. They are dealt
  // only to loud or creative pages, one at most; everywhere else a scene carries the section's real content.
  const ATMOSPHERE = new Set(['warp-jump', 'light-flood', 'letter-physics', 'wordmark-under-strain', 'object-through-giant-type']);
  const creative = ['bold', 'playful'].includes(input.tone) || ['agency', 'studio-portfolio', 'personal-portfolio', 'music', 'fashion', 'event', 'culture'].includes(input.sector);
  let pool = L.scenes.filter((sc) => fits(sc) && (creative || !ATMOSPHERE.has(sc.id)));
  if (pool.length < 2) pool = L.scenes.filter((sc) => !exclude.includes(sc.id) && (sc.needs || []).every(has) && (creative || !ATMOSPHERE.has(sc.id)));
  if (!pool.length) return [];
  const roles = ['hero', ...input.sections];
  const loud = ['bold', 'playful'].includes(input.tone) || (!input.tone && ['agency', 'fashion', 'music', 'event'].includes(input.sector));
  const n = Math.min(pool.length, roles.length >= 8 && loud ? 3 : 2);
  const recentIds = hist.slice(0, 4).flatMap((h) => h.scenes || []);
  // Each scene is placed as it is picked, on a section of the argument it can carry, with a quiet section
  // between it and every other scene; a scene with no such section is not dealt. Closing scenes take their
  // latest section, the others their own first choice. At most one scene over three screens, about six
  // screens in all; a scene that carries the work holds three screens at most, so the work itself is on
  // screen by the fourth or fifth screen and not after a long ride.
  const out = []; const families = new Set(); const taken = new Set();
  const holdOf = (sc) => sc.hold || 2;
  const free = (r) => { const i = roles.indexOf(r); return i >= 0 && !taken.has(i) && !taken.has(i - 1) && !taken.has(i + 1); };
  const place = (sc) => {
    if (sc.position === 'opening') return free('hero') ? 'hero' : null;
    const ok = (sc.roles || []).filter((r) => r !== 'hero' && free(r) && !(r === 'work' && holdOf(sc) > LONG));
    if (!ok.length) return null;
    return sc.position === 'closing' ? ok.sort((a, b) => roles.indexOf(b) - roles.indexOf(a))[0] : ok[0];
  };
  const held = () => out.reduce((s, x) => s + holdOf(x), 0);
  const allowed = (sc) => !out.some((o) => o.id === sc.id) && !families.has(sc.family) && place(sc) && !(holdOf(sc) > LONG && out.some((o) => holdOf(o) > LONG)) && held() + holdOf(sc) <= BUDGET && !(ATMOSPHERE.has(sc.id) && out.some((o) => ATMOSPHERE.has(o.id)));
  while (out.length < n) {
    let cands = fresh(pool, recentIds).filter(allowed);
    if (!cands.length) cands = pool.filter(allowed);
    if (!cands.length) break;
    const sc = pick(cands); const role = place(sc);
    taken.add(roles.indexOf(role)); families.add(sc.family); out.push({ ...sc, carries: role });
  }
  return out.sort((a, b) => roles.indexOf(a.carries) - roles.indexOf(b.carries));
}
function dealHero(dir, input, exclude) {
  // the direction's own list, and any hero written for this direction since (the October 2026 study added some)
  // banned heroes (pictures in the letters, folder tabs) are never dealt; saturated first screens only for a loud tone
  const loudOk = ['bold', 'playful'].includes(input.tone);
  const allowed = (h) => !h.banned && (loudOk || !h.loud);
  let pool = L.heroes.filter((h) => allowed(h) && ((dir.heroes || []).includes(h.id) || (h.directions || []).includes(dir.id)));
  if (!pool.length) pool = L.heroes.filter(allowed);
  if (imageryMode(input) !== 'interface' && !input.have.includes('product-ui')) { const plain = pool.filter((h) => !softwareOnly(h)); if (plain.length) pool = plain; }
  const ok = pool.filter((h) => !exclude.includes(h.id) && (h.needs || []).every((n) => n === 'photography' || input.have.includes(n)));
  return pick(fresh(ok.length ? ok : pool.filter((h) => !exclude.includes(h.id)).length ? pool.filter((h) => !exclude.includes(h.id)) : pool, recent('hero', 3)));
}
// Type is dealt from the font collection (library/fonts.json): the kind of pairing, the faces, weights,
// case and a six-step scale, avoiding the faces of recent builds. The direction leans the deal, never fixes it.
function isDark(p) { if (!p?.bg || !/^#[0-9a-f]{6}$/i.test(p.bg)) return false; const n = parseInt(p.bg.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.35; }
function dealType(dir, exclude, tone, dark = false) {
  const recentFamilies = hist.slice(0, 6).flatMap((h) => h.families || []);
  const without = exclude.filter(Boolean).flatMap((id) => L.fonts.filter((f) => String(id).includes(f.family.toLowerCase().replace(/\s+/g, '-'))).map((f) => f.family));
  return dealTypeSystem({ rnd, fonts: L.fonts, tone: tone || null, dirClasses: dir.typeClasses || [], recentFamilies, exclude: without, dark });
}
// Colour: about half the time a restrained palette generated for this page (one ground, one ink, one
// accent), otherwise a studied palette from the library. Loud, many-field palettes are dealt only for a
// bold or playful tone: on other pages they made the site look like a sweet shop.
function LOUD(p) { return (p.tags || []).some((t) => ['flat-loud', 'pastel-fields'].includes(t)) || (p.fields || []).length >= 3; }
function dealPalette(dir, input, exclude) {
  const loudOk = ['bold', 'playful'].includes(input.tone);
  const recentGrounds = hist.slice(0, 4).map((h) => h.ground).filter(Boolean);
  if (rnd() < 0.55) return dealPaletteV25({ rnd, tone: input.tone, recent: [...recentGrounds, ...hist.slice(0, 3).map((h) => h.hue).filter(Boolean)] });
  let pool = L.palettes.filter((p) => (dir.palettes || []).includes(p.id) || (p.tags || []).some((t) => (dir.paletteTags || []).includes(t)));
  if (!pool.length) pool = L.palettes;
  if (!loudOk) { const calm = pool.filter((p) => !LOUD(p)); pool = calm.length >= 2 ? calm : L.palettes.filter((p) => !LOUD(p)); }
  const p = pool.filter((x) => !exclude.includes(x.id));
  return pick(fresh(p.length ? p : pool, recent('palette', Math.min(6, pool.length - 1))));
}
function dealPhotos(dir, input) {
  if (dir.photos === false) return null; // image-free directions
  const words = briefWords(input.brief);
  const mode = imageryMode(input);
  const SOFT_SETS = ['architecture', 'fog-and-quiet', 'sky-and-space', 'texture', 'water'];
  // subject first (sector + words of the brief), then the direction's preferred tone
  const scored = Object.entries(L.photos.sets).map(([id, set]) => {
    let score = (set.sectors || []).includes(input.sector) ? 3 : 0;
    if ((set.primary || []).includes(input.sector)) score += 5;
    // rooms and tables would be taken for this very house: for places to stay, deal the surroundings instead
    if (mode === 'atmosphere' && ['hospitality', 'real-estate'].includes(input.sector) && id === 'interior-and-table') score -= 6;
    score += words.filter((w) => (set.keywords || []).some((k) => k === w || (k.length >= 5 && w.startsWith(k)) || (w.length >= 5 && k.startsWith(w)))).length * 4;
    score += set.photos.filter((ph) => words.some((w) => ph.alt.toLowerCase().includes(w))).length;
    if (dir.photoTone) score += set.photos.filter((ph) => ph.tone === dir.photoTone).length / set.photos.length;
    return { id, set, score };
  }).filter((x) => x.score > 0 && x.set.photos.length >= 5 && (mode !== 'interface' || SOFT_SETS.includes(x.id))).sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  // one set, so the photographs share a subject and a light; choose among the best-fitting few
  const top = scored.filter((x) => x.score >= scored[0].score * 0.6).slice(0, 4);
  const chosen = pick(top);
  let pool = chosen.set.photos;
  if (dir.photoTone) { const toned = pool.filter((ph) => ph.tone === dir.photoTone || ph.tone === 'mid'); if (toned.length >= 6) pool = toned; }
  // Without product photographs, a picture of the same kind of thing would pass for the product: deal
  // those last and mark them. Otherwise a picture that matches the brief is the better atmosphere.
  const things = words.filter((w) => w.length >= 5);
  const matches = (ph) => things.some((w) => ph.alt.toLowerCase().includes(w));
  const bonus = mode === 'no-product-photo' ? -2 : 2;
  const ranked = shuffle(pool).sort((a, b) => (b.quality + (matches(b) ? bonus : 0)) - (a.quality + (matches(a) ? bonus : 0)))
    .map((ph) => (mode === 'no-product-photo' && matches(ph) ? { ...ph, lookalike: true } : ph));
  return { set: chosen.id, title: chosen.set.title, note: chosen.set.note, treatment: dir.photoTreatment || null, others: scored.filter((x) => x.id !== chosen.id).slice(0, 4).map((x) => x.id), photos: ranked.slice(0, mode === 'interface' ? 4 : 8) };
}
function briefStop() {
  return new Set(['with', 'that', 'this', 'from', 'page', 'site', 'website', 'landing', 'their', 'they', 'have', 'will', 'your', 'about', 'into', 'make', 'build', 'create', 'design', 'small', 'based', 'called', 'named', 'which', 'where', 'what', 'need', 'want', 'like', 'also', 'some', 'very', 'more', 'most', 'just', 'than', 'then', 'them', 'and', 'the', 'for', 'one', 'hand', 'handmade', 'made', 'batch', 'ship', 'ships', 'week', 'within', 'across', 'euro', 'euros', 'cost', 'price', 'open', 'only', 'each', 'every', 'there', 'images', 'photos', 'photograph', 'static', 'html']);
}
function briefWords(brief) {
  const stop = briefStop();
  return [...new Set(String(brief || '').toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4 && !stop.has(w)).map((w) => w.replace(/(ies|es|s)$/, '')))].filter((w) => w.length >= 4);
}
// First queries for scripts/assets.mjs, built from the brief: the place in old postcards and maps, then the
// subject itself. In testing "<place> postcard" and "<place> old map" found archival material far more
// reliably than a place and a year. A start only: the better queries come from the builder's inventory.
function assetQueries(input) {
  const brief = String(input.brief || '');
  const notPlace = /^(?:january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?$/i;
  const placeRe = /(?:^|[\s,(])(?:in|at|near|from|on|above|below|beside|outside|off|over)\s+(\p{Lu}[\p{L}'’-]*(?:\s+(?:\p{Lu}[\p{L}'’-]*|de|da|do|dos|das|di|del|van|von|der|den))*)/gu;
  const place = [...brief.matchAll(placeRe)].map((m) => m[1].trim()).find((p) => !notPlace.test(p.split(/\s+/)[0]));
  const stop = briefStop();
  const generic = new Set(['seat', 'seats', 'room', 'rooms', 'minute', 'minutes', 'hour', 'hours', 'night', 'nights', 'year', 'years', 'people', 'family', 'local', 'short', 'best', 'making', 'selling', 'serving', 'offering', 'business', 'company', 'brand', 'shop', 'store', 'studio', 'service', 'services', 'dinner', 'lunch', 'breakfast', 'included', 'online', 'modern']);
  // the subject: the last plain words of the first noun phrase ("a 38-seat Italian restaurant in ..." gives "restaurant")
  const words = brief.split(/\s+/).filter(Boolean); const phrase = [];
  for (let k = words.findIndex((w) => /^an?$/i.test(w)) + 1; k < words.length; k++) {
    if (/^(?:in|at|on|for|from|with|near|above|below|by|that|which|who|of|and|to)$/i.test(words[k])) break;
    phrase.push(words[k].replace(/[,.;:()!?]+$/, ''));
    if (/[,.;:()!?]$/.test(words[k])) break;
  }
  const plain = phrase.filter((w) => /^\p{Ll}{3,}$/u.test(w) && !stop.has(w) && !generic.has(w));
  const subject = plain.slice(-2).join(' ') || (input.sector !== 'other' ? input.sector.replace(/-/g, ' ') : null);
  const out = [];
  if (place) out.push(`${place.toLowerCase()} postcard`, `${place.toLowerCase()} old map`);
  if (subject) out.push(subject.toLowerCase());
  return [...new Set(out)];
}
// Blueprints written for showing software (an interface fragment is their picture).
function softwareOnly(x) { return (x.directions || [])[0] === 'product-performs' || (x.tags || []).includes('ui-led') || /data-ui|interface fragment/i.test(x.blueprint || ''); }
// Blueprints were measured on real sites and carry that site's sizes, greys, faces, colours and corners.
// This lists, for one blueprint, exactly where it disagrees with the house rules and the dealt system,
// so the builder does not have to work it out section by section.
function adjustments(bp, s) {
  const text = [bp.blueprint, bp.mobile, bp.headline].filter(Boolean).join(' ');
  const notes = [];
  const sizes = (re) => [...new Set([...text.matchAll(re)].map((m) => m[1] + 'px'))];
  const notSpacing = String.raw`(?!\s*(?:gaps?|gutters?|margins?|padding|radius|corners?|apart|from|inset|offset|high|tall|wide|thick|square|borders?|stroke|rules?|line\b|dots?|circles?|bars?|of|between|beneath|below|above|under|down|up|across|deep|left|right|in\b|to\b|and\b|each))`;
  const tiny = sizes(new RegExp(String.raw`(?<!(?:radius|radii|gap|margin|padding|inset|offset)[:\s]{0,3}(?:of\s)?)\b(9|10|11|12)(?:\.\d)?px\b` + notSpacing, 'g'));
  if (tiny.length) notes.push(`It sets text at ${tiny.join(', ')}: use your small step (13px or more) instead.`);
  const running = sizes(/\b(14|15)px\s*(?:paragraphs?|body|text|descriptions?|copy|sentences?|answers?)/gi);
  if (running.length) notes.push(`It sets running text at ${running.join(', ')}: paragraphs use your body step (16px or more).`);
  if (/\d{1,2}% (?:opacity|black|ink|grey|gray|white)|opacity:? ?0?\.\d|\b(?:rest|others?|remaining)\b[^.;]{0,25}\b(?:at|to) \d{1,2}%(?! (?:of|width|wide))|full (?:ink|white|strength)[^.;]{0,60}\bat \d{1,2}%(?! (?:of|width|wide))/i.test(text)) notes.push('It fades text: anything a visitor reads, inactive items of a list included, is `--ink` or `--muted` at full strength (contrast 4.5:1 or more). The active item is told apart by `--ink` against `--muted`, weight or the accent, not by fading the rest.');
  if (/\d+px (?:corner )?radius|radius (?:of )?\d+px|\brounded\b|\bpill/i.test(text)) notes.push('It names its own corners: use the one radius of this page (square unless the direction says otherwise) and one button shape.');
  if (/\b(?:serif|sans-serif|condensed|grotesk|italic|monospace|mono|all caps|uppercase|capitals|script)\b/i.test(text)) notes.push(s.type ? `It names a kind of typeface: use the dealt faces (display ${s.type.display.family}, text ${s.type.text.family}) and their settings; capitals only where the type system sets them.` : 'It names a kind of typeface: use the brand faces.');
  const colours = [...new Set([...text.matchAll(/\b(green|red|blue|yellow|orange|pink|purple|teal|navy|cream|beige|brown|grey|gray|white|black)\b(?![- ](?:space|studio|background disappears))/gi)].map((m) => m[1].toLowerCase()))];
  if (colours.length) notes.push(`It names colours (${colours.join(', ')}): map them onto this palette's roles (ground \`--bg\`, panels \`--surface\` and the fields, text \`--ink\`/\`--muted\`, the accent \`--accent\` on the primary action only).`);
  if (/(?<!\b(?:no|without|never|not|nor) (?:a |any )?)\b(?:rule|rules|hairline|border|borders|divider|underline|thin line|1px line)\b/i.test(text)) notes.push('It draws lines or borders: keep them only inside a table, a form or a `data-ui` fragment; elsewhere separate with space or a change of ground.');
  if (/shadow|glow/i.test(text)) notes.push('It mentions a shadow: only on something open above the page (a menu, a dialog), never on a resting element.');
  const bigSentence = [...text.matchAll(/\b(?:sentence|statement|paragraph|quotation|quote)\b[^.;]{0,40}?\b(?:at|to)\s+(?:clamp\(\s*\d+(?:\.\d+)?px,\s*)?(\d+(?:\.\d+)?)(px|vw)/gi)].some((m) => (m[2] === 'px' && +m[1] > 36) || (m[2] === 'vw' && +m[1] > 2.6));
  if (bigSentence) notes.push('It sets a sentence large over several lines: jurors read that as a long headline. Either cut it to a two-line headline at display size, or keep it a statement at 36px or less on three lines (24px, four lines on a phone).');
  if (/(?:sticky|pinned|pins?\b|stays? (?:fixed|put|in place))/i.test(text) && /\b(?:three|four|five|six) (?:to (?:four|five|six) )?(?:viewports|screens)\b|\b[3-6]00svh\b/i.test(text)) notes.push('It pins something for three screens or more: hold a pin for two or three screens at most, give every screen under it its own content, and let nothing pass over the pinned words (the inspector checks all three).');
  if (/mix-blend-mode:\s*(?:difference|exclusion)/i.test(text)) notes.push('It blends text with `difference`: over anything but black, white or grey that gives random hues. Use a solid ink chosen for each ground instead.');
  if (/tops? of the (?:letters|word|name|wordmark)|(?:letters|wordmark|name|word)\b[^.;]{0,30}\b(?:sliced|cut|cropped|clipped)[^.;]{0,20}\btop/i.test(text)) notes.push('It crops letters along their top: the inspector fails that (jurors read it as broken). Crop at the bottom edge or a side instead.');
  if (bp.archetype && /single action[^.;]{0,40}?\b(?:text link|underlined (?:text )?link)/i.test(text)) notes.push('Its action is a text link: the primary action on the first screen is a real button (filled or solid-bordered, 44px or taller), placed where the blueprint puts the link. A second action may stay a link.');
  if (['condensed-heavy', 'condensed'].includes(s.type?.class) &&/\d+(?:\.\d+)?vw/.test(text)) notes.push('Its vw sizes assume a face of normal width: with this condensed display face, size the words to fill the measure the blueprint gives them instead of copying the vw value.');
  if (/\b0[1-9]\b(?![:.,]\d)|numbered|index number/i.test(text)) notes.push('It numbers things 01, 02: drop the numbers unless they are real data (a price, a date, a count).');
  return notes;
}
// Every blueprint of a role that suits this direction and this build's real assets.
function sectionPool(dir, role, input) {
  // banned blueprints (drag rails, progress bars, folder tabs) are never dealt
  let pool = L.sections.filter((s) => s.role === role && !s.banned);
  if (!pool.length) return [];
  const mode = imageryMode(input);
  const feasible = pool.filter((s) => (s.needs || []).every((n) => n === 'photography' || input.have.includes(n) || (n === 'product-ui' && mode === 'interface')));
  if (feasible.length) pool = feasible;
  if (mode !== 'interface' && !input.have.includes('product-ui')) { const plain = pool.filter((s) => !softwareOnly(s)); if (plain.length) pool = plain; }
  if (mode === 'interface' || mode === 'no-product-photo') {
    // prefer compositions that do not hang on a photograph of the thing
    const honest = pool.filter((s) => (mode === 'interface' ? worksWithoutPictures(s) : !(s.tags || []).includes('object-led') || worksWithoutPictures(s)));
    if (honest.length >= 2) pool = honest;
  }
  const byDirection = pool.filter((s) => (s.directions || []).includes(dir.id));
  if (byDirection.length) return byDirection;
  const byTag = pool.filter((s) => (s.tags || []).some((t) => (dir.sectionTags || []).includes(t)));
  return byTag.length ? byTag : pool;
}
function dealSection(dir, role, usedIds, prevShape, nextShape, input) {
  let pool = sectionPool(dir, role, input);
  if (!pool.length) return null;
  if (imageryMode(input) === 'interface') { const ui = pool.filter((s) => (s.tags || []).includes('ui-led')); if (ui.length >= 2 && rnd() < 0.6) pool = ui; }
  const unused = pool.filter((s) => !usedIds.includes(s.id)); if (unused.length) pool = unused;
  const varied = pool.filter((s) => s.shape !== prevShape && s.shape !== nextShape); if (varied.length) pool = varied;
  return pick(pool);
}
function dealReferences(dir, input) {
  const named = (dir.seenIn || []).map((n) => L.sites.find((s) => s.id === n || s.name === n)).filter(Boolean);
  // the October 2026 panel scored on a lower scale (its top band starts at 7.5, the first panel's at about 7.6)
  const good = (s, a, b) => s.score >= (s.panel === '2026-10' ? b : a);
  const sameKind = L.sites.filter((s) => s.kind === input.sector && good(s, 7.2, 7.3) && !named.includes(s));
  const out = [...shuffle(named).slice(0, 2), ...shuffle(sameKind).slice(0, 1)];
  return out.length ? out : shuffle(L.sites.filter((s) => good(s, 7.6, 7.5))).slice(0, 2);
}

// ---------- rendering ----------
function siteCard(s, full) {
  // on the sheet only the idea: the details of another site's look are what builders copied literally
  const lines = [`- **${s.name}** (${s.source}, studied score ${s.score}) \`${s.id}\``, `  Idea: ${s.idea}`];
  if (full) {
    lines.push(`  Hero: ${s.hero}`, `  Type: ${s.type}`, `  Colour: ${s.colour}`, `  Imagery: ${s.imagery}`, `  Layout: ${s.layout}`);
    if (s.media) lines.push(`  Pictures and footage: ${s.media}`);
    if (s.motion) lines.push(`  Motion: ${s.motion}`);
    for (const sec of s.sections || []) lines.push(`  Section (${sec.role}): ${sec.description}`);
    for (const t of s.steal || []) lines.push(`  Worth taking: ${t}`);
    lines.push(`  URL: ${s.url}`);
  }
  return lines.join('\n');
}
function render(s) {
  const d = s.direction; const o = [];
  const p = (x = '') => o.push(x);
  p(`# DIRECTION SHEET — ${d.name}`);
  p(`seed ${s.seed} · drawn ${s.at.slice(0, 10)}${s.redraws ? ` · redraws: ${s.redraws}` : ''} · sector ${s.input.sector}${s.input.tone ? ' · tone ' + s.input.tone : ''}`);
  if (s.input.brief) p(`Brief: ${s.input.brief}`);
  p();
  p('| | |'); p('| --- | --- |');
  p(`| Direction | ${d.name} |`);
  p(`| Hero | ${s.hero.name} |`);
  p(`| Type | ${s.type ? s.type.name : 'kept from the brand'} |`);
  p(`| Colour | ${s.palette ? s.palette.name : 'kept from the brand'} |`);
  p(`| Sections | ${s.sections.map((x) => x.role + (x.name && x.name !== x.role ? ' (' + x.name + ')' : '')).join(' → ')} |`);
  p(`| Motion | ${s.motion ? s.motion.name : '—'} |`);
  p(`| Photographs | ${s.photos ? 'the "' + (s.photos.title || s.photos.set) + '" set, as atmosphere' : 'none'} |`);
  if (s.frame) {
    const f = s.frame;
    p(`| Navigation · footer | ${f.nav.id} · ${f.footer.id} |`);
    p(`| Corners · spacing · pictures | ${f.corners.id} · ${f.spacing.id} · ${f.treatment.id} |`);
    p(`| Interactive piece · video | ${f.interaction.id} · ${f.clip.id} |`);
  }
  p();
  if (s.frame) {
    const f = s.frame;
    p('## 0. The frame (dealt; these replace whatever a blueprint below says about them)');
    p(`- **Navigation:** ${f.nav.text} Every page has it, with the real sections as links and the one action.`);
    p(`- **Footer:** ${f.footer.text} Never a giant name or email; picture credits, if a licence needs them, behind one small "Image credits" link.`);
    p(`- **Corners:** ${f.corners.text} (\`--radius: ${f.corners.radius}\`, buttons \`${f.corners.button === 'square' ? '0' : f.corners.button}\`).`);
    p(`- **Spacing:** ${f.spacing.text}`);
    p(`- **Pictures:** ${f.treatment.text}`);
    p(`- **Interactive piece:** ${f.interaction.text}`);
    p(`- **Video:** ${f.clip.text}`);
    p();
  }
  p('This is the direction for this build. Adopt it. Do not blend it with the layout you would have made anyway,');
  p('and do not redraw because it is unfamiliar: unfamiliar is the point. Redraw a slot only when it conflicts');
  p('with a stated brand constraint or needs an asset that does not exist, and say why in your report.');
  p();
  p('The parts of this sheet were written separately and will disagree in small ways. Settle every disagreement in this order:');
  p('**house rules** (including type no smaller than 13px and body text of 16px or more) → **the direction** (the idea, the composition habits, where the');
  p('one accent goes) → **the frame, the type system and the palette** (sections 0, 3 and 4: they win over any colour, face, size, corner or footer');
  p('a direction or blueprint names) → **the hero blueprint** → **the section blueprints**. Under each blueprint, "Adjusted for this page" lists where it disagrees.');
  p('Blueprints are examples of a shape, not drawings to trace: keep the idea of the shape (what is large, what sits beside what) and let the real');
  p('content decide the details. Map every size onto the six type steps. One button shape, one corner radius and one pair of page margins on the');
  p('whole page. If a direction or blueprint asks for a loud colour, a heavy face or a giant size the dealt system does not have, the dealt system wins.');
  p();
  p('## 1. The idea'); p(d.idea); p();
  p('Before anything else, write one sentence in your notes: "On this page, <the subject\'s own material> becomes <the device>."');
  p('Fill the first blank from your inventory of what only this client has (its name and what it means, its street, its numbers, its');
  p('constraint), then put the nearest competitor in the sentence: if it still works, the idea is the category\'s, not the client\'s.');
  p('If section 0 deals an interactive piece, decide now what it is, from the subject (SKILL.md step 4).'); p();
  p('## 2. Composition'); p(d.composition); p();
  if (s.type) {
    const t = s.type;
    p(`## 3. Type — ${t.name}`); p(t.note);
    p('```html'); for (const l of [...new Set([t.display.css, t.text.css].filter(Boolean))]) p(l); p('```');
    p(`- Display: **${t.display.family}** — ${t.display.settings}`);
    p(`- Text: **${t.text.family}** — ${t.text.settings}`);
    if (t.scale) { p('```css'); p(':root {'); for (const [k, v] of Object.entries(t.scale)) p(`  --${k}: ${v};`); p('}'); p('```'); }
    if (d.typography) p(d.typography);
    p('The direction decides sizes and how many of them; the type system decides how this face is set. Where the two give different tracking or leading, use the values of the type system: they are tuned to this face.');
    p('These six steps are the whole scale. Map every size a blueprint names onto the nearest step; the hero headline takes `--step-display`, whatever size the hero blueprint gives.');
    p();
  } else { p('## 3. Type'); p('Kept from the brand. ' + (d.typography || '')); p(); }
  if (s.palette) {
    const c = s.palette;
    p(`## 4. Colour — ${c.name}`); p('```css'); p(':root {');
    for (const k of ['bg', 'surface', 'ink', 'muted', 'accent', 'accentInk']) if (c[k]) p(`  --${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${c[k]};`);
    (c.fields || []).forEach((f, i) => p(`  --field-${i + 1}: ${f.bg};${f.ink ? `  --field-${i + 1}-ink: ${f.ink};` : ''}`));
    p('}'); p('```'); p(c.note); if (d.colour) p(d.colour); p();
  } else { p('## 4. Colour'); p('Kept from the brand. ' + (d.colour || '')); p(); }
  p('## 5. Imagery');
  // where to look for real pictures of the subject's world, with first queries built from the brief
  const qs = assetQueries(s.input);
  const find = qs.length
    ? `\`${ASSETS_CMD} "${qs[0]}"\`${qs.length > 1 ? `, then ${qs.slice(1).map((q) => `"${q}"`).join(' and ')}` : ''}, then queries from your inventory (its street, its materials, its trade's tools and history)`
    : `\`${ASSETS_CMD} "<a place, material or object from your inventory>"\``;
  const SOURCES = 'Order of sources: (1) the project\'s own pictures; (2) pictures you generate, if you have an image tool (the best way to show this exact subject); (3) the dealt photographs below and the rest of the library (`node <skill>/scripts/draw.mjs --photos <words>`): sharp, modern and free of credits; (4) real photographs from the open collections (' + find + '), only sharp modern photographs at 1800px or more, credited in the Image credits dialog (`--credits` prints it), never in the footer; (5) drawn in code. Archive photographs, old maps and engravings only when they are the idea itself (the history this subject continues, shown sharp and large as one family, like the slip boxes behind a notes app), never as filler, never small, never a random old picture of the place.';
  const MODE = {
    interface: '**This subject is software and there are no screenshots, so its pictures are its own interface.** Wherever this sheet says photograph, image or object, build a believable fragment of the product in HTML at real size (real labels, numbers that add up, one item hovered or selected) by the app-screen rules (references/app-screens.md: deal its style once with `node <skill>/scripts/draw.mjs --app --kind <kind> --keep palette,type --out .taste-skill/app`, and build it with assets/app.css and assets/charts.js), put the attribute `data-ui` on its root, and crop or scale it the way the blueprint treats a photograph: a full-bleed close crop, a tile, the fixed half of a split. Where a fragment makes no sense, use a flat colour field with type on it. Never a fake dashboard of grey bars, never a device frame. The first screen shows the product large (at least half the screen) at a size a visitor can read (labels 12px or more, its main text 14px or more; crop to fewer rows rather than shrink it). Further down, at least one more large picture that is not an interface card (a photograph of the world the product works in, a large figure, a drawn object), and never more than two sections in a row built from interface cards: a page of dark cards on a dark ground reads as one long screenshot. If the product works on something physical (ships, plants, buildings, a city), one real picture of that world can carry a section: find it with `' + ASSETS_CMD + ' "<that world>"`, download it with `--get`, credit it in the Image credits dialog if its licence asks, and never let it pass for the product or its customers.',
    'no-product-photo': '**There are no photographs of the product, and none can be faked.** If you have an image tool, generate the product as it really is (its shape, material and colour from the brief) and say so in the report. Otherwise draw it in code, large and precise, in one graphic language and its real colours (references/imagery.md §8), or carry the slot with type and the product\'s facts. Around it, sharp photographs of its world (its material up close, where it is used) that no visitor could take for the product. In your report, say that product photography is needed and which slots it will fill.',
    atmosphere: '**The project has no photographs of its own yet.** Plan the set before building: three to six sharp pictures of one family (one light, one treatment) that show the subject\'s world, reused at different crops instead of a new picture for every slot. They show the world around the client and never pretend to be the client\'s own room, dish, product, person or team. Where no honest picture exists, leave the slot to type and space, or draw the subject\'s own things in code, large and precise (references/imagery.md §8). List every picture and its source in your report.',
    own: '**Use the images that belong to the project in every picture slot.** For slots they cannot fill, the dealt photographs or sharp photographs of the subject\'s world come next.',
  };
  p(MODE[s.imagery || 'atmosphere']); p(); p(SOURCES); p(); p(d.imagery);
  p(); p('**Pictures: fewer, better, larger (the inspector checks them).** Three to eight pictures that show this subject, each requested at least 1.5 times the size it is shown (twice for the hero), all with the treatment dealt in section 0. Before placing one, look at it: if it is soft, random, or could belong to any site, leave the slot out instead. No thumbnails inside sentences, no pictures inside headlines, no small pictures filling a gap, no caption under a picture unless it says something the visitor needs. SVG drawings do not count as pictures. Video only as section 0 deals it.');
  if (s.photos) {
    p();
    p(s.imagery === 'interface' ? `Optional atmosphere, two at most, from the "${s.photos.title || s.photos.set}" set (${s.photos.note}). The page does not need them.` : `Photographs dealt for this build, from the "${s.photos.title || s.photos.set}" set (${s.photos.note})`);
    p('They are real photographs (Unsplash licence, no credit needed, served by picsum.photos) of places, light and texture: atmosphere,');
    p('never a stand-in for a specific product, dish, person or interface. List the ones you use in your report so they can be replaced.');
    if (s.photos.treatment) p(`Treatment: ${s.photos.treatment}`);
    for (const ph of s.photos.photos) p(`- \`https://picsum.photos/id/${ph.id}/1600/1000\` — ${ph.alt} · ${ph.tone} tone · ${(ph.colours || []).join(', ')}${ph.mono ? ' · black-and-white' : ''}${ph.lookalike ? ' · **could be taken for the product: never use it as the product**' : ''}${ph.calm && ph.calm !== 'none' ? ` · calm area: ${ph.calm}` : ''} · native ${ph.ratio >= 1.15 ? 'landscape' : ph.ratio <= 0.87 ? 'portrait' : 'square'} · photo: ${ph.by}`);
    p('The last two path numbers are width and height: request the exact crop you render (`/1200/1500` for a 4:5 portrait, `/2400/1350` for a hero) and');
    p('add `?grayscale` to desaturate. ' + (s.imagery === 'interface' ? 'Use at most two.' : 'Use three to six of them, not all eight.') + ' Always set `width`, `height`, `alt` and `loading="lazy"` (not on the hero image).');
    if (s.photos.others?.length) p(`Other sets that fit this brief: ${s.photos.others.join(', ')} — \`node draw.mjs --photos <set>\` prints one in full; \`--photos list\` shows all sets. Taking photographs from another set is your call and is not a redraw; keep them to one light and one treatment.`);
  } else if (d.photos === false) {
    p(); p('This direction does not lead with photographs: use the few pictures the content really needs, where the direction allows them.');
  }
  p();
  const adjust = (bp) => { const n = adjustments(bp, s); if (n.length) { p(); p('Adjusted for this page:'); for (const x of n) p(`- ${x}`); } };
  p(`## 6. Hero — ${s.hero.name}`); p(s.hero.blueprint); p(); p(`On a phone: ${s.hero.mobile}`); if (s.hero.headline) p(`Headline: ${s.hero.headline}`); adjust(s.hero); p();
  p('## 7. Sections, in order');
  p('Each is one example of a shape for this section: keep what is large and what sits beside what, and let the real content decide the');
  p('details (sizes from the six steps, colours from section 4, corners from section 0). Re-order or drop a section when the argument of the');
  p('page needs it (see references/copy.md), never to fall back to a card grid. A section a scene carries (section 9) is that scene.');
  s.sections.forEach((sec, i) => {
    p();
    if (sec.role === 'footer' && s.frame) { p(`### ${i + 1}. footer — as dealt in section 0`); p(s.frame.footer.text); return; }
    if (!sec.blueprint) { p(`### ${i + 1}. ${sec.role}`); p('No blueprint in the library for this role. Compose it from the direction above, using a layout shape not used by its neighbours.'); return; }
    p(`### ${i + 1}. ${sec.role} — ${sec.name} (${sec.shape})`); p(sec.blueprint); if (sec.mobile) p(`On a phone: ${sec.mobile}`); adjust(sec);
  });
  p();
  if (s.motion) { p(`## 8. Motion — ${s.motion.name}`); p(s.motion.description); p('This is the signature move, the one loud moment. Around it the page still needs the rest of the motion layer (SKILL.md step 9): an entrance for the parts of every section and feedback on every control; video only as section 0 deals it. The inspector fails a page that barely moves. Recipes: references/motion.md.'); p(); }
  if (s.scenes?.length) {
    p('## 9. Scroll scenes');
    p(`The page's big moments: ${s.scenes.length} scroll scenes, tested and ready to fill. They are part of the composition, so build them in step 6 with the section they carry, not as a motion afterthought. Each runs on the shared stage (assets/scenes/stage.js and stage.css, with GSAP and Lenis from the pinned CDN lines in stage.js) and ships its own finished composition for reduced motion and for phones that rest. How to put one on a page, fill it and check it: references/scenes.md. Check them with \`node <skill>/scripts/scenes.mjs <page>\` and look at every sheet.`);
    const held = s.scenes.reduce((t, x) => t + (x.hold || 2), 0);
    p(`**The length budget.** Together these scenes hold about ${+held.toFixed(1)} screens of scroll (a scene's section is its hold plus one screen tall). A scene replaces the content of the section it carries: it is that section, not extra screens in front of it, and it never adds screens of nothing. The whole page still runs about 12-16 screens at 1440 (the inspector's header counts them), so build the other sections to their content and keep each hold to the beats it has.`);
    p(`**The demo is not the content.** Each scene's demo page is a working example for a made-up client: its town, its photographs, its map, its object and its words are placeholders. Every picture, word and drawn thing in your scene comes from this subject (your inventory, SKILL.md step 1): a route map shows the real route with its real coast, water and relief; a fly-through passes through this client's own work; a quote is the client's own words. A scene that still shows the demo's content, or the stand-in a script draws when it is given nothing (the route's bare ground with only the road, the plain jet), is unfinished.`);
    for (const sc of s.scenes) {
      p();
      const what = sc.carries === 'hero' ? 'the first screen' : `the ${sc.carries} section`;
      p(`### ${sc.name} (\`${sc.id}\`) — ${sc.position === 'transition' ? `the hand-over into ${what}` : `carries ${what}`}`);
      p(`${sc.summary}${sc.hold ? ` Holds about ${sc.hold} screens.` : ''}`);
      if (sc.place) p(`Where: ${sc.place}`);
      if (sc.carries === 'work') p('On the work, the scene is the work: its cards, chapters or pictures are the pieces themselves, each shown once and each linking to its piece. The world around the work belongs on another section.');
      if (sc.content) p(`Content: ${sc.content}`);
      if (sc.options) p(`Options (data-options): ${sc.options}`);
      p(`Files: \`<skill>/assets/scenes/${sc.id}.js\` and \`${sc.id}.css\`; a working example (its content is a placeholder): \`<skill>/assets/scenes/demo/${sc.id}.html\`.${sc.phone ? ' On a phone: ' + sc.phone : ''}`);
    }
    p();
    p('Leave a quiet section between two scenes so each one lands. A scene whose content you cannot fill honestly is redrawn (`--redraw scenes`), never faked. A page with scenes is long: keep the navigation, or at least the one action, in reach on every screen (references/layout.md §7).');
    p();
  }
  if (d.richness) { p('## 10. Where the richness comes from'); p(d.richness); p(); }
  if (d.pitfalls) { p('## 11. How this direction goes wrong'); p(d.pitfalls); p(); }
  if (s.references?.length) {
    p('## 12. Real references');
    p('Studied sites that work this way. Take the principle, never the specifics: no names, copy, images or signature assets of theirs.');
    for (const r of s.references) p(siteCard(r, false));
    p('Full notes on any of them: `node draw.mjs --site <id>`.'); p();
  }
  p('## Always');
  p('Headlines two lines or fewer at every width. No eyebrow labels, no monospace, no 01/02/03, no thin rules, no gradients, no shadows at rest,');
  p('no cream-and-terracotta, no violet. The frame: one h1 on the first screen that says what this is, equal outer margins, no');
  p('section huddled on one side with the other half empty, no blank stretch over half a screen, a heading on every section. No picture inside a');
  p('headline or a sentence, no giant name or credits in the footer, no drag or progress bars, no page built from boxes, one accent hue, few words.');
  p('`inspect.mjs` measures all of it.');
  if (s.allow?.length) p(`This direction is allowed: ${s.allow.join(', ')} (the inspector reads this from the saved sheet).`);
  p();
  p(`Saved to ${sheetPath.split('\\').join('/')} · reprint with \`node draw.mjs --show\``);
  return o.join('\n');
}
