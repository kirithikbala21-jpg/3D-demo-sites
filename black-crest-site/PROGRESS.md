# Black Crest v3: progress

Brief: "Black Crest Web Designs: Version 3 master brief" (pasted by the owner on 1 November 2026).
Work happens in `black-crest-site/` only. Each phase is committed and pushed to `main` when done.

## Status

| Phase | State |
| --- | --- |
| 1. Fixes | Done |
| 2. Design system and motion foundation | Done |
| 3. Cinematic home page | Done |
| 4. Other pages and new pages | Next |
| 5. Technical quality bar | To do |
| 6. Testing, Lighthouse, live check | To do |

## Phase 1: fixes (done)
- Custom cursor: already removed on the live site (commit 0ad0d86). Re-checked: no `.cursor` or `.cursor-dot` elements, CSS or JS, and the system cursor is used everywhere.
- Hero crest overlap: already fixed in 0ad0d86 (the crest area ends above the price card and text, and the side-by-side hero starts at 1200px). Re-checked at 390, 768, 1024, 1199, 1200, 1280, 1440 and 1920: no overlap, 3D or still.
- Reveals: they now start the moment any part of an element enters the viewport (no inset margin, threshold 0), and finish within 0.6 to 0.82 s.
  - Fades are 0.6 to 0.7 s, with delay classes capped at 0.12 s.
  - The headline word stagger is 18 ms a word, capped at 120 ms.
  - Count-ups take 0.9 s.
  - Jumping down the page shows everything at or above the viewport at once.
  - Content is visible by default: hiding only applies under `html.js`, which the script adds.
- Tested: instant jumps to 20, 45, 70 and 95% of six pages at 390 and 1440 px. Everything in view is fully shown 0.9 s later. With JavaScript turned off, nothing is hidden.
- Home page length: left for Phase 3, which rebuilds the home page.

## Phase 2: design system and motion foundation (done)
- **Libraries:** vendored in `vendor/` from npm with exact versions, recorded in `vendor/VERSIONS.md` with dates, licences and checksums.
  - GSAP 3.14.2: core, ScrollTrigger, SplitText, and Flip for the Concept Lab.
  - Lenis 1.3.27.
  - Three.js 0.170.0 with the SVGLoader and RoomEnvironment add-ons. Their `'three'` import points at the vendored file. No bloom.
  - Nothing loads from a CDN at runtime. The old cdnjs Three.js is gone.
- **JS modules in `js/`:**
  - `config.js`: every editable value, commented: prices, add-ons, email, availability line, timezone.
  - `core.js`: the entry point, with device tiers and the shared page behaviour.
  - `motion.js`, `menu.js` and `forms.js`.
  - `hero3d.js`: moved in from the root, rebuilt in Phase 3.
  - `main.js` is removed. `tools/build.py` reads prices from `js/config.js`.
- **Device tiers:** `tier-low` if reduced motion, 4 or fewer CPU cores, 4 GB or less of memory, or Data Saver. Otherwise `tier-full`. Low tier gets no Lenis, no parallax and no WebGL.
- **Motion:**
  - SplitText line-mask headlines and fading `[data-reveal]` blocks, both at 0.7 to 0.8 s.
  - Clip-path image wipes for `[data-wipe]`, with a settle from 1.15 to 1.
  - Parallax via `[data-parallax]`: desktop, full tier only.
  - Odometer numbers via `[data-odometer]`, and a marquee whose speed reacts to scroll velocity.
  - Magnetic gold buttons, and button labels that roll up on hover.
  - Lenis on desktop pointers only, driving ScrollTrigger.
  - Everything shows at once with reduced motion, without GSAP, or without JavaScript. Content is only hidden under `html.js`, with a CSS failsafe after 2.5 s.
- **Design tokens:**
  - The `--deep` band colour and the `--gold-metal` gradient.
  - The display, body and label type scale, with labels reading "01 / Work".
  - An 8px spacing scale and varied section spacing.
  - Grain at 3.5%. The hairline grid only appears through the `has-grid` class, which Phase 4 applies to pricing and process.
  - A vignette helper.
