# Waverley Plumbing & Gas: website guide

This is an **unofficial concept demo** of a family plumbing business. Every business detail (name, address, phone, ABN, licence, prices, team, reviews) is invented and labelled as such. This guide has two parts: **the owner's guide** (plain English, no coding) and **notes for developers** at the bottom.

---

## 0. Launch checklist: replace every placeholder before going live

All "site.config.json" items are in the **one file** described in section 1.

- [ ] **Business name**: `site.config.json` > `brand` (`name`, `short`, `line1` and `line2` for the two-line logo, `tagline`, `description`, `established`) and the page titles in `pages`.
- [ ] **Phone number**: `contact` > `phone` (currently the invented `03 5550 0142`). Every link, the sticky Call button, the footer, search-engine data and the "call us" fallback messages follow it.
- [ ] **Email, street address, suburb, postcode**: `contact` (currently `hello@example.com`, `14 Example Road`).
- [ ] **ABN and licence number**: `contact` > `abn` and `licence` (currently `00 000 000 000` and `Lic. 000000`). Use your real, current numbers.
- [ ] **Office hours**: `hours` (section 3). The 24/7 emergency line wording assumes you really answer around the clock: change it if you do not.
- [ ] **Services and prices**: `services` and `pricing` (section 4). All prices are invented.
- [ ] **Suburbs you cover and arrival times**: `suburbs` (section 5). Use honest times.
- [ ] **Team**: `team` (section 6). Names, roles and photos are invented.
- [ ] **Reviews**: `data/reviews.json` are invented and labelled "Sample reviews. Fictional." Replace with real reviews you have permission to use, remove that label in `tools/templates/sections/reviews.html`, and replace `reviewsSummary` (rating and count) with real figures. Never show a rating you cannot back up.
- [ ] **FAQ**: `data/faq.json` (prices, hours and the phone number in the answers fill in automatically from the config).
- [ ] **Photos**: replace the stock photos with your own (section 9).
- [ ] **Quote form**: paste a form address into `form` > `endpoint` (section 8). Until then it is a labelled demo that sends nothing.
- [ ] **Remove the "concept demo" wording**: `brand` > `demoNotice` and `demoFooter`, the "Demo form" notes, the "(concept demo)" part of page titles (`tools/build.py` > `fullTitle`).
- [ ] **Let Google find the site**: `site` > `noindex` to `false`, and `site` > `baseUrl` to your real address (ending in `/`).
- [ ] **Privacy policy**: read `privacy.html`'s source (`tools/templates/pages/privacy.html`) and check it matches what you really do.
- [ ] **Share picture** (shown when the link is posted on Facebook or in a text): ask your developer to run `node tools/make-assets.mjs`, or keep the current one.
- [ ] **Domain name and https**: section 10.

---

## 1. How to change anything: the one file

**Everything about the business is in `site.config.json`**: phone, address, hours, holidays, closures, notices, prices, services, suburbs, team, colours and the form address. You never edit the web pages by hand: the website rebuilds itself from this file.

### Editing on GitHub (no software needed)
1. Open the repository on github.com, go to the `plumber-demo` folder and click `site.config.json`.
2. Click the **pencil** icon (Edit this file).
3. Change the text between the quote marks. Keep the quote marks, commas and brackets exactly as they are.
4. Click **Commit changes**, then **Commit changes** again.
5. Wait **one to two minutes**. The site rebuilds and publishes itself. Refresh (on a phone, pull down) to see it.

### If something goes wrong
- Click the **Actions** tab on GitHub. A **green tick** means it worked. A **red cross** means a typo: click it, open the failed step and read the plain-English message (for example `contact > phone: "12" does not look like an Australian number`). Fix the line and commit again. **Until it is fixed the live site keeps showing the last working version**, so a typo never breaks the site.
- Common typos: a missing comma at the end of a line, a missing closing quote, or a `$` in a price (write `149`, not `$149`).
- To undo: open the file's **History**, pick the last good version and **Revert**, or ask your developer.
- jsonlint.com will point at a mistake if you paste the whole file in.

