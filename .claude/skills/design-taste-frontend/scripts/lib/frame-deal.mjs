// tasteskill / frame-deal — deal the parts every page has and every model builds the same way:
// navigation, footer, corners, spacing, how pictures are treated, and whether the page has an
// interactive piece or a moving picture at all. Left to the builder, these came out identical on 51
// reviewed pages (a live widget on 33 of 34, video on 29, a giant footer name on 28, square buttons on 22).

const NAV = [
  ['bar', 5, 'A plain bar: the name on the left, three to six links, one action on the right. It stays at the top, or hides on the way down and returns on the first scroll up.'],
  ['centred-name', 1.5, 'The name centred, the links split either side of it, the action at the far right. Good when the name is short.'],
  ['two-rows', 1, 'A thin top row with secondary links (help, sign in, language) over a main row with the name, the main links and the action, like a large company site.'],
  ['menu', 1.2, 'The name on the left, the one action and a "Menu" button on the right that opens a full panel with the links. Only for pages with six links or more; the action stays visible.'],
  ['split', 0.8, 'The name on the left, the main links in the middle of the width, the action and a secondary link (sign in, cart) on the right.'],
];
const FOOTER = [
  ['columns', 5, 'Link columns, as large companies close their pages: three to five short columns of real links (product, company, resources, legal), the name small, the legal line under them. Text sizes only.'],
  ['contact-band', 2.5, 'A contact band: address, hours, telephone and email in two or three columns at the body size, a short link row, and the legal line. The details a visitor came to the foot for.'],
  ['one-line', 1.5, 'One quiet line: the name, four to six links inline and the legal line, on one or two rows. For short pages.'],
  ['sign-up', 1.5, 'A short sign-up (one sentence and an email field with its button) above a row of links and the legal line.'],
  ['action-then-links', 2, 'The page\'s last section is the closing action (a heading and the one button); the footer under it is a small link row and the legal line.'],
];
const CORNERS = [
  [{ id: 'square', radius: '0', button: 'square' }, 3, 'Square corners on everything: pictures, panels, fields and buttons.'],
  [{ id: 'hint', radius: '4px', button: '4px' }, 2.5, 'A 4px radius on buttons, fields and panels; pictures square or at the same 4px.'],
  [{ id: 'soft', radius: '10px', button: '10px' }, 1.5, 'A 10px radius on panels, pictures and buttons alike; nothing else rounded.'],
  [{ id: 'pill', radius: '6px', button: '999px' }, 2.5, 'Fully round buttons and fields; panels and pictures at 6px or square.'],
  [{ id: 'large', radius: '20px', button: '999px' }, 0.8, 'A large 20px radius on pictures and panels with fully round buttons, as consumer apps do.'],
];
const SPACING = [
  [{ id: 'airy', section: '160-200px', margin: '48-64px' }, 2, 'Airy: 160-200px between sections, 48-64px page margins at 1440.'],
  [{ id: 'standard', section: '112-144px', margin: '32-48px' }, 4, 'Standard: 112-144px between sections, 32-48px page margins at 1440.'],
  [{ id: 'compact', section: '80-104px', margin: '24-32px' }, 2, 'Compact: 80-104px between sections, 24-32px margins; for pages with a lot of real content (shops, product lines).'],
];
const TREATMENT = [
  ['natural', 5, 'Pictures in natural colour, as shot, with matching light; no filters, no tints, no grain.'],
  ['one-grade', 1.5, 'One grade over every picture (slightly warm or slightly cool, a little lifted shadows), the same on all of them.'],
  ['mono', 0.8, 'Black-and-white pictures, all of them, with the page\'s one accent as the only colour.'],
  ['cut-out', 0.6, 'Objects cut out on the page ground (product shots with no background), people and places in natural colour.'],
];
const INTERACTION = [
  ['none', 5, 'No interactive widget. The page is read: its content, pictures and motion carry it. Controls are the navigation, the links, the action and any real form.'],
  ['tool', 2.5, 'One working tool the visitor would really use, built from the subject\'s content (a price or size calculator, a booking with real dates, a filter over the real list, a configurator). Not a toy, not a demo of the page\'s own design. It works on a phone with a thumb and has a plain fallback.'],
  ['product', 1.5, 'The product itself, operable in one place: a real fragment of the interface the visitor can click through (software), or a view of the object they can turn or switch (colour, size). Only where the subject has a product to operate.'],
];
const CLIP = [
  ['none', 5, 'No video. Motion comes from the page itself.'],
  ['one-clip', 2, 'One moving picture of the subject: a muted loop with a poster frame and a pause control, used once, large. Only if an honest clip of this subject exists.'],
  ['slow-picture', 1.5, 'One photograph that moves slowly as the page scrolls (a scale or drift of a few percent), once.'],
];

export function dealFrame({ rnd, input, imagery, recent = {} }) {
  const wpick = (pairs) => { const t = pairs.reduce((s, x) => s + x[1], 0); let r = rnd() * t; for (const x of pairs) { r -= x[1]; if (r <= 0) return x; } return pairs.at(-1); };
  const not = (pairs, last) => pairs.map((x) => [x[0], x[1] * (last && (x[0] === last || x[0]?.id === last) ? 0.35 : 1), x[2]]);
  const tone = input.tone;
  const software = imagery === 'interface';
  const nav = wpick(not(NAV, recent.nav));
  const footer = wpick(not(FOOTER, recent.footer));
  const corners = wpick(not(CORNERS.map((x) => [x[0], x[1] * (tone === 'luxury' && x[0].id === 'large' ? 0.2 : tone === 'playful' && x[0].id === 'square' ? 0.5 : 1), x[2]]), recent.corners));
  const spacing = wpick(not(SPACING.map((x) => [x[0], x[1] * (tone === 'luxury' && x[0].id === 'airy' ? 2 : input.sector === 'ecommerce' && x[0].id === 'compact' ? 2 : 1), x[2]]), recent.spacing));
  const treatment = wpick(not(TREATMENT.map((x) => [x[0], x[1] * (software && x[0] === 'cut-out' ? 0.3 : 1), x[2]]), recent.treatment));
  const interaction = wpick(not(INTERACTION.map((x) => [x[0], x[1] * (x[0] === 'product' && !(software || ['physical-product', 'ecommerce'].includes(input.sector)) ? 0 : 1), x[2]]), recent.interaction));
  const clip = wpick(not(CLIP.map((x) => [x[0], x[1] * (software && x[0] === 'one-clip' ? 0.5 : 1), x[2]]), recent.clip));
  return {
    nav: { id: nav[0], text: nav[2] }, footer: { id: footer[0], text: footer[2] },
    corners: { ...corners[0], text: corners[2] }, spacing: { ...spacing[0], text: spacing[2] },
    treatment: { id: treatment[0], text: treatment[2] }, interaction: { id: interaction[0], text: interaction[2] }, clip: { id: clip[0], text: clip[2] },
  };
}
