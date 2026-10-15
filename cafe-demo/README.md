# Ember & Oak Coffee: concept demo

A sample café website, built to show local café owners what a modern, fast, 3D-enhanced site can look like.
**Everything is fictional** (name, address, phone, prices, reviews). Footer reads "Concept demo by KB Ventures. Not a real business." The page is marked `noindex` so search engines skip it.

It is a single scrolling page (no frameworks, no build step), styled like a premium restaurant site: announcement bar, dark glass header, hero with a 3D coffee cup and a live "Open now" chip, scrolling ticker, press quotes, a 38-item tabbed menu (Coffee & tea, Breakfast, Lunch, Bakery & sweets, Cold drinks, Evening), house signatures, experiences (tours, workshops, private dining, catering, subscriptions, gift cards), story with stats, farm-to-cup steps and team, sample reviews, bento gallery, events, gift card picker, opening hours + map placeholder + getting-here info, FAQ, reservation/enquiry form, newsletter sign-up, footer, and a sticky Call / Reserve bar on phones.
Design decision: one page with anchor links suits a café this size, so all content lives in `index.html` instead of separate pages.

## Files

| File | What it does |
| --- | --- |
| `index.html` | All content and structure |
| `styles.css` | Design system and layout |
| `main.js` | Menu, tabs, form, hours highlight, scroll effects, 3D loader + fallback |
| `scene.js` | The 3D cup (Three.js), nothing else |

Preview locally with any static server, e.g. `python3 -m http.server` inside this folder. All paths are relative, so it also works from a GitHub Pages sub-folder (`https://<user>.github.io/<repo>/cafe-demo/`).

## Changing things

- **Name:** search `index.html` for `Ember` (header `.brand`, mobile menu, footer, `<title>`, Open Graph tags). The tiny logo mark is the `<symbol id="logo-mark">` near the top of `<body>`.
- **Colours:** the `:root { ... }` block at the top of `styles.css`.
  `--cream` page background, `--ink` text, `--espresso` dark sections, `--ember-strong` buttons and links, `--ember` / `--oak` decorative accents, `--muted` secondary text.
  Keep `--ember-strong` dark enough for white text (WCAG AA). The 3D scene's dark backdrop is the `.hero-stage` gradient.
- **Hero look:** the dark hero background is the `.hero` gradient in `styles.css`; the 3D backdrop is transparent, so it sits on that gradient.
- **Fonts:** the Google Fonts `<link>` in `<head>` and `--font-head` / `--font-body` in `:root`.
- **Menu:** `<section id="menu">`. Each dish is one `<article class="menu-item">` inside the panel for its tab (`#panel-coffee`, `#panel-breakfast`, `#panel-lunch`, `#panel-bakery`, `#panel-cold`, `#panel-evening`). Edit the name, `.price`, description and the tags (V, VG, GF, DF; add `<span class="sig">` for a Signature star). To add a tab, copy one `role="tab"` button and one `role="tabpanel"` div and keep the ids matching. The weekend feature card is `.feature-card`, and the three signature cards are in `#signatures`.
- **Opening hours:** the `<table class="hours">` in `<section id="visit">`. Edit the times in each row and keep the `data-day` numbers (0 = Sunday … 6 = Saturday). The "Open now" chip reads the `hours` object in `main.js` (search "Open now"), so update both places.
- **Experiences, events, FAQ, gift card amounts, team:** sections `#experiences`, `#whats-on`, `#faq`, `#gift-cards` (the `.chip-opt` radios) and the `.team` list inside `#story`. Buttons with `data-enquiry="..."` pre-select the form's "I'd like to…" dropdown.
- **Newsletter and gift cards:** demo only. Connect an email provider and a payment provider where the `DEMO ONLY` comments are.
- **Address / phone / email:** `<address>` in `#visit`, the mobile menu note, and the `tel:` link.
- **Stats:** `data-count` and `data-suffix` on the `.stat-num` elements in `#story`.
- **Reviews:** keep the "Sample reviews for demo purposes" label unless you replace them with real, permitted reviews.
- **Form:** there is no backend. `main.js` (search "DEMO ONLY") shows where to post to a form service such as Formspree or Netlify Forms.
- **Map:** replace the `.map-box` contents with an embedded map or a static image.

## How the 3D hero and its fallback work

`scene.js` builds the cup, saucer, handle, latte-art coffee surface and steam in code with Three.js (pinned to `0.160.0` via the import map in `index.html`; no model files or images). It rotates slowly, tilts toward the mouse on desktop, can be dragged on touch screens, and uses device tilt only where the browser allows it without a prompt (iOS asks permission on the first touch).

Performance and safety: pixel ratio capped at 1.5, one `requestAnimationFrame` loop that pauses when the cup is off-screen or the tab is hidden, resources disposed on exit, and a still frame when the visitor prefers reduced motion.

The page always contains an inline SVG illustration of a steaming cup (`.cup-fallback`). `main.js` removes the 3D `<canvas>` and keeps that illustration if any of these happen: WebGL is unavailable, Three.js fails to load or throws, the WebGL context is lost, or the scene takes longer than 4 seconds to start. If the scene is ready in time, the canvas fades in over the illustration. Visitors never see a blank box.

## Checks that were run

Playwright + Chromium: no horizontal overflow at 360, 375, 414, 768, 1024, 1280 and 1920 px (also at 375 px with every menu tab, all FAQ items, form errors, the success panel, the mobile menu and the toast open); tap targets of at least 44px and text of at least 14px on a 375 px phone; menu, tabs, form, newsletter and gift picker behaviour; fallback when WebGL is off, when the CDN is blocked, and when loading takes over 4 seconds; reduced-motion still frame; pixel ratio cap.
