# Ember & Oak Coffee: concept demo v2 (cinematic, multi-page)

A fictional café website built as a sales demo: dark, minimal, editorial, with a full-screen 3D hero. **Everything is fictional** (name, address, phone, prices, reviews, team, press, news, numbers). The footer reads "Concept demo by KB Ventures. Not a real business." and pages are `noindex`. The original single-page version is untouched in `../cafe-demo/`.

Plain HTML, CSS and JavaScript. No framework, no bundler, no third-party requests (Three.js and the fonts are hosted in this folder). The HTML pages are **generated** from templates by a small Python script and committed, so GitHub Pages serves them as-is.

## Pages
`index` (home) · `menu` (41 items in Coffee, Tea, Food, Bakery, Cold drinks and Evening; pick-up ordering, PDF) · `shop` · `experiences` (tours, workshops, events, gift cards) · `story` · `sustainability` · `visit` (hours, map, FAQ) · `reserve` (booking form with time slots) · `journal` · `careers` · `wholesale` · `press` · `legal` (privacy, terms, cookies).

Site-wide: news ticker (pausable), full-screen menu, site search (press `/`), order drawer, scripted chat assistant, compact cookie bar, optional ambient sound (a visible "Ambient sound: Off/On" button), a branded intro of about one second on the first visit, Lenis smooth scrolling (off for reduced motion), scroll-reveal, magnetic buttons on desktop, a header that shrinks on scroll, sticky Call / Reserve bar on phones.

## Folder map
| Path | What it is |
| --- | --- |
| `site.config.json` | Brand, contact, hours, time zone, colours, nav, page list, news ticker, hero video slot |
| `data/*.json` | Menu, products, journal posts, jobs, press quotes, FAQ |
| `tools/templates/` | `layout.html` (shared header/footer), `pages/` and `sections/` content blocks |
| `tools/build.py` | Builds every `.html` page, `search-data.js` and `sitemap.xml` |
| `tools/make-assets.mjs` | Makes the PNG icons, `img/og.png` (a real screenshot of the 3D hero, 1200x630) and `menu.pdf` |
| `tools/add-photo.py` | Adds a real photo to a slot (resize, WebP under 250 KB, alt + credit, rebuild). See "Photos" |
| `data/photos.json` | The photo slots (gallery tiles and the three feature rows) |
| `styles.css`, `main.js`, `js/*.js`, `scene.js` | Styles, behaviour modules, the 3D scene |
| `vendor/`, `fonts/` | Self-hosted Three.js 0.160.0, Lenis 1.1.18 (MIT) and Montserrat / Mrs Saint Delafield |
| `tests/run.mjs` | Automated checks (see below) |

## Making changes
1. Edit `site.config.json`, a file in `data/`, or a template in `tools/templates/`. **Do not edit the generated `.html` files by hand.**
2. Run `python3 tools/build.py` (Python 3, standard library only).
3. Commit the changed files. A GitHub Action rebuilds and fails if the committed pages are out of date.

Common edits:
- **Name, address, phone, email, hours, colours, time zone:** `site.config.json`. Hours drive the hours table, the "Open now" chip, the booking time slots, the chat answers and the search-engine data. The "Open now" status uses the café's time zone, not the visitor's.
- **Menu:** `data/menu.json` (categories, items, prices, tags `V VG GF DF`, `sig` for a Signature star). Optional photo per item: add `"img": "img/dish.jpg", "imgAlt": "..."`.
- **Shop, journal, jobs, press, FAQ:** the matching file in `data/`.
- **Experiences, events, gallery, story, reviews, gift cards:** the files in `tools/templates/sections/`.
- **Hero background video:** set `hero.video` (and `hero.poster`) in `site.config.json`, for example `"video": "img/hero.mp4"`. It plays muted and looped behind the burgundy panel, and is paused for visitors who prefer reduced motion.
- **After changing the menu:** run `node tools/make-assets.mjs` to refresh `menu.pdf`.

## Photos
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
node run.mjs                              # all suites, or --suite=overflow,axe,links,func,fallback,perf,final
```
They cover: no horizontal overflow on all 13 pages at 360, 375, 414, 768, 1024, 1280 and 1920 px; axe-core accessibility on every page at 375 and 1440 px; tap targets, text sizes, links and anchors; the menu, ordering, search, chat, forms, cookie banner, time slots and menu overlay; every fallback path; the pixel-ratio cap; hours, tagline, counters, nav labels, titles and SEO tags on every page; the intro finishing in under 1.5 s; smooth scrolling and its pause while menus are open; the cookie bar's position; and a final sweep of every page at 1440x900 and 390x844 (no horizontal scroll, no broken images, no overlapping text, no console errors or 404s); and page weight with no third-party requests. The same checks run on GitHub Actions for every change to this folder.

## What is demo-only
The booking, careers, wholesale, newsletter, gift card and order forms validate in the browser and show a confirmation; nothing is sent. A confirmed order and a confirmed reservation are also kept in this browser's localStorage (`eo-orders`, `eo-reservations`) so you can see the flow end to end. Look for the `DEMO ONLY` comments. See `CLIENT-CHECKLIST.md` for turning this into a real site.
