# Changes: free samples, Black Crest pricing, phone fixes (29 October 2026)

## AceGuides shop
- The shop fixes from the last round (all Year 10 guides on sale, bundle prices, the new delivery line, "6 concept websites") were already live and are unchanged.
- **Free samples:** a guide card shows a "Free sample" link (new tab) when its key is in `aceguides.samples` and `aceguides/samples/<key>.pdf` exists. The list is empty, so no links show yet. A new line above the guides: "Look inside before you buy, where a sample is available."

## Black Crest pricing (new page `black-crest.html`)
- Starter (from $490), Standard (from $990) and Custom (quote on request), with what each includes, all from `blackCrest` in the config.
- "Prices are a starting point. Every project is quoted before any work begins." Each "Get a quote" button opens the contact form with Black Crest Web Designs chosen.
- The page is marked Coming soon and shows the Concept sites gallery. No customers are claimed. Black Crest is still Coming soon on Home.
- "Pricing" was added to the top bar (it fits from 720px, with room to spare) and the phone menu, and "Website pricing" to the footer. Added to the sitemap.

## Phone fixes (checked at 360, 390 and 768 on every page)
- There was no horizontal scrolling, no overlapping text, no cut-off cards, and the phone menu opened and closed properly everywhere, before and after.
- Tap targets made at least 44 x 44px: the KB logo in the top bar (was 32px wide), the Businesses dropdown arrow (was 30px wide), short footer links like About, FAQ and Terms (were 26 to 38px wide), and the Privacy Policy tick-box rows on the Get updates and contact forms (were 21 to 24px tall). Only the sizes changed, not how the forms work.

# Changes: AceGuides fixes (29 October 2026)
- **Year 10 English, History, Economics and Business, and the Year 10 bundle** now have Buy now buttons (Stripe, new tab, rel noopener). Every guide can be bought now.
- **Bundle prices:** Year 10 $29.99, VCE Units 1 and 2 $69.99, VCE Units 3 and 4 $89.99. "See price at checkout" and "Price to be confirmed" are gone, and the Product structured data now covers all 24 guides with these prices.
- **Delivery line:** "Emailed to you within a few hours of payment."
- **Latest:** "6 concept websites built for local businesses". **About milestones:** "6 concept websites built".
- All of this lives in `site.config.json` and the pages were rebuilt from it. Checked: the 4 new Stripe links open (HTTP 200) at the right price, and all page tests pass at 1440, 768 and 390.

# Changes: the AceGuides shop (29 October 2026)

## New page: AceGuides (`aceguides.html`)
- **Top:** "AceGuides.", "Study guides for Year 10 and VCE students." and the six things inside every guide.
- **Not sure which to choose?** A short guide to the three levels.
- **Guides:** grouped under Year 10, VCE Units 1 and 2, VCE Units 3 and 4, and Bundles. Each card has the cover, subject, level, price in AUD and "Buy now", which opens the Stripe payment link in a new tab (rel noopener).
  - Prices are $9.99 (Year 10), $14.99 (Units 1 and 2) and $19.99 (Units 3 and 4).
  - The two VCE bundles have no price in the config, so they say "See price at checkout".
  - Year 10 English, History, Economics and Business, and the Year 10 bundle have no payment link yet. They show a disabled "Coming soon" button and a "Notify me" link to the Home sign-up.
- **Under the guides:** "Delivered by email after payment.", "Questions? Contact us" (opens the contact form with AceGuides chosen), the Refunds, Terms and Privacy links, and the VCAA trademark line.
- **Search and sharing:** a title, description, share tags, canonical address, a sitemap entry, and Product structured data for the 18 guides that have both a link and a price.

## Connected to the rest of the site
- **AceGuides is live:** the Home and Businesses card says "Available now" and has a "Shop guides" button. The footer and the Businesses dropdown link to the shop with no Coming soon tag. Black Crest Web Designs is still Coming soon.
- **Latest:** a new first item, "AceGuides study guides are now on sale" (Oct 2026), linking to the shop. **About milestones:** "AceGuides study guides on sale".
- **FAQ:** "When does AceGuides open?" is replaced by "How do I buy an AceGuides guide?". The sign-up text and the "How do I get updates?" answer no longer say AceGuides is opening soon.
- `contact.html?topic=aceguides` preselects AceGuides.

## Checked
- **Stripe:** all 20 Buy now links open a live Stripe checkout (HTTP 200) for the matching guide at the matching price.
- **Playwright** at 1440, 768 and 390: no horizontal scroll, no overlaps, all covers load, no console errors, no em dashes. Every internal link works. The earlier full-site, round and form checks all still pass.
- Not changed: the demo folders, the hero card, colours, fonts, the legal pages and the contact form.

# Changes: a cleaner, fuller site (29 October 2026)

## Home
- **New order:** hero, Our businesses, Latest, How we build, Our standard, Who’s behind it, Quick questions, Get updates, Get in touch.
- **Hero:** a new line under the heading: "Study guides for Victorian students. Websites for local businesses. More on the way." "Based in Melbourne, Australia." is now smaller, below it. The heading and buttons are unchanged.
- **Our standard:** merged with "Why KB Ventures". It has the three cards (Clear, Fair, Well made) with the four small points (Made in Melbourne, Plain pricing, Fair refunds, Real replies) beneath them.
- **Who’s behind it:** merged from "Meet the founder" and "About KB Ventures". It has the KB monogram circle (it becomes the founder photo once `founder.photo` points to a file), the bio, the About line, "Clear. Fair. Well made." and two buttons: "More about us" and "Get in touch". The large KB square is gone from Home.
- **Concept sites:** a swipeable, scroll-snap row inside Our businesses (and on the Businesses page) with 6 demo websites. Each card has its name, a label ("Concept site: barbershop") and opens the live demo in a new tab (rel noopener).
  - On desktop it has arrow buttons; the row also scrolls with the arrow keys, with a visible focus ring.
  - The new screenshots of plumber, salon and parts store, plus refreshed barber, cafe and gym, are 13 to 22 KB each, taken at 1440px.
  - The One Barber is left out on purpose. It is a concept for a real shop, and the gallery line says these are not real businesses.
- **Latest:** each card shows "Oct 2026".
- **Get updates:** a new sign-up with one email box, "Notify me", the required Privacy Policy tick and the same hidden `botcheck` spam trap. It posts to Web3Forms with the same key, the subject "New update sign-up" and a hidden topic field "Updates sign-up". It has its own success and error messages (with the email fallback).

## Other pages
- **About:** a short story, the Our standard cards, a Milestones strip (5 dated facts from `milestones`), "What we will never do." (4 items) and Get in touch.
- **Partner:** adds "Who we want to hear from." (3 points) and "What happens next." (3 numbered steps). The buttons go to `contact.html?topic=partnership`, which preselects Partnership.
- **FAQ:** 4 new questions (10 in all), a search box that filters as you type with "No match. Ask us on the contact page." when nothing fits, and FAQPage structured data for all 10. Home still shows the first 3.
- **Privacy policy:** one new sentence about update sign-ups. "Last updated" is 29 October 2026 (today), and the sitemap dates are updated.

