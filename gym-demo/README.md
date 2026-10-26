# Iron & Ember Athletic Club: website guide

This is an **unofficial concept demo** of a gym website (a fictional business: name, address, phone, prices, coaches and numbers are all invented and labelled as such). This guide has two parts: **the owner's guide** (plain English, no coding) and **notes for developers** further down.

---

## 0. Launch checklist: replace every placeholder before going live

Everything marked `site.config.json` is in the **one file** described in section 1.

- [ ] **Business name**: `site.config.json` > `brand` (`name`, `fullName`, `wordmark`, `short`, `city`, `tagline`, `description`) and the page titles in `pages`. The header wordmark "Iron & Ember" is in `tools/templates/layout.html` (ask your developer).
- [ ] **Phone**: `contact` > `phone` (currently the fake `07 5550 0188`). Every link, the sticky Call button, the footer, search-engine data and the "call us" fallback messages follow it automatically.
- [ ] **Email**: `contact` > `email` (currently `hello@example.com`).
- [ ] **Street address and suburb**: `contact` > `street`, `locality`, `postcode`, and `contact` > `mapsQuery` (drives the map).
- [ ] **Opening hours and time zone**: `hours` and `site` > `timezone` (section 3).
- [ ] **Memberships and prices**: `plans` (section 4). All invented.
- [ ] **Class timetable**: `classes` (section 5).
- [ ] **Coaches**: `coaches` (section 6). The four coaches are invented; their photos are stock photos.
- [ ] **The numbers** ("14 years", "3,200 members", "32 classes") and the **sample quote**: `tools/templates/sections/results.html`. Replace with real, permitted ones or delete the block.
- [ ] **FAQ, plan FAQ, journal, careers**: `data/faq.json`, `data/planfaq.json`, `data/journal.json`, `data/careers.json`.
- [ ] **Photos**: replace the stock photos with your own (section 9) and update the credit line.
- [ ] **Booking and enquiry forms**: paste a form address into `forms` > `endpoint` (section 8) so trial bookings, visit requests, gift vouchers, newsletter sign-ups and job applications reach you. Until then every form is a demo and says so.
- [ ] **Google links, rating and QR**: set `googleReviewUrl`, `googleMapsUrl`, `instagramUrl` (and `facebookUrl` if you have one) to your real addresses, and `googleRating` / `googleReviewCount` to the REAL numbers from Google (then `googleRatingIsDemo` to `false`). Print the QR from `reviews.html`. Fill the `busyness` table with your real typical pattern (section 12).
- [ ] **Remove the "concept demo" wording**: `brand` > `demoFooter`, the "Sample ..." notes in the templates, and "Demo website by KB Ventures" in `tools/templates/layout.html`.
- [ ] **Let Google find the site**: `site` > `noindex` from `true` to `false` and `site` > `baseUrl` to your real address (ending in `/`).
- [ ] **Privacy, terms and cookies**: `legal.html` (template in `tools/templates/pages/legal.html`) is a plain template. Have it checked for your business, add your ABN, health and injury waiver wording.
- [ ] **Share picture** (shown when the link is posted on Facebook or in a text): `node tools/make-assets.mjs` regenerates `img/og.png`. Ask your developer.
- [ ] **Domain name and https**: section 10.

---

## 1. How to change anything: the one file

**Everything about the business is in one file: `site.config.json`.** Prices, phone, address, hours, holidays, coaches, class timetable, colours and booking and form settings are all in it. You never edit the website's pages by hand: the site rebuilds itself from this file.

### Editing on GitHub (no software needed)
1. Open the repository on github.com, go to the `gym-demo` folder and click `site.config.json`.
2. Click the **pencil** icon (Edit this file).
3. Change the text between the quote marks. Keep the quote marks, commas and brackets exactly as they are.
4. Click **Commit changes** (green button), then **Commit changes** again.
5. Wait about **one to two minutes**. The site rebuilds and publishes itself. Refresh the page (on a phone: pull down) to see the change.

