# Ember & Oak Coffee: website guide

This is an **unofficial concept demo** of a café website. Every business detail (name, address, phone, menu, prices, team, reviews) is invented and labelled as such. This guide has **the owner's guide** (plain English, no coding) first and **notes for developers** after it.

---

## 0. Launch checklist: replace every placeholder before going live

All "site.config.json" items are in the **one file** described in section 1.

- [ ] **Business name and wording**: `site.config.json` > `brand`. Also the page titles in `pages`.
- [ ] **Phone number**: `contact` > `phone` (currently the fake `03 5550 0123`). Every link, the Call button, the footer, the search-engine data and the "call us" fallback messages follow it automatically.
- [ ] **Email**: `contact` > `email` (currently `hello@example.com`).
- [ ] **Address and map**: `contact` > `street`, `locality`, `postcode`, `mapsQuery`, `lat`, `lon` (currently `12 Example Street`, with the map at Federation Square).
- [ ] **Opening hours**: `hours` (section 3).
- [ ] **Menu, shop, journal, jobs, press, FAQ**: the matching file in `data/` (all invented). Run `node tools/make-assets.mjs` after a menu change to refresh `menu.pdf`.
- [ ] **Reviews, team, events, experiences, gift card text**: `tools/templates/sections/` (invented, labelled "Sample"). Replace with real ones you have permission to use, or delete the block.
- [ ] **Photos**: swap the Unsplash stock photos for your own (section 9) and record the credits (`CREDITS-TODO.md`).
- [ ] **Forms**: paste a form address into `forms` > `endpoint` (section 8) so reservations, orders and enquiries reach you. Until then every form is a demo that says so.
- [ ] **Top announcement bar**: `announcement` (text and an `end` date, after which it hides itself).
- [ ] **Remove the demo wording**: `brand.demoFooter`, `brand.conceptLine`, the "Sample ..." and "fictional" notes in the templates, and the text of `legal.html` (a template: have it reviewed for your business).
- [ ] **Let Google find the site**: `site` > `noindex` from `true` to `false`, and `site` > `baseUrl` to your real web address (ending in `/`).
- [ ] **Privacy page**: read `tools/templates/pages/privacy.html` and check it matches what you actually do (for example if you add analytics).
- [ ] **Share picture**: `node tools/make-assets.mjs` regenerates `img/og.png` and the icons.
- [ ] **Domain name and https**: section 10. Also see `CLIENT-CHECKLIST.md` for the longer list.

---

## 1. How to change anything: the one file

**Everything about the business is in one file: `site.config.json`.** Phone, address, opening hours, holidays, closures, notices, colours, booking and form settings are all in it. (The menu, shop and other long lists are in `data/`.) You never edit the website's pages by hand: the website rebuilds itself from these files.

### Editing on GitHub (no software needed)
1. Open the repository on github.com, go to the `cafe-demo-v2` folder, and click `site.config.json`.
2. Click the **pencil** icon (Edit this file).
3. Change the text between the quote marks. Keep the quote marks, commas and brackets exactly as they are.
4. Click **Commit changes** (green button), then **Commit changes** again.
5. Wait about **one to two minutes**. The site rebuilds and publishes itself. Refresh the page (on a phone: pull down) to see the change.

### If something goes wrong
- Click the **Actions** tab on GitHub. A **green tick** next to your change means it worked. A **red cross** means a typo: click it, click the failed step, and read the message in plain English (for example `contact > phone: "12" does not look like an Australian number`). Fix the line and commit again. **Until it is fixed the live site keeps showing the last working version**, so a typo never breaks the site.
- Common typos: a missing comma at the end of a line, a missing closing quote mark, a `$` sign in a price (write `9.5`, not `$9.5`).
- To undo a change: open the file's **History**, open the last good version, use the `...` menu and **Revert**, or ask your developer.
- jsonlint.com is a free checker: paste the whole file in and it points at the mistake.

(Developers can also run `python3 tools/build.py` locally. Same result.)

---

## 2. What updates by itself (nothing to maintain)

