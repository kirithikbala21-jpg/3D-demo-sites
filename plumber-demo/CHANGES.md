# Plumber demo: what changed

Unofficial concept demo (Waverley Plumbing & Gas, fictional).

## What changed
- **Hero:** headline now carries the suburb ("Glen Waverley plumbers who turn up when they say they will."), a real photo, the phone number as the big main button (Call now) with "Get a free quote" beside it, a "Get directions" link on desktop (phones get it in the Contact section and footer so the cookie and phone bars never cover a button), the rating badge only when real numbers are in the config. The phone headline is 32px (was 36px) to make room for the suburb.
- **Trust details:** phone number in the header on every screen size and in the sticky Call bar on phones; "Get directions" (Google Maps) in the contact section; hours, prices and the open/closed banner in Melbourne time; the on-call bar after 6pm.
- **New from site.config.json:** Google review button and QR page (`reviews.html` with a print view), quote reminders (None / Email / Text) with a reminder preview on the confirmation, Google / Instagram / Facebook icon links, Google rating badge, "Call me back" form (the waitlist for a plumber; saved in the browser only), open-hours banner. No click and collect, no busy-times (not asked for plumber).

## Still placeholders
Phone 03 5550 0142, address 14 Example Road, email, licence `Lic. 000000` and ABN (marked [demo]), Google review / Maps / Instagram links (`DEMO` style), rating 4.9 from 212 reviews (labelled "Demo number"), prices, team names, the sample reviews (labelled sample), stock photos.

## Not sure about / skipped
- Style references: wilsonplumbingbendigo.com and silverwaterplumbing.com.au were read from screenshots; their words, photos and numbers are not used.
- The hero has two buttons (Call now and Get a free quote) because a plumber site is phone-first; Call now is the one big filled button.
- The contact section can load a Google Maps frame only after the visitor presses a button (an existing, opt-in feature); nothing external loads by itself.
- Real SMS/email sending and real call-back handling are deliberately not connected.
