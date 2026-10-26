# CHANGES: growth upgrades and hero / trust upgrade (barber-demo)

## What changed
**New page:** `reviews.html` (Google review QR + Print this). Built from the config; not built at all when `googleReviewUrl` is empty.

**Pages that gained something:** `index.html` (hero rewrite, rating badge, "Loved your visit? Tell us" section, Maps and Instagram buttons), `book.html` and `visit.html` (best time to come, waitlist, reminders), `services.html`, `shop.html`, `barbers.html`, `membership.html`, `journal.html`, `careers.html`, `legal.html`, `404.html` (open banner, footer review button, social icons, rating badge in the footer, header phone, "Your visit" reminder), `legal.html` (reminder and waitlist wording).

1. **Google review button + QR:** footer button, home section, `reviews.html` with a large QR drawn in the browser (`js/qr.js`, decoded with OpenCV in the tests), "Scan to leave a review", Print this button with a print stylesheet that shows only the QR and heading. Config: `googleReviewUrl`, `googleMapsUrl`.
2. **Reminders (front end only):** None / Email / Text on the booking form and the "Your visit" drawer, format validation (email, Australian mobile), consent line, confirmation "Reminder set for <day before, 9am>" and a **preview** of the message text. Sending is NOT connected (code comments in `js/reminder.js`, `js/forms.js`, `js/cart.js` and a README line). Config: `remindersEnabled`, `reminderLeadHours`.
3. **Social links:** Google Maps, Instagram, Facebook (optional) icon links in the footer; "Find us on Google Maps" and "Follow us on Instagram" buttons on the Visit page and home Find-us section. Placeholder URLs.
4. **Click and collect:** not applicable to a barber (cafes only).
5. **Google rating badge:** five SVG stars filled to the rating, in the hero and footer, linking to `googleMapsUrl`; "Demo number" note. Config: `googleRating`, `googleReviewCount`.
6. **Waitlist:** full times on the calendar are clickable ("Waitlist"), small name + phone form, saved to `localStorage` (`bb-waitlist`) for the demo; real saving is connected later (`onJoin` in `js/waitlist.js`). Config: `waitlistEnabled`.
7. **Best time to come:** "Usually quieter at 9am to 12pm on Tuesdays." plus a 7-day SVG strip with today highlighted. Typical pattern from config, never live. Config: `busynessEnabled`, `busyness`.
8. **Open banner:** "Open now, closes at 7pm" / "Closed now. Opens tomorrow at 10am" on every page, Sydney time, from the hours in config. Config: `openBannerEnabled`.
9. **Hero / trust:** H1 includes "Barbershop in Surry Hills, Sydney"; one big Book button (Get directions and See prices are plain links); hours and prices on show; tap-to-call in the header on desktop and in the sticky bar on phones; real photo from `img/photos`; subtle parallax with three layers (photo, brass panel, still content) and a reduced-motion fallback; rating badge only when real numbers are configured.

Other small fixes: the shrunken header logo is now 44px (was 42px); the cookie card no longer covers the hero Book button at 900px-tall screens; existing tests that picked "taken" times now understand waitlist slots.

## Still a placeholder (replace before launch)
Review link `https://g.page/r/DEMO/review`, the Maps and Instagram URLs, rating 4.9 and 120 reviews (**demo numbers**, never invent real ones), the busy/quiet table, the three sample reviews, address, phone, ABN and every invented name/price.

## Things I was unsure about
- "Closed" blocks in the busyness table: I used `closed` for the Monday evening (shop shuts 6pm) and Sunday evening; the owner should check the whole table.
- The hero is now top-aligned on desktop so the Book button stays above the cookie card. On screens shorter than about 770px the card can still cover the button until it is answered.
- Waitlist uses the existing Australian phone validator (landlines allowed); reminders by text accept mobiles only.
- The Visit page still embeds a Google Maps iframe (existing feature, not new); all new features make no external requests.
- The existing sample reviews use a layout that resembles review cards; they are labelled "Sample review" on every card and do not mention Google.
