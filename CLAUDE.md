# KB Ventures house style ("Gallery Noir")

This file lives at the root of the `3D-demo-sites` repo. **Claude Code: read it at the start of every session and follow it for every website you build or change in this repo.** If a task's own brief disagrees with this file, the task brief wins for that task only. If something here is unclear, choose the more restrained, more premium option.

The owner is a young founder. Explain what you did in short, simple words at the end of each task.

---

## 1. The look in one paragraph

Every site should feel like walking into a dark, expensive gallery at night. The page is a dark, physical space: black basalt stone, smoked glass, brushed metal and polished black floors with soft reflections. The thing being sold sits in a **lit niche or on a plinth, under a single spotlight**, like a perfume bottle in a boutique or a watch in a museum case. Each screen shows **one subject at a time**. Type is quiet and editorial, with a serif headline and one italic accent word. Motion is slow and smooth, like a camera dolly. Nothing is cartoonish, bubbly, techy or loud. If it would look at home on a template marketplace, it is wrong.

This comes from a reference the owner loved: a perfume brand site with five bottles in spotlit alcoves carved into dark stone above a reflective black floor. Hovering one bottle brightens its light and dims the rest, and its name fades in. Clicking it glides into a detail view: the bottle fills the right side in its lit niche, and the left side holds a small serif name, a few lines of notes, the price and one button. The phone version is just as polished, with the niches in a two-column grid. **Copy that feeling and those techniques, never that brand's images, words or code.**

---

## 2. Signature patterns (use them wherever they fit)

1. **The lit niche gallery.** Products, services or projects are displayed as objects in a row of recessed niches. These are built in Three.js, or in CSS with real texture images.
   - Each niche has a soft top spotlight (a visible cone of light, subtle volumetric haze), stone walls and a glossy floor with blurred reflections.
   - **Hover or focus:** that niche's light warms and brightens, the others dim to about 40%, and a small label fades in below it (name in serif, one line of detail in small caps).
   - **Click or Enter:** a smooth shared-element transition into the detail view.
   - **Phones:** a two-column grid of niches, each lit. Tapping one opens the detail view.
2. **The detail view.**
   - The object is large on one side, in its lit niche.
   - The other side is a dark, quiet column with:
     - a tiny breadcrumb in small caps;
     - the name in large serif with one italic syllable or word;
     - two to four short lines;
     - small key facts in a hairline-ruled list;
     - the price in tabular figures;
     - one primary button;
     - "Back to the collection" as an underlined text link.
3. **One hero object.** Every home page opens on one beautifully lit object, rendered in real-time 3D or as a high-quality still. It is the brand's own object, never a stock icon, mascot or cartoon.
4. **Cinematic chapters.** Full-screen scenes, one subject per screen, with a slow zoom (scale 1.00 to 1.10), a huge serif title and one caption line. Scrolling crossfades or wipes to the next scene.
5. **Statement tables.** Prices and comparisons are set like a private-bank statement or a wine list: hairline rules, tabular figures, generous spacing and small caps labels. Never three app-style tier cards.

---

## 3. Design tokens

**Base palette (every brand):**

| Token | Value | Use |
|---|---|---|
| `--void` | `#08090B` | Deepest backgrounds, cinematic bands |
| `--obsidian` | `#0D0E12` | Page background |
| `--basalt` | `#16171C` | Raised areas, stone tone |
| `--graphite` | `#1A1C23` | Panels |
| `--platinum` | `#E4E6ED` | Main text |
| `--silver` | `#8A8F9E` | Secondary text |
| `--hairline` | `rgba(228,230,237,.10)` | Rules and borders |

**Accent:** each brand has ONE accent (section 7), used for under 5% of any screen: small labels, key numbers, one primary button, thin engraving lines and warm light.

**Light:** spotlights are warm white (`#FFE9C7` to `#FFF6E5`). Rim lights are cool and faint (`#AFC3FF` at low intensity). Lighting does the work that colour usually does.

**Type:**
- **Display:** Cormorant Garamond (300 to 600). Very large, tight line-height (0.92 to 1.0), slightly negative tracking, and one italic accent word per headline (for example, "The *night* collection", "Premium sites for *local* businesses").
- **Text:** General Sans from Fontshare, free for commercial use under the ITF Free Font License (keep the licence file). Fallback: Switzer from Fontshare. 15 to 18px, line-height 1.6.
- **Labels:** the same sans, 11 to 12px, uppercase, letter-spacing 0.18em, silver.
- **Numbers:** tabular figures.
- Self-host every font as WOFF2 in the site's `fonts/` folder, subset to Latin, with `font-display: swap`.

**Shape:**
- Corners are sharp: 0 to 4px, buttons included.
- Separation comes from hairlines and tone.
- No drop shadows on UI.
- Real depth comes only from 3D light and photography.

