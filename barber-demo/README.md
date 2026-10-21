# Brass & Blade Barbershop: website guide

This is an **unofficial concept demo** of a barbershop website, with a spinning 3D barber pole. Every business detail (name, address, phone, prices, barbers, reviews) is invented and labelled as such. This guide has two parts: **the owner's guide** (plain English, no coding) and **notes for developers** at the bottom.

---

## 0. Launch checklist: replace every placeholder before going live

All the `site.config.json` items are in the **one file** described in section 1.

- [ ] **Business name**: `brand` > `name`, `nameHtml`, `fullName`, `fullNameHtml`, `wordmark`, `tagline`, `description`, and the page titles in `pages`. Also `brand` > `established` (the year you opened; it drives "Est." and "years in the same shop").
- [ ] **Phone number**: `contact` > `phone` (currently the fake `02 5550 0144`). Every link, the sticky Call button, the footer, the search-engine data and every "call us" message follow it automatically.
- [ ] **Email**: `contact` > `email` (currently `hello@brassandblade.example`).
- [ ] **Street address, suburb, postcode, map**: `contact` > `street`, `locality`, `postcode`, `mapsQuery` (what the map and "Open in Google Maps" show), `lat`, `lon`. The map currently shows Central Station.
- [ ] **Opening hours and time zone**: `hours` (section 3), `site` > `timezone`, `region` (`"NSW"` or `"VIC"`, decides the public holidays).
- [ ] **Services and prices**: `services` (section 4). All 24 are invented.
- [ ] **Shop products and delivery**: `products`, `shop` > `deliveryFee`, `freeOver`.
- [ ] **Memberships and gift cards**: `memberships`, `giftCards` > `amounts`.
- [ ] **The crew**: `staff` (section 5). The four names are invented. Their photos are stock photos: swap them (section 9).
- [ ] **Reviews**: `tools/templates/sections/reviews.html`. They are labelled "Sample reviews". Replace with real reviews you have permission to use, then remove the "Sample" labels.
- [ ] **Journal posts, careers, FAQ**: `data/journal.json`, `data/careers.json`, `data/faq.json`. They are invented. The journal dates are generated from "days ago" numbers, so replace them with real posts.
- [ ] **Social links**: `social` (empty now; add `{"label": "Instagram", "href": "https://www.instagram.com/yourshop", "path": "..."}` lines and ask your developer to show icons, or leave empty).
- [ ] **Photos**: replace the Unsplash stock photos with your own (section 9) and update the credit lines.
- [ ] **Forms**: paste a form address into `forms` > `endpoint` (section 8) so bookings, applications, newsletter sign-ups and gift-card requests reach you. Until then every form is a demo that says so.
- [ ] **Remove the "concept demo" wording**: `brand` > `demoFooter`, the "Sample" labels, the demo notes under the forms (they vanish by themselves once `forms.endpoint` is set), `legal.html`.
- [ ] **Let Google find the site**: `site` > `noindex` from `true` to `false`, and `site` > `baseUrl` to your real web address (ending in `/`).
- [ ] **Privacy policy**: `legal.html` is a plain-language template. Have it checked for your business before launch.
- [ ] **Share picture and icons**: `node tools/make-assets.mjs` regenerates `img/og.png` (shown when the link is posted on Facebook or in a text), the icons and the price-list PDF. Ask your developer.
- [ ] **Domain name and https**: section 10.

---

## 1. How to change anything: the one file

**Everything about the business is in one file: `site.config.json`.** Prices, phone, address, opening hours, holidays, staff, memberships, colours, booking and form settings are all in it. You never edit the website's pages by hand: the website rebuilds itself from this file.

### Editing on GitHub (no software needed)
1. Open the repository on github.com, go to the `barber-demo` folder, then click `site.config.json`.
2. Click the **pencil** icon (Edit this file).
3. Change the text between the quote marks. Keep the quote marks, commas and brackets exactly as they are.
4. Click **Commit changes** (green button), then **Commit changes** again.
5. Wait about **one to two minutes**. The site rebuilds and publishes itself. Refresh the page (on a phone: pull down to refresh).

### If something goes wrong
- Click the **Actions** tab on GitHub. A **green tick** next to your change means it worked. A **red cross** means a typo: click it, click the failed step, and read the message in plain English (for example `contact > phone: "12" does not look like an Australian number`). Fix the line and commit again. **Until it is fixed the live site keeps showing the last working version**, so a typo never breaks the site.
- Common typos: a missing comma at the end of a line, a missing closing quote mark, or a `$` sign in a price (write `48`, not `$48`).
- To undo a change: on the file's page click **History**, open the last good version and revert, or ask your developer.
- jsonlint.com is a free checker: paste the whole file in and it points at the mistake.