| Thing | How it stays right |
| --- | --- |
| Reservation date picker | Starts at **today in Melbourne** and rolls forward at least a year. Past dates and times that have already passed today are never offered. Closed days and public holidays say so. |
| "Open now" lines and the hours table highlight | Worked out from the real time in **Melbourne** (daylight saving included), whatever time zone the visitor is in. Handles closed days, holidays, special hours and late nights past midnight. |
| Pick-up times in the order drawer | The next slots inside opening hours; "Tomorrow at 7:00am" (or the next open day) when closed. |
| Public holidays | The Victorian public holidays are **calculated in code** every year (Easter, Labour Day, Anzac Day, King's Birthday, Melbourne Cup Day, Christmas, Boxing Day and the weekend substitutes). Nothing to update, ever. |
| Holiday banner | The week before a closure: for example "Closed Friday for Good Friday." |
| Copyright year | Always the current year. |
| Top announcement and specials | Hide themselves after their end date (sections 6 and 7). |

**One holiday cannot be calculated:** the Friday before the AFL Grand Final (announced each year). Add it as a closure when it is announced.

---

## 3. Opening hours

`hours` has one line per day. Times use the 24-hour clock in quote marks; a closed day has `"open": null, "close": null`.
```
{"day": 4, "name": "Thursday", "open": "07:00", "close": "22:00"},
```
- `day`: 0 = Sunday ... 6 = Saturday. Do not change these numbers.
- Weekend hours: give Saturday and Sunday their own times. Half hours work: `"07:30"`.
- Late nights: a close time earlier than the open time means after midnight: `"open": "18:00", "close": "02:00"`.
- The hours table, "open now" lines, reservation times, order pick-up times, footer and search-engine data all follow this.

---

## 4. Prices, menu and staff

- **Menu:** `data/menu.json` (categories and items with `price`). **Shop:** `data/products.json`. Prices are numbers (`4.5`), no `$` sign. Tags: `V VG GF DF`.
- **Experiences, events and gift card amounts:** `tools/templates/sections/` (plain text in the page templates; ask your developer, or edit on GitHub the same way as section 1).
- **Team:** `tools/templates/sections/story.html`.

---

## 5. Closures and special hours (holidays, staff training, early finish)

Add to `closures` (it starts empty `[]`). Dates are `year-month-day`.
```
"closures": [
  {"date": "2026-12-24", "name": "Christmas Eve", "status": "open", "open": "07:00", "close": "14:00"},
  {"date": "2027-03-05", "name": "AFL Grand Final Friday", "status": "closed"}
]
```
- `"status": "closed"` closes that day (the reservation form says so and the opening line follows).
- `"status": "open"` with `open` and `close` gives special hours. It overrides the weekly hours **and** the public holiday rule for that date.
- The banner appears automatically a week before. Old entries can stay: past dates are ignored.

**Public holidays default to closed.** Change it in `holidays`:
```
"holidays": {"mode": "closed", "overrides": {"Boxing Day": {"status": "open", "open": "08:00", "close": "14:00"}}}
```
`"mode": "normal"` means the café opens as usual on public holidays. `overrides` works per holiday name (`New Year's Day`, `Australia Day`, `Labour Day`, `Good Friday`, `Easter Saturday`, `Easter Sunday`, `Easter Monday`, `Anzac Day`, `King's Birthday`, `Melbourne Cup Day`, `Christmas Day`, `Boxing Day`).

---

## 6. The top announcement bar

`announcement` has `short` (phones), `text` (wider screens) and an `end` date. After `end` the bar hides itself. The build refuses an announcement with no end date, so old news never stays up.

---

## 7. Specials and news that expire

Add to `notices` (starts empty):
```
"notices": [{"text": "Spring special: free biscotti with any filter coffee.", "start": "2026-10-01", "end": "2026-10-31"}]
```
It shows in a bar under the announcement from `start` to `end` and hides itself the day after. `end` is required.

---

## 8. Making the forms real (so you get the enquiries)

All forms (reservation and enquiry, pick-up order, careers, wholesale, newsletter, gift card) are **demos until you add a form address**. A demo says so on screen and sends nothing.
1. Make a free account at **formspree.io** (or a similar service), create a form, and copy its address (like `https://formspree.io/f/abcdwxyz`).
2. Put it in `site.config.json`: `"forms": {"endpoint": "https://formspree.io/f/abcdwxyz", ...}`.
3. Commit. From then on forms email you each request, and the "demo only" notes disappear.
- **If sending fails** the visitor keeps what they typed and sees "Sorry, that did not send. Please call us on [your number]". The technical error is written to the browser console for your developer.
- **Spam:** each form has a hidden trap field; robots that fill it get a fake "success" and nothing is sent. Two quick clicks send one request.
- Test it once after setup and check your spam folder. "I did not get the enquiry": the visitor sees a confirmation and the number to call; check the form service's dashboard.
- Payments are not taken online: orders are pick-up (pay in store) and gift cards need a payment provider (Square, Stripe) connected by your developer.

---

## 9. Changing a photo

Every photo has a clear name (a "slot", listed in `data/photos.json`, for example `gallery-latte-art`). Files live in `img/photos/`.
```
python3 tools/add-photo.py ~/Downloads/latte.jpg gallery-latte-art --alt "Describe the photo for people who cannot see it" --credit "Photographer, Unsplash"
```
This resizes, converts to WebP under 250 KB, writes the alt text and credit, and rebuilds the pages. Commit `img/photos` and `data/photos.json`.

**Without Python:** on github.com open `cafe-demo-v2/img/photos`, **Add file > Upload files**, and upload a WebP file **with exactly the same name**, at most 1600 pixels wide and 250 KB (squoosh.app does this), same shape as the old photo. Photo rules: only use photos you took or are licensed to use, and every photo needs `alt` text.

---

## 10. Domain name, https and what to do if the site goes down

**Hosting.** The site is plain files on **GitHub Pages** (free). Today it lives at `https://kirithikbala21-jpg.github.io/3D-demo-sites/cafe-demo-v2/`. There is no database or server to maintain.

**Connecting a real domain (for example emberandoak.com.au):**
1. Buy the domain from a registrar (VentraIP, Crazy Domains, GoDaddy, Namecheap). `.com.au` needs an ABN.
2. At the registrar's DNS settings add the records GitHub lists under **Settings > Pages > Custom domain** (four `A` records for the bare domain and a `CNAME` for `www` pointing at your GitHub user name `.github.io`).
3. On GitHub: **Settings > Pages > Custom domain**, enter the domain, Save, then tick **Enforce HTTPS** when it becomes available (up to an hour). GitHub provides the https certificate **free and renews it automatically**.
4. Change `site` > `baseUrl` in `site.config.json` to the new address (with `https://` and a final `/`).

**Renewing.** The domain is renewed at the registrar (yearly, `.com.au` every 1 to 2 years). Turn on **auto-renew** and keep a working card and email on the account: if it expires the website disappears. The hosting has no renewal.

**If the site is down or shows an error:**
1. Check githubstatus.com. If Pages has an outage, wait.
2. Open the site in a private window and on mobile data (rules out your browser and Wi-Fi).
3. **"Not secure" warning:** GitHub > Settings > Pages: untick **Enforce HTTPS**, save, wait a minute, tick it again (up to an hour after a domain change).
4. **Old version after an edit:** check the **Actions** tab (section 1); a red cross means a typo. Updates appear one to two minutes after a green tick.
5. **404 on the whole site after changing the domain:** in Settings > Pages confirm the domain and the branch (`main`, root folder).
6. **Domain stopped working:** check at the registrar that it has not expired and the DNS records are still those from step 2.
7. Still stuck: contact your developer with the link to the failed step in the Actions tab.

---

## 11. Privacy, cookies and credits

- The **cookie card** remembers the visitor's choice (it works even if the browser blocks storage; it just asks again). No analytics or tracking is loaded. If you add analytics later it must start only after Accept: put the snippet in `js/ui.js` where the comment says.
- `privacy.html` is a plain-English policy matching the design, linked from the footer and cookie card. `legal.html` holds the terms template.
- Photo credits are listed in the footer. `CREDITS-TODO.md` lists photographer names still to record.
- The "concept demo" wording and "Sample" labels are deliberate until real details are filled in (checklist in section 0).

---
---

# Notes for developers


A fictional café website built as a sales demo: dark, minimal, editorial, with a full-screen 3D hero. **Everything is fictional** (name, address, phone, prices, reviews, team, press, news, numbers). The footer reads "Concept demo by KB Ventures. Not a real business." and pages are `noindex`. The original single-page version is untouched in `../cafe-demo/`.

Plain HTML, CSS and JavaScript. No framework, no bundler, no third-party requests (Three.js and the fonts are hosted in this folder). The HTML pages are **generated** from templates by a small Python script and committed, so GitHub Pages serves them as-is.

## Pages
`index` (home) · `menu` (41 items in Coffee, Tea, Food, Bakery, Cold drinks and Evening; pick-up ordering, PDF) · `shop` · `experiences` (tours, workshops, events, gift cards) · `story` · `sustainability` · `visit` (hours, map, FAQ); the home page also has a "Find us" section (Google Maps embed, live open/closed chip, hours); `404.html` is a themed not-found page · `reserve` (booking form with time slots) · `journal` · `careers` · `wholesale` · `press` · `legal` (privacy, terms, cookies).

Site-wide: one calm announcement bar (dismissible, remembered), full-screen menu, site search (press `/`), order drawer, a small cookie card (bottom-left), optional ambient sound (a visible "Ambient sound: Off/On" button), a branded intro of about one second on the first visit, Lenis smooth scrolling (off for reduced motion), scroll-reveal, magnetic buttons on desktop, a header that shrinks on scroll, sticky Call / Reserve bar on phones.

## Folder map
| Path | What it is |
| --- | --- |
| `site.config.json` | **The owner file**: brand, contact, hours (`"HH:MM"`), holidays, closures, notices, booking, forms, time zone, colours, nav, page list, announcement bar (with `end`), 404 page, hero video slot. Validated by `tools/build.py` with plain-English errors. |
| `data/*.json` | Menu, products, journal posts, jobs, press quotes, FAQ |
| `tools/templates/` | `layout.html` (shared header/footer), `pages/` and `sections/` content blocks |
| `tools/build.py` | Builds every `.html` page, `search-data.js`, `sitemap.xml`, `robots.txt`, `site.webmanifest`, JSON-LD (special hours from `closures`), and the `?v=hash` cache-busting import map |
| `js/clock.js` | **Pure** date/time logic (Melbourne time via `Intl`, DST-safe, Easter, Victorian holidays, opening status, banners). Unit-tested under Node (`node tests/unit.mjs`). |
| `js/formtools.js`, `js/notice.js` | Honeypot, double-submit guard, `fetch` to `forms.endpoint` with a phone fallback; the holiday and specials bar |
| `tools/make-assets.mjs` | Makes the PNG icons (incl. maskable), `favicon.ico` (Pillow), `img/og.png` (a real screenshot of the 3D hero, 1200x630) and `menu.pdf` |
| `tools/add-photo.py` | Adds a real photo to a slot (resize, WebP under 250 KB, alt + credit, rebuild). See "Photos" |
| `data/photos.json` | The photo slots (gallery tiles and the three feature rows) |
| `styles.css`, `main.js`, `js/*.js`, `scene.js` | Styles, behaviour modules, the 3D scene |
| `vendor/`, `fonts/` | Self-hosted Three.js 0.160.0, Lenis 1.1.18 (MIT) and Montserrat / Mrs Saint Delafield |
| `tests/run.mjs` | Automated checks (see below) |

## Making changes
1. Edit `site.config.json`, a file in `data/`, or a template in `tools/templates/`. **Do not edit the generated `.html` files by hand.**
2. Run `python3 tools/build.py` (Python 3, standard library only).
3. Commit the changed files. On a push to `main` a GitHub Action rebuilds the pages from `site.config.json` and commits them back (the owner's edit goes live); on pull requests it fails if the pages are out of date. It also runs on 1 January so the no-JavaScript year is current.

Common edits:
- **Name, address, phone, email, hours, colours, time zone:** `site.config.json`. Hours drive the hours table, the "Open now" chip, the booking time slots, the announcement bar and the search-engine data. The "Open now" status uses the café's time zone, not the visitor's, and says "(Melbourne time)" when the visitor's clock differs. `announcement` holds the bar text; `contact.mapsQuery` feeds the Google Maps embed and link.
- **Menu:** `data/menu.json` (categories, items, prices, tags `V VG GF DF`, `sig` for a Signature star). Optional photo per item: add `"img": "img/dish.jpg", "imgAlt": "..."`.
- **Shop, journal, jobs, press, FAQ:** the matching file in `data/`.
- **Experiences, events, gallery, story, reviews, gift cards:** the files in `tools/templates/sections/`.
- **Hero background video:** set `hero.video` (and `hero.poster`) in `site.config.json`, for example `"video": "img/hero.mp4"`. It plays muted and looped behind the burgundy panel, and is paused for visitors who prefer reduced motion.
- **After changing the menu:** run `node tools/make-assets.mjs` to refresh `menu.pdf`.

## Photos
The site now uses 12 real photos (originals and crops in `img/source/`, compressed WebP in `img/photos/`; credits read "Photo: Unsplash" until names are added, see `CREDITS-TODO.md`). Palette: dark roast and cream, with warm ember orange `#E0782B` as the one accent (edit the `:root` variables in `styles.css` and `theme` in `site.config.json`).

The site ships with illustrations, not photographs (none can be invented). Every picture position is a **slot** in `data/photos.json` (`gallery-latte-art`, `gallery-roastery`, `gallery-pastries`, `feature-pour-over` and so on; run `python3 tools/add-photo.py --list`). A slot shows its real photo, with a soft gradient for text legibility and a slow zoom as you scroll (disabled for reduced motion), as soon as its file exists. Until then the illustration stays.

Add a photo (needs Pillow: `pip install pillow`):
```
python3 tools/add-photo.py ~/Downloads/latte.jpg gallery-latte-art \
  --alt "A rosetta poured into a flat white on an oak table" \
  --credit "Jane Doe, Unsplash (Unsplash licence)"
```
The tool resizes to at most 1600px wide, saves WebP in `img/photos/` at the highest quality that stays under 250 KB, records `file`, `alt`, `credit`, `w` and `h` in `data/photos.json`, and rebuilds the pages. The image is rendered with `width`, `height`, `loading="lazy"` and your alt text. Commit `img/photos/`, `data/photos.json` and the rebuilt `.html` files.

**Licence and credit are required.** Only use photos you took yourself, commissioned, or that are licensed for commercial web use (Unsplash, Pexels, or paid stock), and keep the photographer and source in `--credit`. The build refuses to run if a photo exists without alt text and a credit, and the footer automatically shows a "Photo credits" line for the photos that exist (nothing is shown when there are none). Do not use photos from Google Images, Instagram or other sites without written permission.

Suggested shots: **latte art** (`gallery-latte-art`, `feature-flat-white`), **pour-over** (`feature-pour-over`), **pastries** (`gallery-pastries`, `feature-bun`), **roastery** (`gallery-roastery`, `gallery-first-cup`) and **interior** (`gallery-oak-leaf`, `gallery-floor`, `gallery-table`, `gallery-evening`). Landscape works best for the two wide gallery tiles, portrait for the others.

## How the 3D hero and its fallbacks work
`scene.js` builds the cup, saucer, tube handle, latte-art coffee, steam wisps, embers and floating beans in code. It rotates, tilts toward the mouse, spins when clicked or dragged, uses device tilt only where no permission prompt is needed, caps pixel ratio at 1.5, pauses when off-screen or in a hidden tab, and steps its own quality down on slow devices. It starts only after the page has loaded and the browser is idle.

The page always contains an inline SVG cup. `js/hero.js` removes the canvas and keeps the SVG if WebGL is unavailable, the library fails to load, the context is lost, loading takes more than 4 seconds, or the visitor has Data Saver on. Reduced-motion visitors get a still frame. Visitors never see a blank box: the SVG is the poster while the scene loads. Data Saver, 2G connections and very weak devices (1 GB memory or a single core) keep the poster and never download the 3D library.

## Tests
```
cd tests
npm install
npx playwright-core install chromium     # or set CHROME_PATH to an existing Chromium
node ../tests/unit.mjs                    # clock logic, no browser
node run.mjs                              # all suites, or --suite=overflow,axe,links,func,fallback,perf,final,hardening
```
They cover: no horizontal overflow on all 13 pages at 360, 375, 414, 768, 1024, 1280 and 1920 px; axe-core accessibility on every page at 375 and 1440 px; tap targets, text sizes, links and anchors; the menu, ordering, search, forms, cookie banner, time slots and menu overlay; every fallback path; the pixel-ratio cap; hours, tagline, counters, nav labels, titles and SEO tags on every page; the intro finishing in under 1.5 s; smooth scrolling and its pause while menus are open; the cookie bar's position; and a final sweep of every page at 1440x900 and 390x844 (no horizontal scroll, no broken images, no overlapping text, no console errors or 404s); and page weight with no third-party requests. The same checks run on GitHub Actions for every change to this folder.

## What is demo-only
With no `forms.endpoint` the booking, careers, wholesale, newsletter, gift card and order forms validate in the browser and show a confirmation; nothing is sent (with an endpoint they post JSON to it). A confirmed order and a confirmed reservation are also kept in this browser's localStorage (`eo-orders`, `eo-reservations`) so you can see the flow end to end. Look for the `DEMO ONLY` comments. See `CLIENT-CHECKLIST.md` for turning this into a real site.

## Design system notes (v2.3)
- **Headings:** one scale in `:root` (`--fs-h1..h4`): 56/40/28/20px from 1024px, fluid down to 36/30/24/19px at 390px. **Spacing:** `--space-1` (8px) to `--space-12` (96px), plus 128 and 160. Sections use 96px (phones) and 160px (desktop). Running text is capped at 68ch. Only two font families load: Montserrat and Mrs Saint Delafield.
- **Photos:** every `.photo img` gets the same grade (`--photo-grade`), overlay, ember hairline and 6px radius; full-bleed backgrounds get grade and overlay only. Each slot in `data/photos.json` can set `pos` (object-position, e.g. `"50% 30%"`, or `--pos` in `add-photo.py`) so the subject is never cropped.
- **3D start:** after the intro, the window `load` event and an idle callback. Data Saver, 2G, 1-core devices and low-power phones (screen or window 480px or less AND 4 or fewer cores or 4 GB or less memory) keep the SVG poster and never download Three.js.
- **Third parties:** none, except the lazy Google Maps iframe in "Find us" (no API key) and the click-to-load OpenStreetMap on the visit page.
