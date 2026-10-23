# Ember & Oak Coffee: concept demo

A sample café website, built to show local café owners what a modern, fast, 3D-enhanced site can look like.
**Everything is fictional** (name, address, phone, prices, reviews). Footer reads "Concept demo by KB Ventures. Not a real business." The page is marked `noindex` so search engines skip it.

It is a single scrolling page (no frameworks, no build step), styled like a premium restaurant site: announcement bar, dark glass header, hero with a 3D coffee cup and a live "Open now" chip, scrolling ticker, press quotes, a 38-item tabbed menu (Coffee & tea, Breakfast, Lunch, Bakery & sweets, Cold drinks, Evening), house signatures, experiences (tours, workshops, private dining, catering, subscriptions, gift cards), story with stats, farm-to-cup steps and team, sample reviews, bento gallery, events, gift card picker, opening hours + map placeholder + getting-here info, FAQ, reservation/enquiry form, newsletter sign-up, footer, and a sticky Call / Reserve bar on phones.
Design decision: one page with anchor links suits a café this size, so all content lives in `index.html` instead of separate pages.

## Features at a glance (all switched from `site.config.json`)
Google review button + QR page, reservation reminders (front end only), Google/Instagram/Facebook links, Google rating badge, waitlist (browser-only demo), "usually quieter" busy-times line, click and collect (demo, pay in store), "Open now" chip, Get directions, tap-to-call. A feature with an empty value or its switch set to off disappears completely. What changed and what is still a placeholder: `CHANGES.md`. Brand notes: `brand.md`.

## Files

| File | What it does |
| --- | --- |
| `index.html` | All content and structure |
| `styles.css` | Design system and layout |
| `main.js` | Menu, tabs, reservation form, scroll effects, 3D loader + fallback. Loads `site.config.json` first |
| `site.config.json` | **The one file the owner edits**: phone, address, hours, links, ratings, switches (see "Config reference") |
| `reviews.html` | Google review page with a large QR code and a print view (QR + heading only) |
| `js/` | Small modules: `config`, `clock` (café time zone), `growth` (hours, links, rating, best time), `order` (click and collect), `reminder`, `waitlist`, `busy`, `rating`, `social`, `qr`, `reviews` |
| `tests/run.mjs` | 55 browser checks for every feature (needs `tests/node_modules`, a symlink to `../../cafe-demo-v2/tests/node_modules`) |
| `robots.txt`, `sitemap.xml`, `404.html`, `favicon.svg` | Housekeeping |
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
- **Opening hours:** `hours` in `site.config.json` (24-hour "HH:MM"; a close time earlier than the open time means after midnight; `"open": null` = closed). The hours table, both "Open now / Closed, opens ..." chips, the booking times and the pick-up times all follow it, in the café's own time zone (`timezone`), whatever time zone the visitor is in. Add one-off closures to `closures`: `{"date": "2026-12-25", "name": "Christmas Day", "status": "closed"}`.
- **Experiences, events, FAQ, gift card amounts, team:** sections `#experiences`, `#whats-on`, `#faq`, `#gift-cards` (the `.chip-opt` radios) and the `.team` list inside `#story`. Buttons with `data-enquiry="..."` pre-select the form's "I'd like to…" dropdown.
- **Newsletter and gift cards:** demo only. Connect an email provider and a payment provider where the `DEMO ONLY` comments are.
- **Address / phone / email:** `site.config.json` (`phone`, `email`, `street`, `locality`). Every phone link, the address blocks and the footer follow it. (The HTML keeps the same text as a fallback for visitors without JavaScript.)
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

## Config reference (site.config.json)

Edit this one file; no other file needs touching. If a value is empty or a switch is off, the feature is hidden completely (no empty box, no broken link). A link must start with `https://`, otherwise it counts as empty. If the file cannot be read the page falls back to built-in defaults.

| Key | What it does |
| --- | --- |
| `name`, `phone`, `email`, `street`, `locality`, `timezone` | Business details. `timezone` drives "Open now" and every time list |
| `hours`, `closures` | Weekly hours and one-off closures (see above) |
| `googleReviewUrl` | Feeds the "Loved your visit? Tell us" section, the footer **Leave us a Google review** button and the QR code on `reviews.html` (demo value `https://g.page/r/DEMO/review`) |
| `googleMapsUrl`, `instagramUrl`, `facebookUrl` | Footer icon links, and the "Find us on Google Maps" / "Follow us on Instagram" buttons in the Visit section. Empty = hidden (Facebook is empty by default). All open in a new tab with `rel="noopener"`. Demo values are placeholders |
| `googleRating`, `googleReviewCount` | The "Rated 4.9 on Google · 120 reviews" badge with five SVG stars (hero and footer), linking to `googleMapsUrl`. **Use the business's REAL rating and review count. Never invent one.** The demo shows a "Demo number" note: delete `.g-rating-demo` output in `js/rating.js` (`demo` option) when real numbers are in |
| `remindersEnabled`, `reminderLeadHours` | "Remind me: None / Email / Text" on the reservation form; the confirmation says "Reminder set for <day before, 9am>" (24 hours = one day before) |
| `waitlistEnabled` | "Join the waitlist" on full table times |
| `orderingEnabled` | Click and collect on the menu (Add buttons, cart drawer, pick-up times) |
| `busynessEnabled`, `busyness` | "Best time to come": per day and time block, `quiet` / `medium` / `busy` (`closed` for closed blocks). Shown as "Usually quiet on ..." plus a 7-day strip, today outlined. It is the owner's typical pattern, never live data. Leave `blocks` empty to hide it |

## New features: what is real and what is a demo

- **Reviews + QR:** the QR code is drawn in the browser by `js/qr.js` (no library, no network). **Print this** prints only the heading, the QR code and "Scan to leave a review".
- **Reminders:** front end only. **Sending is not connected.** Plug in an email or SMS service in `main.js` (search "Reminder set") and in `js/reminder.js`, per customer, using `reminder.read()` (`{ mode, contact }`). The page only says a reminder is "set"; it never says a message was sent.
- **Waitlist:** front end only. The "full" times are a deterministic demo pattern (Friday and Saturday lunch, plus a few others) so the waitlist can be seen. Entries are kept in this browser only (`localStorage` key `waitlist`). Plug real notifications in at `onJoin` in `js/waitlist.js` and replace `isFullSlot` in `js/growth.js` with your real bookings.
- **Click and collect:** the order is **not sent anywhere** and **no payment is taken** ("Pay in store"); the order number is fake. Pick-up times are every 10 minutes from 15 minutes ahead while open (café time zone). The cart survives a reload through `sessionStorage`. To make it real, send `order` to your own endpoint in `js/order.js` (search "DEMO ONLY").
- **Best time to come / rating badge:** typical pattern and owner-supplied numbers only.

## Tests
```
cd cafe-demo
export CHROME_PATH=/path/to/chromium
node tests/run.mjs
```
Covers 390 and 1440 px on all three pages (no sideways scroll, no broken images, no text under 12px, 44px tap targets, contrast with axe), the open banner with a fake clock and a visitor in another time zone, every feature above with empty and valid values, the cart end to end, the waitlist on a full time, the QR code (decoded with OpenCV), the print view, and the features switching off when their config value is empty. (Three.js and Google Fonts load from CDNs, which are blocked in the test sandbox; those failed requests are ignored.)
