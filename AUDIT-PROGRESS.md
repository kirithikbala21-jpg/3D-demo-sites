# Audit fixes (2 Nov 2026): progress

Brief: "Audit fixes (2 Nov 2026): paste into Claude Code". Parts A to E, in order, committed after each.

| Part | State |
| --- | --- |
| A. KB Ventures | Done |
| B. AceGuides shop | Done |
| C. Black Crest | Next |
| D. Demos | To do |
| E. Repo root and The One Barber | To do |

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