## Checked
- **Playwright** at 1440, 768 and 390:
  - no horizontal scroll, no overlaps and layout shift 0;
  - every image has a width and height, and images below the fold load lazily;
  - one h1 per page with no skipped heading levels, and the social icons are labelled;
  - the contact form's spam trap has `aria-hidden`, `tabindex -1` and autocomplete off;
  - no old business names and no em dashes;
  - reduced motion is respected.
- **Forms:** the sign-up and contact forms were tested with faked requests only; nothing was sent.
- **Links:** every internal link on every page works, and every gallery link was checked against the local copy of each demo.
- **Weight and speed:** the home page's first load is about 500 KB over the wire with the 3D card and about 330 KB with the still image. Lighthouse: desktop 100 / 100 / 100 / 100; mobile performance 92 (Home) and 99 (FAQ and About), with 100 for the rest.

---

# Earlier: a fuller home page (29 October 2026)

New on Home, in this order after the hero: Our businesses, **Latest**, How we build, **Why KB Ventures**, Our standard, **Meet the founder**, About, Quick questions, Get in touch. Everything comes from `site.config.json`.

- **"See inside" previews in the business cards:**
  - AceGuides shows three of the real study guide covers already in `img/aceguides/` (Year 10 Maths, VCE Biology 3&4, VCE English 3&4).
  - Black Crest Web Designs shows the top of barber-demo, cafe-demo-v2 and gym-demo in small browser frames. They were captured at 1440px wide by the new `tools/make-previews.mjs` and saved as 640 x 400 WebP files in `img/previews/` (about 20 KB each).
  - The cards keep their "Coming soon" status and description lines. Every preview has alt text, lazy loading and a set width and height.
- **Latest:** three true update cards: "21 study guides written for AceGuides", "7 demo websites built for local businesses" and "Contact form now live" (with a link to the contact page).
- **How we build:** larger cards, each with its icon, heading and two short sentences. A numbered gold node sits on a fine gold line joining the steps (across on desktop, down the left on phones). The cards are equal height.
- **Why KB Ventures:** four points with line icons: Made in Melbourne, Plain pricing, Fair refunds, Real replies.
- **Meet the founder:** Kirithik, the short bio and a "Get in touch" button. The photo is read from `founder.photo`. It is empty for now, so a KB monogram fills the round frame and no image ever breaks.
- **Unchanged:** the hero card, colours, fonts, header and footer. Gold is about 0.2% of the page.
- **Checked:**
  - Playwright at 1440, 768 and 390: the section order, the previews, no horizontal scroll, no overlaps, layout shift 0, everything fully visible after fading in, no em dashes and no console errors. With reduced motion, nothing fades.
  - The full site suite (every page and link) and the mocked contact form tests passed.
  - Lighthouse: desktop 100 / 100 / 100 / 100, mobile 94 / 100 / 100 / 100.

---

# Earlier: contact form details for Web3Forms (29 October 2026)

- The "from name" on form emails is now "KB Ventures Website" (`contactPage.fromName`).
- The JSON sent to `https://api.web3forms.com/submit` now also carries Web3Forms' `botcheck` honeypot field (false for real visitors; if the hidden box is ticked, nothing is sent).
- The access key, the subject "New message from KB Ventures website", the success message and the error message with the fallback email link were already in place and are unchanged.
- **Checked:** the mocked form tests at 1440 and 390 (no real message sent) and the full site suite.

---

# Earlier: the website business is now Black Crest Web Designs (29 October 2026)

- **New name:** the website-building business is now "Black Crest Web Designs" everywhere in this folder. That covers the config, the Home and Businesses cards, the Businesses dropdown, the footer, FAQ answer 2 and its structured data, the contact form's "What's it about?" list, the meta descriptions, the legal pages (including the terms' "Website services (Black Crest Web Designs)" section and the brand list), the README, the brand notes, code comments and earlier entries in this file.
- **Unchanged:** its one-line description, "coming-soon" status, empty URL, "See demos" label and card format. AceGuides, the hero card, colours and layout are untouched. The legal pages' "Last updated" was already today (29 October 2026).
- **Short form:** a new optional `shortName` field. Black Crest Web Designs has `"shortName": "Black Crest"`, used only in the footer's narrow Businesses column so the name fits on one line. Everywhere else shows the full name.
- **Contact link:** `contact.html?topic=black-crest` preselects Black Crest Web Designs.
- **Checked:**
  - a search of this folder for the previous names, in any capitalisation, finds nothing;
  - the full Playwright suite passed at 1440, 768 and 390 on every page: no console errors, no broken links, and the dropdown, footer and contact topics show the new name;
  - the mocked contact form tests passed at 1440 and 390.

---

# Earlier: the contact form is connected to Web3Forms (29 October 2026)

- `formAccessKey` in `site.config.json` now holds the site's public Web3Forms key. Messages are posted as JSON to `https://api.web3forms.com/submit` with the subject "New message from KB Ventures website", from_name "KB Ventures site", and name, email, phone, business, topic and message.
- Send now waits for the config before choosing between sending and the email fallback, so a very fast click can't fall back by mistake. The email fallback is used only when the key is empty.
- The `botcheck` honeypot and the Privacy Policy tick box work as before.
- **Checked:** with a mocked endpoint at 1440 and 390, using the real config and key, and no real message sent. Covered: validation messages, the loading state, the success message, the error message with the email as a backup, the honeypot blocking a send, the exact payload, and no console errors.

---

# Earlier: the website business is now Black Crest Web Designs (29 October 2026)

- **New name:** the website-building business is renamed "Black Crest Web Designs" everywhere in this folder. That covers the config, the Home and Businesses cards, the Businesses dropdown, the footer list, the FAQ answers (and their structured data), the contact form's "What's it about?" list, the meta descriptions, the legal pages, the README, the brand notes, code comments and earlier entries in this file.
- **Kept the same:** its description, "coming-soon" status, empty URL and "See demos" label. AceGuides is untouched. KB Ventures stays the trading name on the legal pages.
- **Legal pages:** the terms' "Website services (Black Crest Web Designs)" section, the brand list and descriptions are updated. "Last updated" is now 29 October 2026, and the sitemap dates for the changed pages match.
- **Contact form:** `contact.html?topic=black-crest` now preselects Black Crest Web Designs.
- **No URLs changed:** no file or link used the old name, so nothing else needed updating.
- **Checked:**
  - a search for the old name in any spelling finds nothing in `kbventures-site/`;
  - Playwright at 1440, 768 and 390 on every page: no console errors and no broken links. The dropdown, footer and contact topics show Black Crest Web Designs, and the old name appears in no rendered page.

