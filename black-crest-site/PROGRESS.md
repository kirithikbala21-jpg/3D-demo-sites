# Black Crest v3: progress

Brief: "Black Crest Web Designs: Version 3 master brief" (pasted by the owner on 1 November 2026).
Work happens in `black-crest-site/` only. Each phase is committed and pushed to `main` when done.

## Status

| Phase | State |
| --- | --- |
| 1. Fixes | Done |
| 2. Design system and motion foundation | Done |
| 3. Cinematic home page | Next |
| 4. Other pages and new pages | To do |
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
  - Concept Lab and Standard join the menu in Phases 3 and 4, once those pages exist.
- **Footer:** the Melbourne clock, the availability line (from `config.js`), back to top, and a giant BLACK CREST wordmark cropped at the bottom edge.
- **Banned words (2.3):** searched the whole folder, excluding `vendor/`. None found, and no emoji or sparkle icons.
- **Tested:**
  - At 390 and 1440, 13 pages: libraries load, with no console errors or failed requests and no sideways scrolling.
  - Reveals are complete 0.9 s after jumps to 30, 60 and 95% of each page.
  - Lenis runs on full-tier desktops and stays off on phones.
  - The menu traps focus and closes on Escape. The clock reads "Melbourne · h:mm pm".
  - With reduced motion: no smooth scrolling and nothing hidden. Without JavaScript: everything visible.

## Decisions and notes
- Tools available in this environment: Node and npm (registry reachable), Playwright with Chromium, system ffmpeg, Pillow with AVIF and WebP. fontTools is not installed: it gets installed into a scratch folder only when needed, to extract glyph outlines.
- This container reports 4 CPU cores, so local tests simulate an 8-core desktop when testing the full tier.

## Resume here
Start Phase 3 (the cinematic home page):
1. Preloader.
2. 3D crest hero, built with SVGLoader from the crest path plus "BC" glyph outlines, with a still render saved to `assets/`.
3. Showreel, recorded with Playwright and joined with ffmpeg.
4. Trade chapters, using images copied from the demos.
5. Concept Lab (`js/lab.js`).
6. Anatomy hotspots, the before/after polish, the stacked process, the Standard odometers, pricing cards, the 3D globe (`js/globe3d.js`), the offer, the FAQ split, and the final CTA.
