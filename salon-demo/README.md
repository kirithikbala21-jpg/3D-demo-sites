# Maison Lune: concept demo

A **fictional** hair and beauty salon in Glen Waverley VIC, built as an unofficial concept demo (footer and `<title>` say so; "Demo website by KB Ventures"). Everything is invented: name, address (21 Example Street), ABN placeholder, phone (03 5550 0188), email (hello@maisonlune.example), prices, stylists and reviews. All pages are `noindex`.

Plain HTML, CSS and JavaScript, no framework, no bundler. HTML pages are **generated** by a stdlib-only Python script and committed, so GitHub Pages serves them as-is. No third-party requests at all (fonts and Lenis 1.1.18 are in this folder; no map embed, no analytics). Design: warm ivory `#FAF6F0`, cocoa `#2B211C`, clay `#C9A38C`, sage `#8A9A86` (darker text shades `#8A5A43` / `#5D6E59`), Cormorant Garamond headings plus Inter body, 16px rounded cards, 8px spacing scale, phone-first at 390px. No 3D: slow parallax, soft fade-up reveals and desktop hover zoom, all off for `prefers-reduced-motion`.

## Pages and sections
`index.html` (one page) and `404.html`. Sections in order: sticky header and phone bottom Call/Book bar, hero with "open today" line, services and prices (tabs), booking widget, stylists, before/after, gallery with lightbox, why choose us, sample reviews, FAQ, gift voucher, visit us, footer.

## Folder map
| Path | What it is |
| --- | --- |
| `site.config.json` | Brand, contact, hours, theme colours, booking settings, voucher amounts, nav, social links, page list |
| `data/*.json` | `services`, `stylists`, `reviews`, `faq`, `why`, `jobs` (before/after), `photos` |
| `tools/templates/` | `layout.html`, `pages/`, `sections/` |
| `tools/build.py` | Builds pages, `sitemap.xml` (404 excluded), `site.webmanifest` |
| `tools/make-assets.mjs` | PNG icons, `favicon.ico`, `img/og.png` (a real screenshot of the hero) |
| `tools/add-photo.py` | Adds a licensed photo to a slot |
| `js/*.js`, `styles.css` | Small modules: `ui` (cookie bar), `status` (open today, hours table), `services`, `tabs`, `booking`, `results` (before/after), `gallery` (lightbox), `voucher`, `motion` (reveal, parallax), `smooth` (Lenis) |
| `tests/run.mjs` | Automated checks |

## Making changes
1. Edit `site.config.json`, a file in `data/`, or a template. **Do not edit generated `.html` files by hand.**
2. `python3 tools/build.py`
3. After colour or name changes also run `export CHROME_PATH=/path/to/chromium && node tools/make-assets.mjs` (icons, favicon, share image).

## Reusing this for a real client: every place to change
| What | Where |
| --- | --- |
| **Business name** | `site.config.json` > `brand` and `pages` titles/descriptions; the wordmark in `tools/templates/layout.html` (`Maison <em>Lune</em>`, header and footer); copy in `tools/templates/sections/*.html` (hero, voucher), `data/*.json`; SVG `<title>` in `img/icon.svg`, `img/icon-maskable.svg`; `og:image:alt` in `layout.html`; `site.folder`, `site.baseUrl` |
| **Logo mark** | `#crescent` symbol in `layout.html`, `img/icon.svg`, `img/icon-maskable.svg` (then `node tools/make-assets.mjs`) |
| **Phone, email** | `contact.phone`, `contact.phoneHref` (digits only), `contact.email` (all links and the JSON-LD follow); the FAQ text in `data/faq.json` mentions no number |
| **Address, ABN, map link** | `contact` (`street`, `locality`, `suburb`, `postcode`, `abn`, `mapsQuery` drives "Open in Google Maps"). The map is a stylised SVG in `tools/templates/sections/visit.html` |
| **Opening hours** | `site.config.json` > `hours` (`open`/`close` hour per weekday, 0 = Sunday, `null` = closed). Drives the open-today line (hero, visit, footer), the hours table and its highlight, the booking day picker and 30-minute slots, and the JSON-LD. Time zone label: `site.timezone`. The open line uses the **visitor's own clock** |
| **Prices, durations, services** | `data/services.json` (`categories` for the four tabs, `items` with `slug`, `from`, `min`, `desc`). This one file feeds the price rows, the booking dropdown and every "from $" text. Do not type prices elsewhere |
| **Stylists** | `data/stylists.json` (`slug`, `name`, `first`, `role`, `speciality`, `bio`, `photo` slot). Booking options and "Book with ..." buttons follow |
| **Reviews, FAQ, why points, before/after jobs** | `data/reviews.json` (keep the "Sample content" label until real, permissioned reviews exist), `data/faq.json` (the cancellation answer says 24 hours; `booking.cancellationHours` is informational), `data/why.json`, `data/jobs.json` |
| **Booking behaviour** | `site.config.json` > `booking` (`slotMinutes`, `daysAhead`, `takenPercent` = share of demo diary hours shown as taken) |
| **Gift voucher amounts** | `site.config.json` > `vouchers` ($50, $100, $150 by default) and the FAQ text |
| **Colours** | `site.config.json` > `theme` becomes an inline `:root` in each page head; the same tokens plus `--sand`, `--card`, `--line`, `--muted`, `--error` live in `styles.css` `:root`. Keep text contrast at 4.5:1: cocoa text on clay or sage, `clayText`/`sageText` for small coloured text on ivory. Also the SVG icons and the map SVG hard-code the palette |
| **Fonts** | `fonts/`, `@font-face` at the top of `styles.css`, preloads in `layout.html` |
| **Social links** | `site.config.json` > `social` (currently platform home pages as placeholders) |
| **Cookie bar** | `tools/templates/layout.html`, `js/ui.js` (localStorage key `ml-cookie`; add your analytics where the comment says, only when accepted) |
| **Go live** | `site.noindex` to `false`, then build and run `make-assets` |

