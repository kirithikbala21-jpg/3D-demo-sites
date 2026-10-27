# Changes: KB Ventures redesign (27 October 2026)

## What changed
- **New look:** dark theme (ink-black page, cool off-white text) with one cyan accent, Barlow Condensed headlines and Inter body text, both self-hosted. Replaces the plain light/dark system-font page.
- **Full-screen hero in three layers:** a cyan glow and grid background, a 3D stage and the text drift at different speeds on scroll (about 30px at most). Headline words rise in one by one.
- **3D glass tiles, one per business** (AceGuides and KB Websites), built with Three.js. They float and lean toward the pointer, pause when off screen, and load only after the page is idle.
- **Static fallback:** the same two tiles in CSS glass are in the HTML and show with JavaScript off, without WebGL, on Data Saver, on low-powered phones, if the 3D fails or the context is lost, and with `prefers-reduced-motion` (no floating then either).
- **Header** starts transparent and becomes a blurred bar with a hairline border once you scroll. A thin cyan scroll-progress line runs along the top.
- **Lenis smooth scroll** for wheel scrolling and in-page links; off for reduced motion.
- **Subtle scroll reveals** (opacity plus a 24px lift, staggered) that run once; everything is visible without JavaScript or with reduced motion.
- **Our businesses:** two large cards with icons and status (AceGuides: Live, KB Websites: Starting). The AceGuides shop button still appears only when `aceguidesShopUrl` is filled in.
- **New "How it works" strip** for KB Websites: we build a free preview, you pick what you like, we launch it. No prices, timings or promises.
- **Big demo gallery** with real screenshots in a browser frame and a phone frame, in this order: gym, barber, cafe, plumber, salon. The rows are still built from `site.config.json` (which now also holds each demo's image paths), with the same rows in the HTML as a fallback.
- **Real previews:** each demo's front page captured with Playwright at 1440px and 390px, clock frozen at Tuesday 27 October 2026, 12:00 Melbourne time, with the announcement, notice, opening-hours and cookie banners hidden. Saved as WebP in `img/` (28 to 53 KB each). `tools/screenshot-demos.mjs` rebuilds them.
- **Contact:** a large "Get in touch" section with the email as one big button.
- The note "These are concept demos for made-up businesses. Names, prices and reviews are examples only." stays, beside the gallery heading.
- `brand.md` added (8 lines on what makes the demos feel premium and what this site reuses). README updated.

## Checked
At 1440px and 390px, with 3D and with the still fallback, and with reduced motion: no horizontal scroll, no overlapping text, no text under 12px, no broken images, no console errors, no requests outside the site. Compared side by side with the gym demo's front page.

## Placeholders and uncertain points
- AceGuides shop link is still blank, so no shop button shows (as before).
- The previews are frozen pictures: if a demo's front page changes, rerun `tools/screenshot-demos.mjs`.
- The 3D was checked in headless Chromium with software WebGL; real phones and laptops should look the same or smoother, but were not tested by hand.
- Demo screenshots show each demo's own example ratings and prices; those demos label them as demo numbers, and the gallery note says they are examples.
- Not included on purpose: parts-store-demo and The One Barber.
