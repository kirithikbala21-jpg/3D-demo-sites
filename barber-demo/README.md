# Brass & Blade Barbershop: concept demo

A fictional barbershop website built as a sales demo: navy, red and brass, condensed headings, and a full-screen 3D spinning barber pole in the hero. **Everything is fictional** (name, address, phone, prices, reviews, team, numbers). The footer reads "Concept demo by KB Ventures. Not a real business." and pages are `noindex`. It shares its build system and tests with `../cafe-demo-v2/`, which is untouched.

Plain HTML, CSS and JavaScript. No framework, no bundler, no third-party requests (Three.js and the fonts are hosted in this folder). The HTML pages are **generated** from templates by a small Python script and committed, so GitHub Pages serves them as-is.

## Pages
`index` (home) · `services` (24 services with prices and durations, price list PDF) · `barbers` (the crew, with book-with-this-barber links) · `book` (booking form with duration-aware time slots) · `shop` (grooming products) · `membership` (plans and gift cards) · `journal` · `visit` (hours, map, FAQ) · `careers` · `legal`.

Site-wide: a calm dismissible announcement bar, full-screen menu, search (press `/`), "Your visit" drawer (add services or products, then book), cookie preferences, optional shop ambience, branded intro on first visit, sticky Call / Book bar on phones.

## Folder map
| Path | What it is |
| --- | --- |
| `site.config.json` | Brand, contact, hours, time zone (Sydney), colours, nav, page list, announcement bar text |
| `data/*.json` | Services, products, journal posts, jobs, FAQ |
| `tools/templates/` | `layout.html` (shared header/footer), `pages/` and `sections/` |
| `tools/build.py` | Builds every `.html` page, `search-data.js` and `sitemap.xml` |
| `tools/make-assets.mjs` | Makes the PNG icons, `price-list.pdf` and `img/og.png` (a real screenshot of the 3D hero) |
| `tools/add-photo.py` | Adds a licensed photo to a slot: resizes to 1600px, WebP under 250 KB, records alt text and credit |
| `data/photos.json` | Photo slots (gallery, signature services, barbers) with alt text and photographer credits |
| `styles.css`, `main.js`, `js/*.js`, `scene.js` | Styles, behaviour modules, the 3D barber pole |
| `vendor/`, `fonts/` | Self-hosted Three.js 0.160.0, Lenis 1.1.18 (smooth scroll), Montserrat and Oswald |
| `tests/run.mjs` | Automated checks |

## Making changes
1. Edit `site.config.json`, a file in `data/`, or a template. **Do not edit generated `.html` files by hand.**
2. Run `python3 tools/build.py` (Python 3, standard library only).
3. Commit. A GitHub Action rebuilds and fails if committed pages are out of date.

Hours, time zone, colours and contact details live in `site.config.json` and drive the hours table, the "Open now" chip, booking slots and search-engine data. After changing services run `node tools/make-assets.mjs` to refresh `price-list.pdf`. The hero background video can be set with `hero.video` / `hero.poster`.

## Photos
The hero background, "Our story" background, the three signature-service panels and all eight gallery tiles use real photos (originals and crops in `img/source/`, compressed WebP in `img/photos/`). Credits currently read "Photo: Unsplash"; see `CREDITS-TODO.md` for the photographer names still to add. The four barber portraits are still monogram circles. Every slot lives in `data/photos.json`; slots with no file fall back to an illustration. Add licensed photos (Unsplash or Pexels are fine) with:
```
python3 tools/add-photo.py ~/Downloads/chair.jpg gallery6 --alt "Leather barber chair under warm light" --credit "Jane Doe / Unsplash"
python3 tools/build.py
```
The photo replaces the illustration, gets a slow zoom on scroll and a dark/gold overlay, and the credit appears in the footer automatically. Suggested shots: barber at work, hot towel, razor, interior, barbershop chairs, a portrait of each barber. For one photo per service row, add `"img"` and `"imgAlt"` to an item in `data/menu.json`.

## How the 3D hero and its fallbacks work
`scene.js` builds the pole in code: helical red, white and blue stripes that scroll inside a glass tube, brass caps and wall mount, red and blue glows and drifting dust. It tilts toward the mouse, speeds up when clicked or dragged, caps pixel ratio at 1.5, pauses off-screen or in a hidden tab, and steps quality down on slow devices.

The page always contains an inline SVG barber pole with animated stripes. `js/hero.js` keeps the SVG if WebGL is unavailable, the library fails, the context is lost, loading takes more than 4 seconds, or Data Saver is on. Reduced-motion visitors get a still frame.

## Tests
```
cd tests
npm install
npx playwright-core install chromium     # or set CHROME_PATH
node run.mjs                              # all suites, or --suite=overflow,axe,links,func,fallback,perf
```
They cover overflow on every page at 360 to 1920 px, axe accessibility at 375 and 1440 px, tap targets and text sizes, links and anchors, services tabs, the visit drawer, search, announcement bar, booking validation and time slots, cookie banner, menu overlay, every fallback path, the pixel-ratio cap and page weight.

## What is demo-only
Booking, careers, newsletter, gift card and visit forms validate in the browser and show a confirmation; nothing is sent. See `CLIENT-CHECKLIST.md`.

## Design system notes
- **Type:** two families only (Oswald for headings, Montserrat for text). Heading scale 56 / 40 / 28 / 20 px on desktop, fluid down to about 36 / 30 / 24 / 19 px on a phone (`--fs-h1` to `--fs-h4`). Spacing is an 8px scale (`--space-1` to `--space-20`).
- **Photos:** one look for every photo (warm sepia and lowered saturation, one dark gradient, a 1px gold hairline and 6px corners; full-bleed hero and section photos skip the border and radius). Set each photo's crop with a `pos` value in `data/photos.json`.
- **Announcement bar:** one static line, dismissible (remembered in `localStorage` key `bb-announce`). Edit the text in `site.config.json` under `announcement`.
- **Find us:** a lazy-loaded Google Maps embed (no API key) of the placeholder location from `contact.mapsQuery`, plus the hours table with an "Open now / Closed" chip computed from the visitor's clock in the shop's time zone.
- **404:** `404.html` is built from the `notfound` template. GitHub Pages only serves the repo-root `404.html`, which forwards missing URLs inside this folder to it.
- **3D hero:** the still poster shows instantly; 3D starts after the page load event and the intro, and is skipped on low-powered phones (small screen with 4 or fewer cores), Data Saver, or no WebGL.
