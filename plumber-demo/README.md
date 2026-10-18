# Waverley Plumbing & Gas: concept demo

A fictional family plumbing business in south-east Melbourne, built as a sales demo. **Everything is fictional** (name, address, phone, ABN, licence, prices, reviews, team). The footer reads "Demo website by KB Ventures" and "Concept demo. Names, prices and reviews are fictional."; all pages are `noindex`. It reuses the build engine, photo pipeline and test harness of the sibling demos (`../gym-demo/` and others are untouched).

Plain HTML, CSS and JavaScript, no framework, no bundler. HTML pages are **generated** by a small Python script (standard library only) and committed, so GitHub Pages serves them as-is. Only third-party request: the lazy Google Maps embed. Fonts (Barlow Condensed 700, Inter variable) and Lenis 1.1.18 are hosted in this folder.

## Pages
`index.html` is one long phone-first page: announcement bar, header, hero, services (6 cards), emergency strip, how it works, service areas (suburb checker), pricing table, recent jobs (before/after slider), reviews, team, quote form, FAQ, find us, footer. Also `privacy.html` and `404.html`.

## Folder map
| Path | What it is |
| --- | --- |
| `site.config.json` | Business name, contact, licence, ABN, hours, time zone, theme colours, nav, announcement, service numbers, quote-form settings, page list |
| `data/*.json` | `services`, `pricing`, `suburbs` (with ETAs), `reviews`, `team`, `jobs`, `steps`, `badges`, `faq`, `photos` |
| `tools/templates/` | `layout.html` (header, menu, footer, bars), `pages/`, `sections/` |
| `tools/build.py` | Builds every page, `sitemap.xml`, `site.webmanifest` |
| `tools/make-assets.mjs` | PNG icons, `favicon.ico` and `img/og.png` (a real screenshot of the hero) |
| `tools/add-photo.py` | Adds a licensed photo to a slot (see `PHOTO-SLOTS.md`) |
| `styles.css`, `js/*.js` | Styles and small behaviour modules (`ui`, `status`, `areas`, `quote`, `jobs`, `pipe`, `smooth`) |
| `tests/run.mjs` | Automated checks |

## Making changes
1. Edit `site.config.json`, a file in `data/`, or a template. **Do not edit generated `.html` files by hand.**
2. `python3 tools/build.py`
3. After colour or name changes also run `export CHROME_PATH=/path/to/chromium && node tools/make-assets.mjs` (icons, favicon, share image).

## Reusing this for a real client: every place to change
| What | Where |
| --- | --- |
| **Business name** | `site.config.json` > `brand` (`name`, `short`, `line1`/`line2` (two-line logo text), `tagline`, `description`); page titles/descriptions in `site.config.json` > `pages`; copy that names the business in `tools/templates/sections/*.html`, `pages/*.html` and `data/faq.json`, `data/reviews.json`, `data/team.json`; the SVG `<title>` in `img/icon.svg`, `img/icon-maskable.svg`; `og:image:alt` in `tools/templates/layout.html`; `site.folder` and `site.baseUrl` |
| **Logo mark** | `#logo-mark` symbol in `tools/templates/layout.html`, plus `img/icon.svg` and `img/icon-maskable.svg` (then `node tools/make-assets.mjs`) |
| **Phone** | `contact.phone` and `contact.phoneHref` (digits only); `announcement.link` and `announcement.href`; the number written in `data/faq.json` (gas answer) and `tools/templates/sections/areas.html` (no-JS note); `PHONE` in `tests/run.mjs` reads it from config |
| **Email, address, ABN, licence, map** | `contact` (`email`, `street`, `locality`, `suburb`, `postcode`, `abn`, `licence`, `mapsQuery` drives the map embed and the "Open in Google Maps" link); licence also in `data/faq.json` and `data/team.json` copy |
| **Opening hours** | `site.config.json` > `hours` (open/close hour per day, 0 = Sunday). Drives the "available now" pill, the footer and find-us status, the hours lists, the callback wording and structured data. Time zone: `site.timezone` / `site.timezoneLabel`. The FAQ weekend answer (`data/faq.json`) is written text: update it too |
| **Service numbers** | `site.config.json` > `service` (`arriveMinutes`, `callbackMinutes`, `warrantyMonths`, `bigJobFinance`), `brand.established`, `brand.plumbers`, `brand.yearsInBusiness`; the hero line "usually within 60 minutes" comes from `arriveMinutes`; "12-month" appears in `data/badges.json`, `data/steps.json`, `data/faq.json` |
| **Prices** | `data/services.json` (`from`, the single source for the service cards AND the linked pricing-table rows), `data/pricing.json` (rows with `ref` take the price from the service; rows with `price` are standalone), `data/jobs.json` (job prices), FAQ text in `data/faq.json` ($199, $169) |
| **Service / plan names** | `data/services.json` (`name`, `promise`, `label`, `urgency`), also used by the quote form dropdown; `data/pricing.json` item names |
| **Suburbs and ETAs** | `data/suburbs.json` (name, postcode, ETA text) drives the checker, chips, quote datalist, footer list and structured data |
| **Reviews, team, jobs, FAQ** | `data/reviews.json` (and `reviewsSummary` rating and count in the config), `data/team.json`, `data/jobs.json`, `data/faq.json` |
| **Colours** | `site.config.json` > `theme` is written into an inline `:root` style in every page head (`--navy`, `--orange`, `--grey`, `--ink`, `--green`, `--green-text`, `--copper`); `theme.bg` is the browser/manifest colour. Other colours live in `styles.css` `:root` (`--muted`, `--error`, `--orange-hi`, `--navy-soft`, `--green-bg`), the inline SVG logo and gauge water colour in `layout.html`, `img/icon*.svg`, and the `%230b2545` select arrow and placeholder textures in `styles.css`. Orange is for call buttons, badges and big numbers only, always with navy text (never white text on orange); green is for the open-now dot |
| **Fonts** | `fonts/`, `@font-face` at the top of `styles.css`, preloads in `layout.html` |
| **Announcement bar** | `site.config.json` > `announcement` (`lead`, `text`, `link`, `href`); remembered in `localStorage` key `wp-announce` |
| **Go live** | `site.noindex` to `false`, `site.baseUrl`, then build and `make-assets` |