---

# Earlier: the 1:13 pm hero card is back (28 October 2026)

- **Restored from commit dcec837** (11:49 am Melbourne time on 28 Oct, the card that was live at about 1:13 pm; the next card change, 1397f4a, came at 1:28 pm): `scene.js` and the still image. That is the slim dark glass card with a slim bevelled metal edge, one fine brushed-gold line, the studio lighting and environment map, the soft light in the upper right of the face, the raised polished KB and VENTURES under it, and the idle light sweep that crosses the face every few seconds on its own (it was never hover-only).
- **Undone:** every later card version: the 7:47 pm silver card, the sleek hairline card, the 10:04 pm purple card with the chip, and the brushed metal membership card.
- **One small change to the restored card:** in that exact version the KB rendered mid-grey and VENTURES was barely visible. Their two materials now have a soft self-glow and a stronger reflection, so the KB reads bright white/silver and VENTURES is readable. Nothing else about the card differs from dcec837.
- **Still image:** `img/hero-object.webp` was re-rendered from the restored card (with the brighter mark) at full size, so the fallback matches.
- **Hero background:** still clean: no grid, glow layer or sparkle dots, only the soft spotlight behind the card.
- **Kept from round 2:** the taller hero, text, buttons, smaller card, all sections, pages, spacing and fade-ins. Reduced motion and the still-image fallback still work.
- **Checked:**
  - screenshots at 1440 (3D and still) and 390, side by side with the actual 1:13 pm site exported from dcec837;
  - no console errors;
  - the full test suite passed at 1440, 768 and 390;
  - Lighthouse: desktop 100 / 100 / 100 / 100, mobile 95 / 100 / 100 / 100, layout shift 0.

---

# Earlier: a brushed black metal membership card (28 October 2026)

The purple/blue gradient card with a chip is gone. The hero card is now a thin metal membership-style card in the site's own palette. It keeps the same size, position, tilt, clean dark background, still-image fallback and reduced-motion behaviour.

- **Not a payment card:** the chip is removed, as are all purple, blue and teal. There's no contactless symbol, card number or network logo. Only the logo is on the face.
- **Body:** brushed obsidian and graphite metal, going from #1A1C23 at the top-left to #0D0E12 at the bottom-right. A fine horizontal brushed grain is drawn into the colour and drives the roughness: metalness 0.9, roughness about 0.35 to 0.45. On top is a soft, low clearcoat sheen (no plastic gloss), and the faint reflection still sweeps slowly across.
- **Shape and edge:** real card proportions (1.584:1), corners at 4.5% of the width, very thin. The hairline polished-silver edge catches the light along the top only.
- **Gold:** #D4AF37 only as a very fine see-through hairline around the edge, plus the logo's own thin gold rule. That's well under 5% of the card.
- **Mark:** the real logo, `img/kb-wordmark.svg`, is now centred and larger: the KB is 28% of the card's width, where before the whole logo was small at the top-left. It keeps the silver gradient and gets a soft etched shadow.
- **Lighting and motion:** unchanged from the sleek version. One large soft box, a gentle rim, low exposure, a soft contact shadow and a faint reflection below. The tilt is a few degrees, slow and eased.
- **Still image:** `img/hero-object.webp` was re-rendered from the new card, with new alt text.
- **Performance:** a bump map and anisotropic highlight were tried and dropped, because they cost about 20% of the frame rate for almost no visible difference. The final card runs at the same frame rate as the previous one in the same software-rendering browser.
- **Checked:**
  - screenshots at 1440 (3D and still) and 390, compared with the previous version: no chip, no purple, no grid, and the silver KB is clearly readable;
  - no console errors;
  - the full test suite passed at 1440, 768 and 390;
  - Lighthouse: desktop 100 / 100 / 100 / 100, mobile 96 / 100 / 100 / 100, layout shift 0.

---

# Earlier: a colourful, Revolut-style hero card (28 October 2026)

- **Colours:** the face is now a smooth blend instead of plain black. Midnight navy, with indigo top-left melting through blue and a faint teal into violet bottom-right, plus a warm champagne glow at the bottom-left. A soft fall-off keeps it deep rather than loud, and fine noise stops the blends from banding.
- **Finish:** a glossy clearcoat with a faint pearly (iridescent) shift as the card tilts, like a premium bank card. The visible brushed lines are gone, so the face is smooth, and the slow reflection is a little brighter.
- **Layout:** like a bank card. The KB Ventures logo sits top-left, with a soft champagne chip below it (decorative). No Revolut name or marks are used.
- **Unchanged:** the hairline edge and champagne line, the size, position and motion, the clean background, reduced motion and the still-image fallback.
- **Still image:** `img/hero-object.webp` was re-rendered to match, with a new alt text.
- **Checked:**
  - screenshots at 1440 (3D and still) and 390;
  - no console errors;
  - the full test suite passed at 1440, 768 and 390;
  - Lighthouse: desktop 100 / 100 / 100 / 100, mobile 95 / 100 / 100 / 100, layout shift 0.

---

# Earlier: a sleeker hero card (28 October 2026)

Only the card's look changed. It is still the dark glass KB card, at the same size and position, on the clean dark background, with the same still-image fallback and reduced-motion behaviour.

## The card
- **Edge:** a hairline polished-metal edge (about 1 to 2px at normal size) instead of the thick bevel. It catches the light along the top and upper left only, with no white outline all the way round. The corner radius is tighter (4.5% of the width instead of 6%) and the card is about half as thick.
- **Gold:** a fine, soft champagne hairline (low saturation, 75% opacity) instead of the bright yellow rim.
- **Body:** deep matte black anodised metal under a gentle clearcoat. It is slightly lighter top-left and darker bottom-right, with very fine brushing and micro-noise, so it is never one flat colour. The light streak is now a wide, faint reflection that crosses slowly every 12 seconds, not a bright line every 7.
- **Mark:** the actual logo file, `img/kb-wordmark.svg`, set into the face, so it matches the logo exactly: the thin, widely spaced silver-to-white KB, the gold rule, and small, widely spaced VENTURES. It has a soft pressed-in shadow and a faint lit lip for engraved depth, instead of bold extruded letters.
- **Light:** one large soft box above-left plus a softer front panel, a gentle rim on the right, a faint floor bounce, and lower exposure (0.9), with no hard strips. The contact shadow is softer and the reflection under the card is fainter (3.5%).
- **Motion:** smaller and slower. The drift is about half as large, the pointer lean is about 3 to 4 degrees, the scroll tip is under a third of what it was, and every movement eases in over about a second and a half.
- **Still image:** `img/hero-object.webp` was re-rendered to match, at full size (1200 x 958) instead of being scaled up. `tools/render-hero-still.mjs` now draws the stage 600px wide for this.

