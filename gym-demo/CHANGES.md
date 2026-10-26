# Gym demo: changes in the growth upgrade

Everything below is a **front-end demo**. Nothing is sent anywhere and nothing shows fake live data. Brand name and the "concept demo" labels are unchanged.

## What changed

**Pages added:** `reviews.html` (QR + print page). Built from `tools/templates/pages/reviews.html`; listed in `sitemap.xml`; only built when `googleReviewUrl` is set.
**Pages changed:** `index.html` (hero, review section, rating badge, footer, busy times, open strip), `visit.html`, `trial.html`, `classes.html`, `coaches.html`, `membership.html`, `journal.html`, `careers.html`, `legal.html` (open-hours strip and footer links on every page), `404.html`.

1. **Google review button + QR.** Footer button, home "Loved your visit? Tell us" section, `reviews.html` with a large QR drawn in the browser (`js/qr.js`, checked by decoding it with OpenCV in the tests) and a Print button with a print stylesheet that shows only the heading and the QR.
2. **Booking reminders.** Optional None / Email / Text on the trial/class booking form and on "Schedule a visit": email or Australian mobile field appears only when picked and is validated, consent line, confirmation "Reminder set for <day before, 9am>" plus a **preview** of the message ("Preview: Hi Sam, a reminder about your free trial on ... at ... at Iron & Ember Athletic Club."). Sending is not connected (comment in `js/reminder.js`, README line).
3. **Google / Instagram / Facebook links.** Footer icons, "Get directions" in the hero, "Find us on Google Maps" and "Follow us on Instagram" buttons on the Visit page and the home Visit section. New tab, `rel="noopener"`, accessible labels.
5. **Google rating badge** in the hero and footer: SVG stars filled to the rating, links to Google Maps, "Demo number" note while `googleRatingIsDemo` is true.
6. **Waitlist.** Full times in the booking calendar show "Join waitlist" (a few are full in the demo so it can be seen); full classes in the timetable offer "Join the waitlist". Name, phone or email, preferred day/time, consent line, validation, confirmation "You're on the waitlist for <day, time>". Saved only in this browser (`localStorage` key `waitlist`).
7. **Best time to come.** "Usually quieter on ..." line plus a 7-day SVG chart from the `busyness` table, today outlined. Always "usually"/"typically", with "A typical pattern, not live."
8. **Open-hours strip** on every page ("Open now, closes at 10pm"), driven by the hours/holidays/closures in config in Brisbane time.
- **Hero / trust upgrade.** Factual H1 with the suburb, the real gym photo, ONE big main button (Start your free trial), tap-to-call and Get directions visible on every screen size, opening hours and "Memberships from $89 a month" (the cheapest plan) in the hero, a rating badge only from config numbers, three-layer subtle parallax with a reduced-motion fallback (no movement at all), and a darker wash so hero text measures 7:1 or better on the real photo at 390 and 1440px.
- **Fixes found on the way:** a validation message under the reminder field hid itself on blur and moved the Submit button away from a tap, so the first tap missed (the same class of bug as the trial form): the reminder only re-renders when the None/Email/Text choice changes. The waitlist is a `div role="group"` with a button, not a nested form, because on the trial page it sits inside the booking form.
- Config validation (plain-English messages) for the new keys; `site.config.json`, README (feature list + config reference), tests (`growth` suite, 75 checks) and `legal.html` (reminders and waitlist) updated.

## Placeholders to replace before launch
`googleReviewUrl`, `googleMapsUrl`, `instagramUrl` (demo addresses), `facebookUrl` (empty), `googleRating` / `googleReviewCount` (**demo numbers**: use the real ones from Google), the `busyness` table (typical pattern guessed for the demo), the invented address, phone number, email and the sample content already listed in the README checklist.

## Doubts / not done
- Real sending of reminders and real saving of waitlist entries are not connected (by design): they need an email/SMS or form service.
- The busy-times table is the owner's own estimate; it is not measured and never live.
- No click and collect (not part of the gym brief). Facebook link is empty so it is hidden.
- The rating badge is shown on the demo with a "Demo number" note; with real numbers set `googleRatingIsDemo` to `false`.
- Only Chromium was available for testing; Safari and Firefox were not tested.
