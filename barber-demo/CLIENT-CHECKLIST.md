# From demo to a real client site

The launch checklist now lives at the top of `README.md` (section 0), together with the plain-English owner guide. Work through it from there.

Developer extras when a real barbershop says yes:
- [ ] Connect a form service in `site.config.json` > `forms` > `endpoint`, and replace the demo availability in `js/forms.js` (`full()`) with a real booking system.
- [ ] Connect payments for the shop and gift cards (Square, Stripe Checkout). Taking payments needs a real backend.
- [ ] Replace `legal.html` with a policy reviewed for the business and its country; add the ABN.
- [ ] Add analytics only in `js/ui.js` ("DEMO ONLY: add your analytics snippet"); it runs only after the visitor accepts.
- [ ] Run `node tools/make-assets.mjs` (icons, share image, price-list PDF), the tests, and a Lighthouse run; open the site on a real iPhone, Android phone and laptop and confirm the 3D loads.
