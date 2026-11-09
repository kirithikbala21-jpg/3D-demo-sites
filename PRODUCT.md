# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two kinds of visitor, by surface (owner, 9 Nov 2026):
- **KB Ventures (the company pages and home):** people who come for one of the businesses: KB Study Guides, KB Web Designs, and the businesses still to come. The home page is the front door that sends each person to the right business, and shows they all keep one standard.
- **KB Study Guides (the shop pages):** Year 10 and VCE students in Victoria (and parents paying for them), usually on a phone, comparing guides before an exam.

## Product Purpose
KB Ventures is a Melbourne company that starts and runs small businesses, each with its own site. Success for the company pages is a visitor reaching the business they came for. Success for the shop is a student buying the right guide or bundle.

## Positioning
Many businesses, one standard: clear, fair, well made. For the guides: a free sample PDF of every guide before buying, emailed within a few hours of payment.

## Operating Context
- KB Ventures site, served at kbventures.com.au from its own repo (Cloudflare Pages). Pages: Home, Businesses, How we work, FAQ, Partner, About, Contact, Credits, legal (privacy, terms, refunds), 404, and the KB Study Guides shop (aceguides).
- KB Web Designs has its own site at web.kbventures.com.au; KB Ventures links to it.
- Contact and sign-up forms (Web3Forms). Contact email kb.ventures@outlook.com.

## Capabilities and Constraints
- KB Study Guides prices live in Stripe and in site.config.json (never change without the owner): Year 10 guides $9.99, VCE Units 1 and 2 $14.99, VCE Units 3 and 4 $19.99; bundles Year 10 $29.99, Year 11 $69.99, Year 12 $89.99. Some items are paused (Year 10 History, Year 10 Economics, the Year 10 bundle).
- Static HTML, CSS and JS; pages built from site.config.json by tools/build-pages.py. No cookies, tracking or analytics.
- Forms, legal pages, contact details, prices and Stripe links stay as they are during the redesign.

## Brand Commitments
- Names: KB Ventures (parent), KB Study Guides (formerly AceGuides), KB Web Designs (formerly Black Crest).
- KB Ventures keeps: the KB plaque render and its hero video, champagne gold as its accent, the KB wordmark, and the tagline "Many businesses. One standard." (owner, 9 Nov 2026). Everything else about its look may change.
- KB Study Guides gets its own look, separate from the company pages (owner, 9 Nov 2026). It keeps the real guide covers.
- Brand only: no founder name or photo. Australian spelling, short plain sentences, no em dashes.
- Keep "VCE® is a registered trademark of the VCAA. KB Study Guides is not affiliated with or endorsed by the VCAA." near anything that says VCE.

## Evidence on Hand
- The KB plaque render and video (img/renders/, img/video/); the real guide covers (img/aceguides/); a free sample PDF for every guide (aceguides/samples/); screenshots of the six KB Web Designs concept sites.
- No reviews, testimonials, sales numbers or statistics. Never invent them.

## Product Principles
1. Send each visitor to the business they came for, fast.
2. Every business meets the same standard: clear, fair, well made.
3. Show the real thing (the covers, the samples, the sites), never claims.
4. Prices and policies stated plainly, once, where they are needed.

## Accessibility & Inclusion
WCAG AA contrast, full keyboard use, visible focus, reduced-motion support, alt text everywhere. Students often read on older phones: keep pages light and fast.