**Spacing:** an 8px scale. Sections get `clamp(96px, 14vw, 200px)` of vertical space, varied so that not every section matches.

---

## 4. Motion

- **Libraries:** GSAP (with ScrollTrigger and SplitText), Lenis and Three.js. Vendor exact pinned versions into the site's `vendor/` folder (at least two weeks old, verified) and list them in `vendor/VERSIONS.md`. No runtime CDN.
- **Easing:** one house curve, `cubic-bezier(.16,1,.3,1)`. Durations of 0.6 to 1.2s, and slower (1.6 to 2.4s) for light changes and camera moves. Nothing bounces.
- **Reveals:**
  - Headlines rise line by line from behind a mask.
  - Images wipe in with `clip-path`, settling from scale 1.12 to 1.
  - A reveal must start the moment its element enters the viewport and finish within 0.9s. Content must never sit blank.
  - If JavaScript fails, everything stays visible.
- **Hover:** a calm change of light, colour or underline only. No lifting, tilting, glowing borders, wiggling arrows or magnetic buttons. No custom cursors.
- **Pages:** cross-document View Transitions (`@view-transition { navigation: auto; }`) with a soft dissolve.
- **Loading:**
  - A first-visit loader of 1.4s or less: black screen, a thin accent line drawing the brand mark, and a real progress count. Shown once per session.
  - Skeleton placeholders (graphite with a slow shimmer) for anything that loads late.
- **Reduced motion:** with `prefers-reduced-motion`, there is no smooth scroll, parallax, pinning or 3D animation. Show still renders, and content appears instantly.
- **Smooth scroll:** Lenis on desktop only. Touch devices keep native scrolling.

---

## 5. 3D and imagery rules

- **Real-time 3D:** Three.js with `MeshPhysicalMaterial` and an environment from `RoomEnvironment` (PMREM), or a CC0 HDRI.
  - **Spotlights:** `SpotLight` with soft penumbra, plus a faint cone mesh with additive blending for haze.
  - **Floor:** use a `Reflector` floor, blurred or roughened so it reads as polished stone, not a mirror.
  - **Materials:** brushed metal (fine anisotropic streaks), smoked glass (transmission with a low IOR tint) and basalt stone.
- **Textures and HDRIs:** use CC0 assets from Poly Haven (polyhaven.com) where the network allows. Keep the asset name and source in a `CREDITS.md`. If downloads are blocked, generate the textures procedurally: noise-based stone, and streaks for brushed metal.
- **Must look like a photograph of a real object.** Check renders at 1x and 2x and refine lighting and materials until they do. If it looks like a game asset or a cartoon, it is not finished.
- **Performance tiers:**
  - Load Three.js after first paint.
  - Cap the pixel ratio at 1.75 and pause rendering off screen.
  - Low-power devices and failed WebGL get a pre-rendered still (made with Playwright and saved as AVIF and WebP at 2x).
- **Photography:** dark, warm, low-key and moody, with one light source. Only use images the repo already has the right to use (from the demo folders or CC0 sources). Record the source of each in `CREDITS.md`. Never use people's faces from the web, and never use stock photos of people pointing at laptops.
- **No AI-generated people or fake product photos presented as real.**

---

## 6. Banned (the "looks vibecoded" list)

**Never use:**
- harsh gradients, rainbow colouring, neon colours, basic pastels, purple-and-black schemes, pure white page backgrounds
- drop shadows, glass or blur panels, glowing radial orbs, dot-grid backgrounds, particle spheres
- soft rounded corners everywhere, coloured left-stripe callouts
- Lucide, Heroicons or any generic icon set, sparkle icons, emoji (draw any needed icon as a custom thin-line SVG)
- three feature cards in a row, bento grids, terminal-window mockups, checkmark bullet lists, three pricing tier cards
- animated arrows, showy hover effects, custom cursors
- Inter, Geist or Space Grotesk
- spinners where a skeleton belongs
- **em dashes (—) in any copy**, and "It's not X, it's Y" sentences
- the words: elevate, unlock, unleash, seamless, cutting-edge, game-changer, empower, journey, delve, robust, leverage, supercharge, next-level, world-class, revolutionise, "In today's digital age", "look no further"

**Also never:**
- fake reviews or testimonials;
- fake client logos ("Trusted by");
- awards you haven't won;
- made-up statistics, results or view counts;
- countdowns or "only X left";
- team-size claims.

Every number must be a real commitment, a real price or a real measurement (with its date).

**Always include:** real Privacy and Terms pages, a real way to contact, and a real demo of the product (a reel, live preview or case study), not just claims.

**Copy voice:**
- Short sentences, concrete nouns and Australian spelling.
- One idea per section.
- Headlines of 2 to 6 words, with body text of 1 to 3 sentences.
- Specific and local, never generic marketing.

---

