# KB Ventures main site

The company "lobby": Home, About, Contact, legal pages and a 404 page, in plain HTML, CSS and JS. No build step, no trackers, no CDNs: the fonts and Lenis smooth scroll are copied into this folder. The design system (colours, type, spacing, rules) and the notes from the reference page are in `brand.md`.

Live: https://kirithikbala21-jpg.github.io/3D-demo-sites/kbventures-site/

## Pages
- `index.html`: Home (hero, Our businesses, How we build, Our standard, About, Quick questions, Get in touch)
- `aceguides.html`: the AceGuides shop (see "AceGuides shop" below)
- `businesses.html`, `how-we-work.html`, `faq.html`, `partner.html`, `about.html`, `contact.html` (the contact form), `404.html`
- `legal/privacy.html`, `legal/terms.html`, `legal/refunds.html`

## After editing the config
The pages read `site.config.json` in the browser, so a change shows up as soon as it is pushed. Then run
`python3 kbventures-site/tools/build-pages.py` and commit the result: it rewrites the HTML copy of every page except the legal pages from the config, so search engines, share previews, visitors without JavaScript and the FAQ structured data match it. It also refreshes the 404 copy at the repo root.

## Files
- `site.config.json`: the one file to edit. It holds the company details, social links, the list of businesses, the form key and **all the page text**. Every text element in the pages is marked `data-c="path.in.config"`.
- `site.js`: shared by every page. It draws the **top bar, phone menu and footer** from the config, so they change in one place. It also runs smooth scrolling (Lenis, on Home, About and Contact), the bar's hide-on-scroll, the Businesses dropdown, and fills in page text, email links and social icons. Each page holds a small plain copy of the bar and footer that shows only without JavaScript.
- `main.js`: page effects for Home and the inner pages (business cards and FAQ accordions from the config, the tilt on the standard cards, parallax, fade-ups). `tools/build-pages.py`: rebuilds the pages from the config (see above). `contact.js`: the contact form. `legal/legal.js`: the brand list and ABN line on the legal pages.
- `styles.css`: all styles. `brand.md`: the design system.
- `hero.js` and `scene.js`: the 3D metal-and-glass card in the hero (Three.js). It only runs with a real graphics card; reduced motion, Data Saver, low-powered phones and software WebGL get the still image `img/hero-object.webp`. `?3d=off` shows the still image, `?3d=on` forces 3D.
- `404.html`: works at any address. It reads the site folder from the address, or falls back to `BASE` at its top (keep that equal to `basePath` in the config). A byte-for-byte copy sits at the repo root (`/404.html`), because GitHub Pages only uses the root one for this project site. If you change one, copy it over the other.
- `sitemap.xml` and `robots.txt`: all public pages. (The repo-root `robots.txt` also points at this sitemap.)
- `img/aceguides/`: AceGuides covers (720x960 WebP), made by `tools/make-covers.py`. `img/<demo>-*.webp`: demo screenshots, made by `tools/screenshot-demos.mjs` (one is used on the Black Crest Web Designs card).
- Logo files in `img/`, used exactly as supplied: `kb-wordmark.svg` (the top bar from 720px wide, and the footer), `kb-favicon.svg` (the top bar on phones, the About section and the browser-tab icon), and the white and black one-colour versions. Icons made from the mark: `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `img/icon-192.png`, `img/icon-512.png`. `og.jpg` is the share image.
- `fonts/geist-latin.woff2` (SIL Open Font License, `geist-OFL.txt`); `vendor/`: Lenis 1.1.18 and Three.js r160.

## Add a business
Add one entry to `businesses` in `site.config.json`. Nothing else needs changing: the Home card, the footer list and the Businesses dropdown are all built from this list.
```json
{ "name": "New business", "description": "One line about it.", "status": "coming-soon", "url": "", "ctaLabel": "Visit",
  "image": "img/new-business.webp", "imageAlt": "What the picture shows", "imageSize": [1280, 800] }
