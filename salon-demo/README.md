# Maison Lune: website guide

This is an **unofficial concept demo** of a hair and beauty salon website. Every business detail (name, address, phone, prices, stylists, reviews) is invented and labelled as such. This guide is in two parts: **the owner's guide** (plain English, no coding) and **notes for developers** at the bottom.

---

## 0. Launch checklist: replace every placeholder before going live

Work down this list. Each item says where to change it. All the "site.config.json" items are in the **one file** described in section 1.

- [ ] **Business name**: `site.config.json` > `brand` > `name`, `short`, `tagline`, `description`. Also the page titles in `pages`. (The logo mark is a crescent moon, `img/icon.svg`; ask your developer to swap it.)
- [ ] **Phone number**: `contact` > `phone` (currently the fake `03 5550 0188`). Every link, the sticky Call button, the footer, the search-engine data and the "call us" fallback messages follow it automatically.
- [ ] **Email**: `contact` > `email` (currently `hello@maisonlune.example`).
- [ ] **Street address, suburb, postcode**: `contact` > `street`, `locality`, `suburb`, `postcode` (currently `21 Example Street`).
- [ ] **ABN**: `contact` > `abn` (currently a placeholder).
- [ ] **Opening hours**: `hours` (section 3).
- [ ] **Services and prices**: `services` (section 4). All 22 are invented.
- [ ] **Stylists**: `stylists` (section 5). The four names are invented. Their photos are stock photos: swap them (section 9).
- [ ] **Reviews**: `data/reviews.json`. They are labelled "Sample content". Replace with real reviews you have permission to use, then change the heading in `tools/templates/sections/reviews.html`.
- [ ] **FAQ answers** (cancellation time, patch tests, payment): `data/faq.json`.
- [ ] **Social links**: `social` (they currently point to the Instagram, Facebook and TikTok home pages).
- [ ] **Photos**: replace the Unsplash stock photos with your own (section 9) and update the credit line. Unsplash photos need no credit by licence, but the site shows "Photos from Unsplash" while they are in use.
- [ ] **Booking and enquiry forms**: paste a form address into `forms` > `endpoint` (section 8) so bookings and gift-voucher requests reach you. Until then both forms are demos that send nothing, and say so.
- [ ] **Remove the "concept demo" wording**: `brand` > `demoNotice` and `demoFooter`, the "Sample content" labels, the wording in `README`, the footer line "Photos are stock images used for this concept demo" in `tools/templates/layout.html`.
- [ ] **Let Google find the site**: `site` > `noindex` from `true` to `false`, and `site` > `baseUrl` to your real web address (ending in `/`).
- [ ] **Privacy policy**: read `tools/templates/pages/privacy.html` and check it matches what you actually do (for example if you add analytics).
- [ ] **Share picture** (shown when the link is posted on Facebook or in a text): `node tools/make-assets.mjs` regenerates `img/og.png` from the hero. Ask your developer, or keep the current one.
- [ ] **Domain name and https**: section 10.

---

## 1. How to change anything: the one file

**Everything about the business is in one file: `site.config.json`.** Prices, phone, address, opening hours, holidays, staff, social links, colours, booking and form settings are all in it. You never edit the website's pages by hand: the website rebuilds itself from this file.

### Editing on GitHub (no software needed)
1. Open the repository on github.com and go to the `salon-demo` folder, then click `site.config.json`.
2. Click the **pencil** icon (Edit this file).
3. Change the text between the quote marks. Keep the quote marks, commas and brackets exactly as they are.
4. Click **Commit changes** (green button), then **Commit changes** again.
5. Wait about **one to two minutes**. The site rebuilds and publishes itself. Refresh the page (on a phone: pull down to refresh) to see the change.

