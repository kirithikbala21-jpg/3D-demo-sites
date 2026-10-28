# KB Ventures main site

One page (`index.html`) plus a 404 page, in plain HTML, CSS and JS. No build step, no trackers, no CDNs: the fonts and Lenis smooth scroll are copied into this folder. The design system (colours, type, spacing, rules) and the notes from the reference page are in `brand.md`.

Live: https://kirithikbala21-jpg.github.io/3D-demo-sites/kbventures-site/

## Files
- `site.config.json`: the one file to edit. It holds **all the page text** (hero, labels, cards, contact, footer, page title and description), the email and location, the demo list and note, and optional fields (see below).
- `index.html`, `styles.css`, `main.js` (smooth scroll that stops below the sticky nav, active nav link, phone menu, the hero card's parallax, slow fade-ups, the concept-websites carousel, missing-image handling, and all text from the config; every text element is marked `data-c="path.in.config"`)
- `hero.js` and `scene.js`: the 3D metal-and-glass card in the hero (Three.js). It only runs with a real graphics card; reduced motion, Data Saver, low-powered phones and software WebGL get the still image. `?3d=off` shows the still image, `?3d=on` forces 3D.
- `img/hero-object.webp`: the still of the same object, used while the 3D loads and whenever it can't run. Rebuild it with `tools/render-hero-still.mjs` after changing `scene.js`.
- `img/grain.png`: the film-grain tile laid over the page at 3.5%
- `legal/privacy.html`, `legal/terms.html`, `legal/refunds.html` and `legal/legal.js`: the legal pages (see Legal pages below)
- `404.html`: page-not-found page (works both in this folder and at the root of its own repo)
- `img/`: demo screenshots as one matching set (`<demo>-desktop.webp` 1280x800 from a 1440x900 window, `<demo>-tall.webp` 1280x1956 from the top 1440x2200 of the page, which scrolls slowly inside the browser frame on hover or keyboard focus, and `<demo>-mobile.webp` 480x1039 from a 390x844 phone). The browser and phone frames are drawn in CSS so they are identical for every demo.
- `img/aceguides/`: AceGuides study-guide covers (720x960 WebP, 21 of them: Year 10, VCE Units 1 & 2 and Units 3 & 4). The AceGuides card shows the five listed in `businesses.aceguides.covers`.
- `tools/screenshot-demos.mjs`: rebuilds the demo screenshots; `tools/render-hero-still.mjs`: rebuilds the hero still; `tools/make-covers.py`: rebuilds the covers in the site font (needs Python with `playwright` and `pillow`; only WebP files are saved, never PNGs). Instructions are at the top of each file.
- Logo files in `img/` (use these as given; don't redraw them):
  - `kb-wordmark.svg`: the full KB Ventures logo (silver KB, gold line, VENTURES). Used in the footer and the share image. The artwork sits in the middle third of the file, so give it room.
  - `kb-wordmark-white.svg` and `kb-wordmark-black.svg`: one-colour versions for print or light backgrounds.
  - `kb-favicon.svg`: the square KB mark. Used in the nav and as the browser-tab icon.
- Icons made from `kb-favicon.svg`: `favicon.ico` (16/32/48), `favicon-32.png`, `apple-touch-icon.png` (180), `img/icon-192.png`, `img/icon-512.png`
- `og.jpg`: the 1200 x 630 share image (the full wordmark on the dark lit background, with "Study guides and websites, made in Melbourne")
- `fonts/geist-latin.woff2`: Geist variable font (all weights in one file; the page uses 300, 400 and 500), SIL Open Font License (`geist-OFL.txt`)
- `vendor/`: Lenis 1.1.18 (its small CSS is folded into `styles.css`) and Three.js r160 (`three.module.min.js`). `RoomEnvironment` and `lenis-1.1.18.css` are no longer loaded.

## Add a website demo
1. Open `site.config.json` and add one entry to `demos`:
   `{ "type": "Dentist", "name": "Real name from that demo's site.config.json", "line": "One line from its brand.md or config", "url": "https://.../the-demo/", "desktop": "img/dentist-desktop.webp", "mobile": "img/dentist-mobile.webp", "tall": "img/dentist-tall.webp" }`
2. Add the demo to `DEMOS` in `tools/screenshot-demos.mjs` and run it to make the three images.
3. Do not invent names or descriptions: copy them from the demo itself. Leave out real businesses and unfinished sites (parts-store-demo and the-one-barber-demo are left out on purpose).
4. Also add the same card to the `track` list in `index.html`. `main.js` rebuilds the list from the config, but the HTML copy is what shows when the config cannot load (for example if you open the file straight from disk).

The carousel builds its dots from however many cards there are, so nothing else needs changing.

## Optional fields (empty = not shown)
- `aceguidesShopUrl`: the AceGuides shop address (must start with `https://`). While it is blank, the AceGuides card shows the quiet line "Guides launching soon" (`businesses.aceguides.noShopLine`); once filled in it shows a "See the guides" button instead.
- `instagram`, `linkedin`: full `https://` addresses; each adds a footer link (and a `sameAs` entry in the structured data).
- `legal.abn`: shown in the footer and on the legal pages as "ABN …" (see Legal pages below).
- `testimonials`: a list of `{ "quote": "...", "name": "...", "business": "..." }`. Only real quotes, word for word, with the person's real name. The section stays hidden while the list is empty, and any entry without a quote or a name is skipped.

## Other config fields
- `how.steps`: the three steps of "How it works" (title and one line each). Keep them to three; each has its own line icon in `index.html`.
- `businesses.aceguides.covers`: up to five `{ "src": "img/aceguides/....webp", "alt": "..." }` covers for the fanned stack. No prices, ratings or labels on them.
- `businesses.kbwebsites.preview`: the screenshot in the KB Websites card (`src` and `alt`).
- `footer.vceTrademark`: the VCE trademark line. Keep it while the covers mention VCE.

Never put invented facts, reviews, prices or numbers in the config.

## Legal pages
The privacy, terms and refunds pages live in `legal/`. Their names, email, state, ABN and date come from the `legal` block in `site.config.json`, filled in by `legal/legal.js`. The HTML holds the same text, so the pages still read correctly if JavaScript is off; if you change a value in the config, change it in the three HTML files too so both copies match.
- **Update the date:** whenever you change the wording of any legal page, set `legal.lastUpdated` (for example `"12 March 2027"`). It appears under each page title.
- **Add an ABN:** put it in `legal.abn` (for example `"12 345 678 901"`). It then appears in the footer of every page and in the Contact section of each legal page. While it is empty, no ABN line is shown at all.
- `legal.tradingName`, `legal.brands`, `legal.contactEmail` and `legal.state` fill the matching words in the pages. Never add a personal name, age, home address or phone number.
- `legalBaseUrl` is the public address of the `legal/` folder. The AceGuides and KB Websites sites should link their footers to `legalBaseUrl + "privacy.html"`, `"terms.html"` and `"refunds.html"`, so every brand uses these same pages.
- The footer of every page links Privacy · Terms · Refunds; the labels are `footer.privacy`, `footer.terms` and `footer.refunds`.
- The pages are plain English and are not legal advice. Have them checked before relying on them for a large business.

## Move to its own repo (kbventures.github.io)
1. Create an empty repo called `kbventures.github.io` under the `kbventures` GitHub account or organisation.
2. Copy the contents of this folder (not the folder itself) into the repo root and commit to `main`.
3. In the repo's Settings > Pages, choose "Deploy from a branch", `main`, `/ (root)`. The site appears at https://kbventures.github.io/, and `404.html` is used for missing pages.
4. Update the `canonical`, `og:url` and `og:image` addresses at the top of `index.html` to the new address.
5. Remove `kbventures-site/` from the 3D-demo-sites repo if you no longer want the old address.