## Connect the quote form (TODO before a real launch)
The form validates and shows a confirmation, saves the request to this browser (`localStorage` key `wp-quotes`), and sends nothing. To send real requests set `site.config.json` > `form.endpoint` to a form service URL (Formspree, Basin, Getform) or your own route that emails the office, then rebuild. With an endpoint set, `js/quote.js` POSTs the fields (plus the photo as `photo`) as multipart form data and only shows the confirmation if the POST succeeds; on failure it asks the visitor to call. Photo upload needs a service that accepts files. Also remove the "Demo form" notes in `tools/templates/sections/quote.html` and `js/quote.js`.

## Photos
18 slots, none filled; each shows a labelled placeholder until a file exists. See `PHOTO-SLOTS.md` (what each slot needs) and `CREDITS-TODO.md`. Add one with `python3 tools/add-photo.py photo.jpg SLOT --alt "..." --credit "..."` then `python3 tools/build.py`.

## The pipe (signature touch)
`js/pipe.js` builds an SVG copper pipe in the left gutter, with a joint at every heading (`data-pipe`), drawn with `stroke-dashoffset` as you scroll (one rAF-throttled scroll handler). It ends above the footer gauge; a drop falls in and the gauge fills. Reduced motion, no JavaScript and print show it fully drawn with a full gauge. To remove it, delete the `import './pipe.js'` line in `js/main.js`.

## Tests
```
cd plumber-demo
export CHROME_PATH=/path/to/chromium
ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf]
```
`tests/node_modules` must exist (playwright-core + axe-core; here it is a symlink to `../cafe-demo-v2/tests/node_modules`). Suites: `overflow` (no horizontal scroll 360 to 1920, no overlapping text, every section <= 1,300px at phone widths), `axe` (WCAG 2.2 AA, tap targets, type, palette), `links` (links, anchors, number consistency), `func` (header, menu, bars, open-now with a fake clock, services to form, form, suburb checker, slider, FAQ, swipe rows, pipe, placeholders and real photos, form endpoint), `fallback` (JavaScript off, 404), `perf` (weight, SEO tags, assets). A full run takes a few minutes.

## What is demo-only
Business, people, prices, reviews and the "4.9 (212)" summary are invented and labelled. The quote form sends nothing. The "available now" status is computed from the visitor's clock in Melbourne time, not from real staff availability. The map points at a placeholder address. Pages are `noindex`. See `CLIENT-CHECKLIST.md`.

## Design notes
Light page, navy `#0b2545`, one orange `#ff6a13`. Type: Barlow Condensed 700 headings (56 / 40 / 28 / 20px desktop, about 36 / 30 / 24 / 19px phone), Inter body (17px phone). 8px spacing scale, 12px radius. Phone first: sticky bottom call/quote bar below 1040px, cookie bar above it (max 70px), no section taller than about 1,300px at 390px.

## Photos placed so far
Hero (sink), emergency strip (tool wall), How it works (pipe cutter + tall tool wall), service cards (tools, hot water unit, gas pipework, bathroom), team 1, Find us (van + ute), before-after-3 after. Credits read "Photo: Unsplash" until names are added (CREDITS-TODO.md). Still empty: team 2 to 4, all before photos, before/after 1 and 2 after, plumber-at-work-1, blocked-drain-work, emergency-night-van. Unused spare: bathroom-clean-1 and bathroom-reno-dark (in img/source).

## Update: more photos
Added: blocked drains and emergency strip (night crew), leaks and taps (pipe fittings), team 2 to 5 (team 5 is a fifth card). Empty photo slots now show a quiet neutral panel; add `?slots=1` to the URL to see their labels. Still empty: before photos, before/after 1 and 2 after.
