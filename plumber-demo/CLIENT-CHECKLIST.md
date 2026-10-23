# From demo to a real client site

## Content
- [ ] Replace name, address, phone, email, ABN, licence, hours, time zone and map query in `site.config.json`.
- [ ] Replace `services`, `pricing`, `suburbs` (with honest ETAs) and `team` in `site.config.json`, and `data/jobs.json`, `data/faq.json` with real content. Keep prices consistent: service cards and linked table rows share one source.
- [ ] Replace the invented reviews with real, permitted ones, or remove the section. Remove "Sample reviews. Fictional." and the invented 4.9 / 212 summary (`reviewsSummary`). Never show a rating you cannot back up.
- [ ] Remove the "Concept demo" and "Demo website by KB Ventures" lines and the "Demo form" notes.
- [ ] Add real photos (`PHOTO-SLOTS.md`): van, team, before/after jobs. Confirm rights for every photo and person shown. Fill in `CREDITS-TODO.md`.
- [ ] Check the copy still matches the business: response times (60 minutes, 30 to 60 minute ETAs), 15-minute callback, 12-month guarantee, insurer and payment answers, weekend hours.

## Make it work for real
- [ ] **Quote form:** set `form.endpoint` (see README). Decide who receives requests and who answers within 15 minutes. Photo upload needs a file-capable service.
- [ ] **Availability pill:** it only reads the clock. Confirm the business really answers in those hours and can arrive within the stated time.
- [ ] **Phone and emergency line:** test the number on a real phone; make sure the after-hours line really is answered 24/7.
- [ ] **Map:** put the real address in `contact.mapsQuery`.
- [ ] **Analytics:** add a snippet in `js/ui.js` (runs only after Accept).

## Legal and trust
- [ ] Replace `privacy.html` with a policy written for the business. Show the real licence number and ABN. Check licensing and advertising rules for plumbers and gas fitters in the state, and the insurance wording.

## Launch
- [ ] Set `site.noindex` to `false` and `site.baseUrl` to the real address, run `python3 tools/build.py` and `node tools/make-assets.mjs`.
- [ ] Point the client's domain at the site (GitHub Pages custom domain or other host, HTTPS on).
- [ ] Run the tests (`ROOT=$PWD node tests/run.mjs`) and Lighthouse; check on a real iPhone and Android phone.
- [ ] Submit `sitemap.xml` in Search Console and set up the Google Business Profile.

## Growth features (reviews, QR, rating badge, social links, reminders, call-back)
- [ ] `googleReviewUrl`: the real Google review link (then print the QR page for the counter).
- [ ] `googleMapsUrl`, `instagramUrl`, `facebookUrl`: the real links (empty = hidden).
- [ ] `googleRating` and `googleReviewCount`: the REAL numbers from Google. Never invent a rating. Remove the "Demo number" note in `tools/build.py` > `rating_badge()`.
- [ ] Reminders and call-backs only work once an email or SMS service is connected (README section 12). Until then keep the demo wording, or set `remindersEnabled` / `waitlistEnabled` to `false` to hide them.
