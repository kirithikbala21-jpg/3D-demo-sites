// Findings from probe-extra.mjs (v2.5): what reviewers kept finding on pages the first rules passed.
// Thresholds come from the October 2026 comparison of professional sites, award sites and skill builds
// (professional sites: no giant footers, about one hue, almost no page on coloured grounds).
export function judgeExtra(x, { width, allow = [], screens = 1, app = false } = {}) {
  const out = [];
  const add = (level, id, message, fix) => { if (!allow.includes(id)) out.push({ level, id, width, message, fix }); };
  const desktop = width >= 1100;
  const list = (a, f, n = 3) => a.slice(0, n).map(f).join('; ');
  // an app screen: only the breakage and the words checks apply
  if (app) {
    const titles = (x.longTitles || []).filter((t) => t.level !== 'H1' || t.words > 6);
    if (titles.length) add('WARN', 'sentence-title', `${titles.length} title(s) are sentences: ${list(titles, (t) => `"${t.text}" (${t.words} words)`)}.`, 'Titles on an app screen are nouns of one to three words ("Revenue", "Failed deploys"). The finding, if any, is one short line under the page title.');
    if (desktop && x.sentences > 4) add('WARN', 'app-wordy', `${x.sentences} sentences of more than 12 words on one screen.`, 'An app screen says one thing in words (the finding, one line); the rest is figures, names, labels and controls. Cut the explanations.');
    if (x.cutText?.length) add('FAIL', 'cut-text', `Text is cut by ${x.cutText[0].by} at ${width}px: ${list(x.cutText, (c) => `"${c.text}"`, 5)}.`, 'Nothing may be wider than the screen: let panels wrap, scroll a wide table inside its own frame with a visible edge, or drop columns at this width.');
    if (x.truncated?.length) add('WARN', 'ellipsis', `Text is shortened with an ellipsis: ${list(x.truncated, (t) => `"${t.text}"`, 4)}.`, 'Never cut the figure or name that matters. Let it wrap, shorten the label, or drop a column at this width.');
    return out;
  }
  const wordy = (x.uiWords || []).filter((u) => u.words > 120);
  if (wordy.length) add('WARN', 'fragment-wordy', `${wordy.length} interface fragment(s) carry more than 120 words: ${list(wordy, (u) => `"${u.text}…" (${u.words} words)`)}.`, 'A fragment on a page shows only the part that proves the claim: one panel, three to six rows, real names and figures, no captions or helper text.');

  if (x.imageInHeadline?.length) add('FAIL', 'picture-in-headline', `A picture sits inside a headline: ${list(x.imageInHeadline, (h) => `"${h.text}" (${h.how})`)}.`, 'Headlines are words only. Put the picture beside, above or behind the headline as its own element, at a size that shows what it is. Pictures set into the words or filling the letters are a generated-page tell now.');
  if (x.inlinePictures?.length) add('FAIL', 'picture-in-sentence', `${x.inlinePictures.length} small picture(s) inside running text: ${list(x.inlinePictures, (p) => `"${p.text}" (${p.size})`)}.`, 'Take the thumbnails out of the sentences. A picture worth showing gets its own place and size; a sentence is words.');
  if (x.footer && desktop && x.footer.vw >= 7) add('FAIL', 'giant-footer', `The footer sets "${x.footer.text}" at ${x.footer.size}px (${x.footer.vw}vw).`, 'No giant name or email at the foot of the page: professional sites close with the navigation again, the contact details, the legal line and one action, set at the text sizes. The name belongs in the hero.');
  if (x.footer && (x.footer.creditLinks >= 3 || x.footer.creditMentions >= 3)) add('FAIL', 'credit-wall', `The footer carries picture credits in the open (${Math.max(x.footer.creditLinks, x.footer.creditMentions)} credit links or mentions).`, 'Use pictures that need no credit (the project\'s own, generated, or Unsplash/Pexels-licence photographs). Credits a licence requires go behind one small "Image credits" link that opens a dialog or a separate page, never a wall of links in the footer.');
  const blurry = (x.upscaled || []).filter((u) => u.scale > 1.25), soft = (x.upscaled || []).filter((u) => u.scale > 1.0 && u.scale <= 1.25);
  if (desktop && blurry.length) add('FAIL', 'upscaled-picture', `${blurry.length} picture(s) shown larger than they were made: ${list(blurry, (u) => `${u.src} ${u.natural} shown at ${u.shown} (${u.scale}x)`)}.`, 'Use a source at least 1.5 times the size it is shown (2x for the hero). A small scan blown up to fill a big slot looks cheap; use a smaller slot or a better picture.');
  if (desktop && soft.length) add('WARN', 'soft-picture', `${soft.length} picture(s) shown at about their natural size or a little over: ${list(soft, (u) => `${u.src} ${u.natural} at ${u.shown}`)}.`, 'On a high-density screen these look soft. Request the picture at about twice the shown size.');
  if (x.colour) {
    if (x.colour.hues >= 4) add('FAIL', 'colour-sprawl', `${x.colour.hues} different hues on grounds, type and buttons (${x.colour.how.join(', ')}).`, 'One ground, one ink, one accent. Professional sites use one hue (often none beyond the action). Take every other colour out of grounds, cards, chips and type; colour comes from the pictures.');
    else if (x.colour.hues === 3) add('WARN', 'colour-sprawl', `Three hues on grounds, type and buttons (${x.colour.how.join(', ')}).`, 'One accent hue, used for the action and at most one other thing. Remove the third.');
    // a page on a coloured ground with a second hue on it (pink ground, lime button) is the loudest tell of all
    if (x.colour.colouredShare > 0.6 && x.colour.hues >= 2) add('FAIL', 'colour-ground', `% of the page stands on coloured grounds, with  hues on it.`, 'Put the page on a neutral ground (white, off-white, near-black) and keep one accent. A whole page on colour works only with that colour alone and the ink.');
    else if (x.colour.colouredShare > 0.35) add('WARN', 'colour-ground', `${Math.round(x.colour.colouredShare * 100)}% of the page stands on coloured grounds.`, 'Most of the page belongs on the neutral ground (white, off-white, near-black). One coloured field for one section at most.');
  }
  const bars = (x.rails || []).filter((r) => r.what !== 'a sideways scroller'), scrollers = (x.rails || []).filter((r) => r.what === 'a sideways scroller');
  if (bars.length) add('FAIL', 'drag-bar', `A progress, drag or slider bar outside a working tool: ${list(bars, (r) => `${r.what} ${r.size}${r.text ? ' (' + r.text + ')' : ''}`)}.`, 'Remove it. Scroll progress bars, drag handles and sliders that only move content are decoration; show the content as a plain list or grid.');
  if (desktop && scrollers.length) add('WARN', 'sideways-rail', `${scrollers.length} sideways scroller(s) on desktop: ${list(scrollers, (r) => `${r.size} "${r.text}"`)}.`, 'On desktop show the items in a grid or list that fits the width. A sideways rail hides most of its content and needs a scrollbar or drag to reach it.');
  if (x.boxed && x.boxed.words > 150 && x.boxed.share > 0.6) add('WARN', 'boxed-page', `${Math.round(x.boxed.share * 100)}% of the running text sits inside filled or outlined boxes.`, 'Boxes everywhere read as a template. Set text straight on the page, separated by space and size; keep boxes for things a visitor handles as objects (a plan, a product, a form).');
  if (x.labels) {
    const per = new Map(); for (const l of x.labels) { const k = Math.floor(l.y / 900); per.set(k, (per.get(k) || 0) + 1); }
    const worst = Math.max(0, ...per.values());
    if (worst > 6 || x.labels.length > Math.max(10, screens * 3)) add('WARN', 'label-clutter', `${x.labels.length} little labels on the page (up to ${worst} on one screen): ${list(x.labels, (l) => `"${l.text}"`, 6)}.`, 'Cut every label, tag, timestamp and caption that does not carry information a visitor needs. A card does not need "Today, 8:14 am" or "Connected source".');
  }
  if (x.walls?.length) add('WARN', 'text-wall', `${x.walls.length} paragraph(s) over 70 words: ${list(x.walls, (w) => `"${w.text}…" (${w.words} words)`)}.`, 'Say it in a third of the words. Paragraphs on a page are two or three sentences; the rest is a link to a page that has room for it.');
  // on desktop a product fragment cropped by the screen edge is a deliberate crop; on tablet and phone it is breakage
  const cut = (x.cutText || []).filter((c) => !c.ui || !desktop);
  if (cut.length) add('FAIL', 'cut-text', `Text is cut by ${cut[0].by} at ${width}px: ${list(cut, (c) => `"${c.text}"${c.ui ? ' (in a mock-up)' : ''}`, 5)}.`, 'Nothing may be wider than the screen. Give mock-ups and fixed-width panels max-width: 100% and let their content wrap, or design a narrower version for phone and tablet; never let a box clip its own words.');
  const dots = (x.truncated || []).filter((t) => !t.ui);
  if (dots.length) add('WARN', 'ellipsis', `Text is shortened with an ellipsis: ${list(dots, (t) => `"${t.text}"`, 4)}.`, 'Never cut the figure or name that matters. Let it wrap, shorten the label, or drop a column at this width.');
  if (width < 1100 && x.stickyBands?.length) add('FAIL', 'sticky-band', `A sticky or fixed band covers ${x.stickyBands[0].h}% of the ${width}px screen: ${list(x.stickyBands, (b) => `"${b.what}" (${b.h}%)`)}.`, 'Below 1100px, release pinned stages and sticky pictures: let them scroll as ordinary blocks. Only the navigation may stay fixed on a phone, and it stays thin.');
  if (x.formInSentence?.length) add('FAIL', 'form-in-sentence', `A form field sits inside a headline or sentence: ${list(x.formInSentence, (f) => `"${f.text}"`)}.`, 'Put the field and its button on their own row under the heading, with a visible label: the sentence-form field broke on 8 of 9 reviewed pages.');
  if (desktop && x.tinyUi > 6) add('WARN', 'tiny-mockup-text', `${x.tinyUi} pieces of text inside interface fragments are under 11.5px.`, 'A fragment of the product on a page is shown at a size a visitor can read: labels 12px or more, its main text 14px or more. Crop it to fewer rows rather than shrinking it.');
  if (x.placeholders?.length) add('WARN', 'placeholder-contact', `Placeholder contact details: ${list(x.placeholders, (p) => `"${p}"`)}.`, 'Use the client\'s real address, email and phone, or a plain "Contact" link to the real form; list what must be filled in your report, never on the page.');
  if (x.builderNotes?.length) add('FAIL', 'builder-note', `A note meant for the client is on the page: ${list(x.builderNotes, (p) => `"${p}"`)}.`, 'Never tell visitors about missing pictures, sample content or what will be replaced. Design the section without the missing asset and say it in the report.');
  if (x.nav && (x.nav.links < 2 || (!desktop && x.nav.links < 3)) && !x.nav.menu) add('FAIL', 'no-nav', `No navigation at the top of the page (${x.nav.links} link(s) in the first 160px).`, 'Every page has a header: the name, links to its main sections and the one action (or a Menu button on a phone).');
  if (desktop && x.rightHuddled?.length) add('WARN', 'empty-left', `${x.rightHuddled.length} band(s) with nothing in the left ${x.rightHuddled[0].from}% of the width: ${list(x.rightHuddled, (b) => `"${b.text}" at ${b.y}px`)}.`, 'A row with an empty left side and text on the right looks broken. Put the heading on the left and the text on the right, or set the block from the left margin.');
  return out;
}
