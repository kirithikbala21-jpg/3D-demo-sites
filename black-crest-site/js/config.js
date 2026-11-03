/* ==========================================================================
   Black Crest Web Designs: every value the owner edits lives here.

   - currency, email: shown across the site. There is no phone number on purpose:
     leave "phone" empty and every call button stays hidden.
   - availability: the short line in the footer and the menu, for example
     "Taking new projects now". Change it whenever you like. It is never shown
     as a countdown or "only X left".
   - packages, carePlan: the three prices. One Page and Full Website are one-off,
     the care plan is monthly. All in AUD.
   - addOns: optional extras, shown as "from" prices on the pricing page and in
     the calculator. The amounts are PLACEHOLDERS: set your real ones.
   - timezone: used by the Melbourne clock in the footer and the menu.

   The block between CONFIG-START and CONFIG-END must stay valid JSON (double
   quotes, no trailing commas, no comments inside), because tools/build.py reads
   it too and writes the same numbers into every page, so prices show even
   without JavaScript. After changing a price, run:
       python3 black-crest-site/tools/build.py
   ========================================================================== */
export const CONFIG = /* CONFIG-START */ {
  "currency": "AUD",
  "email": "kb.ventures@outlook.com",
  "phone": "",
  "availability": "Taking new projects now",
  "timezone": "Australia/Melbourne",
  "packages": {
    "onePage": { "name": "One Page", "price": 300 },
    "fullSite": { "name": "Full Website", "price": 700 }
  },
  "carePlan": { "name": "Care plan", "pricePerMonth": 30 },
  "addOns": [
    { "id": "extraPage", "name": "Extra page", "from": 80, "perUnit": true, "fullOnly": true, "note": "Full Website only: each page beyond the 5 included." },
    { "id": "booking", "name": "Booking button", "from": 50, "note": "Links to the booking app you already use." },
    { "id": "logo", "name": "Logo tidy-up", "from": 60, "note": "We clean up the logo you have so it is sharp on screens." },
    { "id": "gbp", "name": "Google Business Profile setup", "from": 80, "note": "We set up or tidy your free Google listing with you." }
  ]
} /* CONFIG-END */;