## Checked
- The card at 1440 (3D and still) and 390, compared with the previous version: thinner, less glossy and less chunky, with the logo clearly readable.
- No console errors.
- Lighthouse is unchanged: desktop 100 / 100 / 100 / 100, mobile 95 / 100 / 100 / 100, layout shift 0.
- Frame rate in the same software-rendering test browser is about the same as before.
- The full test suite passed at 1440, 768 and 390.

---

# Earlier: dark glass card back, clean hero background (28 October 2026)

- **Card:** the 27 October silver card is undone. `scene.js` and `img/hero-object.webp` are back to the dark glass KB card used right before round 2 (byte-for-byte the files from commit c86a926). The import map and the soft fade at the foot of the card area are back to how they were then too.
- **Removed from the hero:** the round 2 glowing grid lines, the extra glow layer behind the card, and the three small sparkle dots, along with their styles and animations. One of the dots was also baked into the still image under the card; just that dot was cleared out of the image, with the card and its shadow untouched.
- **What's left:** the plain dark page background with the original soft light (`.spotlight`) behind the card.
- **Kept:**
  - the taller hero and the smaller card;
  - every round 2 section, its spacing and fade-ins;
  - the new pages;
  - reduced motion and the still-image fallback.
- **Checked:**
  - the hero at 1440 (3D and still image) and 390 shows the dark glass card on a clean dark background, with no grid, glow layer or dots;
  - no console errors;
  - the full test suite passed at 1440, 768 and 390.

---

# Earlier: the 27 October hero card is back (28 October 2026)

- **Why:** round 2 did not change the hero card. Its code, materials, lights and still image were byte-for-byte the same as before round 2, and screenshots matched. The brighter look you remembered is the first metal-and-glass card from 27 October (commit 305977f). It was replaced on 28 October by the darker "piano-black glass" card.
- **Restored from 305977f, unchanged:**
  - `scene.js`: a brushed-silver metal slab with a piano-black glass face, a bright white "KB" with "VENTURES" and a short gold rule under it, and a fine brushed-gold edge line;
  - its lighting: a studio environment, key and rim lights, ACES tone mapping at exposure 1.0, the "less" shine level and the soft reflection sweep;
  - its matching still image, `img/hero-object.webp`.
- **Small fixes so it runs and shows in full:**
  - the import map has `three/addons/` again (the restored card uses `RoomEnvironment`, still in `vendor/addons/`);
  - the fade-out mask at the bottom of the hero stage is removed, as on 27 October, so the frame's lower edge isn't faded.
- **Kept from round 2:**
  - the smaller card size;
  - the taller hero, text, buttons, glowing grid and light, and everything below the hero;
  - reduced motion, Data Saver, weak phones and software-only graphics still get the still image, and `?3d=on` / `?3d=off` still work.
  - The grid didn't make the restored card look darker, so its brightness is unchanged.
- **Tool fix:** `tools/render-hero-still.mjs` now also hides the hero glow and the light specks, so a future still has a clean transparent background.
- **Checked:**
  - hero screenshots at 1440 (3D and still) and 390, compared against the 27 October page;
  - no console errors;
  - the full test suite passed again at 1440, 768 and 390.

---

# Earlier: round 2, a fuller home page and four new pages (28 October 2026)

## Home
- **Hero:** almost a full screen tall on desktop, with the text and the smaller 3D card on one centreline. A faint glowing grid and a soft light sit behind the card. They're CSS only, drift very slowly and stay still with reduced motion.
- **New order:** Our businesses (the same two coming-soon cards, plus "View all businesses"), How we build (four steps), Our standard (three cards), About, Quick questions (the first three FAQ items), Get in touch, footer.
- **How we build:** Idea, Build, Launch and Run, each with a number, a thin line icon, a title and one line. Four in a row on desktop, 2 x 2 on phones, with a "How we work" link.
- **Our standard:** Clear, Fair and Well made cards. Only these tilt slightly and catch a soft light under the pointer; the business cards do not.
- **Spacing:** one scale. The gap between sections is about 105px on desktop, 81px on tablets and 65px on phones, with the gold-dot dividers kept. Sections and cards rise in once as they appear (not with reduced motion).

## New pages
- **Businesses** (`businesses.html`): "Our businesses.", "Each business has its own website.", the cards from the config, and always the faded "More coming" card. A live business becomes a link automatically.
- **How we work** (`how-we-work.html`): the four steps, each in two or three plain sentences, then the three standards with a short paragraph each, then Get in touch.
- **FAQ** (`faq.html`): the six questions as an accordion. It works by mouse and keyboard (Enter, Space, and the arrow keys between questions), opens and closes smoothly, and opens instantly with reduced motion. The answers stay open without JavaScript. It includes FAQPage structured data that matches the visible text word for word.
- **Partner with us** (`partner.html`): the intro, the three points, and "Tell us about it", which opens the contact form with Partnership chosen.
- **Contact:** `?topic=` preselects "What's it about?". Quick answers (the first three FAQ items) sit under the form.

## Header, menu and footer
- **Top bar:** "Businesses" is now a link to the Businesses page, with a small arrow button beside it for the dropdown (which still opens on hover too).
- **Phone menu:** Businesses, About, How we work, FAQ, Partner with us, Contact, and the pill.
- **Footer:** the logo, email and social icons, then three link columns. Businesses (from the config); Company: About, How we work, FAQ, Partner with us, Contact; Legal: Privacy, Terms, Refunds. The bottom row is unchanged.

## Under the hood
- **One FAQ source:** the questions live in one list, `faq` in `site.config.json`, used by Home, Contact and the FAQ page. The steps are in `process`, the standards in `standards`, and the new page text is in the config too.
- **New `tools/build-pages.py`:** it rebuilds the HTML copy of every page except the legal pages from the config, including the FAQ structured data and the root 404 copy.
- **Page structure:** card titles and questions are H2 on pages where they come straight after the H1, so headings stay in order.
- **Spacing fix:** the legal pages now leave room under the fixed top bar.
- `sitemap.xml` lists all 10 pages.

## Checked
At 1440, 768 and 390px on all 11 pages:
- one H1;
- no sideways scroll;
- no console errors or failed requests;
- contrast at least 4.5:1.

Also checked:
- every internal link works;
- the accordions work by mouse and keyboard;
- the FAQ structured data matches the visible text;
- `?topic=partnership`, `aceguides`, `black-crest` and no topic all preselect correctly;
- the dropdown works, and the Businesses label is a link;
- the phone menu works, including focus and Escape;
- the bar hides and returns on scroll;
- coming-soon cards are not links, and live ones become links;
- the form works (with the sending step faked);
- the 404 works at deep addresses;
- reduced motion and JavaScript-off both work.

