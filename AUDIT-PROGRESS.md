# Audit fixes (2 Nov 2026): progress

Brief: "Audit fixes (2 Nov 2026): paste into Claude Code". Parts A to E, in order, committed after each.

| Part | State |
| --- | --- |
| A. KB Ventures | Done |
| B. AceGuides shop | Done |
| C. Black Crest | Done |
| D. Demos | Done |
| E. Repo root and The One Barber | Done |

## A. KB Ventures (done)
- **Pricing:**
  - `black-crest.html` is now a noindex redirect (meta refresh plus a plain link) to `../black-crest-site/pricing.html`.
  - Every Pricing and Website pricing link (header, phone menu, footer, no-JS footer) goes straight there.
  - The page is out of the sitemap.
- **Black Crest label:** "Taking clients" (was PREVIEW) on Home, Businesses, the Businesses menu and the footer (which said "Coming soon"). The link text is "Visit Black Crest", and the line is the Black Crest tagline, "Premium sites for local businesses." (sync).
- **Concept site cards** open the matching Black Crest case study (`../black-crest-site/work/<slug>.html`), labelled "See the case study".
- **"Notify me"** on paused guides links to the sign-up with `?notify=<guide>`. The form shows "We will email you when Year 10 History is back." and sends topic "Notify me: Year 10 History" (also in the email subject).
- **Reply time:** "within 1 business day" on Home, Contact, FAQ, Partner and Refunds (was 2 or 3).
- **Latest:** "Contact form now live" is removed. No samples item, because there are no samples yet.
- **Privacy:** new sentences on Web3Forms, Google Drive (the buyer's email is shared with Google) and the email provider for receipts and delivery. Last updated: 3 November 2026 (privacy and refunds; terms keep their own date).
- **Sync:** the Black Crest niche shows the titanium card with the new hallmark, the tagline and "Taking clients".
- **Check tool:** redirect pages get the file checks but no browser visit (they navigate away).

## B. AceGuides shop (done)
- **Refunds:** "Guides are emailed to you within a few hours of payment (by the next morning for late-night orders)". "Arrive straight after you pay" and "delivered to you immediately after payment" are gone.
- **Layout:**
  - A sticky jump bar (Year 10, Units 1&2, Units 3&4, Bundles).
  - The guide shelves come straight after the title; "Inside every guide" and the year explainer sit after the shelves.
  - The first shelf's covers load straight away; every niche has a graphite placeholder, so nothing shows blank.
- **Bundle savings,** worked out from the config: Year 10 "Save $19.96" (5 guides, $49.95), Units 1&2 "Save $49.93" (8, $119.92), Units 3&4 "Save $69.93" (8, $159.92).
- **Samples:** there is no `kbventures-site/aceguides/samples/` folder, so there are no samples. The "Look inside before you buy" line is hidden until a sample PDF exists, and is shown automatically once one is listed in `samples`.
- Prices and Stripe links are unchanged (checked by `tools/check.mjs`).

## C. Black Crest (done)
- **Contact form:** "What do you need?" is now two parts on the contact, free-concept and start forms (start's old package menu is replaced):
  - choose one of One Page ($300), Full Website ($700), Something custom, Not sure yet;
  - a separate "Add the care plan" box, unticked by default, styled to match (sharp, hairline, gold tick, gold focus ring).
- **What is sent:** Web3Forms gets `need` and `care_plan` spelled out, and the subject ends with both, for example "Full Website + Care plan" or "One Page (no care plan)".
- **Pre-fills:**
  - the calculator (package, and the box ticked when the care plan was added);
  - the Concept Lab and the quiz review (Not sure yet);
  - the pricing buttons (`?need=`);
  - "Get the care plan" on the care plan page (box ticked).
- **care-plan.html:** its only form is "Request a change" for existing clients, which does not ask this question. So the new "Get the care plan" button opens the contact form with the box ticked.
- **Tested:** every path at 390 and 1440 px, keyboard included (26 checks passed). One send was answered locally, so nothing reached Web3Forms.
- **Extra page:** Full Website only (pages beyond its 5); it is switched off in the calculator for One Page. One Page now notes "Need more than one page? The Full Website covers up to 5."
- **Honest line:** "We're new and building our first portfolio, so prices start low. The work doesn't." sits under the prices on home and pricing.
- **Google Map** is included in both packages and removed from the add-ons and the calculator.
- **The calculator** shows extras and the care plan separately ("1 extra + care plan").
- **Standard band:** "Up to 5 pages in a Full Website."
- **Reply time:** "within 1 business day" everywhere (was 24 hours).
- **FAQ:** five new answers (changing things yourself, paying, GST, changing your mind after the deposit, hosting).
- **Terms:** a deposit clause (not refunded once work has started; refunded in full if we cannot finish). Last updated 3 November 2026.
- **Skipped:**
  - Credits: the four new photos are still not in, because images.unsplash.com is blocked here, so there are no photographers to list yet.
  - Barber photo: `barber-demo` has no copy wider than 900 px, so no larger original exists to rebuild from.

## D. Demos (done)
- **Black Crest bar:** a slim bar at the very bottom of every page of the six demos, "Concept site by Black Crest Web Designs · Get a site like this", linking to `../black-crest-site/free-concept.html`. It sits in normal page flow (never over content), inherits each demo's own font and colours, and is keyboard-reachable with a focus ring.
- **Footer credit:** now the link "Concept site by Black Crest Web Designs" (was "Concept website by KB Ventures" or "Demo website by KB Ventures").
- **Moves:**
  - Barber: Surry Hills, Sydney to Box Hill VIC 3128 (27 Carrington Road), with its map searches, JSON-LD, footer, visit page and clock time zone. Phone 03 5550 0144.
  - Gym: Fortitude Valley, Brisbane to Clayton VIC 3168 (14 Wellington Road). Time zone Melbourne, phone 03 5550 0177.
- **Placeholders:**
  - Example streets are replaced (Flinders Lane, Springvale Road, Kingsway).
  - Emails are display-only text, "hello@" plus the business name, never a link. The demo build validators accept this form.
  - Licence and ABN lines read "shown on the real site".
  - There was no "Photo to come" text in any demo.
- **Wording:** "Concept site" replaces "unofficial concept demo" and "Unofficial concept redesign" everywhere.
- **Torque & Co.:** it echoed a real chain (red starburst logo, "Click & Collect in 30 minutes", the same category names), so it now has its own identity:
  - deep teal and amber, and a hexagon bolt-head mark;
  - its own top line, category names and rewards line;
  - the countdown timer and "while stock lasts" are removed (CLAUDE.md bans countdowns);
  - its icon and share image are re-rendered.
- **Old café demo:** `cafe-demo/index.html` (and its reviews page) now redirect to `../cafe-demo-v2/`.
- **Dead links:** the demos' Instagram and Google review links open the matching Black Crest case study.
- **"Seamless"** is reworded in the barber services and home page.
- **Black Crest sync:** the case studies show Box Hill VIC and Clayton VIC and the new Torque & Co. palette. The screenshots, gallery stills, showreel and KB previews are re-rendered from the new demos.
- **Late fixes:** the barber and gym "Find us" map links still named Surry Hills and Fortitude Valley; they now search Box Hill VIC and Clayton VIC. The image tool now uses the Switzer font file (the old one was removed earlier).
- **Checked:** all 48 demo pages at 390 and 1280 px: no script errors, no missing files, no sideways scroll, and the bar and credit present.

## E. Repo root and The One Barber (done)
- **Root page:** `index.html` is a noindex redirect to `black-crest-site/`, with a plain link.
- **README:** a short, plain description of the folders. "Built with AI" and "hosted free" are gone.
- **The One Barber:**
  - Copied first to the branch `one-barber-private` (the folder and its checks workflow are there).
  - Removed from `main`, with its checks workflow and its `.gitignore` line.
  - Nothing on `main` links to it. The only mentions left are the CLAUDE.md rule and the check tools that block the name.
  - The files are still visible on GitHub (old commits and the `one-barber-private` branch) until the repo is made private.
