# Changes: KB Ventures redesign, "printer's proof sheet" (27 October 2026)

This replaces the dark cyan version from earlier the same day. The brief is in `brand.md`.

## The idea
The page reads like a proof from a small print shop: ink on warm paper, big confident type, the demo work laid out as pinned proofs, and a few marks in proof red. Palette: press ink `#1C1A17`, proof red `#B83418` and paper `#F1ECE2`. Type: Instrument Serif for headlines and Schibsted Grotesk for text, both self-hosted under the SIL Open Font License.

## What changed
- **Removed the AI tells:** no glow, no glass tiles, no 3D, no gradient text, no icon cards, no "01 ·" labels, no three equal process cards, nothing centred by default.
- **Hero:** one statement in very large type ("We write study guides for students, and build websites for the shop down the road."), with "down the road" underlined in red pencil. A real screenshot of the gym demo sits under it like a pinned proof, at a slight angle, with printer's crop marks, cropped by the edge of the page. The dateline shows today's date in Melbourne.
- **Copy:** rewritten in plain words. Facts unchanged (what AceGuides and KB Websites do, Live/Starting, the email address, Melbourne). No prices, results or guarantees. "Modern" and similar words are gone.
- **What we run:** two ledger rows with the business names set huge and the details in a narrow column, instead of two cards.
- **How it works:** one paragraph of plain sentences instead of three numbered cards.
- **Demos:** the background changes to ink. Five large cropped screenshots alternate left and right at different widths and crops, with the type and name in small, clean type and an "Open the demo" link. Images zoom slowly on hover. The phone frame is kept only for the plumber demo, which was built phone-first. The concept-demo note stays, as a footnote under the heading.
- **Contact:** the email address itself is the big link, set in display type.
- **Footer:** ink, with small link columns and a huge "KB Ventures" cropped by the bottom of the page.
- **Grid:** asymmetric 12 columns (6 on phones), with a narrow label column on the left.
- **Motion:** one load sequence (headline words rise, the proof settles, the pencil line draws), small reveals as sections come into view, and hover states on every link and image. All of it switches off for `prefers-reduced-motion`. Lenis smooth scroll stays.
- **New:** favicon (`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`), a 1200 x 630 share image (`og.jpg`) with Open Graph and Twitter tags, and `404.html`.
- `site.config.json`: same demo list and order; the plumber entry gains `"phone": true` and a one-line `"aside"`.

## Checked
At 390px, 768px and 1440px, plus reduced motion: no sideways scrolling, no overlapping text, no text under 12px, every tap target at least 44px tall, every text colour at least 4.5:1 against its own background (3:1 for large type), no broken images, no console errors, no requests outside the site. The page weighs about 120–175 KB in total and loaded in about 0.1 seconds from a local server. It was compared side by side with locomotive.ca, basement.studio and pentagram.com.

## Left as they were, and uncertain points
- `hero.js`, `scene.js`, `vendor/three.module.min.js`, `vendor/addons/` and the Barlow Condensed and Inter fonts from the previous version are no longer used by any page. They were not deleted because this session was asked not to run `rm`. They are not loaded, so they do not slow the page down; delete them whenever convenient.
- The repo's top-level `404.html` (outside this folder) is still empty. GitHub Pages only serves the top-level one, so this site's `404.html` takes effect once the site moves to its own repo, or if it is copied to the top level.
- The AceGuides shop link is still blank, so it stays hidden.
- No price or "you only pay if..." line has been used; that wording is waiting for the owner's approval.