(Developers can also run `python3 tools/build.py`. Same result.)

---

## 2. What updates by itself (nothing to maintain)

| Thing | How it stays right |
| --- | --- |
| Booking calendar | Built each time the page loads, starting from **today in Sydney** and rolling **90 days** ahead. Past days and past times never show. After closing time, today is greyed out and the next open day is the first choice. |
| Opening chip ("Open now, closes at 7pm", "Opens tomorrow at 9am") | Worked out from the real time in **Sydney** (daylight saving included), whatever time zone the visitor is in. Handles closed days, holidays, special hours and late nights past midnight. |
| Public holidays | Calculated in code every year for your state (`region`): New Year's Day, Australia Day, Good Friday, Easter Saturday, Easter Sunday, Easter Monday, Anzac Day, King's Birthday, Labour Day (and Melbourne Cup Day for VIC), Christmas Day, Boxing Day, including the weekend substitute days. Nothing to update, ever. |
| Holiday banner | The week before a closure a banner reads, for example, "Closed Friday for Good Friday." |
| Copyright year, "Est." and "years in the same shop" | Always current. |
| Journal dates | Shown relative to today, so sample posts never look old. |
| Old specials | Disappear on their end date (section 7). |

Dates that are announced each year cannot be calculated (for example the NSW bank holiday, or the Friday before the AFL Grand Final in Victoria). Add them as closures (section 6).

---

## 3. Opening hours

In `site.config.json`, `hours` has one line per day. Times use the 24-hour clock in quote marks. A closed day has `null` (no quote marks).
```
{"day": 2, "name": "Tuesday", "open": "09:00", "close": "19:00"},
{"day": 1, "name": "Monday", "open": null, "close": null},
```
- `day` numbers: 0 = Sunday, 1 = Monday ... 6 = Saturday. Do not change them.
- Different weekend hours: give Saturday and Sunday their own times.
- Late nights: a close time earlier than the open time means "after midnight" (`"open": "18:00", "close": "02:00"` is 6pm to 2am next morning).
- Half hours work: `"09:30"`.
- The hours table, the "open now" chip, the booking calendar and time grid, the footer and the search-engine data all follow this.
- Time steps in the booking grid: `booking` > `slotMinutes`.

---

## 4. Prices and services

`services` has categories (the four tabs), each with `items`:
```
{"name": "Classic Cut", "price": 48, "mins": 45, "desc": "...", "tags": ["45 min"], "sig": true}
```
- Change `price` (dollars, numbers only) and `mins`. The price list, the booking drop-down, the "Your visit" drawer and the prices written inside text (for example "Skin Fade, $52") all update, because text uses `[[price:Skin Fade]]` instead of a typed number. If you rename a service, search the templates and `data/faq.json` for its old name inside `[[price:...]]`; the build stops and tells you if one is missing.
- To add a service, copy a line and change the name. To remove one, delete its whole line (and the trailing comma if it is the last).
- `sig: true` shows the "Popular" star.
- After changing services run `node tools/make-assets.mjs` to refresh `price-list.pdf` (ask your developer).
- Shop products are in `products`; delivery fee and free-delivery level are `shop`; membership plans are `memberships`; gift card amounts are `giftCards`.

---

## 5. Staff

`staff` has one line per person: `slug` (short name used in links), `name`, `role`, `pick` (the short line in the booking form), `blurb`, `photo`.
- **Someone joins:** copy a line, give it a new `slug` and details. Their card, their "Book with ..." link, the booking choice and the "Your visit" barber list appear. For a photo, add a slot in `data/photos.json` (copy `barberOllie`) and upload the photo (section 9). Without one they show their initial.
- **Someone leaves:** delete their line. Everything about them disappears.
- Keep the list to about 4 to 6 people.

---

## 6. Closures and special hours (holidays, staff training, early finish)

Add to `closures` (it starts empty `[]`). Dates are `year-month-day`.
```
"closures": [
  {"date": "2026-12-24", "name": "Christmas Eve", "status": "open", "open": "09:00", "close": "14:00"},
  {"date": "2027-03-05", "name": "staff training", "status": "closed"}
]
```
- `"closed"` closes that day (the calendar greys it out and the chip says so).
- `"open"` with `open` and `close` gives special hours. It overrides the weekly hours **and** the public-holiday rule for that date.
- The banner appears automatically a week before. Old entries can stay: past dates are ignored.

**Public holidays default to closed.** To change that edit `holidays`:
```
"holidays": {"mode": "closed", "overrides": {"Boxing Day": {"status": "open", "open": "10:00", "close": "16:00"}}}
```
`"mode": "normal"` opens on public holidays as usual. `overrides` picks per holiday by name (`New Year's Day`, `Australia Day`, `Good Friday`, `Easter Saturday`, `Easter Sunday`, `Easter Monday`, `Anzac Day`, `King's Birthday`, `Labour Day`, `Christmas Day`, `Boxing Day`).

