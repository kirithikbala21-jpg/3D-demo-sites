# CHANGES (cafe-demo-v2, growth upgrades)

## What changed
- **Reviews and QR**: `reviews.html` (new page; only built when `googleReviewUrl` is set), QR drawn in the browser by `js/qr.js` (no library), Print button with a print stylesheet that shows only the heading and the code; footer button; "Loved your visit? Tell us" home section.
- **Rating badge**: five SVG stars filled to the rating, in the hero and the footer, linking to `googleMapsUrl`. Shown only when rating, count and Maps link are all set. "Demo number" note stays on the demo.
- **Social links**: footer icons and contact-page buttons for Google Maps, Instagram and Facebook (each only if its URL is set), new tab, `rel="noopener"`, accessible labels.
- **Reminders**: None / Email / Text on the reservation, pick-up order and wholesale forms, consent line, validation (Australian mobiles), confirmation "Reminder set for <day before, 9am>" and a message **preview**. Nothing is sent.
- **Waitlist**: "Join the waitlist" on fully booked table times; form saved in this browser only.
- **Click and collect**: new order drawer (day + time every 10 minutes, name, phone, "Place pickup order", made-up order number, Pay in store), sessionStorage cart, `orderingEnabled` switch. The pick-up time logic is in `js/clock.js` and unit tested.
- **Best time to come**: `busyness` table, line and 7-day SVG strip on the visit and reserve pages.
- **Hero / trust**: place line in the hero, real "from" prices, one big main button, call + directions links, subtle two-layer parallax (off for reduced motion).
- **Config**: new flat keys (see README) validated by `tools/build.py` with plain-English errors; features with empty values are not output at all.
- **Cookie bar and compact hero**: on phones and tablets the cookie bar is now a slim one-row bar just above the sticky Call/Reserve bar, on desktop the card sits bottom-right, and the hero is compact on small screens (smaller 3D cup, tagline hidden, the main button and call/directions links come first), so no hero button or link is covered at first load (checked at 390x844, 414x896, 768x1024, 1440x900, 1920x1080; the rating link is hidden in the hero below 381px and stays in the footer). Hero text contrast measured on real pixels: 5.9:1 or better.
- **Tests**: new `growth` suite (56 checks), 8 more unit checks; existing cart tests updated for phone + sessionStorage.
- Fixes found on the way: the order form scrolls inside the drawer; the reminder error no longer vanishes on blur (which made the first tap on Submit miss).

## Placeholders still in the demo
- `googleReviewUrl`, `googleMapsUrl`, `instagramUrl`: demo links (`DEMO` in the address).
- `googleRating` 4.9 / `googleReviewCount` 120: **demo numbers**; replace with the real ones or remove.
- The `busyness` table is a made-up typical week.
- Sample reviews, team, address, phone and email are invented and labelled (unchanged).

## Doubts and open questions
- Sending reminders, saving waitlist entries and receiving orders are **not connected**; the owner needs an email/SMS/ordering service before launch.
- The map on the home and visit pages still uses a Google Maps embed (an existing external request, loaded on demand on the visit page).
- Some 3D / scroll tests (slow-load fallback, 3D loaded, reduced-motion still frame, sticky header shrink, announcement reload) are timing sensitive under software graphics and fail now and then when the machine is busy; each passed in at least one full run, and the sticky-header and announcement ones also fail on the untouched original at times (the page can restore a small scroll offset after a reload).
- "Order for pick-up" in the hero links to the menu; if `orderingEnabled` is false the main button becomes "Reserve a table", but page text such as "Order ahead for pick-up" in `site.config.json` pages must be edited by hand.