- **Navigation:**
  - The header is transparent at the top, dark glass after scrolling, and hides on the way down.
  - A full-screen menu with huge serif links slides down. On desktop, hovering a link shows an image preview. The menu also holds the email, the Melbourne clock and the availability line.
  - The menu traps focus while open and closes on Escape.
  - Desktop shows 3 inline links, the gold button and Menu.
  - Concept Lab and Standard joined the menu in Phase 3.
- **Footer:** the Melbourne clock, the availability line (from `config.js`), back to top, and a giant BLACK CREST wordmark cropped at the bottom edge.
- **Banned words (2.3):** searched the whole folder, excluding `vendor/`. None found, and no emoji or sparkle icons.
- **Tested:**
  - At 390 and 1440, 13 pages: libraries load, with no console errors or failed requests and no sideways scrolling.
  - Reveals are complete 0.9 s after jumps to 30, 60 and 95% of each page.
  - Lenis runs on full-tier desktops and stays off on phones.
  - The menu traps focus and closes on Escape. The clock reads "Melbourne · h:mm pm".
  - With reduced motion: no smooth scrolling and nothing hidden. Without JavaScript: everything visible.

## Phase 3: cinematic home page (done)
The home page runs in this order:
- **Preloader:** home page only, once per visit (`bc-pre` in sessionStorage), never with reduced motion. A crest hairline draws while a counter follows real loading (fonts, the hero image, the page load), capped at 1.4 s. Then the screen splits open. The class is set in the head before first paint, so return visits never flash it, and a CSS failsafe hides it after 4 s if JavaScript breaks.
- **Hero:**
  - A real-time Three.js crest. It is extruded from SVG paths with SVGLoader and ExtrudeGeometry, with bevels.
  - The parts are a gold rim, a dark enamel plate, an inlay line, and the "BC" monogram as real Cormorant Garamond letter outlines, made by `tools/make-crest-svg.py`.
  - Material: MeshPhysicalMaterial gold (metalness 1, roughness 0.25, clearcoat). Lighting: a RoomEnvironment PMREM, a warm key light, a cool rim light and a light sweep every 7 s.
  - Motion: ±8° idle turn and pointer tilt. On phones, device tilt only after a tap (iOS asks permission). On scroll the crest recedes and dims.
  - Rendering pauses off screen and in hidden tabs. Pixel ratio is capped at 1.75.
  - Loading: `requestIdleCallback`, home page only. It needs the full tier and a hardware GPU (software renderers are refused); `?3d=on` forces it for testing.
  - Everyone else sees `assets/crest-still.{avif,webp,jpg}`, rendered from the same scene at 2x by `tools/render-still.mjs`. That tool also renders the new `img/og.jpg`.
  - Layout: on desktop the words are left, the crest right, and the card overlaps the hero's bottom edge. On phones: crest, then words, then card.
- **Showreel:**
  - `tools/record-reel.mjs` captures the six concepts frame by frame at 1440 x 900 (never any other folder), then ffmpeg crossfades them.
  - Output: `reel.mp4` (H.264, CRF 28, veryfast, no audio, 2.6 MB, 23 s), plus `reel.webm` and a poster.
  - It plays muted in a CSS laptop only while on screen (not with reduced motion). "Play reel" goes full screen with controls.
  - Caption: "Concept sites. Real code. Not real clients, yet."
- **Trade chapters:** five photos copied from the demos' own `img/source/` into `assets/chapters/`.
  - On desktop: one pinned full-screen stage. Each scene wipes up over the last, the photo zooms from 1 to 1.12, the title rises and a gold hairline draws, with a "01 / 05" counter and a progress line.
  - Phones, tablets and reduced motion get stacked cards.
  - "See the concept" opens the live concept for now. It moves to the case study pages in Phase 4.