## 7. Brands in this repo

| Brand | Folder | Accent | Hero object | Notes |
|---|---|---|---|---|
| **KB Ventures** (parent company) | `kbventures-site/` | Champagne gold `#D4AF37` | A slim plaque of smoked glass and brushed metal with a fine engraved "KB" mark, standing upright on a basalt plinth under one spotlight | Its businesses are shown in a lit niche gallery: AceGuides (a printed guide on a stand, using the real covers) and Black Crest (the black metal card). "Many businesses. One standard." Brand only, no founder name or photo. |
| **Black Crest Web Designs** | `black-crest-site/` | Gold `#D4AF37` | A black brushed-titanium member's card with a gold-engraved fine-line crest | Concept sites are shown as lit niches, each holding a phone that displays that concept. Prices: One Page $300, Full Website $700, Care plan $30 a month, Custom by quote. "Premium sites for local businesses." |
| **AceGuides** | its pages in `kbventures-site/` | Deep ivory `#E8DFC8` with a thin gold line | The guides as printed books standing in lit niches, using the real covers as the book cover texture | Prices live in Stripe. Never change prices in the site without the owner. Keep "VCE® is a registered trademark of the VCAA." near anything that says VCE. |

**Client concept and demo sites** (`barber-demo`, `cafe-demo-v2`, `gym-demo`, `plumber-demo`, `salon-demo`, `parts-store-demo`, and any new ones):
- They belong to their (made-up or real) client's brand, so they keep the client's own colours and fonts.
- They still follow sections 4, 5 and 6, plus the "one subject at a time, beautifully lit" approach where it suits the business.
- Only change a demo when a task asks for it.

**The One Barber is a real shop.** Never show, link, screenshot or mention `the-one-barber-demo` on any other site.

**Keep the sites in sync.** Whenever you change one brand's site, also update everything that shows that brand somewhere else, in the same task:
- KB Ventures shows Black Crest and AceGuides in its business gallery. If a Black Crest or AceGuides logo, hero object, tagline, price, label (PREVIEW or AVAILABLE NOW) or screenshot changes, update the KB Ventures version to match.
- Black Crest shows screenshots of the concept demos. If a demo changes, re-take its screenshots and stills for the Black Crest alcoves, case study and showreel.
- Shared footer details (email, "A KB Ventures company", social links): keep them identical across every site.
- If you improve a house-style pattern on one site, note it in CLAUDE.md so the other sites can use it too, and tell the owner which sites could get the upgrade next.

Sync means facts, not sameness. Only matching information is copied between sites: names, logos, prices, labels, screenshots and footer details. Never copy one site's wording, headlines or look onto another. Each site keeps its own words, audience and feel. Design upgrades from one site are only suggested for the others, never applied without the owner saying yes.

---

## 8. Technical standards for every site

- **Stack:** static HTML, CSS and JS that works on GitHub Pages under `/3D-demo-sites/<folder>/`, with relative links only.
- **Code layout:**
  - One stylesheet per site, with sections in this order: tokens, base, layout, components, pages, motion, reduced motion.
  - Small JS modules.
  - One `config.js` holding every editable business value.
- **Images:** AVIF and WebP with fallbacks via `<picture>`, explicit width and height, lazy-loaded below the fold, and `fetchpriority="high"` on the hero only. No layout shift.
- **Accessibility:**
  - semantic landmarks and one `h1` per page;
  - a visible accent-coloured focus ring and a skip link;
  - alt text everywhere (`alt=""` on decorative images);
  - AA contrast;
  - full keyboard support for galleries, menus and sliders;
  - Escape closes overlays.
- **SEO:** a unique title, description, canonical, Open Graph image (rendered from the hero object) and JSON-LD where useful, plus a current `sitemap.xml` and `robots.txt`.
- **Privacy:** no cookies, tracking or analytics unless the owner asks. Never submit real forms while testing. Never print form keys.
- **Budgets for the home page:**
  - HTML plus CSS under about 120 KB.
  - JS under about 150 KB, not counting Three.js.
  - Lighthouse targets: desktop Performance 90+, mobile 80+, and Accessibility, Best Practices and SEO 95+. Report the real scores.

---

## 9. Before you say a task is finished

1. Use Playwright to screenshot every changed page at 390, 768, 1280 and 1920 px. Look at the screenshots and fix anything that looks off.
2. Check for zero console errors, zero broken links, no horizontal scroll and that reduced motion works.
3. Run an automatic check for banned items (section 6): em dashes, banned words, banned fonts, `backdrop-filter`, card shadows, border-radius over 6px, and icon libraries.
4. Commit with a clear message and push to `main`. Wait for GitHub Pages, then check the live page.
5. Tell the owner, in a few simple sentences:
   - what changed;
   - the real scores;
   - anything you couldn't do;
   - anything only he can do.
