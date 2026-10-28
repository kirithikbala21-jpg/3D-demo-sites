# Changes: KB Ventures logo (28 October 2026)

Everything else is unchanged.

## Logo files (in `img/`)
- `kb-wordmark.svg` and `kb-favicon.svg` were created exactly as supplied.
- `kb-wordmark-white.svg` and `kb-wordmark-black.svg` were made from `kb-wordmark.svg` by a script that only removes the gradients and sets every fill to `#FFFFFF` or `#0D0E12`. The script confirmed that the shape data is byte-for-byte identical to the original.

## Where the logo is used
- **Nav:** the 32px KB mark (already rounded in the file) followed by "KB Ventures" in the nav type, on every page including the 404. At the narrowest width tested (360px) the full name still fits with 147px to spare, so it is never shortened.
  - The mark's alt text is empty because the name sits right beside it. Otherwise screen readers would say "KB Ventures KB Ventures".
- **Footer:** `kb-wordmark.svg`, centred above the footer links and the existing hairline. The big "KB Ventures" text wordmark was removed, because next to the logo it read as a duplicate.
  - The logo's artwork fills only the middle third of its file. So the image is up to 440px wide, which makes the letters themselves about 160px wide. At an image width of 160px, VENTURES was unreadable.
  - Alt text is "KB Ventures", and width and height are set.
- **Browser tab:** `kb-favicon.svg` is the main icon (`type="image/svg+xml"`). Playwright rendered it straight from the SVG, with transparent corners, to make:
  - `favicon.ico` (16, 32 and 48px);
  - `favicon-32.png`;
  - `apple-touch-icon.png` (180px);
  - `img/icon-192.png` and `img/icon-512.png`.

  These are all linked in the head of the home page and the 404 page. The Organization data's logo now points to `icon-512.png`.
- **Share image:** `og.jpg` was regenerated at 1200 x 630 (26 KB): the dark lit background, the full wordmark centred and large, and "Study guides and websites, made in Melbourne" in small spaced capitals below. The Open Graph and Twitter tags now include the image type, width, height, alt text, title, description and image.

## Checked
- **Nav and footer** at 360, 390, 768, 1024 and 1440px:
  - the mark is always 32x32;
  - the name stays on one line and is never cut off;
  - the menu button and links never collide with it;
  - the footer logo is fully visible.
- **Full page** at 360, 390, 768, 1024, 1280, 1440 and 1920px, at 125% zoom, with reduced motion and with WebGL off: no sideways scroll, no overlaps, contrast at least 4.5:1, tap targets at least 44px, layout shift 0, and no errors.
- **Lighthouse:** desktop 100 / 100 / 100 / 100, mobile 97 / 100 / 100 / 100.

---

# Earlier: final polish (28 October 2026)

Structure, copy, colours, the 3D hero card, the glossy cards and the demo row are unchanged. Everything is calmer, lighter and tighter.

## Type: smaller and lighter
- **Headings:** weight 300 (Geist), letter-spacing -0.025em, line-height 1.08–1.12. I checked that 300 is a real weight in the font file (300, 400 and 500 measure differently with faux styles turned off), and that it stays crisp on a standard (1x) screen.
- **Hero headline:** `clamp(32px, 4.2vw, 60px)`, 3 lines at 1024–1920px (4 on phones).
- **Section headlines:** `clamp(26px, 3.2vw, 46px)`.
- **Card titles:** `clamp(22px, 2.2vw, 32px)` at weight 400.
- **Labels:** 11px, uppercase, 0.22em tracking, weight 500.
- **Lead paragraphs:** 16–17px, line-height 1.65, at most 56 characters wide. They stay full silver: 85% silver measured under 4.5:1 where the light pools brighten the page.
- **Headline gradient:** about 6% light-to-silver now, instead of 10%.
- **Footer wordmark:** weight 300, `clamp(48px, 11vw, 168px)`, a very soft silver gradient, and still shown in full at every width.
- **Font loading:** one variable font file, preloaded, with `font-display: swap`. Numbers use tabular figures.

## Spacing and rhythm
- **One container everywhere:** 1120px of content, 24px gutters on phones and 32px from 720px. The nav, hero, cards and footer share the same edges.
- **Section spacing:** 112px between sections on desktop, 64px on phones.
- **Hero:** about 88% of the screen height. The text block and the 3D card sit on one centreline, and the dead space under the button is gone.
  - Fitting the headline into 3 lines at 1440 needs about 740px. So the text column is about two-thirds wide, and the card's stage overlaps back toward it without touching the words.
