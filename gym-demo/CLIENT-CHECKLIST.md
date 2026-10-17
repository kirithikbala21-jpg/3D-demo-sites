# From demo to a real client site

Work through this list when a gym or studio (or any business using this template) says yes.

## Content
- [ ] Replace the name, address, phone, email, hours, time zone and map query in `site.config.json`.
- [ ] Replace `data/classes.json`, `coaches.json`, `plans.json`, `planfaq.json`, `journal.json`, `careers.json` and `faq.json` with real content (or delete pages you do not need from `site.config.json` and the nav).
- [ ] Rewrite the section copy in `tools/templates/sections/` (offer, results, plans) and the page copy in `tools/templates/pages/`.
- [ ] Remove every "Sample", "fictional" and "demo" label, and the demo footer line (`brand.demoFooter`).
- [ ] Use the owner's real photography with `tools/add-photo.py` (see `PHOTO-SLOTS.md`). Make sure the owner has the rights to every photo, review and coach bio.
- [ ] Replace the invented quote, coaches and numbers (14 years, 3,200 members, 60 classes) with real, permitted ones, or remove those blocks.

## Make it work for real
- [ ] **Bookings:** connect `#trial-form` (see `js/trial.js`, "DEMO ONLY") to the booking system (Mindbody, Glofox, Pike13, Cal.com) and replace the demo availability and "spots left" logic with real data.
- [ ] **Memberships and payments:** the plan buttons lead to the trial page. Connect a join flow and payment provider (Stripe Checkout, the gym software). Taking payments needs a real backend.
- [ ] **Gift vouchers and passes:** connect `#gift-form` to a voucher provider.
- [ ] **Visit and trial forms:** connect `#visit-form` (`js/forms.js`) and `#trial-form` (`js/trial.js`) to your CRM or booking system.
- [ ] **Newsletter and careers forms:** connect to your email tool and inbox.
- [ ] **Map:** replace the placeholder `contact.mapsQuery` with the real address.
- [ ] **Analytics:** add your snippet in `js/ui.js` ("DEMO ONLY: add your analytics snippet"). It runs only after the visitor accepts cookies.

## Legal and trust
- [ ] Replace `legal.html` with a privacy policy, terms and cookie notice reviewed for the business and its country. Add health, injury and waiver wording, and the registered business details (ABN or similar).

## Launch
- [ ] Set `site.noindex` to `false` and `site.baseUrl` to the real address in `site.config.json`, then run `python3 tools/build.py`.
- [ ] Run `node tools/make-assets.mjs` to refresh the icons and share image.
- [ ] Point the client's domain at the site (GitHub Pages custom domain, or move the folder to its own repo or host). Keep HTTPS on.
- [ ] Run the tests (`ROOT=$PWD node tests/run.mjs`) and a Lighthouse check on a real phone and a real laptop.
- [ ] Open the site on an iPhone (Safari), an Android phone (Chrome) and a laptop (Chrome, Safari, Firefox). Confirm the 3D loads and the page is smooth.
- [ ] Submit `sitemap.xml` in Google Search Console and set up the Google Business Profile.