Lighthouse scored 95–100 for performance and 100 for accessibility, best practices and SEO, with layout shift 0 to 0.002.

---

# Earlier: the company lobby (28 October 2026)

The site is now a clean "lobby" for a company with several businesses. The look is unchanged: the same colours, type, 20px cards, pill buttons, Lenis smooth scrolling and 3D hero with its still fallback. The logo files are used as supplied.

## Pages
- **Home:**
  - hero: "Many businesses. One standard.", "Based in Melbourne, Australia.", and the buttons "Our businesses" and "Get in touch". The 3D card is smaller and sits to the right on desktop, above the text on phones. The empty space under the buttons is gone;
  - a business card for each business in the config;
  - a short About section with the KB mark;
  - a "Get in touch." section with the email shown large.
  - The concept-website slider, "How it works", "Guides launching soon" and the stats or testimonials areas are gone.
- **About** (`about.html`): the company text, then Clear, Fair and Well made, then a Get in touch button.
- **Contact** (`contact.html`): a form on the left; on the right, the email, social icons and "We usually reply within 2 business days." Stacked on phones.
- **404:** a big 404, "This page doesn't exist.", and the buttons Back to home and Get in touch. It works at any address depth. A copy is at the repo root, because GitHub Pages uses that one for missing addresses on this project site. Before, the root file was empty.
- The **legal pages** now use the shared top bar and footer.

## One header and footer
- `site.js` draws the top bar, the phone menu and the footer on every page from `site.config.json`.
- **Top bar:**
  - the wordmark on desktop and the KB mark on phones;
  - Businesses (a dropdown with each business, its one-line description and "Coming soon"), About, Contact, and Get in touch;
  - see-through at the top, frosted glass with a hairline once you scroll;
  - hides as you scroll down and comes back as you scroll up.
- **Phone menu:** full screen, with big links and the pill at the bottom. Escape closes it and focus stays inside while it's open.
- **Footer:**
  - three columns: the wordmark, email and social icons; Businesses; and Company (About, Contact, Privacy, Terms, Refunds);
  - a bottom row with © year, ABN (only when filled in) and the VCE trademark line.

## Config
- New: `company`, `socials`, `businesses` (a list), `showMoreComingCard`, `formAccessKey`, `basePath` and `siteUrl`, plus the text for every page.
- A business becomes live when it has a `url` and `status: "live"`. Its card then becomes one big link with a LIVE badge and its `ctaLabel`, and its footer and dropdown entries become links.
- The ABN moved to `company.abn`.
- Removed with the old sections: `demos`, `how`, `testimonials`, `aceguidesShopUrl`, `instagram` and `linkedin`.

## Contact form
- The fields are Name, Email, Phone (optional), Business name (optional), "What's it about?", Message, and a required Privacy Policy tick box. A hidden spam trap catches simple bots.
- The form checks each field with inline messages and moves to the first problem. While sending, the button shows "Sending…". On success, "Thanks, we'll reply soon." replaces the form. If sending fails, an error message gives the email address as a backup. The page never reloads.
- Messages go to Web3Forms with the key from `formAccessKey`. While the key is empty, Send opens the visitor's email app with the message filled in, and the page says so.

## SEO
- Every page has its own title, description, canonical address, Open Graph and Twitter tags (using `og.jpg`), favicon and theme colour `#0D0E12`.
- Home has Organization structured data: name, url, email, logo and `sameAs` with the three social links.
- New `sitemap.xml` and `robots.txt` list every page.

## Checked
At 1440, 768 and 390px on every page:
- one H1;
- no sideways scroll;
- no console errors or failed requests;
- contrast at least 4.5:1;
- every image has alt text and a size.

Also checked:
- every internal link and anchor works;
- the dropdown works by keyboard and mouse;
- the phone menu works, including keeping focus inside and closing on Escape;
- the bar hides and returns on scroll;
- coming-soon cards are not links and don't lift;
- a live business, tried with a test config, becomes a link everywhere;
- the form: validation, loading, success, error, the email fallback and the spam trap, with the sending step faked;
- the 404 page at deep wrong addresses, both the folder copy and the root copy;
- reduced motion;
- JavaScript off.

---

# Earlier: legal pages (28 October 2026)

## New pages
- `legal/privacy.html`, `legal/terms.html` and `legal/refunds.html`, in the same dark style. Each has the same nav and footer, a 720px reading column, a title, a "Last updated" date, a short "In plain English" box, numbered sections, and a Contact section. They have no smooth scrolling and no 3D, so they stay fast. Gold appears only in the thin divider above Contact.
- The wording follows your brief and adds no extra facts or claims:
  - **Privacy:** what we collect (name and email at checkout, messages); Stripe handles payments; no selling; GitHub Pages hosting logs; access, correction or deletion by email with a reply within 30 days; a light mention of the Australian Privacy Principles (no claim of formal compliance); complaints go to oaic.gov.au.
  - **Terms:** personal study use only; no guarantee of marks; not a replacement for school; the VCE trademark and that we are not affiliated with the VCAA or any school; original work; prices in AUD; a website services section; Australian Consumer Law; Victorian law; the update date.
  - **Refunds:** instant digital delivery; a fix or full refund for faulty, won't-open or not-as-described files; a reply within 3 business days; no change-of-mind refunds after download; Australian Consumer Law rights; how to ask.

## Config
- New `legal` block (exactly as given), plus `legalBaseUrl` so the AceGuides and Black Crest Web Designs sites can link to these same pages. The labels (Privacy, Terms, Refunds, Last updated, In plain English) are in `footer`.
- The ABN now lives in `legal.abn` (the old top-level `abn` field is gone). While it is empty, no ABN line appears anywhere.
- `legal/legal.js` fills the trading name, brands, email, state, ABN and date from the config.

## Footer
- Every page (home, the three legal pages and the 404) now has Privacy · Terms · Refunds and © year KB Ventures. The VCE trademark line is on every footer that mentions VCE: home and the legal pages.
- There is no sitemap.xml, so none was added.

## Checked
- At 1440 and 390px on all five pages: no sideways scroll, no console errors, no failed requests, and all body text at least 4.5:1.
- Every internal link and in-page anchor works. The Stripe, GitHub and OAIC links all return 200.
- A test with a filled-in ABN shows it; with the ABN empty, nothing is shown.

---

# Earlier: richer without clutter (28 October 2026)

The logo work (nav mark, footer logo, favicons, share image) is untouched. No facts, prices, reviews or numbers were invented.

## AceGuides covers
- New `tools/make-covers.py` (the supplied script) makes 21 study-guide covers in `img/aceguides/`: Year 10, VCE Units 1 & 2 and VCE Units 3 & 4. Each is 720x960 WebP at quality 82, 256 KB for all 21. The full-size PNGs go to a temporary folder and are never saved in the repo.
- The covers use the site's own font (Geist, embedded in the script) instead of Inter, so they match the page.
- The footer now says: "VCE® is a registered trademark of the VCAA."

