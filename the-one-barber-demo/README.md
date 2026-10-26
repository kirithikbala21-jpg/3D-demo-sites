# The One Barber: website guide (unofficial concept demo)

This is an **unofficial concept demo** by KB Ventures. It is not run by The One Barber. Real details are listed in `brand.md`; everything else is a clearly marked placeholder.

Live: https://kirithikbala21-jpg.github.io/3D-demo-sites/the-one-barber-demo/

## Launch checklist (replace every placeholder)
All items are in the one file `site.config.json`. Edit it on github.com; the pages rebuild by themselves about a minute after "Commit changes". A typo makes the build fail with a plain-English message.
- [ ] **Prices**: `services` > each item's `price` (a number, e.g. 35). `null` shows `[price]`. Set the combo price too.
- [ ] **Barber / owner**: `staff` (name, role, bio, photo). The "Meet your barber" card and "Book with him" button use it.
- [ ] **Shop photos and logo**: `shopPhotos` and the `img/` folder.
- [ ] **Google review link**: `googleReviewUrl` (the shop's own "write a review" link). Check `googleRating` (5.0) and `googleReviewCount` (30) are still current.
- [ ] **Instagram / Facebook**: `instagramUrl`, `facebookUrl` (blank = hidden).
- [ ] **Booking policy**: `policy` (cancellation text).
- [ ] **Email**: `contact` > `email` (blank = hidden).
- [ ] **Confirm the Google-summary lines** (payments, kids, parking, "known for fades"): see `brand.md`.
- [ ] **Review quotes**: `googleReviewQuotes` (exact words from real Google reviews only).
- [ ] **Busy-times pattern** (`busyness`): set from real experience, or switch off with `busynessEnabled: false`.
- [ ] **Chinese text**: have a Chinese speaker check the table in `CHANGES.md`.
- [ ] Remove the "concept demo" labels, `noindex`, and `demoFooter` only when the real owner takes the site over.
- [ ] Make forms real: bookings, waitlist and reminders are saved only in the visitor's browser (keys starting `tob-`). Nothing is sent. Connect an online booking system and an email/SMS service where `js/forms.js` says "DEMO ONLY".

## Feature switches (in `site.config.json`)
`remindersEnabled`, `reminderLeadHours`, `waitlistEnabled`, `busynessEnabled`, `openBannerEnabled`. A switched-off or blank feature is hidden completely.

## Hours and holidays
`hours` (Tuesday has `null` times = closed), `site.timezone` Australia/Melbourne, `site.region` VIC. Victorian public holidays are worked out in code; add one-off closures to `closures`.

## Build and test
```
python3 tools/build.py             # rebuilds the HTML from site.config.json and the templates
cd tests && npm i && node unit.mjs && node run.mjs
```
Set `CHROME_PATH` if Chromium is already installed. Tests check overflow (360 to 1920px), accessibility in English and 中文, real facts, no competitor names, booking, manage, waitlist, QR decode, print view and the open-hours banner with a fake clock.