(Developers can also run `python3 tools/build.py`. Same result.)

---

## 2. What updates by itself (nothing to maintain)

| Thing | How it stays right |
| --- | --- |
| "Office open now" and "Plumbers available now" lines | Worked out from the real time in **Melbourne** (daylight saving included), whatever time zone the visitor is in. Handles holidays, closures and late nights. |
| "On call tonight" bar | Shows outside 7am to 6pm **Melbourne time** (`service` > `dayStart` and `dayEnd`), even for a visitor overseas. |
| Public holidays | The Victorian public holidays are **calculated in code** every year (Easter, Labour Day, Anzac Day, King's Birthday, Melbourne Cup Day, Christmas, Boxing Day and weekend substitutes). Nothing to update, ever. |
| Holiday banner | The week before an office closure the site shows, for example, "Office closed Friday for Good Friday. Emergency line open 24/7." |
| Copyright year, "years experience" | Always current. The team uses a start year (`since`), not a fixed number of years. |
| Old specials | Disappear on their end date (section 7). |

The one holiday that cannot be calculated is the Friday before the AFL Grand Final (announced yearly). Add it as a closure when you hear the date.

---

## 3. Office hours

`hours` has one line per day. Times use the 24-hour clock in quote marks; a closed day uses `null` with no quote marks.
```
{"day": 1, "name": "Monday", "open": "07:00", "close": "20:00"},
```
- `day`: 0 = Sunday, 1 = Monday ... 6 = Saturday. Do not change these.
- Different weekend hours: give Saturday and Sunday their own times. Half hours work (`"07:30"`). A close time earlier than the open time means "after midnight".
- The hours table, the "open now" lines, the callback wording ("between 7am and 8pm"), the footer and the search-engine data follow this.
- The emergency line is described as **24/7** in the page text. If you do not answer 24/7, ask your developer to change that wording.

---

## 4. Services and prices

`services` (the six cards) and `pricing` (the price table) are in the config.
```
{"id": "blocked-drains", "name": "Blocked drains", "from": 149, "label": "From", "urgency": "today", ...}
```
- Change `from` (dollars, numbers only; `null` means "Free quote"). The card, the table row, the quote-form drop-down and the FAQ prices all update.
- Table rows with `"ref": "<service id>"` copy that service's price automatically. Rows with their own `"price"` are edited in place.
- To add a table row, copy a `pricing` line and edit it. To remove one, delete its line (and the trailing comma if it was last).
- The build stops with a message if two services share an `id` or a price is not a number.

---

## 5. Suburbs you cover

`suburbs` lists name, postcode and arrival time (`"eta": "30 to 45"` minutes). The suburb checker, the quote form's suggestions and the footer list all follow it. To add a suburb, copy a line. Keep the arrival times honest.

---

## 6. Team

`team` has `name`, `role`, `since` (the year they started, like `2015`), `photo` (slot name) and `bio`. **Someone joins:** copy a line and add their photo slot (copy the `team-5` entry in `data/photos.json`, then upload the photo, section 9). **Someone leaves:** delete their line. Also update `brand` > `plumbers` (the headcount shown on the page).

---

## 7. Closures, special hours and specials that expire

`closures` starts empty. Dates are `year-month-day`.
```
"closures": [
  {"date": "2026-12-24", "name": "Christmas Eve", "status": "open", "open": "07:00", "close": "14:00"},
  {"date": "2026-11-12", "name": "staff training", "status": "closed"}
]
```
`"closed"` closes the **office** that day (the emergency line is still shown as 24/7); `"open"` with times gives special hours. It overrides the weekly hours and holiday rule for that date. The banner appears a week before. Past entries are ignored.

**Public holidays:** `holidays` > `mode` is `"normal"` (office open as usual) or `"closed"` (office closed on public holidays). `overrides` sets hours for a named holiday:
```
"holidays": {"mode": "closed", "overrides": {"Boxing Day": {"status": "open", "open": "09:00", "close": "13:00"}}}
```
Holiday names: `New Year's Day`, `Australia Day`, `Labour Day`, `Good Friday`, `Easter Saturday`, `Easter Sunday`, `Easter Monday`, `Anzac Day`, `King's Birthday`, `Melbourne Cup Day`, `Christmas Day`, `Boxing Day`.

**Specials and news** go in `notices`:
```
"notices": [{"text": "Free safety check with any hot water install this month.", "start": "2026-10-01", "end": "2026-10-31"}]
```
It shows in a bar at the top from `start` to `end` and **hides itself the day after `end`**. `end` is required.

---

## 8. Making the quote form real (so you get the enquiries)

The quote form is a **demo until you add a form address**. A demo says so on screen and sends nothing.
1. Make a free account at **formspree.io** (or Basin, Getform), create a form and copy its address (like `https://formspree.io/f/abcdwxyz`).
2. Put it in `site.config.json`: `"form": {"endpoint": "https://formspree.io/f/abcdwxyz", ...}`.
3. Commit. Requests are emailed to you, the "demo" notes disappear, and visitors see a confirmation. Photos only arrive if your form service accepts file uploads.
- **If sending fails** the visitor keeps what they typed and sees "Sorry, that did not send. Please call us on [your number]". The technical reason is written to the browser console.
- A hidden trap field catches spam robots (they get a fake "success" and nothing is sent). Two quick clicks send one request.
- Test it once after setting it up and check your spam folder. "I did not get the enquiry": the visitor saw a confirmation, so check the form service's dashboard first.

---

## 9. Changing a photo

Every photo has a clear slot name (`hero-plumber-van`, `team-1` ... `team-5`, `plumber-at-work-1`, `hot-water-unit`, `before-after-1-before`, ...). The files are in `img/photos/` and listed in `data/photos.json`. Add `?slots=1` to the web address to see the names of empty slots.

**Easiest (developer, or anyone with Python):**
```
python3 tools/add-photo.py ~/Downloads/new-van.jpg hero-plumber-van --alt "Describe the photo for people who cannot see it" --credit "Photographer / Unsplash"
python3 tools/build.py
```
This resizes, converts to WebP, writes the alt text and credit and rebuilds. Commit `img/photos` and `data/photos.json`.

**Without Python:** on github.com open `plumber-demo/img/photos`, **Add file > Upload files**, and upload a WebP with **exactly the same file name**, at most 1600 pixels wide and 250 KB (squoosh.app does this), then update the `alt` words in `data/photos.json`.

"See the difference" jobs: with both a before and an after photo a slider shows; with only one photo it shows as a plain "Recent job" photo. Rules: only use photos you took or are licensed to use, and every photo needs `alt` text. `PHOTO-SLOTS.md` lists each slot.

---

## 10. Domain name, https and what to do if the site goes down

**Hosting.** The site is plain files on **GitHub Pages** (free). Today: `https://kirithikbala21-jpg.github.io/3D-demo-sites/plumber-demo/`. No database, no server.

**Connecting a real domain (for example waverleyplumbing.com.au):**
1. Buy it from a registrar (VentraIP, Crazy Domains, GoDaddy, Namecheap). `.com.au` needs an ABN.
2. In the registrar's DNS settings add the records GitHub lists under **Settings > Pages > Custom domain** (four `A` records for the bare domain and a `CNAME` for `www`).
3. GitHub: **Settings > Pages > Custom domain**, type the domain, Save, tick **Enforce HTTPS** once available (up to an hour). The https certificate is free and renews itself.
4. Change `site` > `baseUrl` in `site.config.json` to the new address.

**Renewing.** Renew the domain at the registrar (yearly, `.com.au` every 1 to 2 years). Turn on **auto-renew** and keep a working card and email on the account: if it lapses the site disappears. The hosting has no renewal.

**If the site is down or shows an error:**
1. Check githubstatus.com. A GitHub Pages outage just needs waiting.
2. Try a private window and mobile data.
3. **"Not secure" warning:** Settings > Pages: untick **Enforce HTTPS**, save, wait a minute, tick it again.
4. **Old version after an edit:** check the **Actions** tab. A red cross means a typo (section 1).
5. **Whole site 404 after a domain change:** in Settings > Pages confirm the domain and the branch (`main`, root folder).
6. **Domain stopped working:** check at the registrar that it has not expired and the DNS records are still in place.
7. Still stuck: send your developer the link to the failed Actions step.

---

## 11. Privacy, cookies and credits

- The cookie bar remembers the choice (it just asks again if the browser blocks storage). **No analytics or tracking is loaded.** If you add analytics, start it only after the visitor presses Accept (`js/ui.js`, where the comment says).
- `privacy.html` is a plain-English policy matching the design. Review it before launch.
- The footer credits the photographers while stock photos are used (`CREDITS-TODO.md` lists names still to record). "Concept demo" wording is deliberate until the real owner's details are in (checklist, section 0).

---
---

# Notes for developers

| Path | What it is |
| --- | --- |
| `site.config.json` | **The owner file.** Validated by `tools/build.py` with plain-English errors (phone, times, dates, duplicate ids, notices without an end date, bad postcodes). |
| `data/*.json` | `reviews`, `faq` (supports `{phone}`, `{callout}`, `{gasFrom}`, `{weekendHours}`, `{arrive}`), `jobs`, `steps`, `badges`, `happening`, `photos` |
| `tools/build.py` | Stdlib generator: pages, `sitemap.xml`, `robots.txt`, `site.webmanifest`, JSON-LD (Plumber + FAQ, special hours from `closures`), `?v=hash` cache busting and an import map, inlined Lenis CSS |
| `js/clock.js` | Pure Melbourne-time logic (DST-safe, Easter, Victorian holidays, opening status, banners). Unit-tested in Node (`node tests/unit.mjs`). |
| `js/status.js`, `notice.js`, `happening.js`, `quote.js`, `forms.js` | Open-now lines and year, notice bar, picker and after-hours bar (Melbourne 7am to 6pm), quote form, shared form helpers (honeypot, double-submit guard, endpoint, phone fallback) |
| `.github/workflows/plumber-demo-checks.yml` | On a push to `main`: rebuilds pages from the config and commits them (the owner's edit goes live), then runs tests. Pull requests fail if the generated pages are stale. Also runs on 1 January. |

Job tabs ("See the difference"): photos inside the tabs are rendered `loading="eager"` (never lazy, because hidden tabs may never load a lazy image); a tab with one photo renders as a plain photo with a "Recent job" tag and no slider parts.

## Tests
```
cd plumber-demo
node tests/unit.mjs
export CHROME_PATH=/path/to/chromium
ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf,hardening]
```
`tests/node_modules` must exist (playwright-core + axe-core; a symlink to another demo's works). The `hardening` suite covers Melbourne time for overseas visitors, daylight saving, the on-call bar, year, closures, holidays, notices, config errors, the form (endpoint, failure fallback, double submit, honeypot, Australian phone check), cache busting, the no-JavaScript banner, landscape phones and the job tabs.

## No JavaScript
Headline, hours, services, areas list, pricing, jobs (every job shown stacked), reviews, FAQ, contact details and a banner with the phone number, address and hours all show. The suburb checker, quote form, live status and animations need JavaScript.

## Demo-only things
Business details, team, prices and reviews are invented and labelled. With no `form.endpoint` the quote form sends nothing. The "open now" and "plumbers available" lines are the clock against the listed hours, not real dispatch data.