```
- `shortName` (optional): a shorter name used only in the footer's narrow Businesses column (for example "Black Crest" for Black Crest Web Designs). Everywhere else shows `name`.
- `status`: `"coming-soon"` or `"live"`. A business counts as live only when the status is `"live"` **and** `url` is a full `https://` address or a page in this folder (like `"aceguides.html"`). Then its card becomes one big link with an "Available now" badge (`nav.live`) and `ctaLabel` with an arrow, and its footer and dropdown entries become links. While coming soon, the card is not a link, has no hover lift, and says "Coming soon".
- `image`: one picture (shown filling the card's picture area; add `"imageFrame": "browser"` to show it in a browser frame), or a list of up to five (shown as a fanned stack, like AceGuides), with `imageAlt` as one text or a matching list. Images must be in `img/`. Use WebP and give `imageSize` as `[width, height]`.
- **The "More coming" card:** it always shows on the Businesses page. On Home it shows only when `"showMoreComingCard": true`; set it to `false` to hide it there. Its title is `home.businesses.moreComing`.
- Keep `description` to one short line: the main site carries only these. Everything else about a business goes on its own site.

## AceGuides shop (`aceguides.html`)
Everything on the page comes from the `aceguides` block in `site.config.json`; run `tools/build-pages.py` after any change.
- `groups`: the four headings ("Year 10", "VCE Units 1 and 2", "VCE Units 3 and 4", "Bundles"), each with a list of `products`:
```json
{ "key": "y11-english", "subject": "English", "level": "VCE Units 1 and 2", "price": 14.99,
  "link": "https://buy.stripe.com/...", "cover": "img/aceguides/vce12-english.webp", "coverAlt": "..." }
```
- `link`: the Stripe payment link. With a link the card shows "Buy now" (new tab, `rel="noopener"`). With `"link": ""` it shows a disabled "Coming soon" button and a "Notify me" link to the Home sign-up (`notifyHref`). To open a guide for sale, just paste its link.
- `price`: a number in AUD, shown on the card and in the Product structured data. Every guide needs one, and it must match the price in Stripe.
- `cover`: a file in `img/aceguides/` (720x960 WebP). Without one, the card shows a plain style tile with the subject name.
- Product structured data (Google) is added for every guide with a link and a price.
- `inside`, `chooser`, `delivery`, `questions`, `policies` and `vcaa` hold the rest of the page text. `meta` holds the page title and description.

## Home page sections (all in `site.config.json`)
Home runs: hero, Our businesses (with the Concept sites gallery), Latest, How we build, Our standard, Who’s behind it, Quick questions, Get updates, Get in touch.
- **Hero line** (`home.hero.intro`) sits under the heading; `home.hero.line` is the smaller location line below it. After editing any of these, run `tools/build-pages.py` (see above).
- **"See inside" previews** (`businesses[].previews`): up to three small images under a business card's description. `frame` is `"cover"` (study guide covers) or `"browser"` (a website in a small browser frame), `size` is the images' `[width, height]`, and each item has `src` and `alt`. The website previews in `img/previews/` are made by `tools/make-previews.mjs` (the top of barber-demo, cafe-demo-v2 and gym-demo at 1440px wide). Run it again after those demos change.
- **Latest** (`latest`): a title and a list of `{ "label", "text", "link" (optional), "linkLabel" (optional) }`. Keep each item true: no invented dates or numbers.
- **How we build** (`process`): each step has `title`, `line`, `line2` (the second sentence on Home) and `detail` (How we work page).
- **Our standard:** the three cards come from `standards`; the four small points under them from `standardPoints` (`{ "icon", "title", "text" }`; icons: `pin`, `tag`, `refund`, `chat`).
- **Concept sites gallery** (`gallery`): shown on Home and the Businesses page. Each item has `name`, `label` ("Concept site: barbershop"), `url` (opens in a new tab), `image` and `alt`. List only made-up businesses: the line under the heading says they are not real businesses (the-one-barber-demo is a concept for a real shop, so it is left out). The images come from `tools/make-previews.mjs`.
- **Get updates** (`signup`): one email box and the Privacy Policy tick, sent to Web3Forms with the same `formAccessKey` as the contact form, the subject "New update sign-up" and the hidden topic "Updates sign-up". The same `botcheck` spam trap is used.
- **Milestones** (`milestones`): shown on the About page; each item has a `date` and one factual line. The Latest cards have a `date` too.
- **About page** (`about`): `story` (a few sentences), `standardsTitle`, and `never` (title and items). **Partner page** (`partner`): `whoTitle` and `who`, `nextTitle` and `next` (the numbered steps).
- **FAQ search** (`faqPage.searchLabel`, `searchPlaceholder`, `noMatch`): filters the questions as you type.
- **Who’s behind it** (`who` for the title and button labels, `founder` for the rest): `title`, `name`, `bio`, `button`, `photoAlt` and `photo`. **To add the photo:** save a square image as `img/founder.webp` (at least 480 x 480), set `"photo": "img/founder.webp"`, then run `tools/build-pages.py`. While `photo` is empty, a KB monogram fills the same round frame, so there is never a broken image.

## FAQ questions
The questions live in one place, `faq` in `site.config.json`. Home and the Contact page show the first three, and the FAQ page shows all of them, with matching FAQPage structured data.
```json
{ "q": "The question?", "a": "The answer. Read more on the Refunds page.", "links": [{ "text": "Refunds page", "href": "legal/refunds.html" }] }
```
- `links` is optional: each `text` must appear word for word in the answer, and that part becomes the link (`href` is a page in this site, a `mailto:` or an `https://` address).
- The order in the list is the order on the page, so the first three are the ones on Home and Contact.
- After editing, run `tools/build-pages.py` (see above) so the structured data and the plain HTML copy match.

The four steps (How we build / How we work) are in `process`, and the three standards (Clear, Fair, Well made) in `standards`. Each has a short `line` for Home and a longer `detail` for How we work.

## Contact form (Web3Forms)
The form is connected: `formAccessKey` in `site.config.json` holds the site's Web3Forms access key. This key is public by design (Web3Forms keys are meant to sit in the page's code), so it is fine in this repo. Messages are emailed to the address the key was created with.
- Each message is sent as JSON to `https://api.web3forms.com/submit` with the subject "New message from KB Ventures website", from "KB Ventures Website", and the fields name, email, phone, business, topic and message, plus the `botcheck` honeypot field.
- **To change the key** (for example if you make a new one at https://web3forms.com, or want messages sent to a different inbox), replace the value of `formAccessKey`, commit and push.
- **If `formAccessKey` is empty,** Send opens the visitor's email app with the message filled in instead (and says so on the page), so no message is lost.
- A hidden `botcheck` box catches simple spam bots: if it is ticked, nothing is sent. The Privacy Policy tick box must be ticked before anything is sent.
- A link to `contact.html?topic=partnership` (or `aceguides`, `black-crest`, `general`, `other`) preselects that choice in "What's it about?"; the choices are `contactPage.topics`.
- To test without sending real messages, mock the request (as in a Playwright route) rather than submitting the live form.

## Company details, ABN and social links
- `company`: name, tagline (the Home headline), location, email. The email is used everywhere on the site.
- **ABN:** put it in `company.abn` (for example `"12 345 678 901"`). It then shows as "ABN …" in the footer of every page and in the Contact section of each legal page. While it is empty, no ABN line appears anywhere.
- **Social links:** change the addresses in `socials` (`instagram`, `tiktok`, `x`). Each must be a full `https://` address; an empty one hides its icon. They appear in the footer, on the Contact page and in the structured data (`sameAs`).
- `basePath` is the site's folder on its web address (`/3D-demo-sites/kbventures-site/` now, `/` on its own domain). `siteUrl` is the full address.

Never put personal names, ages, photos, addresses or phone numbers in the config, and no invented facts, counts, results, reviews or "trusted by" lines.

## Legal pages
The privacy, terms and refunds pages live in `legal/`. Their names, email, state and date come from the `legal` block in `site.config.json`, and the ABN from `company.abn`. The HTML holds the same text, so the pages still read correctly if JavaScript is off; if you change a value in the config, change it in the three HTML files too so both copies match.
- **Update the date:** whenever you change the wording of any legal page, set `legal.lastUpdated` (for example `"12 March 2027"`). It appears under each page title.
- **ABN:** see Company details above (`company.abn`).
- `legal.tradingName`, `legal.brands`, `legal.contactEmail` and `legal.state` fill the matching words in the pages. Never add a personal name, age, home address or phone number.
- `legalBaseUrl` is the public address of the `legal/` folder. The AceGuides and Black Crest Web Designs sites should link their footers to `legalBaseUrl + "privacy.html"`, `"terms.html"` and `"refunds.html"`, so every brand uses these same pages.
- The footer's Company column on every page links Privacy, Terms and Refunds; the labels are `footer.privacy`, `footer.terms` and `footer.refunds`. The page labels "Last updated" and "In plain English" are in `legalText`.
- The pages are plain English and are not legal advice. Have them checked before relying on them for a large business.

## Move to its own repo (kbventures.github.io)
1. Create an empty repo called `kbventures.github.io` under the `kbventures` GitHub account or organisation.
2. Copy the contents of this folder (not the folder itself) into the repo root and commit to `main`.
3. In the repo's Settings > Pages, choose "Deploy from a branch", `main`, `/ (root)`. The site appears at https://kbventures.github.io/, and `404.html` is used for missing pages.
4. Set `basePath` to `/` and `siteUrl` to the new address in `site.config.json`, set `BASE` at the top of `404.html` to `/`, and update the `canonical`, `og:url` and `og:image` addresses at the top of each page and in `sitemap.xml` and `robots.txt`.
5. Remove `kbventures-site/` from the 3D-demo-sites repo if you no longer want the old address.
