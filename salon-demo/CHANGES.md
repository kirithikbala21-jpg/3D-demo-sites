# Salon demo: what changed

Unofficial concept demo (Maison Lune, fictional). This file lists the upgrade rounds, what is still a placeholder, and what I was unsure about.

## What changed
- **Hero:** headline now carries the suburb ("Hair that feels like you, in Glen Waverley."), real photo, ONE big main button (Book now), then quiet links (Call, Get directions). A soft dark shade sits only behind the words (it follows the text block); the photo stays bright elsewhere. Text contrast was measured on the real photo pixels at 360 to 1440px: every line is at least 4.5:1. Subtle parallax (one layer) with a reduced-motion fallback.
- **Trust details:** phone number in the header on desktop and in the sticky Call/Book bar on phones; "Get directions" (Google Maps) in the hero, Visit section and footer; hours table plus an "Open now / Closed, opens at ..." strip under the header (Melbourne time); services and prices section; no reviews shown as Google reviews.
- **New from site.config.json:** Google review button and a QR page (`reviews.html`, with a print view), booking reminders (None / Email / Text, with a reminder preview on the confirmation), Google / Instagram / Facebook icon links, Google rating badge, waitlist on full slots (saved in the browser's localStorage only), "usually quieter" busy-times line and 7-day strip, opening-hours strip. No click and collect (cafes only).
- Earlier rounds: Melbourne-time calendar and holidays, forms hardening, privacy page, cache busting, owner README.

## Still placeholders (replace before launch)
Phone `03 5550 0188`, address `21 Example Street`, email, ABN, Google review link (`g.page/r/DEMO/review`), Google Maps link, Instagram link, rating 4.9 and 120 reviews (labelled "Demo number"), the busy-times table, stylist names, prices, the sample reviews (labelled sample), the Unsplash stock photos and their credits.

## Not sure about / skipped
- Style references: I could read thphair.com visually; luxeconceptsalon.com.au and lavishsalon.ca could not be read from here, so no notes come from them.
- The hero text sits on a fairly large dark wash on phones because the headline, paragraph and buttons fill most of the photo; the top of the photo and the right of the desktop photo stay bright.
- The hero "See prices" link was removed to make room (Prices is in the main menu).
- Real SMS/email sending, real waitlist storage and real booking are deliberately not connected.