### If something goes wrong
- Click the **Actions** tab on GitHub. A **green tick** next to your change means it worked. A **red cross** means a typo: click it, click the failed step and read the plain-English message (for example `contact > phone: "12" does not look like an Australian number`). Fix the line and commit again. **Until it is fixed the live site keeps showing the last working version**, so a typo never breaks the site.
- Common typos: a missing comma at the end of a line, a missing closing quote mark, or a `$` sign in a price (write `89`, not `$89`).
- To undo a change: on the file's page click **History**, open the last good version and revert it, or ask your developer.
- jsonlint.com will point at the mistake if you paste the whole file in.

(Developers can also run `python3 tools/build.py` on their own computer. Same result.)

---

## 2. What updates by itself (nothing to maintain)

| Thing | How it stays right |
| --- | --- |
| Free trial and class booking calendar | Starts from **today in Brisbane** every time the page loads and always reaches at least **90 days** ahead. Past days and past times never show. After the last start time, today has nothing left to book. Public holidays and closures are greyed out. |
| "Open now, closes at 10pm" / "Opens tomorrow at 5am" | Worked out from the real time in **Brisbane** (the time zone in `site` > `timezone`), whatever time zone the visitor is in. Handles closed days, holidays, special hours and late nights past midnight. |
| Public holidays | The Queensland public holidays are **calculated in code** every year (Easter, Labour Day, Anzac Day, King's Birthday, Christmas, Boxing Day, and the "falls on a weekend" days off). Nothing to update, ever. |
| Holiday banner | The week before a change, a banner reads, for example, "Open Friday for Good Friday, 7am to 1pm." |
| Class timetable "today" tab | Opens on today's classes in Brisbane time. |
| Copyright year | Always the current year. |
| Old specials | Disappear on their end date (section 7). |

**Two holidays cannot be calculated:** the Royal Queensland Show day ("Ekka" Wednesday in Brisbane) is announced each year; add it as a closure (section 6b) when it is. If your gym is in Victoria instead, set `holidays` > `region` to `"VIC"`.

---

## 3. Opening hours

In `site.config.json`, `hours` has one line per day. Times use the 24-hour clock in quote marks.
```
{"day": 1, "name": "Monday", "open": "05:00", "close": "22:00"},
```
- `day` numbers: 0 = Sunday, 1 = Monday ... 6 = Saturday. Do not change them.
- Different weekend hours: give Saturday and Sunday their own times.
- Late nights: a close time earlier than the open time means "after midnight" (`"open": "18:00", "close": "02:00"` is 6pm to 2am the next morning).
- Half hours work: `"05:30"`. A closed day uses `null` with no quote marks.
- The hours tables, the "open now" chip, the footer, the trial booking times and the search-engine data all follow this.

---

## 4. Memberships and prices

`plans` has one line per membership: `monthly` (price per month, paid monthly) and `annual` (per month when billed annually), both numbers only, no `$`.
- The "save X%" badges and annual totals are worked out for you.
- The wording "from $79" in page descriptions and in `searchExtra` is plain text: search for it in `site.config.json` and update it too.
- Day pass and gift voucher amounts: `tools/templates/sections/gift-cards.html`.

---

## 5. Class timetable

`classes` has one line per class: `id` (unique, for example `tue-1730-power-hour`), `day` (`mon` ... `sun`), `start` (`"17:30"`), `mins`, `name`, `type`, `coach` (a coach `id`), `level`, `capacity`, `desc`.
- **Add a class:** copy a line, give it a new unique `id`, and edit it. **Remove a class:** delete its whole line.
- The build stops with a message if two classes share an `id` or a class names a coach who is not listed.
- "Spots left" numbers are a demo: a real booking system must supply them before launch.

---

## 6. Coaches, and closures

**Coaches** (`coaches`): one line per person (`id`, `name`, `role`, `bio`, `tags`, `photo`). A coach who leaves: delete their line, and move or delete their classes. A coach who joins: copy a line, add a photo slot (section 9).

### 6b. Closures and special hours (holidays, refits, early finish)
Add to `closures` (it starts empty `[]`). Dates are `year-month-day`.
```
"closures": [
  {"date": "2026-12-24", "name": "Christmas Eve", "status": "open", "open": "05:00", "close": "14:00"},
  {"date": "2026-11-12", "name": "floor refit", "status": "closed"}
]
```
- `"status": "closed"` closes the day (the booking calendar greys it out and the "open now" chip says why).
- `"status": "open"` with `open` and `close` gives special hours.
- It overrides the weekly hours **and** the public-holiday rule for that date. Past entries are ignored.

**Public holidays:** `holidays` > `mode` is `"normal"` (the gym is open as usual) or `"closed"`. `overrides` sets a particular holiday by name, for example `"Christmas Day": {"status": "closed"}` or `"Good Friday": {"status": "open", "open": "07:00", "close": "13:00"}`. Names: `New Year's Day`, `Australia Day`, `Good Friday`, `Easter Saturday`, `Easter Sunday`, `Easter Monday`, `Anzac Day`, `Labour Day`, `King's Birthday`, `Christmas Day`, `Boxing Day`.

---

## 7. Specials and news that expire

Add to `notices` (starts empty `[]`):
```
"notices": [{"text": "Spring challenge: sign up at the front desk.", "start": "2026-10-01", "end": "2026-10-31"}]
```
It shows in a bar at the top of every page from `start` to `end` and **hides itself the day after `end`**. `end` is required (the build refuses a notice that could show forever). The permanent bar "First week free. No lock-in." is `announcement` in the same file. The journal articles have no dates, so they never look out of date.

---

## 8. Making the forms real (so you get the enquiries)

All five forms (free trial and class booking, Schedule a visit, gift voucher, newsletter, job applications) are **demos until you add a form address**. A demo says so on screen and sends nothing.
1. Make a free account at **formspree.io** (or a similar service), create a form and copy its address (it looks like `https://formspree.io/f/abcdwxyz`).
2. Put it in `site.config.json`: `"forms": {"endpoint": "https://formspree.io/f/abcdwxyz", ...}`.
3. Commit. From then on the forms email you each request, the "demo only" notes disappear, and visitors see "Thanks, your request is with us".
- **If sending fails** the visitor keeps what they typed and sees "Sorry, that did not send. Please call us on [your number]". The technical error is written to the browser console for your developer.
- **Spam:** each form has a hidden trap field real people never see; robots that fill it in get a fake "success" and nothing is sent. Two quick clicks send only one request.
- **Required fields:** the Schedule a visit form needs name, an Australian phone number, a day and a time of day; the trial form needs a date, a time, a name and a phone number. Wrong phone formats are explained in plain words.
- Test each form once after setting it up, and check your spam folder.
- "I did not get the enquiry": the visitor sees a confirmation (trial bookings include a reference). Ask them for it, then check the form service's dashboard.

---

## 9. Changing a photo

Every photo has a clear name (a "slot"): `hero`, `studio`, `banner`, `coaching`, `gallery-1` ... `gallery-7`, `coach-1` ... `coach-4`. The file for each slot is listed in `data/photos.json` (for example `img/photos/hero.webp`). `PHOTO-SLOTS.md` lists each slot's shape and what to show.

**Easiest way (developer, or anyone with Python):**
```
python3 tools/add-photo.py ~/Downloads/new-hero.jpg hero --alt "Describe the photo for people who cannot see it" --credit "Photographer / Unsplash"
python3 tools/build.py
```
This resizes, converts to WebP under 250 KB, writes the alt text and credit and rebuilds the page. Then commit the `img/photos` files and `data/photos.json`.

**Without Python:** on github.com open `gym-demo/img/photos`, click **Add file > Upload files** and upload a WebP file with **exactly the same name** (for example `hero.webp`), at most 1600 pixels wide and 250 KB (squoosh.app does this). Keep the same shape as the old photo, then edit its `alt` words in `data/photos.json`.

Only use photos you took or are licensed to use. Every photo needs `alt` text: one sentence saying what is in it.

---

## 10. Domain name, https and what to do if the site goes down

**How the site is hosted.** The site is a set of plain files on **GitHub Pages** (free hosting), today at `https://kirithikbala21-jpg.github.io/3D-demo-sites/gym-demo/`. There is no database and no server to maintain.

**Connecting a real domain (for example ironandember.com.au):**
1. Buy the domain from a registrar (VentraIP, Crazy Domains, GoDaddy, Namecheap). `.com.au` needs an ABN.
2. At the registrar's DNS settings add the records GitHub lists under **Settings > Pages > Custom domain** (four `A` records for the bare domain and a `CNAME` for `www` pointing at your GitHub user name `.github.io`).
3. On GitHub: **Settings > Pages > Custom domain**, type the domain, Save, then tick **Enforce HTTPS** when it becomes available (up to an hour). GitHub provides the https certificate **free and renews it automatically**.
4. Change `site` > `baseUrl` in `site.config.json` to the new address (with `https://` and a final `/`).

**Renewing.** The domain is renewed at the registrar (usually yearly; `.com.au` every 1 to 2 years). Turn on **auto-renew**, keep a working card and email on the account, and put the renewal date in your calendar. If it lapses the website disappears. Hosting itself costs nothing and never needs renewing.

**If the site is down or shows an error:**
1. Check githubstatus.com. If GitHub Pages is having an outage, wait: nothing is wrong with your files.
2. Open the site in a private window and on mobile data (rules out your browser and Wi-Fi).
3. **"Not secure" or certificate warning:** GitHub > Settings > Pages: untick **Enforce HTTPS**, save, wait a minute, tick it again (can take up to an hour after a domain change).
4. **Old version after an edit:** check the **Actions** tab (section 1). A red cross means a typo in the file. A green tick means it appears within two minutes (every page file carries a version tag, so you should never see a stale copy).
5. **404 on the whole site after changing the domain:** in Settings > Pages confirm the domain and the branch (`main`, root folder).
6. **Domain stopped working:** log in to the registrar and check it has not expired and the DNS records are still the ones from step 2.
7. Still stuck: contact your developer with the link to the failed step in the Actions tab.

---

## 11. Privacy, cookies and credits

- The **cookie card** remembers the visitor's choice so it does not come back (if the browser blocks storage it simply asks again). No analytics or tracking runs before the visitor presses Accept. If you add analytics, put the snippet in `js/ui.js` where the comment says.
- `legal.html` holds the privacy policy, terms and cookie notice; the footer links to it. Review it before launch.
- The footer credits the photographer line from `data/photos.json`. `CREDITS-TODO.md` lists the photographer names still to record.
- All demo wording ("Concept demo", "Sample ...") is deliberate until the real owner's details are filled in (checklist in section 0).

## 12. Reviews, links, reminders, waitlist, busy times (feature list and how to fill site.config.json)

All of these are switched on or off, and filled in, in `site.config.json`. **An empty value or a switched-off feature hides that feature completely** (no empty box, no broken link). Everything is a front-end demo: nothing is sent anywhere, and no live data is ever shown.

| Feature | Where it shows | Config keys (top level of `site.config.json`) |
| --- | --- | --- |
| **Google review button + QR** | Footer button, a "Loved your visit? Tell us" section on the home page, and `reviews.html` with a large QR ("Scan to leave a review") and a **Print this** button (printing shows only the heading and the QR) | `googleReviewUrl` (your real Google review link; empty hides the page, the section and the button) |
| **Google Maps / Instagram / Facebook links** | Icon links in the footer, "Get directions" in the hero, "Find us on Google Maps" and "Follow us on Instagram" buttons on the Visit page and the home Visit section | `googleMapsUrl`, `instagramUrl`, `facebookUrl` (empty hides each one) |
| **Google rating badge** | "Rated 4.8 on Google · 120 reviews" with SVG stars, in the hero and the footer | `googleRating` (0 to 5), `googleReviewCount`, `googleMapsUrl`. **Use the business's REAL rating and review count. Never invent one.** The badge shows a "Demo number" note while `googleRatingIsDemo` is `true`; set it to `false` once the numbers are real. Missing rating, count or Maps link hides the badge. |
| **Remind me** | Optional None / Email / Text choice on the free trial / class booking form and on "Schedule a visit". The confirmation says "Reminder set for the day before, 9am" and shows a **preview** of the message. | `remindersEnabled`, `reminderLeadHours` (24 = the day before at 9am) |
| **Waitlist** | "Join waitlist" on full times in the trial/class booking calendar, and "Join the waitlist" on full classes in the timetable | `waitlistEnabled` |
| **Best time to come** | A line such as "Usually quieter on Thursday at midday." and a 7-day chart (today outlined) on the Visit page, the home Visit section and the booking page | `busynessEnabled`, `busyness` (see below). Always worded "usually" / "typically": never live. |
| **Open-hours strip** | "Open now, closes at 10pm" / "Closed now. Opens tomorrow at 5am" at the top of every page, in Brisbane time | `openBannerEnabled` (hours come from `hours`, `holidays`, `closures`) |

**Busy times table.** `busyness.blocks` lists the time blocks (`label`, `from`, `to`); `busyness.week` has one line per day (`mon` ... `sun`) with one level per block: `"quiet"`, `"medium"`, `"busy"` or `"closed"`. Fill it from what you actually see on the floor. Empty table = the whole feature is hidden.

**Sending is not connected.** The reminder choice, the waitlist and the call-back entries are only kept in this browser (`localStorage`: `vc-bookings`, `vc-visits`, `waitlist`). To make them real, plug an email or SMS service in where each form is handled: look for `reminder.read()` in `js/trial.js` and `js/forms.js` (send `{ mode, contact }` per customer), and `onJoin` in `js/waitlist.js` / `js/classes.js` / `js/trial.js`. Until then the confirmations say plainly that no reminder is actually sent.

**QR code.** It is drawn in the browser by `js/qr.js` (no library, no network). To print for the counter: open `reviews.html`, press **Print this**.

**Hero.** The headline is factual and names the suburb (`brand.city`). One big main button, a tap-to-call link and "Get directions", opening hours and the starting membership price (the cheapest plan's monthly price) are all in the hero and all come from `site.config.json`. The photo, barbell and text drift a few pixels on scroll; with "reduce motion" switched on the hero stays perfectly still.

---
---

# Notes for developers

## Structure
| Path | What it is |
| --- | --- |
| `site.config.json` | **The owner file**: brand, contact, theme, hours, holidays, closures, notices, booking, forms, plans, coaches, classes, nav, pages, search extras, announcement. Validated by `tools/build.py` with plain-English errors. |
| `data/*.json` | `faq`, `planfaq`, `journal`, `careers`, `photos` |
| `tools/build.py` | Stdlib-only generator: pages, `search-data.js`, `sitemap.xml`, `robots.txt`, `site.webmanifest`, JSON-LD, `?v=hash` cache busting and one import map (modules plus the Three.js entries) |
| `js/clock.js` | **Pure** date/time logic (time zone via `Intl`, Easter, Queensland and Victorian public holidays, opening status, banners). Unit-tested under Node (`tests/unit.mjs`, 37 checks) |
| `js/formtools.js` | Australian phone check, honeypot, double-submit guard, `fetch` to `forms.endpoint`, phone fallback |
| `js/forms.js`, `trial.js`, `ui.js`, `notice.js`, `util.js` | Visit form and other forms, trial booking calendar, open-now chip and year, notice bar, shared helpers |
| `.github/workflows/gym-demo-checks.yml` (repo root) | On a push to `main`: rebuilds the pages from `site.config.json`, commits them back (the owner's edit goes live), then runs the unit and browser tests. On pull requests it fails if the generated pages are stale. Also runs on 1 January. |

Time-zone behaviour: all calendar and status logic uses `site.timezone` (Australia/Brisbane, no daylight saving, but the code handles zones that have it), never the visitor's zone. The trial calendar starts at the gym's today, reaches `booking.daysAhead` (at least 90) days, disables closed days and public holidays, hides passed times and re-checks the chosen time on submit.

Caching: `styles.css`, `vendor/lenis*`, `main.js` and every module under `js/` (plus `scene.js`, `search-data.js`) carry `?v=<sha1>` via the page links and the import map. Never edit generated `.html`; run `python3 tools/build.py`.

## Tests
```
cd gym-demo
node tests/unit.mjs
export CHROME_PATH=/path/to/chromium
ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf,hardening,growth]
```
The `hardening` suite covers visitor time zones, holidays and banners, expiring notices, config errors, the 90-day calendar, the visit form (required fields, Australian phones, on `index.html` and `visit.html`), endpoint failure and success, double submit, the honeypot, cache busting, the no-JavaScript banner and landscape phones.

## Hero background and video
The hero background is the `hero` photo slot with a slow zoom. To use a looping video instead, set `"hero": {"video": "img/hero.mp4", "poster": "img/photos/hero.webp"}` in `site.config.json` and rebuild; a muted, looping, inline `<video>` layer is added on top of the still. Reduced-motion visitors get the still image (video paused, no zoom).

## How the 3D hero and its fallbacks work
`scene.js` builds a small barbell in code: a chrome bar with knurled grips, bevelled black rubber plates with thin yellow rings, yellow collars, rim lights, drifting chalk dust and chrome reflections from a RoomEnvironment built after the first frame. It rolls slowly, tilts toward the mouse, spins up when clicked or dragged, caps pixel ratio at 1.5, pauses off-screen or in a hidden tab, and steps quality down on slow devices. It starts after the window load event, browser idle and the intro (under 1.5 s).

The page always contains an inline SVG barbell poster. `js/hero.js` keeps it (and skips 3D) if WebGL is unavailable, the library fails, the context is lost, loading takes more than 4 seconds, Data Saver is on, or on a low-powered phone (screen or window 480px or narrower AND 4 or fewer cores or 4 GB or less memory). `?3d=on` forces 3D for testing. Reduced-motion visitors get a still frame and no smooth scroll.

## What is demo-only
The trial and visit forms, newsletter, careers and gift voucher forms validate in the browser and show a confirmation; with no `forms.endpoint` set in `site.config.json` nothing is sent. Bookings and visit requests are kept in this browser only (`vc-bookings`, `vc-visits`). See `CLIENT-CHECKLIST.md`.

## Design system notes
- **Type:** two families (Barlow Condensed 600/700 uppercase headings, Montserrat text). Heading scale 56 / 40 / 28 / 20 px on desktop, fluid to about 36 / 30 / 24 / 19 px on a phone. The home hero headline is display type (`--fs-display`), larger than the scale. Spacing is an 8px scale (`--space-1` to `--space-20`); sections have 96px (mobile) / 160px (desktop) padding.
- **Announcement bar:** one static line, dismissible (localStorage `vc-announce`). **Cookie card:** bottom-left, 300px max (`vc-cookie`).
- **404:** `404.html` is built from the `notfound` template with an inline `<base>` for `/gym-demo/`. GitHub Pages only serves the repo-root `404.html`, which must forward missing URLs inside this folder to it.
