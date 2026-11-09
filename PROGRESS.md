# KB Ventures site: progress

## House style, part C of "Everything to do, in one go" (2 Nov 2026): done
- **House style:** follows `../CLAUDE.md`. Fonts are Cormorant Garamond and Switzer (Geist, Inter, Instrument Serif, Schibsted Grotesk and Barlow are removed).
- **Banned styling removed:** corners are 0 to 4px; no UI shadows, glass blur, glow orbs, hover sheens or lifts, or the card tilt; the step, standard and news cards are flat editorial columns without icons.
- **Hero:** a real-time smoked-glass plaque with the KB mark engraved in gold, on a basalt plinth under one warm light, above a polished floor (`plaque3d.js`, Three.js 0.170.0, shared with KB Web Designs), with a still for everyone else. The headline is "Many businesses. One *standard.*"
- **Our businesses:** a lit niche gallery. KB Study Guides is a guide standing in its niche (a real cover), and KB Web Designs is the titanium card. Hover or focus brightens one and dims the other; each is a link. The AVAILABLE NOW and PREVIEW labels are small caps.
- **KB Study Guides shop:**
  - Every guide is a book in a lit niche, grouped by Year 10, VCE Units 1 and 2, and VCE Units 3 and 4.
  - Each opens a detail view: the cover, the level, the subject, what is inside, the price, the unchanged Stripe link (or the paused or coming soon state), the sample link if there is one, and the VCAA line on VCE guides.
  - Bundles are a statement table.
  - **Prices and Stripe links are unchanged.** The site check compares them with `site.config.json`, and they also matched a copy taken before the work began.
- **Website pricing (`black-crest.html`):** now a statement table with the prices from `../CLAUDE.md` (One Page $300, Full Website $700, Care plan $30 a month, Custom by quote). The old $490 and $990 are gone, and the note now says prices are agreed in writing.
- **Brand only:** the founder section is now "Who we are." with the KB mark and the company line; the founder's name and bio are removed from the site and the config.
- **Copy:** scanned against section 6 (banned words, "It's not X, it's Y", headlines over six words): nothing found. No em dashes anywhere.
- **Tools:** `tools/render-kb.mjs` (stills and `og.jpg`), `tools/niche-scene.js` (tool-only scene), and `tools/check.mjs` (every page, house-style bans, KB Study Guides price and link integrity).

## Left
- **Live 3D:** confirm the hero plaque in real-time 3D on a real device. In the build environment WebGL is software only, so it was tested with `?3d=on` and stills.
- **General Sans:** could not be downloaded here (fontshare.com is blocked), so Switzer is used, as CLAUDE.md allows.
