# From demo to a real client site

Work through this list when a café (or any business using this template) says yes.

## Content
- [ ] Replace the name, address, phone, email, hours, time zone and colours in `site.config.json`.
- [ ] Replace `data/menu.json`, `products.json`, `journal.json`, `careers.json`, `press.json` and `faq.json` with real content (or delete pages you do not need from `site.config.json` and the nav).
- [ ] Rewrite the section copy in `tools/templates/sections/` (story, experiences, events, reviews) and the page copy in `tools/templates/pages/`.
- [ ] Remove every "Sample", "fictional" and "demo" label, and the demo footer line (`brand.demoFooter`).
- [ ] Use the owner's real photography: add images to `img/`, compress them (WebP, under 200 KB each), then use them in the gallery, feature panels, menu items and the hero video slot. Make sure the owner has the rights to every photo and review.
- [ ] Replace the invented reviews, press quotes, team and numbers with real, permitted ones, or remove those blocks.

## Make it work for real
- [ ] **Bookings:** connect `#reserve-form` (see `js/forms.js`, "DEMO ONLY") to a booking service (OpenTable, Resy, SevenRooms) or a form service, and replace the demo time-slot logic with real availability.
- [ ] **Orders and shop:** connect the order drawer (`js/cart.js`) to the ordering system or a payment provider (Square, Stripe Checkout, Shopify Buy Button). Taking payments needs a real backend.
- [ ] **Gift cards:** connect `#gift-form` to a gift card provider.
- [ ] **Newsletter, careers, wholesale forms:** connect to your email tool and inbox.
- [ ] **Map:** replace the demo OpenStreetMap location (`contact.lat`, `contact.lon` in `site.config.json`) with the real one.
- [ ] **Map and contact details:** replace the placeholder address, phone, email and `contact.mapsQuery` in `site.config.json`, and the sample reviews with real ones.
- [ ] **Analytics:** add your snippet in `js/ui.js` ("DEMO ONLY: add your analytics snippet"). It runs only after the visitor accepts cookies.

## Legal and trust
- [ ] Review `privacy.html` and replace `legal.html` with a policy, terms and cookie notice reviewed for the business and its country.
- [ ] Add the business's registered details (ABN or similar), allergen information and any licensing text required.

## Launch
- [ ] Set `site.noindex` to `false` and `site.baseUrl` to the real address in `site.config.json`, then run `python3 tools/build.py`.
- [ ] Run `node tools/make-assets.mjs` to refresh the icons, share image and menu PDF.
- [ ] Point the client's domain at the site (GitHub Pages custom domain, or move the folder to its own repo or host). Keep HTTPS on.
- [ ] Run the tests (`cd tests && node run.mjs`) and a Lighthouse check on a real phone and a real laptop.
- [ ] Open the site on at least: an iPhone (Safari), an Android phone (Chrome), a laptop (Chrome, Safari, Firefox). Confirm the 3D loads and the page is smooth.
- [ ] Submit `sitemap.xml` in Google Search Console and set up the Google Business Profile.
