# Design rules shared by all demo sites

These apply to barber-demo, cafe-demo-v2, cafe-demo, gym-demo, plumber-demo and salon-demo. (parts-store-demo is out of scope.) Each site keeps its own look; these rules keep the sites consistent in quality, not in style.

## Golden rules (never break these)
1. **Never invent facts.** No fake reviews, ratings, prices, phone numbers, addresses or "live" numbers. If a real value is missing, leave a clearly marked blank or `DEMO` placeholder in `site.config.json`. Demo numbers (rating, review count, busy times) carry a visible "Demo" or "Usually" label.
2. **Keep the "concept demo" label** on every site (footer notice, page title, README).
3. **Competitor numbers or names never appear on a site.** Style references are for mood and layout ideas only: never copy their words, photos or logos.
4. **No promises of exact results** ("+40% sales", "guaranteed"). Say what the site does, not what it will earn.
5. **Respect `prefers-reduced-motion`.** Every animation, parallax layer and smooth-scroll effect has a still fallback.
6. **Don't break what works:** booking calendar, sticky Call/Book bar, Lenis smooth scroll, `site.config.json`, the test suites.
7. **Static only:** plain HTML, CSS and JS. No server, no paid tools, no new libraries, no external requests (fonts, scripts and icons are self-hosted).
8. **One config file per site.** Business details, hours, prices, links and feature switches live in `site.config.json`. A feature with an empty value or a switch set to off disappears completely (no empty box, no broken link).
9. **Nothing is really sent anywhere.** Forms, reminders, waitlists and pick-up orders are front-end demos with a code comment saying where a real service plugs in.

## Spacing
Use a 4px base. Allowed steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Page gutter 16px on phones, 32px from 720px up. Section padding 64px (phone) to 96-128px (desktop). Cards: 16-24px inner padding.

## Colour
- **2 or 3 colours only, plus neutrals:** one dark (text and dark sections), one light (page), one accent (buttons, links, highlights). A second accent is allowed only if the site already has one.
- Text contrast at least **4.5:1** (large text 3:1) on every background, including text over photos (use a soft gradient only behind the text, never a heavy overlay across the whole photo).
- Colours are defined once as CSS variables (`--ink`, `--paper`, `--accent`) from `site.config.json` where the site has a theme block.

## Type scale
Mobile-first, ratio about 1.25, set with `clamp()`: 14 / 16 (body, never below 16 for paragraphs on phones) / 18 / 20 / 24 / 30 / 38 / 48 / 60. At most two font families (one heading, one body), self-hosted, `font-display: swap`. Line length 45 to 75 characters. Nothing under 12px.

## Buttons
- **Primary:** solid accent, 48px minimum height (44px absolute minimum), full pill or the site's own radius, bold label, one per screen area. Hero shows exactly **one** big main button (Book, Call or Order, whichever fits).
- **Secondary:** outline in the same radius. **Tertiary:** underlined text link.
- Visible keyboard focus ring (3px, offset 2-3px). Hover and active states. Disabled buttons are visibly different and explain why when possible.
- A sticky Call/Book (or Call/Order) bar follows the visitor on phones and never covers content or the cookie bar.

## Motion
- Parallax: **2 to 3 layers at most**, translate up to about 30px, no rotation or scaling tricks, no scroll-jacking. Lenis smooth scroll stays.
- Reveal-on-scroll is subtle (opacity and 12-24px lift, under 600ms).
- Under `prefers-reduced-motion: reduce`: no parallax, no reveals, no auto-playing motion, instant scroll. Heavy effects (WebGL) fall back to a still image when WebGL fails, on slow phones, and with JavaScript off.

## Mobile first
Design at 390px first, then 768, 1024, 1440. No horizontal scroll at any width from 360 to 1920. Tap targets 44px or more. Tap-to-call number on every screen size (header on desktop, sticky bar on phones). Respect safe areas (`env(safe-area-inset-*)`) and use `dvh`/`svh` rather than `vh`.

## Trust details every site shows
Tap-to-call phone number; a "Get directions" link that opens Google Maps (`googleMapsUrl`); opening hours with an "Open now / Closed, opens at ..." banner from the config hours in the site's own time zone; a services and prices section; the suburb in the hero headline (stated neutrally, with no unproven claims like "best" or "friendliest"); verbatim Google reviews **only** if they are really in `site.config.json` or `brand.md`; the Google rating badge only when real numbers are filled in.

## Features switched from the config
Google review button + QR, booking reminders (front end only), Google/Instagram/Facebook icon links, Google rating badge, waitlist, "usually quieter at..." busy-times indicator, opening-hours banner; click and collect on the cafe sites only. Keys are documented in each site's README.

## Checks before a site is called done
At 390px and 1440px: no overlap or overflow, no broken images, every button works, hours banner shows the right state, reduced-motion works, every number and name is real or an obvious placeholder, contrast at least 4.5:1, no console errors. Each site has `CHANGES.md` listing what changed, what is still a placeholder, and anything uncertain.