- **"What we run" cards:** equal height, with the status at the top, name and text in the middle, and one quiet line at the bottom. The AceGuides card shows "Guides launching soon" while `aceguidesShopUrl` is empty, and a "See the guides" button once it is filled in.

## Hero card
- **Light streak:** a narrow, bright, soft-edged streak (bright core, soft shoulders, faint halo) now crosses the face diagonally every 7 seconds, replacing the grey patch.
- **Size:** the card is drawn about 10% smaller. Its floor reflection is fainter. The slow drift and the mouse response are unchanged.
- **Still image:** re-rendered to match.
- **Software WebGL:** devices running WebGL in software (no graphics card, e.g. SwiftShader or llvmpipe) now get the still image. There the 3D would be slow, and it was costing Lighthouse 27 seconds of blocking time.

## Nav and buttons
- **Nav:** 64px, smoked glass (with a solid fallback where `backdrop-filter` isn't supported), a hairline once you scroll, and the current section's link underlined.
- **Phone menu:** a menu button opens a full-screen menu with large links. It closes on link tap and Escape, and keeps keyboard focus inside while open.
- **Fewer repeated buttons:** "See the websites" in the hero, and "Get in touch" in the nav and the contact section. The extra pills in the middle sections are gone.
- **Pills:** 40px to the eye with a 44px tap area, 14px text, a 200ms hover, and a platinum focus ring.

## Cards and demo row
- All cards share the same radius, border, top highlight, sheen and shadow.
- **Demo cards:** smaller titles, identical browser and phone frames, and text that wraps instead of overflowing.
- **Scrolling:** the row now aligns cards to the left, with the next card peeking about 40px.
- **Controls:** arrows and dots are aligned at the same 44px height. The arrows' stray default grey background is fixed. Keyboard, swipe and the dots all work and stay in sync.

## Background and motion
- The same lit blue-black background, vignette and light pools, with the grain at 4% to keep gradients from banding.
- One easing curve everywhere. Scroll reveals are 700ms with a 16px rise. The headline rises without fading, so it paints at once.

## Details
- Anchor links stop just below the sticky nav (`scroll-margin-top` plus the smooth-scroll offset).
- **New favicon set and share image** (`og.jpg`): dark, with the metal KB mark and the KB Ventures wordmark.
- **Head tags:** title, description, theme-color, a commented canonical, and Organization structured data using only facts on the page (name, email, Melbourne/AU, description, logo). `main.js` keeps the structured data in step with the config.
- **Footer:** links, a quiet "Back to top", "© 2026 KB Ventures · Melbourne, Australia" (the year updates itself), and the concept-demo line.
- **Missing images** leave a quiet empty frame instead of a broken-image icon. Every image has a width and height, and layout shift measured 0.
- **All page text now lives in `site.config.json`,** including optional `aceguidesShopUrl`, `instagram`, `linkedin`, `abn` and `testimonials` fields. Every optional field is empty and hidden. Nothing was invented. I tested this by feeding the page a filled-in config: every optional field appeared, and an entry without a quote was skipped.
- Lenis' tiny stylesheet is folded into `styles.css` (one fewer request). The carousel's ARIA was corrected: the region role is now on its wrapper, so the list stays a list.

## Tested
- 360, 390, 768, 1024, 1280, 1440 and 1920px, 125% zoom, reduced motion, and WebGL fully disabled: no sideways scroll, no overlaps, all text at least 4.5:1, all tap targets at least 44px, layout shift 0, no console errors, no outside requests, and the footer wordmark always in full.
- **Keyboard only:** a visible platinum ring on every stop in a logical order. Anchors land below the nav, and the phone menu traps focus and closes on Escape.
- **Lighthouse** (local server, uncompressed):

  | | Performance | Accessibility | Best practices | SEO |
  |---|---|---|---|---|
  | Mobile | 97–98 (varies run to run) | 100 | 100 | 100 |
  | Desktop | 100 | 100 | 100 | 100 |

  The first desktop run scored 60 for performance (software 3D) and the robots.txt check failed. The robots.txt check came from the repo's top-level file on the local server, which GitHub Pages doesn't use for this site.

## Still open
- The 3D card was only seen in headless Chromium, not on a physical phone or GPU.
- Unused files remain because this session may not run `rm`:
  - the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts;
  - `vendor/addons/`;
  - `vendor/lenis-1.1.18.css`.
- The repo's top-level `404.html` is still empty.

---

# Earlier: a real metal-and-glass card (28 October 2026)

The layout, copy, footer, buttons and demo row are unchanged. This round fixes the three things that still looked flat.

## 1. Hero object: a card, not a framed screen
- **Shape:** rebuilt as a thin card with corners rounded to 6% of its width. The front is deep black glass all the way to a slim bevelled metal edge, so the thick silver border and the gold inner outline are gone.
- **Edge lighting:** the bevel catches a bright highlight along the top and falls darker at the bottom. One fine brushed-gold line runs around the outer bevel only.
- **Face:** deep black glass with a subtle vertical gradient over fine horizontal brushing, under a clear coat. A wide, soft reflection band sweeps across it every 7 seconds.
- **Mark:** "KB" is raised polished metal, built as real 3D letters with a bevelled top edge that catches the light and a soft shadow in the glass beneath. "VENTURES" sits below in metallic foil.
- **Lighting:** a small studio built into the environment map, with three bright light strips (overhead, left, back-right) and a soft panel above the viewer. The glass and bevels show real specular highlights instead of plain grey.
- **Pose and motion:** tilted about 15 degrees back and 16 degrees sideways, in real perspective. It drifts slowly, leans gently toward the mouse (or the phone's tilt on Android), and has a soft contact shadow and a faint mirror image beneath it that fades into the page.
- **Still fallback:** `img/hero-object.webp` was re-rendered from the same scene, so it matches the live 3D. It shows while the 3D loads, without WebGL, on Data Saver, on low-powered phones and with reduced motion.
- **Compared with the old object:** side by side, the old one read as a TV in a silver frame and the new one as a real metal card, so the new one ships. It took three lighting passes before the raised mark read as polished metal rather than dark grey.

## 2. Background with depth
- A deep blue-black base with a faint light from the top of the screen.
- Three soft cool light pools, behind the hero object, behind the demo row and behind the contact section.
- A slightly lighter band at the horizon of each section. It straddles the section edge and fades out on both sides, so there is no seam.
- A vignette at the screen edges and a 3.5% film grain over everything.

## 3. Glossier cards
The "What we run" and demo cards now have a brighter 1px top edge fading to the sides, a stronger diagonal sheen, a lighter inner border and a soft shadow underneath. On hover, one slow light sweep passes across once, with no pulsing or blinking.

## Checked
- At 360, 390, 768, 1024 and 1440px, at 125% zoom and with reduced motion: no sideways scrolling, no overlapping text, no text under 12px, all tap targets at least 44px, all text at least 4.5:1, no broken images, no console errors, and no requests outside the site.
- The footer wordmark fits in full at every one of those widths.
- Carousel keys, dots and buttons, card brightening on hover and gold pill borders all still work.
- Fixed along the way:
  - a dark "floor" rectangle that showed under the object (replaced by a soft CSS fade);
  - a hard seam where each section's horizon band ended;
  - a syntax slip that briefly broke the 3D before release.
- **Banding:** with the contrast stretched 14x, the darkest gradients show faint contour steps under the grain. At normal brightness, or on a bright phone, they are far below visible.
- **Weight:** about 40–110 KB without the 3D, and about 0.7–0.8 MB with it from the local server (mostly Three.js, which GitHub Pages compresses). The 3D loads only after the page is ready.

## Left as they were
- The 3D was checked in headless Chromium with software rendering, not on a physical phone or GPU.
- iPhones need a permission prompt for tilt, so there the card only drifts.
- Unused files still in the folder, because this session may not run `rm`: the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts, and `vendor/addons/` (RoomEnvironment, replaced by the custom studio).
- The repo's top-level `404.html` is still empty, and the AceGuides shop link is still blank.

---

# Earlier: brushed metal and piano-black glass (27 October 2026)

This builds on the dark redesign from earlier the same day. The palette, copy, demo list and section order are unchanged. The owner replaced the earlier "no glow, no shiny metallic fills" rule with a shine brief; the new rules are in `brand.md` under "Light and shine".

## What changed
- **Background:** the flat black is now a layered surface:
  - a deep blue-black base (`#090B11`);
  - a soft cool silver-blue light pool behind the hero object, and a fainter one behind the demo row;
  - a vignette toward the screen edges;
  - a very fine film grain (a 96px tile, 3.5% opacity) laid over the page.

  With the contrast stretched 10x there is no visible banding; the grain breaks the gradient steps up.
- **Hero, two columns on desktop:** the headline, line and buttons sit on the left (about 57%). On the right is a large 3D object that overlaps the column edge slightly, under the spotlight. On phones the text comes first and the object below it.
- **Headline size:** your `clamp(40px, 6vw, 84px)` still wrapped to five or six lines beside the object at 1024–1440px, because four lines at 84px need an 840px column. So it is `clamp(40px, 5.2vw, 76px)`, which gives four lines at 1024, 1280, 1440 and 1920px and the same 40px on phones.
- **The 3D object** (Three.js r160, self-hosted and pinned):
  - a thin slab of brushed metal (anisotropic, clear-coated, high metalness, low roughness) with a piano-black glass face, a thin brushed-gold edge and the KB Ventures mark set into the glass;
  - lit by a studio environment (soft light strips) plus a key and a cool rim light, with a soft shadow beneath;
  - it turns and tilts slowly, leans gently toward the mouse or the phone's tilt, and a soft reflection sweeps across the glass every 9 seconds;
  - the pixel ratio is capped at 2, and it pauses when off screen.
- **Hero fallback:** a still render of the same object (`img/hero-object.webp`, 38 KB, transparent background, made with Playwright by `tools/render-hero-still.mjs`). It shows while the 3D loads, and instead of it without WebGL, on Data Saver, on low-powered phones and with reduced motion.
- **No demo screenshot on the object:** the Iron & Ember screenshot left the hero as asked, and now appears only in the first card of the demo row. The object's face is plain piano-black glass with the mark, instead of carrying a screenshot.
- **Shine level, compared:** I rendered two shine levels side by side. "More" pushed the metal edge to near-white chrome and started to look like a toy, so the quieter "less" version ships. `?shine=more` still shows the other one.
- **Cards (What we run and the demo cards):** dark glossy panels with:
  - a 1px bright top edge fading to the sides;
  - a faint diagonal sheen;
  - a slightly lighter inner border and a soft drop shadow;
  - one slow light sweep across the card on hover. It does not repeat or pulse.

  Card text still brightens from silver to platinum on hover or focus.
- **Screenshot frames:** polished dark-metal bezels with a bright top edge, metal window dots and a soft reflection across the glass, the same for the browser and the phone frames.
- **Headlines:** platinum with a light-to-silver vertical fall-off of about 10%, repeated on every line. No coloured gradients.
- **Primary pills:** polished platinum with a fine top highlight and a highlight that slides across once on hover. Secondary pills and the carousel arrows are dark glass with a faint highlight; their borders still turn gold on hover.
- **Gold** stays rare: the hairline under the hero label, the Live/Starting dots (now with a slight polished-metal look), hover borders and links, and the thin edge and hairline on the 3D object.
- **Nav:** smoked glass (dark and slightly blurred) instead of flat black. On desktop the nav, hero and footer now share one grid, so their left edges line up.

## Checked
- At 360, 390, 768, 1024 and 1440px, at 125% zoom and with reduced motion: no sideways scrolling, no overlapping text, no text under 12px, all tap targets at least 44px, and every text colour at least 4.5:1.
  - Gradient headlines were checked at their darkest stop, `#C3C7D0`.
  - Primary pill text was checked against the pill's darkest platinum, `#CBCED6`.
- No broken images, every in-page link has a target, no console errors, and no requests outside the site.
- The footer wordmark fits in full at every one of those widths.
- One bug found and fixed: the second light pool made the page scroll sideways by up to 388px.
- Weight: about 50–190 KB without the 3D. With it, about 760–790 KB from the local server, mostly Three.js, which GitHub Pages compresses. The 3D only loads after the page has finished loading and the browser is idle, so the text and still image appear first.

## Left as they were, and uncertain points
- The 3D was checked in headless Chromium with software rendering. Real GPUs render it more smoothly, but it has not been looked at on a physical phone.
- Phone tilt works on Android. iPhones ask for permission before a site can read motion, so on an iPhone the object only does its idle movement.
- Files no page uses any more were not deleted, because this session was asked not to run `rm`: the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts. (`hero.js`, `scene.js`, Three.js and `RoomEnvironment` are in use again.)
- The repo's top-level `404.html` is still empty, and the AceGuides shop link is still blank.