## Easier to read
- Lead paragraphs and card text are now `#B3B8C4`; small labels are `#9CA2B0`.
- The contact paragraph and the email button are always fully visible.
- Fade-ins are fail-safe: everything shows without JavaScript, every fade ends fully visible, each plays only once, and anything still hidden after 2.5 seconds is shown anyway.

## Visuals
- **What we run:** each card has a picture panel above its text.
  - AceGuides: a fanned 3D stack of five covers (Year 10 Maths, Year 10 Science, VCE Biology 3&4, VCE English 3&4, VCE Maths Methods 3&4). They spread a little on hover and move slightly as you scroll. The alt text says what each cover is.
  - Black Crest Web Designs: a floating framed screenshot of the Brass & Blade concept site.
  - No prices, ratings or labels are added to either.
- **How it works:** three steps (Preview, Feedback, Go live), each with a thin line icon and the existing wording. A hairline joins them and draws itself as you scroll (side by side on desktop, top to bottom on phones).
- **Concept websites:** the browser frame is about 30% bigger. All screenshots were retaken with the clock frozen, plus a new tall 1440x2200 shot of each demo. When you hover over a card or tab to it, the tall shot scrolls slowly down inside the frame, then back again.

## Depth
- Section padding is 96px on desktop and 56px on phones.
- Between sections there is a faint light band and a hairline with a small gold diamond in the middle.
- A huge outlined "KB" at about 3.5% opacity sits behind What we run and Contact, and drifts slightly with scroll.
- Sections rise 16px over 700ms as they appear. The nav hairline appears once you scroll. One easing curve is used everywhere.

## Hero
- The 3D card is about 15% bigger and tilts gently as you scroll down. VENTURES is bigger and brighter. The still image was re-rendered to match.
- Two or three slow light specks drift near the card.

## Contact finale
- A larger centred heading, a bigger email button with a slow light sweep, and a faint spotlight behind them.

## Reduced motion
- Parallax, the light specks, the slow screenshot scroll and the line drawing are all off; the line simply shows in full.

## Checked
- **Full page** at 360, 390, 768, 1024, 1280, 1440 and 1920px, at 125% zoom, with reduced motion and with WebGL off:
  - no sideways scroll, overlaps or text under 11px;
  - contrast at least 4.5:1 and tap targets at least 44px;
  - no broken images, layout shift 0, no errors and no outside requests.
- **Keyboard only:** every link and button can be reached in order with a visible focus ring, the phone menu traps focus and closes on Escape, and focusing a demo card starts its slow scroll.
- **JavaScript off:** everything is visible; the covers have width, height, alt text and lazy loading.
- **Screenshots** of every section at 1440 and 390px were looked at. The cover fan was too small at first and was clipped at 360px; both are fixed.
- **Lighthouse:** desktop 100 / 100 / 100 / 100, mobile 97 / 100 / 100 / 100.

---

# Earlier: KB Ventures logo (28 October 2026)

Everything else is unchanged.

## Logo files (in `img/`)
- `kb-wordmark.svg` and `kb-favicon.svg` were created exactly as supplied.
- `kb-wordmark-white.svg` and `kb-wordmark-black.svg` were made from `kb-wordmark.svg` by a script that only removes the gradients and sets every fill to `#FFFFFF` or `#0D0E12`. The script confirmed that the shape data is byte-for-byte identical to the original.

## Where the logo is used
- **Nav:** the 32px KB mark (already rounded in the file) followed by "KB Ventures" in the nav type, on every page including the 404. At the narrowest width tested (360px) the full name still fits with 147px to spare, so it is never shortened.
  - The mark's alt text is empty because the name sits right beside it. Otherwise screen readers would say "KB Ventures KB Ventures".
- **Footer:** `kb-wordmark.svg`, centred above the footer links and the existing hairline. The big "KB Ventures" text wordmark was removed, because next to the logo it read as a duplicate.
  - The logo's artwork fills only the middle third of its file. So the image is up to 440px wide, which makes the letters themselves about 160px wide. At an image width of 160px, VENTURES was unreadable.
  - Alt text is "KB Ventures", and width and height are set.
- **Browser tab:** `kb-favicon.svg` is the main icon (`type="image/svg+xml"`). Playwright rendered it straight from the SVG, with transparent corners, to make:
  - `favicon.ico` (16, 32 and 48px);
  - `favicon-32.png`;
  - `apple-touch-icon.png` (180px);
  - `img/icon-192.png` and `img/icon-512.png`.

  These are all linked in the head of the home page and the 404 page. The Organization data's logo now points to `icon-512.png`.
- **Share image:** `og.jpg` was regenerated at 1200 x 630 (26 KB): the dark lit background, the full wordmark centred and large, and "Study guides and websites, made in Melbourne" in small spaced capitals below. The Open Graph and Twitter tags now include the image type, width, height, alt text, title, description and image.

## Checked
- **Nav and footer** at 360, 390, 768, 1024 and 1440px:
  - the mark is always 32x32;
  - the name stays on one line and is never cut off;
  - the menu button and links never collide with it;
  - the footer logo is fully visible.
- **Full page** at 360, 390, 768, 1024, 1280, 1440 and 1920px, at 125% zoom, with reduced motion and with WebGL off: no sideways scroll, no overlaps, contrast at least 4.5:1, tap targets at least 44px, layout shift 0, and no errors.
- **Lighthouse:** desktop 100 / 100 / 100 / 100, mobile 97 / 100 / 100 / 100.

---

# Earlier: final polish (28 October 2026)

Structure, copy, colours, the 3D hero card, the glossy cards and the demo row are unchanged. Everything is calmer, lighter and tighter.

## Type: smaller and lighter
- **Headings:** weight 300 (Geist), letter-spacing -0.025em, line-height 1.08–1.12. I checked that 300 is a real weight in the font file (300, 400 and 500 measure differently with faux styles turned off), and that it stays crisp on a standard (1x) screen.
- **Hero headline:** `clamp(32px, 4.2vw, 60px)`, 3 lines at 1024–1920px (4 on phones).
- **Section headlines:** `clamp(26px, 3.2vw, 46px)`.
- **Card titles:** `clamp(22px, 2.2vw, 32px)` at weight 400.
- **Labels:** 11px, uppercase, 0.22em tracking, weight 500.
- **Lead paragraphs:** 16–17px, line-height 1.65, at most 56 characters wide. They stay full silver: 85% silver measured under 4.5:1 where the light pools brighten the page.
- **Headline gradient:** about 6% light-to-silver now, instead of 10%.
- **Footer wordmark:** weight 300, `clamp(48px, 11vw, 168px)`, a very soft silver gradient, and still shown in full at every width.
- **Font loading:** one variable font file, preloaded, with `font-display: swap`. Numbers use tabular figures.

