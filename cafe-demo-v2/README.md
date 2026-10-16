# Ember & Oak Coffee: concept demo v2 (cinematic)

A second, more cinematic take on the fictional café site, styled after a dark, minimal, editorial coffee-brand look (black, burgundy and gold, square corners, Montserrat, a big script wordmark). **Everything is fictional** (name, address, phone, prices, reviews, team, news). The footer reads "Concept demo by KB Ventures. Not a real business." The page is `noindex`. The original version is untouched in `../cafe-demo/`.

No frameworks and no build step: `index.html`, `styles.css`, `main.js` (page behaviour) and `scene.js` (the 3D cup only). Preview with `python3 -m http.server` in this folder. All paths are relative, so it works from a GitHub Pages sub-folder.

## What is on the page
Scrolling news ticker with venue tabs, a transparent header (logo, Reserve, hamburger) that opens a full-screen numbered menu, a full-screen hero (burgundy slab, handwritten wordmark that "writes" itself, 3D cup with steam and embers, live "Open now" chip), facts bar, three featured offerings with flavour notes, a 38-item menu in six tabs, experiences, story with count-up stats / farm-to-cup / team, sample reviews, gallery, events, gift cards, opening hours + map placeholder + getting-here info, FAQ, reservation/enquiry form, newsletter, footer, and a sticky Call / Reserve bar on phones.

## Changing things
- **Colours:** the `:root` block at the top of `styles.css` (`--black`, `--wine`, `--wine-deep`, `--gold-light` / `--gold-text`, `--cream`, `--tint`). Keep `--gold-text` dark enough on light backgrounds and `--gold-light` on dark ones (WCAG AA). Corners are square via `--radius: 0px`.
- **Name / wordmark:** the `<h1 class="wordmark">` in the hero, the title and Open Graph tags in `<head>`, and the footer brand. The script font is "Mrs Saint Delafield" (`--font-script`).
- **Hero look:** `.hero-panel` (the burgundy slab and its red top edge), `.hero-glow`, `.hero-grain` in `styles.css`.
- **Ticker:** the `.ticker` block at the top of `index.html` (the news items appear twice so the loop is seamless: keep both copies identical).
- **Menu:** `<section id="menu">`, one `<article class="menu-item">` per dish inside its tab panel (`#panel-coffee`, `#panel-breakfast`, `#panel-lunch`, `#panel-bakery`, `#panel-cold`, `#panel-evening`). Tags: V, VG, GF, DF; add `<span class="sig">` for a Signature star. To add a tab, copy one `role="tab"` button and one `role="tabpanel"` div and keep the ids matching.
- **Featured offerings:** the three `<article class="feature">` blocks in `#now-pouring`.
- **Opening hours:** the `<table class="hours">` in `#visit` (keep `data-day`, 0 = Sunday) and the `hours` object in `main.js` (search "Open now").
- **Experiences, events, FAQ, gift card amounts, team:** `#experiences`, `#whats-on`, `#faq`, `#gift-cards`, and the `.team` list in `#story`. Links with `data-enquiry="..."` pre-select the form's dropdown.
- **Form, newsletter, gift cards:** demo only. Connect a form service, email provider and payment provider where the `DEMO ONLY` comments are.
- **Photos:** all imagery is inline SVG or CSS. To use real photos, add them to an `images/` folder and swap them into `.feature-art`, the gallery tiles and the hero background.

## How the 3D hero and its fallback work
`scene.js` builds the cup, saucer, coffee, steam and floating embers in code with Three.js (pinned to `0.160.0` via the import map). It rotates slowly, tilts toward the mouse, can be dragged on touch screens and uses device tilt only where no permission prompt is needed. Pixel ratio is capped at 1.5, one render loop pauses off-screen or in a hidden tab, resources are disposed, and reduced-motion visitors get a still frame.
The page always contains an inline SVG cup (`.cup-fallback`). `main.js` removes the canvas and keeps that illustration if WebGL is unavailable, Three.js fails to load, the WebGL context is lost, or the scene takes longer than 4 seconds. Visitors never see a blank box.

## Checks that were run
Playwright + Chromium: no horizontal overflow at 360, 375, 414, 768, 1024, 1280 and 1920 px (and at 375 px with every menu tab, all FAQ items, form errors, success panel, newsletter error, open menu and toast); tap targets of at least 44px, body text 17px and no text under 14px on a 375 px phone; button gaps of at least 16px; text contrast audit; menu, tabs, form, newsletter and gift picker behaviour; fallback when WebGL is off, the CDN is blocked or loading takes over 4 seconds; reduced-motion still frame; pixel-ratio cap.
