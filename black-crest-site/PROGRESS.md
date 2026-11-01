# Black Crest v3: progress

Brief: "Black Crest Web Designs: Version 3 master brief" (pasted by the owner on 1 November 2026).
Work happens in `black-crest-site/` only. Each phase is committed and pushed to `main` when done.

## Status

| Phase | State |
| --- | --- |
| 1. Fixes | Done |
| 2. Design system and motion foundation | Next |
| 3. Cinematic home page | To do |
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

## Decisions and notes
- Tools available in this environment: Node and npm (registry reachable), Playwright with Chromium, system ffmpeg, Pillow with AVIF and WebP. fontTools is not installed: it gets installed into a scratch folder only when needed, to extract glyph outlines.
- Versions to vendor in Phase 2: GSAP 3.14.2 (12 Dec 2025), Lenis 1.3.27 (15 Oct 2026, just over two weeks old), Three.js 0.170.0.

## Resume here
Start Phase 2: design tokens, vendored libraries in `vendor/` with `VERSIONS.md`, `js/` modules and the banned-word sweep.
