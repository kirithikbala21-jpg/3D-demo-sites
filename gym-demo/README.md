# Iron & Ember Athletic Club: concept demo

A fictional gym website built as a sales demo: near-black, warm off-white type, one electric-yellow accent, big condensed headlines, a full-screen photo hero and one small slowly rotating 3D barbell. **Everything is fictional** (name, address, phone, prices, quote, coaches, numbers). The footer reads "Concept demo by KB Ventures. Not a real business." and "Demo website by KB Ventures", and pages are `noindex`. It shares its build system and tests with `../barber-demo/`, which is untouched.

Plain HTML, CSS and JavaScript. No framework, no bundler, no third-party requests except the lazy Google Maps embed in the Visit block (Three.js and the fonts are hosted in this folder). The HTML pages are **generated** from templates by a small Python script and committed, so GitHub Pages serves them as-is.

## Pages
The home page is one long page, in this order: announcement bar, hero, the offer (7-day free trial with three expanding items), facilities gallery, classes and timetable, coaches, real results (one sample quote plus counters), memberships, visit us (map, live hours, "Schedule a visit" form), newsletter, footer. Sub-pages go deeper: `classes` (full timetable with type filter), `coaches`, `trial` (free-trial / class booking with calendar and time grid), `membership` (plans, annual toggle, FAQ, day passes, gift vouchers), `journal`, `visit`, `careers`, `legal`, `404`.

## Folder map
| Path | What it is |
| --- | --- |
| `site.config.json` | Brand, contact, hours, time zone, theme colours, nav, page list, announcement text, hero video |
| `data/*.json` | `classes` (the 60-class timetable), `coaches`, `plans`, `planfaq`, `faq`, `journal`, `careers`, `photos` |
| `tools/templates/` | `layout.html` (shared header/footer), `pages/` and `sections/` |
| `tools/build.py` | Builds every `.html` page, `search-data.js`, `sitemap.xml` and `site.webmanifest` |
| `tools/make-assets.mjs` | Makes the PNG icons, `favicon.ico` and `img/og.png` (a real screenshot of the 3D hero) |
| `tools/add-photo.py` | Adds a licensed photo to a slot (see `PHOTO-SLOTS.md`); `img/source/` holds the originals |
| `styles.css`, `main.js`, `js/*.js`, `scene.js` | Styles, behaviour modules, the 3D barbell |
| `vendor/`, `fonts/` | Self-hosted Three.js 0.160.0, Lenis 1.1.18, Barlow Condensed 600/700 and Montserrat |
| `tests/run.mjs` | Automated checks |

## Making changes
1. Edit `site.config.json`, a file in `data/`, or a template. **Do not edit generated `.html` files by hand.**
2. Run `python3 tools/build.py` (Python 3, standard library only).
3. Commit.

## Reusing this for a real gym: every place to change
After any change run `python3 tools/build.py`; after colour or name changes also run `node tools/make-assets.mjs` (icons, favicon, share image).

| What | Where |
| --- | --- |
| **Business name** | `site.config.json` > `brand` (`name`, `nameHtml`, `fullName`, `fullNameHtml`, `wordmark` (HTML, use `&amp;`), `short`, `description`); the header wordmark text in `tools/templates/layout.html` (`brand-text`) and the SVG alt in the `og:image:alt` tag; the 404 base path uses `site.folder`; the `IE` monogram in `layout.html` (`#logo-mark`), `img/icon.svg` and `img/icon-maskable.svg`; the 3D plate logo text (`'IRON'` in `scene.js`); page titles and descriptions in `site.config.json` > `pages`; copy that names the club in `tools/templates/sections/*.html`, `data/faq.json`, `data/planfaq.json`, `data/coaches.json`, `data/journal.json` |
| **Phone** | `site.config.json` > `contact.phone` and `contact.phoneHref`; the placeholder `07 5550 ...` in `tools/templates/sections/trial.html`, `partials/visit-modal.html` |
| **Email, address, map** | `contact.email`, `contact.street`, `contact.locality`, `contact.postcode`, `contact.region`, `contact.mapsQuery` (drives the Google Maps embed and the "Open in Google Maps" link) |
| **Opening hours** | `site.config.json` > `hours` (open/close hour per day, 0 = Sunday). This drives the hours tables, the "Open now / Closed" chip, the trial time grid, structured data and the footer summary. The time zone is `site.timezone` (and the label shown to visitors elsewhere, `site.timezoneLabel`) |
| **Site address / folder** | `site.baseUrl`, `site.folder`, `site.noindex` (set to `false` at launch) |
| **Colours (CSS)** | `styles.css` `:root`: `--bg`, `--tint`, `--card`, `--card-2`, `--ink`, `--body`, `--muted`, `--accent`, `--accent-hi`, `--on-accent`. Yellow is used only for buttons, small labels and hover states |
| **Colours (other places)** | `site.config.json` > `theme` (`bg`, `card`, `accent`: browser theme colour and manifest); `scene.js` (`const ACCENT`, plus the rubber/chrome material colours); the inline SVG poster in `tools/templates/sections/hero.html` (`#FFE000`); `img/icon.svg`, `img/icon-maskable.svg` (`#ffe000`, `#0b0b0c`); the `%23ffe000` arrow in the `select` rule in `styles.css`; `tools/make-assets.mjs` re-renders the PNGs from the SVGs |
| **Prices: memberships** | `data/plans.json`: `monthly` and `annual` (per-month price when billed annually); the "from $79" wording in `site.config.json` (page descriptions, `searchExtra`) and `tools/templates/sections/offer.html` |
| **Prices: trial costs and passes** | The "Costs" item in `tools/templates/sections/offer.html`; day / week / 10-visit passes and voucher amounts in `tools/templates/sections/gift-cards.html`; the guest drop-in price text in `js/trial.js` ("$28 day pass") |
| **Classes and timetable** | `data/classes.json` (day, start time, minutes, name, type, coach id, level, capacity, description). "Spots left" is a deterministic demo number made in `tools/build.py` (`spots_for`) and the "full" slots in `js/trial.js` |
| **Coaches** | `data/coaches.json` (and their classes in `classes.json`) |
| **Offer wording (7-day trial)** | `tools/templates/sections/offer.html`, announcement text in `site.config.json` > `announcement` |
| **Hero** | Headline and buttons in `tools/templates/sections/hero.html`; background photo slot `hero`, or a video via `hero` > `video` / `poster` in `site.config.json` |
| **Photos** | `PHOTO-SLOTS.md` and `data/photos.json` (all 15 slots are filled; sources in `img/source/`, credits in `CREDITS-TODO.md`) |
| **Numbers (14 years, 3,200 members, 60 classes)** | `tools/templates/sections/results.html` (`data-count` and the visible text) |
| **Sample quote** | `tools/templates/sections/results.html` |

