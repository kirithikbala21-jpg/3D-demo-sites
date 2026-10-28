# Changes: KB Ventures, a real metal-and-glass card (28 October 2026)

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