## Spacing and rhythm
- **One container everywhere:** 1120px of content, 24px gutters on phones and 32px from 720px. The nav, hero, cards and footer share the same edges.
- **Section spacing:** 112px between sections on desktop, 64px on phones.
- **Hero:** about 88% of the screen height. The text block and the 3D card sit on one centreline, and the dead space under the button is gone.
  - Fitting the headline into 3 lines at 1440 needs about 740px. So the text column is about two-thirds wide, and the card's stage overlaps back toward it without touching the words.
- **"What we run" cards:** equal height, with the status at the top, name and text in the middle, and one quiet line at the bottom. The AceGuides card shows "Guides launching soon" while `aceguidesShopUrl` is empty, and a "See the guides" button once it is filled in.

## Hero card
- **Light streak:** a narrow, bright, soft-edged streak (bright core, soft shoulders, faint halo) now crosses the face diagonally every 7 seconds, replacing the grey patch.
- **Size:** the card is drawn about 10% smaller. Its floor reflection is fainter. The slow drift and the mouse response are unchanged.
- **Still image:** re-rendered to match.
- **Software WebGL:** devices running WebGL in software (no graphics card, e.g. SwiftShader or llvmpipe) now get the still image. There the 3D would be slow, and it was costing Lighthouse 27 seconds of blocking time.

