# Black Crest Web Designs

The website for Black Crest Web Designs, a KB Ventures company: premium sites for local businesses in Melbourne.
Plain HTML, CSS and JavaScript. No frameworks, no build step on the server, no cookies, no tracking, no analytics.

Live: https://kirithikbala21-jpg.github.io/3D-demo-sites/black-crest-site/

## Pages
- `index.html` Home · `work.html` concept sites · `pricing.html` (packages, what is included, add-ons, comparison, price calculator)
- `process.html` · `care-plan.html` · `faq.html` · `about.html` · `quiz.html` · `contact.html` · `start.html`
- `for-barbers.html`, `for-cafes.html`, `for-gyms.html`, `for-tradies.html`, `for-salons.html`
- `guides/` (index and three guides)
- `free-concept.html`: the landing page for DMs (no menu, noindex). `qr.html`: a printable QR code for it.
- `thank-you.html` (after any form, noindex), `privacy.html`, `terms.html`, `404.html`

Every page shares `style.css` and `main.js`.

## Changing prices
All prices live in the `CONFIG` object at the top of `main.js`: One Page, Full Website, the care plan and the add-ons.
The add-on prices are placeholders: replace them with your real "from" prices. Then run:

    python3 black-crest-site/tools/build.py

That rewrites every page, so the prices also show without JavaScript and in the structured data.

## Changing text
The page text is in `tools/build.py` (one block per page). Edit it and run the same command. Do not edit the `.html` files by hand: the next build overwrites them.

## Phone number
`"phone": ""` in `CONFIG` (main.js). While it is empty, every call button is hidden. Add a number (like `"0400 000 000"`) and the call buttons appear in the phone bar and on the contact page.

## Forms
All forms post to Web3Forms with the same access key as the KB Ventures site. `tools/build.py` copies the key from `kbventures-site/site.config.json` (`formAccessKey`), so change it there. Messages go to the inbox that key is linked to in Web3Forms (kb.ventures@outlook.com).
Each form has a hidden spam trap (`botcheck`) and a subject line naming the form, and goes to `thank-you.html` after sending. Without JavaScript the forms still post, and Web3Forms sends people to `thank-you.html`.
The price calculator and the quiz pass their choices to the contact form in the tab's sessionStorage, never in the address.

## Images
`node black-crest-site/tools/make-images.mjs` (with a local server on port 8123 at the repo root) remakes:
the phone screenshots of the six demos (`img/work/`), the before and after images, the share image `img/og.jpg`, and the app icons.
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
Cormorant Garamond and Inter (Google Fonts, SIL Open Font License), served from `fonts/` so no request goes to Google.