## Booking widget (front end only)
Five steps (service, stylist, day, time, details) then a confirmation panel; it says "Demo: nothing is sent". Availability is deterministic (a hash of day + stylist + hour block), duration-aware (a 3-hour service needs 6 free 30-minute slots and must finish by closing), and past times today are disabled using the visitor's clock. Confirmed demo bookings are saved to `localStorage` key `ml-bookings` (and vouchers to `ml-vouchers`) in that browser only. URL presets: `?service=balayage&stylist=amara`. To make it real, replace the submit handler in `js/booking.js` with a call to a booking service and read availability from it.

## Photos
20 of 24 slots are filled with Unsplash photos (originals and crops in `img/source/`, WebP in `img/photos/`; credit line "Photos from Unsplash", shown in the footer as a concept demo). Empty slots show a neutral branded panel with no text; add `?slots=1` to the URL to see each slot's name. Add or replace one with `python3 tools/add-photo.py photo.jpg SLOT --alt "..." --credit "..."` then `python3 tools/build.py`. Stylist portraits are capped at 900px wide, everything else 1600px, WebP under 250 KB. Full list: `PHOTO-SLOTS.md`. Credits to fill in: `CREDITS-TODO.md`.

Recent work (Colour, Balayage, Cut tabs in `data/jobs.json`) shows one "Recent work" photo per tab because there are no real before/after pairs; the drag slider appears automatically once both `*-before-1` and `*-after-1` slots are filled and wired in `jobs.json`.

Slot names: `hero`, `stylist-1` to `stylist-4`, `stylist-wash`, `stylist-scissors`, `gallery-1` to `gallery-8`, `cut-1`, `treatment-1`, `interior-1`, `interior-2`, `products-1`, plus the spare `colour-before-1`, `colour-after-1`, `cut-before-1`, `cut-after-1`.

## Tests
```
cd salon-demo
export CHROME_PATH=/path/to/chromium
ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf]
```
`tests/node_modules` must exist (playwright-core + axe-core; here it is a symlink to `../cafe-demo-v2/tests/node_modules`; add `salon-demo/tests/node_modules` to the repo `.gitignore`). Pillow is needed too: the lightbox, before/after and image-weight tests build a throwaway copy of the site filled with synthetic images (`tests/make-photo-copy.py`, run through the real `add-photo.py`), which is never committed. Suites: `overflow` (no sideways scroll 360 to 1920, overlaps, booking steps, with photos), `axe` (WCAG 2.2 AA on every state, tap targets, type), `links` (anchors, tel/mailto, JSON-LD, price consistency, copy rules), `func` (header, bars, cookie, open-today with a fake clock, tabs, booking, preselect, validation, stylists, FAQ, voucher, before/after, lightbox, motion, reduced motion, slot labels), `fallback` (JavaScript off, 404), `perf` (weight, third parties, SEO tags, assets, photo sizes).

## No JavaScript
Hero hours text, all 22 services (tabs become stacked lists, Book buttons are `?service=slug#book` links), the booking fallback (phone and email), FAQ, hours table, gallery and reviews all show. The booking widget, tabs behaviour, slider, lightbox, open-today line and animations need JavaScript.

## Demo-only things
All business details, stylists, prices and reviews are invented and labelled. Bookings and vouchers send nothing. The "open today" line is the visitor's clock against the listed hours, not real availability. The map is an SVG placeholder. Social links are platform home pages.
