# KB Web Designs

The website for KB Web Designs, a KB Ventures company: premium sites for local businesses in Melbourne.
Plain HTML, CSS and JavaScript. No frameworks, no build step on the server, no cookies, no tracking, no analytics.

Live: https://kirithikbala21-jpg.github.io/3D-demo-sites/black-crest-site/

## Pages
- `index.html` Home · `work.html` concept sites · `pricing.html` (packages, what is included, add-ons, comparison, price calculator)
- `process.html` · `care-plan.html` · `faq.html` · `about.html` · `quiz.html` · `contact.html` · `start.html`
- `for-barbers.html`, `for-cafes.html`, `for-gyms.html`, `for-tradies.html`, `for-salons.html`
- `guides/` (index and three guides)
- `free-concept.html`: the landing page for DMs (no menu, noindex). `qr.html`: a printable QR code for it.
- `thank-you.html` (after any form, noindex), `privacy.html`, `terms.html`, `404.html`

Every page shares `style.css` and the small ES modules in `js/` (`config.js`, `core.js`, `motion.js`, `menu.js`, `forms.js`, plus `hero3d.js` on the home page). Motion libraries are vendored in `vendor/` (see `vendor/VERSIONS.md`).

## The 3D card and the concept collection (home page only)
`js/hero3d.js` draws the black titanium member's card, and `js/gallery3d.js` the wall of six lit niches, with the vendored Three.js (`vendor/three`); `js/scene-kit.js` holds what they share (brushed metal, basalt, the soft floor reflection).
They load only on the home page, when the browser is idle (the gallery when its section comes near), and only on capable desktops:
not with reduced motion, Data Saver, 4 or fewer CPU cores, 4 GB of memory or less, or software-only graphics. Everyone else sees still images of the same scenes, with the same six links on top.
Add `?3d=on` to the home page address to skip the device checks when testing.

## Tools (run from the repo root, with `python3 -m http.server 8123 --bind 127.0.0.1` running there)
- `python3 black-crest-site/tools/build.py`: writes every page, `style.min.css`, the sitemap and robots.txt. Run it after any change.
- `node black-crest-site/tools/check.mjs`: checks every page at 390, 768, 1280 and 1920 px (console errors, failed requests, broken links, sideways scrolling, prices, banned words, no the private real-shop demo links, and the house-style bans in `../CLAUDE.md`). Screenshots land in `tools/screens/`, which git ignores. `--quick` checks two widths without screenshots.
- `python3 black-crest-site/tools/make-logo.py`: the hallmark (crest outline and BC letter shapes) for the header, favicon and card (needs fontTools).
- `node black-crest-site/tools/render-still.mjs`: the card stills, `img/og.jpg`, the app icons and `favicon.ico`.
- `node black-crest-site/tools/render-gallery.mjs`: the gallery stills (whole wall, each niche, each case study niche) and `tools/gallery.json`.
- `python3 black-crest-site/tools/make-chapters.py`: builds the trade chapter photos from originals in `assets/chapters/originals/` (see below).
- `node black-crest-site/tools/record-reel.mjs`: the showreel (`assets/reel.*`). Needs ffmpeg.
- `node black-crest-site/tools/make-images.mjs`: the concept screenshots in `img/work/` and the before/after images.

## New chapter photos
Upload `cafes.jpg`, `gyms.jpg`, `trades.jpg` and `salons.jpg` (the Unsplash photos listed in `tools/make-chapters.py`) into `assets/chapters/originals/`, then run `make-chapters.py` and `build.py`. The credits page adds the photographers by itself.

## Styles
Edit `style.css` (it is in sections: tokens, base, layout, components, pages, motion, reduced motion and print). Pages load `style.min.css`, which `build.py` writes from it.

## Changing prices
All prices live in the `CONFIG` object in `js/config.js`: One Page, Full Website, the care plan and the add-ons.
The add-on prices are placeholders: replace them with your real "from" prices. Then run:

    python3 black-crest-site/tools/build.py

That rewrites every page, so the prices also show without JavaScript and in the structured data.

## Changing text
The page text is in `tools/build.py` (one block per page). Edit it and run the same command. Do not edit the `.html` files by hand: the next build overwrites them.

## Phone number
`"phone": ""` in `CONFIG` (`js/config.js`). While it is empty, every call button is hidden. Add a number (like `"0400 000 000"`) and the call buttons appear in the phone bar and on the contact page.

## Forms
All forms post to Web3Forms with the same access key as the KB Ventures site. `tools/build.py` copies the key from `kbventures-site/site.config.json` (`formAccessKey`), so change it there. Messages go to the inbox that key is linked to in Web3Forms (kb.ventures@outlook.com).
Each form has a hidden spam trap (`botcheck`) and a subject line naming the form, and goes to `thank-you.html` after sending. Without JavaScript the forms still post, and Web3Forms sends people to `thank-you.html`.
The price calculator and the quiz pass their choices to the contact form in the tab's sessionStorage, never in the address.

## Images
`node black-crest-site/tools/make-images.mjs` (with a local server on port 8123 at the repo root) remakes:
the desktop (1600 and 800 wide) and phone (600 x 1300) screenshots of the six demos in `img/work/` and the before and after images, each as WebP, AVIF and JPEG. The share image and app icons come from `tools/render-still.mjs`.
The demo folders are only opened, never changed. Made-up ratings inside the demos are hidden in the screenshots.
`img/favicon.svg` is drawn by hand. The "before" image is a made-up dated homepage, labelled "Example, not a real customer" on the site.

## QR code
`img/qr-free-concept.svg` is a static file made once by `tools/make-qr.py` (needs `pip install segno`). Remake it if the address changes.

## Moving to your own domain
1. Change `SITE` at the top of `tools/build.py` and `URL` in `tools/make-qr.py`, then run both.
2. Update the two `Disallow` lines in `robots.txt` (they hold the GitHub Pages path).
3. GitHub Pages only uses the repo's root `404.html` for this project site; `404.html` here takes over once the site has its own domain.

## Adding a booking link later
Add it as a button in `tools/build.py` (for example next to "Get a free concept" in the hero and the phone bar), then rebuild.

## Fonts
Cormorant Garamond (display) and Switzer (text), self-hosted in `fonts/` with their licences. Switzer stands in for General Sans, which could not be downloaded in the build environment: see `fonts/switzer-LICENSE.txt` to switch.