- **Concept Lab** (`js/lab.js`, also on the new `lab.html`):
  - Controls: trade, name, mood and features.
  - Preview: a live phone, plus a laptop on desktop, laid out with container queries. GSAP Flip animates layout changes.
  - Accessibility: a polite live region, and native radios and checkboxes that work with the keyboard.
  - "Send me this concept" passes the choices to `contact.html#lab` through sessionStorage, never the URL. Tested: the message arrives pre-filled.
- **Anatomy:** six numbered spots on the Waverley Plumbing concept (phone screenshot), joined to cards by hairlines on desktop. A numbered list on phones.
  - "Directions" from the brief's list is swapped for "The job, in one tap", because that concept shows no directions link.
- **Before/after:** a gold disc handle with a "Drag" hint, arrow keys, `aria-valuenow`, and "Example, not a real customer".
- **Process:** stacked sticky cards (Chat, Free concept, Build, Launch), each with a gold numeral, a timeframe chip and an illustration, on the hairline grid.
- **The Black Crest Standard band:** odometers for $300 (from config), 5, 2, 0 and 100%, linking to the new `standard.html` (10 commitments).
- **Pricing:** three account cards with masked numbers and odometer prices. The featured card has a gold edge and a light sweep. The hairline grid is on.
- **Globe** (`js/globe3d.js`):
  - Land dots come from `js/globe-points.js`, made once by `tools/make-globe-points.mjs` from Natural Earth via world-atlas and d3-geo at build time. No tiles or APIs.
  - It turns to Melbourne, where a gold pin pulses, plus a marquee of places across Victoria.
  - Loading is lazy (near the screen, idle, full tier plus GPU only). Otherwise a still is shown, `assets/globe-still.*`.
- **Offer, FAQ, final CTA:** the case study offer; a two-column FAQ (sticky title, top 5); "See it before you pay." over a crest silhouette.
- **Tested** (local, 1440 x 900 and 390 x 844, plus the full tier simulated):
  - Every home section was screenshotted and reviewed.
  - No sideways scrolling, after fixing a hero stage width and long process chips.
  - No console errors.
  - The Lab updates both previews, works by keyboard, and hands off to contact.
  - With reduced motion: no preloader, no pinning, the reel does not autoplay, the stills stay and nothing is hidden.
  - With `?3d=on`: the hero crest and the globe both go live.
- **Size note for Phase 5:** `index.html` (46 KB) plus `style.css` (78 KB) is about 124 KB, a little over the ~120 KB budget, so Phase 5 trims the CSS. The old `.intro`, rail and bento styles may still be in use on other pages: check before removing.

## Decisions and notes
- Tools available in this environment: Node and npm (registry reachable), Playwright with Chromium, system ffmpeg, Pillow with AVIF and WebP. fontTools is not installed: it gets installed into a scratch folder only when needed, to extract glyph outlines.
- This container reports 4 CPU cores, so local tests simulate an 8-core desktop when testing the full tier.
- WebGL here is software only (SwiftShader). The site refuses software renderers on purpose, so the 3D is tested with `?3d=on`, and the stills are rendered the same way.
- Build-time npm packages (world-atlas, topojson-client, d3-geo) are installed outside the repo. Nothing in `node_modules` is committed.
- The concept sites in the reel show their own made-up ratings and badges. They are labelled concept sites, and the reel caption says so.

## Resume here
Start Phase 4 (other pages and new pages):
1. `work/<slug>.html` case studies for all six concepts, with swatches and typefaces read from each demo's CSS and each demo's location taken from the demo.
2. Then point the chapters' "See the concept" links at the case studies.
3. `work.html` editorial rows with hover image reveals, plus "Try the Concept Lab".
4. `credits.html` (chapter photos are Unsplash, photographers unknown: see each demo's `CREDITS-TODO.md`).
5. `404.html` "This page isn't on the map."
6. Restyle and rewrite every other page with the same chrome.
