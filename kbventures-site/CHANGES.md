# Changes: KB Ventures redesign, dark and premium (27 October 2026)

This replaces the paper-and-ink "proof sheet" version. The design system and the eight notes from the reference page (Revolut's Ultra plan page, used for mood only) are in `brand.md`. Nothing was copied from Revolut or any other company: no layout, text, logo, icon, font or image.

## What changed
- **Look:** a near-black page (`#0D0E12`), graphite cards (`#1A1C23`), platinum text, brushed-silver secondary text and a champagne-gold accent kept under 5% of the page. Gold is used only for the short line under the hero label, the Live/Starting dots, secondary-button borders on hover and links on hover.
- **Type:** Geist (SIL Open Font License, self-hosted) at weight 500, tight line height and slight negative tracking. Hero headline `clamp(44px, 8vw, 96px)`, section headlines `clamp(34px, 6vw, 80px)`, 17–18px body text.
- **Nav:** slim and sticky, with the KB Ventures wordmark and links to Businesses, Websites and Contact, plus a small "Get in touch" pill. On phones the text links fold away and the pill stays. A hairline appears under it once you scroll.
- **Hero:** left-aligned label with a short gold line, the headline "We write study guides for students, and build websites for the shop down the road.", one line of copy, and a "See the websites" pill with a "Get in touch" outline pill. Below it, a large framed screenshot of the Iron & Ember gym demo is tilted back slightly and lit by one soft, wide, cool spotlight. A hairline catches the light on the frame's top edge. As you scroll, the frame drifts and straightens slowly. Nothing else on the page glows.
- **What we run:** a centred "Two businesses. One standard." and two graphite cards (AceGuides: Live, KB Websites: Starting). Card text starts silver and brightens to platinum on hover or keyboard focus. The AceGuides link still only appears when `aceguidesShopUrl` is filled in.
- **How KB Websites works:** a centred headline and the same short paragraph as before (free preview, you choose, we put it live).
- **Concept websites:** a centred heading "Concept websites we built to show what's possible." with the concept-demo note under it. Then a sideways scroll-snap row of five cards (gym, barber, cafe, plumber, salon), each with the framed desktop screenshot, a phone frame over the bottom-right, the type, name, one line and an "Open demo" pill. Dots and previous/next buttons sit under the row. Swipe, trackpad, the arrow keys (with the row focused), Home/End, the dots and the buttons all work, and tabbing to each card's link brings it into view.
- **Contact:** a centred large line and the email address as the main pill.
- **Footer:** the "KB Ventures" wordmark is shown in full at every width (sized with `clamp()`, with enough line height and padding), with a small row of links below.
- **Screenshots:** all ten retaken as one matching set: 1440x900 and 390x844, the clock frozen at Tuesday 27 October 2026 12:00 Melbourne time, banners hidden, saved as WebP at 1280x800 and 480x1039 (22–58 KB each). The browser and phone frames are drawn in CSS, so they are identical for all five. Every image has width, height and alt text.
- **Motion:** slow fade-ups on scroll, the hero frame's parallax and Lenis smooth scrolling. All of it is off with reduced motion.
- **New dark favicon, home-screen icon and share image (`og.jpg`)**, and the 404 page restyled to match.
- `site.config.json`: same demos in the same order. The plumber-only `phone` and `aside` fields are gone, because every card now shows a phone frame.

## One change to the brief
The brief asked for card text dimmed to silver at about 60% opacity. That measures 2.75:1 on graphite, under the 4.5:1 minimum the same brief sets. The dimmed state is therefore full silver (5.3:1), brightening to platinum (13.6:1) on hover or focus. It gives the same effect and stays readable.

## Checked
- At 360, 390, 768, 1024 and 1440px, at 125% zoom and with reduced motion: no sideways scrolling, no overlapping text, no text under 12px, every tap target at least 44px, every text colour at least 4.5:1 (3:1 for large text), no broken images, every in-page link has a target, no console errors, no requests outside the site.
- The footer wordmark fits inside its box at every one of those widths.
- Page weight is about 80–175 KB depending on width; it loads in under 0.1 s from a local server.
- Carousel tested with the arrow keys, Home/End, dots, buttons and Tab, plus hover states on cards and pills.
- Two bugs found and fixed during the checks:
  - Screen-reader text inside the carousel's links was positioned against the page, so the whole page scrolled sideways by several thousand pixels.
  - The spotlight stuck out 30px past the screen edge.

## Left as they were, and uncertain points
- Files from earlier versions that no page uses any more: `hero.js`, `scene.js`, `vendor/three.module.min.js`, `vendor/addons/`, and the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts. They were not deleted because this session was asked not to run `rm`. They are never loaded, so they do not slow the page.
- The repo's top-level `404.html` (outside this folder) is still empty; this site's `404.html` takes effect once the site has its own repo.
- The AceGuides shop link is still blank, so the AceGuides card has no link.
- The live demo links could not be opened from this environment, so they were checked against the demo folders in the repo instead.