### If something goes wrong
- Click the **Actions** tab on GitHub. A **green tick** next to your change means it worked. A **red cross** means there is a typo: click it, click the failed step, and read the message in plain English (for example `contact > phone: "12" does not look like an Australian number`). Fix the line and commit again. **Until it is fixed the live site keeps showing the last working version**, so a typo never breaks the site.
- The most common typos: a missing comma at the end of a line, a missing closing quote mark, or a `$` sign in a price (write `85`, not `$85`).
- To undo a change: on the file's page click **History**, open the last good version, click the `...` menu and **Revert**, or ask your developer.
- Use a free checker such as jsonlint.com if you are unsure: paste the whole file in and it points at the mistake.

(Developers can also run `python3 tools/build.py` on their own computer. Same result.)

---

## 2. What updates by itself (nothing to maintain)

| Thing | How it stays right |
| --- | --- |
| Booking calendar | Built each time the page loads, starting from **today in Melbourne** and rolling **90 days** ahead. Past days and past times never show. After closing time, "Today" disappears and "Tomorrow" is the first option. |
| Opening line ("Open now, closes at 7pm", "Opens tomorrow at 9am") | Worked out from the real time in **Melbourne** (including daylight saving), whatever time zone the visitor is in. Handles closed days, holidays, special hours and late nights past midnight. |
| Public holidays | The Victorian public holidays are **calculated in code** every year (Easter, Labour Day, Anzac Day, King's Birthday, Melbourne Cup Day, Christmas and Boxing Day, and the "falls on a weekend" days off). Nothing to update, ever. |
| Holiday banner | The week before a closure, a banner reads, for example, "Closed Friday for Good Friday." |
| Copyright year | Always the current year. |
| Old specials | Disappear on their end date (section 7). |

**One holiday cannot be calculated:** the Friday before the AFL Grand Final (the date is announced each year). Add it as a closure in section 6 when it is announced.

---

## 3. Opening hours

In `site.config.json`, `hours` has one line per day. Times use the 24-hour clock in quote marks. A closed day has `null` (no quote marks).

```
{"day": 2, "name": "Tuesday", "open": "09:00", "close": "19:00"},
{"day": 1, "name": "Monday", "open": null, "close": null},
```
- `day` numbers: 0 = Sunday, 1 = Monday ... 6 = Saturday. Do not change them.
- Different weekend hours: just give Saturday and Sunday their own times.
- Late nights: a close time earlier than the open time means "after midnight". `"open": "18:00", "close": "02:00"` is 6pm to 2am the next morning.
- Half hours work: `"09:30"`.
- The hours table, the "open now" lines, the booking calendar, the footer and the search-engine data all follow this.
- Bookings are in 30-minute steps: `booking` > `slotMinutes`.

---

## 4. Prices and services

`services` has `categories` (the four tabs) and `items`. Each service looks like:
```
{"slug": "womens-cut", "cat": "cut", "name": "Women's cut and style", "from": 85, "min": 60, "desc": "..."}
```
- Change `from` (the price in dollars, numbers only) and `min` (minutes). The price list, the booking drop-down, the booking summary and every "from $" text update.
- To add a service, copy a line, give it a **new unique `slug`** (lower case, dashes) and put it in the right `cat`. To remove one, delete its whole line (and its trailing comma if it is the last one).
- The build stops with a message if two services share a slug or a price is not a number.

---

## 5. Staff

`stylists` has one line per person: `slug`, `name`, `first` (first name), `role`, `speciality`, `bio`, `photo`.
- **Someone joins:** copy a line, give it a new `slug` and details. Their card, their "Book with ..." button and the booking choices appear. Their photo slot is `photo` (for example `"stylist-5"`): add the slot in `data/photos.json` (copy the `stylist-4` entry) and upload the photo (section 9). Until a photo is added they show a neutral panel.
- **Someone leaves:** delete their line. Their card, button and booking option disappear.
- Keep the stylist list to about 4 to 6 people so the cards stay tidy.

---

## 6. Closures and special hours (holidays, staff training, early finish)

Add to `closures` (it starts empty `[]`). Dates are `year-month-day`.
```
"closures": [
  {"date": "2026-12-24", "name": "Christmas Eve", "status": "open", "open": "09:00", "close": "14:00"},
  {"date": "2027-03-05", "name": "AFL Grand Final Friday", "status": "closed"},
  {"date": "2026-11-12", "name": "staff training", "status": "closed"}
]
```
- `"status": "closed"` closes that day (the calendar greys it out and the opening line says so).
- `"status": "open"` with `open` and `close` gives special hours.
- It overrides the weekly hours **and** the public holiday rule for that date.
- The banner appears automatically a week before ("Closed Thursday for staff training.").
- Old entries can stay: past dates are ignored.

**Public holidays default to closed.** To change that, edit `holidays`:
```
"holidays": {"mode": "closed", "overrides": {"Boxing Day": {"status": "open", "open": "10:00", "close": "16:00"}}}
```
`"mode": "normal"` means the salon opens on public holidays as usual. `overrides` lets you choose per holiday by its name (`New Year's Day`, `Australia Day`, `Labour Day`, `Good Friday`, `Easter Saturday`, `Easter Sunday`, `Easter Monday`, `Anzac Day`, `King's Birthday`, `Melbourne Cup Day`, `Christmas Day`, `Boxing Day`).

---

## 7. Specials and news that expire

Add to `notices` (it starts empty `[]`):
```
"notices": [{"text": "Spring special: 15% off all treatments in October.", "start": "2026-10-01", "end": "2026-10-31"}]
```
It shows in a bar at the top of the site from `start` to `end` and **hides itself the day after `end`**. `end` is required (the build refuses a notice that could show forever). `start` is optional.

---

## 8. Making the forms real (so you get the enquiries)

Both forms (booking and gift voucher) are **demos until you add a form address**. A demo says so on screen and sends nothing.
1. Make a free account at **formspree.io** (or a similar service), create a form, and copy its address (it looks like `https://formspree.io/f/abcdwxyz`).
2. Put it in `site.config.json`: `"forms": {"endpoint": "https://formspree.io/f/abcdwxyz", ...}`.
3. Commit. From then on the forms email you each request, the "demo only" notes disappear, and visitors see "Thanks, your request is with us".
- **If sending fails** (no internet, the service is down) the visitor keeps what they typed and sees "Sorry, that did not send. Please call us on [your number]". The technical error is written to the browser console for your developer.
- Spam: each form has a hidden trap field that real people never see; robots that fill it in get a fake "success" and nothing is sent. Two quick clicks send only one request.
- Test it yourself once after you set it up, and check your spam folder.
- "I did not get the enquiry": the visitor sees a confirmation with a reference number, and the number to call. Ask them for the reference, then check the form service's dashboard.
- Prefer your existing online booking system (Fresha, Timely, Setmore ...)? Put its address in `booking` > `externalUrl` and a "Prefer our online booking page? Book there" link appears under the booking form.

---

## 9. Changing a photo

Every photo has a clear name (a "slot"): `hero`, `stylist-1` ... `stylist-4`, `stylist-wash`, `stylist-scissors`, `gallery-1` ... `gallery-8`, `cut-1`, `treatment-1`, `interior-1`, `interior-2`, `products-1`. Add `?slots=1` to the web address (for example `.../salon-demo/?slots=1`) to see the name of every empty slot. The file for each slot is listed in `data/photos.json` (for example `img/photos/hero.webp`).

**Easiest way (developer, or anyone with Python):**
```
python3 tools/add-photo.py ~/Downloads/new-hero.jpg hero --alt "Describe the photo for people who cannot see it" --credit "Photographer / Unsplash"
python3 tools/build.py
```
This crops nothing but resizes, converts to WebP, makes the smaller phone copy (`hero-800.webp`), writes the alt text and credit, and rebuilds the page. Then commit the `img/photos` files and `data/photos.json`.

**Without Python:** on github.com open `salon-demo/img/photos`, click **Add file > Upload files**, and upload a WebP file **with exactly the same name** (for example `hero.webp`), at most 1600 pixels wide and 250 KB. Also upload an 800 pixel wide copy named `hero-800.webp`. Free tools such as squoosh.app do this. Keep the same shape (portrait or landscape) as the old photo. Then edit the `alt` words for it in `data/photos.json`.

Photo rules: only use photos you took or are licensed to use. Every photo needs `alt` text: one sentence saying what is in it. `PHOTO-SLOTS.md` lists each slot's shape and what to show.

---

## 10. Domain name, https and what to do if the site goes down

**How the site is hosted.** The site is a set of plain files on **GitHub Pages** (free hosting). Today it lives at `https://kirithikbala21-jpg.github.io/3D-demo-sites/salon-demo/`. There is no database and no server to maintain.

**Connecting a real domain (for example maisonlune.com.au):**
1. Buy the domain from a registrar (VentraIP, Crazy Domains, GoDaddy, Namecheap). `.com.au` needs an ABN.
2. At the registrar's DNS settings, add the records GitHub lists under **Settings > Pages > Custom domain** (four `A` records for the bare domain and a `CNAME` for `www` pointing at your GitHub user name `.github.io`).
3. On GitHub: **Settings > Pages > Custom domain**, type the domain, Save, then tick **Enforce HTTPS** once it becomes available (can take up to an hour). GitHub provides the https certificate **free and renews it automatically**.
4. Change `site` > `baseUrl` in `site.config.json` to the new address (with `https://` and a final `/`).

**Renewing.** The domain is renewed at the registrar (usually yearly, `.com.au` every 1 to 2 years). Turn on **auto-renew** and keep a working card and email on the account. If you forget, the website disappears when the domain expires, so put the renewal date in your calendar. The hosting itself costs nothing and has no renewal.

**If the site is down or shows an error:**
1. Check githubstatus.com. If GitHub Pages is having an outage, wait: nothing is wrong with your files.
2. Open the site in a private window and on mobile data (rules out your browser and Wi-Fi).
3. **"Not secure" or certificate warning:** GitHub > Settings > Pages: untick **Enforce HTTPS**, save, wait a minute, tick it again. If the domain was just changed this can take up to an hour.
4. **Site shows the old version after an edit:** check the **Actions** tab (section 1). A red cross means a typo in the file. The site updates one to two minutes after a green tick. The page address of every file changes when its contents change, so you should never see an old version after that.
5. **404 on the whole site after changing the domain:** in Settings > Pages confirm the domain and the branch (`main`, root folder).
6. **Domain stopped working:** log in to the registrar and check it has not expired and the DNS records are still the ones from step 2 above.
7. Still stuck: contact your developer with the link to the failed step in the Actions tab.

---

## 11. Privacy, cookies and credits

- The **cookie bar** remembers the visitor's choice so it never comes back (this works even if the browser blocks storage; it will simply ask again). No analytics or tracking is loaded. If you add analytics later, it must only start after the visitor presses Accept: put the snippet in `js/ui.js` where the comment says.
- `privacy.html` is a plain-English policy matching the design and the footer links to it. Review it before launch.
- The footer shows "Photos from Unsplash (concept demo)" while stock photos are used. `CREDITS-TODO.md` lists the photographer names still to record.
- All demo wording ("concept demo", "Sample content") is deliberate until the real owner's details are filled in (checklist in section 0).

---
---

# Notes for developers

## Structure
| Path | What it is |
| --- | --- |
| `site.config.json` | **The owner file**: brand, contact, theme, hours, holidays, closures, notices, booking, forms, vouchers, services, stylists, nav, social, pages. Validated by `tools/build.py` with plain-English errors (phone format, times, dates, duplicate slugs, notices without an end date). |
| `data/*.json` | `reviews`, `faq`, `why`, `jobs` (recent work), `photos` (written by `add-photo.py`) |
| `tools/build.py` | Stdlib-only generator: pages, `sitemap.xml`, `robots.txt`, `site.webmanifest`, JSON-LD (HairSalon + FAQ, special hours from `closures`), `?v=hash` cache busting and an import map. Inlines the 242-byte Lenis CSS. |
| `tools/templates/` | `layout.html`, `pages/` (index, notfound, privacy), `sections/` |
| `tools/add-photo.py` | Resizes to WebP under 250 KB (1600px, 900px for portraits) plus an 800px phone copy used through `srcset` |
| `tools/make-assets.mjs` | PNG icons, `favicon.ico`, `img/og.png` (screenshot of the hero) |
| `js/clock.js` | **Pure** date/time logic (Melbourne time zone via `Intl`, DST-safe, Easter, Victorian holidays, opening status, banners). Unit-tested under Node. |
| `js/util.js`, `status.js`, `notice.js`, `booking.js`, `voucher.js`, `forms.js`, ... | Small modules. `forms.js` = honeypot, double-submit guard, `fetch` to `forms.endpoint`, phone fallback |
| `tests/run.mjs`, `tests/unit.mjs` | Playwright + axe suites, and 52 clock unit checks |
| `.github/workflows/salon-demo-checks.yml` (repo root) | On a push to `main`: rebuilds the pages from `site.config.json`, commits them back (the owner's edit goes live), then runs the tests. On pull requests it fails if the generated pages are stale. Also runs on 1 January so the no-JavaScript year is current. |

Time-zone behaviour: all calendar and status logic uses `site.timezone` (Australia/Melbourne), never the visitor's zone and never a fixed offset. The booking day list starts from Melbourne's today, hides today once nothing can be booked, enforces at least 90 days (`booking.daysAhead`), greys closed days and public holidays, and re-checks the chosen time when the form is submitted.

Caching: `styles.css`, `vendor/lenis*.js` and `js/main.js` carry `?v=<sha1 of the file>`; an import map maps every `./js/x.js` to its versioned URL, so a changed module is fetched fresh and unchanged ones stay cached. Never edit generated `.html`; run `python3 tools/build.py`.

## Tests
```
cd salon-demo
node tests/unit.mjs                                   # clock logic, no browser
export CHROME_PATH=/path/to/chromium
ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf,hardening]
```
`tests/node_modules` must exist (playwright-core + axe-core; a symlink to `../cafe-demo-v2/tests/node_modules` works; it is in the repo `.gitignore`). Pillow is needed for the throwaway photo copies (`tests/make-photo-copy.py`). The tests build a photo-less copy of the site for the neutral-panel checks. The `hardening` suite covers visitor time zones, DST, holidays, banners, expiring notices, config errors, the forms (endpoint, failure fallback, double submit, honeypot), going back in the booking widget, stale-time refusal, cache busting, no-JS banner and landscape phones.

## Lighthouse (mobile, simulated slow 4G, gzip + max-age=600 like GitHub Pages)
Home page: performance 97, accessibility 100, best practices 100, SEO 100 once `noindex` is off (69 while the demo is `noindex`, which is deliberate: the only failing SEO audit is "page is blocked from indexing"). Privacy and 404 pages: performance 93 to 94, accessibility 100, best practices 100.

## No JavaScript
Headline, hours text, all services (tabs become stacked lists, Book buttons are `?service=slug#book` links), phone and email fallback, FAQ, hours table, gallery and reviews all show, plus a banner with the phone number, address and hours. The booking widget, live open line, notices and animations need JavaScript.

## Demo-only things
Business details, stylists, prices and reviews are invented and labelled. With no `forms.endpoint` bookings and vouchers send nothing. The map is an SVG placeholder. Social links are platform home pages. Availability is a deterministic demo (a hash of day + stylist + hour block), not a real diary: a real booking system must replace it before launch.