---

## 7. Specials and news that expire

Add to `notices` (starts empty `[]`):
```
"notices": [{"text": "Free beard oil with every shave this month.", "start": "2026-10-01", "end": "2026-10-31"}]
```
It shows in a bar at the top of the site from `start` to `end` and **hides itself the day after `end`**. `end` is required (the build refuses a notice that could show forever). The announcement line (`announcement` > `text`) is for permanent messages.

---

## 8. Making the forms real (so you get the enquiries)

All forms (booking, "Your visit" drawer, careers, newsletter, gift cards) are **demos until you add a form address**. A demo says so on screen and sends nothing.
1. Make a free account at **formspree.io** (or a similar service), create a form and copy its address (like `https://formspree.io/f/abcdwxyz`).
2. Put it in `site.config.json`: `"forms": {"endpoint": "https://formspree.io/f/abcdwxyz", ...}`.
3. Commit. From then on the forms email you each request, the "demo only" notes disappear and visitors see "Thanks, your request is with us".
- **If sending fails** the visitor keeps what they typed and sees "Sorry, that did not send. Please call us on [your number]". The technical error is written to the browser console.
- Spam: every form has a hidden trap field that real people never see; robots that fill it in get a fake "success" and nothing is sent. Two quick clicks send only one request.
- Phone numbers must be Australian (04xx, 02, 03, 07, 08, 13, 1300, 1800, or +61) and error messages say so.
- Test it yourself once after setting it up and check your spam folder. "I did not get the enquiry": the visitor saw a confirmation with a reference number and your phone number; ask for the reference and check the form service's dashboard.
- Prefer a booking system like Fresha or Square Appointments? Put its address in `booking` > `externalUrl` and ask your developer to link it.

---

## 9. Changing a photo

Photo slots are listed in `data/photos.json` (`hero`, the three signature services, eight gallery photos, four barbers). The file for each is under `img/photos/`.

```
python3 tools/add-photo.py ~/Downloads/new-photo.jpg gallery6 --alt "Describe the photo for people who cannot see it" --credit "Photographer / Unsplash"
python3 tools/build.py
```
This resizes (1600px wide), converts to WebP under 250 KB, records the alt text and credit and rebuilds. Then commit `img/photos` and `data/photos.json`. Without Python: on github.com open `barber-demo/img/photos`, **Add file > Upload files**, and upload a WebP **with exactly the same name** (at most 1600px wide, 250 KB; squoosh.app does this), then edit the `alt` words in `data/photos.json`. Only use photos you took or are licensed to use. Every photo needs `alt` text.

---

## 10. Domain name, https and what to do if the site goes down

**How the site is hosted.** Plain files on **GitHub Pages** (free). Today: `https://kirithikbala21-jpg.github.io/3D-demo-sites/barber-demo/`. No database, no server.

**Connecting a real domain (for example brassandblade.com.au):**
1. Buy it from a registrar (VentraIP, Crazy Domains, GoDaddy, Namecheap). `.com.au` needs an ABN.
2. At the registrar's DNS settings add the records GitHub lists under **Settings > Pages > Custom domain** (four `A` records for the bare domain and a `CNAME` for `www` pointing at your GitHub user name `.github.io`).
3. On GitHub: **Settings > Pages > Custom domain**, type the domain, Save, then tick **Enforce HTTPS** when it becomes available (up to an hour). GitHub provides the https certificate **free and renews it automatically**.
4. Change `site` > `baseUrl` in `site.config.json` to the new address (with `https://` and a final `/`).

**Renewing.** The domain renews at the registrar (yearly, `.com.au` every 1 to 2 years). Turn on **auto-renew** and keep a working card and email on the account; if it lapses the website disappears. Hosting is free and has no renewal.

**If the site is down or shows an error:**
1. Check githubstatus.com. If Pages has an outage, wait.
2. Open the site in a private window and on mobile data (rules out your browser and Wi-Fi).
3. **"Not secure" warning:** GitHub > Settings > Pages: untick **Enforce HTTPS**, save, wait a minute, tick it again (up to an hour after a domain change).
4. **Old version after an edit:** check the **Actions** tab. A red cross means a typo in `site.config.json`. A green tick means it updates within a minute or two; every changed file gets a new version tag, so you never see a stale copy after that.
5. **404 on the whole site after changing the domain:** in Settings > Pages confirm the domain and the branch (`main`, root folder).
6. **Domain stopped working:** check at the registrar that it has not expired and the DNS records are still those from step 2.
7. Still stuck: contact your developer with the link to the failed step in the Actions tab.