## Nav and buttons
- **Nav:** 64px, smoked glass (with a solid fallback where `backdrop-filter` isn't supported), a hairline once you scroll, and the current section's link underlined.
- **Phone menu:** a menu button opens a full-screen menu with large links. It closes on link tap and Escape, and keeps keyboard focus inside while open.
- **Fewer repeated buttons:** "See the websites" in the hero, and "Get in touch" in the nav and the contact section. The extra pills in the middle sections are gone.
- **Pills:** 40px to the eye with a 44px tap area, 14px text, a 200ms hover, and a platinum focus ring.

## Cards and demo row
- All cards share the same radius, border, top highlight, sheen and shadow.
- **Demo cards:** smaller titles, identical browser and phone frames, and text that wraps instead of overflowing.
- **Scrolling:** the row now aligns cards to the left, with the next card peeking about 40px.
- **Controls:** arrows and dots are aligned at the same 44px height. The arrows' stray default grey background is fixed. Keyboard, swipe and the dots all work and stay in sync.

## Background and motion
- The same lit blue-black background, vignette and light pools, with the grain at 4% to keep gradients from banding.
- One easing curve everywhere. Scroll reveals are 700ms with a 16px rise. The headline rises without fading, so it paints at once.

## Details
- Anchor links stop just below the sticky nav (`scroll-margin-top` plus the smooth-scroll offset).
- **New favicon set and share image** (`og.jpg`): dark, with the metal KB mark and the KB Ventures wordmark.
- **Head tags:** title, description, theme-color, a commented canonical, and Organization structured data using only facts on the page (name, email, Melbourne/AU, description, logo). `main.js` keeps the structured data in step with the config.
- **Footer:** links, a quiet "Back to top", "© 2026 KB Ventures · Melbourne, Australia" (the year updates itself), and the concept-demo line.
- **Missing images** leave a quiet empty frame instead of a broken-image icon. Every image has a width and height, and layout shift measured 0.
- **All page text now lives in `site.config.json`,** including optional `aceguidesShopUrl`, `instagram`, `linkedin`, `abn` and `testimonials` fields. Every optional field is empty and hidden. Nothing was invented. I tested this by feeding the page a filled-in config: every optional field appeared, and an entry without a quote was skipped.
- Lenis' tiny stylesheet is folded into `styles.css` (one fewer request). The carousel's ARIA was corrected: the region role is now on its wrapper, so the list stays a list.

## Tested
- 360, 390, 768, 1024, 1280, 1440 and 1920px, 125% zoom, reduced motion, and WebGL fully disabled: no sideways scroll, no overlaps, all text at least 4.5:1, all tap targets at least 44px, layout shift 0, no console errors, no outside requests, and the footer wordmark always in full.
- **Keyboard only:** a visible platinum ring on every stop in a logical order. Anchors land below the nav, and the phone menu traps focus and closes on Escape.
- **Lighthouse** (local server, uncompressed):

  | | Performance | Accessibility | Best practices | SEO |
  |---|---|---|---|---|
  | Mobile | 97–98 (varies run to run) | 100 | 100 | 100 |
  | Desktop | 100 | 100 | 100 | 100 |

  The first desktop run scored 60 for performance (software 3D) and the robots.txt check failed. The robots.txt check came from the repo's top-level file on the local server, which GitHub Pages doesn't use for this site.

## Still open
- The 3D card was only seen in headless Chromium, not on a physical phone or GPU.
- Unused files remain because this session may not run `rm`:
  - the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts;
  - `vendor/addons/`;
  - `vendor/lenis-1.1.18.css`.
- The repo's top-level `404.html` is still empty.

---

# Earlier: a real metal-and-glass card (28 October 2026)

The layout, copy, footer, buttons and demo row are unchanged. This round fixes the three things that still looked flat.

## 1. Hero object: a card, not a framed screen
- **Shape:** rebuilt as a thin card with corners rounded to 6% of its width. The front is deep black glass all the way to a slim bevelled metal edge, so the thick silver border and the gold inner outline are gone.
- **Edge lighting:** the bevel catches a bright highlight along the top and falls darker at the bottom. One fine brushed-gold line runs around the outer bevel only.
- **Face:** deep black glass with a subtle vertical gradient over fine horizontal brushing, under a clear coat. A wide, soft reflection band sweeps across it every 7 seconds.
- **Mark:** "KB" is raised polished metal, built as real 3D letters with a bevelled top edge that catches the light and a soft shadow in the glass beneath. "VENTURES" sits below in metallic foil.
- **Lighting:** a small studio built into the environment map, with three bright light strips (overhead, left, back-right) and a soft panel above the viewer. The glass and bevels show real specular highlights instead of plain grey.
- **Pose and motion:** tilted about 15 degrees back and 16 degrees sideways, in real perspective. It drifts slowly, leans gently toward the mouse (or the phone's tilt on Android), and has a soft contact shadow and a faint mirror image beneath it that fades into the page.
- **Still fallback:** `img/hero-object.webp` was re-rendered from the same scene, so it matches the live 3D. It shows while the 3D loads, without WebGL, on Data Saver, on low-powered phones and with reduced motion.
- **Compared with the old object:** side by side, the old one read as a TV in a silver frame and the new one as a real metal card, so the new one ships. It took three lighting passes before the raised mark read as polished metal rather than dark grey.

## 2. Background with depth
- A deep blue-black base with a faint light from the top of the screen.
- Three soft cool light pools, behind the hero object, behind the demo row and behind the contact section.
- A slightly lighter band at the horizon of each section. It straddles the section edge and fades out on both sides, so there is no seam.
- A vignette at the screen edges and a 3.5% film grain over everything.

## 3. Glossier cards
The "What we run" and demo cards now have a brighter 1px top edge fading to the sides, a stronger diagonal sheen, a lighter inner border and a soft shadow underneath. On hover, one slow light sweep passes across once, with no pulsing or blinking.

## Checked
- At 360, 390, 768, 1024 and 1440px, at 125% zoom and with reduced motion: no sideways scrolling, no overlapping text, no text under 12px, all tap targets at least 44px, all text at least 4.5:1, no broken images, no console errors, and no requests outside the site.
- The footer wordmark fits in full at every one of those widths.
- Carousel keys, dots and buttons, card brightening on hover and gold pill borders all still work.
- Fixed along the way:
  - a dark "floor" rectangle that showed under the object (replaced by a soft CSS fade);
  - a hard seam where each section's horizon band ended;
  - a syntax slip that briefly broke the 3D before release.
- **Banding:** with the contrast stretched 14x, the darkest gradients show faint contour steps under the grain. At normal brightness, or on a bright phone, they are far below visible.
- **Weight:** about 40–110 KB without the 3D, and about 0.7–0.8 MB with it from the local server (mostly Three.js, which GitHub Pages compresses). The 3D loads only after the page is ready.

## Left as they were
- The 3D was checked in headless Chromium with software rendering, not on a physical phone or GPU.
- iPhones need a permission prompt for tilt, so there the card only drifts.
- Unused files still in the folder, because this session may not run `rm`: the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts, and `vendor/addons/` (RoomEnvironment, replaced by the custom studio).
- The repo's top-level `404.html` is still empty, and the AceGuides shop link is still blank.

---

# Earlier: brushed metal and piano-black glass (27 October 2026)

This builds on the dark redesign from earlier the same day. The palette, copy, demo list and section order are unchanged. The owner replaced the earlier "no glow, no shiny metallic fills" rule with a shine brief; the new rules are in `brand.md` under "Light and shine".

## What changed
- **Background:** the flat black is now a layered surface:
  - a deep blue-black base (`#090B11`);
  - a soft cool silver-blue light pool behind the hero object, and a fainter one behind the demo row;
  - a vignette toward the screen edges;
  - a very fine film grain (a 96px tile, 3.5% opacity) laid over the page.

  With the contrast stretched 10x there is no visible banding; the grain breaks the gradient steps up.
- **Hero, two columns on desktop:** the headline, line and buttons sit on the left (about 57%). On the right is a large 3D object that overlaps the column edge slightly, under the spotlight. On phones the text comes first and the object below it.
- **Headline size:** your `clamp(40px, 6vw, 84px)` still wrapped to five or six lines beside the object at 1024–1440px, because four lines at 84px need an 840px column. So it is `clamp(40px, 5.2vw, 76px)`, which gives four lines at 1024, 1280, 1440 and 1920px and the same 40px on phones.
- **The 3D object** (Three.js r160, self-hosted and pinned):
  - a thin slab of brushed metal (anisotropic, clear-coated, high metalness, low roughness) with a piano-black glass face, a thin brushed-gold edge and the KB Ventures mark set into the glass;
  - lit by a studio environment (soft light strips) plus a key and a cool rim light, with a soft shadow beneath;
  - it turns and tilts slowly, leans gently toward the mouse or the phone's tilt, and a soft reflection sweeps across the glass every 9 seconds;
  - the pixel ratio is capped at 2, and it pauses when off screen.
- **Hero fallback:** a still render of the same object (`img/hero-object.webp`, 38 KB, transparent background, made with Playwright by `tools/render-hero-still.mjs`). It shows while the 3D loads, and instead of it without WebGL, on Data Saver, on low-powered phones and with reduced motion.
- **No demo screenshot on the object:** the Iron & Ember screenshot left the hero as asked, and now appears only in the first card of the demo row. The object's face is plain piano-black glass with the mark, instead of carrying a screenshot.
- **Shine level, compared:** I rendered two shine levels side by side. "More" pushed the metal edge to near-white chrome and started to look like a toy, so the quieter "less" version ships. `?shine=more` still shows the other one.
- **Cards (What we run and the demo cards):** dark glossy panels with:
  - a 1px bright top edge fading to the sides;
  - a faint diagonal sheen;
  - a slightly lighter inner border and a soft drop shadow;
  - one slow light sweep across the card on hover. It does not repeat or pulse.

  Card text still brightens from silver to platinum on hover or focus.
- **Screenshot frames:** polished dark-metal bezels with a bright top edge, metal window dots and a soft reflection across the glass, the same for the browser and the phone frames.
- **Headlines:** platinum with a light-to-silver vertical fall-off of about 10%, repeated on every line. No coloured gradients.
- **Primary pills:** polished platinum with a fine top highlight and a highlight that slides across once on hover. Secondary pills and the carousel arrows are dark glass with a faint highlight; their borders still turn gold on hover.
- **Gold** stays rare: the hairline under the hero label, the Live/Starting dots (now with a slight polished-metal look), hover borders and links, and the thin edge and hairline on the 3D object.
- **Nav:** smoked glass (dark and slightly blurred) instead of flat black. On desktop the nav, hero and footer now share one grid, so their left edges line up.

## Checked
- At 360, 390, 768, 1024 and 1440px, at 125% zoom and with reduced motion: no sideways scrolling, no overlapping text, no text under 12px, all tap targets at least 44px, and every text colour at least 4.5:1.
  - Gradient headlines were checked at their darkest stop, `#C3C7D0`.
  - Primary pill text was checked against the pill's darkest platinum, `#CBCED6`.
- No broken images, every in-page link has a target, no console errors, and no requests outside the site.
- The footer wordmark fits in full at every one of those widths.
- One bug found and fixed: the second light pool made the page scroll sideways by up to 388px.
- Weight: about 50–190 KB without the 3D. With it, about 760–790 KB from the local server, mostly Three.js, which GitHub Pages compresses. The 3D only loads after the page has finished loading and the browser is idle, so the text and still image appear first.

## Left as they were, and uncertain points
- The 3D was checked in headless Chromium with software rendering. Real GPUs render it more smoothly, but it has not been looked at on a physical phone.
- Phone tilt works on Android. iPhones ask for permission before a site can read motion, so on an iPhone the object only does its idle movement.
- Files no page uses any more were not deleted, because this session was asked not to run `rm`: the Barlow Condensed, Inter, Instrument Serif and Schibsted Grotesk fonts. (`hero.js`, `scene.js`, Three.js and `RoomEnvironment` are in use again.)
- The repo's top-level `404.html` is still empty, and the AceGuides shop link is still blank.