## Hero background and video
The hero background is the `hero` photo slot with a slow zoom. To use a looping video instead, set `"hero": {"video": "img/hero.mp4", "poster": "img/photos/hero.webp"}` in `site.config.json` and rebuild; a muted, looping, inline `<video>` layer is added on top of the still. Reduced-motion visitors get the still image (video paused, no zoom).

## How the 3D hero and its fallbacks work
`scene.js` builds a small barbell in code: a chrome bar with knurled grips, bevelled black rubber plates with thin yellow rings, yellow collars, rim lights, drifting chalk dust and chrome reflections from a RoomEnvironment built after the first frame. It rolls slowly, tilts toward the mouse, spins up when clicked or dragged, caps pixel ratio at 1.5, pauses off-screen or in a hidden tab, and steps quality down on slow devices. It starts after the window load event, browser idle and the intro (under 1.5 s).

The page always contains an inline SVG barbell poster. `js/hero.js` keeps it (and skips 3D) if WebGL is unavailable, the library fails, the context is lost, loading takes more than 4 seconds, Data Saver is on, or on a low-powered phone (screen or window 480px or narrower AND 4 or fewer cores or 4 GB or less memory). `?3d=on` forces 3D for testing. Reduced-motion visitors get a still frame and no smooth scroll.

## Tests
```
cd gym-demo
export CHROME_PATH=/path/to/chromium      # tests/node_modules needs playwright-core and axe-core (npm install in tests/)
ROOT=$PWD node tests/run.mjs [--suite=overflow,axe,links,func,fallback,perf]
```
They cover overflow on every page at 360 to 1920 px, axe (WCAG 2.2 AA, contrast 4.5:1) at 375 and 1440 px, tap targets and text sizes, links and anchors, home section order, the offer, timetable tabs, filters and deep links, the visit form, the trial booking flow, membership toggle, newsletter, search, announcement bar, cookie card, placeholders and the photo pipeline (in a temp copy, including the hero video), every 3D fallback path, and page weight. A full run takes about 5 minutes (3D is software-rendered in a sandbox).

## What is demo-only
The trial and visit forms, newsletter, careers and gift voucher forms validate in the browser and show a confirmation; nothing is sent. Bookings and visit requests are kept in this browser only (`vc-bookings`, `vc-visits`). See `CLIENT-CHECKLIST.md`.

## Design system notes
- **Type:** two families (Barlow Condensed 600/700 uppercase headings, Montserrat text). Heading scale 56 / 40 / 28 / 20 px on desktop, fluid to about 36 / 30 / 24 / 19 px on a phone. The home hero headline is display type (`--fs-display`), larger than the scale. Spacing is an 8px scale (`--space-1` to `--space-20`); sections have 96px (mobile) / 160px (desktop) padding.
- **Announcement bar:** one static line, dismissible (localStorage `vc-announce`). **Cookie card:** bottom-left, 300px max (`vc-cookie`).
- **404:** `404.html` is built from the `notfound` template with an inline `<base>` for `/gym-demo/`. GitHub Pages only serves the repo-root `404.html`, which must forward missing URLs inside this folder to it.