---

## 11. Privacy, cookies and credits

- The **cookie bar** remembers the visitor's choice so it never returns (this works even if the browser blocks storage; it will simply ask again). **No analytics or tracking is loaded.** If you add analytics later it must only start after the visitor presses Accept: put the snippet in `js/ui.js` where the comment says.
- `legal.html` holds the privacy policy, terms and cookie information (linked from the footer and the cookie bar). Review it before launch.
- Photo credits are listed in the footer automatically. `CREDITS-TODO.md` lists the photographer names still to record.
- The "concept demo" wording is deliberate until the real owner's details are filled in (checklist in section 0).

---
---

# Notes for developers

## Structure
| Path | What it is |
| --- | --- |
| `site.config.json` | **The owner file**: brand, contact, theme, region, hours, holidays, closures, notices, booking, forms, staff, services, products, memberships, gift cards, shop, social, nav, announcement, pages. Validated by `tools/build.py` with plain-English errors (phone, times, dates, duplicate names, notices without an end date). |
| `data/*.json` | `journal`, `careers`, `faq`, `photos` (written by `add-photo.py`) |
| `tools/build.py` | Stdlib-only generator: pages, `search-data.js`, `sitemap.xml`, `robots.txt`, JSON-LD (BarberShop + FAQ, special hours from `closures`), `?v=hash` cache busting and one import map (Three.js plus every module). `[[price:Name]]`, `[[memberFrom]]`, `[[deliveryFee]]`, `[[freeOver]]` tokens in text are replaced by the real numbers. |
| `tools/templates/` | `layout.html`, `pages/`, `sections/`, `partials/` |
| `js/clock.js` | **Pure** date/time logic: shop time zone via `Intl` (DST-safe), Easter, NSW and VIC public holidays, opening status, banners. Unit-tested under Node. |
| `js/forms.js`, `js/formkit.js`, `js/cart.js` | Booking calendar (month view, rolling 90 days, shop-time "today"), forms (honeypot, double-submit guard, `fetch` to `forms.endpoint`, phone fallback, Australian phone validation) |
| `js/notice.js` | Holiday/closure banner and expiring notices |
| `scene.js`, `js/hero.js` | The 3D pole and its fallbacks (below) |
| `.github/workflows/barber-demo-checks.yml` (repo root) | On a push to `main`: rebuilds the pages from `site.config.json`, commits them back (the owner's edit goes live), then runs the tests. On pull requests it fails if the generated pages are stale. Also runs each 31 December so the no-JavaScript year is current. |

Time-zone behaviour: all calendar and status logic uses `site.timezone` (Australia/Sydney), never the visitor's zone and never a fixed offset. The calendar shows days from the shop's today to at least 90 days ahead, greys closed days, public holidays and today once nothing can be booked, and re-checks the chosen time when the form is submitted.

Caching: `styles.css`, `vendor/lenis*`, `main.js` carry `?v=<sha1>`; the import map maps every `./js/x.js`, `./scene.js` and `./search-data.js` to its versioned URL. Never edit generated `.html`; run `python3 tools/build.py`.

## How the 3D hero and its fallbacks work
`scene.js` builds the pole in code: helical red, white and blue stripes scrolling inside a glass tube, brass caps and wall mount, glows and dust. It tilts toward the mouse, speeds up when clicked or dragged, caps pixel ratio at 1.5, pauses off-screen or in a hidden tab and steps quality down on slow devices. The page always contains an inline SVG barber pole with animated stripes; `js/hero.js` keeps the SVG if WebGL is unavailable, the library fails, the context is lost, loading takes more than 4 seconds, Data Saver is on, or it is a weak phone. Reduced-motion visitors get a still frame.

## Tests
```
cd barber-demo
node tests/unit.mjs                                   # clock logic, no browser
export CHROME_PATH=/path/to/chromium
ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf,hardening]
```
`tests/node_modules` needs playwright-core and axe-core (a symlink to another demo's works). Overflow on every page at 360 to 1920px, axe at 375 and 1440, tap targets and text sizes, links, tabs, drawer, search, booking validation, cookie bar, no-WebGL and no-JS fallbacks, weight, and the `hardening` suite (visitor time zones, holidays, banners, expiring notices, config errors, forms, honeypot, double submit, stale-time refusal, cache busting, no-JS banner). Software WebGL is slow: run the suites one at a time on a busy machine.

## Demo-only things
Business details, barbers, prices, reviews and journal posts are invented and labelled. With no `forms.endpoint` nothing is sent. Availability in the booking grid is a deterministic demo (a hash of date + time + barber), not a real diary: a real booking system has to replace it before launch.
