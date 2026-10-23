# Cafe demo (v1): what changed

Unofficial concept demo (Ember & Oak Coffee, fictional). This is the simple one-page version; the larger site is `cafe-demo-v2`.

## What changed
- **Hero:** headline now carries the suburb ("Coffee roasted out back, poured right here in Melbourne."; the suburb comes from `site.config.json`), one big main button (Order for pick-up), then quiet links: Reserve a table, Call, Get directions. The 3D scene and its fallback picture are unchanged (its parallax already stops with reduced motion).
- **Trust details:** tap-to-call in the hero, Visit section, footer and the sticky phone bar; "Get directions" opens `googleMapsUrl`; hours table plus an "Open now / Closed, opens at ..." chip from the config hours in Melbourne time; menu with prices; no reviews shown as Google reviews.
- **New from site.config.json (now created):** Google review button and a QR page (`reviews.html`, with print view), reservation reminders (None / Email / Text, with a reminder preview on the confirmation), Google / Instagram / Facebook links, Google rating badge, waitlist on full reservation times (browser only), "usually quieter" busy-times line and strip, and click and collect (Add buttons, cart drawer, pick-up time every 10 minutes from 15 minutes ahead inside opening hours, fake order number, "Pay in store", nothing sent).
- Added `404.html`, `robots.txt`, `sitemap.xml`, a favicon and a small test suite (`tests/run.mjs`).

## Still placeholders
Phone 03 5550 0123, address 12 Example Street, email, Google review / Maps / Instagram links (`DEMO` style), rating 4.9 from 120 reviews (labelled "Demo number"), the busy-times table, menu prices, any customer quotes (invented sample content).

## Not sure about / skipped
- Style references: cultureespresso.com, hyggecafes.com and colectivocoffee.com were studied for mood and layout only (screenshots/page text); nothing copied.
- This version has no photo files (pictures are CSS/SVG and the 3D scene), so there is no photo folder to list.
- The 3D library (three.js) and Google Fonts load from CDNs, as in the original; the sandbox blocks them and the page falls back gracefully. Self-hosting them is a future task.
- Orders, reminders and the waitlist are deliberately not connected to anything.
